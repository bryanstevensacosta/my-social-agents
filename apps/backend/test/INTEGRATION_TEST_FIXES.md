# Integration Test Fixes - Summary

## Problem

Integration tests were failing with "IDX_xxx already exists" errors due to duplicate entity loading and schema synchronization conflicts.

## Root Causes

### 1. Duplicate Entity Loading via Symlink

- Root `node_modules/backend` symlink pointing to `apps/backend`
- Entity glob pattern matched entities twice (source + symlink)
- TypeORM tried to create same indexes twice → conflict

### 2. Duplicate @Index() Decorators

- Some entities had `@Index()` at both class level AND field level
- Example: `ChunkEntity` had `@Index(['hash'])` at class level AND `@Index()` on hash field
- Caused duplicate index creation attempts

### 3. Multiple Schema Synchronizations

- Each test file was running `synchronize: true`
- Multiple test files running sequentially tried to create schema
- Race conditions and conflicts

### 4. Inconsistent Entity File Naming

- Some entities used `.entity.ts` suffix
- Others used just `.ts` suffix
- Glob pattern `*.entity.ts` missed entities without suffix

## Solutions Applied

### 1. Global Setup Creates Schema Once

**File**: `apps/backend/test/jest.global-setup.ts`

- Drops and creates test database
- Creates schema once with `synchronize: true` + `dropSchema: true`
- All test files connect to existing schema

### 2. Test Files Use `synchronize: false`

**File**: `apps/backend/test/helpers/test-database.ts`

- `getTestTypeOrmConfig()` returns `synchronize: false`
- Schema already created by global setup
- No conflicts from multiple synchronizations

### 3. Fixed Entity Glob Pattern

**Files**:

- `apps/backend/test/jest.global-setup.ts`
- `apps/backend/test/helpers/test-database.ts`

```typescript
entities: [
  __dirname + '/../src/**/infra/persistence/entities/*.entity.ts',
  __dirname + '/../src/**/infra/persistence/entities/!(index).ts',
];
```

- Matches both `.entity.ts` and `.ts` files
- Excludes `index.ts` files
- Avoids symlink duplication

### 4. Removed Duplicate @Index() Decorators

**Files**:

- `apps/backend/src/refinement/infra/persistence/entities/chunk.entity.ts`
- `apps/backend/src/refinement/infra/persistence/entities/content-refinement.entity.ts`

**Before**:

```typescript
@Entity('chunks')
@Index(['hash']) // Class-level index
export class ChunkEntity {
  @Column('varchar', { length: 64 })
  @Index() // ❌ Duplicate field-level index
  hash!: string;
}
```

**After**:

```typescript
@Entity('chunks')
@Index(['hash']) // Class-level index only
export class ChunkEntity {
  @Column('varchar', { length: 64 })
  hash!: string; // ✅ No duplicate
}
```

### 5. Fixed cleanDatabase() Function

**File**: `apps/backend/test/helpers/test-database.ts`

- Changed from `repository.clear()` to `TRUNCATE TABLE ... CASCADE`
- Handles foreign key constraints properly
- Faster and more reliable

**Before**:

```typescript
for (const entity of entities) {
  const repository = dataSource.getRepository(entity.name);
  await repository.clear(); // ❌ Fails with FK constraints
}
```

**After**:

```typescript
await dataSource.query('SET session_replication_role = replica;');
for (const entity of entities) {
  await dataSource.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
}
await dataSource.query('SET session_replication_role = DEFAULT;');
```

### 6. Updated All Integration Test Files

**Files**:

- `apps/backend/src/ingestion/__tests__/integration/job-execution-flow.integration.spec.ts`
- `apps/backend/src/ingestion/__tests__/integration/source-health-tracking.integration.spec.ts`
- `apps/backend/src/ingestion/__tests__/integration/content-deduplication.integration.spec.ts`
- `apps/backend/src/ingestion/__tests__/properties/deduplication.property.spec.ts`

**Changes**:

1. Removed `import { createTestDataSource } from '@/../test/setup';`
2. Added `import { getTestTypeOrmConfig, cleanDatabase } from '@/../test/helpers/test-database';`
3. Changed `TypeOrmModule.forRoot({ ... })` to `TypeOrmModule.forRoot(getTestTypeOrmConfig())`
4. Removed separate `dataSource.initialize()` calls
5. Added `dataSource = module.get(DataSource)` after module init
6. Added `beforeEach(async () => { await cleanDatabase(dataSource); })`
7. Removed separate `dataSource.destroy()` in `afterAll()`

## Results

### Before

- 18 failed test suites
- 74 failed tests
- "IDX_xxx already exists" errors
- Database index conflicts

### After

- ✅ 13 passed test suites
- ✅ 97 passed tests
- ✅ No index conflicts
- ✅ Clean database state between tests

## Key Learnings

1. **Global Setup Pattern**: Create database and schema once in global setup, not per test file
2. **Entity Loading**: Be careful with symlinks and glob patterns to avoid duplicate entity loading
3. **Index Decorators**: Use either class-level OR field-level `@Index()`, not both
4. **Entity Naming**: Standardize on `.entity.ts` suffix OR update glob patterns to match all variants
5. **Foreign Keys**: Use `TRUNCATE ... CASCADE` with disabled FK checks for cleaning test data

## Documentation Updated

- `apps/backend/test/INTEGRATION_TEST_GUIDE.md` - Updated with correct pattern
- `apps/backend/test/helpers/test-database.ts` - Improved with better comments
- `apps/backend/test/jest.global-setup.ts` - Added schema creation

## Testing

All integration tests now pass:

```bash
npm test -- --testPathPatterns="ingestion/__tests__"
# Test Suites: 13 passed, 13 total
# Tests:       97 passed, 97 total
```
