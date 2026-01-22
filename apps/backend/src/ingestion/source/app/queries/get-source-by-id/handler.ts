import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Injectable } from '@nestjs/common';
import { GetSourceByIdQuery } from './query';
import { GetSourceByIdResponse } from './response';
import { ISourceConfigurationReadRepository } from '@/ingestion/source/app/queries/repositories/source-configuration-read';

/**
 * GetSourceByIdQueryHandler
 *
 * Handles GetSourceByIdQuery by retrieving a source configuration from the read repository.
 * Repository returns Response directly - no mapping needed.
 *
 * Requirements: 10.1, 10.2
 * Design: Queries - Source Queries
 */
@Injectable()
@QueryHandler(GetSourceByIdQuery)
export class GetSourceByIdQueryHandler implements IQueryHandler<
  GetSourceByIdQuery,
  GetSourceByIdResponse | null
> {
  constructor(
    @Inject('ISourceConfigurationReadRepository')
    private readonly sourceReadRepository: ISourceConfigurationReadRepository,
  ) {}

  async execute(
    query: GetSourceByIdQuery,
  ): Promise<GetSourceByIdResponse | null> {
    // Repository returns Response directly - no mapping needed
    return this.sourceReadRepository.findById(query.sourceId);
  }
}
