'use client';

import { useState } from 'react';
import { usePlan } from '@/hooks/use-plan';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { PlanLimits } from '@/lib/plans/plan-config';
import { LIMIT_LABELS, PLANS, formatLimit, minimumPlanForLimit } from '@/lib/plans/plan-config';
import { UpgradeModal } from './upgrade-modal';

interface UsageIndicatorProps {
  label: string;
  current: number;
  limitKey: keyof PlanLimits;
  suffix?: string;
}

export function UsageIndicator({ label, current, limitKey, suffix = '' }: UsageIndicatorProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { limitValue, enforcementEnabled, plan } = usePlan();

  if (!enforcementEnabled) return null;

  const max = limitValue(limitKey) as number;
  const isUnlimited = max >= 999999;
  const percent = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
  const isNearLimit = percent >= 80;
  const isAtLimit = percent >= 100;
  const recommendedPlan = !isUnlimited && (isNearLimit || isAtLimit)
    ? minimumPlanForLimit(limitKey, max)
    : null;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isAtLimit ? 'text-destructive font-medium' : isNearLimit ? 'text-amber-600 font-medium' : 'text-foreground'}>
          {isUnlimited
            ? `${current.toLocaleString()}${suffix} / Unlimited`
            : `${current.toLocaleString()}${suffix} / ${formatLimit(max)}${suffix}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress
          value={percent}
          className={isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-amber-500' : ''}
        />
      )}
      {recommendedPlan && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>
            {isAtLimit ? 'Limit reached' : 'Almost at your limit'} for {LIMIT_LABELS[limitKey] ?? label}.{' '}
            Upgrade from {plan.name} to {PLANS[recommendedPlan].name} for a higher allowance.
          </span>
          <Button size="sm" variant="outline" className="h-7 shrink-0 bg-white" onClick={() => setShowUpgrade(true)}>
            Upgrade
          </Button>
        </div>
      )}
      {recommendedPlan && (
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          requiredPlan={recommendedPlan}
          blockedFeature={`${label} limit`}
        />
      )}
    </div>
  );
}

interface UsageSummaryProps {
  memberCount: number;
  storageUsedGB: number;
  adminCount: number;
  activeCourseCount: number;
  emailsSentThisMonth?: number;
  sessionBookingsThisMonth?: number;
}

export function UsageSummary({
  memberCount,
  storageUsedGB,
  adminCount,
  activeCourseCount,
  emailsSentThisMonth = 0,
  sessionBookingsThisMonth = 0,
}: UsageSummaryProps) {
  const { enforcementEnabled, plan } = usePlan();
  if (!enforcementEnabled) return null;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
        Plan Usage — {plan.name}
      </h4>
      <UsageIndicator label="Members" current={memberCount} limitKey="membersMax" />
      <UsageIndicator label="Storage" current={storageUsedGB} limitKey="storageGB" suffix=" GB" />
      <UsageIndicator label="Admin seats" current={adminCount} limitKey="adminsMax" />
      <UsageIndicator label="Active courses" current={activeCourseCount} limitKey="coursesActivationMax" />
      {plan.limits.emailCampaignRecipientsPerMonth > 0 && (
        <UsageIndicator label="Email recipients" current={emailsSentThisMonth} limitKey="emailCampaignRecipientsPerMonth" suffix=" emails" />
      )}
      {plan.limits.sessionBookingsPerMonth > 0 && (
        <UsageIndicator label="Session bookings" current={sessionBookingsThisMonth} limitKey="sessionBookingsPerMonth" />
      )}
    </div>
  );
}
