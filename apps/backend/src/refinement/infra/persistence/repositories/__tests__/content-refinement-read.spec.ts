import { ContentRefinementReadRepository } from '../content-refinement-read';
import { ContentRefinementEntity } from '../../entities/content-refinement.entity';
import { ChunkEntity } from '../../entities/chunk.entity';
import { Repository } from 'typeorm';

describe('ContentRefinementReadRepository', () => {
  let repository: ContentRefinementReadRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<ContentRefinementEntity>>;

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    repository = new ContentRefinementReadRepository(mockTypeOrmRepo);
  });

  describe('findById', () => {
    it('should find refinement by ID', async () => {
      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.config = {
        chunkingStrategy: 'recursive',
        chunkSize: 500,
        chunkOverlap: 100,
        extractEntities: true,
        extractTemporal: true,
        analyzeQuality: true,
      };
      entity.chunks = [];
      entity.version = 1;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById('ref-1');

      expect(result).toBeDefined();
      expect(result?.refinementId).toBe('ref-1');
      expect(result?.contentItemId).toBe('content-1');
      expect(result?.status).toBe('completed');
    });

    it('should return null when not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should include chunks in result', async () => {
      const chunk1 = new ChunkEntity();
      chunk1.id = 'chunk-1';
      chunk1.content = 'Bitcoin is a cryptocurrency.';
      chunk1.position = 0;

      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.config = {
        chunkingStrategy: 'recursive',
        chunkSize: 500,
        chunkOverlap: 100,
        extractEntities: true,
        extractTemporal: true,
        analyzeQuality: true,
      };
      entity.chunks = [chunk1];
      entity.version = 1;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById('ref-1');

      expect(result?.chunks).toBeDefined();
      expect(result?.chunks.length).toBe(1);
      expect(result?.chunks[0].content).toBe('Bitcoin is a cryptocurrency.');
    });
  });

  describe('findByContentItemId', () => {
    it('should find refinement by content item ID', async () => {
      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.config = {
        chunkingStrategy: 'recursive',
        chunkSize: 500,
        chunkOverlap: 100,
        extractEntities: true,
        extractTemporal: true,
        analyzeQuality: true,
      };
      entity.chunks = [];
      entity.version = 1;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByContentItemId('content-1');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.contentItemId).toBe('content-1');
    });

    it('should return null when not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByContentItemId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByStatus', () => {
    it('should find refinements by status', async () => {
      const entity1 = new ContentRefinementEntity();
      entity1.id = 'ref-1';
      entity1.contentItemId = 'content-1';
      entity1.status = 'completed';
      entity1.config = {
        chunkingStrategy: 'recursive',
        chunkSize: 500,
        chunkOverlap: 100,
        extractEntities: true,
        extractTemporal: true,
        analyzeQuality: true,
      };
      entity1.chunks = [];
      entity1.version = 1;
      entity1.createdAt = new Date();
      entity1.updatedAt = new Date();

      const entity2 = new ContentRefinementEntity();
      entity2.id = 'ref-2';
      entity2.contentItemId = 'content-2';
      entity2.status = 'completed';
      entity2.config = {
        chunkingStrategy: 'recursive',
        chunkSize: 500,
        chunkOverlap: 100,
        extractEntities: true,
        extractTemporal: true,
        analyzeQuality: true,
      };
      entity2.chunks = [];
      entity2.version = 1;
      entity2.createdAt = new Date();
      entity2.updatedAt = new Date();

      mockTypeOrmRepo.find.mockResolvedValue([entity1, entity2]);

      const result = await repository.findByStatus('completed');

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('completed');
      expect(result[1].status).toBe('completed');
    });

    it('should return empty array when none found', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);

      const result = await repository.findByStatus('completed');

      expect(result).toHaveLength(0);
    });
  });

  describe('findChunksByContentItemId', () => {
    it('should find chunks by content item ID', async () => {
      const chunk1 = new ChunkEntity();
      chunk1.id = 'chunk-1';
      chunk1.content = 'Bitcoin is a cryptocurrency.';
      chunk1.position = 0;

      const chunk2 = new ChunkEntity();
      chunk2.id = 'chunk-2';
      chunk2.content = 'Ethereum is another cryptocurrency.';
      chunk2.position = 1;

      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.config = {
        chunkingStrategy: 'recursive',
        chunkSize: 500,
        chunkOverlap: 100,
        extractEntities: true,
        extractTemporal: true,
        analyzeQuality: true,
      };
      entity.chunks = [chunk1, chunk2];
      entity.version = 1;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findChunksByContentItemId('content-1');

      expect(result).toBeDefined();
      expect(result?.chunks).toHaveLength(2);
      expect(result?.chunks[0]?.content).toBe('Bitcoin is a cryptocurrency.');
      expect(result?.chunks[1]?.content).toBe(
        'Ethereum is another cryptocurrency.',
      );
    });

    it('should return empty array when refinement not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findChunksByContentItemId('non-existent');

      expect(result).toBeNull();
    });

    it('should return empty array when refinement has no chunks', async () => {
      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.config = {
        chunkingStrategy: 'recursive',
        chunkSize: 500,
        chunkOverlap: 100,
        extractEntities: true,
        extractTemporal: true,
        analyzeQuality: true,
      };
      entity.chunks = [];
      entity.version = 1;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findChunksByContentItemId('content-1');

      expect(result).toBeDefined();
      expect(result?.chunks).toHaveLength(0);
    });

    it('should return chunks in correct order', async () => {
      const chunk1 = new ChunkEntity();
      chunk1.id = 'chunk-1';
      chunk1.content = 'First chunk.';
      chunk1.position = 0;

      const chunk2 = new ChunkEntity();
      chunk2.id = 'chunk-2';
      chunk2.content = 'Second chunk.';
      chunk2.position = 1;

      const chunk3 = new ChunkEntity();
      chunk3.id = 'chunk-3';
      chunk3.content = 'Third chunk.';
      chunk3.position = 2;

      const entity = new ContentRefinementEntity();
      entity.id = 'ref-1';
      entity.contentItemId = 'content-1';
      entity.status = 'completed';
      entity.config = {
        chunkingStrategy: 'recursive',
        chunkSize: 500,
        chunkOverlap: 100,
        extractEntities: true,
        extractTemporal: true,
        analyzeQuality: true,
      };
      entity.chunks = [chunk2, chunk3, chunk1]; // Out of order
      entity.version = 1;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findChunksByContentItemId('content-1');

      expect(result).toBeDefined();
      expect(result?.chunks[0]?.position).toBe(0);
      expect(result?.chunks[1]?.position).toBe(1);
      expect(result?.chunks[2]?.position).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle database errors in findById', async () => {
      mockTypeOrmRepo.findOne.mockRejectedValue(new Error('Database error'));

      await expect(repository.findById('ref-1')).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle database errors in findByContentItemId', async () => {
      mockTypeOrmRepo.findOne.mockRejectedValue(new Error('Database error'));

      await expect(repository.findByContentItemId('content-1')).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle database errors in findByStatus', async () => {
      mockTypeOrmRepo.find.mockRejectedValue(new Error('Database error'));

      await expect(repository.findByStatus('completed')).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle database errors in findChunksByContentItemId', async () => {
      mockTypeOrmRepo.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        repository.findChunksByContentItemId('content-1'),
      ).rejects.toThrow('Database error');
    });
  });
});
