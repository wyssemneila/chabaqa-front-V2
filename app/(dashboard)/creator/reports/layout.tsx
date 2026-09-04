import DashSidebar from '@/components/creator-dashboard/DashSidebar'

// Shared shell for the Reports section: the sidebar renders ONCE here and stays
// put across navigation, so only the content area (children) swaps to the
// skeleton (reports/loading.tsx) and back — the YouTube/Facebook effect.
export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}
