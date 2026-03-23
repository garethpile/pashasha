import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { dynamo, json, requireEnv } from '../lib/shared';

const normalize = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase();

const matches = (actual: unknown, expected?: string | null) => {
  const query = normalize(expected);
  if (!query) return true;
  return normalize(actual).includes(query);
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const firstName = event.queryStringParameters?.firstName ?? '';
    const familyName = event.queryStringParameters?.familyName ?? '';
    const occupation = event.queryStringParameters?.occupation ?? '';
    const site = event.queryStringParameters?.site ?? '';

    if (![firstName, familyName, occupation, site].some((value) => normalize(value))) {
      return json(200, []);
    }

    const results: Array<Record<string, unknown>> = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const response = await dynamo.send(
        new ScanCommand({
          TableName: requireEnv('PROFILES_TABLE_NAME'),
          ExclusiveStartKey: exclusiveStartKey,
        })
      );

      for (const item of response.Items ?? []) {
        const record = item as Record<string, unknown>;
        if (record.entityType !== 'civil-servant') continue;
        if (normalize(record.status) !== 'active') continue;
        if (!matches(record.firstName, firstName)) continue;
        if (!matches(record.familyName, familyName)) continue;
        if (!matches(record.occupation, occupation)) continue;
        if (!matches(record.primarySite, site)) continue;

        results.push({
          civilServantId: record.civilServantId ?? record.profileId,
          firstName: record.firstName ?? '',
          familyName: record.familyName ?? '',
          occupation: record.occupation ?? '',
          primarySite: record.primarySite ?? '',
          guardToken: record.qrToken ?? '',
          accountNumber: record.accountNumber ?? record.profileId ?? '',
          status: record.status ?? 'active',
        });

        if (results.length >= 20) {
          return json(200, results);
        }
      }

      exclusiveStartKey = response.LastEvaluatedKey as Record<string, unknown> | undefined;
    } while (exclusiveStartKey);

    return json(200, results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
