'use client';

import React, { useState } from 'react';
import { X, Lightbulb, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type NudgeType = 'tip' | 'education' | 'promotion' | 'warning';

export interface ContextualNudgeProps {
  id: string;
  type: NudgeType;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  onDismiss?: (id: string) => void;
  dismissable?: boolean;
  variant?: 'tooltip' | 'inline' | 'popover' | 'banner';
}

const typeStyles = {
  tip: { bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-600', iconBg: 'bg-blue-100' },
  education: { bg: 'bg-purple-50 border-purple-200', icon: 'text-purple-600', iconBg: 'bg-purple-100' },
  promotion: { bg: 'bg-green-50 border-green-200', icon: 'text-green-600', iconBg: 'bg-green-100' },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-600', iconBg: 'bg-amber-100' },
};

export function ContextualNudge({ id, type, title, message, actionLabel, actionUrl, onDismiss, dismissable = true, variant = 'inline' }: ContextualNudgeProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const styles = typeStyles[type];
  if (isDismissed) return null;

  const handleDismiss = () => { setIsDismissed(true); onDismiss?.(id); };

  if (variant === 'banner') {
    return (
      <div className={`rounded-lg border ${styles.bg} p-4`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${styles.iconBg}`}><Lightbulb className={`h-5 w-5 ${styles.icon}`} /></div>
            <div><p className="text-sm font-medium text-gray-900">{title}</p><p className="text-sm text-gray-600">{message}</p></div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actionUrl && <Link href={actionUrl}><Button size="sm">{actionLabel}<ArrowRight className="h-4 w-4 ms-1" /></Button></Link>}
            {dismissable && <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 p-1"><X className="h-5 w-5" /></button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${styles.bg} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-full ${styles.iconBg} shrink-0`}><Info className={`h-4 w-4 ${styles.icon}`} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-sm text-gray-600 mt-1">{message}</p>
          {actionUrl && <Link href={actionUrl} className="text-sm font-medium text-primary hover:underline mt-2 inline-flex items-center gap-1">{actionLabel}<ArrowRight className="h-3 w-3" /></Link>}
        </div>
        {dismissable && <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 shrink-0"><X className="h-4 w-4" /></button>}
      </div>
    </div>
  );
}

export type WorkspaceHealth = 'healthy' | 'incomplete' | 'blocked' | 'needs-attention';

export interface WorkspaceHealthIndicatorProps { health: WorkspaceHealth; message: string; actionUrl?: string; actionLabel?: string; }

const healthStyles = {
  healthy: 'bg-green-100 text-green-800 border-green-200',
  incomplete: 'bg-amber-100 text-amber-800 border-amber-200',
  blocked: 'bg-red-100 text-red-800 border-red-200',
  'needs-attention': 'bg-blue-100 text-blue-800 border-blue-200',
};

export function WorkspaceHealthIndicator({ health, message, actionUrl, actionLabel }: WorkspaceHealthIndicatorProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${healthStyles[health]}`}>
      <span className={`w-2 h-2 rounded-full ${health === 'healthy' ? 'bg-green-500' : health === 'incomplete' ? 'bg-amber-500' : health === 'blocked' ? 'bg-red-500' : 'bg-blue-500'}`} />
      <span>{message}</span>
      {actionUrl && <Link href={actionUrl} className="underline hover:no-underline">{actionLabel || 'Fix'}</Link>}
    </div>
  );
}
