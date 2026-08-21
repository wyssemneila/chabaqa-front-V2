'use client';

import { useTranslations } from 'next-intl';

interface CohortWeek {
  week: number;
  retained: number;
  rate: number;
}

interface Cohort {
  cohortLabel: string;
  cohortStart: string;
  cohortSize: number;
  weeks: CohortWeek[];
}

interface RetentionCohortGridProps {
  cohorts: Cohort[];
  maxWeeks?: number;
}

function rateColor(rate: number): string {
  if (rate >= 80) return 'bg-purple-600 text-white';
  if (rate >= 60) return 'bg-purple-400 text-white';
  if (rate >= 40) return 'bg-purple-300 text-white';
  if (rate >= 20) return 'bg-purple-200 text-gray-800';
  return 'bg-purple-50 text-gray-600';
}

export function RetentionCohortGrid({ cohorts, maxWeeks = 8 }: RetentionCohortGridProps) {
  const t = useTranslations('analytics');

  if (!cohorts?.length) {
    return <p className="text-sm text-[var(--t3)]">{t('retention.noData')}</p>;
  }

  const weekCols = Array.from({ length: maxWeeks }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--bd)]">
            <th className="text-start py-2 pe-4 font-medium text-[var(--t2)]">{t('retention.cohort')}</th>
            <th className="text-center py-2 px-2 font-medium text-[var(--t2)]">{t('retention.size')}</th>
            {weekCols.map(w => (
              <th key={w} className="text-center py-2 px-2 font-medium text-[var(--t2)]">W{w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map(cohort => (
            <tr key={cohort.cohortStart} className="border-b border-[var(--bd)]/50">
              <td className="py-2 pe-4 font-medium text-[var(--t1)]">{cohort.cohortLabel}</td>
              <td className="text-center py-2 px-2 text-[var(--t2)]">{cohort.cohortSize}</td>
              {weekCols.map(w => {
                const weekData = cohort.weeks.find(wk => wk.week === w);
                return (
                  <td key={w} className="text-center py-2 px-1">
                    {weekData ? (
                      <span className={`inline-block rounded px-2 py-0.5 ${rateColor(weekData.rate)}`}>
                        {Math.round(weekData.rate)}%
                      </span>
                    ) : (
                      <span className="text-[var(--t3)]">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
