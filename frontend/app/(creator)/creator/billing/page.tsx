'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import {
  AlertCircle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  XCircle,
} from 'lucide-react';
import { PageHeader, PageShell, Section, StatsGrid } from '@/components/creator-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { usePlan } from '@/hooks/use-plan';
import { PLANS, PLAN_TIERS, formatLimit, type PlanTier } from '@/lib/plans/plan-config';
import { subscriptionApi, SubscriptionStatus } from '@/lib/api/subscription.api';

const statusMeta: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof CheckCircle2 }> = {
  [SubscriptionStatus.ACTIVE]: { label: 'Active', variant: 'default', icon: CheckCircle2 },
  [SubscriptionStatus.TRIALING]: { label: 'Trialing', variant: 'secondary', icon: CalendarClock },
  [SubscriptionStatus.PAST_DUE]: { label: 'Past due', variant: 'destructive', icon: AlertCircle },
  [SubscriptionStatus.CANCELED]: { label: 'Canceled', variant: 'outline', icon: XCircle },
  [SubscriptionStatus.INCOMPLETE]: { label: 'Incomplete', variant: 'outline', icon: AlertCircle },
};

function formatDate(value?: string | Date | null) {
  if (!value) return 'Not available';
  const date = value instanceof Date ? value : parseISO(String(value));
  return isValid(date) ? format(date, 'MMM d, yyyy') : 'Not available';
}

function formatMoney(amount?: number | null, currency = 'TND') {
  if (amount == null || Number.isNaN(Number(amount))) return 'Not available';
  return `${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency.toUpperCase()}`;
}

