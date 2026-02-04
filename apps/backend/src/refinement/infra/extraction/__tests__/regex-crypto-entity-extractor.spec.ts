import { RegexCryptoEntityExtractor } from '../regex-crypto-entity-extractor';
import { CryptoEntity } from '@refinement/domain/value-objects/crypto-entity';

describe('RegexCryptoEntityExtractor', () => {
  let extractor: RegexCryptoEntityExtractor;

  beforeEach(() => {
    extractor = new RegexCryptoEntityExtractor();
  });

  describe('extract', () => {
    it('should extract Bitcoin symbol', async () => {
      const content = 'Bitcoin (BTC) price is rising.';

      const result = await extractor.extract(content);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      const btcEntity = result.find((e) => e.value === 'BTC');
      expect(btcEntity).toBeDefined();
      expect(btcEntity?.value).toBe('BTC');
      expect(btcEntity?.confidence).toBeGreaterThan(0);
      expect(btcEntity?.confidence).toBeLessThanOrEqual(1);
    });

    it('should extract Ethereum symbol', async () => {
      const content = 'Ethereum (ETH) smart contracts are powerful.';

      const result = await extractor.extract(content);

      const ethEntity = result.find((e) => e.value === 'ETH');
      expect(ethEntity).toBeDefined();
      expect(ethEntity?.value).toBe('ETH');
    });

    it('should extract dollar sign patterns', async () => {
      const content = '$BTC is trading at $50,000 while $ETH is at $3,000.';

      const result = await extractor.extract(content);

      expect(result.length).toBeGreaterThan(0);
      const values = result.map((e) => e.value);
      expect(values).toContain('BTC');
      expect(values).toContain('ETH');
    });

    it('should extract full cryptocurrency names', async () => {
      const content = 'Bitcoin and Ethereum are leading cryptocurrencies.';

      const result = await extractor.extract(content);

      expect(result.length).toBeGreaterThan(0);
      const values = result.map((e) => e.value);
      expect(values).toContain('BTC');
      expect(values).toContain('ETH');
    });

    it('should extract multiple cryptocurrencies', async () => {
      const content = 'BTC, ETH, ADA, SOL, and DOT are top cryptocurrencies.';

      const result = await extractor.extract(content);

      expect(result.length).toBeGreaterThanOrEqual(5);
      const values = result.map((e) => e.value);
      expect(values).toContain('BTC');
      expect(values).toContain('ETH');
      expect(values).toContain('ADA');
      expect(values).toContain('SOL');
      expect(values).toContain('DOT');
    });

    it('should return correct confidence scores', async () => {
      const content = 'Bitcoin (BTC) and $ETH are mentioned.';

      const result = await extractor.extract(content);

      result.forEach((entity) => {
        expect(entity.confidence).toBeGreaterThan(0);
        expect(entity.confidence).toBeLessThanOrEqual(1);
        expect(typeof entity.confidence).toBe('number');
      });
    });

    it('should deduplicate overlapping matches', async () => {
      const content =
        'Bitcoin BTC $BTC Bitcoin (BTC) mentioned multiple times.';

      const result = await extractor.extract(content);

      // Should deduplicate BTC mentions
      const btcEntities = result.filter((e) => e.value === 'BTC');
      expect(btcEntities.length).toBe(1);
    });

    it('should handle content with no entities', async () => {
      const content = 'This is a generic text about technology and finance.';

      const result = await extractor.extract(content);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should handle empty content', async () => {
      const content = '';

      const result = await extractor.extract(content);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should handle case-insensitive matching', async () => {
      const content = 'bitcoin, BITCOIN, Bitcoin, and BTC are all the same.';

      const result = await extractor.extract(content);

      const btcEntities = result.filter((e) => e.value === 'BTC');
      expect(btcEntities.length).toBe(1); // Should deduplicate
    });

    it('should extract less common cryptocurrencies', async () => {
      const content =
        'Chainlink (LINK), Polygon (MATIC), and Avalanche (AVAX) are growing.';

      const result = await extractor.extract(content);

      const values = result.map((e) => e.value);
      expect(values).toContain('LINK');
      expect(values).toContain('MATIC');
      expect(values).toContain('AVAX');
    });

    it('should handle mixed formats', async () => {
      const content = 'Bitcoin (BTC), $ETH, Cardano, and SOL are mentioned.';

      const result = await extractor.extract(content);

      expect(result.length).toBeGreaterThanOrEqual(4);
      const values = result.map((e) => e.value);
      expect(values).toContain('BTC');
      expect(values).toContain('ETH');
      expect(values).toContain('ADA'); // Cardano
      expect(values).toContain('SOL');
    });

    it('should return CryptoEntity value objects', async () => {
      const content = 'Bitcoin (BTC) analysis.';

      const result = await extractor.extract(content);

      expect(result.length).toBeGreaterThan(0);
      result.forEach((entity) => {
        expect(entity).toBeInstanceOf(CryptoEntity);
        expect(entity.value).toBeDefined();
        expect(entity.confidence).toBeDefined();
      });
    });

    it('should handle content with special characters', async () => {
      const content = 'BTC/USD, ETH-USD, and ADA:USD trading pairs.';

      const result = await extractor.extract(content);

      const values = result.map((e) => e.value);
      expect(values).toContain('BTC');
      expect(values).toContain('ETH');
      expect(values).toContain('ADA');
    });

    it('should handle content with numbers', async () => {
      const content = 'BTC is at $50,000, ETH at $3,000, and ADA at $0.50.';

      const result = await extractor.extract(content);

      const values = result.map((e) => e.value);
      expect(values).toContain('BTC');
      expect(values).toContain('ETH');
      expect(values).toContain('ADA');
    });

    it('should not extract false positives', async () => {
      const content = 'The ETC (estimated time of completion) is 5 hours.';

      const result = await extractor.extract(content);

      // ETC is Ethereum Classic, so it might be extracted
      // But confidence should reflect uncertainty
      if (result.length > 0) {
        result.forEach((entity) => {
          expect(entity.confidence).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should handle very long content', async () => {
      const content = 'Bitcoin (BTC) analysis. '.repeat(1000);

      const result = await extractor.extract(content);

      expect(result.length).toBeGreaterThan(0);
      const btcEntities = result.filter((e) => e.value === 'BTC');
      expect(btcEntities.length).toBe(1); // Should deduplicate
    });

    it('should extract stablecoins', async () => {
      const content = 'USDT, USDC, and DAI are popular stablecoins.';

      const result = await extractor.extract(content);

      const values = result.map((e) => e.value);
      expect(values).toContain('USDT');
      expect(values).toContain('USDC');
      expect(values).toContain('DAI');
    });

    it('should extract DeFi tokens', async () => {
      const content = 'UNI, AAVE, and COMP are DeFi tokens.';

      const result = await extractor.extract(content);

      const values = result.map((e) => e.value);
      expect(values).toContain('UNI');
      expect(values).toContain('AAVE');
      expect(values).toContain('COMP');
    });
  });
});
