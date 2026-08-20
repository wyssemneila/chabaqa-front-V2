'use client';

import React from 'react';
import { Check, Circle, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
}

export function SetupChecklist({
  items,
  title = 'Complete your setup',
  subtitle = 'Get your workspace ready to start creating',
  onItemAction,
  onSkip,
  showProgress = true,
}: SetupChecklistProps) {
  const completedCount = items.filter(i => i.status === 'completed').length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          {showProgress && (
            <div className="text-end">
              <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
              <p className="text-xs text-gray-500">{completedCount} of {items.length} complete</p>
            </div>
          )}
        </div>
        
        {showProgress && (
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `\${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="mt-0.5">
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
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-medium \${item.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
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
                      <ChevronRight className="h-4 w-4 ms-1" />
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
    actionUrl: '/creator/communities/new',
    isRequired: true,
    estimatedMinutes: 5,
  },
  {
    id: 'complete-profile',
    title: 'Complete your creator profile',
    description: 'Add your bio, photo, and social links',
    status: 'not-started',
    actionLabel: 'Edit Profile',
    actionUrl: '/creator/settings/profile',
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
