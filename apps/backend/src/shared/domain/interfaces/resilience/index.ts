/**
 * Resilience Interfaces
 *
 * This module exports all resilience service interfaces that define contracts
 * for resilience patterns. These interfaces enable dependency inversion and
 * allow the domain layer to remain independent of infrastructure.
 *
 * Resilience Services:
 * - IRetryService: Exponential backoff retry logic
 * - ICircuitBreaker: Circuit breaker pattern for preventing cascading failures
 */

export * from './retry';
export * from './circuit-breaker';
