/**
 * Result returned by GetContentRefinementQuery
 *
 * Contains the complete refinement details including chunks and metadata
 *
 * @interface GetContentRefinementResult
 *
 * Properties:
 * - refinementId: Unique identifier for the refinement
 * - contentItemId: ID of the source content item
 * - status: Current refinement status (pending, processing, completed, failed)
 * - chunks: Array of refined chunks with metadata
 * - metadata: Refinement metadata (quality scores, temporal context, etc.)
 * - createdAt: When the refinement was created
 * - refinedAt: When the refinement was completed (null if not completed)
 * - error: Error information if refinement failed (null if successful)
 *
 * @example
 * ```typescript
 * const result: GetContentRefinementResult = {
 *   refinementId: 'refinement-123',
 *   contentItemId: 'content-456',
 *   status: 'completed',
 *   chunks: [
 *     {
 *       chunkId: 'chunk-1',
 *       content: 'Bitcoin reached new highs...',
 *       position: 0,
 *       metadata: {
 *         entities: [{ symbol: 'BTC', confidence: 0.95 }],
 *         qualityScore: 0.85
 *       }
 *     }
 *   ],
 *   metadata: {
 *     totalChunks: 1,
 *     averageQualityScore: 0.85,
 *     processingTimeMs: 1500
 *   },
 *   createdAt: new Date('2025-01-22T10:00:00Z'),
 *   refinedAt: new Date('2025-01-22T10:00:02Z'),
 *   error: null
 * };
 * ```
 */
export interface GetContentRefinementResult {
  refinementId: string;
  contentItemId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  chunks: RefinedChunkResult[];
  metadata: RefinementMetadataResult;
  createdAt: Date;
  refinedAt: Date | null;
  error: RefinementErrorResult | null;
}

/**
 * Refined chunk information
 */
export interface RefinedChunkResult {
  chunkId: string;
  content: string;
  position: number;
  metadata: ChunkMetadataResult;
}

/**
 * Chunk metadata
 */
export interface ChunkMetadataResult {
  entities: CryptoEntityResult[];
  qualityScore: number;
  temporalContext?: TemporalContextResult;
}

/**
 * Crypto entity extracted from chunk
 */
export interface CryptoEntityResult {
  symbol: string;
  name?: string;
  type: 'coin' | 'token' | 'protocol' | 'exchange' | 'person' | 'organization';
  confidence: number;
}

/**
 * Temporal context for chunk
 */
export interface TemporalContextResult {
  referenceDate: Date;
  timeframe: 'past' | 'present' | 'future';
  confidence: number;
}

/**
 * Refinement metadata
 */
export interface RefinementMetadataResult {
  totalChunks: number;
  averageQualityScore: number;
  processingTimeMs: number;
  extractedEntities?: CryptoEntityResult[];
}

/**
 * Refinement error information
 */
export interface RefinementErrorResult {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
