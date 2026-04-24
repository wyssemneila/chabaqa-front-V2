'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: string;
  label: string;
  description?: string;
  isCompleted?: boolean;
  isActive?: boolean;
  hasError?: boolean;
}

export interface StepIndicatorProps {
  steps: Step[];
  onStepClick?: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export function StepIndicator({ steps, onStepClick, orientation = 'horizontal' }: StepIndicatorProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className={`flex ${orientation === 'vertical' ? 'flex-col gap-6' : 'items-center gap-4'}`}>
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={`relative block ${orientation === 'horizontal' ? 'flex-1' : ''}`}>
            <div 
              className={`group flex items-center ${onStepClick ? 'cursor-pointer' : ''} ${orientation === 'vertical' ? 'items-start' : 'flex-col gap-2'}`}
              onClick={() => onStepClick?.(step.id)}
            >
              <div className="flex items-center">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 
                  ${step.isActive ? 'border-primary text-primary bg-primary/10' :
                    step.isCompleted ? 'border-primary bg-primary text-white' :
                    step.hasError ? 'border-red-500 text-red-500' :
                    'border-gray-300 text-gray-500'
                  }`}
                >
                  {step.isCompleted ? <Check className="h-5 w-5" /> : <span className="text-sm font-medium">{stepIdx + 1}</span>}
                </span>
              </div>
              <div className={`flex flex-col ${orientation === 'vertical' ? 'ml-4 mt-1' : 'items-center text-center'}`}>
                <span className={`text-sm font-medium ${step.isActive || step.isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.label}
                </span>
                {step.description && orientation === 'vertical' && <span className="text-sm text-gray-500">{step.description}</span>}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
