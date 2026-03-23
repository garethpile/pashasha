# Pashasha Greenfield MVP Rebuild Plan

## Objective

Rebuild Pashasha as a clean greenfield MVP for civil-servant tipping:

- customer scans a civil servant QR
- customer chooses a preloaded voucher denomination
- customer pays via OZOW first
- successful payment triggers voucher allocation
- allocated voucher code is sent to the civil servant by SMS
- transaction history is visible to the civil servant, customer, and admin/audit users

This document replaces the older mixed-backend plan. The active direction is:

- build fresh
- do not salvage the old Flash backend as part of MVP delivery
- ignore Eclipse for MVP design and implementation
- treat legacy stacks as decommission work after replacement is live

## Hard Constraints

- Ignore Flash completely in the new runtime architecture.
- Ignore Eclipse completely in the new runtime architecture.
- Ignore wallet and ATM payout for MVP.
- Replace all guard/security-guard terminology with `civil servant`.
- Keep the frontend stack, but repoint it to a new backend contract.
- Keep runtime stacks separated by responsibility.
- Reuse useful backend domain code only where it fits the new contract cleanly.
- Reuse the secure voucher ingest and encrypted voucher vault work already delivered.
- Keep architecture modular so new payment engines and payout methods can be added later.
- Frontend web UX must render correctly on mobile from day one.
- Frontend design and contracts must be mobile-app-ready so iOS/Android clients can be added without backend redesign.

## In Scope For MVP

- civil servant identity and QR recipient lookup
- customer tip checkout
- voucher denomination selection
- OZOW payment initiation and callback handling
- secure voucher reservation and allocation
- SMS dispatch of the voucher code to the civil servant
- transaction ledger and history views
- admin voucher ingest and inventory visibility
- audit trail for payment and voucher actions
- responsive mobile-first web experience
- backend contracts suitable for future native mobile clients

## Explicitly Out Of Scope For MVP

- Flash integrations
- Eclipse integrations
- wallet payout
- ATM payout
- repairing or extending the legacy Flash-shaped backend as part of the delivery path

## Current Reusable Assets

### Keep

- `PashashaPayFrontendStack`
- archived modules in `.archive/apps/backend` as historical reference only
- secure admin voucher ingest and encrypted vault logic previously preserved in `.archive/apps/backend/src/admin-vouchers`
- cost-tagging helpers in `infra/cdk/lib/tags.ts`

### Reuse Carefully

- auth and Cognito setup patterns
- civil servant and customer domain code where naming and contracts already fit the new model
- audit/support/admin foundations where they do not carry Flash assumptions

### Legacy Only

- archived `PashashaPayFlashBackendStack` implementation in `.archive/infra/cdk/lib/flash-backend-stack.ts`
- archived `apps/flash-backend`
- archived `apps/voucher-service` paths that are shaped around Flash contracts
- old guard naming, routes, DTOs, and frontend clients

Legacy code stays only as reference until replacement is live and decommissioning begins.

## Target Runtime Architecture

### 1. Frontend: `PashashaPayFrontendStack`

Keep the existing frontend deployment stack, but point it only at the new backend contract.

Responsibilities:

- customer checkout flow
- civil servant profile and transaction history views
- admin voucher ingest and inventory visibility
- admin audit and operational screens
- Cognito-based auth flows for customer, civil servant, and admin users

The frontend must stop depending on Flash-shaped APIs and old `guard` terminology.
The frontend must be designed mobile-first so the web experience works cleanly on phones and the same backend contract can later serve native mobile apps.

### 2. Core Backend: `PashashaPayCoreBackendStack`

This is the new source of truth for the MVP.

Responsibilities:

- auth, Cognito integration, and role enforcement
- customer profiles
- civil servant profiles and QR identity lookup
- payment order creation and status lifecycle
- payment callback orchestration
- transaction ledger/history
- admin APIs
- notification orchestration
- payout orchestration entrypoint

Suggested modules:

- `auth`
- `civil-servants`
- `customers`
- `transactions`
- `payments`
- `notifications`
- `admin`
- `audit`

The core backend must orchestrate payment and payout through interfaces only. It must not embed OZOW-specific, voucher-provider-specific, Flash-specific, or wallet-provider-specific logic directly in the core workflow.

### 3. Payment Stack: `PashashaPayPaymentStack`

This stack owns the payment provider boundary.

Responsibilities:

- payment engine interface and adapter registration
- OZOW adapter implementation for MVP
- payment initiation runtime
- payment callback/webhook handling
- payment verification and reconciliation
- provider-specific config and secrets
- provider-facing audit events

This stack must be designed so new payment engines can be bolted on later without changing the core backend contract.

### 4. Voucher Stack: `PashashaPayVoucherStack`

The voucher domain remains separate in design, even if some historical logic is retained in `.archive/apps/backend`.

Responsibilities:

- supplier ingest
- secure encrypted voucher vault
- voucher inventory and availability by denomination
- voucher reservation and allocation
- voucher redemption state
- SMS delivery
- voucher audit/history

