/**
 * Jest Global Setup
 *
 * Runs once before all test suites.
 * Creates and initializes the test database with schema.
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

export default async function globalSetup() {
  console.log('\n🔧 Setting up test database...\n');

  // Create a temporary connection to drop/create the test database
  const setupConnection = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: 'postgres', // Connect to default database
  });

  try {
    await setupConnection.initialize();

    const testDbName = process.env.DB_DATABASE_TEST ?? 'crypto_knowledge_test';

    // Drop test database if it exists
    await setupConnection.query(`DROP DATABASE IF EXISTS "${testDbName}";`);

    // Create fresh test database
    await setupConnection.query(`CREATE DATABASE "${testDbName}";`);

    console.log(`✅ Test database "${testDbName}" created`);

    await setupConnection.destroy();

    // Now create the schema in the test database
    const schemaConnection = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: testDbName,
      entities: [
        __dirname + '/../src/**/infra/persistence/entities/*.entity.ts',
        __dirname + '/../src/**/infra/persistence/entities/!(index).ts',
      ],
      synchronize: true, // Create schema once here
      dropSchema: true, // Drop schema first to ensure clean state
      logging: false,
    });

    await schemaConnection.initialize();
    console.log(`✅ Test database schema created\n`);
    await schemaConnection.destroy();
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}
