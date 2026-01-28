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
- `FLASH_API_BASE_URL`
- `FLASH_SECRETS_ARN` (Secrets Manager JSON with API credentials)
- `FLASH_API_KEY`
- `FLASH_API_SECRET`
- `FLASH_API_TOKEN`
- `FLASH_API_KEY_HEADER`
- `FLASH_API_SECRET_HEADER`
- `FLASH_API_AUTH_SCHEME` (`basic` | `bearer` | `headers`)
- `FLASH_WEBHOOK_SECRET`
- `FLASH_WEBHOOK_SIGNATURE_HEADER`
- `SMS_SENDER_ID`

### Secrets Manager payload

If `FLASH_SECRETS_ARN` is set, the secret value can be JSON:

```
{
  "apiKey": "...",
  "apiSecret": "...",
  "apiToken": "...",
  "authScheme": "headers",
  "apiKeyHeader": "x-api-key",
  "apiSecretHeader": "x-api-secret",
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
