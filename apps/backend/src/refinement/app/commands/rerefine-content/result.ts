/**
 * RerefineContentResult
 *
 * Result of content re-refinement operation.
 * Contains summary information about the re-refinement process.
 *
 * Requirements: Refinement 11, 12
 * Design: Application Layer - Commands
 */
export interface RerefineContentResult {
  /**
   * ID of the new refined content aggregate
   */
  refinementId: string;

  /**
   * ID of the content item that was re-refined
   */
  contentItemId: string;

  /**
   * ID of the previous refinement (for audit trail)
   */
  previousRefinementId: string;

  /**
   * Reason for re-refinement
   */
  reason: string;

  /**
   * Final status of the re-refinement
   */
  status: 'completed' | 'failed' | 'rejected';

  /**
   * Number of chunks created
   * Only present if status is 'completed'
   */
  chunkCount?: number;

  /**
   * Duration of re-refinement process in milliseconds
   * Only present if status is 'completed' or 'failed'
   */
  durationMs?: number;

  /**
   * Average quality score of chunks
   * Only present if status is 'completed'
   */
  averageQualityScore?: number;

  /**
   * Error information
   * Only present if status is 'failed'
   */
  error?: {
    code: string;
    message: string;
  };

  /**
   * Rejection reason
   * Only present if status is 'rejected'
   */
  rejectionReason?: string;
}
