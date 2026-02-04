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
      // Content must be at least 200 characters (Chunk validation requirement)
      const chunk = new ChunkEntity();
      chunk.id = 'chunk-1';
      chunk.refinementId = 'ref-1';
      chunk.content =
        'Bitcoin is a decentralized digital currency that operates without a central bank or single administrator. It can be sent from user to user on the peer-to-peer bitcoin network without the need for intermediaries and is verified by network nodes through cryptography.';
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
      chunk1.content =
        'Bitcoin is a decentralized digital currency that operates without a central bank or single administrator. It can be sent from user to user on the peer-to-peer bitcoin network without the need for intermediaries and is verified by network nodes through cryptography.';
      chunk1.hash = 'a'.repeat(64); // Valid 64-char hex hash
      chunk1.position = 0;
      chunk1.entities = [];
      chunk1.temporalContext = null;
      chunk1.qualityScore = 0.8;

      const chunk2 = new ChunkEntity();
      chunk2.id = 'chunk-2';
      chunk2.refinementId = 'ref-1';
      chunk2.content =
        'Ethereum is a decentralized platform that runs smart contracts and applications without downtime, fraud, control or interference from a third party. It provides a cryptocurrency token called ether which can be transferred between accounts and used to compensate participant nodes.';
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
      chunk1.content =
        'Bitcoin analysis shows strong market performance with increasing adoption rates across institutional investors. The cryptocurrency has demonstrated resilience through various market cycles and continues to be the dominant digital asset by market capitalization and network security.';
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
      chunk1.content =
        'Bitcoin reached a new all-time high on January 15, 2024, breaking through the $50,000 resistance level. This milestone was driven by increased institutional adoption and positive regulatory developments in major markets around the world.';
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
      chunk1.content =
        'Bitcoin analysis reveals strong fundamentals with growing network effects and increasing institutional adoption. The cryptocurrency continues to demonstrate its value proposition as a store of value and medium of exchange in the digital economy.';
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
      chunk.content =
        'Comprehensive analysis of cryptocurrency market trends showing sustained growth patterns and increasing mainstream adoption. The digital asset ecosystem continues to mature with improved infrastructure and regulatory clarity in key jurisdictions.';
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
      expect(result?.version.value).toBe(5);
    });
  });
});
