/**
 * Test Database Helpers
 *
 * Utilities for managing test database state in integration tests.
 *
 * Key Principles:
 * - Global setup creates the database once
 * - Each test suite gets a clean database state
 * - Tests use TypeORM module connection (no separate DataSource)
 * - Database is cleaned between tests, not dropped/recreated
 */

import { DataSource } from 'typeorm';

/**
 * TypeORM configuration for integration tests
 *
 * Use this in Test.createTestingModule() imports
 */
export const getTestTypeOrmConfig = () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE_TEST ?? 'crypto_knowledge_test',
  entities: [
    __dirname + '/../../src/**/infra/persistence/entities/*.entity.ts',
    __dirname + '/../../src/**/infra/persistence/entities/!(index).ts',
  ],
  synchronize: false, // Schema created by global setup
  dropSchema: false, // DON'T drop schema - global setup handles this
  logging: false,
});

/**
 * Clean all tables in the database
 *
 * Use this in beforeEach to ensure test isolation.
 * More efficient than dropping/recreating schema.
 *
 * @param dataSource - TypeORM DataSource from the test module
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource?.isInitialized) {
    return;
  }

  const entities = dataSource.entityMetadatas;

  // Disable foreign key checks temporarily
  await dataSource.query('SET session_replication_role = replica;');

  try {
    // Clear all tables (TRUNCATE is faster than DELETE)
    for (const entity of entities) {
      const tableName = entity.tableName;
      await dataSource.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    }
  } finally {
    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');
  }
}

/**
 * Get DataSource from NestJS test module
 *
 * @param module - NestJS TestingModule
 * @returns TypeORM DataSource
 */
export function getDataSource(module: any): DataSource {
  return module.get(DataSource);
}
