import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { ContentRefinementEntity } from './content-refinement.entity';

/**
 * TypeORM Entity for Chunk entity
 *
 * Maps the Chunk entity to the database table.
 * This is an infrastructure concern and should not be used in domain or application layers.
 *
 * Table: chunks
 *
 * Relationships:
 * - Many-to-One with ContentRefinementEntity (refinement)
 *
 * Indexes:
 * - refinement_id (for queries by refinement)
 * - hash (for duplicate detection)
 * - position (for ordering)
 */
@Entity('chunks')
@Index(['refinementId'])
@Index(['hash'])
@Index(['refinementId', 'position'])
export class ChunkEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  refinementId!: string;

  @ManyToOne(() => ContentRefinementEntity, (refinement) => refinement.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'refinement_id' })
  refinement!: ContentRefinementEntity;

  @Column('text')
  content!: string;

  @Column('int')
  position!: number;

  @Column('varchar', { length: 64 })
  @Index()
  hash!: string;

  @Column('jsonb', { nullable: true })
  entities!: Array<{
    symbol: string;
    name?: string;
    type: string;
    confidence: number;
  }> | null;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  qualityScore!: number | null;

  @Column('jsonb', { nullable: true })
  temporalContext!: {
    referenceDate: string; // ISO date string
    timeframe: string; // past, present, future
    confidence: number;
  } | null;

  @CreateDateColumn()
  createdAt!: Date;
}
