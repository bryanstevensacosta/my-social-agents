import { Query } from '@nestjs/cqrs';
import { GetChunksByContentResult } from './result';

/**
 * Query to retrieve all chunks for a specific content item
 *
 * @class GetChunksByContentQuery
 * @extends {Query<GetChunksByContentResult | null>}
 *
 * Use Cases:
 * - Retrieve all chunks for a content item
 * - Display chunked content for review
 * - Access chunk metadata and entities
 * - Analyze chunk quality scores
 *
 * Validation Rules:
 * - contentItemId must be a non-empty string
 *
 * @example
 * ```typescript
 * const query = new GetChunksByContentQuery('content-456');
 * const result = await queryBus.execute(query);
 * if (result) {
 *   console.log(`Found ${result.chunks.length} chunks`);
 * }
 * ```
 */
export class GetChunksByContentQuery extends Query<GetChunksByContentResult | null> {
  constructor(public readonly contentItemId: string) {
    super();

    if (!contentItemId || contentItemId.trim().length === 0) {
      throw new Error('Content item ID is required');
    }
  }
}
