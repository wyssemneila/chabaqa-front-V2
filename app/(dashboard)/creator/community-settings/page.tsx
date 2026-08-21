'use client'

import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useState } from 'react'
import Link from 'next/link'

const TABS = [
  { id: 'general',       label: 'General' },
  { id: 'branding',      label: 'Branding' },
  { id: 'pricing',       label: 'Pricing' },
  { id: 'tabs',          label: 'Tabs & Layout' },
  { id: 'rules',         label: 'Rules' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'domain',        label: 'Domain' },
]

export default function CommunitySettingsPage() {
  const [tab, setTab] = useState('general')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />

      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar />

        <main className="flex-1 px-6 py-6 max-w-5xl w-full mx-auto">
          <header className="mb-6">
            <h1 className="text-[22px] font-semibold" style={{ color: 'var(--t1)' }}>
              Community Settings
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--t3)' }}>
              Configure how your community looks, feels and works.
            </p>
          </header>

          {/* Tabs */}
          <div className="flex gap-6 border-b overflow-x-auto"
               style={{ borderColor: 'var(--bd)' }}>
            {TABS.map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="pb-3 text-[13px] font-medium transition-colors whitespace-nowrap relative"
                  style={{
                    color: active ? 'var(--p)' : 'var(--t2)',
                  }}
                >
                  {t.label}
                  {active && (
                    <span className="absolute left-0 right-0 bottom-[-1px] h-[2px] rounded-full"
                          style={{ background: 'var(--p)' }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Body */}
          <section className="mt-8 rounded-2xl p-8 border"
                   style={{ background: 'var(--white)', borderColor: 'var(--bd)' }}>
            <h2 className="text-[16px] font-semibold mb-2" style={{ color: 'var(--t1)' }}>
              {TABS.find((t) => t.id === tab)?.label}
            </h2>
            <p className="text-[13px]" style={{ color: 'var(--t3)' }}>
              This tab is being built. The full settings UI ships next.
            </p>

            <div className="mt-6 flex gap-3">
              <Link href="/creator"
                    className="px-4 py-2 rounded-xl text-[13px] font-medium"
                    style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                Back to Dashboard
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
