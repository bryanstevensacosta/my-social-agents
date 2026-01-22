/**
 * In-Memory Repository Implementations for Fast Testing
 *
 * These implementations provide fast, in-memory alternatives to TypeORM repositories
 * for use in property-based tests and other scenarios where database speed is critical.
 */

import { IngestionJob } from '@/ingestion/job/domain/aggregates/ingestion-job';
import { IIngestionJobWriteRepository } from '@/ingestion/job/domain/interfaces/repositories/ingestion-job-write';
import { IIngestionJobReadRepository } from '@/ingestion/job/app/queries/repositories/ingestion-job-read';
import { GetJobByIdResponse } from '@/ingestion/job/app/queries/get-job-by-id/response';
import { GetJobsByStatusResponse } from '@/ingestion/job/app/queries/get-jobs-by-status/response';
import { GetJobHistoryResponse } from '@/ingestion/job/app/queries/get-job-history/response';
import { IIngestionJobFactory } from '@/ingestion/job/domain/interfaces/factories/ingestion-job-factory';
import { SourceConfiguration } from '@/ingestion/source/domain/aggregates/source-configuration';
import { ISourceConfigurationWriteRepository } from '@/ingestion/source/domain/interfaces/repositories/source-configuration-write';
import { ISourceConfigurationReadRepository } from '@/ingestion/source/app/queries/repositories/source-configuration-read';
import { GetSourceByIdResponse } from '@/ingestion/source/app/queries/get-source-by-id/response';
import { ISourceConfigurationFactory } from '@/ingestion/source/domain/interfaces/factories/source-configuration-factory';
import { SourceType } from '@/ingestion/source/domain/value-objects/source-type';
import { ContentItem } from '@/ingestion/content/domain/aggregates/content-item';
import { IContentItemWriteRepository } from '@/ingestion/content/domain/interfaces/repositories/content-item-write';
import { IngestionStatus } from '@/ingestion/job/domain/value-objects/ingestion-status';
import { JobMetrics } from '@/ingestion/job/domain/value-objects/job-metrics';
import { ErrorRecord } from '@/ingestion/job/domain/entities/error-record';

interface StoredJob {
  jobId: string;
  sourceConfig: SourceConfiguration;
  status: IngestionStatus;
  scheduledAt: Date;
  executedAt: Date | null;
  completedAt: Date | null;
  metrics: JobMetrics;
  errors: ErrorRecord[];
  version: number;
}

interface StoredSource {
  sourceId: string;
  sourceType: SourceType;
  name: string;
  config: Record<string, unknown>;
  credentials?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  consecutiveFailures: number;
  successRate: number;
  totalJobs: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  version: number;
}

interface StoredContent {
  contentId: string;
  sourceId: string;
  contentHash: string;
  rawContent: string;
  normalizedContent: string;
  metadata: unknown;
  assetTags: unknown[];
  collectedAt: Date;
  version: number;
}

/**
 * In-Memory Job Write Repository
 */
export class InMemoryJobWriteRepository implements IIngestionJobWriteRepository {
  private jobs = new Map<string, StoredJob>();

  save(job: IngestionJob): Promise<void> {
    const data = job.toObject();
    this.jobs.set(data.jobId, {
      jobId: data.jobId,
      sourceConfig: data.sourceConfig,
      status: data.status,
      scheduledAt: data.scheduledAt,
      executedAt: data.executedAt,
      completedAt: data.completedAt,
      metrics: data.metrics,
      errors: data.errors,
      version: data.version,
    });
    return Promise.resolve();
  }

  clear(): void {
    this.jobs.clear();
  }

  getAll(): StoredJob[] {
    return Array.from(this.jobs.values());
  }
}

/**
 * In-Memory Content Write Repository
 */
export class InMemoryContentWriteRepository implements IContentItemWriteRepository {
  private items = new Map<string, StoredContent>();

  save(item: ContentItem): Promise<void> {
    const data = item.toObject();
    this.items.set(data.contentId, {
      contentId: data.contentId,
      sourceId: data.sourceId,
      contentHash: data.contentHash.toString(),
      rawContent: data.rawContent,
      normalizedContent: data.normalizedContent,
      metadata: data.metadata.toObject(),
      assetTags: data.assetTags.map((tag) => tag.toObject()),
      collectedAt: data.collectedAt,
      version: data.version,
    });
    return Promise.resolve();
  }

