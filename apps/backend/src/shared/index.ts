/**
 * Shared Module Exports
 *
 * Central export point for all shared infrastructure and kernel components.
 */

// Shared Module (includes all infrastructure modules)
export { SharedModule } from './shared.module';

// Kernel exports
export * from './domain';

// Infrastructure exports
export * from './infra';

// Event Sourcing exports
export * from './domain/interfaces/event-sourcing';
