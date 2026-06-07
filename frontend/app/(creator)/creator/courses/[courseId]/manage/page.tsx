'use client'

import { useParams } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { CourseManager } from './components/course-manager'

export default function ManageCoursePage() {
  const params = useParams<{ courseId?: string; id?: string }>()
  const courseId = String(params?.courseId || params?.id || '')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar title="Manage Course" subtitle="Edit course content, pricing, resources and settings" />
        <main id="main-content" className="flex-1">
          {courseId ? <CourseManager courseId={courseId} /> : <div className="p-7 text-sm text-red-600">Course ID is missing.</div>}
        </main>
      </div>
    </div>
  )
}
