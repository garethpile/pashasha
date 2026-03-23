export const json = (statusCode: number, body: unknown, headers?: Record<string, string>) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    ...(headers ?? {}),
  },
  body: JSON.stringify(body ?? {}),
});

export const text = (statusCode: number, body: string, headers?: Record<string, string>) => ({
  statusCode,
  headers: {
    'Content-Type': 'text/plain',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    ...(headers ?? {}),
  },
  body,
});

export const binary = (statusCode: number, body: Buffer, headers?: Record<string, string>) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    ...(headers ?? {}),
  },
  body: body.toString('base64'),
  isBase64Encoded: true,
});
