import { GetContentRefinementQuery } from '../query';

describe('GetContentRefinementQuery', () => {
  describe('constructor', () => {
    it('should create query with valid refinement ID', () => {
      // Arrange & Act
      const query = new GetContentRefinementQuery('refinement-123');

      // Assert
      expect(query).toBeInstanceOf(GetContentRefinementQuery);
      expect(query.refinementId).toBe('refinement-123');
    });

    it('should throw error if refinement ID is empty', () => {
      // Arrange & Act & Assert
      expect(() => new GetContentRefinementQuery('')).toThrow(
        'Refinement ID is required',
      );
    });

    it('should throw error if refinement ID is whitespace', () => {
      // Arrange & Act & Assert
      expect(() => new GetContentRefinementQuery('   ')).toThrow(
        'Refinement ID is required',
      );
    });

    it('should throw error if refinement ID is null', () => {
      // Arrange & Act & Assert
      expect(() => new GetContentRefinementQuery(null as any)).toThrow(
        'Refinement ID is required',
      );
    });

    it('should throw error if refinement ID is undefined', () => {
      // Arrange & Act & Assert
      expect(() => new GetContentRefinementQuery(undefined as any)).toThrow(
        'Refinement ID is required',
      );
    });
  });

  describe('properties', () => {
    it('should have readonly refinementId property', () => {
      // Arrange
      const query = new GetContentRefinementQuery('refinement-123');

      // Act & Assert
      expect(query.refinementId).toBe('refinement-123');

      // Verify it's readonly (TypeScript compile-time check)
      // @ts-expect-error - refinementId is readonly
      query.refinementId = 'new-id';
    });
  });
});
