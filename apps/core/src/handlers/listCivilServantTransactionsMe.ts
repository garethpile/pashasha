import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamo, findProfileByCognitoIdentity, json, requireEnv } from '../lib/shared';

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
    const civilServantId = String(profile.civilServantId ?? profile.profileId ?? '').trim();
    if (!civilServantId) {
      return json(200, []);
    }

    const result = await dynamo.send(
      new QueryCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        IndexName: 'byCivilServant',
        KeyConditionExpression: 'civilServantId = :civilServantId',
        ExpressionAttributeValues: {
          ':civilServantId': civilServantId,
        },
        ScanIndexForward: false,
      })
    );

    const wantsPending = (event.rawPath ?? event.requestContext.http.path ?? '').endsWith(
      '/pending'
    );
    const items = (result.Items ?? []) as Array<Record<string, unknown>>;
    const filtered = items.filter((item) => {
      const status = String(item.status ?? '').toLowerCase();
      return wantsPending ? status.includes('pending') : status === 'completed';
    });

    return json(
      200,
      filtered.map((item) => {
        const payerDisplayName = String(item.payerDisplayName ?? '').trim() || 'Anonymous';
        const voucherAmount = Number(
          item.voucherDenomination ?? item.voucherAmount ?? item.amount ?? 0
        );
        const supplierName =
          String(item.supplierName ?? 'Shoprite Checkers').trim() || 'Shoprite Checkers';
        return {
          paymentId: item.transactionId ?? item.paymentIntentId,
          amount: voucherAmount,
          status: toDashboardStatus(String(item.status ?? '')),
          createdAt: item.createdAt,
          paymentType: 'DIGITAL_VOUCHER',
          externalId: item.paymentIntentId ?? item.transactionId,
          metadata: {
            civilServantId: item.civilServantId,
            description: `${supplierName} voucher from ${payerDisplayName}`,
          },
          raw: {
            description: `${supplierName} voucher from ${payerDisplayName}`,
            paymentReference: item.paymentIntentId ?? item.transactionId,
          },
        };
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(message === 'Missing bearer token.' ? 401 : 404, { message });
  }
};
