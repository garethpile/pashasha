import { createCipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto';

export interface VaultEnvelope {
  algorithm: 'aes-256-gcm';
  keyVersion: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

export interface ParsedVoucher {
  amountMinor: number;
  barcode: string;
}

export const parseShopriteCheckersSms = (smsText: string): ParsedVoucher => {
  const normalized = smsText.replace(/\r/g, ' ').replace(/\n+/g, ' ').trim();

  const amountMatch = normalized.match(/\bR\s?(\d+(?:[.,]\d{1,2})?)\b/i);
  if (!amountMatch) {
    throw new Error('Unable to extract voucher amount from Shoprite Checkers SMS.');
  }

  const barcodeMatch = normalized.match(/BARCODE\s*[:\-]\s*(\d{10,30})\b/i);
  if (!barcodeMatch) {
    throw new Error('Unable to extract BARCODE from Shoprite Checkers SMS.');
  }

  if (!/shoprite|checkers|usave/i.test(normalized)) {
    throw new Error('SMS does not look like a Shoprite / Checkers / Usave voucher.');
  }

  const amountMinor = Math.round(Number(amountMatch[1].replace(',', '.')) * 100);
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new Error('Voucher amount is invalid.');
  }

  return {
    amountMinor,
    barcode: barcodeMatch[1],
  };
};

export const fingerprint = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const redactBarcode = (barcodeOrTail: string): string => {
  const tail = barcodeOrTail.slice(-4);
  return `${'*'.repeat(Math.max(0, barcodeOrTail.length - 4))}${tail}`;
};

export const encryptString = (
  plaintext: string,
  masterKeyB64: string,
  keyVersion: string
): VaultEnvelope => {
  const masterKey = Buffer.from(masterKeyB64, 'base64');
  if (masterKey.length !== 32) {
    throw new Error(
      'Voucher vault is not configured. Expected a 32-byte base64 VOUCHER_VAULT_MASTER_KEY_B64.'
    );
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(plaintext, 'utf8')), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: 'aes-256-gcm',
    keyVersion,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
};

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const assertAdminApiKey = (provided: string | undefined, expected: string): void => {
  if (!provided) {
    throw new Error('Missing admin API key.');
  }

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid admin API key.');
  }
};

export const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify(body),
});
