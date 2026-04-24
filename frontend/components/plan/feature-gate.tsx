'use client';

import { usePlan } from '@/hooks/use-plan';
import type { PlanFeatures } from '@/lib/plans/plan-config';

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

  return fallback ? <>{fallback}</> : null;
}
