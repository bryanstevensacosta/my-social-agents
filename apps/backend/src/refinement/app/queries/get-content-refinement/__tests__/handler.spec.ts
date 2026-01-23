import { Test, TestingModule } from '@nestjs/testing';
import { GetContentRefinementHandler } from '../handler';
import { GetContentRefinementQuery } from '../query';
import { GetContentRefinementResult } from '../result';
import { IContentRefinementReadRepository } from '../../repositories/content-refinement-read';

describe('GetContentRefinementHandler', () => {
  let handler: GetContentRefinementHandler;
  let mockReadRepository: jest.Mocked<IContentRefinementReadRepository>;

  beforeEach(async () => {
    // Create mock read repository
    mockReadRepository = {
      findById: jest.fn(),
      findByContentItemId: jest.fn(),
      findByStatus: jest.fn(),
      findChunksByContentItemId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetContentRefinementHandler,
        {
          provide: 'IContentRefinementReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetContentRefinementHandler>(
      GetContentRefinementHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return refinement result when found', async () => {
      // Arrange
      const query = new GetContentRefinementQuery('refinement-123');
      const expectedResult: GetContentRefinementResult = {
        refinementId: 'refinement-123',
        contentItemId: 'content-456',
        status: 'completed',
        chunks: [
          {
            chunkId: 'chunk-1',
            content: 'Bitcoin reached new highs',
            position: 0,
            metadata: {
              entities: [
                {
                  symbol: 'BTC',
                  name: 'Bitcoin',
                  type: 'coin',
                  confidence: 0.95,
                },
              ],
              qualityScore: 0.85,
            },
          },
        ],
        metadata: {
          totalChunks: 1,
          averageQualityScore: 0.85,
          processingTimeMs: 1500,
        },
        createdAt: new Date('2025-01-22T10:00:00Z'),
        refinedAt: new Date('2025-01-22T10:00:02Z'),
        error: null,
      };

      mockReadRepository.findById.mockResolvedValue(expectedResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockReadRepository.findById).toHaveBeenCalledWith(
        'refinement-123',
      );
      expect(mockReadRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null when refinement not found', async () => {
      // Arrange
      const query = new GetContentRefinementQuery('non-existent');
      mockReadRepository.findById.mockResolvedValue(null);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
      expect(mockReadRepository.findById).toHaveBeenCalledWith('non-existent');
    });

    it('should return refinement with pending status', async () => {
      // Arrange
      const query = new GetContentRefinementQuery('refinement-pending');
      const expectedResult: GetContentRefinementResult = {
        refinementId: 'refinement-pending',
        contentItemId: 'content-789',
        status: 'pending',
        chunks: [],
        metadata: {
          totalChunks: 0,
          averageQualityScore: 0,
          processingTimeMs: 0,
        },
        createdAt: new Date('2025-01-22T10:00:00Z'),
        refinedAt: null,
        error: null,
      };

      mockReadRepository.findById.mockResolvedValue(expectedResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result?.status).toBe('pending');
      expect(result?.refinedAt).toBeNull();
    });

    it('should return refinement with failed status and error', async () => {
      // Arrange
      const query = new GetContentRefinementQuery('refinement-failed');
      const expectedResult: GetContentRefinementResult = {
        refinementId: 'refinement-failed',
        contentItemId: 'content-999',
        status: 'failed',
        chunks: [],
        metadata: {
          totalChunks: 0,
          averageQualityScore: 0,
          processingTimeMs: 500,
        },
        createdAt: new Date('2025-01-22T10:00:00Z'),
        refinedAt: null,
        error: {
          code: 'CHUNKING_FAILED',
          message: 'Failed to chunk content',
          details: { reason: 'Content too short' },
        },
      };

      mockReadRepository.findById.mockResolvedValue(expectedResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result?.status).toBe('failed');
      expect(result?.error).toBeDefined();
      expect(result?.error?.code).toBe('CHUNKING_FAILED');
    });

    it('should return refinement with multiple chunks', async () => {
      // Arrange
      const query = new GetContentRefinementQuery('refinement-multi');
      const expectedResult: GetContentRefinementResult = {
        refinementId: 'refinement-multi',
        contentItemId: 'content-multi',
        status: 'completed',
        chunks: [
          {
            chunkId: 'chunk-1',
            content: 'First chunk about Bitcoin',
            position: 0,
            metadata: {
              entities: [{ symbol: 'BTC', type: 'coin', confidence: 0.9 }],
              qualityScore: 0.85,
            },
          },
          {
            chunkId: 'chunk-2',
            content: 'Second chunk about Ethereum',
            position: 1,
            metadata: {
              entities: [{ symbol: 'ETH', type: 'coin', confidence: 0.88 }],
              qualityScore: 0.82,
            },
          },
        ],
        metadata: {
          totalChunks: 2,
          averageQualityScore: 0.835,
          processingTimeMs: 2000,
        },
        createdAt: new Date('2025-01-22T10:00:00Z'),
        refinedAt: new Date('2025-01-22T10:00:03Z'),
        error: null,
      };

      mockReadRepository.findById.mockResolvedValue(expectedResult);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result?.chunks).toHaveLength(2);
      expect(result?.metadata.totalChunks).toBe(2);
    });

    it('should return null on repository error', async () => {
      // Arrange
      const query = new GetContentRefinementQuery('refinement-error');
      mockReadRepository.findById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
      expect(mockReadRepository.findById).toHaveBeenCalledWith(
        'refinement-error',
      );
    });

    it('should handle repository throwing non-Error object', async () => {
      // Arrange
      const query = new GetContentRefinementQuery('refinement-weird-error');
      mockReadRepository.findById.mockRejectedValue('String error');

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
    });
  });
});
