/**
 * GetJobsByStatusResponse
 *
 * Response type for GetJobsByStatusQuery using PRIMITIVES (not VOs).
 * Returned directly by repositories (no intermediate ReadModel).
 *
 * CRITICAL ARCHITECTURE (Clean Architecture / DDD):
 * - Response types are OUTPUT CONTRACTS (application layer)
 * - They MUST use primitives, NOT Value Objects
 * - VOs belong to domain and should NOT leak to application/API layers
 * - Repositories construct VOs internally, then extract primitives for Response
 * - Query handlers return repository results without mapping
 * - API controllers receive primitives ready for JSON serialization
 *
 * Why primitives?
 * - Response is a contract for external consumers (API/UI)
 * - VOs have domain behavior and invariants (internal to domain)
 * - Exposing VOs couples domain to output format
 * - Breaks Dependency Rule (application depends on domain, not vice versa)
 *
 * Naming Convention: {QueryName}Response
 * Location: app/queries/<query-name>/response.ts
 *
 * Requirements: 6.3
 */

/**
 * Individual job item in the response (primitives only)
 */
export interface JobByStatusItemResponse {
  jobId: string;
  sourceId: string;
  status: string;
  scheduledAt: Date;
  executedAt: Date | null;
  completedAt: Date | null;
  itemsCollected: number;
  duplicatesDetected: number;
  errorsEncountered: number;
  bytesProcessed: number;
  durationMs: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Paginated response for GetJobsByStatusQuery
 */
export interface GetJobsByStatusResponse {
  jobs: JobByStatusItemResponse[];
  total: number;
}
