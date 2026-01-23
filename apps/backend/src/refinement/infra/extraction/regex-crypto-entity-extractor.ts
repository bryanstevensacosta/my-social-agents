import { Injectable } from '@nestjs/common';
import { IEntityExtractor } from '@refinement/domain/interfaces/services/entity-extractor';
import { CryptoEntity } from '@refinement/domain/value-objects/crypto-entity';
import { CryptoEntityType } from '@refinement/domain/value-objects/crypto-entity-type';

/**
 * RegexCryptoEntityExtractor
 *
 * Extracts crypto entities using regex pattern matching.
 * Fast and deterministic, but limited to known patterns.
 *
 * Patterns:
 * - Crypto symbols: BTC, ETH, SOL, etc. (uppercase, 2-5 chars)
 * - Dollar signs: $BTC, $ETH (common in social media)
 * - Full names: Bitcoin, Ethereum, Solana (case-insensitive)
 *
 * Confidence Scoring:
 * - Symbol match: 0.9 (high confidence)
 * - Dollar sign match: 0.85 (high confidence, social media context)
 * - Full name match: 0.8 (good confidence)
 *
 * Requirements: Refinement 3
 * Design: Infrastructure Layer - Entity Extraction
 */
@Injectable()
export class RegexCryptoEntityExtractor implements IEntityExtractor {
  // Known crypto symbols (top 100 by market cap)
  private readonly KNOWN_SYMBOLS = new Set([
    'BTC',
    'ETH',
    'USDT',
    'BNB',
    'SOL',
    'XRP',
    'USDC',
    'ADA',
    'AVAX',
    'DOGE',
    'TRX',
    'DOT',
    'MATIC',
    'LINK',
    'SHIB',
    'UNI',
    'ATOM',
    'LTC',
    'XLM',
    'ALGO',
    'VET',
    'FIL',
    'HBAR',
    'APT',
    'ARB',
    'OP',
    'NEAR',
    'ICP',
    'INJ',
    'STX',
  ]);

  // Known crypto full names (lowercase for case-insensitive matching)
  private readonly KNOWN_NAMES = new Map<string, string>([
    ['bitcoin', 'BTC'],
    ['ethereum', 'ETH'],
    ['tether', 'USDT'],
    ['binance coin', 'BNB'],
    ['solana', 'SOL'],
    ['ripple', 'XRP'],
    ['cardano', 'ADA'],
    ['avalanche', 'AVAX'],
    ['dogecoin', 'DOGE'],
    ['tron', 'TRX'],
    ['polkadot', 'DOT'],
    ['polygon', 'MATIC'],
    ['chainlink', 'LINK'],
    ['shiba inu', 'SHIB'],
    ['uniswap', 'UNI'],
    ['cosmos', 'ATOM'],
    ['litecoin', 'LTC'],
    ['stellar', 'XLM'],
    ['algorand', 'ALGO'],
    ['vechain', 'VET'],
    ['filecoin', 'FIL'],
    ['hedera', 'HBAR'],
    ['aptos', 'APT'],
    ['arbitrum', 'ARB'],
    ['optimism', 'OP'],
    ['near protocol', 'NEAR'],
    ['internet computer', 'ICP'],
    ['injective', 'INJ'],
    ['stacks', 'STX'],
  ]);

  /**
   * Extracts crypto entities using regex patterns
   *
   * @param content - The content to extract entities from
   * @returns Array of extracted crypto entities with positions and confidence scores
   */
  extract(content: string): Promise<CryptoEntity[]> {
    const entities: CryptoEntity[] = [];

    // 1. Extract symbol patterns (BTC, ETH, etc.)
    entities.push(...this.extractSymbols(content));

    // 2. Extract dollar sign patterns ($BTC, $ETH)
    entities.push(...this.extractDollarSigns(content));

    // 3. Extract full name patterns (Bitcoin, Ethereum)
    entities.push(...this.extractFullNames(content));

    // 4. Deduplicate by position (keep highest confidence)
    return Promise.resolve(this.deduplicateByPosition(entities));
  }

