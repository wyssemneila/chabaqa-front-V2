'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, Archive, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export type DestructiveActionType = 'delete' | 'archive' | 'remove' | 'cancel' | 'suspend';

export interface DestructiveConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: DestructiveActionType;
  itemName: string;
  itemType: string;
  requireTyping?: boolean;
  typingConfirmation?: string;
  isLoading?: boolean;
  consequences?: string[];
}

const actionConfig = {
  delete: { icon: Trash2, title: 'Delete', buttonText: 'Delete', buttonVariant: 'destructive' as const, color: 'text-red-600', bgColor: 'bg-red-100' },
  archive: { icon: Archive, title: 'Archive', buttonText: 'Archive', buttonVariant: 'default' as const, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  remove: { icon: XCircle, title: 'Remove', buttonText: 'Remove', buttonVariant: 'destructive' as const, color: 'text-red-600', bgColor: 'bg-red-100' },
  cancel: { icon: XCircle, title: 'Cancel', buttonText: 'Confirm', buttonVariant: 'destructive' as const, color: 'text-red-600', bgColor: 'bg-red-100' },
  suspend: { icon: AlertTriangle, title: 'Suspend', buttonText: 'Suspend', buttonVariant: 'destructive' as const, color: 'text-amber-600', bgColor: 'bg-amber-100' },
};

export function DestructiveConfirmation({ isOpen, onClose, onConfirm, actionType, itemName, itemType, requireTyping = false, typingConfirmation, isLoading = false, consequences }: DestructiveConfirmationProps) {
  const [typedValue, setTypedValue] = useState('');
  const config = actionConfig[actionType];
  const Icon = config.icon;
  const confirmText = typingConfirmation || itemName;
  const canConfirm = !requireTyping || typedValue === confirmText;

  const handleConfirm = () => { if (canConfirm) { onConfirm(); setTypedValue(''); } };
  const handleClose = () => { setTypedValue(''); onClose(); };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${config.bgColor}`}><Icon className={`h-6 w-6 ${config.color}`} /></div>
            <div>
              <DialogTitle>{config.title} {itemType}</DialogTitle>
              <DialogDescription className="mt-1">Are you sure you want to {actionType} <span className="font-medium">{itemName}</span>?</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {consequences && consequences.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 my-2">
            <p className="text-sm font-medium text-gray-900 mb-2">This will:</p>
            <ul className="space-y-1">{consequences.map((c, i) => <li key={i} className="text-sm text-gray-600 flex items-start gap-2"><span className="text-gray-400 mt-1">•</span>{c}</li>)}</ul>
          </div>
        )}
        {requireTyping && (
          <div className="space-y-2 my-2">
            <p className="text-sm text-gray-600">To confirm, type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{confirmText}</span> below:</p>
            <Input value={typedValue} onChange={(e) => setTypedValue(e.target.value)} placeholder={`Type "${confirmText}" to confirm`} className="font-mono" />
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button variant={config.buttonVariant} onClick={handleConfirm} disabled={!canConfirm || isLoading}>{isLoading ? 'Processing...' : config.buttonText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface SuccessToastProps { title: string; description?: string; action?: { label: string; onClick: () => void; }; }

export function SuccessToastContent({ title, description, action }: SuccessToastProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <Button variant="ghost" size="sm" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}
