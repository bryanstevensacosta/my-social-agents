import { ValueObject } from '@/shared/domain';

/**
 * SourceId Value Object
 *
 * Represents a unique identifier for a content source.
 * Immutable and self-validating.
 */
export interface SourceIdProps {
  value: string;
}

export class SourceId extends ValueObject<SourceIdProps> {
  private constructor(props: SourceIdProps) {
    super(props);
    this.validate();
  }

  /**
   * Validates the source ID
   */
  protected validate(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('Source ID cannot be empty');
    }

    // UUID v4 format validation (optional - adjust based on your ID format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(this.props.value)) {
      throw new Error('Source ID must be a valid UUID v4');
    }
  }

  /**
   * Creates a SourceId from a string value
   */
  static create(value: string): SourceId {
    return new SourceId({ value: value.trim() });
  }

  /**
   * Returns the string value
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Returns the string representation
   */
  toString(): string {
    return this.props.value;
  }
}
