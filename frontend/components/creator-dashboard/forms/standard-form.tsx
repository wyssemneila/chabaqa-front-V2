import React from 'react';
import { Button } from '@/components/ui/button';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="mb-10 flex flex-col items-start gap-6 border-b pb-10 md:flex-row">
      <div className="w-full shrink-0 space-y-2 md:w-1/3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="w-full space-y-6 md:w-2/3">{children}</div>
    </section>
  );
}

export interface FormActionsProps {
  onCancel?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  saveText?: string;
  cancelText?: string;
}

export function FormActions({ onCancel, onSave, isSaving = false, saveText = 'Save changes', cancelText = 'Cancel' }: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-4 py-4 mt-6 border-t bg-gray-50 px-6 -mx-6 rounded-b-lg">
      <Button variant="outline" onClick={onCancel} disabled={isSaving}>{cancelText}</Button>
      <Button onClick={onSave} disabled={isSaving}>{isSaving ? 'Saving...' : saveText}</Button>
    </div>
  );
}

export function FormCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-lg border shadow-sm"><div className="p-6">{children}</div></div>;
}
