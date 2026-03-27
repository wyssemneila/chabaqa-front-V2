import DashSidebar        from '@/components/creator-dashboard/DashSidebar'
import DashTopbar         from '@/components/creator-dashboard/DashTopbar'
import DashOnboarding     from '@/components/creator-dashboard/DashOnboarding'
import DashKpiGrid        from '@/components/creator-dashboard/DashKpiGrid'
import DashRecentActivity from '@/components/creator-dashboard/DashRecentActivity'
import DashYourContent    from '@/components/creator-dashboard/DashYourContent'
import DashYourCommunities from '@/components/creator-dashboard/DashYourCommunities'

export default function CreatorDashboardPage() {
  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
        ::-webkit-scrollbar-thumb { background: #d4d2ca; border-radius: 10px; }
      `}</style>

      <div className="flex min-h-screen" style={{ background: '#f5f4f0' }}>
        <DashSidebar />

        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Creator Dashboard" subtitle={today} />

          <main className="p-7 flex-1">
            <DashOnboarding />
            <DashKpiGrid />

            <div className="grid grid-cols-2 gap-4 mb-6" style={{ animation: 'dashFadeUp .4s .2s ease both' }}>
              <DashRecentActivity />
              <DashYourContent />
            </div>

            <DashYourCommunities />
          </main>
        </div>
      </div>
    </>
  )
}
