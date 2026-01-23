import { LLMCryptoEntityExtractor } from '../llm-crypto-entity-extractor';
import { CryptoEntity } from '@refinement/domain/value-objects/crypto-entity';

describe('LLMCryptoEntityExtractor', () => {
  let extractor: LLMCryptoEntityExtractor;

  beforeEach(() => {
    extractor = new LLMCryptoEntityExtractor();
  });

  describe('extract', () => {
    it('should return empty array (stub implementation)', async () => {
      const content = 'Bitcoin (BTC) price is rising.';

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

    it('should handle very long content', async () => {
      const content = 'Bitcoin analysis. '.repeat(1000);

      const result = await extractor.extract(content);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should return CryptoEntity array type', async () => {
      const content = 'Ethereum smart contracts.';

      const result = await extractor.extract(content);

      expect(Array.isArray(result)).toBe(true);
      // Stub returns empty array, but type should be CryptoEntity[]
      result.forEach((entity) => {
        expect(entity).toBeInstanceOf(CryptoEntity);
      });
    });

    it('should not throw errors', async () => {
      const content = 'Test content with special chars: $@#%^&*()';

      await expect(extractor.extract(content)).resolves.not.toThrow();
    });

    // TODO: Add real tests when LLM implementation is complete
    // These tests should verify:
    // - Extracts entities using LLM
    // - Returns confidence scores from LLM
    // - Handles API errors gracefully
    // - Respects rate limits
    // - Caches results appropriately
  });
});
