'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FunnelStep {
  label: string;
  value: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  height?: number;
}

const COLORS = ['#8e78fb', '#a48ffc', '#b9a5fd', '#cfbcfe', '#e4d8ff'];

export function FunnelChart({ steps, height = 300 }: FunnelChartProps) {
  if (!steps?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={steps} layout="vertical" margin={{ left: 20, right: 20 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) => [value.toLocaleString(), 'Users']}
          contentStyle={{ borderRadius: 8, border: '1px solid var(--bd)' }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {steps.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
