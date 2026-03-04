import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { json } from '../lib/response.js';
import { newId } from '../lib/id.js';
import type { LedgerEntry, PayoutIntent } from '../lib/types.js';
import { createStore } from '../lib/store-factory.js';

const sfnClient = new SFNClient({});

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  if (!event.body) {
    return json(400, { error: 'missing body' });
  }

  const payload = JSON.parse(event.body) as {
    recipientId?: string;
    amount?: number;
    reference?: string;
    method?: '1VOUCHER' | 'CASH_OUT_PIN' | 'FLASH_TOKEN';
  };

  if (!payload.recipientId || !payload.amount || payload.amount <= 0) {
    return json(400, { error: 'invalid recipientId or amount' });
  }

  const totalAmount = Math.round(Number(payload.amount) * 100) / 100;
  const feeAmount = Math.round(totalAmount * 0.01 * 100) / 100;
  const voucherAmount = Math.round((totalAmount - feeAmount) * 100) / 100;
  if (!Number.isFinite(totalAmount) || totalAmount <= 0 || voucherAmount <= 0) {
    return json(400, { error: 'invalid payout amount' });
  }

  const store = createStore();
  let balance = null;
  try {
    balance = await store.adjustRecipientBalance(payload.recipientId, -totalAmount, 'ZAR', true);
  } catch (err: any) {
    return json(409, { error: err?.message ?? 'insufficient balance' });
  }

  const intent: PayoutIntent = {
    id: newId('payout'),
    recipientId: payload.recipientId,
    amount: voucherAmount,
    currency: 'ZAR',
    provider: 'flash',
    reference: newId('ref'),
    payoutMethod: payload.method ?? '1VOUCHER',
    status: 'created',
    createdAt: new Date().toISOString(),
  };

  await store.createPayout(intent);
  const ledger: LedgerEntry = {
    id: newId('ledger'),
    recipientId: payload.recipientId,
    type: 'debit',
    amount: totalAmount,
    currency: 'ZAR',
    reference: payload.reference ?? intent.reference,
    source: 'withdrawal',
    createdAt: new Date().toISOString(),
  };
  await store.recordLedgerEntry(ledger);

  const stateMachineArn = process.env.STATE_MACHINE_ARN;
  if (stateMachineArn) {
    await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn,
        input: JSON.stringify({ payoutId: intent.id }),
      })
    );
  }

  return json(202, {
    payoutId: intent.id,
    status: intent.status,
    totalAmount,
    voucherAmount,
    feeAmount,
    balance: balance?.availableBalance ?? 0,
  });
};
