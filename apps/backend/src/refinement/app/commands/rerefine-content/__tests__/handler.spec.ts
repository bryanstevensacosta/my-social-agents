import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { RerefineContentCommandHandler } from '../handler';
import { RerefineContentCommand } from '../command';
import { RerefineContentResult } from '../result';
import { ContentRefinement } from '@refinement/domain/aggregates/content-refinement';
import { Chunk } from '@refinement/domain/entities/chunk';
import { IContentRefinementWriteRepository } from '@refinement/domain/interfaces/repositories/content-refinement-write';
import { IContentRefinementFactory } from '@refinement/domain/interfaces/factories/content-refinement-factory';
import {
  IContentItemFactory,
  ContentItemData,
} from '@refinement/domain/interfaces/factories/content-item-factory';
import { IEntityExtractor } from '@refinement/domain/interfaces/services/entity-extractor';
import { ITemporalExtractor } from '@refinement/domain/interfaces/services/temporal-extractor';
import { IQualityAnalyzer } from '@refinement/domain/interfaces/services/quality-analyzer';
import { SemanticChunker } from '@refinement/domain/services/semantic-chunker';
import { RefinementConfig } from '@refinement/domain/value-objects/refinement-config';
import { RefinementStatus } from '@refinement/domain/value-objects/refinement-status';
import { ChunkHash } from '@refinement/domain/value-objects/chunk-hash';
import { ChunkPosition } from '@refinement/domain/value-objects/chunk-position';
import { QualityScore } from '@refinement/domain/value-objects/quality-score';
import { CryptoEntity } from '@refinement/domain/value-objects/crypto-entity';
import { TemporalContext } from '@refinement/domain/value-objects/temporal-context';

