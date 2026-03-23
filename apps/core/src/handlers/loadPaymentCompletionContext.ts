import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamo, requireEnv } from '../lib/shared';

type WorkflowInput = {
  paymentIntentId: string;
};

export const handler = async (event: WorkflowInput) => {
  if (!event.paymentIntentId) {
    throw new Error('paymentIntentId is required.');
  }

  const query = await dynamo.send(
    new QueryCommand({
      TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
      IndexName: 'byPaymentIntent',
      KeyConditionExpression: 'paymentIntentId = :paymentIntentId',
      ExpressionAttributeValues: {
        ':paymentIntentId': event.paymentIntentId,
      },
      Limit: 1,
    })
  );

  const transaction = query.Items?.[0] as
    | {
        transactionId: string;
        civilServantId: string;
        civilServantName?: string;
        voucherDenomination: number;
        status?: string;
        customerId?: string;
        customerPhoneNumber?: string;
        customerEmail?: string;
        customerName?: string;
        payerDisplayName?: string;
        customerChargeAmount?: number;
        paymentProviderFeeAmount?: number;
        platformFeeAmount?: number;
        paymentIntentId?: string;
      }
    | undefined;

  if (!transaction) {
    throw new Error(`Transaction not found for paymentIntentId ${event.paymentIntentId}.`);
  }

  const profile = await dynamo.send(
    new GetCommand({
      TableName: requireEnv('PROFILES_TABLE_NAME'),
      Key: { profileId: transaction.civilServantId },
    })
  );

  const civilServant = profile.Item as
    | {
        phoneNumber?: string;
        displayName?: string;
        firstName?: string;
        familyName?: string;
      }
    | undefined;

  const civilServantName =
    transaction.civilServantName?.trim() ||
    civilServant?.displayName?.trim() ||
    `${civilServant?.firstName ?? ''} ${civilServant?.familyName ?? ''}`.trim() ||
    'Civil Servant';
  const payerDisplayName =
    transaction.customerName?.trim() || transaction.payerDisplayName?.trim() || 'Anonymous';

  return {
    paymentIntentId: event.paymentIntentId,
    transaction,
    civilServant,
    civilServantName,
    payerDisplayName,
    alreadyCompleted: (transaction.status ?? '').toLowerCase() === 'completed',
  };
};
