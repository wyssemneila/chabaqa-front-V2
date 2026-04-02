import { kpiCards, type KpiCard, type TrendDir } from '@/lib/dashboard-data'
import DashIcon from './DashIcon'

function trendStyle(dir: TrendDir): React.CSSProperties {
  if (dir === 'up')   return { background: '#eaf5ee', color: '#1a7a4a' }
  if (dir === 'down') return { background: '#fdeeed', color: '#b83232' }
  return { background: 'var(--p2)', color: 'var(--t3)' }
}

function KpiCardUI({ card }: { card: KpiCard }) {
  return (
    <div className="rounded-[14px] p-[18px_20px] transition-all hover:-translate-y-[2px] hover:shadow-[0_16px_48px_rgba(142,120,251,.18)]"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.05em] mb-2"
        style={{ color: 'var(--t3)' }}>
        <div className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
          style={{ background: card.iconBg }}>
          <DashIcon name={card.icon} size={14} color={card.iconColor} />
        </div>
        {card.label}
      </div>
      <div className="text-[28px] font-semibold leading-none mb-2 font-mono"
        style={{ color: 'var(--t1)' }}>
        {card.value}
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
          style={trendStyle(card.trendDir)}>
          {card.trend}
        </span>
        {card.label === 'Total Revenue' && <span className="text-[11px]" style={{ color: 'var(--t3)' }}>TND</span>}
      </div>
    </div>
  )
}

export default function DashKpiGrid() {
  return (
    <section className="mb-6" style={{ animation: 'dashFadeUp .4s .1s ease both' }}>
      <p className="text-[12px] font-semibold tracking-[.05em] uppercase mb-3" style={{ color: 'var(--t3)' }}>
        Performance overview
      </p>
      <div className="grid grid-cols-3 gap-3">
        {kpiCards.map((card) => <KpiCardUI key={card.label} card={card} />)}
      </div>
    </section>
  )
}
