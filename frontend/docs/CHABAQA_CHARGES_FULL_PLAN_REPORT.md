# Chabaqa — Full Plans, Charges & Complete Implementation Plan

> **Status:** Implementation Blueprint — Ready to Execute  
> **Last Updated:** March 2026  
> **Scope:** Pricing model · Backend plan enforcement · Frontend gating · ENV bypass flag  
> **Codebase:** NestJS (backend) + Next.js App Router (frontend)  
> **Key env flag:** `PLAN_ENFORCEMENT_MODE=true` → enforces all limits; `=false` → full freedom for all creators

---

## Source Data
- Document: `chage shabaqa` (Google Sheet)
- Extracted sheet: `feuille 1`
- Currency: `TND` (Tunisian Dinar)
- Exchange reference: ~1 USD ≈ 3.1 TND (March 2026)

---

## Part 1 — Pricing Model

### 1.1 Plans and Core Charges

| Plan        | Monthly Price | Billed Yearly (per month) | Annual Total | Platform Transaction Fee | Free Trial |
| ----------- | ------------: | ------------------------: | -----------: | -----------------------: | ---------- |
| **Starter** |        39 TND |                 31 TND/mo |      372 TND |                 **7.9%** | 7 days     |
| **Growth**  |        99 TND |                 79 TND/mo |      948 TND |                 **4.9%** | 7 days     |
| **Pro**     |       159 TND |                127 TND/mo |    1,524 TND |                 **2.9%** | 7 days     |

> Annual billing gives ~20% discount (Starter: save 96 TND/yr, Growth: 240 TND/yr, Pro: 384 TND/yr)

### 1.2 Competitor Benchmarks

| Platform            |  Entry Plan | Entry Transaction Fee | Members/Courses            | Notes                        |
| ------------------- | ----------: | --------------------: | -------------------------- | ---------------------------- |
| Kajabi Basic        |    ~$143/mo |          2.9% + $0.30 | 5 products, 2,500 contacts | USD pricing                  |
| Kajabi Growth       |    ~$199/mo |          2.8% + $0.30 | 50 products                | USD pricing                  |
| Kajabi Pro          |    ~$399/mo |          2.7% + $0.30 | Unlimited, 3 communities   | USD                          |
| Skool Hobby         |       $9/mo |       10% transaction | Unlimited members/courses  | Very cheap entry             |
| Skool Pro           |      $99/mo |      2.9% transaction | Full features              | USD                          |
| Podia Mover         |      $39/mo |        5% transaction | Unlimited                  | USD                          |
| Teachable Basic     |      $39/mo |            5% + $0.25 | Unlimited                  | USD                          |
| **Chabaqa Starter** | **~$13/mo** |              **7.9%** | **100 members**            | TND-priced, MENA-local       |
| **Chabaqa Growth**  | **~$32/mo** |              **4.9%** | **500 members**            | Best value for MENA          |
| **Chabaqa Pro**     | **~$51/mo** |              **2.9%** | **Unlimited**              | Pro-parity with global tools |

**Key Insight:** Chabaqa is 3–10× cheaper than global competitors in USD terms, ideal for Tunisia/MENA creators. Higher transaction fees on lower tiers compensate for cheap entry pricing (Skool model).

---

### 1.3 Full Feature Matrix by Plan

#### Creator / Platform Limits

| Limit                                             | Starter | Growth  | Pro           |
| ------------------------------------------------- | ------- | ------- | ------------- |
| Total members per community                       | **100** | **500** | **Unlimited** |
| Team / admin seats                                | **1**   | **2**   | **3**         |
| Communities (in current codebase: communitiesMax) | 1       | 1       | 1             |
| Custom domain                                     | ❌ No    | ❌ No    | ✅ Included    |
| Community verified badge                          | ❌ No    | ✅ Yes   | ✅ Yes         |
| Featured badge                                    | ❌ No    | ❌ No    | ✅ Yes         |
| Priority support SLA (24/7)                       | ❌ No    | ❌ No    | ✅ Yes         |
| Occasional social media promo                     | ❌ No    | ✅ Yes   | ✅ Yes         |

#### Content Limits

| Limit                                 | Starter  | Growth                  | Pro                       |
| ------------------------------------- | -------- | ----------------------- | ------------------------- |
| Active courses (coursesActivationMax) | **3**    | **Unlimited**           | **Unlimited**             |
| Active products                       | ✅ Yes    | ✅ Yes                   | ✅ Yes                     |
| Challenges                            | ❌ No     | ✅ Yes                   | ✅ Yes                     |
| Events                                | ❌ No     | ✅ Yes                   | ✅ Yes                     |
| Sessions (1:1 bookings)               | ❌ No     | ✅ Yes (300/mo received) | ✅ Yes (1,000/mo received) |
| Storage included                      | **5 GB** | **50 GB**               | **300 GB**                |

#### Growth / Automation Limits

| Limit                                | Starter | Growth               | Pro                    |
| ------------------------------------ | ------- | -------------------- | ---------------------- |
| Email campaigns (recipients/month)   | **—**   | **1,000/month**      | **15,000/month**       |
| Automation quota (automations/month) | 0       | **TBD**              | **TBD**                |
| AI credits / month                   | **TBD** | **TBD**              | **TBD**                |
| WhatsApp included messages/month     | 0       | **250** utility/auth | **1,000** utility/auth |
| Branding (remove Chabaqa branding)   | ❌ No    | ❌ No                 | ✅ Yes                  |
| Gamification (points/badges)         | ❌ No    | ✅ Yes                | ✅ Yes                  |

#### Analytics Limits

| Limit           | Starter       | Growth                        | Pro                       |
| --------------- | ------------- | ----------------------------- | ------------------------- |
| Analytics tier  | Basic         | Advanced                      | Advanced + Exports        |
| Modules         | Overview only | Overview + all entity modules | All modules               |
| Lookback window | 30 days       | 180 days                      | 365 days                  |
| Data refresh    | Daily         | Daily + manual refresh        | Daily + immediate refresh |
| CSV export      | ❌ No          | ❌ No                          | ✅ Yes                     |

