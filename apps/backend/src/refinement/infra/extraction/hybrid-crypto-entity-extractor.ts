import { Injectable, Inject } from '@nestjs/common';
import { IEntityExtractor } from '@refinement/domain/interfaces/services/entity-extractor';
import { CryptoEntity } from '@refinement/domain/value-objects/crypto-entity';
import { CryptoEntityExtractor } from '@refinement/domain/services/crypto-entity-extractor';

/**
 * HybridCryptoEntityExtractor
 *
 * Combines regex and LLM extraction for optimal results.
 * Delegates to CryptoEntityExtractor domain service which orchestrates:
 * 1. Try regex extraction first (fast)
 * 2. If < 3 entities found, use LLM extraction (accurate)
 * 3. Merge and deduplicate results
 *
 * This is a thin infrastructure adapter that wraps the domain service.
 *
 * Requirements: Refinement 3
 * Design: Infrastructure Layer - Entity Extraction
 */
@Injectable()
export class HybridCryptoEntityExtractor implements IEntityExtractor {
  constructor(
    @Inject('CryptoEntityExtractor')
    private readonly domainService: CryptoEntityExtractor,
  ) {}

  /**
   * Extracts crypto entities using hybrid approach
   *
   * @param content - The content to extract entities from
   * @returns Array of extracted crypto entities with positions and confidence scores
   */
  async extract(content: string): Promise<CryptoEntity[]> {
    return this.domainService.extract(content);
  }
}
