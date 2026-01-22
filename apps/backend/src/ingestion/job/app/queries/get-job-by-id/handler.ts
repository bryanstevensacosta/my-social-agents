import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GetJobByIdQuery } from './query';
import { GetJobByIdResponse } from './response';
import { IIngestionJobReadRepository } from '@/ingestion/job/app/queries/repositories/ingestion-job-read';

/**
 * GetJobByIdQueryHandler
 *
 * Handles GetJobByIdQuery by retrieving a job from the read repository.
 * Repository returns Response directly - no mapping needed.
 *
 * Requirements: 6.1, 6.2
 * Design: Queries - Job Queries
 */
@Injectable()
@QueryHandler(GetJobByIdQuery)
export class GetJobByIdQueryHandler implements IQueryHandler<
  GetJobByIdQuery,
  GetJobByIdResponse | null
> {
  constructor(
    @Inject('IIngestionJobReadRepository')
    private readonly jobReadRepository: IIngestionJobReadRepository,
  ) {}

  async execute(query: GetJobByIdQuery): Promise<GetJobByIdResponse | null> {
    // Repository returns Response directly - no mapping needed
    return this.jobReadRepository.findById(query.jobId);
  }
}
