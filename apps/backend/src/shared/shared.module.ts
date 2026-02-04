import { Module } from '@nestjs/common';
import { ResilienceModule } from './infra/resilience/resilience.module';
import { ScheduleModule } from './infra/scheduling/schedule.module';
import { SharedCryptoModule } from './infra/crypto/shared-crypto.module';

/**
 * SharedModule
 *
 * Centralized module that provides all shared infrastructure services
 * across all bounded contexts.
 *
 * Includes:
 * - ResilienceModule: Retry (IRetryService) and Circuit Breaker (ICircuitBreaker) services
 * - ScheduleModule: Job scheduling infrastructure
 * - SharedCryptoModule: Cryptographic hashing (IHashing) and encryption (ICredentialEncryption)
 *
 * Note: Event publishing uses @nestjs/cqrs EventBus directly.
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [SharedModule],
 *   providers: [MyService],
 * })
 * export class MyModule {}
 * ```
 *
 * This module exports all shared services for easy consumption
 * by bounded contexts without needing to import individual modules.
 */
@Module({
  imports: [ResilienceModule, ScheduleModule, SharedCryptoModule],
  exports: [ResilienceModule, ScheduleModule, SharedCryptoModule],
})
export class SharedModule {}
