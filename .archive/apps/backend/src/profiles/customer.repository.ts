import { Inject, Injectable } from '@nestjs/common';
import {
  PutCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { DYNAMO_DOCUMENT_CLIENT } from '../config/dynamo.config';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { CustomerEntity } from './entities/customer.entity';

@Injectable()
export class CustomerRepository {
  private readonly tableName: string;

  constructor(
    @Inject(DYNAMO_DOCUMENT_CLIENT)
    private readonly dynamo: DynamoDBDocumentClient,
    private readonly config: ConfigService,
  ) {
    this.tableName =
      this.config.get<string>('CUSTOMERS_TABLE_NAME') ?? 'Pashasha-customers';
  }

  async put(customer: CustomerEntity) {
    await this.dynamo.send(
      new PutCommand({
        TableName: this.tableName,
        Item: customer,
      }),
    );
    return customer;
  }

  async get(customerId: string) {
    const result = await this.dynamo.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { customerId },
      }),
    );
    return result.Item as CustomerEntity | undefined;
  }

  async delete(customerId: string) {
    await this.dynamo.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { customerId },
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
    return (result.Items ?? []) as CustomerEntity[];
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
    return (result.Items ?? []) as CustomerEntity[];
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
    return (result.Items ?? []) as CustomerEntity[];
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
    return (result.Items ?? []) as CustomerEntity[];
  }

  async update(
    customerId: string,
    updates: Partial<Omit<CustomerEntity, 'customerId' | 'accountNumber'>>,
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
        Key: { customerId },
        UpdateExpression: 'SET ' + expressions.join(', '),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }),
    );
  }
}
