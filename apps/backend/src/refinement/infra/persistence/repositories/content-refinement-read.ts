import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IContentRefinementReadRepository } from '@refinement/app/queries/repositories/content-refinement-read';
import {
  GetContentRefinementResult,
  RefinedChunkResult,
  ChunkMetadataResult,
  CryptoEntityResult,
  TemporalContextResult,
  RefinementMetadataResult,
  RefinementErrorResult,
} from '@refinement/app/queries/get-content-refinement/result';
import {
  GetChunksByContentResult,
  ChunkResult,
} from '@refinement/app/queries/get-chunks-by-content/result';
import { ContentRefinementEntity, ChunkEntity } from '../entities';

/**
 * TypeORM implementation of IContentRefinementReadRepository
 *
 * Provides optimized read operations for refinement queries.
 *
 * Responsibilities:
 * - Query refinements by various criteria
 * - Map database entities to Result objects
 * - Optimize queries with proper joins and indexes
 *
 * @implements {IContentRefinementReadRepository}
 */
@Injectable()
export class ContentRefinementReadRepository implements IContentRefinementReadRepository {
  private readonly logger = new Logger(ContentRefinementReadRepository.name);

  constructor(
    @InjectRepository(ContentRefinementEntity)
    private readonly refinementRepository: Repository<ContentRefinementEntity>,
  ) {}

