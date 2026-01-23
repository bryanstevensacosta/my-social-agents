import { HybridCryptoEntityExtractor } from '../hybrid-crypto-entity-extractor';
import { CryptoEntityExtractor } from '@refinement/domain/services/crypto-entity-extractor';
import { CryptoEntity } from '@refinement/domain/value-objects/crypto-entity';
import { CryptoEntityType } from '@refinement/domain/value-objects/crypto-entity-type';

describe('HybridCryptoEntityExtractor', () => {
  let extractor: HybridCryptoEntityExtractor;
  let mockDomainService: jest.Mocked<CryptoEntityExtractor>;

  beforeEach(() => {
    mockDomainService = {
      extract: jest.fn(),
    } as any;

    extractor = new HybridCryptoEntityExtractor(mockDomainService);
  });

  describe('extract', () => {
    it('should delegate to domain service', async () => {
      const content = 'Bitcoin (BTC) and Ethereum (ETH) analysis.';

      const expectedResults = [
        CryptoEntity.create(CryptoEntityType.TOKEN, 'BTC', 0.9, 10, 13),
        CryptoEntity.create(CryptoEntityType.TOKEN, 'ETH', 0.95, 29, 32),
      ];

      mockDomainService.extract.mockResolvedValue(expectedResults);

      const result = await extractor.extract(content);

      expect(mockDomainService.extract).toHaveBeenCalledWith(content);
      expect(result).toBe(expectedResults);
      expect(result.length).toBe(2);
    });

    it('should return empty array when domain service returns empty', async () => {
      const content = 'Generic technology content.';

      mockDomainService.extract.mockResolvedValue([]);

      const result = await extractor.extract(content);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should handle empty content', async () => {
      const content = '';

      mockDomainService.extract.mockResolvedValue([]);

      const result = await extractor.extract(content);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
    });

    it('should return CryptoEntity value objects', async () => {
      const content = 'Bitcoin analysis.';

      const expectedResults = [
        CryptoEntity.create(CryptoEntityType.TOKEN, 'BTC', 0.9, 0, 7),
      ];

      mockDomainService.extract.mockResolvedValue(expectedResults);

      const result = await extractor.extract(content);

      result.forEach((entity) => {
        expect(entity).toBeInstanceOf(CryptoEntity);
        expect(entity.value).toBeDefined();
        expect(entity.confidence).toBeDefined();
      });
    });
  });
});
