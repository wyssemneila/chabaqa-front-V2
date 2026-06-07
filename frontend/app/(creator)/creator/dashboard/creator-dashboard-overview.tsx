'use client'

import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import DashOnboarding from '@/components/creator-dashboard/DashOnboarding'
import DashKpiGrid from '@/components/creator-dashboard/DashKpiGrid'
import DashRecentActivity from '@/components/creator-dashboard/DashRecentActivity'
import DashYourContent from '@/components/creator-dashboard/DashYourContent'
import DashYourCommunities from '@/components/creator-dashboard/DashYourCommunities'
import { useCreatorDashboardOverview } from '@/hooks/creator-dashboard/use-creator-dashboard-data'
import { RefreshCw } from 'lucide-react'

export default function CreatorDashboardOverview() {
  const { data, loading, error, refetch } = useCreatorDashboardOverview()
  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <>
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--p3); border-radius: 10px; }
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />

        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Creator Dashboard" subtitle={today} />

          <main id="main-content" className="p-7 flex-1">
            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm"
                style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}>
                <span>Some dashboard data could not load. Showing everything that is available.</span>
                <button onClick={refetch} className="inline-flex items-center gap-1 font-bold">
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            )}

            <DashOnboarding initialSteps={data?.onboarding} />
            <DashKpiGrid cards={data?.kpis} loading={loading} />

            <div className="grid grid-cols-2 gap-4 mb-6" style={{ animation: 'dashFadeUp .4s .2s ease both' }}>
              <DashRecentActivity items={data?.activity} loading={loading} />
              <DashYourContent items={data?.content} loading={loading} />
            </div>

            <DashYourCommunities items={data?.communities} loading={loading} />
          </main>
        </div>
      </div>
    </>
  )
}