  clear(): void {
    this.items.clear();
  }

  getAll(): StoredContent[] {
    return Array.from(this.items.values());
  }
}

/**
 * In-Memory Source Write Repository
 */
export class InMemorySourceWriteRepository implements ISourceConfigurationWriteRepository {
  private sources = new Map<string, StoredSource>();

  save(source: SourceConfiguration): Promise<void> {
    const data = source.toObject();
    this.sources.set(data.sourceId, {
      sourceId: data.sourceId,
      sourceType: data.sourceType,
      name: data.name,
      config: data.config,
      credentials: data.credentials,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      consecutiveFailures: data.consecutiveFailures,
      successRate: data.successRate,
      totalJobs: data.totalJobs,
      lastSuccessAt: data.lastSuccessAt,
      lastFailureAt: data.lastFailureAt,
      version: data.version,
    });
    return Promise.resolve();
  }

  delete(sourceId: string): Promise<void> {
    const source = this.sources.get(sourceId);
    if (source) {
      source.isActive = false;
    }
    return Promise.resolve();
  }

  clear(): void {
    this.sources.clear();
  }

  getAll(): StoredSource[] {
    return Array.from(this.sources.values());
  }
}

/**
 * In-Memory Job Read Repository
 */
export class InMemoryJobReadRepository implements IIngestionJobReadRepository {
  constructor(private writeRepo: InMemoryJobWriteRepository) {}

