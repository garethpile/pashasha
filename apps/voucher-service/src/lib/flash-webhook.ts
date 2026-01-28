import crypto from 'node:crypto';

export function verifyFlashSignature(params: {
  body: string;
  secret: string;
  signatureHeader?: string | null;
}): boolean {
  const { body, secret, signatureHeader } = params;
  if (!signatureHeader) return false;

  const expected = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');

  const provided = signatureHeader.startsWith('sha256=')
    ? signatureHeader.slice('sha256='.length)
    : signatureHeader;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch {
    return false;
  }
}
