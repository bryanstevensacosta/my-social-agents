import { ValueObject } from '@/shared/kernel';

/**
 * JobId Value Object
 *
 * Represents a unique identifier for an ingestion job.
 * Immutable and self-validating.
 */
export interface JobIdProps {
  value: string;
}

export class JobId extends ValueObject<JobIdProps> {
  private constructor(props: JobIdProps) {
    super(props);
    this.validate();
  }

  /**
   * Validates the job ID
   */
  protected validate(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error('Job ID cannot be empty');
    }

    // UUID v4 format validation (optional - adjust based on your ID format)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(this.props.value)) {
      throw new Error('Job ID must be a valid UUID v4');
    }
  }

  /**
   * Creates a JobId from a string value
   */
  static create(value: string): JobId {
    return new JobId({ value: value.trim() });
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
