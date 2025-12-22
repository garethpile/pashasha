import { Injectable, Logger } from '@nestjs/common';
import { PaymentsRepository } from './payments.repository';
import { PaymentRecord } from './payment.entity';
import { EclipseService } from './eclipse.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';
import { CivilServantRepository } from '../profiles/civil-servant.repository';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

interface InitiatedPaymentInput {
  paymentId: string;
  externalId?: string;
  status?: string;
  amount: number;
  currency: string;
  walletId?: string;
  customerId?: string;
  civilServantId?: string;
  guardToken?: string;
  accountNumber?: string;
  paymentType?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly tenantWalletId?: string;
  private readonly paymentsTopicArn?: string;
  private readonly snsRegion: string;
  private readonly region: string;
  private readonly sns: SNSClient;

  constructor(
    private readonly repo: PaymentsRepository,
    private readonly eclipse: EclipseService,
    private readonly config: ConfigService,
    private readonly civilServants: CivilServantRepository,
  ) {
    this.region =
      this.config.get<string>('AWS_REGION') ??
      this.config.get<string>('AWS_DEFAULT_REGION') ??
      'eu-west-1';
    this.paymentsTopicArn =
      process.env.PAYMENTS_SNS_TOPIC_ARN ??
      this.config.get<string>('PAYMENTS_SNS_TOPIC_ARN');
    this.snsRegion =
      this.resolveRegionFromArn(this.paymentsTopicArn) ?? this.region;
    this.sns = new SNSClient({ region: this.snsRegion });
    this.tenantWalletId =
      this.config.get<string>('TENANT_WALLET_ID') ?? undefined;
  }

  private resolveRegionFromArn(arn?: string): string | undefined {
    if (!arn) return undefined;
    const parts = arn.split(':');
    if (parts.length < 4) return undefined;
    return parts[3] || undefined;
  }

