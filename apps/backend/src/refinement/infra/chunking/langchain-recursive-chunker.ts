import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import type {
  IChunkingStrategy,
  ChunkingConfig,
} from '@refinement/domain/interfaces/services/chunking-strategy';

/**
 * LangChainRecursiveChunker
 *
 * Implements chunking using LangChain's RecursiveCharacterTextSplitter.
 * Best for general text content (articles, documents, etc.).
 *
 * Strategy:
 * - Tries to split on paragraphs first (\n\n)
 * - Falls back to sentences (. ! ?)
 * - Falls back to words (spaces)
 * - Falls back to characters as last resort
 *
 * Requirements: Refinement 2
 * Design: Infrastructure Layer - Chunking Strategies
 */
@Injectable()
export class LangChainRecursiveChunker implements IChunkingStrategy {
  /**
   * Chunks content using recursive character splitting
   *
   * @param content - The content to chunk
   * @param config - Chunking configuration (chunkSize, chunkOverlap)
   * @returns Array of content chunks (strings)
   */
  async chunk(content: string, config: ChunkingConfig): Promise<string[]> {
    // Create LangChain splitter with config
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
    });

    // Split content
    const documents = await splitter.createDocuments([content]);

    // Extract text from documents
    return documents.map((doc) => doc.pageContent);
  }
}
