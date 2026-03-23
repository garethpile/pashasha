import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { getPaymentCoreApiKey, dynamo, json, requireEnv } from '../lib/shared';

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const paymentIntentId = event.pathParameters?.paymentIntentId;
    if (!paymentIntentId) {
      return json(400, { message: 'paymentIntentId is required.' });
    }

    const paymentApiKey = await getPaymentCoreApiKey();
    const paymentResponse = await fetch(
      `${requireEnv('PAYMENT_API_URL').replace(/\/$/, '')}/internal/payment-intents/${paymentIntentId}`,
      {
        headers: {
          'x-core-api-key': paymentApiKey,
        },
      }
    );

    if (paymentResponse.status === 404) {
      return json(404, { message: 'Payment intent not found.' });
    }
    if (!paymentResponse.ok) {
      return json(502, { message: 'Payment engine lookup failed.' });
    }

    const paymentIntent = (await paymentResponse.json()) as {
      paymentIntentId: string;
      status: string;
    };

    const transactions = await dynamo.send(
      new QueryCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        IndexName: 'byPaymentIntent',
        KeyConditionExpression: 'paymentIntentId = :paymentIntentId',
        ExpressionAttributeValues: {
          ':paymentIntentId': paymentIntentId,
        },
        Limit: 1,
      })
    );

    const transaction = transactions.Items?.[0] as
      | {
          transactionId?: string;
          status?: string;
          customerChargeAmount?: number;
          voucherAmount?: number;
          voucherDenomination?: number;
          paymentProviderFeeAmount?: number;
          platformFeeAmount?: number;
          deliveryStatus?: string;
        }
      | undefined;

    return json(200, {
      paymentIntentId,
      status: paymentIntent.status,
      amount: transaction?.customerChargeAmount ?? paymentIntent.amount ?? undefined,
      voucherAmount: transaction?.voucherAmount ?? transaction?.voucherDenomination ?? undefined,
      customerChargeAmount: transaction?.customerChargeAmount ?? undefined,
      paymentProviderFeeAmount: transaction?.paymentProviderFeeAmount ?? undefined,
      platformFeeAmount: transaction?.platformFeeAmount ?? undefined,
      transactionId: transaction?.transactionId ?? null,
      voucherAllocation: {
        status: transaction?.status === 'completed' ? 'allocated' : 'pending',
        deliveryStatus:
          transaction?.deliveryStatus ?? (transaction?.status === 'completed' ? 'sent' : 'pending'),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
