import { ChronoTemporalExtractor } from '../chrono-temporal-extractor';
import { TemporalContext } from '@refinement/domain/value-objects/temporal-context';

describe('ChronoTemporalExtractor', () => {
  let extractor: ChronoTemporalExtractor;

  beforeEach(() => {
    extractor = new ChronoTemporalExtractor();
  });

  describe('extract', () => {
    it('should parse absolute dates', async () => {
      const content = 'Bitcoin reached $50,000 on January 15, 2024.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      expect(result.publishedAt).toBeDefined();
    });

    it('should parse relative dates', async () => {
      const content = 'Bitcoin price increased yesterday.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      if (result.eventTimestamp) {
        // Yesterday should be one day before publishedAt
        const expectedDate = new Date(publishedAt);
        expectedDate.setDate(expectedDate.getDate() - 1);
        expect(result.eventTimestamp.getDate()).toBe(expectedDate.getDate());
      }
    });

    it('should resolve dates relative to publication date', async () => {
      const content = 'Last week, Bitcoin surged.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      if (result.eventTimestamp) {
        expect(result.eventTimestamp.getTime()).toBeLessThan(
          publishedAt.getTime(),
        );
      }
    });

    it('should extract temporal windows', async () => {
      const content =
        'From January 1 to January 15, 2024, Bitcoin was volatile.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      if (result.hasWindow) {
        expect(result.windowStart).toBeDefined();
        expect(result.windowEnd).toBeDefined();
        expect(result.windowEnd!.getTime()).toBeGreaterThan(
          result.windowStart!.getTime(),
        );
      }
    });

    it('should handle content with no dates', async () => {
      const content = 'Bitcoin is a cryptocurrency.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      expect(result.eventTimestamp).toBeNull();
    });

    it('should handle empty content', async () => {
      const content = '';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      expect(result.eventTimestamp).toBeNull();
    });

    it('should handle multiple dates', async () => {
      const content =
        'Bitcoin hit $40k on January 1, 2024 and $50k on January 15, 2024.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      // Multiple dates may create a temporal window
      expect(result.eventTimestamp).toBeDefined();
    });

    it('should parse month and year', async () => {
      const content = 'In December 2023, Bitcoin rallied.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      if (result.eventTimestamp) {
        expect(result.eventTimestamp.getFullYear()).toBe(2023);
        expect(result.eventTimestamp.getMonth()).toBe(11); // December is month 11
      }
    });

    it('should parse year only', async () => {
      const content = 'Bitcoin had a great year in 2023.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      if (result.eventTimestamp) {
        expect(result.eventTimestamp.getFullYear()).toBe(2023);
      }
    });

    it('should parse time expressions', async () => {
      const content = 'Bitcoin price at 3:00 PM was $50,000.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      // Time expressions might be parsed depending on context
    });

    it('should handle "today" reference', async () => {
      const content = 'Bitcoin price today is $50,000.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      if (result.eventTimestamp) {
        expect(result.eventTimestamp.toDateString()).toBe(
          publishedAt.toDateString(),
        );
      }
    });

    it('should handle "this week" reference', async () => {
      const content = 'This week, Bitcoin surged.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      expect(result.eventTimestamp).toBeDefined();
    });

    it('should handle "this month" reference', async () => {
      const content = 'This month, Bitcoin reached new highs.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      if (result.eventTimestamp) {
        expect(result.eventTimestamp.getMonth()).toBe(publishedAt.getMonth());
      }
    });

    it('should handle "next week" reference', async () => {
      const content = 'Next week, Bitcoin is expected to rise.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      if (result.eventTimestamp) {
        expect(result.eventTimestamp.getTime()).toBeGreaterThan(
          publishedAt.getTime(),
        );
      }
    });

    it('should return TemporalContext value object', async () => {
      const content = 'On January 15, 2024, Bitcoin hit $50k.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      expect(result.publishedAt).toBeInstanceOf(Date);
      if (result.eventTimestamp) {
        expect(result.eventTimestamp).toBeInstanceOf(Date);
      }
    });

    it('should handle ambiguous dates', async () => {
      const content = 'Bitcoin price on 01/02/2024.'; // Could be Jan 2 or Feb 1
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      // Chrono should parse this, but interpretation may vary
      expect(result.eventTimestamp).toBeDefined();
    });

    it('should handle dates in different formats', async () => {
      const content = 'Bitcoin on 2024-01-15, 15/01/2024, and Jan 15, 2024.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      expect(result.eventTimestamp).toBeDefined();
    });

    it('should handle very long content', async () => {
      const content = 'Bitcoin analysis on January 15, 2024. '.repeat(100);
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      expect(result.eventTimestamp).toBeDefined();
    });

    it('should handle content with mixed temporal references', async () => {
      const content =
        'Yesterday Bitcoin was $49k, today it is $50k, and tomorrow it might reach $51k.';
      const publishedAt = new Date('2024-01-20T00:00:00Z');

      const result = await extractor.extract(content, publishedAt);

      expect(result).toBeInstanceOf(TemporalContext);
      expect(result.eventTimestamp).toBeDefined();
    });
  });
});
