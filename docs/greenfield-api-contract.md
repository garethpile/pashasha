# Pashasha Greenfield API Contract

## Purpose

This document defines the first clean frontend/backend contract for the new MVP.

It is intentionally independent of:

- Flash
- Eclipse
- legacy `guard` routes or DTOs
- legacy frontend API client assumptions

The contract is designed for:

- mobile-first web
- future native mobile apps
- pluggable payment engines
- pluggable payout methods

## API Principles

- stable product-facing API shape
- provider-agnostic contract from the client perspective
- `civil servant` terminology only
- explicit resource IDs and statuses
- endpoints shaped for both web and future mobile clients

## Auth And Actors

Actors:

- public customer
- authenticated customer
- authenticated civil servant
- authenticated admin
- system callback/provider

Auth model:

- Cognito-backed bearer auth for app users
- signed provider callback verification for payment engines

## Core Domain Objects

### Civil Servant Public Profile

```json
{
  "civilServantId": "cs_123",
  "displayName": "Jane Doe",
  "department": "Metro Police",
  "station": "Cape Town Central",
  "qrToken": "qr_live_abc123",
  "avatarUrl": null,
  "availableVoucherDenominations": [50, 100, 150]
}
```

### Payment Intent

```json
{
  "paymentIntentId": "pi_123",
  "status": "pending",
  "paymentEngine": "ozow",
  "amount": 100,
  "currency": "ZAR",
  "civilServantId": "cs_123",
  "checkoutReference": "tip_123",
  "redirectUrl": "https://payment.example/checkout",
  "expiresAt": "2026-03-22T10:30:00Z"
}
```

### Transaction

```json
{
  "transactionId": "txn_123",
  "status": "completed",
  "amount": 100,
  "currency": "ZAR",
  "paymentEngine": "ozow",
  "payoutMethod": "voucher",
  "civilServantId": "cs_123",
  "customerId": "cust_123",
  "voucherDenomination": 100,
  "createdAt": "2026-03-22T10:00:00Z",
  "completedAt": "2026-03-22T10:02:00Z"
}
```

### Voucher Allocation Summary

```json
{
  "voucherAllocationId": "va_123",
  "status": "allocated",
  "denomination": 100,
  "deliveryStatus": "sent",
  "deliveredAt": "2026-03-22T10:03:00Z"
}
```

## Public Customer Endpoints

### `GET /api/public/civil-servants/lookup`

Purpose:

- resolve a QR token or public recipient identifier
- return public civil servant details and currently selectable voucher denominations

Query params:

- `qrToken`
- `publicId`

Success response:

```json
{
  "recipient": {
    "civilServantId": "cs_123",
    "displayName": "Jane Doe",
    "department": "Metro Police",
    "station": "Cape Town Central",
    "availableVoucherDenominations": [50, 100, 150]
  }
}
```

### `POST /api/public/payment-intents`

Purpose:

- create a tip checkout session for a selected denomination

Request:

```json
{
  "civilServantId": "cs_123",
  "voucherDenomination": 100,
  "paymentEngine": "ozow",
  "customer": {
    "email": "customer@example.com",
    "phoneNumber": "+27710000000"
  }
}
```

Success response:

```json
{
  "paymentIntentId": "pi_123",
  "status": "pending",
  "paymentEngine": "ozow",
  "amount": 100,
  "currency": "ZAR",
  "checkoutReference": "tip_123",
  "redirectUrl": "https://payment.example/checkout",
  "expiresAt": "2026-03-22T10:30:00Z"
}
```

### `GET /api/public/payment-intents/:paymentIntentId`

Purpose:

- poll checkout state after redirect or callback

Success response:

```json
{
  "paymentIntentId": "pi_123",
  "status": "paid",
  "transactionId": "txn_123",
  "voucherAllocation": {
    "status": "allocated",
    "deliveryStatus": "sent"
  }
}
```

## Civil Servant Endpoints

### `GET /api/civil-servants/me`

Purpose:

- return the authenticated civil servant profile

### `GET /api/civil-servants/me/transactions`

Purpose:

- return transaction history for the authenticated civil servant

Query params:

- `cursor`
- `limit`
- `status`

Success response:

```json
{
  "items": [
    {
      "transactionId": "txn_123",
      "status": "completed",
      "amount": 100,
      "currency": "ZAR",
      "paymentEngine": "ozow",
      "payoutMethod": "voucher",
      "voucherDenomination": 100,
      "createdAt": "2026-03-22T10:00:00Z"
    }
  ],
  "nextCursor": null
}
```

### `GET /api/civil-servants/me/vouchers`

Purpose:

- return recent voucher-issued events and delivery states for the authenticated civil servant

## Customer Endpoints

### `GET /api/customers/me`

Purpose:

- return the authenticated customer profile

### `GET /api/customers/me/transactions`

Purpose:

- return transaction history for the authenticated customer

## Admin Endpoints

### `POST /api/admin/vouchers/suppliers/shoprite-checkers/ingest`

Purpose:

- ingest supplier voucher SMS content into the secure vault

Status:

- already implemented and should be preserved

### `GET /api/admin/vouchers/inventory`

Purpose:

- view masked voucher inventory and stock by denomination

### `GET /api/admin/transactions`

Purpose:

- search transaction history across customers and civil servants

Query params:

- `recipientId`
- `customerId`
- `status`
- `from`
- `to`
- `cursor`
- `limit`

### `GET /api/admin/audit`

Purpose:

- inspect audit events for payment, payout, and notification workflows

## Payment Provider Endpoints

### `POST /api/payment-engines/ozow/callback`

Purpose:

- receive OZOW callback events

Rules:

- provider signature verification required
- callback writes payment state transition events
- callback must be idempotent

## Internal Service Boundaries

These are product boundaries even if some calls are initially in-process.

### Core Backend -> Payment Stack

Request shape:

```json
{
  "paymentIntentId": "pi_123",
  "amount": 100,
  "currency": "ZAR",
  "engine": "ozow",
  "metadata": {
    "civilServantId": "cs_123",
    "voucherDenomination": 100
  }
}
```

### Core Backend -> Voucher Stack

Request shape:

```json
{
  "transactionId": "txn_123",
  "civilServantId": "cs_123",
  "payoutMethod": "voucher",
  "denomination": 100
}
```

### Core Backend -> Notifications Stack

Request shape:

```json
{
  "notificationType": "voucher-issued",
  "recipient": {
    "phoneNumber": "+27710000000"
  },
  "templateData": {
    "civilServantId": "cs_123",
    "voucherDenomination": 100
  }
}
```

## Status Model

### Payment Intent Status

- `pending`
- `redirected`
- `paid`
- `failed`
- `expired`

### Transaction Status

- `pending-payment`
- `payment-confirmed`
- `fulfilling-payout`
- `completed`
- `failed`

### Voucher Allocation Status

- `reserved`
- `allocated`
- `delivery-pending`
- `sent`
- `failed`

## Mobile And Native Client Considerations

- public lookup and checkout endpoints must be stateless and client-agnostic
- response payloads must not assume server-rendered web composition
- polling and redirect return handling must work for both browser and future app clients
- transaction history endpoints must support pagination for small-screen clients

## Next Contract Decisions To Lock

- exact QR token format and public lookup rules
- anonymous versus authenticated customer checkout rules
- OZOW callback verification details
- transaction ledger persistence model
- voucher inventory availability query shape
- SMS provider selection and message template format
