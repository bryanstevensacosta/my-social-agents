import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ChunkEntity } from './chunk.entity';

/**
 * TypeORM Entity for ContentRefinement aggregate
 *
 * Maps the ContentRefinement aggregate to the database table.
 * This is an infrastructure concern and should not be used in domain or application layers.
 *
 * Table: content_refinements
 *
 * Relationships:
 * - One-to-Many with ChunkEntity (chunks)
 *
 * Indexes:
 * - content_item_id (for queries by content)
 * - status (for queries by status)
 * - created_at (for time-based queries)
 */
@Entity('content_refinements')
@Index(['contentItemId'])
@Index(['status'])
@Index(['createdAt'])
export class ContentRefinementEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  contentItemId!: string;

  @Column('varchar', { length: 50 })
  status!: string; // pending, processing, completed, failed

  @Column('int', { default: 0 })
  version!: number;

  @OneToMany(() => ChunkEntity, (chunk) => chunk.refinement, {
    cascade: true,
    eager: false,
  })
  chunks!: ChunkEntity[];

  @Column('timestamp', { nullable: true })
  refinedAt!: Date | null;

  @Column('jsonb', { nullable: true })
  error!: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  } | null;

  @Column('jsonb', { nullable: true })
  config!: {
    chunkingStrategy: string;
    chunkSize: number;
    chunkOverlap: number;
    extractEntities: boolean;
    extractTemporal: boolean;
    analyzeQuality: boolean;
  } | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
