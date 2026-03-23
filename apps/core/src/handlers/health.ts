import { json } from '../lib/shared';

export const handler = async () =>
  json(200, {
    status: 'ok',
    service: 'core-backend',
    timestamp: new Date().toISOString(),
  });