  /**
   * Find a refinement by its ID
   *
   * @param refinementId - Unique identifier for the refinement
   * @returns Refinement result or null if not found
   */
  async findById(
    refinementId: string,
  ): Promise<GetContentRefinementResult | null> {
    this.logger.debug(`Finding refinement by ID: ${refinementId}`);

    try {
      const entity = await this.refinementRepository.findOne({
        where: { id: refinementId },
        relations: ['chunks'],
      });

      if (!entity) {
        this.logger.debug(`Refinement not found: ${refinementId}`);
        return null;
      }

      return this.toGetContentRefinementResult(entity);
    } catch (error) {
      this.logger.error(
        `Error finding refinement ${refinementId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Find refinements by content item ID
   *
   * @param contentItemId - ID of the source content item
   * @returns Array of refinement results (may be empty)
   */
  async findByContentItemId(
    contentItemId: string,
  ): Promise<GetContentRefinementResult[]> {
    this.logger.debug(
      `Finding refinements by content item ID: ${contentItemId}`,
    );

    try {
      const entities = await this.refinementRepository.find({
        where: { contentItemId },
        relations: ['chunks'],
        order: { createdAt: 'DESC' },
      });

      return entities.map((entity) =>
        this.toGetContentRefinementResult(entity),
      );
    } catch (error) {
      this.logger.error(
        `Error finding refinements for content ${contentItemId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Find refinements by status
   *
   * @param status - Refinement status to filter by
   * @returns Array of refinement results (may be empty)
   */
  async findByStatus(
    status: 'pending' | 'processing' | 'completed' | 'failed',
  ): Promise<GetContentRefinementResult[]> {
    this.logger.debug(`Finding refinements by status: ${status}`);

    try {
      const entities = await this.refinementRepository.find({
        where: { status },
        relations: ['chunks'],
        order: { createdAt: 'DESC' },
      });

      return entities.map((entity) =>
        this.toGetContentRefinementResult(entity),
      );
    } catch (error) {
      this.logger.error(
        `Error finding refinements by status ${status}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Find all chunks for a specific content item
   *
   * @param contentItemId - ID of the source content item
   * @returns Chunks result or null if no refinement exists
   */
  async findChunksByContentItemId(
    contentItemId: string,
  ): Promise<GetChunksByContentResult | null> {
    this.logger.debug(`Finding chunks by content item ID: ${contentItemId}`);

    try {
      // Find the most recent completed refinement for this content
      const entity = await this.refinementRepository.findOne({
        where: { contentItemId, status: 'completed' },
        relations: ['chunks'],
        order: { createdAt: 'DESC' },
      });

      if (!entity) {
        this.logger.debug(
          `No completed refinement found for content: ${contentItemId}`,
        );
        return null;
      }

      return this.toGetChunksByContentResult(entity);
    } catch (error) {
      this.logger.error(
        `Error finding chunks for content ${contentItemId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Map entity to GetContentRefinementResult
   */
  private toGetContentRefinementResult(
    entity: ContentRefinementEntity,
  ): GetContentRefinementResult {
    const chunks: RefinedChunkResult[] = entity.chunks
      .sort((a, b) => a.position - b.position)
      .map((chunk) => this.toRefinedChunkResult(chunk));

    const metadata: RefinementMetadataResult = {
      totalChunks: chunks.length,
      averageQualityScore: this.calculateAverageQualityScore(chunks),
      processingTimeMs: this.calculateProcessingTime(entity),
      extractedEntities: this.extractUniqueEntities(chunks),
    };

    const error: RefinementErrorResult | null = entity.error
      ? {
          code: entity.error.code,
          message: entity.error.message,
          details: entity.error.details,
        }
      : null;

    return {
      refinementId: entity.id,
      contentItemId: entity.contentItemId,
      status: entity.status as
        | 'pending'
        | 'processing'
        | 'completed'
        | 'failed',
      chunks,
      metadata,
      createdAt: entity.createdAt,
      refinedAt: entity.refinedAt,
      error,
    };
  }

  /**
   * Map entity to GetChunksByContentResult
   */
  private toGetChunksByContentResult(
    entity: ContentRefinementEntity,
  ): GetChunksByContentResult {
    const chunks: ChunkResult[] = entity.chunks
      .sort((a, b) => a.position - b.position)
      .map((chunk) => this.toChunkResult(chunk));

    const averageQualityScore = this.calculateAverageQualityScore(
      chunks.map(
        (c) => ({ metadata: { qualityScore: c.metadata.qualityScore } }) as any,
      ),
    );

    return {
      contentItemId: entity.contentItemId,
      refinementId: entity.id,
      chunks,
      totalChunks: chunks.length,
      averageQualityScore,
    };
  }

  /**
   * Map ChunkEntity to RefinedChunkResult
   */
  private toRefinedChunkResult(chunk: ChunkEntity): RefinedChunkResult {
    const entities: CryptoEntityResult[] = chunk.entities
      ? chunk.entities.map((e) => ({
          symbol: e.symbol,
          name: e.name,
          type: e.type as
            | 'coin'
            | 'token'
            | 'protocol'
            | 'exchange'
            | 'person'
            | 'organization',
          confidence: e.confidence,
        }))
      : [];

    const temporalContext: TemporalContextResult | undefined =
      chunk.temporalContext
        ? {
            referenceDate: new Date(chunk.temporalContext.referenceDate),
            timeframe: chunk.temporalContext.timeframe as
              | 'past'
              | 'present'
              | 'future',
            confidence: chunk.temporalContext.confidence,
          }
        : undefined;

    const metadata: ChunkMetadataResult = {
      entities,
      qualityScore: chunk.qualityScore ?? 0,
      temporalContext,
    };

    return {
      chunkId: chunk.id,
      content: chunk.content,
      position: chunk.position,
      metadata,
    };
  }

  /**
   * Map ChunkEntity to ChunkResult
   */
  private toChunkResult(chunk: ChunkEntity): ChunkResult {
    const entities: CryptoEntityResult[] = chunk.entities
      ? chunk.entities.map((e) => ({
          symbol: e.symbol,
          name: e.name,
          type: e.type as
            | 'coin'
            | 'token'
            | 'protocol'
            | 'exchange'
            | 'person'
            | 'organization',
          confidence: e.confidence,
        }))
      : [];

    const temporalContext: TemporalContextResult | undefined =
      chunk.temporalContext
        ? {
            referenceDate: new Date(chunk.temporalContext.referenceDate),
            timeframe: chunk.temporalContext.timeframe as
              | 'past'
              | 'present'
              | 'future',
            confidence: chunk.temporalContext.confidence,
          }
        : undefined;

    const metadata: ChunkMetadataResult = {
      entities,
      qualityScore: chunk.qualityScore ?? 0,
      temporalContext,
    };

    return {
      chunkId: chunk.id,
      content: chunk.content,
      position: chunk.position,
      hash: chunk.hash,
      metadata,
    };
  }

  /**
   * Calculate average quality score from chunks
   */
  private calculateAverageQualityScore(
    chunks: { metadata: { qualityScore: number } }[],
  ): number {
    if (chunks.length === 0) return 0;

    const sum = chunks.reduce(
      (acc, chunk) => acc + chunk.metadata.qualityScore,
      0,
    );
    return Math.round((sum / chunks.length) * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate processing time in milliseconds
   */
  private calculateProcessingTime(entity: ContentRefinementEntity): number {
    if (!entity.refinedAt) return 0;

    const start = entity.createdAt.getTime();
    const end = entity.refinedAt.getTime();
    return end - start;
  }

  /**
   * Extract unique entities from all chunks
   */
  private extractUniqueEntities(
    chunks: RefinedChunkResult[],
  ): CryptoEntityResult[] {
    const entityMap = new Map<string, CryptoEntityResult>();

    chunks.forEach((chunk) => {
      chunk.metadata.entities.forEach((entity) => {
        const existing = entityMap.get(entity.symbol);
        if (!existing || entity.confidence > existing.confidence) {
          entityMap.set(entity.symbol, entity);
        }
      });
    });

    return Array.from(entityMap.values()).sort(
      (a, b) => b.confidence - a.confidence,
    );
  }
}
