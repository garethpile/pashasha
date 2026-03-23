import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamo, requireEnv } from '../lib/shared';

type WorkflowState = {
  context: {
    paymentIntentId: string;
    transaction: {
      transactionId: string;
      status?: string;
    };
    payerDisplayName: string;
  };
  allocation: {
    voucherAllocationId: string;
    supplier?: string;
    barcodeLast4?: string;
  };
  notifications?: {
    deliveryStatus?: string;
    customerNotificationStatus?: string;
  };
};

export const handler = async (event: WorkflowState) => {
  const transaction = event.context?.transaction;
  if (!transaction?.transactionId) {
    throw new Error('Workflow finalize state is missing transactionId.');
  }

  if ((transaction.status ?? '').toLowerCase() === 'completed') {
    return {
      transactionId: transaction.transactionId,
      status: 'completed',
      alreadyCompleted: true,
    };
  }

  const supplierName = event.allocation?.supplier?.trim() || 'Shoprite Checkers';
  const now = new Date().toISOString();

  await dynamo.send(
    new UpdateCommand({
      TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
      Key: { transactionId: transaction.transactionId },
      UpdateExpression:
        'SET #status = :status, updatedAt = :updatedAt, completedAt = :completedAt, voucherAllocationId = :voucherAllocationId, supplierName = :supplierName, voucherBarcodeLast4 = :voucherBarcodeLast4, deliveryStatus = :deliveryStatus, customerNotificationStatus = :customerNotificationStatus, payerDisplayName = :payerDisplayName, completionWorkflowStatus = :workflowStatus REMOVE completionError',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':updatedAt': now,
        ':completedAt': now,
        ':voucherAllocationId': event.allocation.voucherAllocationId,
        ':supplierName': supplierName,
        ':voucherBarcodeLast4': event.allocation.barcodeLast4 ?? '',
        ':deliveryStatus': event.notifications?.deliveryStatus ?? 'pending',
        ':customerNotificationStatus':
          event.notifications?.customerNotificationStatus ?? 'not-requested',
        ':payerDisplayName': event.context.payerDisplayName || 'Anonymous',
        ':workflowStatus': 'succeeded',
      },
    })
  );

  return {
    transactionId: transaction.transactionId,
    paymentIntentId: event.context.paymentIntentId,
    status: 'completed',
  };
};
