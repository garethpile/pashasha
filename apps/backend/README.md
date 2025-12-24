## Backend (NestJS) overview

This service backs the Pashasha platform (civil servants, QR tipping, payments). Key routes live under `apps/backend/src`.

## Guard QR and token model

- Each civil servant has a long-lived **guard token** stored on their profile.
- The public QR encodes a landing URL: `<FRONTEND_BASE>/g?token=<guardToken>`.
- Public endpoints that accept the token: `GET /guards/:token` (profile lookup), `POST /guards/:token/tips` (tip intent), `GET /guards/:token/qr` (PNG image). These use the token only as an identifier; authorization for money movement still happens in workflow/payment services.
- Tokens are opaque and unguessable; they contain no PII.
- If a token is ever leaked or printed incorrectly, rotate it (see below) and regenerate the QR.

## Rotating a guard token

1. Call `POST /guards/:token/rotate` (authenticated) with the current token.
2. The service issues a new opaque token and returns `{ civilServantId, guardToken, landingUrl }`.
3. Use the new `landingUrl` to generate/print a replacement QR for the civil servant.
4. The old token is no longer returned by lookups and should be considered revoked.

## Rate limiting

Global throttling is enabled (see `app.module.ts`). Guard endpoints have additional per-route throttles to reduce QR/tip abuse.

## Local development

```bash
npm install
npm run start:dev
```

## Tests

```bash
npm run test
npm run test:e2e
```