---

### 1.4 Add-on Charges

| Add-on                  | Price                        | Notes                                     |
| ----------------------- | ---------------------------- | ----------------------------------------- |
| Extra admin seat        | **+15 TND/month**            | Per additional seat beyond plan allowance |
| Extra storage (Starter) | **+12 TND per 100 GB/month** | ~64% margin                               |
| Extra storage (Growth)  | **+10 TND per 100 GB/month** | ~56.5% margin                             |
| Extra storage (Pro)     | **+9 TND per 100 GB/month**  | ~51.7% margin                             |

---

### 1.5 Platform Transaction Fees

All plan transaction fees apply to creator sales processed via Chabaqa checkout:

| Plan    | Platform Fee | Example: 100 TND sale | Creator Receives |
| ------- | -----------: | --------------------: | ---------------: |
| Starter |         7.9% |          7.90 TND fee |    **92.10 TND** |
| Growth  |         4.9% |          4.90 TND fee |    **95.10 TND** |
| Pro     |         2.9% |          2.90 TND fee |    **97.10 TND** |

> **Note:** A fixed-fee component (`transactionFixedFeeDT`) is in the schema but not finalized in source data. Recommend setting at 0.50 TND fixed + percentage.

---

### 1.6 Unit Economics & Profitability

#### Variable cost per plan (at full included quotas)

| Plan    | Storage Cost | R2 Class A | R2 Class B |  WhatsApp |       Total Cost | Revenue (Yearly) | Gross Margin |
| ------- | -----------: | ---------: | ---------: | --------: | ---------------: | ---------------: | -----------: |
| Starter |     0.22 TND |   0.20 TND |   0.16 TND |         0 |  **0.57 TND/mo** |        31 TND/mo |   **98.16%** |
| Growth  |     4.35 TND |   1.04 TND |   0.84 TND |  6.09 TND | **12.32 TND/mo** |        79 TND/mo |   **84.41%** |
| Pro     |    13.05 TND |   3.26 TND |   2.61 TND | 24.36 TND | **37.41 TND/mo** |       127 TND/mo |   **70.54%** |

> Cost assumptions: Storage 0.0435 TND/GB/mo · WhatsApp 0.02436 TND/message · R2 Class A: (n/1M)×4.50 USD×2.9 · R2 Class B: (n/1M)×0.36 USD×2.9

#### Add-on storage margin

| Plan    | +100 GB Price | Internal Cost | Gross Profit |     Margin |
| ------- | ------------: | ------------: | -----------: | ---------: |
| Starter |     12 TND/mo |      4.35 TND |     7.65 TND |   **~64%** |
| Growth  |     10 TND/mo |      4.35 TND |     5.65 TND | **~56.5%** |
| Pro     |      9 TND/mo |      4.35 TND |     4.65 TND | **~51.7%** |

---

## Part 2 — ENV Flag: `PLAN_ENFORCEMENT_MODE`

### 2.1 Definition

```env
# .env (backend)
PLAN_ENFORCEMENT_MODE=false   # Default: false = all creators have unlimited access (development mode)
                               # Set to true in PRODUCTION to enforce plan limits

# .env (frontend)
NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE=false  # Controls UI gating (upgrade walls, locked features)
```

### 2.2 Behaviour Table

| Scenario                                   | `PLAN_ENFORCEMENT_MODE=false`              | `PLAN_ENFORCEMENT_MODE=true`     |
| ------------------------------------------ | ------------------------------------------ | -------------------------------- |
| Creator with no subscription               | Full access to everything                  | Blocked — must subscribe         |
| Creator on Starter tries challenges        | Allowed (no gate)                          | Blocked — must upgrade to Growth |
| Creator on Starter tries to add member 101 | Allowed                                    | Blocked — member limit hit       |
| Frontend shows upgrade modals              | Never                                      | Yes — on limit/feature hit       |
| Analytics lookback window enforced         | No                                         | Yes                              |
| Storage quota enforced                     | No                                         | Yes                              |
| Transaction fee applied                    | **Always** (not gated by enforcement mode) | **Always**                       |

> The `PLAN_ENFORCEMENT_MODE` flag does NOT affect payment processing or transaction fee collection — those always apply regardless.

### 2.3 Migration Path

```
Phase 1: PLAN_ENFORCEMENT_MODE=false  → Ship everything, no gates active
Phase 2: PLAN_ENFORCEMENT_MODE=false  → Soft-launch subscriptions, creators can buy but no gates yet
Phase 3: PLAN_ENFORCEMENT_MODE=true   → Full enforcement. Notify all creators 30 days in advance.
```

### 2.4 Replacing `FREE_MODE`

The existing backend env flag `FREE_MODE=true` is equivalent to `PLAN_ENFORCEMENT_MODE=false`. The plan below migrates `FREE_MODE` → `PLAN_ENFORCEMENT_MODE` for clarity and adds the missing feature gating.

---

## Part 3 — Backend Implementation Plan

### 3.1 Current State (from codebase analysis)

| Component                                                   | Status                                 |
| ----------------------------------------------------------- | -------------------------------------- |
| `Plan` schema (PlanTier, PlanLimits, PlanFeatures)          | ✅ Exists                               |
| `Subscription` schema with denormalized limits cache        | ✅ Exists                               |
| `PolicyService` — 5 numeric quota methods                   | ✅ Exists (needs expansion)             |
| `FeeService` — transaction fee lookup                       | ✅ Exists                               |
| `SubscriptionService` — trial/upgrade/cancel stubs          | ✅ Exists (payment stub only)           |
| Seed script (STARTER 29 TND, GROWTH 69 TND, PRO 99 TND)     | ⚠️ Exists but prices are WRONG vs sheet |
| Community/member/admin/course quota enforcement             | ✅ Exists                               |
| Storage quota enforcement                                   | ✅ Exists                               |
| **Feature gating** (challenges, sessions, events, branding) | ❌ MISSING                              |
| `canUseFeature()` on PolicyService                          | ❌ MISSING                              |
| Subscription expiry cron job                                | ❌ MISSING                              |
| Stripe webhook → subscription update                        | ❌ MISSING                              |
| Invoice service                                             | ❌ MISSING                              |
| Usage counters (email, WhatsApp, automation)                | ❌ MISSING                              |
| `PlanGuard` / `@RequireFeature` decorator                   | ❌ MISSING                              |

