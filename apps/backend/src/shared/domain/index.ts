/**
 * Shared Kernel - Core domain building blocks
 *
 * This module exports base classes and utilities that are shared across
 * all bounded contexts in the system.
 */
export { ValueObject } from './core/value-object';
export { AggregateRoot, AggregateVersion } from './core/aggregate';
export { ConcurrencyException } from './exceptions/concurrency';
export type {
  IJobScheduler,
  JobCallback,
} from './interfaces/scheduling/job-scheduler';
