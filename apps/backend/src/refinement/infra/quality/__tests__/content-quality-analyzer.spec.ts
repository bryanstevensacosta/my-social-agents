import { ContentQualityAnalyzer } from '../content-quality-analyzer';
import { QualityScore } from '@refinement/domain/value-objects/quality-score';
import { ChunkMetadata } from '@refinement/domain/interfaces/services/quality-analyzer';

describe('ContentQualityAnalyzer', () => {
  let analyzer: ContentQualityAnalyzer;

  beforeEach(() => {
    analyzer = new ContentQualityAnalyzer();
  });

  const createMetadata = (
    tokenCount: number,
    publishedAt: Date,
    entityCount: number = 0,
  ): ChunkMetadata => ({
    tokenCount,
    entities: Array(entityCount).fill(null),
    publishedAt,
  });

  describe('analyze', () => {
    it('should calculate length score correctly', async () => {
      const content = 'Bitcoin is a cryptocurrency. '.repeat(50); // ~1500 chars
      const metadata = createMetadata(300, new Date('2024-01-20T00:00:00Z'), 2);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.lengthScore).toBeGreaterThan(0);
      expect(result.lengthScore).toBeLessThanOrEqual(1);
    });

    it('should calculate coherence score correctly', async () => {
      const content =
        'Bitcoin is a decentralized cryptocurrency. It uses blockchain technology. The network is secure.';
      const metadata = createMetadata(20, new Date('2024-01-20T00:00:00Z'), 1);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.coherenceScore).toBeGreaterThan(0);
      expect(result.coherenceScore).toBeLessThanOrEqual(1);
    });

    it('should calculate relevance score correctly', async () => {
      const content = 'Bitcoin, Ethereum, and cryptocurrency market analysis.';
      const metadata = createMetadata(10, new Date('2024-01-20T00:00:00Z'), 3);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.relevanceScore).toBeGreaterThan(0);
      expect(result.relevanceScore).toBeLessThanOrEqual(1);
    });

    it('should calculate freshness score correctly', async () => {
      const content = 'Bitcoin price analysis.';
      const metadata = createMetadata(5, new Date(), 1); // Recent date

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.freshnessScore).toBeGreaterThan(0);
      expect(result.freshnessScore).toBeLessThanOrEqual(1);
      // Recent content should have high freshness
      expect(result.freshnessScore).toBeGreaterThan(0.8);
    });

    it('should return QualityScore value object', async () => {
      const content = 'Bitcoin analysis content.';
      const metadata = createMetadata(5, new Date('2024-01-20T00:00:00Z'), 1);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.overall).toBeDefined();
      expect(result.lengthScore).toBeDefined();
      expect(result.coherenceScore).toBeDefined();
      expect(result.relevanceScore).toBeDefined();
      expect(result.freshnessScore).toBeDefined();
    });

    it('should handle very short content', async () => {
      const content = 'BTC';
      const metadata = createMetadata(1, new Date('2024-01-20T00:00:00Z'), 1);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      // Short content should have low length score
      expect(result.lengthScore).toBeLessThan(0.5);
    });

    it('should handle very long content', async () => {
      const content = 'Bitcoin is a cryptocurrency. '.repeat(1000); // ~30,000 chars
      const metadata = createMetadata(
        5000,
        new Date('2024-01-20T00:00:00Z'),
        10,
      );

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      // Very long content should have lower length score
      expect(result.lengthScore).toBeLessThan(1.0);
    });

    it('should handle empty content', async () => {
      const content = '';
      const metadata = createMetadata(0, new Date('2024-01-20T00:00:00Z'), 0);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.lengthScore).toBeLessThan(0.5);
    });

    it('should penalize old content in freshness score', async () => {
      const content = 'Bitcoin analysis.';
      const oldDate = new Date('2020-01-01T00:00:00Z'); // 4 years old
      const metadata = createMetadata(5, oldDate, 1);

      const result = await analyzer.analyze(content, metadata);

      expect(result.freshnessScore).toBeLessThan(0.7);
    });

    it('should reward recent content in freshness score', async () => {
      const content = 'Bitcoin analysis.';
      const recentDate = new Date(); // Today
      const metadata = createMetadata(5, recentDate, 1);

      const result = await analyzer.analyze(content, metadata);

      expect(result.freshnessScore).toBeGreaterThan(0.8);
    });

    it('should calculate higher relevance for crypto-heavy content', async () => {
      const cryptoContent =
        'Bitcoin, Ethereum, Cardano, Solana, Polkadot, Chainlink, Polygon, Avalanche analysis.';
      const genericContent =
        'The weather is nice today and the sun is shining brightly.';

      const cryptoMetadata = createMetadata(
        15,
        new Date('2024-01-20T00:00:00Z'),
        8,
      );
      const genericMetadata = createMetadata(
        15,
        new Date('2024-01-20T00:00:00Z'),
        0,
      );

      const cryptoResult = await analyzer.analyze(
        cryptoContent,
        cryptoMetadata,
      );
      const genericResult = await analyzer.analyze(
        genericContent,
        genericMetadata,
      );

      expect(cryptoResult.relevanceScore).toBeGreaterThan(
        genericResult.relevanceScore,
      );
    });

    it('should calculate higher coherence for well-structured content', async () => {
      const coherentContent =
        'Bitcoin is a cryptocurrency. It uses blockchain technology. The network is decentralized. Miners validate transactions.';
      const incoherentContent =
        'Bitcoin. Blockchain. Random words. Technology. Price. Market.';

      const metadata = createMetadata(20, new Date('2024-01-20T00:00:00Z'), 2);

      const coherentResult = await analyzer.analyze(coherentContent, metadata);
      const incoherentResult = await analyzer.analyze(
        incoherentContent,
        metadata,
      );

      expect(coherentResult.coherenceScore).toBeGreaterThan(
        incoherentResult.coherenceScore,
      );
    });

    it('should handle content with special characters', async () => {
      const content =
        'Bitcoin ($BTC) price: $50,000. Ethereum (ETH) price: $3,000.';
      const metadata = createMetadata(15, new Date('2024-01-20T00:00:00Z'), 2);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.lengthScore).toBeGreaterThan(0);
    });

    it('should handle content with newlines', async () => {
      const content = 'Bitcoin\n\nEthereum\n\nCardano\n\nAnalysis content.';
      const metadata = createMetadata(10, new Date('2024-01-20T00:00:00Z'), 3);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.coherenceScore).toBeGreaterThan(0);
    });

    it('should handle content with unicode characters', async () => {
      const content = 'Bitcoin 比特币 ビットコイン 비트코인 analysis.';
      const metadata = createMetadata(10, new Date('2024-01-20T00:00:00Z'), 1);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.lengthScore).toBeGreaterThan(0);
    });

    it('should handle content with URLs', async () => {
      const content =
        'Bitcoin analysis at https://bitcoin.org and https://ethereum.org.';
      const metadata = createMetadata(15, new Date('2024-01-20T00:00:00Z'), 1);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.coherenceScore).toBeGreaterThan(0);
    });

    it('should handle content with numbers', async () => {
      const content =
        'Bitcoin price: $50,000. Market cap: $1,000,000,000. Volume: $50,000,000.';
      const metadata = createMetadata(20, new Date('2024-01-20T00:00:00Z'), 1);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      expect(result.lengthScore).toBeGreaterThan(0);
    });

    it('should return all scores between 0 and 1', async () => {
      const content =
        'Bitcoin and Ethereum analysis with detailed market insights.';
      const metadata = createMetadata(10, new Date('2024-01-20T00:00:00Z'), 2);

      const result = await analyzer.analyze(content, metadata);

      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(1);

      expect(result.lengthScore).toBeGreaterThanOrEqual(0);
      expect(result.lengthScore).toBeLessThanOrEqual(1);

      expect(result.coherenceScore).toBeGreaterThanOrEqual(0);
      expect(result.coherenceScore).toBeLessThanOrEqual(1);

      expect(result.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(result.relevanceScore).toBeLessThanOrEqual(1);

      expect(result.freshnessScore).toBeGreaterThanOrEqual(0);
      expect(result.freshnessScore).toBeLessThanOrEqual(1);
    });

    it('should handle content with mixed quality signals', async () => {
      const content = 'Bitcoin. Short. But crypto relevant.';
      const metadata = createMetadata(10, new Date('2024-01-20T00:00:00Z'), 1);

      const result = await analyzer.analyze(content, metadata);

      expect(result).toBeInstanceOf(QualityScore);
      // Short content = lower length score
      expect(result.lengthScore).toBeLessThan(1.0);
      // Crypto keywords = higher relevance
      expect(result.relevanceScore).toBeGreaterThan(0);
      // Recent = high freshness
      expect(result.freshnessScore).toBeGreaterThan(0.8);
    });
  });
});
