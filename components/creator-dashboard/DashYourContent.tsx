'use client'

import { useState } from 'react'
import { contentItems, type ContentItem } from '@/lib/dashboard-data'
import DashIcon from './DashIcon'

const tabs = ['All', 'Courses', 'Challenges', 'Sessions', 'Posts'] as const
type Tab = typeof tabs[number]

const tagStyle: Record<ContentItem['type'], React.CSSProperties> = {
  Course:    { background: 'var(--p2)', color: 'var(--p)' },
  Challenge: { background: '#fff3e4', color: '#cc7a00' },
  Session:   { background: '#e4f8fd', color: '#0e7a8a' },
  Post:      { background: 'var(--bg)', color: 'var(--t3)' },
}

function filter(items: ContentItem[], tab: Tab) {
  if (tab === 'All') return items
  const map: Record<Tab, ContentItem['type'] | null> = { All: null, Courses: 'Course', Challenges: 'Challenge', Sessions: 'Session', Posts: 'Post' }
  return items.filter(i => i.type === map[tab])
}

export default function DashYourContent() {
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const filtered = filter(contentItems, activeTab)

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between" style={{ borderBottom: '1px solid var(--bd)' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>Your Content</h3>
        <span className="text-[11px]" style={{ color: 'var(--t3)' }}>Share to get your first students</span>
      </div>

      <div className="flex gap-0.5 px-4 pt-3 pb-2 overflow-x-auto" style={{ borderBottom: '1px solid var(--bd)' }}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-[6px] text-xs whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab ? 'var(--p2)' : 'transparent',
              color: activeTab === tab ? 'var(--p)' : 'var(--t3)',
              fontWeight: activeTab === tab ? 500 : 400,
              border: 'none',
            }}>
            {tab}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--t3)' }}>
            No {activeTab.toLowerCase()} yet.
          </div>
        ) : filtered.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3 transition-colors"
            style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--bd)' : 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--p2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            <div className="w-10 h-10 rounded-[8px] flex items-center justify-center text-[18px] shrink-0"
              style={{ background: 'var(--p2)', border: '1px solid var(--bd)' }}>
              {item.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate mb-1" style={{ color: 'var(--t1)' }}>{item.name}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]" style={tagStyle[item.type]}>
                  {item.type}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--t3)' }}>
                  {item.enrollPrompt} —{' '}
                  <a href="#" className="font-medium hover:opacity-70" style={{ color: 'var(--p)' }}>Share link →</a>
                </span>
              </div>
            </div>
            <button className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-70 shrink-0"
              style={{ color: 'var(--p)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              Edit <DashIcon name="edit" size={11} color="var(--p)" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
