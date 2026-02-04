import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import {
  IChunkingStrategy,
  ChunkingConfig,
} from '@refinement/domain/interfaces/services/chunking-strategy';

/**
 * LangChainCodeChunker
 *
 * Implements chunking using LangChain's RecursiveCharacterTextSplitter
 * with code-specific separators. Best for code snippets and technical content.
 *
 * Strategy:
 * - Tries to split on function/class boundaries
 * - Respects code structure (braces, semicolons)
 * - Falls back to line breaks
 * - Preserves code formatting
 *
 * Requirements: Refinement 2
 * Design: Infrastructure Layer - Chunking Strategies
 */
@Injectable()
export class LangChainCodeChunker implements IChunkingStrategy {
  /**
   * Chunks code content preserving structure
   *
   * @param content - The code content to chunk
   * @param config - Chunking configuration (chunkSize, chunkOverlap)
   * @returns Array of content chunks (strings)
   */
  async chunk(content: string, config: ChunkingConfig): Promise<string[]> {
    // Create LangChain splitter with code-specific separators
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
      // Code-specific separators (function boundaries, braces, etc.)
      separators: [
        '\n\nfunction ',
        '\n\nclass ',
        '\n\nconst ',
        '\n\nlet ',
        '\n\nvar ',
        '\n\n',
        '\n',
        ';',
        ' ',
        '',
      ],
    });

    // Split content
    const documents = await splitter.createDocuments([content]);

    // Extract text from documents
    return documents.map((doc) => doc.pageContent);
  }
}
