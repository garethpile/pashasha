import type { APIGatewayProxyResult } from 'aws-lambda';

export function json(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers':
        'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
