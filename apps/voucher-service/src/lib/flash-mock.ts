import { randomUUID } from 'crypto';

type MockPurchaseInput = {
  reference: string;
  accountNumber: string;
  amountCents: number;
  productCode?: number;
};

const inMemoryPurchases = new Map<string, any>();

const buildVoucherPin = () =>
  `${Math.floor(100000 + Math.random() * 900000)}${Math.floor(1000 + Math.random() * 9000)}`;

const buildSerial = () => `1V-${Math.floor(100000000 + Math.random() * 900000000)}`;
const buildCashOutSerial = () => `CP-${Math.floor(100000000 + Math.random() * 900000000)}`;

export const buildMockPurchaseResponse = (input: MockPurchaseInput) => {
  if (inMemoryPurchases.has(input.reference)) {
    return inMemoryPurchases.get(input.reference);
  }

  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const response = {
    responseCode: 0,
    responseMessage: 'Success',
    accountNumber: input.accountNumber,
    reference: input.reference,
    transactionDate: new Date().toISOString(),
    transactionId: Math.floor(Math.random() * 1_000_000),
    storeId: 'ONLINE',
    terminalId: 'WEB',
    amount: input.amountCents,
    voucher: {
      amount: input.amountCents,
      expiryDate: expiry,
      pin: buildVoucherPin(),
      serialNumber: buildSerial(),
      status: 'ACTIVE',
      content: {
        redemptionInstructions: 'Redeem at participating Flash outlets.',
        termsAndConditions: 'Voucher valid for 30 days from issue.',
      },
    },
    metadata: {
      source: 'mock',
      requestId: randomUUID(),
    },
  };

  inMemoryPurchases.set(input.reference, response);
  return response;
};

export const buildMockCashOutPinResponse = (input: MockPurchaseInput) => {
  if (inMemoryPurchases.has(input.reference)) {
    return inMemoryPurchases.get(input.reference);
  }

  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const response = {
    responseCode: 0,
    responseMessage: 'Success',
    accountNumber: input.accountNumber,
    reference: input.reference,
    transactionDate: new Date().toISOString(),
    transactionId: Math.floor(Math.random() * 1_000_000),
    storeId: 'ONLINE',
    terminalId: 'WEB',
    amount: input.amountCents,
    productCode: input.productCode ?? 1001,
    voucher: {
      amount: input.amountCents,
      expiryDate: expiry,
      pin: buildVoucherPin(),
      serialNumber: buildCashOutSerial(),
      status: 'ACTIVE',
      content: {
        redemptionInstructions: 'Redeem at participating Flash outlets.',
        termsAndConditions: 'Cash Out PIN valid for 30 days from issue.',
      },
    },
    metadata: {
      source: 'mock',
      requestId: randomUUID(),
    },
  };

  inMemoryPurchases.set(input.reference, response);
  return response;
};
