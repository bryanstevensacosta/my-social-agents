# Integration Test Guide

## Problem: Database Index Conflicts

Integration tests were failing with "IDX_a15490634dba0b919c7d484cc5 already exists" errors because:

1. Each test file was creating its own `DataSource` with `synchronize: true` and `dropSchema: true`
2. Multiple test files running sequentially tried to create/drop the same schema
3. The schema wasn't being properly cleaned up between test files

## Solution: Global Setup + Single DataSource

### 1. Global Setup (Once for All Tests)

`test/jest.global-setup.ts` runs once before all tests and:

- Drops the test database if it exists
- Creates a fresh test database
- Creates the schema once (via `synchronize: true`)

### 2. Test Module DataSource (One per Test File)

Each integration test should:

- Use `TypeOrmModule.forRoot()` with `synchronize: false` (schema already created)
- NOT create a separate `DataSource` with `createTestDataSource()`
- Get the DataSource from the module: `module.get(DataSource)`

### 3. Clean Between Tests (Optional)

Use `cleanDatabase()` helper in `beforeEach` to clear all tables between tests within a file.

## Correct Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  getTestTypeOrmConfig,
  cleanDatabase,
} from '@/../test/helpers/test-database';

describe('Integration: My Feature', () => {
  let module: TestingModule;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create test module with TypeORM
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(getTestTypeOrmConfig()),
        // ... other modules
      ],
    }).compile();

    // Get DataSource from module (don't create a separate one!)
    dataSource = module.get(DataSource);

    await module.init();
  });

  beforeEach(async () => {
    // Optional: Clean database between tests
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should do something', async () => {
    // Test logic
  });
});
```

## ❌ WRONG Pattern (Causes Index Conflicts)

```typescript
import { createTestDataSource } from '@/../test/setup';

describe('Integration: My Feature', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // ❌ DON'T create separate DataSource
    dataSource = createTestDataSource();
    await dataSource.initialize(); // This causes the index conflict!

    // ❌ DON'T use synchronize: true in TypeORM module
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          // ...
          synchronize: true, // ❌ Conflicts with global setup
          dropSchema: true, // ❌ Would drop the schema created by global setup
        }),
      ],
    }).compile();
  });
});
```

## Why This Works

1. **Global setup** creates the database and schema once
2. **Test files** connect to existing schema (no synchronize)
3. **cleanDatabase()** clears data between tests (fast, no schema recreation)
4. **No index conflicts** because schema is only created once in global setup
5. **Faster tests** because schema isn't recreated for each test file

## Migration Path

To fix existing integration tests:

1. Remove `createTestDataSource()` and `dataSource.initialize()` calls
2. Use `getTestTypeOrmConfig()` in `TypeOrmModule.forRoot()`
3. Get DataSource from module: `dataSource = module.get(DataSource)`
4. Optionally add `cleanDatabase(dataSource)` in `beforeEach`

## Benefits

- ✅ No more index conflicts
- ✅ Faster test execution (schema created once)
- ✅ Better test isolation (clean data between tests)
- ✅ Simpler test setup (one DataSource per file)
- ✅ Follows NestJS testing best practices
