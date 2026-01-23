import { Injectable, Logger } from '@nestjs/common';
import * as chrono from 'chrono-node';
import { ITemporalExtractor } from '@refinement/domain/interfaces/services/temporal-extractor';
import { TemporalContext } from '@refinement/domain/value-objects/temporal-context';

/**
 * ChronoTemporalExtractor
 *
 * Extracts temporal information from content using chrono-node library.
 * Handles absolute dates, relative dates, and temporal windows.
 *
 * Features:
 * - Parses absolute dates: "January 1, 2024", "2024-01-01"
 * - Parses relative dates: "yesterday", "last week", "3 days ago"
 * - Resolves dates relative to publication date
 * - Extracts temporal windows: "from January to March"
 * - Handles multiple date formats and languages
 *
 * Requirements: Refinement 4
 * Design: Infrastructure Layer - Temporal Analysis
 */
@Injectable()
export class ChronoTemporalExtractor implements ITemporalExtractor {
  private readonly logger = new Logger(ChronoTemporalExtractor.name);

  /**
   * Extracts temporal context from content
   *
   * @param content - The content to analyze
   * @param publishedAt - The publication date of the content (reference date)
   * @returns Temporal context with event dates and windows
   */
  extract(content: string, publishedAt: Date): Promise<TemporalContext> {
    this.logger.debug(
      `Extracting temporal context from content (published: ${publishedAt.toISOString()})`,
    );

    // Parse dates using chrono with reference date
    const parsedDates = chrono.parse(content, publishedAt);

    if (parsedDates.length === 0) {
      this.logger.debug('No temporal information found in content');
      return Promise.resolve(TemporalContext.create(publishedAt));
    }

    // Extract event date (first mentioned date)
    const eventDate = this.extractEventDate(parsedDates);

    // Extract temporal window (if range is mentioned)
    const { startDate, endDate } = this.extractTemporalWindow(parsedDates);

    this.logger.debug(
      `Extracted temporal context: eventDate=${eventDate?.toISOString()}, ` +
        `startDate=${startDate?.toISOString()}, endDate=${endDate?.toISOString()}`,
    );

    // If we have a temporal window, use withWindow factory
    if (startDate && endDate) {
      return Promise.resolve(
        TemporalContext.withWindow(
          publishedAt,
          startDate,
          endDate,
          eventDate || undefined,
        ),
      );
    }

    // Otherwise, use create with event timestamp
    return Promise.resolve(
      TemporalContext.create(publishedAt, eventDate || undefined),
    );
  }

  /**
   * Extracts the primary event date (first mentioned date)
   */
  private extractEventDate(parsedDates: chrono.ParsedResult[]): Date | null {
    if (parsedDates.length === 0) return null;

    // Use the first parsed date as the event date
    const firstDate = parsedDates[0];
    return firstDate.start.date();
  }

  /**
   * Extracts temporal window (start and end dates)
   */
  private extractTemporalWindow(parsedDates: chrono.ParsedResult[]): {
    startDate: Date | null;
    endDate: Date | null;
  } {
    if (parsedDates.length === 0) {
      return { startDate: null, endDate: null };
    }

    // Check if any parsed result has an end date (indicates a range)
    const rangeResult = parsedDates.find((result) => result.end !== null);

    if (rangeResult && rangeResult.end) {
      return {
        startDate: rangeResult.start.date(),
        endDate: rangeResult.end.date(),
      };
    }

    // If multiple dates are mentioned, use first and last as window
    if (parsedDates.length >= 2) {
      const dates = parsedDates.map((result) => result.start.date());
      dates.sort((a, b) => a.getTime() - b.getTime());

      return {
        startDate: dates[0],
        endDate: dates[dates.length - 1],
      };
    }

    // Single date, no window
    return { startDate: null, endDate: null };
  }
}
