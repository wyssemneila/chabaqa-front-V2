"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useAuthContext } from "@/app/providers/auth-provider"
import ProfilePage from "../page"
const ProfilePageContent = (ProfilePage as any).__profileContent as React.ComponentType<{ overrideUser?: any; isOwnProfile?: boolean }>
import { getUserProfileHandle } from "@/lib/profile-handle"
import type { UserSocialLinks } from "@/lib/social-links"

interface PublicProfileUser {
  _id: string
  id?: string
  name: string
  username?: string
  role: string
  avatar?: string
  ville?: string
  pays?: string
  bio?: string
  socialLinks?: UserSocialLinks
  lien_instagram?: string
  createdAt: string
}

function toPublicProfileUser(user: unknown): PublicProfileUser | null {
  if (!user || typeof user !== "object") return null

  const source = user as Record<string, unknown>
  const id = String(source._id || source.id || "").trim()
  const name = typeof source.name === "string" ? source.name.trim() : ""
  if (!id || !name) return null

  return {
    _id: id,
    id,
    name,
    username: typeof source.username === "string" ? source.username : undefined,
    role: typeof source.role === "string" ? source.role : "user",
    avatar: typeof source.avatar === "string" ? source.avatar : undefined,
    ville: typeof source.ville === "string" ? source.ville : undefined,
    pays: typeof source.pays === "string" ? source.pays : undefined,
    bio: typeof source.bio === "string" ? source.bio : undefined,
    socialLinks: typeof source.socialLinks === "object" && source.socialLinks ? source.socialLinks as UserSocialLinks : undefined,
    lien_instagram: typeof source.lien_instagram === "string" ? source.lien_instagram : undefined,
    createdAt: typeof source.createdAt === "string" ? source.createdAt : "",
  }
}

async function fetchUserByHandle(handle: string): Promise<PublicProfileUser> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  const canonicalHandle = safeDecodeHandle(handle).trim().toLowerCase()
  const response = await fetch(`${apiBase}/user/by-username/${encodeURIComponent(canonicalHandle)}`)
  if (!response.ok) {
    throw new Error(`User @${safeDecodeHandle(handle)} not found`)
  }

  const data = await response.json()
  const user = data?.success ? toPublicProfileUser(data.user) : null
  if (!user) throw new Error(`User @${safeDecodeHandle(handle)} not found`)

  return user
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
  } = useQuery<PublicProfileUser>({
    queryKey: ["profile", handle.toLowerCase()],
    queryFn: () => fetchUserByHandle(handle),
    enabled: !!handle && !isOwnHandle,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })

  // Build resolved user: prefer auth context for own profile
  const resolvedUser = React.useMemo<PublicProfileUser | null>(() => {
    if (isOwnHandle && currentUser) {
      return {
        _id: (currentUser as any)._id || (currentUser as any).id || '',
        name: (currentUser as any).name || '',
        username: (currentUser as any).username,
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
