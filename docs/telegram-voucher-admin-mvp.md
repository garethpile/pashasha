# Telegram voucher admin MVP

## What exists in this repo

- **Backend**: archived NestJS API in `.archive/apps/backend`
- **Web admin**: Next.js admin console in `apps/frontend`
- **Voucher payout service**: archived legacy service in `.archive/apps/voucher-service`
- **Telegram bot**: **not present in this repo**

That means the clean MVP is to keep the Telegram bot dumb and let the backend do the sensitive work.

## Proposed Telegram flow

Bot name: **PashashaPayBot**

```text
/admin
  -> vouchers
    -> voucher supplier
      -> Shoprite Checkers
        -> paste SMS text
          -> backend ingest endpoint
```

## Backend endpoint added

`POST /api/admin/vouchers/suppliers/shoprite-checkers/ingest`

### Request body

```json
{
  "smsText": "You've been gifted a R50 Shoprite, Checkers, Usave voucher... BARCODE: 9300525147320593"
}
```

### Auth expectations

- JWT-authenticated administrator only
- User must be in the `Administrators` Cognito group

### Response shape

```json
{
  "voucherId": "uuid",
  "supplier": "Shoprite Checkers",
  "amount": 50,
  "currency": "ZAR",
  "barcodeMasked": "************0593",
  "status": "available",
  "ingestedAt": "2026-03-21T...Z",
  "storage": {
    "mode": "encrypted-at-rest-and-application-encrypted",
    "barcodeVisibleToAdmins": false
  }
}
```

## Storage design: smallest safe path

### What is stored

For each voucher we store:

- `voucherId`
- supplier metadata
- amount in cents
- barcode last 4 digits
- SHA-256 hash of barcode
- SHA-256 hash of raw SMS
- encrypted barcode payload
- encrypted raw SMS payload
- ingested actor + timestamps

### What is **not** stored in plaintext

- full barcode
- raw SMS body

### Encryption model

1. DynamoDB still has normal AWS encryption at rest
2. Sensitive fields are also **application encrypted** with AES-256-GCM before writing
3. App key comes from `VOUCHER_VAULT_MASTER_KEY_B64`
4. Only masked barcode is returned to admin callers
5. Audit logs keep only safe metadata (`voucherId`, supplier, amount, last 4)

This is not a full HSM-backed vault yet, but it is already far better than dropping redeemable barcodes into plaintext Dynamo rows, logs, or bot transcripts.

## Recommended production hardening after MVP

1. Move `VOUCHER_VAULT_MASTER_KEY_B64` to AWS Secrets Manager or KMS-derived envelope keys
2. Give the Telegram bot only ingest permission, not read-back permission
3. Add a duplicate-protection GSI on `barcodeHash`
4. Add explicit voucher claim / redemption workflows so plaintext only exists in-memory at redemption time
5. Add a dead-letter / review queue for malformed SMS messages
6. Add per-admin audit dashboards for voucher ingest events

## Telegram bot integration sketch

The separate bot process for **PashashaPayBot** should:

1. Maintain a tiny admin conversation state machine:
   - `idle`
   - `admin_menu`
   - `voucher_menu`
   - `voucher_supplier_menu`
   - `awaiting_shoprite_sms`
2. When in `awaiting_shoprite_sms`, send pasted SMS directly to backend endpoint
3. Never persist the full SMS/barcode in bot logs or chat summaries beyond the original Telegram message
4. Delete or redact internal bot debug logs for this step

## Web admin view added in this repo

- Route: `/admin/vouchers`
- Supports Shoprite Checkers SMS paste + ingest
- Lists recent voucher ingests with masked barcode only
- Uses the same secure backend endpoint and never exposes full barcode plaintext in the UI

## Example bot copy

- `/admin` -> `Admin menu`
- `Vouchers` -> `Choose voucher supplier`
- `Shoprite Checkers` -> `Paste the full voucher SMS exactly as received. The barcode will be encrypted immediately and only the last 4 digits will be shown back to you.`
