import { Injectable, Inject } from '@nestjs/common';
import { ChunkHash } from '@refinement/domain/value-objects/chunk-hash';
import { IHashing } from '@/shared/domain/interfaces/crypto/hashing';

/**
 * ChunkHashGenerator Domain Service
 *
 * Generates ChunkHash value objects using cryptographic hashing.
 * Keeps ChunkHash pure by delegating hash computation to infrastructure.
 *
 * Pattern: Domain Service with Infrastructure Dependency
 * - ChunkHash (VO) = WHAT it is (validation only)
 * - ChunkHashGenerator (Service) = HOW to create it (uses infrastructure)
 * - IHashing (Interface) = Infrastructure abstraction
 *
 * Requirements: Refinement 7.1, 8.1
 * Design: Domain Services section - ChunkHashGenerator
 */
@Injectable()
export class ChunkHashGenerator {
  constructor(
    @Inject('IHashing')
    private readonly hashing: IHashing,
  ) {}

  /**
   * Generates a ChunkHash from chunk content
   *
   * @param content - The chunk content to hash
   * @returns A ChunkHash value object with 64-character hex hash
   */
  generate(content: string): ChunkHash {
    const hashValue = this.hashing.sha256(content);
    return ChunkHash.create(hashValue);
  }

  /**
   * Creates a ChunkHash from an existing hash string
   *
   * @param hash - A 64-character hexadecimal hash string
   * @returns A ChunkHash value object
   * @throws Error if hash is invalid
   */
  fromString(hash: string): ChunkHash {
    return ChunkHash.create(hash);
  }
}
