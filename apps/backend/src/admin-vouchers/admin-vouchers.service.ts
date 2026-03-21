import { randomUUID } from 'crypto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AdminVoucherRepository } from './admin-voucher.repository';
import { VoucherVaultService } from './voucher-vault.service';

const SHOPRITE_CHECKERS_SUPPLIER = {
  key: 'shoprite-checkers',
  label: 'Shoprite Checkers',
} as const;

@Injectable()
export class AdminVouchersService {
  constructor(
    private readonly repo: AdminVoucherRepository,
    private readonly audit: AuditService,
    private readonly vault: VoucherVaultService,
  ) {}

  async ingestShopriteCheckersSms(params: {
    smsText: string;
    actor: { sub?: string; email?: string; ['cognito:groups']?: string[] };
  }) {
    const parsed = this.parseShopriteCheckersSms(params.smsText);
    const now = new Date().toISOString();
    const voucherId = randomUUID();

    const record = await this.repo.put({
      voucherId,
      supplierKey: SHOPRITE_CHECKERS_SUPPLIER.key,
      supplierLabel: SHOPRITE_CHECKERS_SUPPLIER.label,
      amountMinor: parsed.amountMinor,
      currency: 'ZAR',
      status: 'available',
      barcodeLast4: parsed.barcode.slice(-4),
      barcodeHash: this.vault.fingerprint(parsed.barcode),
      rawSmsHash: this.vault.fingerprint(params.smsText),
      barcodeVault: this.vault.encryptString(parsed.barcode),
      rawSmsVault: this.vault.encryptString(params.smsText),
      source: 'telegram-admin-bot',
      createdAt: now,
      updatedAt: now,
      ingestedByUserId: params.actor.sub ?? 'unknown',
      ingestedByActorId:
        typeof params.actor.email === 'string' ? params.actor.email : undefined,
    });

    await this.audit.record({
      userId: params.actor.sub ?? 'unknown',
      actorId:
        typeof params.actor.email === 'string'
          ? params.actor.email
          : params.actor.sub,
      actorType: 'administrator',
      eventType: 'admin.voucher.ingested',
      description: `Ingested ${SHOPRITE_CHECKERS_SUPPLIER.label} voucher`,
      metadata: {
        voucherId,
        supplierKey: SHOPRITE_CHECKERS_SUPPLIER.key,
        amountMinor: parsed.amountMinor,
        currency: 'ZAR',
        barcodeLast4: parsed.barcode.slice(-4),
      },
    });

    return {
      voucherId: record.voucherId,
      supplier: record.supplierLabel,
      amount: record.amountMinor / 100,
      currency: record.currency,
      barcodeMasked: this.vault.redactBarcode(parsed.barcode),
      status: record.status,
      ingestedAt: record.createdAt,
      storage: {
        mode: 'encrypted-at-rest-and-application-encrypted',
        barcodeVisibleToAdmins: false,
      },
    };
  }

  private parseShopriteCheckersSms(smsText: string) {
    const normalized = smsText.replace(/\r/g, ' ').replace(/\n+/g, ' ').trim();

    const amountMatch = normalized.match(/\bR\s?(\d+(?:[.,]\d{1,2})?)\b/i);
    if (!amountMatch) {
      throw new BadRequestException(
        'Unable to extract voucher amount from Shoprite Checkers SMS.',
      );
    }

    const barcodeMatch = normalized.match(/BARCODE\s*[:\-]\s*(\d{10,30})\b/i);
    if (!barcodeMatch) {
      throw new BadRequestException(
        'Unable to extract BARCODE from Shoprite Checkers SMS.',
      );
    }

    if (!/shoprite|checkers|usave/i.test(normalized)) {
      throw new BadRequestException(
        'SMS does not look like a Shoprite / Checkers / Usave voucher.',
      );
    }

    const amountMinor = Math.round(
      Number(amountMatch[1].replace(',', '.')) * 100,
    );
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      throw new BadRequestException('Voucher amount is invalid.');
    }

    return {
      amountMinor,
      barcode: barcodeMatch[1],
    };
  }
}
