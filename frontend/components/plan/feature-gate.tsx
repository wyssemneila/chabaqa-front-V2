'use client';

import { usePlan } from '@/hooks/use-plan';
import {
  FEATURE_LABELS,
  minimumPlanForFeature,
  type PlanFeatures,
} from '@/lib/plans/plan-config';
import { LockedFeatureCard } from './upgrade-modal';

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function FeatureGate({ feature, fallback, children }: FeatureGateProps) {
  const { canUseFeature, enforcementEnabled, isLoading } = usePlan();

  if (!enforcementEnabled) return <>{children}</>;
  if (isLoading) return null;
  if (canUseFeature(feature)) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  const requiredPlan = minimumPlanForFeature(feature);
  const label = FEATURE_LABELS[feature] ?? String(feature);

  return (
    <LockedFeatureCard
      feature={label}
      requiredPlan={requiredPlan}
      description={`${label} is not included in your current plan. Upgrade to ${requiredPlan === 'growth' ? 'Growth' : 'Pro'} to unlock it.`}
    />
  );
}
