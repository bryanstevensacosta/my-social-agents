import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IContentRefinementFactory } from '@refinement/app/interfaces/factories/content-refinement-factory';
import { ContentRefinement } from '@refinement/domain/aggregates/content-refinement';
import { Chunk } from '@refinement/domain/entities/chunk';
import { ChunkHash } from '@refinement/domain/value-objects/chunk-hash';
import { ChunkPosition } from '@refinement/domain/value-objects/chunk-position';
import { CryptoEntity } from '@refinement/domain/value-objects/crypto-entity';
import { CryptoEntityType } from '@refinement/domain/value-objects/crypto-entity-type';
import { QualityScore } from '@refinement/domain/value-objects/quality-score';
import { TemporalContext } from '@refinement/domain/value-objects/temporal-context';
import { RefinementStatus } from '@refinement/domain/value-objects/refinement-status';
import { RefinementError } from '@refinement/domain/value-objects/refinement-error';
import { ContentRefinementEntity, ChunkEntity } from '../entities';

/**
 * TypeORM implementation of IContentRefinementFactory
 *
 * Reconstitutes ContentRefinement aggregates from database entities.
 *
 * Responsibilities:
 * - Load refinement data from database
 * - Map database entities to domain aggregates
 * - Reconstitute all value objects and entities
 * - Restore aggregate state with proper version
 *
 * @implements {IContentRefinementFactory}
 */
@Injectable()
export class TypeOrmContentRefinementFactory implements IContentRefinementFactory {
  private readonly logger = new Logger(TypeOrmContentRefinementFactory.name);

  constructor(
    @InjectRepository(ContentRefinementEntity)
    private readonly refinementRepository: Repository<ContentRefinementEntity>,
  ) {}

  /**
   * Load a ContentRefinement aggregate by ID
   *
   * @param refinementId - Unique identifier for the refinement
   * @returns Reconstituted aggregate or null if not found
   */
  async load(refinementId: string): Promise<ContentRefinement | null> {
    this.logger.debug(`Loading refinement: ${refinementId}`);

    try {
      const entity = await this.refinementRepository.findOne({
        where: { id: refinementId },
        relations: ['chunks'],
      });

      if (!entity) {
        this.logger.debug(`Refinement not found: ${refinementId}`);
        return null;
      }

      return this.toDomain(entity);
    } catch (error) {
      this.logger.error(
        `Error loading refinement ${refinementId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Map database entity to domain aggregate
   *
   * @param entity - Database entity
   * @returns Reconstituted domain aggregate
   */
  private toDomain(entity: ContentRefinementEntity): ContentRefinement {
    // Reconstitute chunks
    const chunks = entity.chunks
      .sort((a, b) => a.position - b.position)
      .map((chunkEntity) => this.chunkToDomain(chunkEntity));

    // Reconstitute status using factory method based on string value
    let status: RefinementStatus;
    switch (entity.status) {
      case 'pending':
        status = RefinementStatus.pending();
        break;
      case 'processing':
        status = RefinementStatus.processing();
        break;
      case 'completed':
        status = RefinementStatus.completed();
        break;
      case 'failed':
        status = RefinementStatus.failed();
        break;
      case 'rejected':
        status = RefinementStatus.rejected();
        break;
      default:
        throw new Error(`Unknown refinement status: ${entity.status}`);
    }

    // Reconstitute error if present
    const error = entity.error
      ? RefinementError.create(
          entity.error.message,
          entity.error.code,
          undefined,
          undefined,
        )
      : null;

    // Reconstitute aggregate using static factory method with 3 args
    return ContentRefinement.reconstitute(entity.id, entity.version, {
      contentItemId: entity.contentItemId,
      chunks,
      status,
      error,
      startedAt: entity.createdAt, // Map createdAt to startedAt
      completedAt: entity.refinedAt,
      rejectedAt: null, // Not stored in entity
      rejectionReason: null, // Not stored in entity
    });
  }

  /**
   * Map chunk entity to domain entity
   *
   * @param entity - Chunk database entity
   * @returns Reconstituted chunk domain entity
   */
  private chunkToDomain(entity: ChunkEntity): Chunk {
    // Reconstitute value objects
    const hash = ChunkHash.create(entity.hash);

    // ChunkPosition.create() takes 3 args: index, startOffset, endOffset
    // Database only stores position (index), so we use 0 for offsets
    const position = ChunkPosition.create(
      entity.position,
      0,
      entity.content.length,
    );

    // Reconstitute crypto entities
    const entities = entity.entities
      ? entity.entities.map((e) => {
          // Map entity type string to CryptoEntityType enum
          let entityType: CryptoEntityType;
          switch (e.type.toUpperCase()) {
            case 'TOKEN':
              entityType = CryptoEntityType.TOKEN;
              break;
            case 'EXCHANGE':
              entityType = CryptoEntityType.EXCHANGE;
              break;
            case 'BLOCKCHAIN':
              entityType = CryptoEntityType.BLOCKCHAIN;
              break;
            case 'PROTOCOL':
              entityType = CryptoEntityType.PROTOCOL;
              break;
            case 'EVENT':
              entityType = CryptoEntityType.ONCHAIN_EVENT;
              break;
            default:
              entityType = CryptoEntityType.TOKEN; // Default fallback
          }

          // CryptoEntity.create() takes 5 args: type, value, confidence, startPos, endPos
          return CryptoEntity.create(entityType, e.symbol, e.confidence, 0, 0);
        })
      : [];

    // Reconstitute quality score
    // QualityScore.create() takes 5 args: overall, lengthScore, coherenceScore, relevanceScore, freshnessScore
    // Database only stores overall score, so we use it for all components
    const qualityScore = entity.qualityScore
      ? QualityScore.create(
          entity.qualityScore,
          entity.qualityScore,
          entity.qualityScore,
          entity.qualityScore,
          entity.qualityScore,
        )
      : QualityScore.create(0, 0, 0, 0, 0);

    // Reconstitute temporal context
    // TemporalContext.create() takes 1-2 args: publishedAt, eventTimestamp?
    const temporalContext = entity.temporalContext
      ? TemporalContext.create(new Date(entity.temporalContext.referenceDate))
      : null;

    // Reconstitute chunk using static factory method with props object
    return Chunk.reconstitute({
      id: entity.id,
      contentId: entity.refinementId, // Use refinementId as contentId
      content: entity.content,
      position,
      hash,
      entities,
      temporalContext,
      qualityScore,
      previousChunkId: null, // Not stored in entity
      nextChunkId: null, // Not stored in entity
    });
  }
}
