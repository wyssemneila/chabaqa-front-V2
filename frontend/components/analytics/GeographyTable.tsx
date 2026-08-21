'use client';

import { useTranslations } from 'next-intl';

interface GeoRow {
  name?: string;
  country?: string;
  code?: string;
  views: number;
  share?: number;
  percentage?: number;
}

interface GeographyTableProps {
  rows: GeoRow[];
}

export function GeographyTable({ rows }: GeographyTableProps) {
  const t = useTranslations('analytics');

  if (!rows?.length) {
    return <p className="text-sm text-[var(--t3)]">{t('geography.noData')}</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-24 text-sm font-medium text-[var(--t1)] truncate">{row.name ?? row.country ?? row.code ?? "Unknown"}</span>
          <div className="flex-1 h-2 bg-[var(--bd)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--p)] rounded-full transition-all duration-300"
              style={{ width: `${Math.min((row.share ?? row.percentage ?? 0), 100)}%` }}
            />
          </div>
          <span className="text-xs text-[var(--t2)] w-16 text-end">{row.views.toLocaleString()}</span>
          <span className="text-xs text-[var(--t3)] w-12 text-end">{(row.share ?? row.percentage ?? 0).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
