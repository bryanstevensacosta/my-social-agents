import { Injectable, Logger } from '@nestjs/common';
import {
  IQualityAnalyzer,
  ChunkMetadata,
} from '@refinement/domain/interfaces/services/quality-analyzer';
import { QualityScore } from '@refinement/domain/value-objects/quality-score';

/**
 * ContentQualityAnalyzer
 *
 * Analyzes content quality based on multiple factors:
 * - Length: Token count (optimal range: 100-500 tokens)
 * - Coherence: Basic heuristics (sentence structure, punctuation)
 * - Relevance: Entity density (crypto entities per 100 tokens)
 * - Freshness: Recency of publication date
 *
 * Each component is scored 0.0-1.0, then combined into overall score.
 *
 * Requirements: Refinement 5
 * Design: Infrastructure Layer - Quality Analysis
 */
@Injectable()
export class ContentQualityAnalyzer implements IQualityAnalyzer {
  private readonly logger = new Logger(ContentQualityAnalyzer.name);

  // Quality thresholds
  private readonly OPTIMAL_MIN_TOKENS = 100;
  private readonly OPTIMAL_MAX_TOKENS = 500;
  private readonly MIN_SENTENCES = 2;
  private readonly FRESHNESS_DAYS = 365; // 1 year

  /**
   * Analyzes content quality and returns a quality score
   *
   * @param content - The content to analyze
   * @param metadata - Additional metadata for quality calculation
   * @returns Quality score with component scores
   */
  analyze(content: string, metadata: ChunkMetadata): Promise<QualityScore> {
    this.logger.debug(
      `Analyzing quality for content (${metadata.tokenCount} tokens, ${metadata.entities.length} entities)`,
    );

    // Calculate component scores
    const lengthScore = this.calculateLengthScore(metadata.tokenCount);
    const coherenceScore = this.calculateCoherenceScore(content);
    const relevanceScore = this.calculateRelevanceScore(
      metadata.tokenCount,
      metadata.entities.length,
    );
    const freshnessScore = this.calculateFreshnessScore(metadata.publishedAt);

    // Calculate overall score (weighted average)
    const overall =
      lengthScore * 0.25 +
      coherenceScore * 0.25 +
      relevanceScore * 0.3 +
      freshnessScore * 0.2;

    this.logger.debug(
      `Quality scores: overall=${overall.toFixed(2)}, length=${lengthScore.toFixed(2)}, ` +
        `coherence=${coherenceScore.toFixed(2)}, ` +
        `relevance=${relevanceScore.toFixed(2)}, ` +
        `freshness=${freshnessScore.toFixed(2)}`,
    );

    return Promise.resolve(
      QualityScore.create(
        overall,
        lengthScore,
        coherenceScore,
        relevanceScore,
        freshnessScore,
      ),
    );
  }

  /**
   * Calculates length score based on token count
   *
   * Scoring:
   * - < 50 tokens: 0.3 (too short)
   * - 50-100 tokens: 0.6 (short but acceptable)
   * - 100-500 tokens: 1.0 (optimal)
   * - 500-1000 tokens: 0.8 (long but acceptable)
   * - > 1000 tokens: 0.5 (too long)
   */
  private calculateLengthScore(tokenCount: number): number {
    if (tokenCount < 50) return 0.3;
    if (tokenCount < this.OPTIMAL_MIN_TOKENS) return 0.6;
    if (tokenCount <= this.OPTIMAL_MAX_TOKENS) return 1.0;
    if (tokenCount <= 1000) return 0.8;
    return 0.5;
  }

  /**
   * Calculates coherence score based on content structure
   *
   * Heuristics:
   * - Has multiple sentences (not just fragments)
   * - Has proper punctuation
   * - Has reasonable sentence length
   * - Has paragraph structure
   */
  private calculateCoherenceScore(content: string): number {
    let score = 0.0;

    // Check for multiple sentences
    const sentences = content
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    if (sentences.length >= this.MIN_SENTENCES) {
      score += 0.3;
    }

    // Check for proper punctuation
    const hasPunctuation = /[.!?,;:]/.test(content);
    if (hasPunctuation) {
      score += 0.2;
    }

    // Check for reasonable sentence length (not too short, not too long)
    const avgSentenceLength =
      sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    if (avgSentenceLength >= 20 && avgSentenceLength <= 200) {
      score += 0.3;
    }

    // Check for paragraph structure
    const paragraphs = content
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 0);
    if (paragraphs.length >= 2) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculates relevance score based on entity density
   *
   * Scoring:
   * - 0 entities: 0.0 (not relevant)
   * - 1-2 entities per 100 tokens: 0.5 (somewhat relevant)
   * - 3-5 entities per 100 tokens: 1.0 (highly relevant)
   * - > 5 entities per 100 tokens: 0.8 (possibly over-tagged)
   */
  private calculateRelevanceScore(
    tokenCount: number,
    entityCount: number,
  ): number {
    if (entityCount === 0) return 0.0;

    // Calculate entity density (entities per 100 tokens)
    const density = (entityCount / tokenCount) * 100;

    if (density < 1) return 0.3;
    if (density < 2) return 0.5;
    if (density <= 5) return 1.0;
    return 0.8; // Too many entities
  }

  /**
   * Calculates freshness score based on publication date
   *
   * Scoring:
   * - < 7 days: 1.0 (very fresh)
   * - < 30 days: 0.9 (fresh)
   * - < 90 days: 0.8 (recent)
   * - < 180 days: 0.7 (somewhat recent)
   * - < 365 days: 0.6 (within a year)
   * - > 365 days: 0.5 (old)
   */
  private calculateFreshnessScore(publishedAt: Date): number {
    const now = new Date();
    const ageInDays = Math.floor(
      (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (ageInDays < 7) return 1.0;
    if (ageInDays < 30) return 0.9;
    if (ageInDays < 90) return 0.8;
    if (ageInDays < 180) return 0.7;
    if (ageInDays < this.FRESHNESS_DAYS) return 0.6;
    return 0.5;
  }
}
