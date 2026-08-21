'use client';

import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '@/lib/api/subscription.api';
import {
  PLANS,
  PLAN_ENFORCEMENT_MODE,
  type Plan,
  type PlanTier,
  type PlanFeatures,
  type PlanLimits,
} from '@/lib/plans/plan-config';

export function usePlan() {
  const {
    data: subscription,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      try {
        const res = await subscriptionApi.getMySubscription();
        return res.data ?? null;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    retry: 1,
    enabled: PLAN_ENFORCEMENT_MODE,
  });

  if (!PLAN_ENFORCEMENT_MODE) {
    return {
      plan: PLANS.pro as Plan,
      tier: 'pro' as PlanTier,
      isLoading: false,
      subscription: null,
      enforcementEnabled: false,
      canUseFeature: (_feature: keyof PlanFeatures) => true,
      isAtLimit: (_limit: keyof PlanLimits, _currentValue: number) => false,
      limitValue: (limit: keyof PlanLimits) => PLANS.pro.limits[limit],
      refetch,
    };
  }

  const tier: PlanTier = (subscription?.plan as PlanTier) ?? 'starter';
  const plan: Plan = PLANS[tier] ?? PLANS.starter;

  return {
    plan,
    tier,
    isLoading,
    subscription,
    enforcementEnabled: true,
    canUseFeature: (feature: keyof PlanFeatures): boolean => Boolean(plan.features[feature]),
    isAtLimit: (limit: keyof PlanLimits, currentValue: number): boolean => currentValue >= (plan.limits[limit] as number),
    limitValue: (limit: keyof PlanLimits): number => plan.limits[limit] as number,
    refetch,
  };
}

export function isPlanEnforcementEnabled(): boolean {
  return PLAN_ENFORCEMENT_MODE;
}
