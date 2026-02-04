import { RerefineContentResult } from '../result';

describe('RerefineContentResult', () => {
  describe('completed status', () => {
    it('should have all required properties for completed status', () => {
      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'Updated configuration',
        status: 'completed',
        chunkCount: 15,
        durationMs: 2500,
        averageQualityScore: 0.85,
      };

      expect(result.refinementId).toBe('refinement-456');
      expect(result.contentItemId).toBe('content-123');
      expect(result.previousRefinementId).toBe('refinement-123');
      expect(result.reason).toBe('Updated configuration');
      expect(result.status).toBe('completed');
      expect(result.chunkCount).toBe(15);
      expect(result.durationMs).toBe(2500);
      expect(result.averageQualityScore).toBe(0.85);
      expect(result.error).toBeUndefined();
      expect(result.rejectionReason).toBeUndefined();
    });

    it('should support zero duration for very fast re-refinement', () => {
      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'Quick update',
        status: 'completed',
        chunkCount: 5,
        durationMs: 0,
        averageQualityScore: 0.9,
      };

      expect(result.durationMs).toBe(0);
    });

    it('should support perfect quality score', () => {
      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'High quality content',
        status: 'completed',
        chunkCount: 10,
        averageQualityScore: 1.0,
      };

      expect(result.averageQualityScore).toBe(1.0);
    });
  });

  describe('failed status', () => {
    it('should have error information for failed status', () => {
      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'Retry after failure',
        status: 'failed',
        durationMs: 1500,
        error: {
          code: 'CHUNKING_ERROR',
          message: 'Failed to chunk content: Invalid format',
        },
      };

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('CHUNKING_ERROR');
      expect(result.error?.message).toContain('Failed to chunk');
      expect(result.chunkCount).toBeUndefined();
      expect(result.averageQualityScore).toBeUndefined();
      expect(result.rejectionReason).toBeUndefined();
    });

    it('should support long error messages', () => {
      const longMessage = 'Error: ' + 'a'.repeat(500);

      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'Retry',
        status: 'failed',
        error: {
          code: 'INTERNAL_ERROR',
          message: longMessage,
        },
      };

      expect(result.error?.message.length).toBeGreaterThan(500);
    });
  });

  describe('rejected status', () => {
    it('should have rejection reason for rejected status', () => {
      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'Quality improvement attempt',
        status: 'rejected',
        rejectionReason: 'Content quality below threshold (0.25 < 0.3)',
      };

      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBeDefined();
      expect(result.rejectionReason).toContain('quality below threshold');
      expect(result.chunkCount).toBeUndefined();
      expect(result.averageQualityScore).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should support long rejection reasons', () => {
      const longReason = 'Rejected because: ' + 'a'.repeat(500);

      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'Quality check',
        status: 'rejected',
        rejectionReason: longReason,
      };

      expect(result.rejectionReason?.length).toBeGreaterThan(500);
    });
  });

  describe('audit trail', () => {
    it('should preserve previous refinement ID for audit trail', () => {
      const result: RerefineContentResult = {
        refinementId: 'refinement-new',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-old',
        reason: 'Configuration update',
        status: 'completed',
        chunkCount: 10,
      };

      expect(result.previousRefinementId).toBe('refinement-old');
      expect(result.refinementId).not.toBe(result.previousRefinementId);
    });

    it('should preserve reason for audit trail', () => {
      const reason = 'Updated chunk size from 800 to 1000 tokens';

      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason,
        status: 'completed',
        chunkCount: 12,
      };

      expect(result.reason).toBe(reason);
    });
  });

  describe('edge cases', () => {
    it('should handle single chunk result', () => {
      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'Small content',
        status: 'completed',
        chunkCount: 1,
        averageQualityScore: 0.95,
      };

      expect(result.chunkCount).toBe(1);
    });

    it('should handle very large chunk count', () => {
      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'Large document',
        status: 'completed',
        chunkCount: 100,
        averageQualityScore: 0.75,
      };

      expect(result.chunkCount).toBe(100);
    });

    it('should handle very long duration', () => {
      const result: RerefineContentResult = {
        refinementId: 'refinement-456',
        contentItemId: 'content-123',
        previousRefinementId: 'refinement-123',
        reason: 'Complex processing',
        status: 'completed',
        chunkCount: 50,
        durationMs: 60000, // 1 minute
        averageQualityScore: 0.8,
      };

      expect(result.durationMs).toBe(60000);
    });
  });
});
