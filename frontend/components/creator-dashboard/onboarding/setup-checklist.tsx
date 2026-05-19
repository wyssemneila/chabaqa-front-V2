'use client';

import React from 'react';
import { Check, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { launchIcons } from '@/components/icons/launch-icons';

export type ChecklistItemStatus = 'completed' | 'in-progress' | 'not-started' | 'skipped';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: ChecklistItemStatus;
  actionLabel?: string;
  actionUrl?: string;
  isRequired?: boolean;
  estimatedMinutes?: number;
}

export interface SetupChecklistProps {
  items: ChecklistItem[];
  title?: string;
  subtitle?: string;
  onItemAction?: (id: string) => void;
  onSkip?: (id: string) => void;
  showProgress?: boolean;
  collapseCompletedAfterPercent?: number;
  compact?: boolean;
}

export function SetupChecklist({
  items,
  title = 'Complete your setup',
  subtitle = 'Get your workspace ready to start creating',
  onItemAction,
  onSkip,
  showProgress = true,
  collapseCompletedAfterPercent,
  compact = false,
}: SetupChecklistProps) {
  const completedCount = items.filter(i => i.status === 'completed').length;
  const progressPercent = Math.round((completedCount / items.length) * 100);
  const [showCompleted, setShowCompleted] = React.useState(false);
  const shouldCollapseCompleted =
    typeof collapseCompletedAfterPercent === 'number' &&
    progressPercent >= collapseCompletedAfterPercent &&
    completedCount > 0 &&
    completedCount < items.length;
  const visibleItems = shouldCollapseCompleted && !showCompleted
    ? items.filter((item) => item.status !== 'completed')
    : items;
  const HeaderIcon = launchIcons.checklist;
  const getItemIcon = (id: string) => {
    if (id.includes('logo')) return launchIcons.branding;
    if (id.includes('cover')) return launchIcons.cover;
    if (id.includes('pricing')) return launchIcons.pricing;
    if (id.includes('post')) return launchIcons.post;
    if (id.includes('offer')) return launchIcons.launch;
    if (id.includes('payout')) return launchIcons.payout;
    return launchIcons.checklist;
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className={`${compact ? 'p-4' : 'p-6'} border-b bg-gradient-to-r from-primary/5 to-transparent`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 flex items-center gap-2`}>
              <HeaderIcon className="h-5 w-5 text-primary" />
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          {showProgress && (
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
              <p className="text-xs text-gray-500">{completedCount} of {items.length} complete</p>
            </div>
          )}
        </div>
        
        {showProgress && (
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {shouldCollapseCompleted && (
        <div className="border-b bg-gray-50 px-4 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCompleted((value) => !value)}
            className="h-8 px-2 text-xs text-gray-600"
          >
            <ChevronDown className={`mr-1 h-3.5 w-3.5 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
            {showCompleted ? 'Hide completed items' : `Show ${completedCount} completed item${completedCount === 1 ? '' : 's'}`}
          </Button>
        </div>
      )}

      <ul className="divide-y">
        {visibleItems.map((item) => (
          <li key={item.id} className={`${compact ? 'p-3' : 'p-4'} hover:bg-gray-50 transition-colors`}>
            <div className={`flex items-start ${compact ? 'gap-3' : 'gap-4'}`}>
              <div className="mt-0.5 flex items-center gap-2">
                {item.status === 'completed' ? (
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                ) : item.status === 'in-progress' ? (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Circle className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                )}
                {(() => {
                  const ItemIcon = getItemIcon(item.id);
                  return <ItemIcon className="hidden h-4 w-4 text-gray-400 sm:block" />;
                })()}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-medium ${item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.title}
                  </h3>
                  {item.isRequired && item.status !== 'completed' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Required</span>
                  )}
                  {item.estimatedMinutes && item.status !== 'completed' && (
                    <span className="text-xs text-gray-400">{item.estimatedMinutes} min</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
              </div>
              
              {item.status !== 'completed' && item.actionUrl && (
                <div className="flex items-center gap-2">
                  {!item.isRequired && onSkip && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSkip(item.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Skip
                    </Button>
                  )}
                  <Link href={item.actionUrl}>
                    <Button size="sm" variant={item.status === 'in-progress' ? 'default' : 'outline'}>
                      {item.actionLabel || 'Start'}
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const DEFAULT_CREATOR_CHECKLIST: ChecklistItem[] = [
  {
    id: 'create-community',
    title: 'Create your first community',
    description: 'Set up a space where your audience can connect',
    status: 'not-started',
    actionLabel: 'Create Community',
    actionUrl: '/creator/communities/create',
    isRequired: true,
    estimatedMinutes: 5,
  },
  {
    id: 'complete-profile',
    title: 'Complete your creator profile',
    description: 'Add your bio, photo, and social links',
    status: 'not-started',
    actionLabel: 'Edit Profile',
    actionUrl: '/profile',
    isRequired: true,
    estimatedMinutes: 3,
  },
  {
    id: 'add-payout-method',
    title: 'Set up payouts',
    description: 'Connect your bank account to receive earnings',
    status: 'not-started',
    actionLabel: 'Add Payout Method',
    actionUrl: '/creator/monetization/payouts',
    isRequired: false,
    estimatedMinutes: 5,
  },
];
