import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetContentRefinementQuery } from './query';
import { GetContentRefinementResult } from './result';
import { IContentRefinementReadRepository } from '@refinement/app/queries/repositories/content-refinement-read';

/**
 * Handler for GetContentRefinementQuery
 *
 * Retrieves a content refinement by its ID from the read repository
 *
 * @class GetContentRefinementHandler
 * @implements {IQueryHandler<GetContentRefinementQuery, GetContentRefinementResult>}
 *
 * Responsibilities:
 * - Execute query against read repository
 * - Return refinement details or null if not found
 * - Log query execution for observability
 *
 * Error Handling:
 * - Returns null if refinement not found
 * - Logs errors but doesn't throw (query should not fail)
 *
 * @example
 * ```typescript
 * const query = new GetContentRefinementQuery('refinement-123');
 * const result = await queryBus.execute(query);
 *
 * if (result) {
 *   console.log(`Refinement status: ${result.status}`);
 *   console.log(`Total chunks: ${result.chunks.length}`);
 * } else {
 *   console.log('Refinement not found');
 * }
 * ```
 */
@QueryHandler(GetContentRefinementQuery)
export class GetContentRefinementHandler implements IQueryHandler<
  GetContentRefinementQuery,
  GetContentRefinementResult | null
> {
  private readonly logger = new Logger(GetContentRefinementHandler.name);

  constructor(
    @Inject('IContentRefinementReadRepository')
    private readonly readRepository: IContentRefinementReadRepository,
  ) {}

  async execute(
    query: GetContentRefinementQuery,
  ): Promise<GetContentRefinementResult | null> {
    this.logger.debug(
      `Executing GetContentRefinementQuery for ID: ${query.refinementId}`,
    );

    try {
      const result = await this.readRepository.findById(query.refinementId);

      if (result) {
        this.logger.debug(
          `Found refinement ${query.refinementId} with status: ${result.status}`,
        );
      } else {
        this.logger.debug(`Refinement not found: ${query.refinementId}`);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error executing GetContentRefinementQuery: ${errorMessage}`,
        errorStack,
      );
      // Queries should not throw - return null on error
      return null;
    }
  }
}
