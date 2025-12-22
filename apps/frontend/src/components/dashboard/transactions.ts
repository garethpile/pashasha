import { DashboardTransaction } from './cards';

const parseAmount = (value: any): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;

  if (typeof value === 'object') {
    if (value.value !== undefined) return parseAmount(value.value);
    if (value.amount !== undefined) return parseAmount(value.amount);
    if (value.balance !== undefined) return parseAmount(value.balance);
  }

  const str = String(value);
  const match = str.match(/-?[\d.,]+/);
  if (!match) return undefined;
  const normalized = Number(match[0].replace(/,/g, ''));
  return Number.isNaN(normalized) ? undefined : normalized;
};

export const mapDashboardTransactions = (tx: any[] = []): DashboardTransaction[] =>
  tx.map((item: any) => ({
    id: item.paymentId ?? item.externalId ?? crypto.randomUUID(),
    amount: parseAmount(item.amount) ?? 0,
    status: item.status ?? 'UNKNOWN',
    createdAt: item.createdAt ?? item.raw?.created,
    expiresAt:
      item.expiresAt ??
      item.expiryDate ??
      item.expiry ??
      item.raw?.expiresAt ??
      item.raw?.expiry ??
      item.raw?.expiresOn ??
      item.raw?.expiryDate,
    paymentType: item.paymentType ?? item.raw?.type,
    externalId: item.externalId ?? item.raw?.paymentReference ?? item.raw?.externalUniqueId,
    balance:
      parseAmount(item.balance) ??
      parseAmount(item.raw?.balance) ??
      parseAmount(item.raw?.balanceAfter) ??
      parseAmount(item.raw?.balanceAmount) ??
      parseAmount(item.raw?.walletBalance) ??
      parseAmount(item.raw?.currentBalance) ??
      parseAmount(item.raw?.availableBalance),
    availableBalance:
      parseAmount(item.availableBalance) ??
      parseAmount(item.raw?.availableBalance) ??
      parseAmount(item.raw?.balanceAmountAvailable) ??
      parseAmount(item.raw?.currentBalance),
    description: item.raw?.description ?? item.metadata?.description ?? '',
    reference:
      item.raw?.paymentReference ?? item.raw?.externalUniqueId ?? item.externalId ?? item.paymentId,
  }));
