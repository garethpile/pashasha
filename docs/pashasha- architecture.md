# Pashasha Architecture

## Document Update History

| Date       | Update                                                                                                                                                  | Author |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 2026-03-23 | Renamed the architecture rebuild plan into the current-state as-is architecture document and rewrote the content to describe the active platform shape. | Codex  |
| 2026-03-23 | Added a deployments section listing the currently identifiable environment locations from the repository.                                               | Codex  |
| 2026-03-23 | Added CloudFront URLs to the deployments section where a concrete value could be verified from repository artifacts.                                    | Codex  |

## DEPLOYMENTS

This section lists the currently identifiable deployment locations so users can quickly check the live environment footprint.

| Environment | Friendly URL                                                  | CloudFront URL                                          | Current Repo Evidence                                                                                                                                 |
| ----------- | ------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev         | `https://dev.pashasha.com` and `https://www.dev.pashasha.com` | `https://d1kvaujkmnaiu3.cloudfront.net`                 | Frontend Route53 aliases are created for the `dev` hostnames; the active synthesized stacks target AWS account `701158128147` in region `af-south-1`. |
| Test        | Not currently defined in the active repo configuration.       | Not currently defined in the active repo configuration. | No `test` hostname, stack alias, or dedicated environment mapping was found in the active CDK stack definitions.                                      |
| Prod        | Not currently defined in the active repo configuration.       | Not currently defined in the active repo configuration. | No `prod` hostname, stack alias, or dedicated environment mapping was found in the active CDK stack definitions.                                      |

Active stack names to check in AWS CloudFormation for the synthesized environment:

- `PashashaPayFrontendStack`
- `PashashaPayCoreBackendStack`
- `PashashaPayPaymentStack`
- `PashashaPayVoucherStack`
- `PashashaPayNotificationsStack`

## Purpose

This document describes the current-state architecture of Pashasha.

Pashasha is a civil-servant tipping platform where:

- a customer scans a civil servant QR code
- the customer selects a preloaded voucher denomination
- payment is initiated through OZOW
- a successful payment triggers voucher allocation
- the allocated voucher code is sent to the civil servant by SMS
- transaction history is visible to the civil servant, customer, and admin or audit users

This is an as-is architecture document. It describes the system as it currently stands and the active boundaries it is built around.

## Current Scope

The active platform covers:

- civil servant identity and QR recipient lookup
- customer tip checkout
- voucher denomination selection
- OZOW payment initiation and callback handling
- secure voucher reservation and allocation
- SMS dispatch of the voucher code to the civil servant
- transaction ledger and history views
- admin voucher ingest and inventory visibility
- audit trail for payment, voucher, and notification actions
- responsive mobile-first web experience
- backend contracts that can later support native mobile clients

## Current Constraints

- Flash is not part of the active runtime architecture.
- Eclipse is not part of the active runtime architecture.
- Wallet and ATM payout are not part of the active platform path.
- `civil servant` is the canonical domain and product term.
- The frontend remains in place and is aligned to the current backend contract.
- Payment, voucher, notification, and core backend responsibilities remain separated.
- Secure voucher ingest and encrypted voucher vault capabilities are preserved as active system capabilities.

## Current Runtime Architecture

### Frontend: `PashashaPayFrontendStack`

This stack provides the web client.

Responsibilities:

- customer checkout flow
- civil servant profile and transaction history views
- admin voucher ingest and inventory visibility
- admin audit and operational screens
- Cognito-based authentication flows for customer, civil servant, and admin users

The frontend is mobile-first and is expected to render correctly on phones and desktop browsers.

### Core Backend: `PashashaPayCoreBackendStack`

This stack is the main system-of-record boundary for product workflows.

Responsibilities:

- auth, Cognito integration, and role enforcement
- customer profiles
- civil servant profiles and QR identity lookup
- payment order creation and status lifecycle
- payment callback orchestration
- transaction ledger and history
- admin APIs
- notification orchestration
- payout orchestration entrypoint

Current module areas:

- `auth`
- `civil-servants`
- `customers`
- `transactions`
- `payments`
- `notifications`
- `admin`
- `audit`

### Payment Stack: `PashashaPayPaymentStack`

This stack owns the payment provider boundary.

Responsibilities:

- payment engine interface and adapter registration
- OZOW adapter implementation
- payment initiation runtime
- payment callback and webhook handling
- payment verification and reconciliation
- provider-specific configuration and secrets
- provider-facing audit events

### Voucher Stack: `PashashaPayVoucherStack`

This stack owns voucher inventory and fulfillment.

Responsibilities:

- supplier ingest
- secure encrypted voucher vault
- voucher inventory and availability by denomination
- voucher reservation and allocation
- voucher redemption state
- SMS-linked fulfillment flow
- voucher audit and history

