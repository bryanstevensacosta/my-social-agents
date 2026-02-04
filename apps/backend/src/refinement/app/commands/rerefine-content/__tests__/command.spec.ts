import { RerefineContentCommand } from '../command';
import { RefinementConfig } from '@refinement/domain/value-objects/refinement-config';

describe('RerefineContentCommand', () => {
  describe('constructor', () => {
    it('should create command with required properties', () => {
      const command = new RerefineContentCommand(
        'content-123',
        'Updated chunking strategy',
      );

      expect(command.contentItemId).toBe('content-123');
      expect(command.reason).toBe('Updated chunking strategy');
      expect(command.config).toBeUndefined();
    });

    it('should create command with config', () => {
      const config = RefinementConfig.create({
        chunkSize: 800,
        chunkOverlap: 150,
      });

      const command = new RerefineContentCommand(
        'content-123',
        'Updated chunking strategy',
        config,
      );

      expect(command.contentItemId).toBe('content-123');
      expect(command.reason).toBe('Updated chunking strategy');
      expect(command.config).toBe(config);
    });

    it('should create command with partial config', () => {
      const config = RefinementConfig.create({
        qualityThreshold: 0.5,
      });

      const command = new RerefineContentCommand(
        'content-123',
        'Increased quality threshold',
        config,
      );

      expect(command.config).toBe(config);
    });
  });

  describe('validation', () => {
    it('should throw error if contentItemId is empty', () => {
      expect(() => {
        new RerefineContentCommand('', 'Some reason');
      }).toThrow('Content item ID is required');
    });

    it('should throw error if contentItemId is whitespace', () => {
      expect(() => {
        new RerefineContentCommand('   ', 'Some reason');
      }).toThrow('Content item ID is required');
    });

    it('should throw error if reason is empty', () => {
      expect(() => {
        new RerefineContentCommand('content-123', '');
      }).toThrow('Reason for re-refinement is required');
    });

    it('should throw error if reason is whitespace', () => {
      expect(() => {
        new RerefineContentCommand('content-123', '   ');
      }).toThrow('Reason for re-refinement is required');
    });

    it('should throw error if reason exceeds 500 characters', () => {
      const longReason = 'a'.repeat(501);

      expect(() => {
        new RerefineContentCommand('content-123', longReason);
      }).toThrow('Reason must be 500 characters or less');
    });

    it('should accept reason with exactly 500 characters', () => {
      const maxReason = 'a'.repeat(500);

      expect(() => {
        new RerefineContentCommand('content-123', maxReason);
      }).not.toThrow();
    });
  });

  describe('use cases', () => {
    it('should support configuration update use case', () => {
      const newConfig = RefinementConfig.create({
        chunkSize: 1000,
        chunkOverlap: 200,
        qualityThreshold: 0.5,
      });

      const command = new RerefineContentCommand(
        'content-123',
        'Updated chunk size and quality threshold',
        newConfig,
      );

      expect(command.contentItemId).toBe('content-123');
      expect(command.reason).toContain('Updated chunk size');
      expect(command.config?.chunkSize).toBe(1000);
    });

    it('should support algorithm improvement use case', () => {
      const command = new RerefineContentCommand(
        'content-123',
        'Improved entity extraction algorithm deployed',
      );

      expect(command.reason).toContain('Improved entity extraction');
      expect(command.config).toBeUndefined(); // Use default config
    });

    it('should support error recovery use case', () => {
      const command = new RerefineContentCommand(
        'content-123',
        'Previous refinement failed due to timeout, retrying with optimized settings',
      );

      expect(command.reason).toContain('Previous refinement failed');
    });

    it('should support quality improvement use case', () => {
      const config = RefinementConfig.create({
        qualityThreshold: 0.7,
      });

      const command = new RerefineContentCommand(
        'content-123',
        'Increasing quality threshold to filter low-quality chunks',
        config,
      );

      expect(command.config?.qualityThreshold).toBe(0.7);
    });
  });

  describe('edge cases', () => {
    it('should handle very long content IDs', () => {
      const longId = 'content-' + 'a'.repeat(100);

      const command = new RerefineContentCommand(longId, 'Some reason');

      expect(command.contentItemId).toBe(longId);
    });

    it('should handle special characters in reason', () => {
      const reason =
        'Updated config: chunk_size=800, overlap=150 (50% improvement)';

      const command = new RerefineContentCommand('content-123', reason);

      expect(command.reason).toBe(reason);
    });

    it('should handle unicode characters in reason', () => {
      const reason = 'Actualización de configuración 🚀';

      const command = new RerefineContentCommand('content-123', reason);

      expect(command.reason).toBe(reason);
    });

    it('should handle multiline reason', () => {
      const reason =
        'Updated configuration:\n- Chunk size: 1000\n- Quality: 0.5';

      const command = new RerefineContentCommand('content-123', reason);

      expect(command.reason).toContain('Updated configuration');
    });
  });
});
