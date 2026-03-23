import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamo, requireEnv } from '../lib/shared';

type WorkflowState = {
  paymentIntentId?: string;
  context?: {
    paymentIntentId?: string;
    transaction?: {
      transactionId?: string;
    };
  };
  error?: {
    Error?: string;
    Cause?: string;
  };
};

export const handler = async (event: WorkflowState) => {
  const paymentIntentId = event.context?.paymentIntentId ?? event.paymentIntentId;
  const transactionId = event.context?.transaction?.transactionId;

  let resolvedTransactionId = transactionId;
  if (!resolvedTransactionId && paymentIntentId) {
    const query = await dynamo.send(
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
    resolvedTransactionId = String(query.Items?.[0]?.transactionId ?? '').trim();
  }

  if (!resolvedTransactionId) {
    return {
      status: 'failed',
      paymentIntentId: paymentIntentId ?? null,
      message: 'No transaction found to mark as failed.',
    };
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
      Key: { transactionId: resolvedTransactionId },
      UpdateExpression:
        'SET updatedAt = :updatedAt, completionWorkflowStatus = :workflowStatus, completionError = :completionError',
      ExpressionAttributeValues: {
        ':updatedAt': new Date().toISOString(),
        ':workflowStatus': 'failed',
        ':completionError': JSON.stringify(event.error ?? {}),
      },
    })
  );

  return {
    transactionId: resolvedTransactionId,
    status: 'failed',
  };
};
