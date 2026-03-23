import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { requireEnv } from '../lib/shared';

const secrets = new SecretsManagerClient({});
let cachedVoucherCoreKey: string | undefined;

const getVoucherCoreKey = async () => {
  if (cachedVoucherCoreKey) return cachedVoucherCoreKey;
  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('VOUCHER_CORE_API_KEY_SECRET_ARN') })
  );
  const parsed = JSON.parse(response.SecretString ?? '{}') as { apiKey?: string };
  if (!parsed.apiKey) throw new Error('Voucher core API key secret missing apiKey.');
  cachedVoucherCoreKey = parsed.apiKey;
  return cachedVoucherCoreKey;
};

type WorkflowState = {
  context: {
    transaction: {
      transactionId: string;
      civilServantId: string;
      voucherDenomination: number;
    };
  };
};

export const handler = async (event: WorkflowState) => {
  const transaction = event.context?.transaction;
  if (!transaction?.transactionId || !transaction?.civilServantId) {
    throw new Error('Workflow transaction context is incomplete.');
  }

  const voucherKey = await getVoucherCoreKey();
  const response = await fetch(
    `${requireEnv('VOUCHER_API_URL').replace(/\/$/, '')}/internal/allocations`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-core-api-key': voucherKey,
      },
      body: JSON.stringify({
        transactionId: transaction.transactionId,
        civilServantId: transaction.civilServantId,
        denomination: transaction.voucherDenomination,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Voucher allocation failed.');
  }

  return (await response.json()) as {
    voucherAllocationId: string;
    voucherCode: string | null;
    voucherCodeStatus?: 'available' | 'unavailable';
    status: string;
    deliveryStatus: string;
    supplier?: string;
    barcodeLast4?: string;
  };
};
