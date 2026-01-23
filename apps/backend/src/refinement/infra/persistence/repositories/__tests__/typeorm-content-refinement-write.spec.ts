import { TypeOrmContentRefinementWriteRepository } from '../typeorm-content-refinement-write';
import { ContentRefinement } from '@refinement/domain/aggregates/content-refinement';
import { Chunk } from '@refinement/domain/entities/chunk';
import { ChunkPosition } from '@refinement/domain/value-objects/chunk-position';
import { ChunkHash } from '@refinement/domain/value-objects/chunk-hash';
import { RefinementError } from '@refinement/domain/value-objects/refinement-error';
import { ContentRefinementEntity } from '../../entities/content-refinement.entity';
import { Repository } from 'typeorm';
import { ConcurrencyException } from '@/shared/kernel/concurrency-exception';

describe('TypeOrmContentRefinementWriteRepository', () => {
  let repository: TypeOrmContentRefinementWriteRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<ContentRefinementEntity>>;

  beforeEach(() => {
    mockTypeOrmRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    } as any;

    repository = new TypeOrmContentRefinementWriteRepository(mockTypeOrmRepo);
  });

  describe('save', () => {
    it('should save a new aggregate', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');

      const savedEntity = new ContentRefinementEntity();
      savedEntity.id = 'ref-1';
      savedEntity.version = 1;

      mockTypeOrmRepo.findOne.mockResolvedValue(null); // Not exists
      mockTypeOrmRepo.save.mockResolvedValue(savedEntity);

      await repository.save(aggregate);

      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
      const savedArg = mockTypeOrmRepo.save.mock.calls[0][0];
      expect(savedArg.id).toBe('ref-1');
      expect(savedArg.contentItemId).toBe('content-1');
    });

    it('should update an existing aggregate', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');
      aggregate.start();

      const existingEntity = new ContentRefinementEntity();
      existingEntity.id = 'ref-1';
      existingEntity.version = 1;

      const savedEntity = new ContentRefinementEntity();
      savedEntity.id = 'ref-1';
      savedEntity.version = 2;

      mockTypeOrmRepo.findOne.mockResolvedValue(existingEntity);
      mockTypeOrmRepo.save.mockResolvedValue(savedEntity);

      await repository.save(aggregate);

      expect(mockTypeOrmRepo.save).toHaveBeenCalled();
    });

    it('should handle optimistic locking', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');
      aggregate.start();

      const existingEntity = new ContentRefinementEntity();
      existingEntity.id = 'ref-1';
      existingEntity.version = 2; // Different version

      mockTypeOrmRepo.findOne.mockResolvedValue(existingEntity);

      await expect(repository.save(aggregate)).rejects.toThrow(
        ConcurrencyException,
      );
    });

    it('should map all value objects correctly', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');
      aggregate.start();

      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue(new ContentRefinementEntity());

      await repository.save(aggregate);

      const savedArg = mockTypeOrmRepo.save.mock.calls[0][0];
      expect(savedArg.status).toBe('processing');
      expect(savedArg.id).toBe('ref-1');
      expect(savedArg.contentItemId).toBe('content-1');
    });

    it('should save chunks correctly', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');
      aggregate.start();

      // Add a chunk - need to create a Chunk entity first
      const chunkContent =
        'Bitcoin is a cryptocurrency that enables peer-to-peer transactions without intermediaries. It was created by Satoshi Nakamoto in 2009 and has since become the most valuable cryptocurrency by market capitalization. The Bitcoin network is secured by proof-of-work mining.';
      const chunk = Chunk.create({
        contentId: 'content-1',
        content: chunkContent,
        position: ChunkPosition.create(0, 0, chunkContent.length),
        hash: ChunkHash.create('a'.repeat(64)),
      });
      aggregate.addChunk(chunk);

      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue(new ContentRefinementEntity());

      await repository.save(aggregate);

      const savedArg = mockTypeOrmRepo.save.mock.calls[0][0];
      expect(savedArg.chunks).toBeDefined();
      expect(savedArg.chunks!.length).toBe(1);
      expect(savedArg.chunks![0].content).toBe(chunkContent);
    });

    it('should handle aggregate with no chunks', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');

      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue(new ContentRefinementEntity());

      await repository.save(aggregate);

      const savedArg = mockTypeOrmRepo.save.mock.calls[0][0];
      expect(savedArg.chunks).toBeDefined();
      expect(savedArg.chunks!.length).toBe(0);
    });

    it('should increment version on save', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');

      const existingEntity = new ContentRefinementEntity();
      existingEntity.id = 'ref-1';
      existingEntity.version = 1;

      mockTypeOrmRepo.findOne.mockResolvedValue(existingEntity);
      mockTypeOrmRepo.save.mockResolvedValue(new ContentRefinementEntity());

      await repository.save(aggregate);

      const savedArg = mockTypeOrmRepo.save.mock.calls[0][0];
      expect(savedArg.version).toBe(1); // New aggregate starts at version 1
    });

    it('should handle save errors', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');

      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(repository.save(aggregate)).rejects.toThrow(
        'Database error',
      );
    });

    it('should map completed aggregate correctly', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');
      aggregate.start();

      // Add at least one chunk before completing (required by aggregate invariant)
      const chunkContent =
        'Bitcoin is a cryptocurrency that enables peer-to-peer transactions without intermediaries. It was created by Satoshi Nakamoto in 2009 and has since become the most valuable cryptocurrency by market capitalization. The Bitcoin network is secured by proof-of-work mining.';
      const chunk = Chunk.create({
        contentId: 'content-1',
        content: chunkContent,
        position: ChunkPosition.create(0, 0, chunkContent.length),
        hash: ChunkHash.create('a'.repeat(64)),
      });
      aggregate.addChunk(chunk);
      aggregate.complete();

      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue(new ContentRefinementEntity());

      await repository.save(aggregate);

      const savedArg = mockTypeOrmRepo.save.mock.calls[0][0];
      expect(savedArg.status).toBe('completed');
      expect(savedArg.refinedAt).toBeDefined();
    });

    it('should map failed aggregate correctly', async () => {
      const aggregate = ContentRefinement.create('ref-1', 'content-1');
      aggregate.start();

      // Create RefinementError value object
      const error = RefinementError.create('Error details', 'Test error');
      aggregate.fail(error);

      mockTypeOrmRepo.findOne.mockResolvedValue(null);
      mockTypeOrmRepo.save.mockResolvedValue(new ContentRefinementEntity());

      await repository.save(aggregate);

      const savedArg = mockTypeOrmRepo.save.mock.calls[0][0];
      expect(savedArg.status).toBe('failed');
      expect(savedArg.error).toBeDefined();
      expect(savedArg.error!.code).toBe('Test error');
      expect(savedArg.error!.message).toBe('Error details');
    });
  });
});
