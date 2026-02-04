import { Injectable } from '@nestjs/common';
import { MarkdownTextSplitter } from '@langchain/textsplitters';
import {
  IChunkingStrategy,
  ChunkingConfig,
} from '@refinement/domain/interfaces/services/chunking-strategy';

/**
 * LangChainMarkdownChunker
 *
 * Implements chunking using LangChain's MarkdownTextSplitter.
 * Best for markdown documents with headers, lists, and code blocks.
 *
 * Strategy:
 * - Respects markdown structure (headers, lists, code blocks)
 * - Tries to keep related content together
 * - Preserves markdown formatting
 *
 * Requirements: Refinement 2
 * Design: Infrastructure Layer - Chunking Strategies
 */
@Injectable()
export class LangChainMarkdownChunker implements IChunkingStrategy {
  /**
   * Chunks markdown content preserving structure
   *
   * @param content - The markdown content to chunk
   * @param config - Chunking configuration (chunkSize, chunkOverlap)
   * @returns Array of content chunks (strings)
   */
  async chunk(content: string, config: ChunkingConfig): Promise<string[]> {
    // Create LangChain markdown splitter with config
    const splitter = MarkdownTextSplitter.fromLanguage('markdown', {
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });

    // Split content
    const documents = await splitter.createDocuments([content]);

    // Extract text from documents
    return documents.map((doc) => doc.pageContent);
  }
}
