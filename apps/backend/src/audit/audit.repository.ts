import { Inject, Injectable } from '@nestjs/common';
import { PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { DYNAMO_DOCUMENT_CLIENT } from '../config/dynamo.config';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { AuditLogEntry } from './audit.entity';

@Injectable()
export class AuditRepository {
  private readonly tableName: string;

  constructor(
    @Inject(DYNAMO_DOCUMENT_CLIENT)
    private readonly dynamo: DynamoDBDocumentClient,
    private readonly config: ConfigService,
  ) {
    this.tableName =
      this.config.get<string>('AUDIT_TABLE_NAME') ?? 'PashashaPay-AuditLogs';
  }

  async put(entry: AuditLogEntry) {
    await this.dynamo.send(
      new PutCommand({
        TableName: this.tableName,
        Item: entry,
      }),
    );
    return entry;
  }

  async queryByUser(userId: string, limit = 50) {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        Limit: limit,
        ScanIndexForward: false,
      }),
    );
    return (result.Items ?? []) as AuditLogEntry[];
  }

  async queryByType(eventType: string, limit = 50) {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'eventType-index',
        KeyConditionExpression: 'eventType = :eventType',
        ExpressionAttributeValues: {
          ':eventType': eventType,
        },
        Limit: limit,
        ScanIndexForward: false,
      }),
    );
    return (result.Items ?? []) as AuditLogEntry[];
  }

  async listRecent(limit = 50) {
    const result = await this.dynamo.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
      }),
    );
    const items = (result.Items ?? []) as AuditLogEntry[];
    return items
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);
  }
}
