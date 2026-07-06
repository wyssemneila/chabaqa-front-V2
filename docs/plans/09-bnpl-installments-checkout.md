# Plan 09: BNPL / Payment Installments at Checkout

**Status:** Draft  
**Priority:** P1 (Wave 2)  
**Competitive parity:** Circle installments / BNPL  
**Current:** `allowInstallments` + `installmentCount` on schemas; **no payment.controller support**

---

## 1. Objectives

1. Let creators offer **split payments** (2–12 installments) for high-ticket offers.
2. Checkout UI shows installment schedule and per-payment amount.
3. Charge **first installment** at checkout; schedule remaining via jobs.
4. Support Stripe where provider rules allow; no alternate schedule fallback.

---

## 2. Current state

Schemas with installment fields:
- `community.schema.ts` (pricing)
- `course.schema.ts`, `challenge.schema.ts`, `product.schema.ts`, `event.schema.ts`, `session.schema.ts`

`challenge.service.ts` calculates installment amounts in quotes — display only.

`payment.controller.ts` — **zero** installment logic.

---

## 3. Installment models

### 3.1 Creator configuration

Per offer pricing block:

```typescript
installments: {
  enabled: boolean
  count: number              // 2-12
  interval: 'weekly' | 'biweekly' | 'monthly'
  firstPaymentPercent?: number  // default: equal split
}
```

### 3.2 Buyer experience

Checkout shows:
```
Total: 300 TND
Pay today: 100 TND (1/3)
Then: 100 TND on Apr 18, May 18
[Pay first installment]
```

---

## 4. Data models

### `InstallmentPlan`

```typescript
orderId: ObjectId              // parent order for full amount
buyerId, creatorId, communityId
contentType, contentId
totalAmount: number
currency: string
installmentCount: number
interval: string
status: 'active' | 'completed' | 'defaulted' | 'cancelled'
```

### `InstallmentPayment`

```typescript
planId: ObjectId
sequence: number               // 1..N
amount: number
dueAt: Date
status: 'pending' | 'paid' | 'failed' | 'skipped'
orderId?: ObjectId             // child order when paid
paidAt?: Date
providerPaymentId?: string
retryCount: number
```

**Index:** `{ planId: 1, sequence: 1 }`, `{ status: 1, dueAt: 1 }` for cron

---

## 5. Backend

### 5.1 Module

```
backend/src/domains/commerce/installments/
  installment.controller.ts
  installment.service.ts
  installment-charge.cron.ts
  installment-access.service.ts   # revoke access on default
```

### 5.2 Checkout flow changes

**`payment.controller.ts` init endpoints** — accept `paymentMode: 'full' | 'installment'`

When installment:
1. Validate offer has `installments.enabled`
2. Create `InstallmentPlan` + N `InstallmentPayment` rows
3. Charge **only installment 1** via selected provider (reduce amount on init)
4. Parent `Order` metadata: `{ installmentPlanId, isInstallmentParent: true }`
5. Fulfill access after first payment (partial access policy — see 5.4)

### 5.3 Recurring charge job

Daily cron `InstallmentChargeCron`:
- Find `InstallmentPayment` where `dueAt <= now` and `status=pending`
- For each: create child payment init with saved payment method (Stripe) or send Flouci link email
- On success: mark paid, extend access
- On fail after 3 retries: mark plan `defaulted`, revoke access via `installment-access.service`

### 5.4 Access policy options (creator setting)

| Policy | Behavior |
|--------|----------|
| `full_after_first` | Full access after 1st payment (risky) |
| `progressive` | Unlock % per installment paid |
| `full_after_all` | Access only when all paid (safest) |

Default: `full_after_first` for communities, `progressive` for courses.

### 5.5 BNPL third-party (v2)

Optional integration:
- Tabby, Tamara (GCC) — if MENA expansion
- Stripe Klarna — international

Separate provider adapter behind `BnplProvider` interface.

### 5.6 APIs

| Method | Path |
|--------|------|
| GET | `/installment-plans/me` | Buyer plans |
| GET | `/installment-plans/:id` | Schedule |
| POST | `/installment-payments/:id/pay` | Pay early |
| GET | `/creator/installment-plans` | Creator view |
| POST | `/creator/installment-plans/:id/cancel` | |

---

## 6. Frontend

### 6.1 Checkout

Modify:
- `community-join-checkout-section.tsx`
- `payment-provider-modal.tsx`
- Course/challenge checkout components

Add `InstallmentToggle` + `InstallmentScheduleTable`

### 6.2 Creator pricing steps

All `*-pricing-step.tsx` files — wire `allowInstallments` to new shape (already partial UI in schemas)

### 6.3 Buyer dashboard

`/settings/billing` or `/profile/purchases` — upcoming installments

### 6.4 Design

- Schedule table: monospace dates, clear “Due today” highlight
- Trust copy: “Your access continues while payments are on time”

---

## 7. Legal & product

- Clear terms checkbox at installment checkout
- Email reminders 3 days before due date
- Creator dashboard: defaulted plans alert

---

## 8. Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Schema + plan creation at checkout (manual provider only) |
| 2 | First installment via Stripe/Flouci |
| 3 | Cron charging + email reminders |
| 4 | Default + access revoke |
| 5 | BNPL provider adapter (optional) |

---

## 9. Acceptance criteria

- [ ] Course priced 300 TND / 3 monthly installments → 100 charged at checkout
- [ ] Second installment auto-charged or manual link sent on due date
- [ ] Default revokes course access when policy `full_after_all`
- [ ] Creator sees all active installment plans
- [ ] Full payment still works when installments disabled

---

## 10. Files

**Create:** `domains/commerce/installments/*`, schemas  
**Modify:** `payment.controller.ts`, `order.schema.ts`, all pricing schemas, checkout UI, `payment-fulfillment.service.ts`
