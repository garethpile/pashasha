import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { findProfileByCognitoIdentity, json } from '../lib/shared';

const QRCode = require('qrcode') as {
  toDataURL: (text: string, options?: Record<string, unknown>) => Promise<string>;
};

const resolveFrontendOrigin = (event: APIGatewayProxyEventV2) => {
  const origin = event.headers.origin ?? event.headers.Origin;
  if (origin) {
    return origin;
  }

  const referer = event.headers.referer ?? event.headers.Referer;
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore malformed referer
    }
  }

  return 'https://d1kvaujkmnaiu3.cloudfront.net';
};

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const { profile } = await findProfileByCognitoIdentity(event);
    const token = String(profile.qrToken ?? '').trim();

    if (!token) {
      return json(404, { message: 'QR token not found.' });
    }

    const origin = resolveFrontendOrigin(event);
    const targetUrl = `${origin}/g?token=${encodeURIComponent(token)}`;
    const url = await QRCode.toDataURL(targetUrl, { width: 256, margin: 1 });

    return json(200, {
      url,
      targetUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(message === 'Missing bearer token.' ? 401 : 404, { message });
  }
};
