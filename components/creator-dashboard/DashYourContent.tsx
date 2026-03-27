'use client'

import { useState } from 'react'
import { contentItems, type ContentItem } from '@/lib/dashboard-data'
import DashIcon from './DashIcon'

const tabs = ['All', 'Courses', 'Challenges', 'Sessions', 'Posts'] as const
type Tab = typeof tabs[number]

const tagStyle: Record<ContentItem['type'], React.CSSProperties> = {
  Course:    { background: '#eef1ff', color: '#2a5cff' },
  Challenge: { background: '#fef6e4', color: '#8a5a00' },
  Session:   { background: '#eaf5ee', color: '#1a7a4a' },
  Post:      { background: '#f0efe9', color: '#5a5850' },
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
    <div className="rounded-[14px] overflow-hidden" style={{ background: '#fff', border: '1px solid #e4e2db' }}>
      <div className="px-5 pt-4 pb-3 flex items-baseline justify-between" style={{ borderBottom: '1px solid #e4e2db' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: '#1a1916' }}>Your Content</h3>
        <span className="text-[11px]" style={{ color: '#9a9890' }}>Share to get your first students</span>
      </div>

      <div className="flex gap-0.5 px-4 pt-3 pb-2 overflow-x-auto" style={{ borderBottom: '1px solid #e4e2db' }}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-[6px] text-xs whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab ? '#f0efe9' : 'transparent',
              color: activeTab === tab ? '#1a1916' : '#9a9890',
              fontWeight: activeTab === tab ? 500 : 400,
              border: 'none',
            }}>
            {tab}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px]" style={{ color: '#9a9890' }}>
            No {activeTab.toLowerCase()} yet.
          </div>
        ) : filtered.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3 transition-colors"
            style={{ borderBottom: i < filtered.length - 1 ? '1px solid #e4e2db' : 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0efe9' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
            <div className="w-10 h-10 rounded-[8px] flex items-center justify-center text-[18px] shrink-0"
              style={{ background: '#f0efe9', border: '1px solid #e4e2db' }}>
              {item.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate mb-1" style={{ color: '#1a1916' }}>{item.name}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]" style={tagStyle[item.type]}>
                  {item.type}
                </span>
                <span className="text-[11px]" style={{ color: '#9a9890' }}>
                  {item.enrollPrompt} —{' '}
                  <a href="#" className="font-medium hover:opacity-70" style={{ color: '#2a5cff' }}>Share link →</a>
                </span>
              </div>
            </div>
            <button className="flex items-center gap-1 text-[11px] font-medium transition-opacity hover:opacity-70 shrink-0"
              style={{ color: '#2a5cff', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              Edit <DashIcon name="edit" size={11} color="#2a5cff" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