  private parseAmount(value: any): number | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (typeof value === 'object') {
      if (value.value !== undefined) return this.parseAmount(value.value);
      if (value.amount !== undefined) return this.parseAmount(value.amount);
      if (value.balance !== undefined) return this.parseAmount(value.balance);
    }
    const str = value?.toString?.() ?? '';
    const match = str.match(/-?[\d.,]+/);
    if (!match) return undefined;
    const normalized = Number(match[0].replace(/,/g, ''));
    return Number.isNaN(normalized) ? undefined : normalized;
  }

  private buildPaymentMessage(record: PaymentRecord, guard: any) {
    const amount = Number(record.amount ?? 0);
    const currency = (record.currency ?? 'ZAR').toUpperCase();
    const createdAt =
      record.createdAt ??
      (record.raw as any)?.created ??
      (record.raw as any)?.transactionDate ??
      new Date().toISOString();

    const payer =
      (record.metadata as any)?.theirReference ??
      (record.metadata as any)?.customerName ??
      record.accountNumber ??
      'Customer';

    const guardName =
      `${guard?.firstName ?? ''} ${guard?.familyName ?? ''}`.trim() ||
      'Civil Servant';
    return (
      [
        'Payment received',
        `From: ${payer}`,
        `To: ${guardName} (${guard?.accountNumber ?? 'account'})`,
        `Amount: ${currency} ${amount.toFixed(2)}`,
        `Date: ${new Date(createdAt).toLocaleString('en-ZA')}`,
        `Reference: ${record.paymentId}`,
      ].join('\n') + '\n'
    );
  }

  private async notifyCivilServantPayment(record: PaymentRecord) {
    if (!record.guardToken && !record.civilServantId) {
      return;
    }

    const guard =
      (record.guardToken &&
        (await this.civilServants.findByGuardToken(record.guardToken))) ||
      (record.civilServantId &&
        (await this.civilServants.get(record.civilServantId as string)));

    if (!guard) {
      return;
    }

    const message = this.buildPaymentMessage(record, guard);
    const guardName =
      `${guard?.firstName ?? ''} ${guard?.familyName ?? ''}`.trim() ||
      'Civil Servant';

    if (guard.phoneNumber) {
      try {
        await this.sns.send(
          new PublishCommand({
            PhoneNumber: guard.phoneNumber,
            Message: message,
            MessageAttributes: {
              'AWS.SNS.SMS.SMSType': {
                DataType: 'String',
                StringValue: 'Transactional',
              },
            },
          }),
        );
      } catch (err) {
        this.logger.error(
          `Failed to send SMS for payment ${record.paymentId} to ${guard.phoneNumber}: ${
            (err as Error)?.message ?? err
          }`,
        );
      }
    }

    if (this.paymentsTopicArn) {
      try {
        await this.sns.send(
          new PublishCommand({
            TopicArn: this.paymentsTopicArn,
            Subject: `Payment received for ${guardName}`,
            Message: `${message}Email: ${guard.email ?? 'unknown email'}\nPhone: ${
              guard.phoneNumber ?? 'unknown phone'
            }`,
          }),
        );
      } catch (err) {
        this.logger.error(
          `Failed to publish payment notification for ${record.paymentId}: ${
            (err as Error)?.message ?? err
          }`,
        );
      }
    }
  }

  async listByWalletId(
    walletId: string,
    limit = 20,
    offset = 0,
    options?: { statusFilter?: 'successful' | 'pending' | 'all' },
  ) {
    // Prefer live data from Eclipse, fall back to Dynamo if unavailable.
    try {
      if ((options?.statusFilter ?? 'successful') === 'pending') {
        const reservations = await this.eclipse.listReservations({
          walletId,
          limit,
          offset,
        });
        const now = new Date().toISOString();
        const mapped: PaymentRecord[] = (reservations ?? []).map((r: any) => {
          const created =
            r.created ??
            r.createdAt ??
            r.transactionDate ??
            r.transactionTime ??
            r.date ??
            now;
          const reservationId =
            r.reservationId ??
            r.id ??
            r.reservationID ??
            r.reservation_id ??
            r.uniqueId;
          const uniqueId =
            r.uniqueId ??
            r.uniqueReference ??
            r.reference ??
            r.paymentReference;
          const description =
            r.description ?? r.memo ?? r.narration ?? 'Reservation';
          const amount = this.parseAmount(r.amount ?? r.value ?? 0) ?? 0;
          return {
            paymentId: `reservation-${reservationId ?? uniqueId ?? crypto.randomUUID()}`,
            externalId: uniqueId ?? null,
            status: 'PENDING',
            amount: Number.isNaN(amount) ? 0 : amount,
            currency: r.currency ?? 'ZAR',
            paymentType: 'RESERVATION',
            walletId,
            raw: {
              ...r,
              paymentReference: uniqueId ?? reservationId,
              description,
            },
            source: 'reconcile' as const,
            createdAt: created,
            updatedAt: now,
          };
        });
        return mapped.sort((a, b) =>
          (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
        );
      }

      const includePending = (options?.statusFilter ?? 'successful') === 'all';
      const pendingReservations: PaymentRecord[] = includePending
        ? (() => {
            const now = new Date().toISOString();
            return [] as PaymentRecord[];
          })()
        : [];
      if (includePending) {
        const reservations = await this.eclipse.listReservations({
          walletId,
          limit,
          offset,
        });
        const now = new Date().toISOString();
        pendingReservations.push(
          ...(reservations ?? []).map((r: any) => {
            const created =
              r.created ??
              r.createdAt ??
              r.transactionDate ??
              r.transactionTime ??
              r.date ??
              now;
            const reservationId =
              r.reservationId ??
              r.id ??
              r.reservationID ??
              r.reservation_id ??
              r.uniqueId;
            const uniqueId =
              r.uniqueId ??
              r.uniqueReference ??
              r.reference ??
              r.paymentReference;
            const description =
              r.description ?? r.memo ?? r.narration ?? 'Reservation';
            const amount = this.parseAmount(r.amount ?? r.value ?? 0) ?? 0;
            return {
              paymentId: `reservation-${reservationId ?? uniqueId ?? crypto.randomUUID()}`,
              externalId: uniqueId ?? null,
              status: 'PENDING',
              amount: Number.isNaN(amount) ? 0 : amount,
              currency: r.currency ?? 'ZAR',
              paymentType: 'RESERVATION',
              walletId,
              raw: {
                ...r,
                paymentReference: uniqueId ?? reservationId,
                description,
              },
              source: 'reconcile' as const,
              createdAt: created,
              updatedAt: now,
            } satisfies PaymentRecord;
          }),
        );
      }

      // Eclipse paging may not match our local normalization/fee-expansion ordering.
      // We also filter out non-successful rows and synthesize fee rows, so a small
      // "limit" from Eclipse can yield fewer than "limit" rows for the UI.
      // Fetch a larger window (capped) and page locally after sorting/expanding.
      const target = Math.max(1, limit) + Math.max(0, offset);
      const fetchLimit = Math.min(200, Math.max(50, target * 5));
      const eclipsePayments = await this.eclipse.listPayments({
        walletId,
        limit: fetchLimit,
        offset: 0,
      });
      // Rely on Eclipse listPayments wallet scoping; avoid post-filtering that can drop rows
      // (some withdrawals/reservations do not echo walletId on the row).
      const normalized: PaymentRecord[] = (eclipsePayments ?? [])
        .map((p: any) => {
          const status =
            p.status ??
            p.paymentStatus ??
            p.transactionStatus ??
            p.withdrawalStatus ??
            p.state ??
            'UNKNOWN';
          const created =
            p.created ??
            p.createdAt ??
            p.transactionDate ??
            p.transactionTime ??
            p.date ??
            null;
          const amount =
            this.parseAmount(p.amount ?? p.paymentAmount ?? p.value ?? 0) ?? 0;
          const feeAmount =
            this.parseAmount(p.fee ?? p.processingFee ?? p.feeAmount ?? 0) ??
            undefined;
          const balance =
            this.parseAmount(
              p.balance ??
                p.runningBalance ??
                p.availableBalance ??
                p.currentBalance ??
                p.balanceAmount ??
                p.walletBalance ??
                p.balanceAfter ??
                p.balanceAfterTxn,
            ) ?? undefined;
          return {
            paymentId: `${p.paymentId ?? p.id ?? p.paymentReference}`,
            externalId: p.externalUniqueId ?? p.paymentReference ?? null,
            status,
            amount,
            currency: p.currency ?? 'ZAR',
            feeAmount: feeAmount ?? undefined,
            paymentType: p.paymentType ?? p.type,
            walletId: p.walletId?.toString?.(),
            customerId: p.customerId?.toString?.(),
            civilServantId: p.metadata?.guardId ?? p.guardId,
            guardToken: p.metadata?.guardToken,
            accountNumber: p.metadata?.accountNumber,
            associatedPaymentId: p.associatedPaymentId?.toString?.(),
            metadata: p.metadata,
            raw: p,
            source: 'reconcile' as const,
            createdAt: created ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            balance,
          };
        })
        .filter((p) => {
          const statusUpper = (p.status ?? '').toUpperCase();
          const filter = options?.statusFilter ?? 'successful';
          const isSuccess =
            statusUpper === 'SUCCESSFUL' ||
            statusUpper === 'SUCCESS' ||
            statusUpper === 'PAID';
          const isPending =
            statusUpper.includes('PEND') ||
            statusUpper === 'INITIATED' ||
            statusUpper === 'IN_PROGRESS' ||
            statusUpper === 'PROCESSING';

          if (filter === 'all') return true;
          if (filter === 'pending') return isPending;
          return isSuccess;
        });

      if (pendingReservations.length) {
        normalized.push(...pendingReservations);
      }

      const expanded: PaymentRecord[] = [];
      for (const rec of normalized) {
        // Drop LINK rows that have a paired associatedPaymentId to avoid double counting.
        if (rec.paymentType === 'LINK' && rec.associatedPaymentId) {
          continue;
        }
        expanded.push(rec);
        const fee =
          rec.feeAmount ??
          Number(
            (rec as any)?.raw?.fee ?? (rec as any)?.raw?.processingFee ?? 0,
          );
        if (fee && fee > 0) {
          expanded.push({
            ...rec,
            paymentId: `${rec.paymentId}-fee`,
            amount: -Math.abs(fee),
            paymentType: 'FEE',
            createdAt: rec.createdAt,
          });
        }
      }

      return expanded
        .sort((a, b) => {
          const aDate = a.createdAt ?? '';
          const bDate = b.createdAt ?? '';
          if (aDate && bDate) return bDate.localeCompare(aDate);
          const aId = Number(a.paymentId ?? 0);
          const bId = Number(b.paymentId ?? 0);
          return bId - aId;
        })
        .slice(Math.max(0, offset), Math.max(0, offset) + Math.max(1, limit));
    } catch (err) {
      this.logger.error(
        `Eclipse listPayments failed for wallet ${walletId}: ${(err as Error).message}`,
      );
    }

    // Fallback to Dynamo
    const records = await this.repo.listByWalletId(walletId);
    const priority: Record<string, number> = {
      init: 1,
      reconcile: 2,
      webhook: 3,
    };
    const byId = new Map<string, PaymentRecord>();

    for (const record of records) {
      if (record.paymentType === 'LINK' && record.associatedPaymentId) {
        continue;
      }
      const current = byId.get(record.paymentId);
      if (!current) {
        byId.set(record.paymentId, record);
        continue;
      }
      const currentPriority = priority[current.source ?? ''] ?? 0;
      const nextPriority = priority[record.source ?? ''] ?? 0;
      const isNewer =
        (record.createdAt &&
          current.createdAt &&
          record.createdAt > current.createdAt) ||
        (record.updatedAt &&
          current.updatedAt &&
          record.updatedAt > current.updatedAt);
      if (
        nextPriority > currentPriority ||
        (nextPriority === currentPriority && isNewer)
      ) {
        byId.set(record.paymentId, record);
      }
    }

    const merged = Array.from(byId.values()).sort((a, b) =>
      (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
    );

    const filter = options?.statusFilter ?? 'successful';
    const isSuccess = (status?: string) => {
      const upper = (status ?? '').toUpperCase();
      return upper === 'SUCCESSFUL' || upper === 'SUCCESS' || upper === 'PAID';
    };
    const isPending = (status?: string) => {
      const upper = (status ?? '').toUpperCase();
      return (
        upper.includes('PEND') ||
        upper === 'INITIATED' ||
        upper === 'IN_PROGRESS' ||
        upper === 'PROCESSING'
      );
    };
    const filtered =
      filter === 'all'
        ? merged
        : filter === 'pending'
          ? merged.filter((r) => isPending(r.status))
          : merged.filter((r) => isSuccess(r.status));

    const expanded: PaymentRecord[] = [];
    for (const rec of filtered) {
      expanded.push(rec);
      const fee =
        rec.feeAmount ??
        Number((rec as any)?.raw?.fee ?? (rec as any)?.raw?.processingFee ?? 0);
      if (fee && fee > 0) {
        expanded.push({
          ...rec,
          paymentId: `${rec.paymentId}-fee`,
          amount: -Math.abs(fee),
          paymentType: 'FEE',
        });
      }
    }

    return expanded
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(Math.max(0, offset), Math.max(0, offset) + Math.max(1, limit));
  }

  async listByCustomerId(customerId: string, limit = 20, offset = 0) {
    try {
      const records = await this.repo.listByCustomerId(
        customerId,
        limit,
        offset,
      );
      return records.sort((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
      );
    } catch (err) {
      this.logger.error(
        `listByCustomerId failed for ${customerId}: ${(err as Error).message}`,
      );
      return [];
    }
  }

  async recordInitiated(input: InitiatedPaymentInput) {
    const record: PaymentRecord = {
      paymentId: `${input.paymentId}`,
      externalId: input.externalId,
      status: input.status ?? 'PENDING',
      amount: input.amount,
      currency: input.currency,
      walletId: input.walletId,
      customerId: input.customerId,
      civilServantId: input.civilServantId,
      guardToken: input.guardToken,
      accountNumber: input.accountNumber,
      paymentType: input.paymentType,
      metadata: input.metadata,
      source: 'init',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repo.upsert(record);
  }

  async recordFromWebhook(payload: any) {
    const paymentId =
      payload?.paymentId?.toString() ??
      payload?.id?.toString() ??
      payload?.paymentReference?.toString();
    if (!paymentId) {
      this.logger.warn('Webhook payload missing paymentId', payload);
      return;
    }

    const amount =
      this.parseAmount(payload?.amount ?? payload?.paymentAmount ?? 0) ?? 0;
    const fee = this.parseAmount(payload?.fee ?? payload?.feeAmount ?? 0) ?? 0;
    const record: PaymentRecord = {
      paymentId,
      externalId:
        payload?.externalUniqueId ?? payload?.paymentReference ?? null,
      status: payload?.status ?? payload?.paymentStatus ?? 'UNKNOWN',
      amount,
      currency: payload?.currency ?? 'ZAR',
      feeAmount: fee || undefined,
      paymentType: payload?.paymentType,
      walletId:
        payload?.walletId?.toString?.() ??
        payload?.destinationWalletId?.toString?.(),
      customerId: payload?.customerId?.toString?.(),
      civilServantId: payload?.metadata?.guardId ?? payload?.guardId,
      guardToken: payload?.metadata?.guardToken,
      accountNumber: payload?.metadata?.accountNumber,
      associatedPaymentId: payload?.associatedPaymentId?.toString?.(),
      metadata: payload?.metadata,
      raw: payload,
      source: 'webhook',
      createdAt: payload?.created ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.repo.upsert(record);

    const status = (record.status ?? '').toUpperCase();
    const isSuccessful =
      status === 'SUCCESSFUL' || status === 'SUCCESS' || status === 'PAID';
    const isCivilServant = !!record.civilServantId || !!record.guardToken;
    const walletId =
      payload?.walletId ?? payload?.destinationWalletId ?? record.walletId;
    const amountNumber = Number(record.amount ?? 0);

    if (isSuccessful && isCivilServant) {
      // Platform fee transfer for civil servant payments
      try {
        if (
          this.tenantWalletId &&
          walletId &&
          !Number.isNaN(amountNumber) &&
          amountNumber > 0
        ) {
          const fee = 1 + amountNumber * 0.01;
          await this.eclipse.transferBetweenWallets({
            sourceWalletId: walletId.toString(),
            destinationWalletId: this.tenantWalletId,
            amount: fee,
            currency: record.currency ?? 'ZAR',
            metadata: {
              paymentId: record.paymentId,
              guardToken: record.guardToken,
              accountNumber: record.accountNumber,
              feeType: 'platform',
            },
          });
          // Record fee as a linked negative entry
          await this.repo.upsert({
            ...record,
            paymentId: `${record.paymentId}-platform-fee`,
            amount: -fee,
            paymentType: 'PLATFORM_FEE',
            source: 'webhook',
            associatedPaymentId: record.paymentId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        this.logger.error(
          `Platform fee transfer failed for payment ${record.paymentId}: ${(err as Error).message}`,
        );
      }

      await this.notifyCivilServantPayment(record);
    }
  }

  async reconcileRecent(days = 7) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const payments = await this.eclipse.listPayments();
    let synced = 0;
    for (const p of payments) {
      const createdTs = p.created ? Date.parse(p.created) : Date.now();
      if (createdTs < since) continue;
      const amount = Number(p.amount ?? p.paymentAmount ?? 0);
      const fee = Number(p.fee ?? 0);
      const record: PaymentRecord = {
        paymentId: `${p.paymentId ?? p.id ?? p.paymentReference}`,
        externalId: p.externalUniqueId ?? p.paymentReference ?? null,
        status: p.status ?? p.paymentStatus ?? 'UNKNOWN',
        amount,
        currency: p.currency ?? 'ZAR',
        feeAmount: fee || undefined,
        paymentType: p.paymentType,
        walletId: p.walletId?.toString?.(),
        customerId: p.customerId?.toString?.(),
        civilServantId: p.metadata?.guardId ?? p.guardId,
        guardToken: p.metadata?.guardToken,
        accountNumber: p.metadata?.accountNumber,
        associatedPaymentId: p.associatedPaymentId?.toString?.(),
        metadata: p.metadata,
        raw: p,
        source: 'reconcile',
        createdAt: p.created ?? new Date(createdTs).toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await this.repo.upsert(record);
      synced += 1;
    }
    return { synced, since: new Date(since).toISOString() };
  }

  async createWithdrawalWithFee(params: {
    walletId: string;
    civilServantId: string;
    amount: number;
    currency: string;
    withdrawalType: string;
    metadata?: Record<string, any>;
  }) {
    const {
      walletId,
      civilServantId,
      amount,
      currency,
      withdrawalType,
      metadata,
    } = params;

    const withdrawalPayload: any = {
      type: withdrawalType as any,
      walletId,
      amount: { currency, value: amount },
      metadata,
    };
    if (withdrawalType === 'ZA_PAYCORP_ATM') {
      const sanitizedPhone = (
        metadata?.phoneNumber ??
        metadata?.deliverToPhone ??
        ''
      ).replace(/\D/g, '');
      withdrawalPayload.amount = amount.toString();
      withdrawalPayload.deliverToPhone = sanitizedPhone;
      withdrawalPayload.externalUniqueId = randomUUID();
    }

    const withdrawal = await this.eclipse.createWithdrawal(withdrawalPayload);
    const withdrawalId =
      withdrawal?.withdrawalId?.toString() ??
      withdrawal?.id?.toString() ??
      `withdraw-${Date.now()}`;

    // Record withdrawal as negative amount
    await this.repo.upsert({
      paymentId: withdrawalId,
      status: withdrawal?.status ?? 'PENDING',
      amount: -Math.abs(amount),
      currency,
      paymentType: 'WITHDRAWAL',
      walletId,
      civilServantId,
      metadata,
      source: 'init',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Platform fee transfer (1% of withdrawal amount)
    if (this.tenantWalletId) {
      const fee = Number((amount * 0.01).toFixed(2));
      try {
        await this.eclipse.transferBetweenWallets({
          sourceWalletId: walletId,
          destinationWalletId: this.tenantWalletId,
          amount: fee,
          currency,
          metadata: {
            civilServantId,
            withdrawalId,
            feeType: 'withdrawal-platform-fee',
          },
        });

        await this.repo.upsert({
          paymentId: `${withdrawalId}-platform-fee`,
          status: 'SUCCESS',
          amount: -fee,
          currency,
          paymentType: 'PLATFORM_FEE',
          walletId,
          civilServantId,
          associatedPaymentId: withdrawalId,
          source: 'init',
          metadata: { feeType: 'withdrawal-platform-fee' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        this.logger.error(
          `Platform fee transfer failed for withdrawal ${withdrawalId}: ${(err as Error).message}`,
        );
      }
    }

    return withdrawal;
  }
}
