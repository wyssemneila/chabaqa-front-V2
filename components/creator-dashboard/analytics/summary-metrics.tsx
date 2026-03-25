'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SummaryMetric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  format?: 'number' | 'currency' | 'percentage';
  helpText?: string;
}

export interface SummaryMetricsBarProps {
  metrics: SummaryMetric[];
  isLoading?: boolean;
}

export function SummaryMetricsBar({ metrics, isLoading }: SummaryMetricsBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
      {metrics.map((metric) => (
        <div key={metric.id} className="relative">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm font-medium text-gray-500">{metric.label}</span>
            {metric.helpText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">{metric.helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-gray-900">
              {metric.format === 'currency' && '$'}
              {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              {metric.format === 'percentage' && '%'}
            </span>
            {metric.change !== undefined && (
              <span className={`flex items-center text-sm font-medium ${metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {metric.change > 0 && <ArrowUpRight className="h-4 w-4" />}
                {metric.change < 0 && <ArrowDownRight className="h-4 w-4" />}
                {metric.change === 0 && <Minus className="h-4 w-4" />}
                {Math.abs(metric.change)}%
              </span>
            )}
          </div>
          {metric.changeLabel && <p className="text-xs text-gray-400 mt-1">{metric.changeLabel}</p>}
        </div>
      ))}
    </div>
  );
}

export interface QuickStatProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function QuickStat({ label, value, icon }: QuickStatProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-500 flex items-center gap-2">{icon}{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
