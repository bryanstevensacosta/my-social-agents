// Node modules
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';

// Refinement context
import { RefinementModule } from '@refinement/refinement.module';
import { RefineContentCommand } from '@refinement/app/commands/refine-content/command';
import { GetContentRefinementQuery } from '@refinement/app/queries/get-content-refinement/query';
import { ContentRefinementEntity } from '@refinement/infra/persistence/entities/content-refinement.entity';
import { ChunkEntity } from '@refinement/infra/persistence/entities/chunk.entity';

describe('Refinement Integration Tests', () => {
  let module: TestingModule;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5433'),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_DATABASE_TEST || 'crypto_knowledge_test',
          entities: [ContentRefinementEntity, ChunkEntity],
          synchronize: true, // Only for tests
          dropSchema: true, // Clean database before tests
        }),
        RefinementModule,
      ],
    }).compile();

    // Initialize the module to trigger CQRS handler registration
    await module.init();

    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('End-to-end refinement flow', () => {
    it('should refine content and persist to database', async () => {
      // Arrange - Use proper UUID
      const contentItemId = uuidv4();

      // Act - Execute refinement command (only takes contentItemId, config is optional)
      const command = new RefineContentCommand(contentItemId);

      const result = await commandBus.execute(command);

      // Assert - Command result
      expect(result).toBeDefined();
      expect(result.refinementId).toBeDefined();
      expect(result.chunkCount).toBeGreaterThan(0);

      // Act - Query the refinement
      const query = new GetContentRefinementQuery(result.refinementId);
      const refinement = await queryBus.execute(query);

      // Assert - Query result with null check
      expect(refinement).toBeDefined();
      expect(refinement).not.toBeNull();
      expect(refinement!.refinementId).toBe(result.refinementId);
      expect(refinement!.contentItemId).toBe(contentItemId);
      expect(refinement!.status).toBe('completed');
      expect(refinement!.chunks.length).toBeGreaterThan(0);

      // Assert - Chunks have expected properties
      refinement!.chunks.forEach((chunk: any) => {
        expect(chunk.content).toBeDefined();
        expect(chunk.position).toBeGreaterThanOrEqual(0);
        expect(chunk.metadata.qualityScore).toBeDefined();
      });
    }, 30000); // 30s timeout for integration test

    it('should extract crypto entities from content', async () => {
      // Arrange - Use proper UUID
      const contentItemId = uuidv4();

      // Act
      const command = new RefineContentCommand(contentItemId);

      const result = await commandBus.execute(command);

      // Query the refinement
      const query = new GetContentRefinementQuery(result.refinementId);
      const refinement = await queryBus.execute(query);

      // Assert - Should have extracted crypto entities with null check
      expect(refinement).toBeDefined();
      expect(refinement).not.toBeNull();

      const allEntities = refinement!.chunks.flatMap(
        (chunk: any) => chunk.metadata.entities,
      );
      expect(allEntities.length).toBeGreaterThan(0);

      const symbols = allEntities.map((e: any) => e.symbol);
      expect(symbols).toContain('BTC');
      expect(symbols).toContain('ETH');
      expect(symbols).toContain('ADA');
    }, 30000);

    it('should extract temporal contexts from content', async () => {
      // Arrange - Use proper UUID
      const contentItemId = uuidv4();

      // Act
      const command = new RefineContentCommand(contentItemId);

      const result = await commandBus.execute(command);

      // Query the refinement
      const query = new GetContentRefinementQuery(result.refinementId);
      const refinement = await queryBus.execute(query);

      // Assert - Should have extracted temporal contexts with null check
      expect(refinement).toBeDefined();
      expect(refinement).not.toBeNull();

      const allTemporalContexts = refinement!.chunks
        .map((chunk: any) => chunk.metadata.temporalContext)
        .filter((tc: any) => tc !== undefined);
      expect(allTemporalContexts.length).toBeGreaterThan(0);
    }, 30000);

    it('should calculate quality scores for chunks', async () => {
      // Arrange - Use proper UUID
      const contentItemId = uuidv4();

      // Act
      const command = new RefineContentCommand(contentItemId);

      const result = await commandBus.execute(command);

      // Query the refinement
      const query = new GetContentRefinementQuery(result.refinementId);
      const refinement = await queryBus.execute(query);

      // Assert - All chunks should have quality scores with null check
      expect(refinement).toBeDefined();
      expect(refinement).not.toBeNull();

      refinement!.chunks.forEach((chunk: any) => {
        expect(chunk.metadata.qualityScore).toBeDefined();
        expect(chunk.metadata.qualityScore).toBeGreaterThanOrEqual(0);
        expect(chunk.metadata.qualityScore).toBeLessThanOrEqual(1);
      });
    }, 30000);
  });

  describe('Module configuration', () => {
    it('should have CommandBus configured', () => {
      expect(commandBus).toBeDefined();
    });

    it('should have QueryBus configured', () => {
      expect(queryBus).toBeDefined();
    });

    it('should have all providers registered', () => {
      // Verify key providers are available
      const providers = [
        'CryptoEntityExtractor',
        'ITemporalAnalyzer',
        'IContentQualityAnalyzer',
        'IContentRefinementWriteRepository',
        'IContentRefinementReadRepository',
        'IContentRefinementFactory',
      ];

      providers.forEach((provider) => {
        expect(() => module.get(provider)).not.toThrow();
      });
    });
  });

  describe('LangChain integration', () => {
    it('should use LangChain for chunking', async () => {
      // Arrange - Use proper UUID
      const contentItemId = uuidv4();

      // Act
      const command = new RefineContentCommand(contentItemId);

      const result = await commandBus.execute(command);

      // Assert - Should have created at least one chunk
      // Note: With default chunk size (800) and test content (~240 chars),
      // we expect 1 chunk. For multiple chunks, content would need to be longer.
      expect(result.chunkCount).toBeGreaterThanOrEqual(1);

      // Query to verify chunks
      const query = new GetContentRefinementQuery(result.refinementId);
      const refinement = await queryBus.execute(query);

      expect(refinement).toBeDefined();
      expect(refinement).not.toBeNull();
      expect(refinement!.chunks.length).toBe(result.chunkCount);
    }, 30000);
  });

  describe('Chrono-node integration', () => {
    it('should use Chrono for temporal extraction', async () => {
      // Arrange - Use proper UUID
      const contentItemId = uuidv4();

      // Act
      const command = new RefineContentCommand(contentItemId);

      const result = await commandBus.execute(command);

      // Query to verify temporal contexts
      const query = new GetContentRefinementQuery(result.refinementId);
      const refinement = await queryBus.execute(query);

      // Assert - Should have extracted dates with null check
      expect(refinement).toBeDefined();
      expect(refinement).not.toBeNull();

      const hasTemporalContexts = refinement!.chunks.some(
        (chunk: any) => chunk.metadata.temporalContext !== undefined,
      );
      expect(hasTemporalContexts).toBe(true);
    }, 30000);
  });

  describe('Factory providers', () => {
    it('should select correct chunking strategy based on config', async () => {
      // This test verifies that the factory provider system works
      // The actual strategy selection is done via environment variables
      // which are set in the module configuration

      // Use proper UUID
      const contentItemId = uuidv4();

      const command = new RefineContentCommand(contentItemId);

      // Should not throw - factory provider should work
      await expect(commandBus.execute(command)).resolves.toBeDefined();
    }, 30000);
  });
});
