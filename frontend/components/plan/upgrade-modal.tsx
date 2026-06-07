'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PLANS,
  PLAN_TIERS,
  type PlanTier,
  formatLimit,
} from '@/lib/plans/plan-config';
import { usePlan } from '@/hooks/use-plan';
import { Check, Zap, Star, Rocket, Lock } from 'lucide-react';

const PLAN_ICONS: Record<PlanTier, typeof Zap> = {
  starter: Zap,
  growth: Star,
  pro: Rocket,
};

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  requiredPlan?: PlanTier;
  blockedFeature?: string;
}

export function UpgradeModal({
  open,
  onClose,
  requiredPlan = 'growth',
  blockedFeature,
}: UpgradeModalProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const { plan: currentPlan, tier: currentTier } = usePlan();

  const requiredIdx = PLAN_TIERS.indexOf(requiredPlan);
  const visibleTiers = PLAN_TIERS.filter((_, i) => i >= requiredIdx);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            {blockedFeature ? (
              <>
                <strong>{blockedFeature}</strong> is not included in your current{' '}
                <strong>{currentPlan.name}</strong> plan. Upgrade to{' '}
                <strong>{PLANS[requiredPlan].name}</strong> or higher to unlock it.
              </>
            ) : (
              <>Upgrade from {currentPlan.name} to unlock higher limits and premium creator tools.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 my-4">
          <Button
            size="sm"
            variant={billing === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </Button>
          <Button
            size="sm"
            variant={billing === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBilling('yearly')}
          >
            Yearly
            <Badge variant="secondary" className="ml-2">Save 20%</Badge>
          </Button>
        </div>

        <div className={`grid gap-4 ${visibleTiers.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {visibleTiers.map((tier) => {
            const plan = PLANS[tier];
            const Icon = PLAN_ICONS[tier];
            const price = billing === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
            const isHighlighted = tier === requiredPlan;
            const isCurrentPlan = tier === currentTier;

            return (
              <div
                key={tier}
                className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
                  isHighlighted ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  {isHighlighted && <Badge>Recommended</Badge>}
                  {isCurrentPlan && <Badge variant="secondary">Current plan</Badge>}
                </div>
                <div className="text-3xl font-bold mb-1">
                  {price} <span className="text-base font-normal text-muted-foreground">TND/mo</span>
                </div>
                {billing === 'yearly' && (
                  <p className="text-xs text-muted-foreground mb-3">Billed {plan.yearlyTotal} TND/year</p>
                )}
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{formatLimit(plan.limits.membersMax)} members</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{formatLimit(plan.limits.coursesActivationMax)} active courses</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.limits.storageGB} GB storage</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />{plan.transactionFee}% + {plan.transactionFixedFee} TND transaction fee</li>
                  {plan.features.challenges && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />Challenges</li>}
                  {plan.features.sessions && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />1:1 Sessions</li>}
                  {plan.features.events && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />Events</li>}
                  {plan.features.branding && <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" />Remove Chabaqa branding</li>}
                </ul>
                <Button
                  className="w-full"
                  variant={isHighlighted ? 'default' : 'outline'}
                  onClick={() => {
                    window.location.href = `/pricing?plan=${tier}&billing=${billing}`;
                  }}
                >
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

interface LockedFeatureCardProps {
  feature: string;
  requiredPlan?: PlanTier;
  description?: string;
}

export function LockedFeatureCard({
  feature,
  requiredPlan = 'growth',
  description,
}: LockedFeatureCardProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 p-8 text-center">
        <Lock className="h-8 w-8 text-muted-foreground mb-3" />
        <h3 className="font-semibold text-lg mb-1">{feature}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {description ?? `${feature} is available on the ${PLANS[requiredPlan].name} plan and above.`}
        </p>
        <Button variant="default" onClick={() => setShowUpgrade(true)}>
          Upgrade to {PLANS[requiredPlan].name}
        </Button>
      </div>
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        requiredPlan={requiredPlan}
        blockedFeature={feature}
      />
    </>
  );
}
