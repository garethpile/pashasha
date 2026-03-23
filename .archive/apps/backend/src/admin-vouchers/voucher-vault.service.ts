import { createCipheriv, createHash, randomBytes } from 'crypto';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VaultEnvelope {
  algorithm: 'aes-256-gcm';
  keyVersion: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

@Injectable()
export class VoucherVaultService {
  private readonly masterKey?: Buffer;
  private readonly keyVersion: string;

  constructor(private readonly config: ConfigService) {
    const encoded = this.config.get<string>('VOUCHER_VAULT_MASTER_KEY_B64');
    this.masterKey = encoded ? Buffer.from(encoded, 'base64') : undefined;
    this.keyVersion =
      this.config.get<string>('VOUCHER_VAULT_KEY_VERSION') ?? 'v1';
  }

  encryptString(plaintext: string): VaultEnvelope {
    if (!this.masterKey || this.masterKey.length !== 32) {
      throw new InternalServerErrorException(
        'Voucher vault is not configured. Expected a 32-byte base64 VOUCHER_VAULT_MASTER_KEY_B64.',
      );
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    const ciphertext = Buffer.concat([
      cipher.update(Buffer.from(plaintext, 'utf8')),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      algorithm: 'aes-256-gcm',
      keyVersion: this.keyVersion,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
  }

  fingerprint(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  redactBarcode(barcode: string) {
    const tail = barcode.slice(-4);
    return `${'*'.repeat(Math.max(0, barcode.length - 4))}${tail}`;
  }
}
