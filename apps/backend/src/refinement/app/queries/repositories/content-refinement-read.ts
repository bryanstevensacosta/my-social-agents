import { GetContentRefinementResult } from '../get-content-refinement/result';
import { GetChunksByContentResult } from '../get-chunks-by-content/result';

/**
 * Read repository interface for ContentRefinement queries
 *
 * Provides optimized read operations for refinement data
 *
 * @interface IContentRefinementReadRepository
 *
 * Design Principles:
 * - Read-only operations (no save/delete methods)
 * - Returns Result objects (not aggregates)
 * - Optimized for query performance
 * - Can use denormalized data
 *
 * Location: Application layer (app/queries/repositories/)
 * Why: Read repositories return Results (application concern)
 *
 * Implementation: Infrastructure layer (infra/persistence/repositories/)
 *
 * @example
 * ```typescript
 * // In query handler
 * const result = await this.readRepository.findById('refinement-123');
 * if (result) {
 *   console.log(`Status: ${result.status}`);
 * }
 * ```
 */
export interface IContentRefinementReadRepository {
  /**
   * Find a refinement by its ID
   *
   * @param refinementId - Unique identifier for the refinement
   * @returns Refinement result or null if not found
   *
   * @example
   * ```typescript
   * const result = await readRepo.findById('refinement-123');
   * ```
   */
  findById(refinementId: string): Promise<GetContentRefinementResult | null>;

  /**
   * Find refinements by content item ID
   *
   * @param contentItemId - ID of the source content item
   * @returns Array of refinement results (may be empty)
   *
   * @example
   * ```typescript
   * const refinements = await readRepo.findByContentItemId('content-456');
   * console.log(`Found ${refinements.length} refinements`);
   * ```
   */
  findByContentItemId(
    contentItemId: string,
  ): Promise<GetContentRefinementResult[]>;

  /**
   * Find refinements by status
   *
   * @param status - Refinement status to filter by
   * @returns Array of refinement results (may be empty)
   *
   * @example
   * ```typescript
   * const pending = await readRepo.findByStatus('pending');
   * const processing = await readRepo.findByStatus('processing');
   * ```
   */
  findByStatus(
    status: 'pending' | 'processing' | 'completed' | 'failed',
  ): Promise<GetContentRefinementResult[]>;

  /**
   * Find all chunks for a specific content item
   *
   * @param contentItemId - ID of the source content item
   * @returns Chunks result or null if no refinement exists
   *
   * @example
   * ```typescript
   * const result = await readRepo.findChunksByContentItemId('content-456');
   * if (result) {
   *   console.log(`Found ${result.totalChunks} chunks`);
   * }
   * ```
   */
  findChunksByContentItemId(
    contentItemId: string,
  ): Promise<GetChunksByContentResult | null>;
}
