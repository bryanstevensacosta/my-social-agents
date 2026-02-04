import { GetChunksByContentQuery } from '../query';

describe('GetChunksByContentQuery', () => {
  describe('constructor', () => {
    it('should create query with valid content item ID', () => {
      // Arrange & Act
      const query = new GetChunksByContentQuery('content-456');

      // Assert
      expect(query).toBeInstanceOf(GetChunksByContentQuery);
      expect(query.contentItemId).toBe('content-456');
    });

    it('should throw error if content item ID is empty', () => {
      // Arrange & Act & Assert
      expect(() => new GetChunksByContentQuery('')).toThrow(
        'Content item ID is required',
      );
    });

    it('should throw error if content item ID is whitespace', () => {
      // Arrange & Act & Assert
      expect(() => new GetChunksByContentQuery('   ')).toThrow(
        'Content item ID is required',
      );
    });

    it('should throw error if content item ID is null', () => {
      // Arrange & Act & Assert
      expect(() => new GetChunksByContentQuery(null as any)).toThrow(
        'Content item ID is required',
      );
    });

    it('should throw error if content item ID is undefined', () => {
      // Arrange & Act & Assert
      expect(() => new GetChunksByContentQuery(undefined as any)).toThrow(
        'Content item ID is required',
      );
    });
  });

  describe('properties', () => {
    it('should have readonly contentItemId property', () => {
      // Arrange
      const query = new GetChunksByContentQuery('content-456');

      // Act & Assert
      expect(query.contentItemId).toBe('content-456');

      // Verify it's readonly (TypeScript compile-time check)
      // @ts-expect-error - contentItemId is readonly
      query.contentItemId = 'new-id';
    });
  });
});
