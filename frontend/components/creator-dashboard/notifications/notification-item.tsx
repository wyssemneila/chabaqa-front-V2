'use client';

import React from 'react';
import { Bell, FileText, Users, DollarSign, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export type NotificationPriority = 'high' | 'normal' | 'low';
export type NotificationType = 'system' | 'monetization' | 'community' | 'content';

export interface NotificationItemProps {
  id: string;
  title: string;
  description: string;
  timeAgo: string;
  isUnread: boolean;
  priority: NotificationPriority;
  type: NotificationType;
  actionUrl?: string;
  actionLabel?: string;
  onMarkRead?: (id: string) => void;
}

const TypeIcons = { system: Bell, content: FileText, community: Users, monetization: DollarSign };

export function NotificationItem({ id, title, description, timeAgo, isUnread, priority, type, actionUrl, actionLabel, onMarkRead }: NotificationItemProps) {
  const Icon = TypeIcons[type] || Bell;
  
  return (
    <div className={`p-4 border-b last:border-0 hover:bg-gray-50 transition-colors ${isUnread ? 'bg-blue-50/30' : 'bg-white'}`}>
      <div className="flex gap-4">
        <div className="shrink-0 mt-1">
          <div className={`p-2 rounded-full ${priority === 'high' ? 'bg-red-100 text-red-600' : type === 'monetization' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className={`text-sm tracking-tight ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{title}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
            </div>
            {isUnread && <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-1.5" aria-label="Unread" />}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{timeAgo}</span>
            {actionUrl && (
              <Link href={actionUrl} className="text-xs font-medium text-primary hover:text-primary-focus flex items-center gap-1" onClick={() => isUnread && onMarkRead?.(id)}>
                {actionLabel || 'View details'}<ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
