import { GetJobByIdResponse } from '../get-job-by-id/response';
import { GetJobsByStatusResponse } from '../get-jobs-by-status/response';
import { GetJobHistoryResponse } from '../get-job-history/response';

/**
 * Read Repository Interface for Ingestion Jobs
 *
 * Returns Response types with PRIMITIVES (not VOs or ReadModels).
 *
 * CRITICAL ARCHITECTURE (Clean Architecture / DDD):
 * - Repository constructs VOs internally for validation/business logic
 * - Repository extracts primitives from VOs
 * - Repository returns Response types with primitives
 * - Query handlers receive primitives (no mapping needed)
 * - API controllers receive primitives ready for JSON
 *
 * Lives in Application layer because:
 * - Returns Response types (application concern, not domain)
 * - Used by Query handlers (application layer)
 * - Part of CQRS read side
 *
 * Requirements: 4.2, 4.3
 */
export interface IIngestionJobReadRepository {
  /**
   * Find job by ID
   * Returns Response with primitives (no VOs)
   * @param jobId - Job identifier (string UUID)
   * @returns Response with primitives or null if not found
   */
  findById(jobId: string): Promise<GetJobByIdResponse | null>;

  /**
   * Find jobs by status with pagination
   * Returns Response with primitives (no VOs)
   * @param status - Job status to filter by (string)
   * @param limit - Maximum number of results to return
   * @param offset - Number of results to skip
   * @returns Response with array of jobs (primitives) and total count
   */
  findByStatus(
    status: string,
    limit?: number,
    offset?: number,
  ): Promise<GetJobsByStatusResponse>;

  /**
   * Count jobs by status
   * @param status - Job status to filter by (string)
   * @returns Total count of jobs with the given status
   */
  countByStatus(status: string): Promise<number>;

  /**
   * Find jobs by source ID ordered by executedAt DESC
   * Returns Response with primitives (no VOs)
   * @param sourceId - Source identifier (string UUID)
   * @param limit - Maximum number of results to return
   * @returns Response with array of jobs (primitives) and total count
   */
  findBySourceId(
    sourceId: string,
    limit?: number,
  ): Promise<GetJobHistoryResponse>;
}
