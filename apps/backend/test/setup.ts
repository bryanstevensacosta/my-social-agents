import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

/**
 * Test Database Setup
 *
 * Creates a test database connection for integration tests.
 * Uses a separate test database to avoid affecting development data.
 */
export const createTestDataSource = (): DataSource => {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE_TEST ?? 'crypto_knowledge_test',
    entities: ['src/**/infra/persistence/entities/*.ts'],
    synchronize: true, // Auto-create schema for tests
    dropSchema: false, // Don't drop schema automatically - we'll do it manually
    logging: false,
  });
};

/**
 * Global test setup
 */
export const setupTestDatabase = async (): Promise<DataSource> => {
  const dataSource = createTestDataSource();
  await dataSource.initialize();

  // Manually drop and recreate schema to ensure clean state
  await dataSource.dropDatabase();
  await dataSource.synchronize();

  return dataSource;
};

/**
 * Global test teardown
 */
export const teardownTestDatabase = async (
  dataSource: DataSource,
): Promise<void> => {
  if (dataSource.isInitialized) {
    // Clean up all data but keep schema for next test
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }

    await dataSource.destroy();
  }
};

/**
 * Clean all tables in the database
 * Use this in beforeEach to ensure test isolation
 */
export const cleanDatabase = async (dataSource: DataSource): Promise<void> => {
  if (!dataSource.isInitialized) {
    return;
  }

  const entities = dataSource.entityMetadatas;

  // Disable foreign key checks temporarily
  await dataSource.query('SET session_replication_role = replica;');

  try {
    // Clear all tables
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  } finally {
    // Re-enable foreign key checks
    await dataSource.query('SET session_replication_role = DEFAULT;');
  }
};
