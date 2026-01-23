import { Injectable, Logger } from '@nestjs/common';
import { IEntityExtractor } from '@refinement/domain/interfaces/services/entity-extractor';
import { CryptoEntity } from '@refinement/domain/value-objects/crypto-entity';
import { CryptoEntityType } from '@refinement/domain/value-objects/crypto-entity-type';

/**
 * LLMCryptoEntityExtractor
 *
 * Extracts crypto entities using Large Language Model (LLM).
 * More accurate than regex but slower and requires API access.
 *
 * Features:
 * - Understands context and complex mentions
 * - Can extract entities not in predefined lists
 * - Handles abbreviations, nicknames, and informal references
 * - Returns confidence scores based on LLM certainty
 *
 * Implementation:
 * - Currently returns empty array (stub implementation)
 * - TODO: Integrate with OpenAI, Anthropic, or local LLM
 * - TODO: Implement prompt engineering for entity extraction
 * - TODO: Parse LLM response and create CryptoEntity objects
 *
 * Requirements: Refinement 3
 * Design: Infrastructure Layer - Entity Extraction
 */
@Injectable()
export class LLMCryptoEntityExtractor implements IEntityExtractor {
  private readonly logger = new Logger(LLMCryptoEntityExtractor.name);

  /**
   * Extracts crypto entities using LLM
   *
   * @param content - The content to extract entities from
   * @returns Array of extracted crypto entities with positions and confidence scores
   *
   * @remarks
   * This is a stub implementation. In production, this would:
   * 1. Send content to LLM with entity extraction prompt
   * 2. Parse LLM response (JSON with entities, positions, confidence)
   * 3. Create CryptoEntity objects from parsed response
   * 4. Return entities with high confidence scores (0.7-1.0)
   */
  extract(content: string): Promise<CryptoEntity[]> {
    this.logger.debug(
      `LLM extraction called for content length: ${content.length}`,
    );

    // TODO: Implement LLM integration
    // For now, return empty array (will be used in hybrid mode as fallback)
    this.logger.warn(
      'LLM extraction not implemented yet, returning empty array',
    );

    return Promise.resolve([]);
  }

  /**
   * Example LLM prompt for entity extraction (for future implementation)
   *
   * @private
   * @remarks Currently unused - will be used when LLM integration is implemented
   */
  // @ts-expect-error - Intentionally unused, reserved for future LLM integration
  private buildPrompt(content: string): string {
    return `
Extract all cryptocurrency entities from the following text.
For each entity, provide:
- value: The crypto symbol or name (e.g., BTC, ETH, Bitcoin)
- type: Entity type (e.g., "TOKEN", "PROTOCOL", "BLOCKCHAIN")
- startPos: Character position where entity starts
- endPos: Character position where entity ends
- confidence: Your confidence score (0.0 to 1.0)

Return the result as a JSON array.

Text:
${content}

Example output:
[
  {
    "value": "BTC",
    "type": "TOKEN",
    "startPos": 15,
    "endPos": 18,
    "confidence": 0.95
  }
]
    `.trim();
  }

  /**
   * Parses LLM response and creates CryptoEntity objects (for future implementation)
   *
   * @private
   * @remarks Currently unused - will be used when LLM integration is implemented
   */
  // @ts-expect-error - Intentionally unused, reserved for future LLM integration
  private parseResponse(response: string): CryptoEntity[] {
    try {
      const parsed = JSON.parse(response);
      if (!Array.isArray(parsed)) {
        this.logger.error('LLM response is not an array');
        return [];
      }

      return parsed.map((item) => {
        // Determine entity type (default to TOKEN if not recognized)
        const type =
          item.type === 'PROTOCOL'
            ? CryptoEntityType.PROTOCOL
            : CryptoEntityType.TOKEN;

        return CryptoEntity.create(
          type,
          item.value,
          item.confidence,
          item.startPos,
          item.endPos,
        );
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to parse LLM response: ${errorMessage}`);
      return [];
    }
  }
}
