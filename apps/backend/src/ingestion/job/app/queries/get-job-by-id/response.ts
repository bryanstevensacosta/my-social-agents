/**
 * GetJobByIdResponse
 *
 * Response type for GetJobByIdQuery using PRIMITIVES (not VOs).
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
 * Requirements: 6.1, 6.2
 */
export interface GetJobByIdResponse {
  // IDs as primitives (string UUIDs)
  jobId: string;
  sourceId: string;

  // Status as primitive string
  status: string;

  // Timestamps
  scheduledAt: Date;
  executedAt: Date | null;
  completedAt: Date | null;

  // Metrics as plain object (primitives)
  metrics: {
    itemsCollected: number;
    duplicatesDetected: number;
    errorsEncountered: number;
    bytesProcessed: number;
    durationMs: number;
  };

  // Flat properties for backward compatibility (access via metrics.* instead)
  itemsCollected: number;
  duplicatesDetected: number;
  errorsEncountered: number;
  bytesProcessed: number;
  durationMs: number;

  // Errors (as array of plain objects - entities within aggregate)
  errors: Array<{
    errorId: string;
    timestamp: Date;
    errorType: string;
    message: string;
    stackTrace: string | null;
    retryCount: number;
  }>;

  // Source configuration (denormalized for query optimization)
  sourceConfig: {
    sourceId: string;
    sourceType: string;
    name: string;
    config: Record<string, unknown>;
    credentials?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  // Version for optimistic locking
  version: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
