import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  dynamo,
  generateTransactionId,
  getAvailableVoucherDenominations,
  getPaymentCoreApiKey,
  json,
  requireEnv,
} from '../lib/shared';

const OZOW_FEE_AMOUNT = 1.5;
const PLATFORM_FEE_AMOUNT = 1;

export const handler = async (event: APIGatewayProxyEventV2) => {
  try {
    const body = event.body
      ? (JSON.parse(event.body) as {
          civilServantId?: string;
          voucherDenomination?: number;
          paymentEngine?: string;
          customer?: {
            customerId?: string;
            firstName?: string;
            familyName?: string;
            email?: string;
            phoneNumber?: string;
          };
        })
      : {};

    if (!body.civilServantId || typeof body.voucherDenomination !== 'number') {
      return json(400, { message: 'civilServantId and voucherDenomination are required.' });
    }
    if ((body.paymentEngine ?? 'ozow') !== 'ozow') {
      return json(400, { message: 'Only ozow is currently supported.' });
    }

    const recipient = await dynamo.send(
      new GetCommand({
        TableName: requireEnv('PROFILES_TABLE_NAME'),
        Key: { profileId: body.civilServantId },
      })
    );
    const civilServant = recipient.Item as
      | {
          availableVoucherDenominations?: number[];
          civilServantId?: string;
          displayName?: string;
          firstName?: string;
          familyName?: string;
          phoneNumber?: string;
          primarySite?: string;
          occupation?: string;
        }
      | undefined;

    if (!civilServant?.civilServantId) {
      return json(404, { message: 'Civil servant not found.' });
    }

    const allowedDenominations = await getAvailableVoucherDenominations();
    if (!allowedDenominations.includes(body.voucherDenomination)) {
      return json(400, { message: 'Voucher denomination is not available for this recipient.' });
    }

    const voucherAmount = body.voucherDenomination;
    const customerChargeAmount = Number(
      (voucherAmount + OZOW_FEE_AMOUNT + PLATFORM_FEE_AMOUNT).toFixed(2)
    );
    const transactionId = generateTransactionId();
    const paymentApiKey = await getPaymentCoreApiKey();
    const payerDisplayName =
      `${body.customer?.firstName?.trim() ?? ''} ${body.customer?.familyName?.trim() ?? ''}`.trim();
    const civilServantName =
      civilServant.displayName?.trim() ||
      `${civilServant.firstName ?? ''} ${civilServant.familyName ?? ''}`.trim() ||
      'Civil Servant';

    const paymentResponse = await fetch(
      `${requireEnv('PAYMENT_API_URL').replace(/\/$/, '')}/internal/payment-intents`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-core-api-key': paymentApiKey,
        },
        body: JSON.stringify({
          amount: customerChargeAmount,
          currency: 'ZAR',
          engine: 'ozow',
          metadata: {
            civilServantId: body.civilServantId,
            civilServantName,
            voucherDenomination: voucherAmount,
            voucherAmount,
            customerChargeAmount,
            paymentProviderFeeAmount: OZOW_FEE_AMOUNT,
            platformFeeAmount: PLATFORM_FEE_AMOUNT,
            transactionId,
            customer: body.customer ?? {},
          },
        }),
      }
    );

    if (!paymentResponse.ok) {
      const errorBody = await paymentResponse.text();
      return json(502, {
        message: 'Payment engine call failed.',
        paymentResponse: errorBody,
      });
    }

    const paymentIntent = (await paymentResponse.json()) as {
      paymentIntentId: string;
      status: string;
      paymentEngine: string;
      amount: number;
      currency: string;
      checkoutReference: string;
      redirectUrl: string;
      expiresAt: string;
    };

    const now = new Date().toISOString();
    await dynamo.send(
      new PutCommand({
        TableName: requireEnv('TRANSACTIONS_TABLE_NAME'),
        Item: {
          transactionId,
          paymentIntentId: paymentIntent.paymentIntentId,
          status: 'pending-payment',
          amount: voucherAmount,
          voucherAmount,
          customerChargeAmount,
          paymentProviderFeeAmount: OZOW_FEE_AMOUNT,
          platformFeeAmount: PLATFORM_FEE_AMOUNT,
          currency: paymentIntent.currency,
          paymentEngine: paymentIntent.paymentEngine,
          payoutMethod: 'voucher',
          civilServantId: body.civilServantId,
          civilServantName,
          customerId: body.customer?.customerId?.trim() || `guest:${transactionId}`,
          customerEmail: body.customer?.email?.trim() ?? '',
          customerPhoneNumber: body.customer?.phoneNumber?.trim() ?? '',
          customerName: payerDisplayName,
          payerDisplayName: payerDisplayName || 'Anonymous',
          voucherDenomination: voucherAmount,
          createdAt: now,
          updatedAt: now,
        },
      })
    );

    return json(201, {
      paymentIntentId: paymentIntent.paymentIntentId,
      status: paymentIntent.status,
      paymentEngine: paymentIntent.paymentEngine,
      amount: paymentIntent.amount,
      voucherAmount,
      customerChargeAmount,
      paymentProviderFeeAmount: OZOW_FEE_AMOUNT,
      platformFeeAmount: PLATFORM_FEE_AMOUNT,
      currency: paymentIntent.currency,
      civilServantId: body.civilServantId,
      checkoutReference: paymentIntent.checkoutReference,
      redirectUrl: paymentIntent.redirectUrl,
      expiresAt: paymentIntent.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json(400, { message });
  }
};
