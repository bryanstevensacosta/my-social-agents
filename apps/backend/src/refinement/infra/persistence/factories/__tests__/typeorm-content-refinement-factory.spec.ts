import { TypeOrmContentRefinementFactory } from '../typeorm-content-refinement-factory';
import { ContentRefinement } from '@refinement/domain/aggregates/content-refinement';
import { ContentRefinementEntity } from '../../entities/content-refinement.entity';
import { ChunkEntity } from '../../entities/chunk.entity';
import { Repository } from 'typeorm';

describe('TypeOrmContentRefinementFactory', () => {
  let factory: TypeOrmContentRefinementFactory;
  let mockRepository: jest.Mocked<Repository<ContentRefinementEntity>>;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
    } as any;

    factory = new TypeOrmContentRefinementFactory(mockRepository);
  });

  describe('load', () => {
    it('should load aggregate from database', async () => {
      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'processing'; // Use processing instead of completed
      entity.chunks = [];
      entity.version = 1;
      entity.createdAt = new Date('2024-01-20T00:00:00Z');
      entity.updatedAt = new Date('2024-01-20T00:00:00Z');
      entity.refinedAt = null; // Not completed yet
      entity.error = null;
      entity.config = null;

      mockRepository.findOne.mockResolvedValue(entity);

      const result = await factory.load('ref-1');

      expect(result).toBeInstanceOf(ContentRefinement);
      expect(result?.id).toBe('ref-1');
      expect(result?.contentItemId).toBe('content-1');
    });

    it('should return null when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await factory.load('non-existent');

      expect(result).toBeNull();
    });

    it('should reconstitute all value objects', async () => {
      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';

      // Add at least one chunk (required for completed status)
      const chunk = new ChunkEntity();
      chunk.id = 'chunk-1';
      chunk.refinementId = 'ref-1';
      chunk.content = 'Test chunk content';
      chunk.hash = 'a'.repeat(64); // Valid 64-char hex hash
      chunk.position = 0;
      chunk.entities = [];
      chunk.temporalContext = null;
      chunk.qualityScore = 0.8;

      entity.chunks = [chunk];
      entity.version = 1;
      entity.createdAt = new Date('2024-01-20T00:00:00Z');
      entity.updatedAt = new Date('2024-01-20T00:00:00Z');
      entity.refinedAt = new Date('2024-01-20T00:00:00Z');
      entity.error = null;
      entity.config = null;

      mockRepository.findOne.mockResolvedValue(entity);

      const result = await factory.load('ref-1');

      expect(result).toBeDefined();
      expect(result?.status.value).toBe('completed');
    });

    it('should link chunks correctly (previous/next)', async () => {
      const chunk1 = new ChunkEntity();
      chunk1.id = 'chunk-1';
      chunk1.refinementId = 'ref-1';
      chunk1.content = 'First chunk.';
      chunk1.hash = 'a'.repeat(64); // Valid 64-char hex hash
      chunk1.position = 0;
      chunk1.entities = [];
      chunk1.temporalContext = null;
      chunk1.qualityScore = 0.8;

      const chunk2 = new ChunkEntity();
      chunk2.id = 'chunk-2';
      chunk2.refinementId = 'ref-1';
      chunk2.content = 'Second chunk.';
      chunk2.hash = 'b'.repeat(64); // Valid 64-char hex hash
      chunk2.position = 1;
      chunk2.entities = [];
      chunk2.temporalContext = null;
      chunk2.qualityScore = 0.8;

      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.chunks = [chunk1, chunk2];
      entity.version = 1;
      entity.createdAt = new Date('2024-01-20T00:00:00Z');
      entity.updatedAt = new Date('2024-01-20T00:00:00Z');
      entity.refinedAt = new Date('2024-01-20T00:00:00Z');
      entity.error = null;
      entity.config = null;

      mockRepository.findOne.mockResolvedValue(entity);

      const result = await factory.load('ref-1');

      expect(result).toBeDefined();
      expect(result?.chunks.length).toBe(2);
    });

    it('should reconstitute crypto entities', async () => {
      const chunk1 = new ChunkEntity();
      chunk1.id = 'chunk-1';
      chunk1.refinementId = 'ref-1';
      chunk1.content = 'Bitcoin analysis.';
      chunk1.hash = 'a'.repeat(64); // Valid 64-char hex hash
      chunk1.position = 0;
      chunk1.entities = [{ type: 'token', symbol: 'BTC', confidence: 0.95 }];
      chunk1.temporalContext = null;
      chunk1.qualityScore = 0.8;

      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.chunks = [chunk1];
      entity.version = 1;
      entity.createdAt = new Date('2024-01-20T00:00:00Z');
      entity.updatedAt = new Date('2024-01-20T00:00:00Z');
      entity.refinedAt = new Date('2024-01-20T00:00:00Z');
      entity.error = null;
      entity.config = null;

      mockRepository.findOne.mockResolvedValue(entity);

      const result = await factory.load('ref-1');

      expect(result).toBeDefined();
      expect(result?.chunks[0].entities.length).toBe(1);
      expect(result?.chunks[0].entities[0].value).toBe('BTC');
      expect(result?.chunks[0].entities[0].confidence).toBe(0.95);
    });

    it('should reconstitute temporal contexts', async () => {
      const chunk1 = new ChunkEntity();
      chunk1.id = 'chunk-1';
      chunk1.refinementId = 'ref-1';
      chunk1.content = 'Bitcoin on January 15, 2024.';
      chunk1.hash = 'a'.repeat(64); // Valid 64-char hex hash
      chunk1.position = 0;
      chunk1.entities = [];
      chunk1.temporalContext = {
        referenceDate: new Date('2024-01-15T00:00:00Z').toISOString(),
        timeframe: 'past',
        confidence: 0.9,
      };
      chunk1.qualityScore = 0.8;

      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.chunks = [chunk1];
      entity.version = 1;
      entity.createdAt = new Date('2024-01-20T00:00:00Z');
      entity.updatedAt = new Date('2024-01-20T00:00:00Z');
      entity.refinedAt = new Date('2024-01-20T00:00:00Z');
      entity.error = null;
      entity.config = null;

      mockRepository.findOne.mockResolvedValue(entity);

      const result = await factory.load('ref-1');

      expect(result).toBeDefined();
      expect(result?.chunks[0].temporalContext).toBeDefined();
    });

    it('should reconstitute quality score', async () => {
      const chunk1 = new ChunkEntity();
      chunk1.id = 'chunk-1';
      chunk1.refinementId = 'ref-1';
      chunk1.content = 'Bitcoin analysis.';
      chunk1.hash = 'a'.repeat(64); // Valid 64-char hex hash
      chunk1.position = 0;
      chunk1.entities = [];
      chunk1.temporalContext = null;
      chunk1.qualityScore = 0.85;

      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.chunks = [chunk1];
      entity.version = 1;
      entity.createdAt = new Date('2024-01-20T00:00:00Z');
      entity.updatedAt = new Date('2024-01-20T00:00:00Z');
      entity.refinedAt = new Date('2024-01-20T00:00:00Z');
      entity.error = null;
      entity.config = null;

      mockRepository.findOne.mockResolvedValue(entity);

      const result = await factory.load('ref-1');

      expect(result).toBeDefined();
      expect(result?.chunks[0].qualityScore).toBeDefined();
    });

    it('should handle failed refinement', async () => {
      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'failed';
      entity.chunks = [];
      entity.version = 1;
      entity.createdAt = new Date('2024-01-20T00:00:00Z');
      entity.updatedAt = new Date('2024-01-20T00:00:00Z');
      entity.refinedAt = null;
      entity.error = {
        code: 'CHUNKING_ERROR',
        message: 'Failed to chunk content',
      };

      mockRepository.findOne.mockResolvedValue(entity);

      const result = await factory.load('ref-1');

      expect(result).toBeDefined();
      expect(result?.status.value).toBe('failed');
      expect(result?.error?.code).toBe('CHUNKING_ERROR');
      expect(result?.error?.message).toBe('Failed to chunk content');
    });

    it('should handle database errors', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(factory.load('ref-1')).rejects.toThrow('Database error');
    });

    it('should preserve version number', async () => {
      const chunk = new ChunkEntity();
      chunk.id = 'chunk-1';
      chunk.refinementId = 'ref-1';
      chunk.content = 'Test chunk';
      chunk.hash = 'a'.repeat(64); // Valid 64-char hex hash
      chunk.position = 0;
      chunk.entities = [];
      chunk.temporalContext = null;
      chunk.qualityScore = 0.8;

      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.chunks = [chunk]; // Add chunk for completed status
      entity.version = 5;
      entity.createdAt = new Date('2024-01-20T00:00:00Z');
      entity.updatedAt = new Date('2024-01-20T00:00:00Z');
      entity.refinedAt = new Date('2024-01-20T00:00:00Z');
      entity.error = null;
      entity.config = null;

      mockRepository.findOne.mockResolvedValue(entity);

      const result = await factory.load('ref-1');

      expect(result).toBeDefined();
      expect(result?.version).toBe(5);
    });
  });
});
