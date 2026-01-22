import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GetJobHistoryQuery } from './query';
import { GetJobHistoryResponse } from './response';
import { IIngestionJobReadRepository } from '@/ingestion/job/app/queries/repositories/ingestion-job-read';

/**
 * GetJobHistoryQueryHandler
 *
 * Handles GetJobHistoryQuery by retrieving job execution history for a source.
 * Returns jobs ordered by executedAt DESC (most recent first).
 * Repository returns Response directly - no mapping needed.
 *
 * Requirements: 6.4
 * Design: Queries - Job Queries
 */
@Injectable()
@QueryHandler(GetJobHistoryQuery)
export class GetJobHistoryQueryHandler implements IQueryHandler<
  GetJobHistoryQuery,
  GetJobHistoryResponse
> {
  constructor(
    @Inject('IIngestionJobReadRepository')
    private readonly jobReadRepository: IIngestionJobReadRepository,
  ) {}

  async execute(query: GetJobHistoryQuery): Promise<GetJobHistoryResponse> {
    // Repository returns Response directly - no mapping needed
    return this.jobReadRepository.findBySourceId(query.sourceId, query.limit);
  }
}
