"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuthContext } from "@/app/providers/auth-provider"
import ProfilePage from "../page"
const ProfilePageContent = (ProfilePage as any).__profileContent as React.ComponentType<{ overrideUser?: any; isOwnProfile?: boolean }>
import { getUserProfileHandle, slugifyToHandle } from "@/lib/profile-handle"
import type { UserSocialLinks } from "@/lib/social-links"

interface SlugUser {
  _id: string
  name: string
  username?: string
  email?: string
  role: string
  avatar?: string
  ville?: string
  pays?: string
  bio?: string
  socialLinks?: UserSocialLinks
  lien_instagram?: string
  createdAt: string
}

async function fetchUserByHandle(handle: string): Promise<SlugUser> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const candidates = getHandleCandidates(handle)
  let resolvedUser: SlugUser | null = null

  for (const candidate of candidates) {
    const response = await fetch(`${apiBase}/user/by-username/${encodeURIComponent(candidate)}`)
    if (!response.ok) continue

    const data = await response.json()
    if (data?.success && data?.user) {
      resolvedUser = data.user
      break
    }
    if (data?.user) {
      resolvedUser = data.user
      break
    }
  }

  if (!resolvedUser) {
    for (const candidate of candidates) {
      const byIdResponse = await fetch(`${apiBase}/user/user/${encodeURIComponent(candidate)}`)
      if (!byIdResponse.ok) continue

      const byIdData = await byIdResponse.json()
      if (byIdData?.user) {
        resolvedUser = byIdData.user
        break
      }
      if (byIdData?.data?.user) {
        resolvedUser = byIdData.data.user
        break
      }
    }
  }

  if (!resolvedUser) {
    throw new Error(`User @${safeDecodeHandle(handle)} not found`)
  }

  return resolvedUser
}

export default function ProfileSlugPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuthContext()
  
  const handle = String(params?.slug || "")
  const currentUserHandle = getUserProfileHandle(currentUser)

  const isOwnHandle = Boolean(
    currentUser && !authLoading && handle.toLowerCase() === currentUserHandle
  )

  const {
    data: slugUser,
    isLoading,
    error,
  } = useQuery<SlugUser>({
    queryKey: ["profile", handle.toLowerCase()],
    queryFn: () => fetchUserByHandle(handle),
    enabled: !!handle && !isOwnHandle,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  // Build resolved user: prefer auth context for own profile
  const resolvedUser = React.useMemo<SlugUser | null>(() => {
    if (isOwnHandle && currentUser) {
      return {
        _id: (currentUser as any)._id || (currentUser as any).id || '',
        name: (currentUser as any).name || '',
        username: (currentUser as any).username,
        email: currentUser.email || '',
        role: (currentUser as any).role || 'user',
        avatar: (currentUser as any).avatar,
        ville: (currentUser as any).ville,
        pays: (currentUser as any).pays,
        bio: (currentUser as any).bio,
        socialLinks: (currentUser as any).socialLinks,
        lien_instagram: (currentUser as any).lien_instagram,
        createdAt: (currentUser as any).createdAt || new Date().toISOString()
      }
    }
    return slugUser ?? null
  }, [isOwnHandle, currentUser, slugUser])

  // Handle canonical redirect for own profile
  React.useEffect(() => {
    if (isOwnHandle && handle !== currentUserHandle) {
      router.replace(`/profile/${currentUserHandle}`)
    }
  }, [isOwnHandle, handle, currentUserHandle, router])

  // Handle canonical redirect for fetched user
  React.useEffect(() => {
    if (slugUser && !isOwnHandle) {
      const canonicalHandle = getUserProfileHandle(slugUser)
      if (canonicalHandle && canonicalHandle !== handle.toLowerCase()) {
        router.replace(`/profile/${canonicalHandle}`)
      }
    }
  }, [slugUser, isOwnHandle, handle, router])

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">{error instanceof Error ? error.message : "Failed to load profile"}</p>
          <button 
            onClick={() => router.push("/explore")} 
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
          >
            Explore Profiles
          </button>
        </div>
      </div>
    )
  }

  if (!resolvedUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No profile data available</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = Boolean(
    currentUser &&
    String((currentUser as any)._id || (currentUser as any).id || "") ===
      String((resolvedUser as any)._id || (resolvedUser as any).id || ""),
  )

  return <ProfilePageContent overrideUser={resolvedUser} isOwnProfile={isOwnProfile} />
}

function safeDecodeHandle(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getHandleCandidates(rawHandle: string): string[] {
  const base = String(rawHandle || "").trim()
  const decoded = safeDecodeHandle(base).trim()
  const lowerBase = base.toLowerCase()
  const lowerDecoded = decoded.toLowerCase()
  const slugged = slugifyToHandle(decoded || base)
  const compact = slugged.replace(/[-_.]/g, "")
  const underscore = slugged.replace(/-/g, "_")
  const dotted = slugged.replace(/-/g, ".")
  const rawCompact = lowerDecoded.replace(/[^a-z0-9]/g, "")
  const embeddedObjectId = (lowerDecoded.match(/[a-f0-9]{24}/i) || [])[0] || ""
  const embeddedNameSlug = (lowerDecoded.match(/(?:^|-)name-([a-z0-9-]{2,}?)(?:-email-|$)/i) || [])[1] || ""

  return Array.from(
    new Set(
      [lowerBase, lowerDecoded, slugged, compact, underscore, dotted, rawCompact, embeddedObjectId, embeddedNameSlug].filter(
        (value) => value.length > 0,
      ),
    ),
  )
}