The existing secure ingest/vault implementation becomes the seed of this module.

This stack must be designed so new voucher provision providers can be bolted on later, including external provider-backed voucher fulfillment such as Flash if reintroduced in a future phase.

### 5. Notifications Stack: `PashashaPayNotificationsStack`

This stack owns outbound communications.

Responsibilities:

- SMS delivery provider integration
- delivery retries and failure handling
- message templates and message composition boundaries
- notification audit events

This stack stays separate so SMS and future notification providers can evolve independently from payment and payout logic.

### 6. Future Wallet Stack: `PashashaPayWalletStack`

This is not in the MVP runtime path, but the architecture must leave room for it.

Responsibilities:

- wallet payout method implementations
- wallet provider integrations such as Eclipse later
- wallet disbursement state and reconciliation

The MVP must not depend on this stack, but payout interfaces must be designed so this stack can be added without redesigning the core orchestration flow.

## Provider Extensibility Model

The system must support bolt-on providers in both payment and payout domains.

Design rule:

- `CoreBackend` orchestrates business flow
- provider stacks implement adapters
- frontend talks only to stable product APIs
- adding a provider should mean adding an adapter and configuration, not rewriting product flows

Initial provider set:

- payment engine: `OzowPaymentEngine`
- payout method: `InternalVoucherPayoutMethod`
- notification provider: SMS provider selected for MVP

Planned future provider examples:

- `ApplePayPaymentEngine`
- `GooglePayPaymentEngine`
- `FlashVoucherPayoutMethod`
- `EclipseWalletPayoutMethod`

### 7. Payment Abstraction

Create a stable payment engine interface. OZOW is the first implementation, not a system-wide assumption.

Required interface shape:

- `createPayment()`
- `handleCallback()`
- `verifyPayment()`
- `getPaymentStatus()`

Initial implementation:

- `OzowPaymentEngine`

Future implementations:

- Apple Pay
- Google Pay
- other payment engines

### 8. Payout Abstraction

Create a stable payout method interface. Vouchers are the first payout method, not the only long-term design.

Required interface shape:

- `quotePayout()`
- `reservePayout()`
- `fulfillPayout()`
- `getPayoutStatus()`

Initial implementation:

- `InternalVoucherPayoutMethod`

Future implementations:

- `FlashVoucherPayoutMethod`
- `EclipseWalletPayoutMethod`
- other recipient disbursement methods

### 9. Notification Abstraction

Create a stable notification provider interface so the system does not couple SMS delivery to one transport implementation.

Required interface shape:

- `sendVoucherNotification()`
- `sendPaymentNotification()`
- `getDeliveryStatus()`

Initial implementation:

- `SmsNotificationProvider`

Future implementations:

- WhatsApp delivery
- email delivery
- push notification delivery

## Greenfield API Contract Areas

The new contract should be defined from scratch around the MVP flow, not adapted from Flash.

### Public Customer Flow

- recipient lookup by QR token or civil servant public identifier
- list available voucher denominations for the recipient
- create payment intent for the selected denomination and payment engine
- return payment redirect/initiation payload for OZOW
- receive payment success/failure status for customer UX

### Civil Servant Flow

- view profile
- view transaction history
- view recent voucher-issued events and delivery status

### Customer Authenticated Flow

- view own transaction history if a customer account exists
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

## Frontend And Mobile Readiness

The web interface is part of MVP and must render correctly on mobile devices from the beginning.

Required frontend rules:

- mobile-first layout decisions
- responsive checkout flow for small screens
- responsive admin and profile views for phone and desktop
- touch-friendly controls and spacing
- no desktop-only assumptions in navigation or forms

Product design rule:

- the web frontend should behave like the first client on a stable product API
- backend contracts must not be tailored only to web page composition
- future native mobile apps must be able to reuse the same auth, lookup, payment, transaction, and payout APIs with minimal or no contract changes

## Canonical MVP Runtime Flow

1. Customer scans a civil servant QR.
2. Frontend calls recipient lookup on the new core backend.
3. Backend returns public civil servant details and available voucher denominations.
4. Customer selects a denomination and starts payment.
5. Core backend creates a payment via the payment engine interface.
6. OZOW handles payment and calls back to the backend.
7. Core backend verifies payment success.
8. Core backend calls the payout abstraction to reserve and fulfill a voucher.
9. Voucher module allocates a matching preloaded voucher from secure inventory.
10. Notification orchestration sends the voucher code by SMS to the civil servant.
11. Ledger and audit records are written for payment, payout, and delivery.
12. Civil servant, customer, and admin views all reflect the completed transaction.

## Naming And Terminology Migration

All user-facing and contract-facing `guard` references must be replaced with `civil servant`.

Affected areas:

- backend routes and DTOs
- frontend API clients
- frontend pages and copy
- CDK outputs and stack wiring where names leak into runtime configuration
- domain models and identifiers

Migration rule:

- do not build new features on top of `guard` names
- treat remaining `guard` names as legacy debt to remove during the rebuild

## Deployment Shape

