import type { Handler } from 'aws-lambda';

export const handler: Handler = async (event) => {
  // TODO: send SMS via SNS/Pinpoint with voucher code.
  return { ok: true, event };
};