---

### 3.2 Step-by-Step Backend Tasks

#### STEP B-1 — Update Seed Script with Correct Prices and Limits

**File:** `src/common/scripts/seed-plans.ts`

Update seeded values to match the pricing sheet:

```typescript
const plans = [
  {
    tier: PlanTier.STARTER,
    name: 'Starter',
    priceDTPerMonth: 39,        // sheet: 39 TND/mo, 31 TND/mo billed yearly
    trialDays: 7,
    limits: {
      communitiesMax: 1,
      membersMax: 100,
      coursesActivationMax: 3,
      storageGB: 5,             // sheet: 5 GB
      adminsMax: 1,             // sheet: 1 team/admin seat
    },
    features: {
      courses: true,
      products: true,
      challenges: false,        // sheet: No
      sessions: false,          // sheet: No
      events: false,            // sheet: No
      branding: false,
      gamification: false,
      verifiedBadge: false,
      featuredBadge: false,
      automationQuota: 0,
    },
    transactionFeePercent: 7.9, // sheet: 7.9%
    transactionFixedFeeDT: 0.5,
  },
  {
    tier: PlanTier.GROWTH,
    name: 'Growth',
    priceDTPerMonth: 99,        // sheet: 99 TND/mo, 79 billed yearly
    trialDays: 7,
    limits: {
      communitiesMax: 1,
      membersMax: 500,          // sheet: 500
      coursesActivationMax: 999, // unlimited
      storageGB: 50,            // sheet: 50 GB
      adminsMax: 2,             // sheet: 2 seats
    },
    features: {
      courses: true,
      products: true,
      challenges: true,
      sessions: true,
      events: true,
      branding: false,
      gamification: true,
      verifiedBadge: true,
      featuredBadge: false,
      automationQuota: 1000,    // email: 1000/mo
    },
    transactionFeePercent: 4.9,
    transactionFixedFeeDT: 0.5,
  },
  {
    tier: PlanTier.PRO,
    name: 'Pro',
    priceDTPerMonth: 159,       // sheet: 159 TND/mo, 127 billed yearly
    trialDays: 7,
    limits: {
      communitiesMax: 1,
      membersMax: 999999,       // unlimited
      coursesActivationMax: 999999,
      storageGB: 300,           // sheet: 300 GB
      adminsMax: 3,             // sheet: 3 seats
    },
    features: {
      courses: true,
      products: true,
      challenges: true,
      sessions: true,
      events: true,
      branding: true,
      gamification: true,
      verifiedBadge: true,
      featuredBadge: true,
      automationQuota: 15000,   // email: 15,000/mo
    },
    transactionFeePercent: 2.9,
    transactionFixedFeeDT: 0.5,
  },
];
```

---

#### STEP B-2 — Expand PolicyService with Feature-Level Gating

**File:** `src/common/services/policy.service.ts`

Add two new key methods:

```typescript
// NEW: Check if a feature is accessible based on plan
async canUseFeature(
  creatorId: Types.ObjectId | string,
  feature: keyof PlanFeatures,
): Promise<boolean> {
  const PLAN_ENFORCEMENT_MODE = process.env.PLAN_ENFORCEMENT_MODE === 'true';
  if (!PLAN_ENFORCEMENT_MODE) return true; // bypass

  const sub = await this.subModel
    .findOne({ creatorId: new Types.ObjectId(creatorId as any) })
    .populate<{ plan: Plan }>('planDoc') // virtual or separate lookup
    .lean();

  if (!sub) return false;

  // Load Plan document for this subscription tier
  const plan = await this.planModel.findOne({ tier: sub.plan }).lean();
  if (!plan) return false;

  return Boolean(plan.features[feature]);
}

// NEW: Get remaining automation quota (email, WhatsApp counter)
async getRemainingQuota(
  creatorId: Types.ObjectId | string,
  quotaType: 'automation' | 'whatsapp',
  currentUsage: number,
): Promise<number> {
  const PLAN_ENFORCEMENT_MODE = process.env.PLAN_ENFORCEMENT_MODE === 'true';
  if (!PLAN_ENFORCEMENT_MODE) return 999999; // unlimited in free mode

  const plan = await this.getPlanForCreator(creatorId);
  if (!plan) return 0;

  const max = quotaType === 'automation'
    ? plan.features.automationQuota
    : quotaType === 'whatsapp' ? plan.limits.whatsappMessages ?? 0 : 0;

  return Math.max(0, max - currentUsage);
}
```

Also update existing `getEffectiveLimitsForCreator` to respect `PLAN_ENFORCEMENT_MODE`:

```typescript
async getEffectiveLimitsForCreator(creatorId): Promise<EffectiveLimits> {
  const PLAN_ENFORCEMENT_MODE = process.env.PLAN_ENFORCEMENT_MODE === 'true';
  if (!PLAN_ENFORCEMENT_MODE) {
    return { communitiesMax: 999, membersMax: 999999, coursesActivationMax: 9999, storageGB: 9999, adminsMax: 999 };
  }
  // ... existing lookup
}
```

**Add `Plan` model injection to PolicyModule:**

```typescript
// common/modules/policy.module.ts
imports: [
  MongooseModule.forFeature([
    { name: Subscription.name, schema: SubscriptionSchema },
    { name: Plan.name, schema: PlanSchema },          // ADD THIS
  ]),
],
```

---

#### STEP B-3 — Add `@RequireFeature` Guard + Decorator

**New file:** `src/common/guards/plan-feature.guard.ts`

