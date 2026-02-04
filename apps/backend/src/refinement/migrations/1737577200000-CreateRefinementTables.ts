import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

/**
 * Migration: Create Refinement Tables
 *
 * Creates the database schema for the Refinement bounded context:
 * - content_refinements table
 * - chunks table
 * - Indexes for performance
 * - Foreign key constraints
 *
 * Timestamp: 2026-01-22 18:00:00 UTC
 */
export class CreateRefinementTables1737577200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create content_refinements table
    await queryRunner.createTable(
      new Table({
        name: 'content_refinements',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'content_item_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'refined_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'config',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for content_refinements
    await queryRunner.createIndex(
      'content_refinements',
      new TableIndex({
        name: 'IDX_content_refinements_content_item_id',
        columnNames: ['content_item_id'],
      }),
    );

    await queryRunner.createIndex(
      'content_refinements',
      new TableIndex({
        name: 'IDX_content_refinements_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'content_refinements',
      new TableIndex({
        name: 'IDX_content_refinements_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Create chunks table
    await queryRunner.createTable(
      new Table({
        name: 'chunks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'refinement_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'position',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'hash',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'entities',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'quality_score',
            type: 'decimal',
            precision: 3,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'temporal_context',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for chunks
    await queryRunner.createIndex(
      'chunks',
      new TableIndex({
        name: 'IDX_chunks_refinement_id',
        columnNames: ['refinement_id'],
      }),
    );

    await queryRunner.createIndex(
      'chunks',
      new TableIndex({
        name: 'IDX_chunks_hash',
        columnNames: ['hash'],
      }),
    );

    await queryRunner.createIndex(
      'chunks',
      new TableIndex({
        name: 'IDX_chunks_refinement_id_position',
        columnNames: ['refinement_id', 'position'],
      }),
    );

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'chunks',
      new TableForeignKey({
        name: 'FK_chunks_refinement',
        columnNames: ['refinement_id'],
        referencedTableName: 'content_refinements',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('chunks', 'FK_chunks_refinement');

    // Drop indexes for chunks
    await queryRunner.dropIndex('chunks', 'IDX_chunks_refinement_id_position');
    await queryRunner.dropIndex('chunks', 'IDX_chunks_hash');
    await queryRunner.dropIndex('chunks', 'IDX_chunks_refinement_id');

    // Drop chunks table
    await queryRunner.dropTable('chunks');

    // Drop indexes for content_refinements
    await queryRunner.dropIndex(
      'content_refinements',
      'IDX_content_refinements_created_at',
    );
    await queryRunner.dropIndex(
      'content_refinements',
      'IDX_content_refinements_status',
    );
    await queryRunner.dropIndex(
      'content_refinements',
      'IDX_content_refinements_content_item_id',
    );

    // Drop content_refinements table
    await queryRunner.dropTable('content_refinements');
  }
}
