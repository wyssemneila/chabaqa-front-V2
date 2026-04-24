'use client';

import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';

interface AnalyticsPlanGateProps {
  requiredPlan: string;
  currentPlan: string;
  children: ReactNode;
}

const PLAN_ORDER = ['starter', 'growth', 'pro', 'enterprise'];

export function AnalyticsPlanGate({ requiredPlan, currentPlan, children }: AnalyticsPlanGateProps) {
  const t = useTranslations('analytics');
  const currentIdx = PLAN_ORDER.indexOf(currentPlan?.toLowerCase() ?? 'starter');
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan?.toLowerCase() ?? 'starter');

  if (currentIdx >= requiredIdx) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-xl z-10">
        <Lock className="w-8 h-8 text-[var(--t3)] mb-3" />
        <p className="text-sm font-medium text-[var(--t1)]">
          {t('planGate.title')}
        </p>
        <p className="text-xs text-[var(--t3)] mt-1">
          {t('planGate.upgrade', { plan: requiredPlan })}
        </p>
      </div>
    </div>
  );
}
