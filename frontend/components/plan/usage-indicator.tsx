'use client';

import { usePlan } from '@/hooks/use-plan';
import { Progress } from '@/components/ui/progress';
import type { PlanLimits } from '@/lib/plans/plan-config';
import { formatLimit } from '@/lib/plans/plan-config';

interface UsageIndicatorProps {
  label: string;
  current: number;
  limitKey: keyof PlanLimits;
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
