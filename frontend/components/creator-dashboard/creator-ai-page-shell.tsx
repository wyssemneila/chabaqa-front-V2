'use client'

import type { ReactNode } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { AiShellLayout } from '@/components/ai/ai-shell-layout'

export function CreatorAiPageShell({
  topbarTitle,
  topbarSubtitle,
  title,
  description,
  children,
}: {
  topbarTitle: string
  topbarSubtitle?: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex min-h-screen flex-col">
        <DashTopbar title={topbarTitle} subtitle={topbarSubtitle ?? ''} />
        <div className="flex-1 px-7 pb-7">
          <AiShellLayout title={title} description={description}>
            {children}
          </AiShellLayout>
        </div>
      </div>
    </div>
  )
}
