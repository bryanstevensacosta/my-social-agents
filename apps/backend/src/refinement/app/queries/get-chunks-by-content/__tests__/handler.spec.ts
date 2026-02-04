import { Test, TestingModule } from '@nestjs/testing';
import { GetChunksByContentHandler } from '../handler';
import { GetChunksByContentQuery } from '../query';
import { GetChunksByContentResult } from '../result';
import { IContentRefinementReadRepository } from '../../repositories/content-refinement-read';

describe('GetChunksByContentHandler', () => {
  let handler: GetChunksByContentHandler;
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
        GetChunksByContentHandler,
        {
          provide: 'IContentRefinementReadRepository',
          useValue: mockReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetChunksByContentHandler>(GetChunksByContentHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return chunks when found', async () => {
      // Arrange
      const query = new GetChunksByContentQuery('content-456');
      const expectedResult: GetChunksByContentResult = {
        contentItemId: 'content-456',
        refinementId: 'refinement-123',
        chunks: [
          {
            chunkId: 'chunk-1',
            content: 'Bitcoin reached new highs',
            position: 0,
            hash: 'abc123',
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
        totalChunks: 1,
        averageQualityScore: 0.85,
      };

      mockReadRepository.findChunksByContentItemId.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockReadRepository.findChunksByContentItemId).toHaveBeenCalledWith(
        'content-456',
      );
      expect(
        mockReadRepository.findChunksByContentItemId,
      ).toHaveBeenCalledTimes(1);
    });

    it('should return null when no chunks found', async () => {
      // Arrange
      const query = new GetChunksByContentQuery('non-existent');
      mockReadRepository.findChunksByContentItemId.mockResolvedValue(null);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
      expect(mockReadRepository.findChunksByContentItemId).toHaveBeenCalledWith(
        'non-existent',
      );
    });

    it('should return multiple chunks in correct order', async () => {
      // Arrange
      const query = new GetChunksByContentQuery('content-multi');
      const expectedResult: GetChunksByContentResult = {
        contentItemId: 'content-multi',
        refinementId: 'refinement-456',
        chunks: [
          {
            chunkId: 'chunk-1',
            content: 'First chunk about Bitcoin',
            position: 0,
            hash: 'hash1',
            metadata: {
              entities: [{ symbol: 'BTC', type: 'coin', confidence: 0.9 }],
              qualityScore: 0.85,
            },
          },
          {
            chunkId: 'chunk-2',
            content: 'Second chunk about Ethereum',
            position: 1,
            hash: 'hash2',
            metadata: {
              entities: [{ symbol: 'ETH', type: 'coin', confidence: 0.88 }],
              qualityScore: 0.82,
            },
          },
          {
            chunkId: 'chunk-3',
            content: 'Third chunk about DeFi',
            position: 2,
            hash: 'hash3',
            metadata: {
              entities: [
                { symbol: 'DEFI', type: 'protocol', confidence: 0.75 },
              ],
              qualityScore: 0.8,
            },
          },
        ],
        totalChunks: 3,
        averageQualityScore: 0.823,
      };

      mockReadRepository.findChunksByContentItemId.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result?.chunks).toHaveLength(3);
      expect(result?.totalChunks).toBe(3);
      expect(result?.chunks[0].position).toBe(0);
      expect(result?.chunks[1].position).toBe(1);
      expect(result?.chunks[2].position).toBe(2);
    });

    it('should return chunks with temporal context', async () => {
      // Arrange
      const query = new GetChunksByContentQuery('content-temporal');
      const expectedResult: GetChunksByContentResult = {
        contentItemId: 'content-temporal',
        refinementId: 'refinement-789',
        chunks: [
          {
            chunkId: 'chunk-1',
            content: 'Bitcoin will reach $100k by 2025',
            position: 0,
            hash: 'hash-temporal',
            metadata: {
              entities: [{ symbol: 'BTC', type: 'coin', confidence: 0.95 }],
              qualityScore: 0.88,
              temporalContext: {
                referenceDate: new Date('2025-01-01'),
                timeframe: 'future',
                confidence: 0.92,
              },
            },
          },
        ],
        totalChunks: 1,
        averageQualityScore: 0.88,
      };

      mockReadRepository.findChunksByContentItemId.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result?.chunks[0].metadata.temporalContext).toBeDefined();
      expect(result?.chunks[0].metadata.temporalContext?.timeframe).toBe(
        'future',
      );
    });

    it('should return chunks with multiple entities', async () => {
      // Arrange
      const query = new GetChunksByContentQuery('content-entities');
      const expectedResult: GetChunksByContentResult = {
        contentItemId: 'content-entities',
        refinementId: 'refinement-entities',
        chunks: [
          {
            chunkId: 'chunk-1',
            content: 'Bitcoin and Ethereum dominate the market',
            position: 0,
            hash: 'hash-entities',
            metadata: {
              entities: [
                {
                  symbol: 'BTC',
                  name: 'Bitcoin',
                  type: 'coin',
                  confidence: 0.95,
                },
                {
                  symbol: 'ETH',
                  name: 'Ethereum',
                  type: 'coin',
                  confidence: 0.93,
                },
              ],
              qualityScore: 0.9,
            },
          },
        ],
        totalChunks: 1,
        averageQualityScore: 0.9,
      };

      mockReadRepository.findChunksByContentItemId.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result?.chunks[0].metadata.entities).toHaveLength(2);
      expect(result?.chunks[0].metadata.entities[0].symbol).toBe('BTC');
      expect(result?.chunks[0].metadata.entities[1].symbol).toBe('ETH');
    });

    it('should return empty chunks array when refinement has no chunks', async () => {
      // Arrange
      const query = new GetChunksByContentQuery('content-empty');
      const expectedResult: GetChunksByContentResult = {
        contentItemId: 'content-empty',
        refinementId: 'refinement-empty',
        chunks: [],
        totalChunks: 0,
        averageQualityScore: 0,
      };

      mockReadRepository.findChunksByContentItemId.mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result?.chunks).toHaveLength(0);
      expect(result?.totalChunks).toBe(0);
    });

    it('should return null on repository error', async () => {
      // Arrange
      const query = new GetChunksByContentQuery('content-error');
      mockReadRepository.findChunksByContentItemId.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
      expect(mockReadRepository.findChunksByContentItemId).toHaveBeenCalledWith(
        'content-error',
      );
    });

    it('should handle repository throwing non-Error object', async () => {
      // Arrange
      const query = new GetChunksByContentQuery('content-weird-error');
      mockReadRepository.findChunksByContentItemId.mockRejectedValue(
        'String error',
      );

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeNull();
    });
  });
});