```typescript
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyService } from '../services/policy.service';

export const REQUIRE_FEATURE_KEY = 'requireFeature';
export const RequireFeature = (...features: string[]) =>
  SetMetadata(REQUIRE_FEATURE_KEY, features);

@Injectable()
export class PlanFeatureGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private policy: PolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const PLAN_ENFORCEMENT_MODE = process.env.PLAN_ENFORCEMENT_MODE === 'true';
    if (!PLAN_ENFORCEMENT_MODE) return true;

    const features = this.reflector.getAllAndOverride<string[]>(REQUIRE_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!features?.length) return true;

    const req = context.switchToHttp().getRequest();
    const creatorId = req.user?.creatorId || req.user?._id;
    if (!creatorId) return false;

    for (const feature of features) {
      const allowed = await this.policy.canUseFeature(creatorId, feature as any);
      if (!allowed) {
        throw new ForbiddenException(
          `Your plan does not include the "${feature}" feature. Please upgrade.`,
        );
      }
    }
    return true;
  }
}
```

**Usage in controllers:**

```typescript
// event.controller.ts
@Post('/')
@UseGuards(JwtAuthGuard, PlanFeatureGuard)
@RequireFeature('events')
async createEvent(...) { ... }

// challenge.controller.ts
@Post('/')
@UseGuards(JwtAuthGuard, PlanFeatureGuard)
@RequireFeature('challenges')
async createChallenge(...) { ... }

// session.controller.ts
@Post('/')
@UseGuards(JwtAuthGuard, PlanFeatureGuard)
@RequireFeature('sessions')
async createSession(...) { ... }
```

---

#### STEP B-4 — Fix `session.service.ts` Hardcoded Bypass

**File:** `src/session/session.service.ts` around line 451  
Current code: `hasSub = true; // TESTING`  
Replace with:

```typescript
const PLAN_ENFORCEMENT_MODE = process.env.PLAN_ENFORCEMENT_MODE === 'true';
const hasSub = PLAN_ENFORCEMENT_MODE
  ? await this.policyService.hasActiveSubscription(creatorId)
  : true;
```

---

#### STEP B-5 — Add Subscription Expiry Cron Job

**New file:** `src/subscription/subscription.scheduler.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument, SubscriptionStatus } from '../schema/subscription.schema';

@Injectable()
export class SubscriptionScheduler {
  private readonly logger = new Logger(SubscriptionScheduler.name);

  constructor(
    @InjectModel(Subscription.name) private subModel: Model<SubscriptionDocument>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireSubscriptions() {
    const PLAN_ENFORCEMENT_MODE = process.env.PLAN_ENFORCEMENT_MODE === 'true';
    if (!PLAN_ENFORCEMENT_MODE) return; // skip in free mode

    const now = new Date();
    const result = await this.subModel.updateMany(
      {
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        currentPeriodEnd: { $lt: now },
      },
      { $set: { status: SubscriptionStatus.PAST_DUE } },
    );

    if (result.modifiedCount > 0) {
      this.logger.warn(`Expired ${result.modifiedCount} subscriptions`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async expireTrials() {
    const PLAN_ENFORCEMENT_MODE = process.env.PLAN_ENFORCEMENT_MODE === 'true';
    if (!PLAN_ENFORCEMENT_MODE) return;

    const now = new Date();
    await this.subModel.updateMany(
      {
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: { $lt: now },
        hasPaymentMethod: false,
      },
      { $set: { status: SubscriptionStatus.PAST_DUE } },
    );
  }
}
```

---

#### STEP B-6 — Wire Stripe Webhook to Update Subscription

**File:** `src/subscription/subscription.service.ts` — `handleWebhook` method  
Currently a stub. Wire it:

```typescript
async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
  const event = this.stripePayment.constructWebhookEvent(rawBody, signature);

  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = invoice.subscription as string;
      await this.subModel.findOneAndUpdate(
        { providerSubscriptionId: sub },
        {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(invoice.period_start * 1000),
          currentPeriodEnd: new Date(invoice.period_end * 1000),
          hasPaymentMethod: true,
        },
      );
      break;
    }
    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object as Stripe.Subscription;
      await this.subModel.findOneAndUpdate(
        { providerSubscriptionId: stripeSub.id },
        { status: SubscriptionStatus.CANCELED },
      );
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await this.subModel.findOneAndUpdate(
        { providerSubscriptionId: invoice.subscription as string },
        { status: SubscriptionStatus.PAST_DUE },
      );
      break;
    }
  }
}
```

---

#### STEP B-7 — Add Missing Limits to Schema

**File:** `src/schema/plan.schema.ts` — Add new limits:

```typescript
export class PlanLimits {
  // ... existing fields ...

  @Prop({ type: Number, default: 0 })
  emailCampaignRecipientsPerMonth: number;   // 0 / 1000 / 15000

  @Prop({ type: Number, default: 0 })
  whatsappMessagesPerMonth: number;           // 0 / 250 / 1000

  @Prop({ type: Number, default: 30 })
  analyticsLookbackDays: number;             // 30 / 180 / 365

  @Prop({ type: Number, default: 300 })
  sessionBookingsPerMonth: number;           // 0 / 300 / 1000
}
```

**File:** `src/schema/subscription.schema.ts` — Add cache fields:

```typescript
// Add to Subscription schema (cached from Plan at subscribe time):
@Prop({ type: Number, default: 0 })
emailCampaignRecipientsPerMonth: number;

@Prop({ type: Number, default: 0 })
whatsappMessagesPerMonth: number;

@Prop({ type: Number, default: 30 })
analyticsLookbackDays: number;
```

---

#### STEP B-8 — Analytics Module Plan Gating

**File:** `src/analytics/analytics.service.ts`  
Add lookback window restriction:

