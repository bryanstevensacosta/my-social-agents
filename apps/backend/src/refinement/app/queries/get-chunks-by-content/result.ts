/**
 * Result returned by GetChunksByContentQuery
 *
 * Contains all chunks for a specific content item with their metadata
 *
 * @interface GetChunksByContentResult
 *
 * Properties:
 * - contentItemId: ID of the source content item
 * - refinementId: ID of the refinement that produced these chunks
 * - chunks: Array of chunks with metadata
 * - totalChunks: Total number of chunks
 * - averageQualityScore: Average quality score across all chunks
 *
 * @example
 * ```typescript
 * const result: GetChunksByContentResult = {
 *   contentItemId: 'content-456',
 *   refinementId: 'refinement-123',
 *   chunks: [
 *     {
 *       chunkId: 'chunk-1',
 *       content: 'Bitcoin reached new highs...',
 *       position: 0,
 *       hash: 'abc123...',
 *       metadata: {
 *         entities: [{ symbol: 'BTC', confidence: 0.95 }],
 *         qualityScore: 0.85
 *       }
 *     }
 *   ],
 *   totalChunks: 1,
 *   averageQualityScore: 0.85
 * };
 * ```
 */
export interface GetChunksByContentResult {
  contentItemId: string;
  refinementId: string;
  chunks: ChunkResult[];
  totalChunks: number;
  averageQualityScore: number;
}

/**
 * Individual chunk information
 */
export interface ChunkResult {
  chunkId: string;
  content: string;
  position: number;
  hash: string;
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
