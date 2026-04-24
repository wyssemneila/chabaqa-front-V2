'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslations } from 'next-intl';

interface RevenueItem {
  contentType: string;
  total?: number;
  revenue?: number;
  currency?: string;
}

interface RevenueByContentChartProps {
  items: RevenueItem[];
  totalRevenue: number;
  currency?: string;
}

const TYPE_COLORS: Record<string, string> = {
  course: '#47c7ea',
  challenge: '#ff9b28',
  session: '#f65887',
  event: '#9333ea',
  product: '#8e78fb',
};

export function RevenueByContentChart({ items, totalRevenue, currency = 'TND' }: RevenueByContentChartProps) {
  const t = useTranslations('analytics');

  if (!items?.length) {
    return <p className="text-sm text-[var(--t3)]">{t('revenue.noData')}</p>;
  }

  return (
    <div className="flex items-center gap-6">
      <div className="w-40 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={items} dataKey="revenue" nameKey="contentType" innerRadius={40} outerRadius={70} paddingAngle={2}>
              {items.map((item, i) => (
                <Cell key={i} fill={TYPE_COLORS[item.contentType] ?? '#8e78fb'} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ${currency}`, '']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-lg font-bold text-[var(--t1)]">
          {totalRevenue.toLocaleString()} {currency}
        </p>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[item.contentType] ?? '#8e78fb' }} />
            <span className="text-[var(--t2)] capitalize">{item.contentType}</span>
            <span className="ms-auto font-medium text-[var(--t1)]">{(item.revenue ?? item.total ?? 0).toLocaleString()} {currency}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
