import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { CourseCreationContainer } from './components/course-creation-container'

export default function CreateCoursePage() {
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

      <div className="flex h-screen h-dvh overflow-hidden" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:ml-[220px]">
          <DashTopbar title="Create Course" subtitle="New course wizard" />
          <main id="main-content" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain" style={{ animation: 'dashFadeUp .4s ease both' }}>
            <CourseCreationContainer />
          </main>
        </div>
      </div>
    </>
  )
}
