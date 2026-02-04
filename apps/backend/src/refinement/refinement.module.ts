// ===== Node Modules =====
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// ===== Shared Modules =====
import { SharedCryptoModule } from '@/shared/infra/crypto/shared-crypto.module';

// ===== Refinement Context - Infrastructure (Entities) =====
import { ContentRefinementEntity } from '@refinement/infra/persistence/entities/content-refinement.entity';
import { ChunkEntity } from '@refinement/infra/persistence/entities/chunk.entity';

// ===== Refinement Context - Application (Command Handlers) =====
import { RefineContentCommandHandler } from '@refinement/app/commands/refine-content/handler';
import { RerefineContentCommandHandler } from '@refinement/app/commands/rerefine-content/handler';

// ===== Refinement Context - Application (Query Handlers) =====
import { GetContentRefinementHandler } from '@refinement/app/queries/get-content-refinement/handler';
import { GetChunksByContentHandler } from '@refinement/app/queries/get-chunks-by-content/handler';

// ===== Refinement Context - Application (Event Handlers) =====
import { TriggerRefinementOnContentIngested } from '@refinement/app/events/content-ingested/handler';

// ===== Refinement Context - Domain (Services) =====
import { SemanticChunker } from '@refinement/domain/services/semantic-chunker';
import { ChunkHashGenerator } from '@refinement/domain/services/chunk-hash-generator';
import { CryptoEntityExtractor } from '@refinement/domain/services/crypto-entity-extractor';
import { TemporalAnalyzer } from '@refinement/domain/services/temporal-analyzer';
import { ContentQualityAnalyzer as DomainContentQualityAnalyzer } from '@refinement/domain/services/content-quality-analyzer';
import { DuplicateDetector } from '@refinement/domain/services/duplicate-detector';

// ===== Refinement Context - Infrastructure (Repositories) =====
import { TypeOrmContentRefinementWriteRepository } from '@refinement/infra/persistence/repositories/typeorm-content-refinement-write';
import { ContentRefinementReadRepository } from '@refinement/infra/persistence/repositories/content-refinement-read';

// ===== Refinement Context - Infrastructure (Factories) =====
import { TypeOrmContentRefinementFactory } from '@refinement/infra/persistence/factories/typeorm-content-refinement-factory';

// ===== Refinement Context - Infrastructure (Chunking Strategies) =====
import {
  LangChainRecursiveChunker,
  LangChainMarkdownChunker,
  LangChainCodeChunker,
} from '@refinement/infra/chunking';

// ===== Refinement Context - Infrastructure (Entity Extraction) =====
import {
  RegexCryptoEntityExtractor,
  LLMCryptoEntityExtractor,
  HybridCryptoEntityExtractor,
} from '@refinement/infra/extraction';

// ===== Refinement Context - Infrastructure (Temporal Analysis) =====
import { ChronoTemporalExtractor } from '@refinement/infra/temporal';

// ===== Refinement Context - Infrastructure (Quality Analysis) =====
import { ContentQualityAnalyzer as InfraContentQualityAnalyzer } from '@refinement/infra/quality';

/**
 * RefinementModule
 *
 * NestJS module for the Content Refinement bounded context.
 * Handles semantic chunking and crypto-specific metadata enrichment.
 *
 * Responsibilities:
 * - Content refinement (RefineContentCommand, RerefineContentCommand)
 * - Content queries (GetContentRefinementQuery, GetChunksByContentQuery)
 * - Semantic chunking with configurable strategies (Recursive, Markdown, Code)
 * - Crypto entity extraction (Regex, LLM, Hybrid)
 * - Temporal context analysis (Chrono-based)
 * - Quality scoring and filtering
 *
 * Architecture:
 * - Follows Clean Architecture with strict layer separation
 * - Implements DDD bounded context principles
 * - Uses CQRS for command/query separation
 * - Domain services depend on interfaces (DIP)
 * - Infrastructure implementations are pluggable
 *
 * Configuration:
 * - Chunking strategy selected via factory (default: recursive)
 * - Entity extraction method selected via factory (default: hybrid)
 * - All infrastructure implementations use dependency injection
 *
 * Requirements: Refinement 1-11
 * Design: Application Layer - Module Configuration
 */
