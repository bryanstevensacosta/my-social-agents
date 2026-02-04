import { Module } from '@nestjs/common';
import { Hashing } from './hashing';
import { CredentialEncryptionService } from './credential-encryption';
import { EncryptionKeyProvider } from './encryption-key-provider';

/**
 * SharedCryptoModule
 *
 * NestJS module for shared cryptographic infrastructure services.
 * Provides cryptographic service implementations that are shared across
 * all bounded contexts.
 *
 * Services:
 * - IHashing: SHA-256 cryptographic hashing
 * - ICredentialEncryption: AES-256-GCM credential encryption/decryption
 * - IEncryptionKeyProvider: Encryption key management
 *
 * Usage:
 * ```typescript
 * @Module({
 *   imports: [SharedCryptoModule],
 *   providers: [MyService],
 * })
 * export class MyModule {}
 * ```
 *
 * All services are registered with interface tokens for dependency injection:
 * - 'IHashing' → Hashing
 * - 'ICredentialEncryption' → CredentialEncryptionService
 * - 'IEncryptionKeyProvider' → EncryptionKeyProvider
 */
@Module({
  providers: [
    // Hashing Service with Interface Token
    {
      provide: 'IHashing',
      useClass: Hashing,
    },
    // Credential Encryption with Interface Token
    {
      provide: 'ICredentialEncryption',
      useClass: CredentialEncryptionService,
    },
    // Encryption Key Provider with Interface Token
    {
      provide: 'IEncryptionKeyProvider',
      useClass: EncryptionKeyProvider,
    },
  ],
  exports: ['IHashing', 'ICredentialEncryption', 'IEncryptionKeyProvider'],
})
export class SharedCryptoModule {}
