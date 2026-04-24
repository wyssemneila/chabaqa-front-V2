'use client';

import React, { useEffect, useRef, useCallback } from 'react';

// Focus Trap Hook
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) { e.preventDefault(); lastElement?.focus(); }
      } else {
        if (document.activeElement === lastElement) { e.preventDefault(); firstElement?.focus(); }
      }
    };
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

// Keyboard Navigation Hook
export function useKeyboardNavigation<T extends HTMLElement>(
  items: React.RefObject<T | null>[],
  options?: { orientation?: 'horizontal' | 'vertical' | 'both'; loop?: boolean; onSelect?: (index: number) => void; }
) {
  const { orientation = 'vertical', loop = true, onSelect } = options || {};

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    const isVertical = orientation === 'vertical' || orientation === 'both';
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown': if (isVertical) { e.preventDefault(); nextIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1); } break;
      case 'ArrowUp': if (isVertical) { e.preventDefault(); nextIndex = loop ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0); } break;
      case 'ArrowRight': if (isHorizontal) { e.preventDefault(); nextIndex = loop ? (currentIndex + 1) % items.length : Math.min(currentIndex + 1, items.length - 1); } break;
      case 'ArrowLeft': if (isHorizontal) { e.preventDefault(); nextIndex = loop ? (currentIndex - 1 + items.length) % items.length : Math.max(currentIndex - 1, 0); } break;
      case 'Home': e.preventDefault(); nextIndex = 0; break;
      case 'End': e.preventDefault(); nextIndex = items.length - 1; break;
      case 'Enter': case ' ': e.preventDefault(); onSelect?.(currentIndex); return;
      default: return;
    }
    items[nextIndex]?.current?.focus();
  }, [items, orientation, loop, onSelect]);

  return handleKeyDown;
}

// Skip Link Component
export function SkipLink({ href = '#main-content', children = 'Skip to main content' }: { href?: string; children?: React.ReactNode; }) {
  return <a href={href} className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none">{children}</a>;
}

// Live Announcer Hook
export function useLiveAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    let region = document.getElementById('live-region');
    if (!region) {
      region = document.createElement('div');
      region.id = 'live-region';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      document.body.appendChild(region);
    }
    region.setAttribute('aria-live', priority);
    region.textContent = message;
    setTimeout(() => { region!.textContent = ''; }, 1000);
  }, []);
  return announce;
}

// Focus Visible Hook
export function useFocusVisible() {
  const [focusVisible, setFocusVisible] = React.useState(false);
  const onFocus = useCallback((e: React.FocusEvent) => { if (e.target.matches(':focus-visible')) setFocusVisible(true); }, []);
  const onBlur = useCallback(() => { setFocusVisible(false); }, []);
  return { focusVisible, onFocus, onBlur };
}

// Accessible Field Wrapper
export interface AccessibleFieldProps { id: string; label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode; }

export function AccessibleField({ id, label, error, hint, required, children }: AccessibleFieldProps) {
  const hintId = hint ? id + '-hint' : undefined;
  const errorId = error ? id + '-error' : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}{required && <span className="sr-only">(required)</span>}
      </label>
      {hint && !error && <p id={hintId} className="text-sm text-gray-500">{hint}</p>}
      {React.cloneElement(children as React.ReactElement<any>, { id, 'aria-describedby': errorId || hintId, 'aria-invalid': !!error })}
      {error && <p id={errorId} className="text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

// Accessible Table Wrapper
export interface AccessibleTableProps { caption: string; captionHidden?: boolean; children: React.ReactNode; }

export function AccessibleTable({ caption, captionHidden = false, children }: AccessibleTableProps) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={caption}>
      <table className="min-w-full divide-y divide-gray-200">
        <caption className={captionHidden ? 'sr-only' : 'text-lg font-semibold text-gray-900 text-left mb-4'}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}

// Accessibility Requirements Reference
export const ACCESSIBILITY_REQUIREMENTS = {
  keyboard: { description: 'All interactive elements must be reachable via Tab. Focus order must follow visual order.' },
  contrast: { description: 'Normal text: 4.5:1 ratio minimum. Large text: 3:1 ratio minimum.' },
  errors: { description: 'Errors must be associated with fields via aria-describedby.' },
  forms: { description: 'All inputs must have associated labels. Placeholder text is not a substitute for labels.' },
  tables: { description: 'Use proper table markup (th, scope). Provide caption or aria-label.' },
  notifications: { description: 'Use aria-live regions for dynamic content. Important alerts use role="alert".' },
  dialogs: { description: 'Use role="dialog". Focus should move to dialog on open and return to trigger on close.' },
};