@Module({
  imports: [
    // CQRS module for command/query/event handling
    CqrsModule,

    // Config module for environment variables
    ConfigModule,

    // Shared crypto module for hashing services
    SharedCryptoModule,

    // TypeORM entities for persistence
    TypeOrmModule.forFeature([ContentRefinementEntity, ChunkEntity]),
  ],
  providers: [
    // ===== Command Handlers =====
    RefineContentCommandHandler,
    RerefineContentCommandHandler,

    // ===== Query Handlers =====
    GetContentRefinementHandler,
    GetChunksByContentHandler,

    // ===== Event Handlers =====
    TriggerRefinementOnContentIngested,

    // ===== Factories =====
    {
      provide: 'IContentRefinementFactory',
      useClass: TypeOrmContentRefinementFactory,
    },

    // ===== Repositories =====
    {
      provide: 'IContentRefinementWriteRepository',
      useClass: TypeOrmContentRefinementWriteRepository,
    },
    {
      provide: 'IContentRefinementReadRepository',
      useClass: ContentRefinementReadRepository,
    },

    // ===== Domain Services =====
    // SemanticChunker (orchestrates chunking strategy)
    SemanticChunker,

    // ChunkHashGenerator (generates chunk hashes)
    ChunkHashGenerator,

    // CryptoEntityExtractor (orchestrates hybrid extraction)
    {
      provide: 'CryptoEntityExtractor',
      useClass: CryptoEntityExtractor,
    },

    // TemporalAnalyzer (orchestrates temporal extraction)
    {
      provide: 'ITemporalAnalyzer',
      useClass: TemporalAnalyzer,
    },

    // ContentQualityAnalyzer (orchestrates quality analysis)
    {
      provide: 'IContentQualityAnalyzer',
      useClass: DomainContentQualityAnalyzer,
    },

    // DuplicateDetector (orchestrates duplicate detection)
    {
      provide: 'IDuplicateDetector',
      useClass: DuplicateDetector,
    },

    // ===== Infrastructure - Chunking Strategies =====
    // Factory provider to select chunking strategy based on config
    {
      provide: 'IChunkingStrategy',
      useFactory: (config: ConfigService) => {
        const strategy = config.get('CHUNKING_STRATEGY', 'recursive');
        switch (strategy) {
          case 'markdown':
            return new LangChainMarkdownChunker();
          case 'code':
            return new LangChainCodeChunker();
          case 'recursive':
          default:
            return new LangChainRecursiveChunker();
        }
      },
      inject: [ConfigService],
    },

    // Register all chunking strategies for direct injection if needed
    LangChainRecursiveChunker,
    LangChainMarkdownChunker,
    LangChainCodeChunker,

    // ===== Infrastructure - Entity Extraction =====
    // Individual extractors (for hybrid use)
    RegexCryptoEntityExtractor,
    LLMCryptoEntityExtractor,

    // Factory provider to select extraction method based on config
    {
      provide: 'IEntityExtractor',
      useFactory: (config: ConfigService) => {
        const method = config.get('EXTRACTION_METHOD', 'regex');
        switch (method) {
          case 'llm':
            return new LLMCryptoEntityExtractor();
          case 'hybrid':
            return new HybridCryptoEntityExtractor(
              new CryptoEntityExtractor(
                new RegexCryptoEntityExtractor(),
                new LLMCryptoEntityExtractor(),
              ),
            );
          case 'regex':
          default:
            return new RegexCryptoEntityExtractor();
        }
      },
      inject: [ConfigService],
    },

    // ===== Infrastructure - Temporal Analysis =====
    {
      provide: 'ITemporalExtractor',
      useClass: ChronoTemporalExtractor,
    },

    // ===== Infrastructure - Quality Analysis =====
    {
      provide: 'IQualityAnalyzer',
      useClass: InfraContentQualityAnalyzer,
    },

    // ===== Mock Factory for Testing =====
    // TODO: Replace with real ContentItemFactory from Ingestion context
    {
      provide: 'IContentItemFactory',
      useValue: {
        load: (contentItemId: string) => ({
          contentId: contentItemId,
          normalizedContent: `Bitcoin analysis content for ${contentItemId}. Bitcoin (BTC) reached $50,000 on January 15, 2024. Ethereum (ETH) also saw gains. Cardano (ADA) is showing promise. This is a comprehensive analysis of the cryptocurrency market with sufficient length for testing purposes.`,
          metadata: {
            title: 'Crypto Market Analysis',
            author: 'Test Author',
            publishedAt: new Date('2024-01-20T00:00:00Z'),
            sourceUrl: 'https://example.com/crypto-analysis',
          },
        }),
      },
    },
  ],
  exports: [
    // Export command handlers for use in other modules
    RefineContentCommandHandler,
    RerefineContentCommandHandler,

    // Export query handlers
    GetContentRefinementHandler,
    GetChunksByContentHandler,

    // Export factories
    'IContentRefinementFactory',

    // Export repositories
    'IContentRefinementWriteRepository',
    'IContentRefinementReadRepository',

    // Export domain services for cross-context usage
    SemanticChunker, // Concrete class, not interface
    'CryptoEntityExtractor',
    'ITemporalAnalyzer',
    'IContentQualityAnalyzer',
    'IDuplicateDetector',

    // Export infrastructure implementations (if needed by other contexts)
    'IChunkingStrategy',
    'IEntityExtractor',
    'ITemporalExtractor',
    'IQualityAnalyzer',
  ],
})
export class RefinementModule {}
