'use client';

import { Fragment, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PLANS,
  PLAN_TIERS,
  type PlanTier,
  formatLimit,
} from '@/lib/plans/plan-config';
import {
  Check,
  X,
  Zap,
  Star,
  Rocket,
  ChevronDown,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { subscriptionApi, PlanTier as ApiPlanTier } from '@/lib/api/subscription.api';
import { PaymentProviderModal } from '@/components/payment-provider-modal';
import { usePaymentProviderModal } from '@/lib/hooks/use-payment-provider-modal';

// ── Constants ──────────────────────────────────────────────────────

type Billing = 'monthly' | 'yearly';

const PLAN_ICONS: Record<PlanTier, typeof Zap> = {
  starter: Zap,
  growth: Star,
  pro: Rocket,
};

const PLAN_COLORS: Record<PlanTier, string> = {
  starter: 'border-blue-200',
  growth: 'border-primary ring-2 ring-primary/20',
  pro: 'border-purple-300',
};

const API_TIER_BY_PLAN: Record<PlanTier, ApiPlanTier> = {
  starter: ApiPlanTier.STARTER,
  growth: ApiPlanTier.GROWTH,
  pro: ApiPlanTier.PRO,
};

// ── Feature comparison rows ────────────────────────────────────────

interface ComparisonRow {
  label: string;
  category?: string;
  values: Record<PlanTier, string | boolean>;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  // Creator / Platform Limits
  { label: 'Total members', category: 'Platform Limits', values: { starter: '100', growth: '500', pro: 'Unlimited' } },
  { label: 'Team / admin seats', values: { starter: '1', growth: '2', pro: '3' } },
  { label: 'Communities', values: { starter: '1', growth: '1', pro: '1' } },
  { label: 'Verified badge', values: { starter: false, growth: true, pro: true } },
  { label: 'Featured badge', values: { starter: false, growth: false, pro: true } },

  // Content Limits
  { label: 'Active courses', category: 'Content', values: { starter: '3', growth: 'Unlimited', pro: 'Unlimited' } },
  { label: 'Products', values: { starter: true, growth: true, pro: true } },
  { label: 'Challenges', values: { starter: false, growth: true, pro: true } },
  { label: 'Events', values: { starter: false, growth: true, pro: true } },
  { label: '1:1 Sessions', values: { starter: false, growth: '300/mo', pro: '1,000/mo' } },
  { label: 'Storage', values: { starter: '5 GB', growth: '50 GB', pro: '300 GB' } },

  // Growth & Automation
  { label: 'Email campaigns (recipients/mo)', category: 'Growth & Automation', values: { starter: '-', growth: '1,000', pro: '15,000' } },
  { label: 'WhatsApp messages/mo', values: { starter: '-', growth: '250', pro: '1,000' } },
  { label: 'Remove Chabaqa branding', values: { starter: false, growth: false, pro: true } },
  { label: 'Gamification (points / badges)', values: { starter: false, growth: true, pro: true } },

  // Analytics
  { label: 'Analytics lookback window', category: 'Analytics', values: { starter: '30 days', growth: '180 days', pro: '365 days' } },

  // Transaction Fees
  { label: 'Platform transaction fee', category: 'Transaction Fees', values: { starter: '7.9%', growth: '4.9%', pro: '2.9%' } },
];

// ── FAQ ────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes. All plans include a 7-day trial. Checkout is handled securely by the selected payment provider.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. You can upgrade or downgrade anytime. Upgrades take effect immediately, and downgrades apply at the end of your current billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept Visa, Mastercard, and local Tunisian payment methods. All prices are in Tunisian Dinar (TND).',
  },
  {
    q: 'What happens if I go over my plan limits?',
    a: "We'll notify you when you're approaching limits. You can upgrade your plan for higher allowances.",
  },
  {
    q: 'Can I cancel my subscription?',
    a: "Yes, you can cancel anytime. Your access continues until the end of the current billing period. There are no cancellation fees.",
  },
  {
    q: 'Do you offer annual billing?',
    a: 'Yes! Annual billing saves you ~20% compared to monthly. You can switch between billing cycles when renewing.',
  },
];

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background">
          <section className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">Loading pricing...</p>
          </section>
        </main>
      }
    >
      <PricingPageContent />
    </Suspense>
  );
}

// ── Page Component ─────────────────────────────────────────────────