The secure ingest and vault implementation remains a core reusable capability in this stack.

### Notifications Stack: `PashashaPayNotificationsStack`

This stack owns outbound communication.

Responsibilities:

- SMS delivery provider integration
- delivery retries and failure handling
- message templates and message composition boundaries
- notification audit events

## Provider Abstractions

The platform is structured around stable product flows with provider-specific adapters behind them.

Current provider set:

- payment engine: `OzowPaymentEngine`
- payout method: `InternalVoucherPayoutMethod`
- notification provider: `SmsNotificationProvider`

### Payment Interface

Current interface shape:

- `createPayment()`
- `handleCallback()`
- `verifyPayment()`
- `getPaymentStatus()`

### Payout Interface

Current interface shape:

- `quotePayout()`
- `reservePayout()`
- `fulfillPayout()`
- `getPayoutStatus()`

### Notification Interface

Current interface shape:

- `sendVoucherNotification()`
- `sendPaymentNotification()`
- `getDeliveryStatus()`

## Current API Areas

### Public Customer Flow

- recipient lookup by QR token or civil servant public identifier
- list available voucher denominations for the recipient
- create payment intent for the selected denomination and payment engine
- return payment redirect or initiation payload for OZOW
- receive payment success or failure status for customer UX

### Civil Servant Flow

- view profile
- view transaction history
- view recent voucher-issued events and delivery status

### Customer Authenticated Flow

- view own transaction history where a customer account exists
- view payment statuses tied to their identity

### Admin Flow

- ingest supplier vouchers
- view masked voucher inventory and stock by denomination
- inspect payment, voucher, and notification audit history
- search transactions by recipient, customer, status, and time range

### System-to-System Flow

- payment provider callback endpoint
- internal payout allocation call
- SMS dispatch orchestration
- audit event recording

## Canonical Runtime Flow

1. A customer scans a civil servant QR code.
2. The frontend calls recipient lookup on the core backend.
3. The backend returns public civil servant details and available voucher denominations.
4. The customer selects a denomination and starts payment.
5. The core backend creates a payment via the payment engine interface.
6. OZOW processes the payment and calls back to the backend.
7. The core backend verifies payment success.
8. The core backend calls the payout abstraction to reserve and fulfill a voucher.
9. The voucher module allocates a matching preloaded voucher from secure inventory.
10. Notification orchestration sends the voucher code by SMS to the civil servant.
11. Ledger and audit records are written for payment, payout, and delivery.
12. Civil servant, customer, and admin views reflect the completed transaction.

## Current Reusable Assets

### Active And Reused

- `PashashaPayFrontendStack`
- secure admin voucher ingest and encrypted vault logic preserved under `.archive/apps/backend/src/admin-vouchers`
- cost-tagging helpers in `infra/cdk/lib/tags.ts`

### Reused Selectively

- auth and Cognito setup patterns
- civil servant and customer domain code where naming and contracts fit the active model
- audit, support, and admin foundations that do not depend on Flash assumptions

### Legacy Reference Only

- `.archive/apps/backend`
- `.archive/infra/cdk/lib/flash-backend-stack.ts`
- archived `apps/flash-backend`
- archived `apps/voucher-service` paths shaped around Flash contracts
- old `guard` naming, routes, DTOs, and frontend clients

## Terminology

`civil servant` is the active product and contract term.

Remaining `guard` references are legacy debt and should not define any new implementation.

## Frontend And Mobile Posture

The web client is the active first client on the platform API.

Current expectations:

- mobile-first layout decisions
- responsive checkout flow for small screens
- responsive admin and profile views for phone and desktop
- touch-friendly controls and spacing
- backend contracts that remain usable by future native mobile clients without redesign

## Current Operational Example: Shoprite Checkers Ingest

Example supplier SMS:

`You've been gifted a R50 Shoprite, Checkers, Usave voucher. This voucher can only be used once, so for your best shopping experience, spend the full amount in one transaction, or load the full amount onto a gift card in store. BARCODE:  9300525147320593`

Expected extraction:

- supplier: `shoprite-checkers`
- amount: `50`
- currency: `ZAR`
- barcode: `9300525147320593`

Operational flow:

1. An admin receives the supplier voucher SMS.
2. The admin pastes the raw SMS into the Telegram bot conversation with `@PashashaPayBot`.
3. The bot forwards the raw SMS to the secure voucher ingest backend.
4. The voucher ingest function parses the denomination and barcode, encrypts the barcode and raw SMS, and stores masked metadata in standard records.
5. The admin receives a masked confirmation response.

Architecture rule:

- the Telegram bot is an admin ingest client, not a separate voucher system
- the ingest function belongs to `PashashaPayVoucherStack`
- supplier-specific parsing must tolerate free text and variable whitespace after `BARCODE:`
