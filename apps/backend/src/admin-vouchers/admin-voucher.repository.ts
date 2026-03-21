import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DYNAMO_DOCUMENT_CLIENT } from '../config/dynamo.config';
import { VaultEnvelope } from './voucher-vault.service';

export interface AdminVoucherRecord {
  voucherId: string;
  supplierKey: string;
  supplierLabel: string;
  amountMinor: number;
  currency: string;
  status: 'available';
  barcodeLast4: string;
  barcodeHash: string;
  rawSmsHash: string;
  barcodeVault: VaultEnvelope;
  rawSmsVault: VaultEnvelope;
  source: 'telegram-admin-bot';
  createdAt: string;
  updatedAt: string;
  ingestedByUserId: string;
  ingestedByActorId?: string;
}

@Injectable()
export class AdminVoucherRepository {
  private readonly tableName: string;

  constructor(
    @Inject(DYNAMO_DOCUMENT_CLIENT)
    private readonly dynamo: DynamoDBDocumentClient,
    private readonly config: ConfigService,
  ) {
    this.tableName =
      this.config.get<string>('VOUCHER_INVENTORY_TABLE_NAME') ??
      'PashashaPay-VoucherInventory';
  }

  async put(record: AdminVoucherRecord) {
    await this.dynamo.send(
      new PutCommand({
        TableName: this.tableName,
        Item: record,
        ConditionExpression: 'attribute_not_exists(voucherId)',
      }),
    );
    return record;
  }
}
