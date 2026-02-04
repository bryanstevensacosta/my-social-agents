import { Command } from '@nestjs/cqrs';
import { RefinementConfig } from '@refinement/domain/value-objects/refinement-config';
import { RerefineContentResult } from './result';

/**
 * RerefineContentCommand
 *
 * Command to re-refine previously refined content with updated configuration.
 * This allows reprocessing content when:
 * - Configuration parameters change (chunk size, quality threshold, etc.)
 * - Extraction algorithms improve
 * - Content needs to be reprocessed due to errors
 *
 * This command represents the intent to:
 * - Load existing refinement
 * - Validate that content can be re-refined
 * - Apply new configuration
 * - Create new refinement version
 * - Preserve audit trail of re-refinement
 *
 * Extends Command<RerefineContentResult> for automatic type inference.
 *
 * Requirements: Refinement 11, 12
 * Design: Application Layer - Commands
 */
export class RerefineContentCommand extends Command<RerefineContentResult> {
  constructor(
    public readonly contentItemId: string,
    public readonly reason: string,
    public readonly config?: RefinementConfig,
  ) {
    super();
    this.validate();
  }

  /**
   * Validates command properties
   */
  private validate(): void {
    if (!this.contentItemId || this.contentItemId.trim().length === 0) {
      throw new Error('Content item ID is required');
    }

    if (!this.reason || this.reason.trim().length === 0) {
      throw new Error('Reason for re-refinement is required');
    }

    if (this.reason.length > 500) {
      throw new Error('Reason must be 500 characters or less');
    }

    // Config validation is handled by the RefinementConfig Value Object itself
  }
}