### Active Stacks After Rebuild

- `PashashaPayFrontendStack`
- `PashashaPayCoreBackendStack`
- `PashashaPayPaymentStack`
- `PashashaPayVoucherStack`
- `PashashaPayNotificationsStack`

### Legacy Stacks

- archived `PashashaPayFlashBackendStack` remains only for historical reference

The frontend must ultimately point at the new core backend endpoint, not the Flash backend endpoint.
The core backend must integrate with payment, voucher, and notification stacks through explicit boundaries.

## Execution Sequence

### Phase 1: Rewrite The Plan And Contract

- finalize this greenfield architecture document
- define the frontend/backend contract from scratch
- identify which `.archive/apps/backend` modules can be reused directly, adapted, or ignored
- define the canonical terminology as `civil servant` everywhere

### Phase 2: Scaffold The New Core Backend Path

- add a new isolated backend stack/module in `infra/cdk`
- back it with the active greenfield services under `apps/core`, `apps/payment`, `apps/notifications`, and `apps/voucher`
- keep auth, profiles, transactions, payments, admin, and audit behind the new runtime entrypoint
- do not route through Flash

### Phase 3: Introduce Payment Abstraction

- refactor `payments` into a payment engine interface
- implement OZOW as the first adapter
- move provider-specific callback logic behind the engine boundary

### Phase 4: Introduce Payout Abstraction

- refactor voucher payout into a payout method interface
- reuse secure ingest and vault logic
- add reservation, allocation, and SMS delivery flow
- wire voucher fulfillment into payment success orchestration

### Phase 5: Introduce Notification Abstraction

- isolate SMS delivery behind a notification provider interface
- move outbound delivery concerns into the notifications boundary
- keep voucher fulfillment and communications loosely coupled

### Phase 6: Rename And Repoint Frontend

- replace `guard` API clients and UI copy with `civil servant`
- repoint frontend data fetching to the new backend contract
- remove Flash-shaped assumptions from customer checkout and admin pages
- verify the web experience on mobile screen sizes from the start
- keep frontend state and API usage compatible with future native app reuse

### Phase 7: Validate End-To-End MVP

- verify QR lookup
- verify denomination selection
- verify OZOW initiation and callback handling
- verify voucher allocation and SMS dispatch
- verify ledger/history visibility for civil servant, customer, and admin
- verify mobile web rendering for core MVP journeys

### Phase 8: Decommission Legacy

- destroy old backend stacks only after replacement is standing and validated
- remove or archive Flash/Eclipse-specific runtime paths
- keep cost tags accurate through shutdown and replacement

## Immediate Next Build Targets

1. Update and lock the greenfield rebuild plan.
2. Define the new frontend/backend contract for recipient lookup, payment, voucher allocation, notifications, and history.
3. Scaffold `PashashaPayCoreBackendStack` in `infra/cdk`.
4. Scaffold `PashashaPayPaymentStack` with OZOW as the first engine adapter.
5. Scaffold `PashashaPayVoucherStack` using the secure ingest/vault work.
6. Scaffold `PashashaPayNotificationsStack` for SMS delivery.
7. Rename legacy `guard` references to `civil servant` across contracts and UI.
8. Repoint the frontend to the new backend contract with mobile-first UX expectations.
9. Decommission legacy stacks only after the new path is live.

## Existing Delivered Work To Preserve

- secure voucher ingest backend MVP:
  `POST /api/admin/vouchers/suppliers/shoprite-checkers/ingest`
- encrypted voucher vault storage using AES-256-GCM
- masked inventory/admin visibility for recent ingests
- admin voucher web console at `/admin/vouchers`
- infrastructure cost-tagging helper and first-pass stack tags

## Shoprite Checkers Ingest Example

Example live supplier SMS:

`You've been gifted a R50 Shoprite, Checkers, Usave voucher. This voucher can only be used once, so for your best shopping experience, spend the full amount in one transaction, or load the full amount onto a gift card in store. BARCODE:  9300525147320593`

Expected ingest extraction:

- supplier: `shoprite-checkers`
- amount: `50`
- currency: `ZAR`
- barcode: `9300525147320593`

Operational admin flow:

1. Admin receives supplier voucher SMS.
2. Admin pastes the raw SMS into the Telegram bot conversation with `@PashashaPayBot`.
3. The bot forwards the raw SMS to the secure voucher ingest backend.
4. The voucher ingest function parses the denomination and barcode, encrypts the barcode and raw SMS, and stores masked metadata only in normal records.
5. Admin receives a masked confirmation response.

Architecture rule:

- the Telegram bot is an admin ingest client, not a separate voucher system
- the actual ingest function lives in `PashashaPayVoucherStack`
- supplier-specific parsing must tolerate free text and variable whitespace after `BARCODE:`

## Notes On Legacy Deploy Blockers

The old CDK/Lambda bundling failure in the legacy backend path is not part of the active MVP delivery path.

Only revisit legacy deployment issues when:

- decommissioning requires it
- extracting a reusable asset requires it
- there is no other clean path to replacement
