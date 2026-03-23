import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { requireEnv } from '../lib/shared';

const secrets = new SecretsManagerClient({});
let cachedNotificationsCoreKey: string | undefined;

const getNotificationsCoreKey = async () => {
  if (cachedNotificationsCoreKey) return cachedNotificationsCoreKey;
  const response = await secrets.send(
    new GetSecretValueCommand({ SecretId: requireEnv('NOTIFICATIONS_CORE_API_KEY_SECRET_ARN') })
  );
  const parsed = JSON.parse(response.SecretString ?? '{}') as { apiKey?: string };
  if (!parsed.apiKey) throw new Error('Notifications core API key secret missing apiKey.');
  cachedNotificationsCoreKey = parsed.apiKey;
  return cachedNotificationsCoreKey;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

type WorkflowState = {
  context: {
    transaction: {
      transactionId: string;
      customerId?: string;
      customerPhoneNumber?: string;
      paymentIntentId?: string;
      voucherDenomination?: number;
    };
    civilServant?: {
      phoneNumber?: string;
    };
    civilServantName: string;
    payerDisplayName: string;
  };
  allocation: {
    voucherAllocationId: string;
    voucherCode: string | null;
    voucherCodeStatus?: 'available' | 'unavailable';
    supplier?: string;
    barcodeLast4?: string;
  };
};

export const handler = async (event: WorkflowState) => {
  const transaction = event.context?.transaction;
  const civilServant = event.context?.civilServant;
  const allocation = event.allocation;

  if (!transaction?.transactionId || !allocation?.voucherAllocationId) {
    throw new Error('Workflow notification state is incomplete.');
  }

  const notificationsKey = await getNotificationsCoreKey();
  const civilServantName = event.context.civilServantName || 'Civil Servant';
  const payerDisplayName = event.context.payerDisplayName || 'Anonymous';
  const amountLabel = formatCurrency(Number(transaction.voucherDenomination ?? 0));
  const supplierName = allocation.supplier?.trim() || 'Shoprite Checkers';
  const reference = transaction.paymentIntentId ?? transaction.transactionId;

  let deliveryStatus = 'pending';
  let customerNotificationStatus = 'not-requested';

  if (!allocation.voucherCode) {
    deliveryStatus = 'voucher-code-unavailable';
  } else if (civilServant?.phoneNumber) {
    const recipientNotification = await fetch(
      `${requireEnv('NOTIFICATIONS_API_URL').replace(/\/$/, '')}/internal/notifications/send`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-core-api-key': notificationsKey,
        },
        body: JSON.stringify({
          notificationType: 'voucher-issued',
          recipient: {
            phoneNumber: civilServant.phoneNumber,
          },
          templateData: {
            civilServantName,
            payerDisplayName,
            amountLabel,
            voucherCode: allocation.voucherCode,
            supplierName,
            barcodeLast4: allocation.barcodeLast4,
            voucherAllocationId: allocation.voucherAllocationId,
            reference,
          },
        }),
      }
    );
    deliveryStatus = recipientNotification.ok ? 'sent' : 'failed';
  } else {
    deliveryStatus = 'no-recipient-phone';
  }

  if (!transaction.customerId?.startsWith('guest:') && transaction.customerPhoneNumber?.trim()) {
    const customerNotification = await fetch(
      `${requireEnv('NOTIFICATIONS_API_URL').replace(/\/$/, '')}/internal/notifications/send`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-core-api-key': notificationsKey,
        },
        body: JSON.stringify({
          notificationType: 'customer-voucher-sent',
          recipient: {
            phoneNumber: transaction.customerPhoneNumber,
          },
          templateData: {
            civilServantName,
            amountLabel,
            supplierName,
            reference,
          },
        }),
      }
    );
    customerNotificationStatus = customerNotification.ok ? 'sent' : 'failed';
  }

  return {
    deliveryStatus,
    customerNotificationStatus,
    supplierName,
    amountLabel,
    reference,
    voucherCodeStatus:
      allocation.voucherCodeStatus ?? (allocation.voucherCode ? 'available' : 'unavailable'),
  };
};
