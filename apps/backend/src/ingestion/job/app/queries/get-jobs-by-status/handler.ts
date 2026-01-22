import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GetJobsByStatusQuery } from './query';
import { GetJobsByStatusResponse } from './response';
import { IIngestionJobReadRepository } from '@/ingestion/job/app/queries/repositories/ingestion-job-read';

/**
 * GetJobsByStatusQueryHandler
 *
 * Handles GetJobsByStatusQuery by retrieving jobs filtered by status with pagination.
 * Repository returns Response directly - no mapping needed.
 *
 * Requirements: 6.3
 * Design: Queries - Job Queries
 */
@Injectable()
@QueryHandler(GetJobsByStatusQuery)
export class GetJobsByStatusQueryHandler implements IQueryHandler<
  GetJobsByStatusQuery,
  GetJobsByStatusResponse
> {
  constructor(
    @Inject('IIngestionJobReadRepository')
    private readonly jobReadRepository: IIngestionJobReadRepository,
  ) {}

  async execute(query: GetJobsByStatusQuery): Promise<GetJobsByStatusResponse> {
    // Repository returns Response directly - no mapping needed
    return this.jobReadRepository.findByStatus(
      query.status,
      query.limit,
      query.offset,
    );
  }
}
