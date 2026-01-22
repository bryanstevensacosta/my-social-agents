/**
 * GetSourceByIdResponse
 *
 * Response type for GetSourceByIdQuery using PRIMITIVES (not VOs).
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
 * Requirements: 10.1, 10.2
 */

/**
 * Health metrics for a source (primitives only)
 */
export interface SourceHealthMetricsResponse {
  successRate: number;
  consecutiveFailures: number;
  totalJobs: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
}

/**
 * Response for GetSourceByIdQuery (primitives only)
 */
export interface GetSourceByIdResponse {
  sourceId: string;
  name: string;
  sourceType: string;
  isActive: boolean;
  config: Record<string, unknown>;
  credentials?: string;
  createdAt: Date;
  updatedAt: Date;
  healthMetrics: SourceHealthMetricsResponse;
  version: number;
}