```typescript
private getLookbackDays(subscription: Subscription | null): number {
  const PLAN_ENFORCEMENT_MODE = process.env.PLAN_ENFORCEMENT_MODE === 'true';
  if (!PLAN_ENFORCEMENT_MODE || !subscription) return 365; // unlimited in free mode

  return subscription.analyticsLookbackDays ?? 30;
}

async getCreatorAnalytics(creatorId: string, fromDate?: Date) {
  const sub = await this.subModel.findOne({ creatorId }).lean();
  const daysBack = this.getLookbackDays(sub);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  const effectiveFrom = fromDate && fromDate > cutoff ? fromDate : cutoff;
  // ... query with effectiveFrom
}
```

---

#### STEP B-9 — Email Campaign Quota Enforcement

**File:** `src/email-campaign/email-campaign.service.ts`  
Before sending a campaign:

```typescript
async validateCampaignQuota(creatorId: string, recipientCount: number) {
  const PLAN_ENFORCEMENT_MODE = process.env.PLAN_ENFORCEMENT_MODE === 'true';
  if (!PLAN_ENFORCEMENT_MODE) return; // skip in free mode

  const sub = await this.subModel.findOne({ creatorId }).lean();
  if (!sub) throw new ForbiddenException('No active subscription');

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const usedThisMonth = await this.usageModel.aggregate([
    { $match: { creatorId: new Types.ObjectId(creatorId), type: 'email_campaign', createdAt: { $gte: monthStart } } },
    { $group: { _id: null, total: { $sum: '$count' } } },
  ]);
  const used = usedThisMonth[0]?.total ?? 0;
  const limit = sub.emailCampaignRecipientsPerMonth;

  if (used + recipientCount > limit) {
    throw new ForbiddenException(
      `Email campaign quota exceeded. Used: ${used}/${limit} this month. Please upgrade to send more.`
    );
  }
}
```

---

#### STEP B-10 — Plan Enforcement Mode: `.env` Updates

**File:** `docker/backend.env`

```env
# ── Plan Enforcement ──────────────────────────────────────────────────
# PLAN_ENFORCEMENT_MODE=false → all creators have unlimited access (dev/beta)
# PLAN_ENFORCEMENT_MODE=true  → enforce plan limits, feature gates, quotas
PLAN_ENFORCEMENT_MODE=false

# Free mode (legacy, replaced by PLAN_ENFORCEMENT_MODE — keep for backward compat)
# FREE_MODE is now an alias for PLAN_ENFORCEMENT_MODE=false
FREE_MODE=true
```

---

### 3.3 Backend Implementation Priority Order

| Priority | Task                                                                            | File(s)                                    | Estimated Effort |
| -------- | ------------------------------------------------------------------------------- | ------------------------------------------ | ---------------- |
| 🔴 1      | Update seed plans to correct prices/limits                                      | `seed-plans.ts`                            | 1h               |
| 🔴 2      | Rename `FREE_MODE` → `PLAN_ENFORCEMENT_MODE` in PolicyService                   | `policy.service.ts`                        | 1h               |
| 🔴 3      | Add `canUseFeature()` to PolicyService + inject Plan model                      | `policy.service.ts`, `policy.module.ts`    | 2h               |
| 🔴 4      | Create `PlanFeatureGuard` + `@RequireFeature` decorator                         | New guard file                             | 2h               |
| 🔴 5      | Apply `@RequireFeature` to all gated controllers (challenges, events, sessions) | 3 controllers                              | 1h               |
| 🔴 6      | Fix session.service.ts hardcoded `hasSub=true`                                  | `session.service.ts:451`                   | 30m              |
| 🟡 7      | Add expiry cron (ScheduleModule + scheduler class)                              | New scheduler                              | 2h               |
| 🟡 8      | Add missing limits to Plan + Subscription schemas (email/whatsapp/analytics)    | `plan.schema.ts`, `subscription.schema.ts` | 1h               |
| 🟡 9      | Wire Stripe webhook to update subscription                                      | `subscription.service.ts`                  | 3h               |
| 🟡 10     | Analytics lookback enforcement                                                  | `analytics.service.ts`                     | 1h               |
| 🟡 11     | Email campaign quota service                                                    | `email-campaign.service.ts`                | 2h               |
| 🟠 12     | Invoice service + schema                                                        | New service                                | 4h               |
| 🟠 13     | Usage tracking schema + service                                                 | New schema + service                       | 3h               |
| 🟠 14     | WhatsApp Business API integration                                               | New service                                | 8h               |
| 🟠 15     | Real Stripe subscription create on upgrade                                      | `subscription.service.ts`                  | 4h               |

---

## Part 4 — Frontend Implementation Plan

### 4.1 Current Frontend State

From codebase scan:
- `lib/api/subscription.api.ts` — subscription API client exists  
- `lib/api/types.ts` — some plan types exist  
- No upgrade wall UI, no plan-based feature gating, no `usePlan()` hook  
- No `PricingPage`, no `UpgradeModal`

---

### 4.2 Step-by-Step Frontend Tasks

#### STEP F-1 — Add ENV Flag to Frontend

**File:** `.env` / `docker/frontend.env`

```env
# Controls whether UI feature gates and upgrade walls are shown
# When false: creators see all features, no "Upgrade to access" walls
NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE=false
```

---

#### STEP F-2 — Define Plan Config

**New file:** `lib/plans/plan-config.ts`

