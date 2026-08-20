import React from 'react';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  description?: string;
  isLoading?: boolean;
}

export function MetricCard({ title, value, trend, trendLabel, description, isLoading }: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm animate-pulse">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
        <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-40 bg-gray-100 rounded"></div>
      </div>
    );
  }

  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  const isNeutral = trend === 0;

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm flex flex-col">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-gray-900">{value}</span>
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center text-sm">
          <div className={`flex items-center font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
            {isPositive && <ArrowUpIcon className="me-1 h-4 w-4" />}
            {isNegative && <ArrowDownIcon className="me-1 h-4 w-4" />}
            {isNeutral && <MinusIcon className="me-1 h-4 w-4" />}
            {Math.abs(trend)}%
          </div>
          {trendLabel && <span className="ms-2 text-gray-500">{trendLabel}</span>}
        </div>
      )}
      {description && !trend && <p className="mt-4 text-sm text-gray-500">{description}</p>}
    </div>
  );
}
