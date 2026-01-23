import { LangChainCodeChunker } from '../langchain-code-chunker';

describe('LangChainCodeChunker', () => {
  let chunker: LangChainCodeChunker;

  beforeEach(() => {
    chunker = new LangChainCodeChunker();
  });

  describe('chunk', () => {
    it('should chunk JavaScript code into multiple pieces', async () => {
      const content = `
function calculateBitcoinPrice() {
  const basePrice = 50000;
  const volatility = Math.random() * 1000;
  return basePrice + volatility;
}

function getEthereumPrice() {
  const basePrice = 3000;
  const volatility = Math.random() * 100;
  return basePrice + volatility;
}

function analyzeMarket() {
  const btc = calculateBitcoinPrice();
  const eth = getEthereumPrice();
  return { btc, eth };
}
      `.repeat(10);
      const chunkSize = 300;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(1);
      result.forEach((chunk) => {
        expect(typeof chunk).toBe('string');
        expect(chunk.length).toBeLessThanOrEqual(chunkSize + 100); // Allow tolerance
      });
    });

    it('should respect code structure', async () => {
      const content = `
class Bitcoin {
  constructor(price) {
    this.price = price;
  }

  getPrice() {
    return this.price;
  }
}

class Ethereum {
  constructor(price) {
    this.price = price;
  }

  getPrice() {
    return this.price;
  }
}
      `;
      const chunkSize = 200;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      // Code chunker should try to keep functions/classes together
      result.forEach((chunk) => {
        expect(chunk.length).toBeGreaterThan(0);
      });
    });

    it('should handle TypeScript code', async () => {
      const content = `
interface CryptoAsset {
  symbol: string;
  price: number;
  marketCap: number;
}

class Portfolio {
  private assets: CryptoAsset[] = [];

  addAsset(asset: CryptoAsset): void {
    this.assets.push(asset);
  }

  getTotalValue(): number {
    return this.assets.reduce((sum, asset) => sum + asset.price, 0);
  }
}
      `.repeat(5);
      const chunkSize = 300;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Python code', async () => {
      const content = `
def calculate_bitcoin_price():
    base_price = 50000
    volatility = random.random() * 1000
    return base_price + volatility

def get_ethereum_price():
    base_price = 3000
    volatility = random.random() * 100
    return base_price + volatility

class CryptoPortfolio:
    def __init__(self):
        self.assets = []
    
    def add_asset(self, asset):
        self.assets.append(asset)
      `.repeat(5);
      const chunkSize = 300;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle code with comments', async () => {
      const content = `
// Bitcoin price calculator
function calculateBitcoinPrice() {
  // Base price in USD
  const basePrice = 50000;
  
  /* 
   * Add random volatility
   * to simulate market fluctuations
   */
  const volatility = Math.random() * 1000;
  
  return basePrice + volatility;
}
      `.repeat(5);
      const chunkSize = 300;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty content', async () => {
      const content = '';
      const chunkSize = 300;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should handle very short code', async () => {
      const content = 'const btc = 50000;';
      const chunkSize = 300;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toContain('btc');
    });

    it('should handle code with nested structures', async () => {
      const content = `
const cryptoData = {
  bitcoin: {
    symbol: 'BTC',
    price: 50000,
    data: {
      marketCap: 1000000000,
      volume: 50000000,
      holders: {
        retail: 1000000,
        institutional: 10000
      }
    }
  },
  ethereum: {
    symbol: 'ETH',
    price: 3000,
    data: {
      marketCap: 500000000,
      volume: 30000000
    }
  }
};
      `.repeat(5);
      const chunkSize = 300;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle code with string literals', async () => {
      const content = `
const message = "Bitcoin price is $50,000";
const template = \`
  Current BTC price: \${btcPrice}
  Current ETH price: \${ethPrice}
\`;
const multiline = """
  This is a multiline
  string about Bitcoin
""";
      `.repeat(5);
      const chunkSize = 300;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return array of strings', async () => {
      const content = 'function test() { return true; }';
      const chunkSize = 300;
      const chunkOverlap = 50;

      const result = await chunker.chunk(content, { chunkSize, chunkOverlap });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((chunk) => {
        expect(typeof chunk).toBe('string');
      });
    });
  });
});
