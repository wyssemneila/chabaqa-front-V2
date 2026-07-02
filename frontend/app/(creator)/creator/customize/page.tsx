'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { toast } from 'sonner'

export default function CustomizeRedirectPage() {
  const router = useRouter()
  const { selectedCommunity, isLoading } = useCreatorCommunity()

  useEffect(() => {
    if (isLoading) return

    const slug =
      typeof selectedCommunity?.slug === 'string'
        ? selectedCommunity.slug
        : typeof selectedCommunity?.handle === 'string'
          ? selectedCommunity.handle
          : ''

    if (slug) {
      router.replace(`/creator/community/${encodeURIComponent(slug)}/customize`)
      return
    }

    toast.info('Select a community first to open customization.')
    router.replace('/creator/communities')
  }, [isLoading, router, selectedCommunity])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Redirecting to community customization…
    </div>
  )
}