function PricingPageContent() {
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<Billing>('yearly');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [pendingTier, setPendingTier] = useState<ApiPlanTier | null>(null);
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);

  const paymentModal = usePaymentProviderModal({
    initStripe: () => subscriptionApi.initStripePayment(pendingTier!, billing === 'yearly' ? 'year' : 'month'),
    initKonnect: () => subscriptionApi.initKonnectPayment(pendingTier!, billing === 'yearly' ? 'year' : 'month'),
    onError: () => {
      const params = new URLSearchParams({ billing });
      if (selectedTier) params.set('plan', selectedTier);
      params.set('redirect', `/pricing?plan=${selectedTier || 'growth'}&billing=${billing}`);
      window.location.href = `/signup?${params.toString()}`;
    },
  });

  useEffect(() => {
    const planParam = searchParams.get('plan')?.toLowerCase();
    const billingParam = searchParams.get('billing')?.toLowerCase();

    if (billingParam === 'monthly' || billingParam === 'yearly') {
      setBilling(billingParam);
    }

    if (planParam && PLAN_TIERS.includes(planParam as PlanTier)) {
      const tier = planParam as PlanTier;
      setSelectedTier(tier);
      setPendingTier(API_TIER_BY_PLAN[tier]);
    }
  }, [searchParams]);

  const handleGetStarted = (tier: PlanTier) => {
    setSelectedTier(tier);
    setPendingTier(API_TIER_BY_PLAN[tier]);
    paymentModal.open();
  };

  const checkoutDescription = useMemo(() => {
    if (!selectedTier) return 'Choose Stripe or Konnect to start your 7-day trial through secure checkout.';
    return `Start the ${PLANS[selectedTier].name} 7-day trial through secure checkout.`;
  }, [selectedTier]);

  return (
    <>
      <PaymentProviderModal
        open={paymentModal.isOpen}
        onOpenChange={paymentModal.close}
        onSelect={paymentModal.handleSelect}
        title={selectedTier ? `Start ${PLANS[selectedTier].name}` : 'Choose Payment Method'}
        description={checkoutDescription}
      />
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-4">
          <Badge variant="outline" className="mb-4">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Start with a 7-day trial through secure checkout. Scale as you grow. All prices are in Tunisian Dinar (TND).
          </p>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="flex justify-center gap-2 -mt-4 mb-10">
        <div className="inline-flex items-center rounded-full border bg-muted/40 p-1 gap-1">
          <Button
            size="sm"
            variant={billing === 'monthly' ? 'default' : 'ghost'}
            className="rounded-full px-5"
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </Button>
          <Button
            size="sm"
            variant={billing === 'yearly' ? 'default' : 'ghost'}
            className="rounded-full px-5"
            onClick={() => setBilling('yearly')}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 text-xs">Save ~20%</Badge>
          </Button>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {PLAN_TIERS.map((tier) => {
            const plan = PLANS[tier];
            const Icon = PLAN_ICONS[tier];
            const price = billing === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
            const isPopular = plan.highlight;
            const isSelected = selectedTier === tier;

            return (
              <Card
                key={tier}
                className={`relative flex flex-col transition-shadow hover:shadow-lg ${PLAN_COLORS[tier]} ${isPopular ? 'scale-[1.02] shadow-md' : ''} ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-sm px-4">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{price}</span>
                    <span className="text-muted-foreground">TND/mo</span>
                  </div>
                  {billing === 'yearly' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed {plan.yearlyTotal} TND/year. Save {plan.monthlyPrice * 12 - plan.yearlyTotal} TND
                    </p>
                  )}
                  {billing === 'monthly' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Or {plan.yearlyMonthlyPrice} TND/mo billed yearly
                    </p>
                  )}
                  <p className="text-sm text-green-600 font-medium mt-2">
                    7-day trial included at checkout
                  </p>
                  {isSelected && (
                    <Badge variant="secondary" className="mt-3 w-fit">Selected from your last action</Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <ul className="space-y-2.5 flex-1 text-sm">
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{formatLimit(plan.limits.membersMax)} members</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{plan.limits.storageGB} GB storage</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{plan.transactionFee}% transaction fee</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{formatLimit(plan.limits.coursesActivationMax)} active courses</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{plan.limits.adminsMax} admin seat{plan.limits.adminsMax > 1 ? 's' : ''}</span>
                    </li>
                    {plan.features.challenges && (
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>Challenges</span>
                      </li>
                    )}
                    {plan.features.events && (
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>Events</span>
                      </li>
                    )}
                    {plan.features.sessions && (
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>1:1 Sessions ({formatLimit(plan.limits.sessionBookingsPerMonth)}/mo)</span>
                      </li>
                    )}
                    {plan.limits.emailCampaignRecipientsPerMonth > 0 && (
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{plan.limits.emailCampaignRecipientsPerMonth.toLocaleString()} email recipients/mo</span>
                      </li>
                    )}
                    {plan.features.gamification && (
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>Gamification</span>
                      </li>
                    )}
                    {plan.features.branding && (
                      <li className="flex items-center gap-2.5">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>Remove Chabaqa branding</span>
                      </li>
                    )}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleGetStarted(tier)}
                  >
                    Start secure checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Compare Plans</h2>
        <p className="text-muted-foreground text-center mb-10">Everything you get with each plan</p>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground w-[40%]">Feature</th>
                {PLAN_TIERS.map((tier) => (
                  <th key={tier} className="py-3 px-4 text-center font-semibold">
                    {PLANS[tier].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <Fragment key={`${row.category || 'row'}-${row.label}`}>
                  {row.category && (
                    <tr className="bg-muted/20">
                      <td colSpan={4} className="py-2 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        {row.category}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="py-2.5 px-4 text-muted-foreground">{row.label}</td>
                    {PLAN_TIERS.map((tier) => {
                      const val = row.values[tier];
                      return (
                        <td key={tier} className="py-2.5 px-4 text-center">
                          {typeof val === 'boolean' ? (
                            val ? (
                              <Check className="inline h-4 w-4 text-green-500" />
                            ) : (
                              <X className="inline h-4 w-4 text-muted-foreground/40" />
                            )
                          ) : (
                            <span className="font-medium">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Frequently Asked Questions</h2>
        <p className="text-muted-foreground text-center mb-10">Got questions? We have answers.</p>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-lg border transition-colors hover:bg-muted/20">
              <button
                className="w-full flex items-center justify-between py-4 px-5 text-left"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                <span className="font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  {faq.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {expandedFaq === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 py-16 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to grow your community?</h2>
          <p className="text-muted-foreground mb-6">
            Start your 7-day trial through secure checkout and keep your billing details in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => handleGetStarted('growth')}>
              Start secure checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
