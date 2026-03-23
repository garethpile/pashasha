import { Inject, Injectable } from '@nestjs/common';
import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { DYNAMO_DOCUMENT_CLIENT } from '../config/dynamo.config';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { AdministratorEntity } from './entities/administrator.entity';

@Injectable()
export class AdministratorRepository {
  private readonly tableName: string;

  constructor(
    @Inject(DYNAMO_DOCUMENT_CLIENT)
    private readonly dynamo: DynamoDBDocumentClient,
    private readonly config: ConfigService,
  ) {
    this.tableName =
      this.config.get<string>('ADMINISTRATORS_TABLE_NAME') ??
      'Pashasha-administrators';
  }

  async put(admin: AdministratorEntity) {
    await this.dynamo.send(
      new PutCommand({
        TableName: this.tableName,
        Item: admin,
      }),
    );
    return admin;
  }

  async get(username: string) {
    const result = await this.dynamo.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { username },
      }),
    );
    return result.Item as AdministratorEntity | undefined;
  }

  async delete(username: string) {
    await this.dynamo.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { username },
      }),
    );
  }

  async list(limit = 200) {
    const result = await this.dynamo.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
      }),
    );
    return (result.Items ?? []) as AdministratorEntity[];
  }

  async findByEmail(emailLower: string) {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'email',
        KeyConditionExpression: 'emailLower = :email',
        ExpressionAttributeValues: { ':email': emailLower },
      }),
    );
    return (result.Items ?? []) as AdministratorEntity[];
  }
}
