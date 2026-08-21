'use client';

import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  showOverlay?: boolean;
}

const widthClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl' };

export function DetailPanel({ isOpen, onClose, title, subtitle, children, footer, width = 'md', showOverlay = true }: DetailPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {showOverlay && <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />}
      <div className={`fixed inset-y-0 right-0 z-50 ${widthClasses[width]} w-full bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out`}>
        <div className="flex items-start justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && <div className="border-t p-4 bg-gray-50">{footer}</div>}
      </div>
    </>
  );
}

export interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  action?: { label: string; onClick: () => void; };
  href?: string;
}

export function DetailRow({ label, value, action, href }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 flex items-center gap-2">
        {href ? (
          <Link href={href} className="text-primary hover:underline flex items-center gap-1">{value}<ExternalLink className="h-3 w-3" /></Link>
        ) : value}
        {action && <Button variant="ghost" size="sm" onClick={action.onClick}>{action.label}</Button>}
      </dd>
    </div>
  );
}

export function DetailSection({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode; }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{title}</h3>
        {action}
      </div>
      <dl>{children}</dl>
    </div>
  );
}
