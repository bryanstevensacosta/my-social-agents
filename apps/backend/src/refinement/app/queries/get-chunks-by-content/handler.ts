import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { GetChunksByContentQuery } from './query';
import { GetChunksByContentResult } from './result';
import { IContentRefinementReadRepository } from '../repositories/content-refinement-read';

/**
 * Handler for GetChunksByContentQuery
 *
 * Retrieves all chunks for a specific content item from the read repository
 *
 * @class GetChunksByContentHandler
 * @implements {IQueryHandler<GetChunksByContentQuery, GetChunksByContentResult>}
 *
 * Responsibilities:
 * - Execute query against read repository
 * - Return chunks for the content item or null if not found
 * - Log query execution for observability
 *
 * Error Handling:
 * - Returns null if content item has no refinement
 * - Logs errors but doesn't throw (query should not fail)
 *
 * @example
 * ```typescript
 * const query = new GetChunksByContentQuery('content-456');
 * const result = await queryBus.execute(query);
 *
 * if (result) {
 *   console.log(`Found ${result.totalChunks} chunks`);
 *   result.chunks.forEach(chunk => {
 *     console.log(`Chunk ${chunk.position}: ${chunk.content.substring(0, 50)}...`);
 *   });
 * } else {
 *   console.log('No chunks found for this content');
 * }
 * ```
 */
@QueryHandler(GetChunksByContentQuery)
export class GetChunksByContentHandler implements IQueryHandler<
  GetChunksByContentQuery,
  GetChunksByContentResult | null
> {
  private readonly logger = new Logger(GetChunksByContentHandler.name);

  constructor(
    @Inject('IContentRefinementReadRepository')
    private readonly readRepository: IContentRefinementReadRepository,
  ) {}

  async execute(
    query: GetChunksByContentQuery,
  ): Promise<GetChunksByContentResult | null> {
    this.logger.debug(
      `Executing GetChunksByContentQuery for content: ${query.contentItemId}`,
    );

    try {
      const result = await this.readRepository.findChunksByContentItemId(
        query.contentItemId,
      );

      if (result) {
        this.logger.debug(
          `Found ${result.totalChunks} chunks for content ${query.contentItemId}`,
        );
      } else {
        this.logger.debug(
          `No chunks found for content: ${query.contentItemId}`,
        );
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error executing GetChunksByContentQuery: ${errorMessage}`,
        errorStack,
      );
      // Queries should not throw - return null on error
      return null;
    }
  }
}
