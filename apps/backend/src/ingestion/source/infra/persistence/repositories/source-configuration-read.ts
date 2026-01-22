import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetSourceByIdResponse } from '@/ingestion/source/app/queries/get-source-by-id/response';
import { ISourceConfigurationReadRepository } from '@/ingestion/source/app/queries/repositories/source-configuration-read';
import { SourceConfigurationEntity } from '../entities/source-configuration';

/**
 * TypeORM SourceConfigurationReadRepository Implementation
 *
 * Implements read operations for querying source configurations using TypeORM and PostgreSQL.
 * Returns Response types directly - no intermediate ReadModel types.
 *
 * Architecture: Repositories return query-specific Response types.
 * Query handlers return repository results without mapping.
 *
 * Requirements: 5.2
 */
@Injectable()
export class TypeOrmSourceConfigurationReadRepository implements ISourceConfigurationReadRepository {
  constructor(
    @InjectRepository(SourceConfigurationEntity)
    private readonly repository: Repository<SourceConfigurationEntity>,
  ) {}

  async findById(sourceId: string): Promise<GetSourceByIdResponse | null> {
    const entity = await this.repository.findOne({ where: { sourceId } });
    return entity ? this.toResponse(entity) : null;
  }

  async findActive(): Promise<GetSourceByIdResponse[]> {
    const entities = await this.repository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async findByType(type: string): Promise<GetSourceByIdResponse[]> {
    const entities = await this.repository.find({
      where: { sourceType: type },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async findUnhealthy(threshold: number): Promise<GetSourceByIdResponse[]> {
    // Get all sources with consecutive failures >= threshold
    const sources = await this.repository.find({
      where: {
        consecutiveFailures: threshold,
      },
    });

    return sources.map((source) => this.toResponse(source));
  }

  private toResponse(entity: SourceConfigurationEntity): GetSourceByIdResponse {
    return {
      sourceId: entity.sourceId,
      name: entity.name,
      sourceType: entity.sourceType,
      isActive: entity.isActive,
      config: entity.config,
      credentials: entity.credentials,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      healthMetrics: {
        successRate: entity.successRate,
        consecutiveFailures: entity.consecutiveFailures,
        totalJobs: entity.totalJobs || 0,
        lastSuccessAt: entity.lastSuccessAt,
        lastFailureAt: entity.lastFailureAt,
      },
      version: entity.version,
    };
  }
}