```typescript
export type PlanTier = 'starter' | 'growth' | 'pro';

export interface PlanLimits {
  membersMax: number;
  adminsMax: number;
  coursesActivationMax: number;
  storageGB: number;
  emailCampaignRecipientsPerMonth: number;
  whatsappMessagesPerMonth: number;
  sessionBookingsPerMonth: number;
  analyticsLookbackDays: number;
}

export interface PlanFeatures {
  courses: boolean;
  products: boolean;
  challenges: boolean;
  sessions: boolean;
  events: boolean;
  branding: boolean;
  gamification: boolean;
  verifiedBadge: boolean;
  featuredBadge: boolean;
}

export interface Plan {
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number; // per-month when billed yearly
  yearlyTotal: number;
  transactionFee: number;
  currency: 'TND';
  limits: PlanLimits;
  features: PlanFeatures;
  trialDays: number;
  highlight?: boolean;
}

export const PLANS: Record<PlanTier, Plan> = {
  starter: {
    tier: 'starter',
    name: 'Starter',
    monthlyPrice: 39,
    yearlyMonthlyPrice: 31,
    yearlyTotal: 372,
    transactionFee: 7.9,
    currency: 'TND',
    trialDays: 7,
    limits: {
      membersMax: 100,
      adminsMax: 1,
      coursesActivationMax: 3,
      storageGB: 5,
      emailCampaignRecipientsPerMonth: 0,
      whatsappMessagesPerMonth: 0,
      sessionBookingsPerMonth: 0,
      analyticsLookbackDays: 30,
    },
    features: {
      courses: true,
      products: true,
      challenges: false,
      sessions: false,
      events: false,
      branding: false,
      gamification: false,
      verifiedBadge: false,
      featuredBadge: false,
    },
  },
  growth: {
    tier: 'growth',
    name: 'Growth',
    monthlyPrice: 99,
    yearlyMonthlyPrice: 79,
    yearlyTotal: 948,
    transactionFee: 4.9,
    currency: 'TND',
    trialDays: 7,
    highlight: true,
    limits: {
      membersMax: 500,
      adminsMax: 2,
      coursesActivationMax: 999,
      storageGB: 50,
      emailCampaignRecipientsPerMonth: 1000,
      whatsappMessagesPerMonth: 250,
      sessionBookingsPerMonth: 300,
      analyticsLookbackDays: 180,
    },
    features: {
      courses: true,
      products: true,
      challenges: true,
      sessions: true,
      events: true,
      branding: false,
      gamification: true,
      verifiedBadge: true,
      featuredBadge: false,
    },
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    monthlyPrice: 159,
    yearlyMonthlyPrice: 127,
    yearlyTotal: 1524,
    transactionFee: 2.9,
    currency: 'TND',
    trialDays: 7,
    limits: {
      membersMax: 999999,
      adminsMax: 3,
      coursesActivationMax: 999999,
      storageGB: 300,
      emailCampaignRecipientsPerMonth: 15000,
      whatsappMessagesPerMonth: 1000,
      sessionBookingsPerMonth: 1000,
      analyticsLookbackDays: 365,
    },
    features: {
      courses: true,
      products: true,
      challenges: true,
      sessions: true,
      events: true,
      branding: true,
      gamification: true,
      verifiedBadge: true,
      featuredBadge: true,
    },
  },
};
```

---

#### STEP F-3 — Create `usePlan()` Hook

**New file:** `hooks/usePlan.ts`

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/lib/api/subscription.api';
import { PLANS, type Plan, type PlanTier } from '@/lib/plans/plan-config';

const PLAN_ENFORCEMENT_MODE = process.env.NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE === 'true';

export function usePlan() {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: () => subscriptionApi.getMySubscription(),
    staleTime: 60_000,
  });

  // When enforcement is off → simulate unlimited Pro
  if (!PLAN_ENFORCEMENT_MODE) {
    return {
      plan: PLANS.pro as Plan,
      tier: 'pro' as PlanTier,
      isLoading: false,
      subscription: null,
      enforcementEnabled: false,
      canUseFeature: (_feature: string) => true,
      isAtLimit: (_limit: keyof Plan['limits'], _currentValue: number) => false,
      limitValue: (limit: keyof Plan['limits']) => PLANS.pro.limits[limit],
    };
  }

  const tier = (subscription?.plan as PlanTier) ?? 'starter';
  const plan = PLANS[tier] ?? PLANS.starter;

  return {
    plan,
    tier,
    isLoading,
    subscription,
    enforcementEnabled: true,
    canUseFeature: (feature: keyof Plan['features']) => {
      if (!PLAN_ENFORCEMENT_MODE) return true;
      return plan.features[feature] ?? false;
    },
    isAtLimit: (limit: keyof Plan['limits'], currentValue: number) => {
      if (!PLAN_ENFORCEMENT_MODE) return false;
      const max = plan.limits[limit] as number;
      return currentValue >= max;
    },
    limitValue: (limit: keyof Plan['limits']) => plan.limits[limit],
  };
}
```

---

#### STEP F-4 — Create `<FeatureGate>` Component

**New file:** `components/plan/feature-gate.tsx`

```typescript
'use client';

import { usePlan } from '@/hooks/usePlan';
import type { Plan } from '@/lib/plans/plan-config';

interface FeatureGateProps {
  feature: keyof Plan['features'];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const { canUseFeature, enforcementEnabled } = usePlan();

  if (!enforcementEnabled) return <>{children}</>;
  if (canUseFeature(feature)) return <>{children}</>;

  return fallback ? <>{fallback}</> : null;
}
```

Usage:

```tsx
<FeatureGate feature="challenges" fallback={<UpgradeBanner requiredPlan="growth" />}>
  <CreateChallengeButton />
</FeatureGate>
```

---

#### STEP F-5 — Create `<UpgradeModal>` Component

**New file:** `components/plan/upgrade-modal.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PLANS, type PlanTier } from '@/lib/plans/plan-config';
import { Check, Zap, Star, Rocket } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  requiredPlan?: PlanTier;
  blockedFeature?: string;
}

const PLAN_ICONS: Record<PlanTier, typeof Zap> = {
  starter: Zap,
  growth: Star,
  pro: Rocket,
};