function periodProgress(start?: string | Date, end?: string | Date) {
  if (!start || !end) return 0;
  const startDate = start instanceof Date ? start : parseISO(String(start));
  const endDate = end instanceof Date ? end : parseISO(String(end));
  if (!isValid(startDate) || !isValid(endDate)) return 0;
  const total = endDate.getTime() - startDate.getTime();
  if (total <= 0) return 0;
  const elapsed = Date.now() - startDate.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function planRank(tier: PlanTier) {
  return PLAN_TIERS.indexOf(tier);
}

export default function CreatorBillingPage() {
  const { plan, tier, subscription, isLoading, refetch, enforcementEnabled } = usePlan();
  const { toast } = useToast();
  const [canceling, setCanceling] = useState(false);

  const status = subscription?.status || (enforcementEnabled ? 'none' : SubscriptionStatus.ACTIVE);
  const meta = statusMeta[status] || { label: 'No subscription', variant: 'outline' as const, icon: AlertCircle };
  const StatusIcon = meta.icon;
  const currentTier = tier as PlanTier;
  const billingInterval = subscription?.billingInterval === 'year' ? 'year' : 'month';
  const periodEnd = subscription?.nextBillingAt || subscription?.currentPeriodEnd || subscription?.trialEndsAt;
  const progress = periodProgress(subscription?.currentPeriodStart, subscription?.currentPeriodEnd);
  const amount = subscription?.amount ?? (billingInterval === 'year' ? plan.yearlyTotal : plan.monthlyPrice);
  const currency = subscription?.currency || plan.currency || 'TND';

  const availableUpgrades = useMemo(
    () => PLAN_TIERS.filter((candidate) => planRank(candidate) > planRank(currentTier)),
    [currentTier],
  );

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await subscriptionApi.cancelSubscription();
      await refetch();
      toast({
        title: 'Cancellation scheduled',
        description: 'Your plan will stay active until the current billing period ends.',
      });
    } catch (error: any) {
      toast({
        title: 'Could not cancel subscription',
        description: error?.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex min-h-[420px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Account billing"
        description="Track your Chabaqa creator plan, renewal status, provider details, and badge eligibility. Card data stays tokenized with the payment provider."
        badge={{ label: meta.label, variant: meta.variant }}
        actions={[
          { label: 'Refresh', onClick: () => void refetch(), icon: RefreshCw, variant: 'outline' },
          { label: 'Compare plans', href: '/pricing', icon: Sparkles },
        ]}
      />

      {!enforcementEnabled && (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Plan enforcement is disabled in this environment</AlertTitle>
          <AlertDescription>
            The dashboard is showing Pro-level access locally. Enable plan enforcement to verify the live subscription returned by the backend.
          </AlertDescription>
        </Alert>
      )}

      {subscription?.cancelAtPeriodEnd && (
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>Cancellation scheduled</AlertTitle>
          <AlertDescription>
            Your current access remains available until {formatDate(periodEnd)}. Renew or upgrade before then to keep creator features active.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-chabaqa-primary/10 via-white to-chabaqa-secondary1/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-chabaqa-primary" />
                  <CardTitle className="text-2xl">{plan.name} plan</CardTitle>
                  <Badge variant={meta.variant} className="gap-1">
                    <StatusIcon className="h-3.5 w-3.5" />
                    {meta.label}
                  </Badge>
                </div>
                <CardDescription>
                  {billingInterval === 'year' ? 'Yearly billing' : 'Monthly billing'} · {formatMoney(amount, currency)}
                </CardDescription>
              </div>
              <Button asChild>
                <Link href="/pricing">Change plan</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <StatsGrid columns={4}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Current period</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold">{formatDate(subscription?.currentPeriodStart)}</p>
                  <p className="text-xs text-muted-foreground">to {formatDate(subscription?.currentPeriodEnd)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Next billing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold">{formatDate(periodEnd)}</p>
                  <p className="text-xs text-muted-foreground">{subscription?.cancelAtPeriodEnd ? 'Access ends on this date' : 'Auto-renewal date'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Provider</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold capitalize">{subscription?.provider || 'Not linked'}</p>
                  <p className="text-xs text-muted-foreground">{subscription?.providerSubscriptionId ? 'Subscription synced' : 'Awaiting provider data'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Payment method</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-semibold">
                    {subscription?.paymentBrand && subscription?.paymentLast4
                      ? `${subscription.paymentBrand.toUpperCase()} •••• ${subscription.paymentLast4}`
                      : subscription?.hasPaymentMethod
                        ? 'Saved with provider'
                        : 'Not available'}
                  </p>
                  <p className="text-xs text-muted-foreground">No full card number is stored</p>
                </CardContent>
              </Card>
            </StatsGrid>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Billing period progress</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium">Members</p>
                <p className="mt-1 text-2xl font-bold">{formatLimit(plan.limits.membersMax)}</p>
                <p className="text-xs text-muted-foreground">included in this plan</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium">Active courses</p>
                <p className="mt-1 text-2xl font-bold">{formatLimit(plan.limits.coursesActivationMax)}</p>
                <p className="text-xs text-muted-foreground">publishing allowance</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm font-medium">Storage</p>
                <p className="mt-1 text-2xl font-bold">{plan.limits.storageGB} GB</p>
                <p className="text-xs text-muted-foreground">media and uploads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" /> Payment protection
              </CardTitle>
              <CardDescription>Provider-tokenized checkout keeps sensitive card details out of Chabaqa.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <LockKeyhole className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span>Only provider IDs, brand, and last four digits are displayed.</span>
              </div>
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                <span>Stripe subscription events keep renewal, cancellation, and failed-payment state synchronized.</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BadgeCheck className="h-5 w-5" /> Creator badges
              </CardTitle>
              <CardDescription>Badges available from your current plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="flex items-center gap-2 text-sm"><BadgeCheck className="h-4 w-4 text-blue-600" /> Verified badge</span>
                <Badge variant={plan.features.verifiedBadge ? 'default' : 'outline'}>{plan.features.verifiedBadge ? 'Included' : 'Upgrade'}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="flex items-center gap-2 text-sm"><Star className="h-4 w-4 text-amber-500" /> Featured badge</span>
                <Badge variant={plan.features.featuredBadge ? 'default' : 'outline'}>{plan.features.featuredBadge ? 'Included' : 'Upgrade'}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Section title="Upgrade options" description="Move to a higher tier to unlock more automation, badges, analytics, and lower transaction fees.">
        <div className="grid gap-4 md:grid-cols-3">
          {(availableUpgrades.length > 0 ? availableUpgrades : [currentTier]).map((candidate) => {
            const candidatePlan = PLANS[candidate];
            return (
              <Card key={candidate}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    {candidatePlan.name}
                    {candidate === currentTier && <Badge variant="secondary">Current</Badge>}
                  </CardTitle>
                  <CardDescription>
                    {candidatePlan.monthlyPrice} TND/mo · {candidatePlan.yearlyTotal} TND/year
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>{formatLimit(candidatePlan.limits.membersMax)} members</p>
                  <p>{candidatePlan.transactionFee}% transaction fee</p>
                  <p>{candidatePlan.features.featuredBadge ? 'Featured badge included' : candidatePlan.features.verifiedBadge ? 'Verified badge included' : 'Core creator tools'}</p>
                  <Button asChild className="w-full" variant={candidate === currentTier ? 'outline' : 'default'}>
                    <Link href="/pricing">{candidate === currentTier ? 'View plans' : `Upgrade to ${candidatePlan.name}`}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Section>

      {subscription && subscription.status !== SubscriptionStatus.CANCELED && !subscription.cancelAtPeriodEnd && (
        <Section title="Cancellation" description="Canceling does not delete your account. Your paid features continue until the current period ends.">
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Cancel at period end</p>
                <p className="text-sm text-muted-foreground">Your subscription remains active until {formatDate(periodEnd)}.</p>
              </div>
              <Button variant="outline" onClick={handleCancel} disabled={canceling}>
                {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule cancellation
              </Button>
            </CardContent>
          </Card>
        </Section>
      )}
    </PageShell>
  );
}
