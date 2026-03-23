# Voucher Service (Serverless POC)

This service provides a voucher-based payout path (Flash / 1Voucher) without Fargate. It is designed to be swapped to Eclipse later via a provider abstraction.

## High-level flow (Option 2: internal balance → voucher on withdrawal)

1. Client calls `POST /credits` when a payment is collected.
2. Lambda writes a ledger entry and increments the recipient balance.
3. Recipient taps “Withdraw” → client calls `POST /payouts`.
4. Lambda checks balance, records a debit entry, writes a payout intent, and starts Step Functions.
5. Step Functions runs `issueVoucher` → Flash API.
6. Voucher details stored and SMS sent.
7. Flash webhook updates redemption/expiry status.

## Core resources (AWS)

- API Gateway
- Lambda: `createPayout`, `issueVoucher`, `webhookHandler`, `getPayout`
- Step Functions: `voucher-payout` state machine
- DynamoDB: `voucher_recipients`, `voucher_payouts`, `voucher_payout_events`, `voucher_ledger`
- Secrets Manager: `FLASH_API_KEY`, `FLASH_API_SECRET`
- SNS/Pinpoint: SMS delivery

## Provider abstraction

The `PayoutProvider` interface lives in `src/lib/provider.ts`. Flash is implemented now; Eclipse can be added later without changing the API contract.

## CDK stack

The CDK sketch lives in `infra/cdk/lib/voucher-stack.ts` and is wired into `infra/cdk/bin/pashashapay.ts` as `PashashaPayVoucherStack`.

## Environment variables

- `PAYOUTS_TABLE_NAME`
- `RECIPIENTS_TABLE_NAME`
- `EVENTS_TABLE_NAME`
- `LEDGER_TABLE_NAME`
- `FLASH_BASE_URL` (defaults to `https://api-flashswitch-sandbox.flash-group.com`)
- `FLASH_TOKEN_URL` (defaults to `https://api-flashswitch-sandbox.flash-group.com/token`)
- `FLASH_SECRETS_ARN` (Secrets Manager JSON with Flash API credentials)
- `FLASH_API_KEY` (fallback if `FLASH_SECRETS_ARN` is not set)
- `FLASH_ACCOUNT_NUMBER` (fallback if `FLASH_SECRETS_ARN` is not set)
- `FLASH_CASH_OUT_PRODUCT_CODE`
- `FLASH_TOKEN_PRODUCT_CODE`
- `FLASH_WEBHOOK_SIGNATURE_HEADER`
- `FLASH_WEBHOOK_SECRET`
- `FLASH_USE_MOCK` (`true` for local/simulated mode, `false` for real Flash sandbox)
- `SMS_SENDER_ID`

### Secrets Manager payload

If `FLASH_SECRETS_ARN` is set, the secret value can be JSON:

```
{
  "apiKey": "<base64(client_id:client_secret)>",
  "accountNumber": "3346-3276-9212-2982",
  "tokenUrl": "https://api-flashswitch-sandbox.flash-group.com/token",
  "baseUrl": "https://api-flashswitch-sandbox.flash-group.com",
  "cashOutProductCode": 1234,
  "flashTokenProductCode": 5678,
  "useMock": false,
  "webhookSecret": "..."
}
```

## DynamoDB schema notes

- `voucher_payouts` uses TTL on `expiresAtEpoch` (epoch seconds).
- `voucher_payouts` includes a GSI `recipientId-index` (PK: `recipientId`, SK: `createdAt`).
- `voucher_payout_events` uses TTL on `ttlEpoch` (30 days).
- `voucher_ledger` stores credit/debit entries (PK: `recipientId`, SK: `createdAt`).

## Store helpers

- `listPayoutsByRecipient(recipientId, limit)` uses `recipientId-index` for recent payouts.

## API routes (voucher service)

- `POST /credits` → record incoming payment (credit balance)
- `POST /payouts` → withdraw and create payout intent
- `GET /payouts/{payoutId}` → payout status
- `GET /recipients/{recipientId}/balance` → current available balance
- `GET /recipients/{recipientId}/payouts?limit=20` → list recent payouts
- `POST /webhooks/flash` → flash status updates

## Files

- `src/handlers/createPayout.ts`: API entrypoint
- `src/handlers/recordCredit.ts`: record credits
- `src/handlers/getBalance.ts`: balance lookup
- `src/handlers/issueVoucher.ts`: Step Functions task
- `src/handlers/webhookHandler.ts`: Flash webhook
- `src/handlers/getPayout.ts`: payout status lookup
- `src/handlers/listRecipientPayouts.ts`: list payouts for a recipient
- `state-machines/voucher-payout.asl.json`: Step Functions definition

## Notes

- The implementation is intentionally minimal. Replace TODOs with real DynamoDB access and Flash API calls.
- Keep business logic out of handlers; use provider + store abstractions.
