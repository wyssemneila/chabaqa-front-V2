'use client'

import { useParams } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import ChallengeManager from './components/ChallengeManager'

export default function ManageChallengePage() {
  const params = useParams<{ challengeId?: string; id?: string }>()
  const challengeId = String(params?.challengeId || params?.id || '')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar title="Manage Challenge" subtitle="Edit tasks, rewards, resources and challenge settings" />
        <main id="main-content" className="flex-1">
          {challengeId ? <ChallengeManager challengeId={challengeId} /> : <div className="p-7 text-sm text-red-600">Challenge ID is missing.</div>}
        </main>
      </div>
    </div>
  )
}
