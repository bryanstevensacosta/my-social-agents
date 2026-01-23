import { Query } from '@nestjs/cqrs';
import { GetContentRefinementResult } from './result';

/**
 * GetContentRefinementQuery
 *
 * Query to retrieve refinement details by refinement ID.
 *
 * Returns complete refinement information including:
 * - Refinement status and metadata
 * - All refined chunks with their metadata
 * - Quality scores and temporal context
 * - Error information if refinement failed
 *
 * Requirements: Refinement 11, 12
 * Design: Application Layer - Queries
 *
 * @example
 * ```typescript
 * const query = new GetContentRefinementQuery('refinement-123');
 * const result = await queryBus.execute(query);
 *
 * if (result) {
 *   console.log(`Status: ${result.status}`);
 *   console.log(`Chunks: ${result.chunks.length}`);
 * }
 * ```
 */
export class GetContentRefinementQuery extends Query<GetContentRefinementResult | null> {
  constructor(public readonly refinementId: string) {
    super();
    this.validate();
  }

  /**
   * Validates query properties
   */
  private validate(): void {
    if (!this.refinementId || this.refinementId.trim().length === 0) {
      throw new Error('Refinement ID is required');
    }
  }
}