  private toResponse(job: StoredJob): GetJobByIdResponse {
    return {
      jobId: job.jobId,
      sourceId: job.sourceConfig.sourceId,
      status: job.status.toString(),
      scheduledAt: job.scheduledAt,
      executedAt: job.executedAt,
      completedAt: job.completedAt,
      // Flat properties for backward compatibility
      itemsCollected: job.metrics.itemsCollected,
      duplicatesDetected: job.metrics.duplicatesDetected,
      errorsEncountered: job.metrics.errorsEncountered,
      bytesProcessed: job.metrics.bytesProcessed,
      durationMs: job.metrics.durationMs,
      // Nested metrics object
      metrics: {
        itemsCollected: job.metrics.itemsCollected,
        duplicatesDetected: job.metrics.duplicatesDetected,
        errorsEncountered: job.metrics.errorsEncountered,
        bytesProcessed: job.metrics.bytesProcessed,
        durationMs: job.metrics.durationMs,
      },
      errors: job.errors.map((e) => ({
        errorId: e.errorId,
        timestamp: e.timestamp,
        errorType: e.errorType.toString(),
        message: e.message,
        stackTrace: e.stackTrace ?? null,
        retryCount: e.retryCount,
      })),
      sourceConfig: {
        sourceId: job.sourceConfig.sourceId,
        sourceType: job.sourceConfig.sourceType.toString(),
        name: job.sourceConfig.name,
        config: job.sourceConfig.config,
        isActive: job.sourceConfig.isActive,
        createdAt: job.sourceConfig.createdAt,
        updatedAt: job.sourceConfig.updatedAt,
      },
      version: job.version,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  findById(jobId: string): Promise<GetJobByIdResponse | null> {
    const jobs = this.writeRepo.getAll();
    const job = jobs.find((j) => j.jobId === jobId);

    if (!job) return Promise.resolve(null);

    return Promise.resolve(this.toResponse(job));
  }

  findByStatus(
    status: string,
    limit?: number,
    offset?: number,
  ): Promise<GetJobsByStatusResponse> {
    const jobs = this.writeRepo.getAll();
    const filtered = jobs.filter((j) => j.status.toString() === status);

    const start = offset || 0;
    const end = limit ? start + limit : filtered.length;
    const paginated = filtered.slice(start, end);

    return Promise.resolve({
      jobs: paginated.map((job) => this.toResponse(job)),
      total: filtered.length,
    });
  }

  countByStatus(status: string): Promise<number> {
    const jobs = this.writeRepo.getAll();
    return Promise.resolve(
      jobs.filter((j) => j.status.toString() === status).length,
    );
  }

  findBySourceId(
    sourceId: string,
    limit?: number,
  ): Promise<GetJobHistoryResponse> {
    const jobs = this.writeRepo.getAll();
    const filtered = jobs.filter((j) => j.sourceConfig.sourceId === sourceId);

    const paginated = limit ? filtered.slice(0, limit) : filtered;

    return Promise.resolve({
      jobs: paginated.map((job) => this.toResponse(job)),
      total: filtered.length,
    });
  }

  findScheduledJobs(before: Date): Promise<GetJobByIdResponse[]> {
    const jobs = this.writeRepo.getAll();
    return Promise.resolve(
      jobs
        .filter(
          (j) => j.status.toString() === 'PENDING' && j.scheduledAt <= before,
        )
        .map((job) => this.toResponse(job)),
    );
  }
}

/**
 * In-Memory Job Factory
 */
export class InMemoryJobFactory implements IIngestionJobFactory {
  constructor(private writeRepo: InMemoryJobWriteRepository) {}

  load(jobId: string): Promise<IngestionJob | null> {
    const jobs = this.writeRepo.getAll();
    const job = jobs.find((j) => j.jobId === jobId);
    if (!job) return Promise.resolve(null);

    return Promise.resolve(
      IngestionJob.reconstitute({
        jobId: job.jobId,
        sourceConfig: job.sourceConfig,
        status: job.status,
        scheduledAt: job.scheduledAt,
        executedAt: job.executedAt,
        completedAt: job.completedAt,
        metrics: job.metrics,
        errors: job.errors,
        version: job.version,
      }),
    );
  }
}

/**
 * In-Memory Source Read Repository
 */
export class InMemorySourceReadRepository implements ISourceConfigurationReadRepository {
  constructor(private writeRepo: InMemorySourceWriteRepository) {}

  private toResponse(source: StoredSource): GetSourceByIdResponse {
    return {
      sourceId: source.sourceId,
      name: source.name,
      sourceType: source.sourceType.toString(),
      config: source.config,
      credentials: source.credentials,
      isActive: source.isActive,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
      version: source.version,
      healthMetrics: {
        consecutiveFailures: source.consecutiveFailures,
        successRate: source.successRate,
        totalJobs: source.totalJobs,
        lastSuccessAt: source.lastSuccessAt,
        lastFailureAt: source.lastFailureAt,
      },
    };
  }

  findById(sourceId: string): Promise<GetSourceByIdResponse | null> {
    const sources = this.writeRepo.getAll();
    const source = sources.find((s) => s.sourceId === sourceId);

    if (!source) return Promise.resolve(null);

    return Promise.resolve(this.toResponse(source));
  }

  findActive(): Promise<GetSourceByIdResponse[]> {
    const sources = this.writeRepo.getAll();

    return Promise.resolve(
      sources
        .filter((s) => s.isActive)
        .map((source) => this.toResponse(source)),
    );
  }

  findByType(type: string): Promise<GetSourceByIdResponse[]> {
    const sources = this.writeRepo.getAll();

    return Promise.resolve(
      sources
        .filter((s) => s.sourceType.toString() === type)
        .map((source) => this.toResponse(source)),
    );
  }

  findUnhealthy(threshold: number): Promise<GetSourceByIdResponse[]> {
    const sources = this.writeRepo.getAll();

    return Promise.resolve(
      sources
        .filter((s) => s.consecutiveFailures >= threshold)
        .map((source) => this.toResponse(source)),
    );
  }
}

/**
 * In-Memory Source Factory
 */
export class InMemorySourceFactory implements ISourceConfigurationFactory {
  constructor(private readRepo: InMemorySourceReadRepository) {}

  async load(sourceId: string): Promise<SourceConfiguration | null> {
    const data = await this.readRepo.findById(sourceId);
    if (!data) return null;

    return SourceConfiguration.reconstitute({
      sourceId: data.sourceId,
      name: data.name,
      sourceType: SourceType.fromString(data.sourceType),
      config: data.config,
      credentials: data.credentials,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      consecutiveFailures: data.healthMetrics.consecutiveFailures,
      successRate: data.healthMetrics.successRate,
      totalJobs: data.healthMetrics.totalJobs,
      lastSuccessAt: data.healthMetrics.lastSuccessAt,
      lastFailureAt: data.healthMetrics.lastFailureAt,
      version: data.version,
    });
  }
}
