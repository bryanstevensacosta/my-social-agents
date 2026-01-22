import { GetSourceByIdResponse } from '../get-source-by-id/response';

/**
 * Read Repository Interface for Source Configurations
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
 * - Part of CQRS read side (not domain logic)
 *
 * Requirements: All
 */
export interface ISourceConfigurationReadRepository {
  /**
   * Find source by ID with health metrics
   * Returns Response with primitives (no VOs)
   * @param sourceId - Source identifier (string UUID)
   * @returns Response with primitives or null if not found
   */
  findById(sourceId: string): Promise<GetSourceByIdResponse | null>;

  /**
   * Find all active sources
   * Returns Response with primitives (no VOs)
   * @returns Array of Responses with primitives
   */
  findActive(): Promise<GetSourceByIdResponse[]>;

  /**
   * Find sources by type
   * Returns Response with primitives (no VOs)
   * @param type - Source type to filter by (string)
   * @returns Array of Responses with primitives
   */
  findByType(type: string): Promise<GetSourceByIdResponse[]>;

  /**
   * Find unhealthy sources based on failure threshold
   * Returns Response with primitives (no VOs)
   * @param threshold - Minimum consecutive failures to be considered unhealthy
   * @returns Array of Responses with health metrics (primitives)
   */
  findUnhealthy(threshold: number): Promise<GetSourceByIdResponse[]>;
}
