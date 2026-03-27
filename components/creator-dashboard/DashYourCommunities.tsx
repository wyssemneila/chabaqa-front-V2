import { communities } from '@/lib/dashboard-data'
import DashIcon from './DashIcon'

export default function DashYourCommunities() {
  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: '#fff', border: '1px solid #e4e2db', animation: 'dashFadeUp .4s .3s ease both' }}>
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid #e4e2db' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: '#1a1916' }}>Your Communities</h3>
        <button className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-[8px] transition-all"
          style={{ border: '1px solid #d4d2ca', color: '#5a5850', background: 'transparent', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0efe9' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          <DashIcon name="plus" size={11} />
          Create New
        </button>
      </div>

      {communities.map((c) => (
        <div key={c.name} className="flex items-center gap-3.5 px-4 py-3.5 mx-4 my-3 rounded-[10px]"
          style={{ background: '#f0efe9', border: '1px solid #e4e2db' }}>
          <div className="w-11 h-11 rounded-[10px] flex items-center justify-center text-[18px] shrink-0"
            style={{ background: '#1a1916' }}>
            {c.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold mb-0.5" style={{ color: '#1a1916' }}>
              {c.name}
              {c.verified && (
                <span className="text-[9px] font-bold tracking-[.04em] px-1.5 py-0.5 rounded-[4px]"
                  style={{ background: '#eef1ff', color: '#2a5cff' }}>
                  VERIFIED
                </span>
              )}
            </div>
            <p className="text-[11px] truncate" style={{ color: '#9a9890' }}>
              {c.description}&nbsp;·&nbsp;{c.members} members&nbsp;·&nbsp;{c.category}&nbsp;·&nbsp;{c.plan}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button className="text-[11px] font-medium px-2.5 py-1 rounded-[8px] transition-all"
              style={{ border: '1px solid #d4d2ca', color: '#5a5850', background: 'transparent', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              View
            </button>
            <button className="text-[11px] font-medium px-2.5 py-1 rounded-[8px] text-white transition-opacity hover:opacity-90"
              style={{ background: '#2a5cff', border: 'none', cursor: 'pointer' }}>
              Customize
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
