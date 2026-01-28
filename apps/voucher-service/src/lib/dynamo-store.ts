import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  LedgerEntry,
  PayoutIntent,
  PayoutResult,
  PayoutStatus,
  RecipientBalance,
  RecipientProfile,
} from './types.js';
import type { PayoutStore } from './store.js';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class DynamoPayoutStore implements PayoutStore {
  constructor(
    private readonly payoutsTable: string,
    private readonly recipientsTable: string,
    private readonly eventsTable: string,
    private readonly ledgerTable: string
  ) {}

  async createPayout(intent: PayoutIntent): Promise<void> {
    await client.send(
      new PutCommand({
        TableName: this.payoutsTable,
        Item: {
          payoutId: intent.id,
          recipientId: intent.recipientId,
          amount: intent.amount,
          currency: intent.currency,
          provider: intent.provider,
          reference: intent.reference,
          status: intent.status,
          createdAt: intent.createdAt,
          updatedAt: intent.createdAt,
          expiresAtEpoch: null,
        },
        ConditionExpression: 'attribute_not_exists(payoutId)',
      })
    );
  }

  async updatePayoutStatus(id: string, status: PayoutStatus, result?: PayoutResult): Promise<void> {
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      ':status': status,
      ':updatedAt': now,
    };
    const setParts = ['#status = :status', 'updatedAt = :updatedAt'];

    if (result?.providerRef) {
      updates[':providerRef'] = result.providerRef;
      setParts.push('providerRef = :providerRef');
    }
    if (result?.voucherCode) {
      updates[':voucherCode'] = result.voucherCode;
      setParts.push('voucherCode = :voucherCode');
    }
    if (result?.expiresAt) {
      updates[':expiresAt'] = result.expiresAt;
      updates[':expiresAtEpoch'] = Math.floor(new Date(result.expiresAt).getTime() / 1000);
      setParts.push('expiresAt = :expiresAt');
      setParts.push('expiresAtEpoch = :expiresAtEpoch');
    }
    if (result?.error) {
      updates[':error'] = result.error;
      setParts.push('error = :error');
    }

    await client.send(
      new UpdateCommand({
        TableName: this.payoutsTable,
        Key: { payoutId: id },
        UpdateExpression: `SET ${setParts.join(', ')}`,
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: updates,
      })
    );
  }

  async getPayout(id: string): Promise<PayoutIntent | null> {
    const result = await client.send(
      new GetCommand({
        TableName: this.payoutsTable,
        Key: { payoutId: id },
      })
    );

    if (!result.Item) return null;

    return {
      id: result.Item.payoutId as string,
      recipientId: result.Item.recipientId as string,
      amount: result.Item.amount as number,
      currency: result.Item.currency as 'ZAR',
      provider: result.Item.provider as 'flash' | 'eclipse',
      reference: result.Item.reference as string,
      status: result.Item.status as PayoutStatus,
      createdAt: result.Item.createdAt as string,
    };
  }

  async listPayoutsByRecipient(recipientId: string, limit = 20): Promise<PayoutIntent[]> {
    const result = await client.send(
      new QueryCommand({
        TableName: this.payoutsTable,
        IndexName: 'recipientId-index',
        KeyConditionExpression: 'recipientId = :recipientId',
        ExpressionAttributeValues: {
          ':recipientId': recipientId,
        },
        ScanIndexForward: false,
        Limit: limit,
      })
    );

    return (
      result.Items?.map((item) => ({
        id: item.payoutId as string,
        recipientId: item.recipientId as string,
        amount: item.amount as number,
        currency: item.currency as 'ZAR',
        provider: item.provider as 'flash' | 'eclipse',
        reference: item.reference as string,
        status: item.status as PayoutStatus,
        createdAt: item.createdAt as string,
      })) ?? []
    );
  }

  async recordEvent(
    payoutId: string,
    type: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const createdAt = new Date().toISOString();
    const ttlEpoch = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
    await client.send(
      new PutCommand({
        TableName: this.eventsTable,
        Item: {
          payoutId,
          createdAt,
          type,
          payload,
          ttlEpoch,
        },
      })
    );
  }

  async upsertRecipient(recipient: RecipientProfile, providerRef?: string): Promise<void> {
    const now = new Date().toISOString();
    await client.send(
      new UpdateCommand({
        TableName: this.recipientsTable,
        Key: { recipientId: recipient.id },
        UpdateExpression:
          'SET phone = :phone, fullName = :fullName, idNumber = :idNumber, providerRef = :providerRef, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':phone': recipient.phone,
          ':fullName': recipient.fullName ?? null,
          ':idNumber': recipient.idNumber ?? null,
          ':providerRef': providerRef ?? null,
          ':updatedAt': now,
        },
      })
    );
  }

  async recordLedgerEntry(entry: LedgerEntry): Promise<void> {
    await client.send(
      new PutCommand({
        TableName: this.ledgerTable,
        Item: {
          recipientId: entry.recipientId,
          createdAt: entry.createdAt,
          ledgerId: entry.id,
          type: entry.type,
          amount: entry.amount,
          currency: entry.currency,
          reference: entry.reference ?? null,
          source: entry.source ?? null,
        },
      })
    );
  }

  async getRecipientBalance(recipientId: string): Promise<RecipientBalance | null> {
    const result = await client.send(
      new GetCommand({
        TableName: this.recipientsTable,
        Key: { recipientId },
      })
    );

    if (!result.Item) return null;
    if (result.Item.availableBalance === undefined) return null;

    return {
      recipientId,
      availableBalance: result.Item.availableBalance as number,
      currency: (result.Item.currency as 'ZAR') ?? 'ZAR',
      updatedAt: (result.Item.updatedAt as string) ?? new Date().toISOString(),
    };
  }

  async adjustRecipientBalance(
    recipientId: string,
    delta: number,
    currency: 'ZAR',
    requireAvailable = false
  ): Promise<RecipientBalance> {
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      ':delta': delta,
      ':updatedAt': now,
      ':currency': currency,
      ':zero': 0,
    };

    const update = [
      'availableBalance = if_not_exists(availableBalance, :zero) + :delta',
      'currency = :currency',
      'updatedAt = :updatedAt',
    ];

    const command = new UpdateCommand({
      TableName: this.recipientsTable,
      Key: { recipientId },
      UpdateExpression: `SET ${update.join(', ')}`,
      ExpressionAttributeValues: updates,
      ConditionExpression: requireAvailable
        ? 'attribute_exists(recipientId) AND availableBalance >= :required'
        : undefined,
      ReturnValues: 'ALL_NEW',
    });

    if (requireAvailable) {
      updates[':required'] = Math.abs(delta);
    }

    const result = await client.send(command);
    const item = result.Attributes ?? {};
    return {
      recipientId,
      availableBalance: (item.availableBalance as number) ?? 0,
      currency: (item.currency as 'ZAR') ?? 'ZAR',
      updatedAt: (item.updatedAt as string) ?? now,
    };
  }
}
