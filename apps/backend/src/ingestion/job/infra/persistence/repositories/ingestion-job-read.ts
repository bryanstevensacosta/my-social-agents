import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import type { GetJobByIdResponse } from '@/ingestion/job/app/queries/get-job-by-id/response';
import type { GetJobsByStatusResponse } from '@/ingestion/job/app/queries/get-jobs-by-status/response';
import type { GetJobHistoryResponse } from '@/ingestion/job/app/queries/get-job-history/response';
import type { IIngestionJobReadRepository } from '@/ingestion/job/app/queries/repositories/ingestion-job-read';

import { IngestionJobEntity } from '../entities/ingestion-job';

/**
 * TypeORM IngestionJobReadRepository Implementation
 *
 * Implements read operations for querying ingestion jobs using TypeORM and PostgreSQL.
 * Returns Response types directly - no intermediate ReadModel types.
 *
 * Architecture: Repositories return query-specific Response types.
 * Query handlers return repository results without mapping.
 *
 * Requirements: 4.2, 4.3
 */
@Injectable()
export class TypeOrmIngestionJobReadRepository implements IIngestionJobReadRepository {
  constructor(
    @InjectRepository(IngestionJobEntity)
    private readonly repository: Repository<IngestionJobEntity>,
  ) {}

  async findById(jobId: string): Promise<GetJobByIdResponse | null> {
    const entity = await this.repository.findOne({ where: { jobId } });
    return entity ? this.toJobByIdResponse(entity) : null;
  }

  async findByStatus(
    status: string,
    limit?: number,
    offset?: number,
  ): Promise<GetJobsByStatusResponse> {
    const queryBuilder = this.repository
      .createQueryBuilder('job')
      .where('job.status = :status', { status })
      .orderBy('job.scheduledAt', 'DESC');

    if (limit !== undefined) {
      queryBuilder.take(limit);
    }

    if (offset !== undefined) {
      queryBuilder.skip(offset);
    }

    const [entities, total] = await queryBuilder.getManyAndCount();

    return {
      jobs: entities.map((e) => this.toJobByStatusItem(e)),
      total,
    };
  }

  async countByStatus(status: string): Promise<number> {
    return this.repository
      .createQueryBuilder('job')
      .where('job.status = :status', { status })
      .getCount();
  }

  async findBySourceId(
    sourceId: string,
    limit?: number,
  ): Promise<GetJobHistoryResponse> {
    const queryBuilder = this.repository
      .createQueryBuilder('job')
      .where('job.sourceId = :sourceId', { sourceId })
      .orderBy('job.executedAt', 'DESC');

    if (limit !== undefined) {
      queryBuilder.take(limit);
    }

    const entities = await queryBuilder.getMany();

    return {
      jobs: entities.map((e) => this.toJobHistoryItem(e)),
      total: entities.length,
    };
  }

  async findScheduledJobs(before: Date): Promise<GetJobByIdResponse[]> {
    const entities = await this.repository
      .createQueryBuilder('job')
      .where('job.status = :status', { status: 'PENDING' })
      .andWhere('job.scheduledAt <= :before', { before })
      .getMany();

    return entities.map((e) => this.toJobByIdResponse(e));
  }

  private toJobByIdResponse(entity: IngestionJobEntity): GetJobByIdResponse {
    const bytesProcessed =
      typeof entity.bytesProcessed === 'string'
        ? parseInt(entity.bytesProcessed, 10)
        : entity.bytesProcessed;

    return {
      jobId: entity.jobId,
      sourceId: entity.sourceId,
      status: entity.status,
      scheduledAt: entity.scheduledAt,
      executedAt: entity.executedAt,
      completedAt: entity.completedAt,

      // Nested metrics object
      metrics: {
        itemsCollected: entity.itemsCollected,
        duplicatesDetected: entity.duplicatesDetected,
        errorsEncountered: entity.errorsEncountered,
        bytesProcessed,
        durationMs: entity.durationMs,
      },

      // Flat properties for backward compatibility
      itemsCollected: entity.itemsCollected,
      duplicatesDetected: entity.duplicatesDetected,
      errorsEncountered: entity.errorsEncountered,
      bytesProcessed,
      durationMs: entity.durationMs,

      errors: entity.errors,
      sourceConfig: entity.sourceConfig,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toJobByStatusItem(entity: IngestionJobEntity) {
    return {
      jobId: entity.jobId,
      sourceId: entity.sourceId,
      status: entity.status,
      scheduledAt: entity.scheduledAt,
      executedAt: entity.executedAt,
      completedAt: entity.completedAt,
      itemsCollected: entity.itemsCollected,
      duplicatesDetected: entity.duplicatesDetected,
      errorsEncountered: entity.errorsEncountered,
      bytesProcessed:
        typeof entity.bytesProcessed === 'string'
          ? parseInt(entity.bytesProcessed, 10)
          : entity.bytesProcessed,
      durationMs: entity.durationMs,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toJobHistoryItem(entity: IngestionJobEntity) {
    return {
      jobId: entity.jobId,
      sourceId: entity.sourceId,
      status: entity.status,
      scheduledAt: entity.scheduledAt,
      executedAt: entity.executedAt,
      completedAt: entity.completedAt,
      itemsCollected: entity.itemsCollected,
      duplicatesDetected: entity.duplicatesDetected,
      errorsEncountered: entity.errorsEncountered,
      bytesProcessed:
        typeof entity.bytesProcessed === 'string'
          ? parseInt(entity.bytesProcessed, 10)
          : entity.bytesProcessed,
      durationMs: entity.durationMs,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
