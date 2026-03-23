import { Inject, Injectable } from '@nestjs/common';
import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { DYNAMO_DOCUMENT_CLIENT } from '../config/dynamo.config';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { CivilServantEntity } from './entities/civil-servant.entity';

@Injectable()
export class CivilServantRepository {
  private readonly tableName: string;

  constructor(
    @Inject(DYNAMO_DOCUMENT_CLIENT)
    private readonly dynamo: DynamoDBDocumentClient,
    private readonly config: ConfigService,
  ) {
    this.tableName =
      this.config.get<string>('CIVIL_SERVANTS_TABLE_NAME') ??
      'Pashasha-civil-servants';
  }

  async put(entity: CivilServantEntity) {
    await this.dynamo.send(
      new PutCommand({
        TableName: this.tableName,
        Item: entity,
      }),
    );
    return entity;
  }

  async get(civilServantId: string) {
    const result = await this.dynamo.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { civilServantId },
      }),
    );
    return result.Item as CivilServantEntity | undefined;
  }

  async delete(civilServantId: string) {
    await this.dynamo.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { civilServantId },
      }),
    );
  }

  async list(limit = 50) {
    const result = await this.dynamo.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
      }),
    );
    return (result.Items ?? []) as CivilServantEntity[];
  }

  async findByGuardToken(token: string) {
    try {
      const result = await this.dynamo.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'guardToken',
          KeyConditionExpression: 'guardToken = :token',
          ExpressionAttributeValues: {
            ':token': token,
          },
          Limit: 1,
        }),
      );
      const [item] = (result.Items ?? []) as CivilServantEntity[];
      if (item) {
        return item;
      }
    } catch (error: unknown) {
      const name = (error as { name?: string })?.name;
      if (name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    const fallback = await this.dynamo.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'guardToken = :token',
        ExpressionAttributeValues: {
          ':token': token,
        },
        Limit: 1,
      }),
    );
    const [item] = (fallback.Items ?? []) as CivilServantEntity[];
    return item;
  }

  async findByAccountNumber(accountNumber: string) {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'accountNumber',
        KeyConditionExpression: 'accountNumber = :acc',
        ExpressionAttributeValues: {
          ':acc': accountNumber,
        },
      }),
    );
    return (result.Items ?? []) as CivilServantEntity[];
  }

  async findByFamilyName(familyName: string) {
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'familyNameUpper',
        KeyConditionExpression: 'familyNameUpper = :name',
        ExpressionAttributeValues: {
          ':name': familyName.toUpperCase(),
        },
      }),
    );
    return (result.Items ?? []) as CivilServantEntity[];
  }

  async findByEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const result = await this.dynamo.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'email',
        KeyConditionExpression: 'emailLower = :email',
        ExpressionAttributeValues: {
          ':email': normalized,
        },
      }),
    );
    return (result.Items ?? []) as CivilServantEntity[];
  }

  async update(
    civilServantId: string,
    updates: Partial<
      Omit<CivilServantEntity, 'civilServantId' | 'accountNumber'>
    >,
  ) {
    const expressions: string[] = [];
    const names: Record<string, string> = {};
    const values: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }
      const attr = `#${key}`;
      const val = `:${key}`;
      expressions.push(`${attr} = ${val}`);
      names[attr] = key;
      values[val] = value;
    });

    if (updates.familyName) {
      expressions.push('#familyNameUpper = :familyNameUpper');
      names['#familyNameUpper'] = 'familyNameUpper';
      values[':familyNameUpper'] = updates.familyName.toUpperCase();
    }
    if (updates.email) {
      expressions.push('#emailLower = :emailLower');
      names['#emailLower'] = 'emailLower';
      values[':emailLower'] = updates.email.trim().toLowerCase();
    }

    expressions.push('#updatedAt = :updatedAt');
    names['#updatedAt'] = 'updatedAt';
    values[':updatedAt'] = new Date().toISOString();

    await this.dynamo.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { civilServantId },
        UpdateExpression: 'SET ' + expressions.join(', '),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }),
    );
  }
}
