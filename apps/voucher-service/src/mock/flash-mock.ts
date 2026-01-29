import http from 'http';
import { buildMockCashOutPinResponse, buildMockPurchaseResponse } from '../lib/flash-mock.js';

const port = Number(process.env.FLASH_MOCK_PORT ?? 4010);

const sendJson = (res: http.ServerResponse, status: number, payload: any) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const readBody = (req: http.IncomingMessage): Promise<string> =>
  new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    res.statusCode = 404;
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/token') {
    return sendJson(res, 200, {
      access_token: `mock-${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'am_application_scope default',
    });
  }

  if (req.method === 'POST' && req.url === '/aggregation/4.0/1voucher/purchase') {
    const raw = await readBody(req);
    const payload = raw ? JSON.parse(raw) : {};
    if (!payload?.reference || !payload?.accountNumber || !payload?.amount) {
      return sendJson(res, 400, {
        responseCode: 4001,
        responseMessage: 'missing reference, accountNumber or amount',
        reference: payload?.reference ?? '',
      });
    }
    const response = buildMockPurchaseResponse({
      reference: String(payload.reference),
      accountNumber: String(payload.accountNumber),
      amountCents: Number(payload.amount),
    });
    return sendJson(res, 200, response);
  }

  if (req.method === 'POST' && req.url === '/aggregation/4.0/cash-out-pin/purchase') {
    const raw = await readBody(req);
    const payload = raw ? JSON.parse(raw) : {};
    if (
      !payload?.reference ||
      !payload?.accountNumber ||
      !payload?.amount ||
      payload?.productCode === undefined
    ) {
      return sendJson(res, 400, {
        responseCode: 4001,
        responseMessage: 'missing reference, accountNumber, amount or productCode',
        reference: payload?.reference ?? '',
      });
    }
    const response = buildMockCashOutPinResponse({
      reference: String(payload.reference),
      accountNumber: String(payload.accountNumber),
      amountCents: Number(payload.amount),
      productCode: Number(payload.productCode),
    });
    return sendJson(res, 200, response);
  }

  if (req.method === 'POST' && req.url === '/aggregation/4.0/cash-out-pin/cancel') {
    const raw = await readBody(req);
    const payload = raw ? JSON.parse(raw) : {};
    return sendJson(res, 200, {
      responseCode: 0,
      responseMessage: 'Success',
      accountNumber: payload?.accountNumber ?? '',
      reference: payload?.reference ?? '',
      transactionDate: new Date().toISOString(),
      transactionId: Math.floor(Math.random() * 1_000_000),
      metadata: payload?.metadata ?? {},
    });
  }

  if (req.method === 'POST' && req.url === '/aggregation/4.0/cash-out-pin/lookup') {
    const raw = await readBody(req);
    const payload = raw ? JSON.parse(raw) : {};
    return sendJson(res, 200, {
      responseCode: 0,
      responseMessage: 'Success',
      accountNumber: payload?.accountNumber ?? '',
      reference: payload?.reference ?? '',
      transactionDate: new Date().toISOString(),
      transactionId: Math.floor(Math.random() * 1_000_000),
      voucher: {
        amount: 0,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pin: '0000000000',
        serialNumber: payload?.serialNumber ?? 'CP-UNKNOWN',
        status: 'ACTIVE',
        content: {
          redemptionInstructions: 'Redeem at participating Flash outlets.',
          termsAndConditions: 'Cash Out PIN valid for 30 days from issue.',
        },
      },
      metadata: payload?.metadata ?? {},
    });
  }

  if (req.method === 'POST' && req.url === '/aggregation/4.0/cash-out-pin/reverse') {
    const raw = await readBody(req);
    const payload = raw ? JSON.parse(raw) : {};
    return sendJson(res, 200, {
      responseCode: 0,
      responseMessage: 'Success',
      accountNumber: payload?.accountNumber ?? '',
      reference: payload?.reference ?? '',
      transactionDate: new Date().toISOString(),
      transactionId: Math.floor(Math.random() * 1_000_000),
      metadata: payload?.metadata ?? {},
    });
  }

  res.statusCode = 404;
  res.end();
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Flash mock listening on http://localhost:${port}`);
});
