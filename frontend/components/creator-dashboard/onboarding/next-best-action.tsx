'use client';

import React from 'react';
import { ArrowRight, Lightbulb, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type ActionPriority = 'urgent' | 'recommended' | 'suggested';
export type ActionCategory = 'growth' | 'engagement' | 'revenue' | 'setup' | 'maintenance';

export interface NextAction {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  category: ActionCategory;
  actionLabel: string;
  actionUrl: string;
  metric?: string;
  metricLabel?: string;
  dismissable?: boolean;
}

export interface NextBestActionProps {
  action: NextAction;
  onDismiss?: (id: string) => void;
  variant?: 'card' | 'banner' | 'inline';
}

const priorityStyles = {
  urgent: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
  recommended: {
    bg: 'bg-primary/5 border-primary/20',
    icon: 'text-primary',
    badge: 'bg-primary/10 text-primary',
  },
  suggested: {
    bg: 'bg-gray-50 border-gray-200',
    icon: 'text-gray-600',
    badge: 'bg-gray-100 text-gray-600',
  },
};

const categoryIcons = {
  growth: TrendingUp,
  engagement: Lightbulb,
  revenue: TrendingUp,
  setup: Clock,
  maintenance: AlertCircle,
};

export function NextBestAction({ action, onDismiss, variant = 'card' }: NextBestActionProps) {
  const styles = priorityStyles[action.priority];
  const CategoryIcon = categoryIcons[action.category];

  if (variant === 'banner') {
    return (
      <div className={`rounded-lg border p-4 ${styles.bg} flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full bg-white ${styles.icon}`}>
            <CategoryIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{action.title}</p>
            <p className="text-xs text-gray-500">{action.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action.dismissable && onDismiss && (
            <Button variant="ghost" size="sm" onClick={() => onDismiss(action.id)}>
              Dismiss
            </Button>
          )}
          <Link href={action.actionUrl}>
            <Button size="sm">
              {action.actionLabel}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 py-2">
        <Lightbulb className={`h-4 w-4 ${styles.icon}`} />
        <span className="text-sm text-gray-600">{action.title}</span>
        <Link href={action.actionUrl} className="text-sm font-medium text-primary hover:underline">
          {action.actionLabel} →
        </Link>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${styles.bg} overflow-hidden`}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-white shadow-sm ${styles.icon}`}>
              <CategoryIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge} capitalize`}>
                  {action.priority}
                </span>
                <span className="text-xs text-gray-400 capitalize">{action.category}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900">{action.title}</h3>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-3 ml-[52px]">{action.description}</p>
      </div>
      <div className="px-5 py-3 bg-white/50 border-t border-gray-100">
        <Link href={action.actionUrl} className="w-full">
          <Button className="w-full" variant={action.priority === 'urgent' ? 'default' : 'outline'}>
            {action.actionLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function getSmartSuggestions(context: {
  hasNoCommunity?: boolean;
  hasNoContent?: boolean;
  pendingPayout?: number;
  newMembers?: number;
}): NextAction[] {
  const suggestions: NextAction[] = [];
  if (context.hasNoCommunity) {
    suggestions.push({
      id: 'create-community',
      title: 'Create your first community',
      description: 'Start building your audience by creating a community space.',
      priority: 'urgent',
      category: 'setup',
      actionLabel: 'Create Community',
      actionUrl: '/creator/communities/create',
    });
  }
  if (context.pendingPayout && context.pendingPayout > 0) {
    suggestions.push({
      id: 'request-payout',
      title: 'Payout available',
      description: 'You have earnings ready to withdraw.',
      priority: 'recommended',
      category: 'revenue',
      actionLabel: 'Request Payout',
      actionUrl: '/creator/monetization/payouts',
      metric: `$${(context.pendingPayout / 100).toFixed(2)}`,
      metricLabel: 'available',
    });
  }
  return suggestions;
}
