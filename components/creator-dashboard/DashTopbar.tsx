'use client'

import DashIcon from './DashIcon'

interface DashTopbarProps { title: string; subtitle: string }

export default function DashTopbar({ title, subtitle }: DashTopbarProps) {
  return (
    <header className="px-7 h-14 flex items-center justify-between sticky top-0 z-40"
      style={{ background: 'var(--white)', borderBottom: '1px solid var(--bd)' }}>
      <div>
        <h1 className="text-[15px] font-semibold" style={{ color: 'var(--t1)' }}>{title}</h1>
        <p className="text-[12px] mt-px" style={{ color: 'var(--t3)' }}>{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-xs font-medium transition-all"
          style={{ border: '1px solid var(--bd)', color: 'var(--t2)', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          <DashIcon name="externalLink" size={13} />
          View Community
        </button>
        <button className="inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-[10px] text-xs font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'var(--p)' }}>
          <DashIcon name="plus" size={13} color="white" />
          New Content
        </button>
      </div>
    </header>
  )
}
