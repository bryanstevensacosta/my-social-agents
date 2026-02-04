import { LangChainRecursiveChunker } from '../langchain-recursive-chunker';

describe('LangChainRecursiveChunker', () => {
  let chunker: LangChainRecursiveChunker;

  beforeEach(() => {
    chunker = new LangChainRecursiveChunker();
  });

  describe('chunk', () => {
    it('should chunk content into multiple pieces', async () => {
      const content = 'Bitcoin is a cryptocurrency. '.repeat(100);
      const config = { chunkSize: 200, chunkOverlap: 50 };

      const result = await chunker.chunk(content, config);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(1);
      result.forEach((chunk) => {
        expect(typeof chunk).toBe('string');
        expect(chunk.length).toBeLessThanOrEqual(config.chunkSize + 50); // Allow some tolerance
      });
    });

    it('should respect chunk size configuration', async () => {
      const content = 'Bitcoin is a cryptocurrency. '.repeat(50);
      const config = { chunkSize: 100, chunkOverlap: 20 };

      const result = await chunker.chunk(content, config);

      result.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(config.chunkSize + 50); // Allow tolerance for word boundaries
      });
    });

    it('should respect chunk overlap configuration', async () => {
      const content =
        'Bitcoin is a cryptocurrency. Ethereum is another. '.repeat(20);
      const config = { chunkSize: 150, chunkOverlap: 30 };

      const result = await chunker.chunk(content, config);

      // Check that consecutive chunks have some overlap
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const currentChunk = result[i];
          const nextChunk = result[i + 1];

          // Extract end of current chunk
          const endOfCurrent = currentChunk.slice(-config.chunkOverlap);

          // Check if next chunk starts with similar content
          const hasOverlap = nextChunk.includes(endOfCurrent.slice(0, 10));
          expect(hasOverlap || config.chunkOverlap === 0).toBe(true);
        }
      }
    });

    it('should handle empty content', async () => {
      const content = '';
      const config = { chunkSize: 200, chunkOverlap: 50 };

      const result = await chunker.chunk(content, config);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should handle very short content', async () => {
      const content = 'BTC';
      const config = { chunkSize: 200, chunkOverlap: 50 };

      const result = await chunker.chunk(content, config);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBe('BTC');
    });

    it('should handle very long content', async () => {
      const content = 'Bitcoin is a decentralized cryptocurrency. '.repeat(
        1000,
      );
      const config = { chunkSize: 500, chunkOverlap: 100 };

      const result = await chunker.chunk(content, config);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(10);
      result.forEach((chunk) => {
        expect(chunk.length).toBeGreaterThan(0);
        expect(chunk.length).toBeLessThanOrEqual(config.chunkSize + 100); // Allow tolerance
      });
    });

    it('should return array of strings', async () => {
      const content = 'Bitcoin price analysis for 2024.';
      const config = { chunkSize: 200, chunkOverlap: 50 };

      const result = await chunker.chunk(content, config);

      expect(Array.isArray(result)).toBe(true);
      result.forEach((chunk) => {
        expect(typeof chunk).toBe('string');
      });
    });

    it('should handle content with special characters', async () => {
      const content =
        'Bitcoin ($BTC) price: $50,000. Ethereum (ETH) price: $3,000. '.repeat(
          20,
        );
      const config = { chunkSize: 200, chunkOverlap: 50 };

      const result = await chunker.chunk(content, config);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((chunk) => {
        expect(chunk).toMatch(/[\$\(\)]/); // Should preserve special chars
      });
    });

    it('should handle content with newlines', async () => {
      const content = 'Bitcoin\n\nEthereum\n\nCardano\n\n'.repeat(20);
      const config = { chunkSize: 200, chunkOverlap: 50 };

      const result = await chunker.chunk(content, config);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle content with unicode characters', async () => {
      const content = 'Bitcoin 比特币 ビットコイン 비트코인. '.repeat(20);
      const config = { chunkSize: 200, chunkOverlap: 50 };

      const result = await chunker.chunk(content, config);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((chunk) => {
        expect(chunk.length).toBeGreaterThan(0);
      });
    });
  });
});
