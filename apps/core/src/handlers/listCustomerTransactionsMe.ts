import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamo, findProfileByCognitoIdentity, json, requireEnv } from '../lib/shared';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const toDashboardStatus = (status?: string) => {
  const value = (status ?? '').toLowerCase();
  if (value === 'completed' || value === 'paid' || value === 'successful') return 'SUCCESSFUL';
  if (value.includes('pending')) return 'PENDING';
  if (value.includes('cancel') || value.includes('fail') || value.includes('error'))
    return 'FAILED';
  return (status ?? 'UNKNOWN').toUpperCase();
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const { profile } = await findProfileByCognitoIdentity(event);
    const customerId = String(profile.profileId ?? '').trim();
    if (!customerId) {
      return json(200, []);
    }

    const result = await dynamo.send(
      new QueryCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        IndexName: 'byCustomer',
        KeyConditionExpression: 'customerId = :customerId',
        ExpressionAttributeValues: {
          ':customerId': customerId,
        },
        ScanIndexForward: false,
      })
    );

    const items = (result.Items ?? []) as Array<Record<string, unknown>>;
    const filtered = items.filter((item) => !String(item.customerId ?? '').startsWith('guest:'));

    return json(
      200,
      filtered.map((item) => {
        const voucherAmount = Number(
          item.voucherDenomination ?? item.voucherAmount ?? item.amount ?? 0
        );
        const chargeAmount = Number(item.customerChargeAmount ?? voucherAmount);
        const civilServantName =
          String(item.civilServantName ?? 'Civil Servant').trim() || 'Civil Servant';
        return {
          paymentId: item.transactionId ?? item.paymentIntentId,
          amount: voucherAmount,
          status: toDashboardStatus(String(item.status ?? '')),
          createdAt: item.createdAt,
          paymentType: 'DIGITAL_VOUCHER',
          externalId: item.paymentIntentId ?? item.transactionId,
          civilServantId: item.civilServantId,
          metadata: {
            civilServantId: item.civilServantId,
            civilServantName,
            description: `Sent ${formatCurrency(voucherAmount)} ${String(item.supplierName ?? 'Shoprite Checkers')} voucher to ${civilServantName}. Total charged ${formatCurrency(chargeAmount)}.`,
          },
          raw: {
            description: `Sent ${formatCurrency(voucherAmount)} ${String(item.supplierName ?? 'Shoprite Checkers')} voucher to ${civilServantName}. Total charged ${formatCurrency(chargeAmount)}.`,
            paymentReference: item.paymentIntentId ?? item.transactionId,
            civilServantId: item.civilServantId,
          },
        };
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(message === 'Missing bearer token.' ? 401 : 404, { message });
  }
};
