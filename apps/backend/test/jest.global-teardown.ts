/**
 * Jest Global Teardown
 *
 * Runs once after all test suites.
 * Optionally cleans up the test database.
 */

export default function globalTeardown() {
  console.log('\n🧹 Test run completed\n');

  // Optionally drop test database after all tests
  // Uncomment if you want to clean up after tests
  // const setupConnection = new DataSource({ ... });
  // await setupConnection.query(`DROP DATABASE IF EXISTS "${testDbName}";`);
}