export function UpgradeModal({ open, onClose, requiredPlan = 'growth', blockedFeature }: UpgradeModalProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  const comparePlans = (['starter', 'growth', 'pro'] as PlanTier[]).filter(
    t => t === requiredPlan || t === 'pro'
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          {blockedFeature && (
            <p className="text-sm text-muted-foreground">
              <strong>{blockedFeature}</strong> requires the <strong>{PLANS[requiredPlan].name}</strong> plan or higher.
            </p>
          )}
        </DialogHeader>

        <div className="flex justify-center gap-2 my-4">
          <Button size="sm" variant={billing === 'monthly' ? 'default' : 'outline'} onClick={() => setBilling('monthly')}>Monthly</Button>
          <Button size="sm" variant={billing === 'yearly' ? 'default' : 'outline'} onClick={() => setBilling('yearly')}>
            Yearly <Badge variant="secondary" className="ml-2">Save 20%</Badge>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {comparePlans.map(tier => {
            const plan = PLANS[tier];
            const Icon = PLAN_ICONS[tier];
            const price = billing === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
            const isHighlighted = tier === requiredPlan;

            return (
              <div key={tier} className={`rounded-xl border p-5 ${isHighlighted ? 'border-primary ring-2 ring-primary' : ''}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  {isHighlighted && <Badge>Recommended</Badge>}
                </div>
                <div className="text-3xl font-bold mb-1">
                  {price} <span className="text-base font-normal">TND/mo</span>
                </div>
                {billing === 'yearly' && (
                  <p className="text-xs text-muted-foreground mb-3">Billed {plan.yearlyTotal} TND/year</p>
                )}
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.limits.membersMax >= 999999 ? 'Unlimited members' : `${plan.limits.membersMax} members`}</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.limits.storageGB} GB storage</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.transactionFee}% transaction fee</li>
                  {plan.features.challenges && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />Challenges</li>}
                  {plan.features.sessions && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />Sessions</li>}
                  {plan.features.events && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />Events</li>}
                  {plan.features.branding && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />Remove Chabaqa branding</li>}
                </ul>
                <Button className="w-full" variant={isHighlighted ? 'default' : 'outline'}>
                  Upgrade to {plan.name}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

#### STEP F-6 — Create `<PricingPage>`

**New file:** `app/(landing)/pricing/page.tsx`

Full public pricing page displaying all 3 plans with:
- Monthly/Yearly toggle
- Feature comparison table
- "Start free trial" buttons
- Plan highlights and badges

Key structure:
```tsx
export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <main>
      <HeroSection />
      <BillingToggle value={billing} onChange={setBilling} />
      <PlanCards plans={PLANS} billing={billing} />
      <FeatureComparisonTable plans={PLANS} />
      <AddOnsSection />
      <FAQSection />
    </main>
  );
}
```

---

#### STEP F-7 — Gate Features Throughout Creator Dashboard

Apply feature gates where relevant in the community dashboard:

```tsx
// In challenges creation button:
<FeatureGate feature="challenges" fallback={<LockedFeatureCard feature="Challenges" requiredPlan="growth" />}>
  <CreateChallengeButton />
</FeatureGate>

// In events creation:
<FeatureGate feature="events" fallback={<LockedFeatureCard feature="Events" requiredPlan="growth" />}>
  <CreateEventButton />
</FeatureGate>

// In session creation:
<FeatureGate feature="sessions" fallback={<LockedFeatureCard feature="1:1 Sessions" requiredPlan="growth" />}>
  <CreateSessionButton />
</FeatureGate>

// In analytics lookback date picker:
{enforcementEnabled && (
  <p className="text-xs text-muted-foreground">
    Data limited to last {limitValue('analyticsLookbackDays')} days on your plan.
    <UpgradeLink>Upgrade for more history</UpgradeLink>
  </p>
)}
```

---

#### STEP F-8 — Create `<UsageIndicator>` Components for Dashboard

**New file:** `components/plan/usage-indicator.tsx`

```typescript
'use client';

import { usePlan } from '@/hooks/usePlan';
import { Progress } from '@/components/ui/progress';

interface UsageIndicatorProps {
  label: string;
  current: number;
  limitKey: keyof import('@/lib/plans/plan-config').Plan['limits'];
  suffix?: string;
}

export function UsageIndicator({ label, current, limitKey, suffix = '' }: UsageIndicatorProps) {
  const { limitValue, enforcementEnabled } = usePlan();
  if (!enforcementEnabled) return null;

  const max = limitValue(limitKey) as number;
  const isUnlimited = max >= 999999;
  const percent = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
  const isNearLimit = percent >= 80;
  const isAtLimit = percent >= 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isAtLimit ? 'text-destructive font-medium' : isNearLimit ? 'text-amber-600' : ''}>
          {isUnlimited ? `${current}${suffix} / Unlimited` : `${current}${suffix} / ${max}${suffix}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percent}
          className={isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-amber-500' : ''}
        />
      )}
    </div>
  );
}
```

Usage in admin dashboard:
```tsx
<UsageIndicator label="Members" current={memberCount} limitKey="membersMax" />
<UsageIndicator label="Storage" current={usedStorageGB} limitKey="storageGB" suffix=" GB" />
<UsageIndicator label="Email Recipients" current={emailRecipientsThisMonth} limitKey="emailCampaignRecipientsPerMonth" />
```

---

#### STEP F-9 — Subscription Management Page

**New file:** `app/(community)/[creator]/[feature]/(loggedUser)/dashboard/admin/subscription/page.tsx`

Content:
- Current plan card (tier, billing cycle, next payment date)
- Usage bars for all limits
- Upgrade CTA
- Cancel/downgrade link
- Invoice history table

---

### 4.3 Frontend Implementation Priority Order

| Priority | Task                                                       | Files                            | Effort |
| -------- | ---------------------------------------------------------- | -------------------------------- | ------ |
| 🔴 1      | Add `NEXT_PUBLIC_PLAN_ENFORCEMENT_MODE` to `.env`          | `.env`, `frontend.env`           | 15m    |
| 🔴 2      | Create `lib/plans/plan-config.ts`                          | New file                         | 1h     |
| 🔴 3      | Create `hooks/usePlan.ts`                                  | New file                         | 1h     |
| 🔴 4      | Create `<FeatureGate>` component                           | New component                    | 30m    |
| 🔴 5      | Create `<UpgradeModal>` component                          | New component                    | 2h     |
| 🔴 6      | Apply `<FeatureGate>` to challenges/events/sessions        | 3 locations                      | 1h     |
| 🟡 7      | Create Pricing page                                        | `app/(landing)/pricing/page.tsx` | 4h     |
| 🟡 8      | Create `<UsageIndicator>` component                        | New component                    | 1h     |
| 🟡 9      | Add usage bars to admin dashboard                          | Dashboard admin page             | 1h     |
| 🟡 10     | Wire `usePlan()` to analytics pages (lookback enforcement) | Analytics pages                  | 1h     |
| 🟡 11     | Subscription management page                               | New page                         | 3h     |
| 🟠 12     | Add-ons UI (extra seats, storage upgrade)                  | Subscription page                | 2h     |
| 🟠 13     | Invoice download / billing history                         | Subscription page                | 2h     |
| 🟠 14     | Trial countdown banner                                     | Global banner component          | 1h     |

---

## Part 5 — Gaps to Finalize (Outstanding Items from Original Sheet)

| #   | Item                                                       | Status                              | Owner              |
| --- | ---------------------------------------------------------- | ----------------------------------- | ------------------ |
| 1   | AI credits per plan (TBD in sheet)                         | ⏳ Pending business decision         | Product            |
| 2   | Starter WhatsApp quota (currently 0)                       | ⏳ Needs decision (0 or small quota) | Product            |
| 3   | Fixed fee component on transaction (recommended 0.5 TND)   | ⏳ Needs sign-off                    | Finance            |
| 4   | Growth custom domain entitlement                           | ⏳ Not in sheet — confirm No/Yes     | Product            |
| 5   | Yearly billing semantics (implement as monthly recurring?) | ⏳ Stripe subscription interval      | Engineering        |
| 6   | Starter active courses/session caps                        | Assumed: 3 courses, 0 sessions      | Product to confirm |
| 7   | ENTERPRISE tier definition                                 | ⏳ Not scoped yet                    | Product            |
| 8   | Flouci payment provider real credentials                   | ⏳ Ops                               | DevOps             |
| 9   | WhatsApp Business API vendor selection                     | ⏳ Infobip / Twilio / Meta direct    | Engineering        |

---

## Part 6 — Full Execution Sequence

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — DATA LAYER (Week 1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
B-1  Fix seed plans: prices, limits, features
B-7  Add missing schema fields (email/whatsapp/analytics limits)
     Run seed script in dev + staging

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — BACKEND ENFORCEMENT (Week 2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
B-2  Rename FREE_MODE → PLAN_ENFORCEMENT_MODE throughout
B-3  Add canUseFeature() to PolicyService + inject Plan model
B-4  Create PlanFeatureGuard + @RequireFeature decorator
B-5  Apply guard to event/challenge/session controllers
B-6  Fix session.service.ts hardcoded bypass
B-8  Analytics lookback window enforcement
B-9  Email campaign quota enforcement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — FRONTEND ENFORCEMENT (Week 3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
F-1  Add env flag to frontend envs
F-2  Create plan-config.ts
F-3  Create usePlan() hook
F-4  Create <FeatureGate> component
F-5  Create <UpgradeModal>
F-6  Apply gates to challenges/events/sessions in dashboard
F-8  Add <UsageIndicator> to admin dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — SUBSCRIPTION PAYMENTS (Week 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
B-5  Add expiry cron job (ScheduleModule)
B-6  Wire Stripe webhook → subscription update
      Real Stripe subscription create on upgrade
F-9  Subscription management page
F-7  Pricing page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — LAUNCH (Week 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Set PLAN_ENFORCEMENT_MODE=false (soft launch — subscriptions available, no gates)
Notify creators 30 days in advance
Set PLAN_ENFORCEMENT_MODE=true (full enforcement)
Monitor margin dashboards, alert on under-threshold plans
```

---

## Part 7 — Finance Monitoring Guardrails

### 7.1 Internal Thresholds

| Plan    | Subscription Margin Target | Alert Below |
| ------- | -------------------------- | ----------- |
| Starter | ~98%                       | < 80%       |
| Growth  | ~84%                       | < 65%       |
| Pro     | ~70%                       | < 50%       |

### 7.2 Add-on Storage Margin

- Minimum margin target: **45%**
- If storage cost (0.0435 TND/GB) rises, revisit storage add-on pricing quarterly.

### 7.3 Monthly Finance Report Checklist

- [ ] Per-plan actual vs projected variable cost
- [ ] Transaction fee revenue by plan tier
- [ ] Add-on revenue (storage, extra seats)
- [ ] Churn rate by tier
- [ ] Trial conversion rate (target: 35%+)
- [ ] WhatsApp usage cost vs included quota

---

## Part 8 — Definition of Done

### Backend
- [ ] Plan seed script updated with correct prices and all feature flags
- [ ] `PolicyService.canUseFeature()` implemented and tested
- [ ] `PlanFeatureGuard` applied to all gated endpoints
- [ ] `PLAN_ENFORCEMENT_MODE` replaces `FREE_MODE` throughout
- [ ] Session.service.ts hardcoded bypass removed
- [ ] Expiry cron job running
- [ ] Stripe webhook updating subscription status
- [ ] Analytics lookback enforced server-side
- [ ] Email campaign quota enforced server-side

### Frontend
- [ ] `lib/plans/plan-config.ts` created
- [ ] `usePlan()` hook created and works with PLAN_ENFORCEMENT_MODE=false
- [ ] `<FeatureGate>` wraps all gated features
- [ ] `<UpgradeModal>` shown on feature access attempt when gated
- [ ] `<UsageIndicator>` visible in admin dashboard
- [ ] Pricing page live at `/pricing`
- [ ] Subscription management page in creator dashboard
- [ ] All UI gracefully handles `PLAN_ENFORCEMENT_MODE=false` (no gates shown)

### Deployment
- [ ] `PLAN_ENFORCEMENT_MODE=false` in staging (ships with subscription UI, no gates)  
- [ ] `PLAN_ENFORCEMENT_MODE=true` in production (flipped after 30-day creator notice)
- [ ] All 3 plans seeded in production MongoDB
