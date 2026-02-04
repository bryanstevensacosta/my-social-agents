import { LangChainMarkdownChunker } from '../langchain-markdown-chunker';

describe('LangChainMarkdownChunker', () => {
  let chunker: LangChainMarkdownChunker;

  beforeEach(() => {
    chunker = new LangChainMarkdownChunker();
  });

  describe('chunk', () => {
    it('should chunk markdown content into multiple pieces', async () => {
      const content = `
# Bitcoin Analysis

Bitcoin is a cryptocurrency.

## Price History

The price has fluctuated.

### 2023 Performance

Bitcoin reached new highs.

### 2024 Outlook

Analysts predict growth.
      `.repeat(10);
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(1);
      result.forEach((chunk) => {
        expect(typeof chunk).toBe('string');
        expect(chunk.length).toBeLessThanOrEqual(chunkSize + 100); // Allow tolerance
      });
    });

    it('should respect markdown structure', async () => {
      const content = `
# Main Title

Content under main title.

## Section 1

Content in section 1.

## Section 2

Content in section 2.
      `;
      const chunkSize = 100;
      const chunkOverlap = 20;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      // Markdown chunker should try to keep sections together
      result.forEach((chunk) => {
        expect(chunk.length).toBeGreaterThan(0);
      });
    });

    it('should handle markdown with code blocks', async () => {
      const content = `
# Bitcoin Code Example

\`\`\`javascript
const bitcoin = {
  symbol: 'BTC',
  price: 50000
};
\`\`\`

## Analysis

The code shows Bitcoin data structure.
      `.repeat(5);
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle markdown with lists', async () => {
      const content = `
# Top Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Cardano (ADA)
- Solana (SOL)

## Market Analysis

1. Bitcoin leads the market
2. Ethereum has strong fundamentals
3. Altcoins show promise
      `.repeat(5);
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle markdown with links', async () => {
      const content = `
# Bitcoin Resources

Check out [Bitcoin.org](https://bitcoin.org) for more info.

Read the [whitepaper](https://bitcoin.org/bitcoin.pdf).
      `.repeat(10);
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const content = '';
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should handle very short markdown', async () => {
      const content = '# BTC';
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toContain('BTC');
    });

    it('should handle markdown with tables', async () => {
      const content = `
# Cryptocurrency Prices

| Coin | Price | Change |
|------|-------|--------|
| BTC  | $50k  | +5%    |
| ETH  | $3k   | +3%    |
      `.repeat(5);
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle markdown with blockquotes', async () => {
      const content = `
# Bitcoin Quote

> Bitcoin is a technological tour de force.
> - Bill Gates

## Analysis

The quote shows mainstream acceptance.
      `.repeat(5);
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return array of strings', async () => {
      const content = '# Bitcoin\n\nAnalysis content.';
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((chunk) => {
        expect(typeof chunk).toBe('string');
      });
    });
  });
});
