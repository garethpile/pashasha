import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DYNAMO_DOCUMENT_CLIENT } from '../config/dynamo.config';
import { PaymentRecord } from './payment.entity';

@Injectable()
export class PaymentsRepository {
  private readonly tableName: string;
  private readonly logger = new Logger(PaymentsRepository.name);

  constructor(
    @Inject(DYNAMO_DOCUMENT_CLIENT)
    private readonly dynamo: DynamoDBDocumentClient,
    private readonly config: ConfigService,
  ) {
    this.tableName =
      this.config.get<string>('PAYMENTS_TABLE_NAME') ?? 'Pashasha-payments';
  }

  async upsert(record: PaymentRecord) {
    const item: PaymentRecord = {
      ...record,
      createdAt: record.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.dynamo.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      }),
    );
    return item;
  }

  async updateStatus(paymentId: string, status: string) {
    await this.dynamo.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { paymentId },
        UpdateExpression: 'SET #s = :s, updatedAt = :u',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': status,
          ':u': new Date().toISOString(),
        },
      }),
    );
  }

  async listByWalletId(walletId: string) {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'byWallet',
        KeyConditionExpression: '#w = :w',
        ExpressionAttributeNames: { '#w': 'walletId' },
        ExpressionAttributeValues: { ':w': walletId },
      }),
    );
    return (result.Items ?? []) as PaymentRecord[];
  }

  async listByCustomerId(customerId: string, limit = 20, offset = 0) {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'byCustomer',
        KeyConditionExpression: '#c = :c',
        ExpressionAttributeNames: { '#c': 'customerId' },
        ExpressionAttributeValues: { ':c': customerId },
        Limit: limit,
      }),
    );
    const items = (result.Items ?? []) as PaymentRecord[];
    return items
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(offset, offset + limit);
  }
}
