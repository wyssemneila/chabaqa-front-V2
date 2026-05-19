'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  CREATOR_EMPTY_STATE_DEFINITIONS,
  type CreatorEmptyStateModule,
} from '@/lib/creator-dashboard/empty-state-definitions';

export type EmptyStateType = 'no-communities' | 'no-courses' | 'no-products' | 'no-events' | 'no-sessions' | 'no-payouts' | 'no-notifications' | 'no-analytics' | 'no-team-members' | 'no-permission' | 'no-posts' | 'no-challenges' | 'no-emails' | 'no-messages' | 'no-results' | 'error';

export interface EmptyStateContent {
  icon: React.ElementType;
  title: string;
  description: string;
  primaryAction?: { label: string; url: string; };
  tips?: string[];
}

const EMPTY_STATE_TYPE_TO_MODULE = {
  'no-communities': 'communities',
  'no-courses': 'courses',
  'no-products': 'products',
  'no-events': 'events',
  'no-sessions': 'sessions',
  'no-payouts': 'payouts',
  'no-notifications': 'notifications',
  'no-analytics': 'analytics',
  'no-team-members': 'team',
  'no-permission': 'noPermission',
  'no-posts': 'posts',
  'no-challenges': 'challenges',
  'no-emails': 'emails',
  'no-messages': 'messages',
  'no-results': 'noResults',
  error: 'error',
} satisfies Record<EmptyStateType, CreatorEmptyStateModule>;

function toEducationContent(type: EmptyStateType): EmptyStateContent {
  const definition = CREATOR_EMPTY_STATE_DEFINITIONS[EMPTY_STATE_TYPE_TO_MODULE[type]];
  return {
    icon: definition.icon,
    title: definition.title,
    description: definition.description,
    primaryAction: definition.action ? { label: definition.action.label, url: definition.action.href } : undefined,
    tips: definition.tips,
  };
}

export const EMPTY_STATE_CONTENT = Object.fromEntries(
  Object.keys(EMPTY_STATE_TYPE_TO_MODULE).map((type) => [type, toEducationContent(type as EmptyStateType)]),
) as Record<EmptyStateType, EmptyStateContent>;

export interface EmptyStateEducationProps { type: EmptyStateType; customTitle?: string; customDescription?: string; showTips?: boolean; size?: 'sm' | 'md' | 'lg'; onPrimaryAction?: () => void; }

export function EmptyStateEducation({ type, customTitle, customDescription, showTips = true, size = 'md', onPrimaryAction }: EmptyStateEducationProps) {
  const content = EMPTY_STATE_CONTENT[type];
  const Icon = content.icon;
  const sizeClasses = { sm: 'py-8 px-4', md: 'py-12 px-6', lg: 'py-16 px-8' };
  const iconSizes = { sm: 'h-10 w-10', md: 'h-12 w-12', lg: 'h-16 w-16' };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Icon className={`${iconSizes[size]} text-gray-400`} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{customTitle || content.title}</h3>
      <p className="text-gray-500 max-w-md mb-6">{customDescription || content.description}</p>
      {content.primaryAction && (
        <div className="flex items-center gap-3 mb-6">
          <Link href={content.primaryAction.url}><Button onClick={onPrimaryAction}>{content.primaryAction.label}</Button></Link>
        </div>
      )}
      {showTips && content.tips && content.tips.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 max-w-md text-left">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tips</p>
          <ul className="space-y-1.5">
            {content.tips.map((tip, index) => (<li key={index} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-primary mt-1">•</span>{tip}</li>))}
          </ul>
        </div>
      )}
    </div>
  );
}
