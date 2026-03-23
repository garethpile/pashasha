import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const DYNAMO_DOCUMENT_CLIENT = 'DYNAMO_DOCUMENT_CLIENT';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DYNAMO_DOCUMENT_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const region = config.get<string>('AWS_REGION') ?? 'eu-west-1';
        const client = new DynamoDBClient({ region });
        return DynamoDBDocumentClient.from(client, {
          marshallOptions: {
            removeUndefinedValues: true,
          },
        });
      },
    },
  ],
  exports: [DYNAMO_DOCUMENT_CLIENT],
})
export class DynamoConfigModule {}