describe('RerefineContentCommandHandler', () => {
  let handler: RerefineContentCommandHandler;
  let mockRefinementFactory: jest.Mocked<IContentRefinementFactory>;
  let mockContentItemFactory: jest.Mocked<IContentItemFactory>;
  let mockWriteRepository: jest.Mocked<IContentRefinementWriteRepository>;
  let mockSemanticChunker: jest.Mocked<SemanticChunker>;
  let mockEntityExtractor: jest.Mocked<IEntityExtractor>;
  let mockTemporalExtractor: jest.Mocked<ITemporalExtractor>;
  let mockQualityAnalyzer: jest.Mocked<IQualityAnalyzer>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    // Create mocks
    mockRefinementFactory = {
      load: jest.fn(),
      loadByContentItemId: jest.fn(),
    } as any;

    mockContentItemFactory = {
      load: jest.fn(),
    } as any;

    mockWriteRepository = {
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockSemanticChunker = {
      chunk: jest.fn(),
    } as any;

    mockEntityExtractor = {
      extract: jest.fn(),
    } as any;

    mockTemporalExtractor = {
      extract: jest.fn(),
    } as any;

    mockQualityAnalyzer = {
      analyze: jest.fn(),
    } as any;

    mockEventBus = {
      publish: jest.fn(),
    } as any;

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RerefineContentCommandHandler,
        {
          provide: 'IContentRefinementFactory',
          useValue: mockRefinementFactory,
        },
        {
          provide: 'IContentItemFactory',
          useValue: mockContentItemFactory,
        },
        {
          provide: 'IContentRefinementWriteRepository',
          useValue: mockWriteRepository,
        },
        {
          provide: SemanticChunker,
          useValue: mockSemanticChunker,
        },
        {
          provide: 'IEntityExtractor',
          useValue: mockEntityExtractor,
        },
        {
          provide: 'ITemporalExtractor',
          useValue: mockTemporalExtractor,
        },
        {
          provide: 'IQualityAnalyzer',
          useValue: mockQualityAnalyzer,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<RerefineContentCommandHandler>(
      RerefineContentCommandHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const contentItemId = 'content-123';
    const reason = 'Updated extraction algorithm';
    const previousRefinementId = 'refinement-old-123';

    const createMockContentItem = (): ContentItemData => ({
      contentId: contentItemId,
      sourceId: 'source-123',
      normalizedContent:
        'Bitcoin price analysis with detailed market trends. '.repeat(10),
      metadata: {
        title: 'BTC Analysis',
        author: 'Analyst',
        publishedAt: new Date('2024-01-01'),
        sourceUrl: 'https://example.com/btc',
      },
      collectedAt: new Date('2024-01-01'),
    });

    const createMockPreviousRefinement = (
      status: RefinementStatus = RefinementStatus.completed(),
    ): ContentRefinement => {
      // Create at least one chunk for completed refinements (aggregate invariant)
      const chunks = status.isCompleted ? [createMockChunk(0)] : [];

      return ContentRefinement.reconstitute(previousRefinementId, 1, {
        contentItemId,
        chunks,
        status,
        error: null,
        startedAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-01'),
        rejectedAt: null,
        rejectionReason: null,
      });
    };

    const createMockChunk = (index: number): Chunk => {
      const content = `Bitcoin analysis chunk ${index}. `.repeat(50); // Make it long enough (200+ chars)
      // Generate a valid 64-character hex hash (not from content, just a valid hash string)
      const hashString = index.toString(16).padStart(64, '0');
      return Chunk.create({
        contentId: previousRefinementId,
        content,
        position: ChunkPosition.create(index, index * 100, (index + 1) * 100),
        hash: ChunkHash.create(hashString),
      });
    };

    it('should successfully re-refine content with new configuration', async () => {
      // Arrange
      const command = new RerefineContentCommand(
        contentItemId,
        reason,
        RefinementConfig.default(),
      );

      const previousRefinement = createMockPreviousRefinement();
      const contentItem = createMockContentItem();
      const chunks = [createMockChunk(0), createMockChunk(1)];

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(contentItem);
      mockSemanticChunker.chunk.mockResolvedValue(chunks);
      mockEntityExtractor.extract.mockResolvedValue([
        CryptoEntity.token('BTC', 0.95, 0, 3),
      ]);
      mockTemporalExtractor.extract.mockResolvedValue(
        TemporalContext.create(new Date('2024-01-01')),
      );
      mockQualityAnalyzer.analyze.mockResolvedValue(
        QualityScore.create(0.8, 0.8, 0.8, 0.8, 0.8),
      );

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('completed');
      expect(result.contentItemId).toBe(contentItemId);
      expect(result.previousRefinementId).toBe(previousRefinementId);
      expect(result.reason).toBe(reason);
      expect(result.chunkCount).toBe(2);
      expect(result.averageQualityScore).toBeGreaterThan(0);
      expect(mockWriteRepository.save).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
    });

    it('should reject when no previous refinement exists', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      mockRefinementFactory.loadByContentItemId.mockResolvedValue(null);

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('No previous refinement found');
      expect(result.previousRefinementId).toBe('');
      expect(mockWriteRepository.save).not.toHaveBeenCalled();
    });

    it('should reject when previous refinement is still processing', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      const processingRefinement = createMockPreviousRefinement(
        RefinementStatus.processing(),
      );

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        processingRefinement,
      );

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe(
        'Previous refinement is still processing',
      );
      expect(result.previousRefinementId).toBe(previousRefinementId);
      expect(mockContentItemFactory.load).not.toHaveBeenCalled();
    });

    it('should reject when content item not found', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      const previousRefinement = createMockPreviousRefinement();

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(null);

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('Content item not found');
      expect(result.previousRefinementId).toBe(previousRefinementId);
    });

    it('should reject when content is too short', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      const previousRefinement = createMockPreviousRefinement();
      const shortContentItem: ContentItemData = {
        ...createMockContentItem(),
        normalizedContent: 'Too short',
      };

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(shortContentItem);

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe(
        'Content too short (minimum 100 characters)',
      );
    });

    it('should reject when too many chunks are created', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      const previousRefinement = createMockPreviousRefinement();
      const contentItem = createMockContentItem();
      const tooManyChunks = Array.from({ length: 101 }, (_, i) =>
        createMockChunk(i),
      );

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(contentItem);
      mockSemanticChunker.chunk.mockResolvedValue(tooManyChunks);

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('Too many chunks (maximum 100)');
      expect(mockWriteRepository.save).toHaveBeenCalled(); // Saves rejected refinement
    });

    it('should reject when no valid chunks after quality filtering', async () => {
      // Arrange
      const command = new RerefineContentCommand(
        contentItemId,
        reason,
        RefinementConfig.create({ qualityThreshold: 0.9 }),
      );

      const previousRefinement = createMockPreviousRefinement();
      const contentItem = createMockContentItem();
      const chunks = [createMockChunk(0)];

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(contentItem);
      mockSemanticChunker.chunk.mockResolvedValue(chunks);
      mockEntityExtractor.extract.mockResolvedValue([]);
      mockTemporalExtractor.extract.mockResolvedValue(
        TemporalContext.create(new Date('2024-01-01')),
      );
      mockQualityAnalyzer.analyze.mockResolvedValue(
        QualityScore.create(0.2, 0.2, 0.2, 0.2, 0.2),
      );

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe(
        'No valid chunks after quality filtering',
      );
    });

    it('should use custom configuration when provided', async () => {
      // Arrange
      const customConfig = RefinementConfig.create({
        chunkSize: 600,
        chunkOverlap: 100,
        qualityThreshold: 0.5,
      });
      const command = new RerefineContentCommand(
        contentItemId,
        reason,
        customConfig,
      );

      const previousRefinement = createMockPreviousRefinement();
      const contentItem = createMockContentItem();
      const chunks = [createMockChunk(0)];

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(contentItem);
      mockSemanticChunker.chunk.mockResolvedValue(chunks);
      mockEntityExtractor.extract.mockResolvedValue([]);
      mockTemporalExtractor.extract.mockResolvedValue(
        TemporalContext.create(new Date('2024-01-01')),
      );
      mockQualityAnalyzer.analyze.mockResolvedValue(
        QualityScore.create(0.6, 0.6, 0.6, 0.6, 0.6),
      );

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('completed');
      expect(mockSemanticChunker.chunk).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          chunkSize: 600,
          chunkOverlap: 100,
        }),
      );
    });

    it('should return failed result when error occurs', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      const error = new Error('Database connection failed');

      mockRefinementFactory.loadByContentItemId.mockRejectedValue(error);

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('REREFINEMENT_ERROR');
      expect(result.error?.message).toBe('Database connection failed');
    });

    it('should enrich chunks with entities when found', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      const previousRefinement = createMockPreviousRefinement();
      const contentItem = createMockContentItem();
      const chunks = [createMockChunk(0)];

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(contentItem);
      mockSemanticChunker.chunk.mockResolvedValue(chunks);
      mockEntityExtractor.extract.mockResolvedValue([
        CryptoEntity.token('BTC', 0.95, 0, 3),
        CryptoEntity.token('ETH', 0.9, 10, 13),
      ]);
      mockTemporalExtractor.extract.mockResolvedValue(
        TemporalContext.create(new Date('2024-01-01')),
      );
      mockQualityAnalyzer.analyze.mockResolvedValue(
        QualityScore.create(0.8, 0.8, 0.8, 0.8, 0.8),
      );

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('completed');
      expect(mockEntityExtractor.extract).toHaveBeenCalled();
    });

    it('should set temporal context when found', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      const previousRefinement = createMockPreviousRefinement();
      const contentItem = createMockContentItem();
      const chunks = [createMockChunk(0)];

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(contentItem);
      mockSemanticChunker.chunk.mockResolvedValue(chunks);
      mockEntityExtractor.extract.mockResolvedValue([]);
      mockTemporalExtractor.extract.mockResolvedValue(
        TemporalContext.create(new Date('2024-01-01'), new Date('2024-01-15')),
      );
      mockQualityAnalyzer.analyze.mockResolvedValue(
        QualityScore.create(0.8, 0.8, 0.8, 0.8, 0.8),
      );

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('completed');
      expect(mockTemporalExtractor.extract).toHaveBeenCalled();
    });

    it('should calculate average quality score correctly', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      const previousRefinement = createMockPreviousRefinement();
      const contentItem = createMockContentItem();
      const chunks = [
        createMockChunk(0),
        createMockChunk(1),
        createMockChunk(2),
      ];

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(contentItem);
      mockSemanticChunker.chunk.mockResolvedValue(chunks);
      mockEntityExtractor.extract.mockResolvedValue([]);
      mockTemporalExtractor.extract.mockResolvedValue(
        TemporalContext.create(new Date('2024-01-01')),
      );

      // Different quality scores for each chunk
      mockQualityAnalyzer.analyze
        .mockResolvedValueOnce(QualityScore.create(0.6, 0.6, 0.6, 0.6, 0.6))
        .mockResolvedValueOnce(QualityScore.create(0.8, 0.8, 0.8, 0.8, 0.8))
        .mockResolvedValueOnce(QualityScore.create(0.7, 0.7, 0.7, 0.7, 0.7));

      // Act
      const result: RerefineContentResult = await handler.execute(command);

      // Assert
      expect(result.status).toBe('completed');
      expect(result.averageQualityScore).toBeCloseTo(0.7, 1); // (0.6 + 0.8 + 0.7) / 3
    });

    it('should publish domain events after successful refinement', async () => {
      // Arrange
      const command = new RerefineContentCommand(contentItemId, reason);
      const previousRefinement = createMockPreviousRefinement();
      const contentItem = createMockContentItem();
      const chunks = [createMockChunk(0)];

      mockRefinementFactory.loadByContentItemId.mockResolvedValue(
        previousRefinement,
      );
      mockContentItemFactory.load.mockResolvedValue(contentItem);
      mockSemanticChunker.chunk.mockResolvedValue(chunks);
      mockEntityExtractor.extract.mockResolvedValue([]);
      mockTemporalExtractor.extract.mockResolvedValue(
        TemporalContext.create(new Date('2024-01-01')),
      );
      mockQualityAnalyzer.analyze.mockResolvedValue(
        QualityScore.create(0.8, 0.8, 0.8, 0.8, 0.8),
      );

      // Act
      await handler.execute(command);

      // Assert
      // Should publish: ContentRefinementStarted, ChunkAdded (1x), RefinementCompleted
      expect(mockEventBus.publish).toHaveBeenCalledTimes(3);
    });
  });
});
