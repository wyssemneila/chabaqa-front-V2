'use client';

import React from 'react';
import { Users, BookOpen, Package, Calendar, Video, CreditCard, Bell, BarChart3, UserPlus, Lock, FileText, Megaphone, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type EmptyStateType = 'no-communities' | 'no-courses' | 'no-products' | 'no-events' | 'no-sessions' | 'no-payouts' | 'no-notifications' | 'no-analytics' | 'no-team-members' | 'no-permission' | 'no-posts' | 'no-challenges' | 'no-emails' | 'no-messages' | 'no-results' | 'error';

export interface EmptyStateContent {
  icon: React.ElementType;
  title: string;
  description: string;
  primaryAction?: { label: string; url: string; };
  tips?: string[];
}

export const EMPTY_STATE_CONTENT: Record<EmptyStateType, EmptyStateContent> = {
  'no-communities': { icon: Users, title: 'No communities yet', description: 'Communities are spaces where your audience connects. Create your first community to start building your audience.', primaryAction: { label: 'Create Community', url: '/creator/communities/new' }, tips: ['A community is the foundation of your creator business', 'You can have multiple communities for different audiences'] },
  'no-courses': { icon: BookOpen, title: 'No courses yet', description: 'Courses let you package your knowledge into structured learning experiences.', primaryAction: { label: 'Create Course', url: '/creator/courses/new' }, tips: ['Courses can include video, text, quizzes, and downloads', 'Set your own price or offer courses for free'] },
  'no-products': { icon: Package, title: 'No products yet', description: 'Products are digital goods your audience can purchase.', primaryAction: { label: 'Create Product', url: '/creator/products/new' }, tips: ['Popular products include templates, guides, and toolkits'] },
  'no-events': { icon: Calendar, title: 'No events yet', description: 'Events bring your community together for live experiences.', primaryAction: { label: 'Create Event', url: '/creator/events/new' }, tips: ['Events can be virtual, in-person, or hybrid'] },
  'no-sessions': { icon: Video, title: 'No sessions yet', description: 'Sessions are one-on-one or group calls with your audience.', primaryAction: { label: 'Create Session', url: '/creator/sessions/new' }, tips: ['Set your availability and let members book directly'] },
  'no-payouts': { icon: CreditCard, title: 'No payouts yet', description: 'Payouts appear here once you start earning.', primaryAction: { label: 'Set Up Payouts', url: '/creator/monetization/payouts/setup' }, tips: ['Payouts are processed weekly or on-demand'] },
  'no-notifications': { icon: Bell, title: 'All caught up!', description: 'You have no new notifications.', tips: ['Customize what notifications you receive in settings'] },
  'no-analytics': { icon: BarChart3, title: 'No data yet', description: 'Analytics will appear once your content starts getting views.', tips: ['Share your content to start gathering data'] },
  'no-team-members': { icon: UserPlus, title: 'No team members yet', description: 'Invite collaborators to help manage your community.', primaryAction: { label: 'Invite Team Member', url: '/creator/team/invite' }, tips: ['Each role has different permission levels'] },
  'no-permission': { icon: Lock, title: 'Access restricted', description: 'You dont have permission to view this content.', tips: ['Your current role may not include access to this feature'] },
  'no-posts': { icon: FileText, title: 'No posts yet', description: 'Posts are quick updates for your community.', primaryAction: { label: 'Create Post', url: '/creator/posts/new' }, tips: ['Posts appear in your community feed'] },
  'no-challenges': { icon: Megaphone, title: 'No challenges yet', description: 'Challenges motivate your audience to take action.', primaryAction: { label: 'Create Challenge', url: '/creator/challenges/new' }, tips: ['Challenges have a clear start and end date'] },
  'no-emails': { icon: Mail, title: 'No emails sent yet', description: 'Reach your audience directly through email campaigns.', primaryAction: { label: 'Create Email', url: '/creator/emails/new' }, tips: ['Track open rates and engagement'] },
  'no-messages': { icon: MessageSquare, title: 'No messages yet', description: 'Direct messages from your community will appear here.', tips: ['Respond promptly to build trust'] },
  'no-results': { icon: BarChart3, title: 'No results found', description: 'Try adjusting your search or filters.', tips: ['Check your spelling', 'Try broader search terms'] },
  'error': { icon: Lock, title: 'Something went wrong', description: 'We couldnt load this content. Please try again.', primaryAction: { label: 'Try Again', url: '#' } },
};

export interface EmptyStateEducationProps { type: EmptyStateType; customTitle?: string; customDescription?: string; showTips?: boolean; size?: 'sm' | 'md' | 'lg'; onPrimaryAction?: () => void; }

export function EmptyStateEducation({ type, customTitle, customDescription, showTips = true, size = 'md', onPrimaryAction }: EmptyStateEducationProps) {
  const content = EMPTY_STATE_CONTENT[type];
  const Icon = content.icon;
  const sizeClasses = { sm: 'py-8 px-4', md: 'py-12 px-6', lg: 'py-16 px-8' };
  const iconSizes = { sm: 'h-10 w-10', md: 'h-12 w-12', lg: 'h-16 w-16' };

  return (
    <div className={`flex flex-col items-center justify-center text-center \${sizeClasses[size]}`}>
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Icon className={`\${iconSizes[size]} text-gray-400`} />
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