  /**
   * Extracts crypto symbols (BTC, ETH, etc.)
   */
  private extractSymbols(content: string): CryptoEntity[] {
    const entities: CryptoEntity[] = [];
    // Match uppercase 2-5 letter words that are known crypto symbols
    const symbolRegex = /\b([A-Z]{2,5})\b/g;
    let match: RegExpExecArray | null;

    while ((match = symbolRegex.exec(content)) !== null) {
      const symbol = match[1];
      if (this.KNOWN_SYMBOLS.has(symbol)) {
        entities.push(
          CryptoEntity.create(
            CryptoEntityType.TOKEN,
            symbol,
            0.9,
            match.index,
            match.index + symbol.length,
          ),
        );
      }
    }

    return entities;
  }

  /**
   * Extracts dollar sign patterns ($BTC, $ETH)
   */
  private extractDollarSigns(content: string): CryptoEntity[] {
    const entities: CryptoEntity[] = [];
    // Match $SYMBOL pattern (common in social media)
    const dollarRegex = /\$([A-Z]{2,5})\b/g;
    let match: RegExpExecArray | null;

    while ((match = dollarRegex.exec(content)) !== null) {
      const symbol = match[1];
      if (this.KNOWN_SYMBOLS.has(symbol)) {
        entities.push(
          CryptoEntity.create(
            CryptoEntityType.TOKEN,
            symbol,
            0.85,
            match.index,
            match.index + match[0].length,
          ),
        );
      }
    }

    return entities;
  }

  /**
   * Extracts full crypto names (Bitcoin, Ethereum, etc.)
   */
  private extractFullNames(content: string): CryptoEntity[] {
    const entities: CryptoEntity[] = [];
    const lowerContent = content.toLowerCase();

    // Sort by length (longest first) to match "Shiba Inu" before "Shiba"
    const sortedNames = Array.from(this.KNOWN_NAMES.entries()).sort(
      (a, b) => b[0].length - a[0].length,
    );

    for (const [name, symbol] of sortedNames) {
      let startIndex = 0;
      while ((startIndex = lowerContent.indexOf(name, startIndex)) !== -1) {
        // Check word boundaries
        const beforeChar = startIndex > 0 ? content[startIndex - 1] : ' ';
        const afterChar =
          startIndex + name.length < content.length
            ? content[startIndex + name.length]
            : ' ';

        if (this.isWordBoundary(beforeChar) && this.isWordBoundary(afterChar)) {
          entities.push(
            CryptoEntity.create(
              CryptoEntityType.TOKEN,
              symbol,
              0.8,
              startIndex,
              startIndex + name.length,
            ),
          );
        }

        startIndex += name.length;
      }
    }

    return entities;
  }

  /**
   * Checks if a character is a word boundary
   */
  private isWordBoundary(char: string): boolean {
    return /[\s.,;:!?()[\]{}'"<>]/.test(char);
  }

  /**
   * Deduplicates entities by position, keeping highest confidence
   */
  private deduplicateByPosition(entities: CryptoEntity[]): CryptoEntity[] {
    if (entities.length === 0) return [];

    // Sort by start position, then by confidence (descending)
    const sorted = entities.sort((a, b) => {
      if (a.startPos !== b.startPos) {
        return a.startPos - b.startPos;
      }
      return b.confidence - a.confidence;
    });

    const deduplicated: CryptoEntity[] = [];
    let lastEnd = -1;

    for (const entity of sorted) {
      // If this entity doesn't overlap with the last one, keep it
      if (entity.startPos >= lastEnd) {
        deduplicated.push(entity);
        lastEnd = entity.endPos;
      }
      // If it overlaps but has higher confidence, replace the last one
      else if (
        deduplicated.length > 0 &&
        entity.confidence > deduplicated[deduplicated.length - 1].confidence
      ) {
        deduplicated[deduplicated.length - 1] = entity;
        lastEnd = entity.endPos;
      }
    }

    return deduplicated;
  }
}
