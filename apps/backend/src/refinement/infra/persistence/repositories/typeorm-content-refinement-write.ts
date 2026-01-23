import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IContentRefinementWriteRepository } from '@refinement/domain/interfaces/repositories/content-refinement-write';
import { ContentRefinement } from '@refinement/domain/aggregates/content-refinement';
import { ContentRefinementEntity, ChunkEntity } from '../entities';

/**
 * TypeORM implementation of IContentRefinementWriteRepository
 *
 * Persists ContentRefinement aggregates to PostgreSQL database.
 *
 * Responsibilities:
 * - Save ContentRefinement aggregates
 * - Map domain aggregates to database entities
 * - Handle optimistic locking with version field
 * - Manage cascade operations for chunks
 *
 * @implements {IContentRefinementWriteRepository}
 */
@Injectable()
export class TypeOrmContentRefinementWriteRepository implements IContentRefinementWriteRepository {
  private readonly logger = new Logger(
    TypeOrmContentRefinementWriteRepository.name,
  );

  constructor(
    @InjectRepository(ContentRefinementEntity)
    private readonly refinementRepository: Repository<ContentRefinementEntity>,
  ) {}

  /**
   * Save a ContentRefinement aggregate
   *
   * Handles optimistic locking by checking version field.
   * Cascades save to all chunks.
   *
   * @param refinement - ContentRefinement aggregate to save
   * @throws Error if optimistic locking fails
   */
  async save(refinement: ContentRefinement): Promise<void> {
    this.logger.debug(`Saving refinement: ${refinement.id}`);

    try {
      // Map aggregate to entity
      const entity = this.toEntity(refinement);

      // Save with optimistic locking
      await this.refinementRepository.save(entity);

      this.logger.debug(`Refinement saved successfully: ${refinement.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to save refinement ${refinement.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Delete a ContentRefinement aggregate
   *
   * @param id - ID of the refinement to delete
   */
  async delete(id: string): Promise<void> {
    this.logger.debug(`Deleting refinement: ${id}`);

    try {
      await this.refinementRepository.delete({ id });
      this.logger.debug(`Refinement deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete refinement ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Map ContentRefinement aggregate to database entity
   *
   * @param refinement - Domain aggregate
   * @returns Database entity
   */
  private toEntity(refinement: ContentRefinement): ContentRefinementEntity {
    const entity = new ContentRefinementEntity();

    entity.id = refinement.id;
    entity.contentItemId = refinement.contentItemId;
    entity.status = refinement.status.value;
    entity.version = refinement.version.value;

    // Map completedAt to refinedAt (entity only has refinedAt)
    entity.refinedAt = refinement.completedAt;

    // Map error if present
    if (refinement.error) {
      entity.error = {
        code: refinement.error.code,
        message: refinement.error.message,
        details: refinement.error.stackTrace
          ? { stackTrace: refinement.error.stackTrace }
          : undefined,
      };
    } else {
      entity.error = null;
    }

    // Config is not stored in aggregate, set to null
    entity.config = null;

    // Map chunks
    entity.chunks = refinement.chunks.map((chunk) => {
      const chunkEntity = new ChunkEntity();

      chunkEntity.id = chunk.id;
      chunkEntity.refinementId = refinement.id;
      chunkEntity.content = chunk.content;
      chunkEntity.position = chunk.position.index; // Entity expects number, not object
      chunkEntity.hash = chunk.hash.value;
      chunkEntity.qualityScore = chunk.qualityScore?.overall ?? null;

      // Map entities - entity schema expects different property names
      if (chunk.entities && chunk.entities.length > 0) {
        chunkEntity.entities = chunk.entities.map((cryptoEntity) => ({
          symbol: cryptoEntity.value, // Map value to symbol
          name: undefined, // Name not available in domain model
          type: cryptoEntity.type, // CryptoEntityType enum value
          confidence: cryptoEntity.confidence,
        }));
      } else {
        chunkEntity.entities = null;
      }

      // Map temporal context - entity schema expects different property names
      if (chunk.temporalContext) {
        chunkEntity.temporalContext = {
          referenceDate: chunk.temporalContext.publishedAt.toISOString(),
          timeframe: chunk.temporalContext.isPredictive
            ? 'future'
            : chunk.temporalContext.isHistorical
              ? 'past'
              : 'present',
          confidence: 1.0, // Default confidence since not in domain model
        };
      } else {
        chunkEntity.temporalContext = null;
      }

      return chunkEntity;
    });

    return entity;
  }
}
