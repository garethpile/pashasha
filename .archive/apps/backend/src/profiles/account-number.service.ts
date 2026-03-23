import { Inject, Injectable } from '@nestjs/common';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { DYNAMO_DOCUMENT_CLIENT } from '../config/dynamo.config';

type AccountNumberType = 'CUSTOMER' | 'CIVIL_SERVANT';

@Injectable()
export class AccountNumberService {
  private readonly counterTable: string;

  constructor(
    @Inject(DYNAMO_DOCUMENT_CLIENT)
    private readonly dynamo: DynamoDBDocumentClient,
    private readonly config: ConfigService,
  ) {
    this.counterTable =
      this.config.get<string>('COUNTER_TABLE_NAME') ??
      'Pashasha-account-counters';
  }

  async nextAccountNumber(type: AccountNumberType) {
    const prefix = type === 'CUSTOMER' ? 'CU' : 'CS';
    const result = await this.dynamo.send(
      new UpdateCommand({
        TableName: this.counterTable,
        Key: {
          pk: 'ACCOUNT_COUNTER',
          sk: type,
        },
        UpdateExpression: 'ADD #value :inc',
        ExpressionAttributeNames: {
          '#value': 'value',
        },
        ExpressionAttributeValues: {
          ':inc': 1,
        },
        ReturnValues: 'UPDATED_NEW',
      }),
    );

    const counter = result.Attributes?.value as number;
    return `${prefix}${String(counter).padStart(8, '0')}`;
  }
}
