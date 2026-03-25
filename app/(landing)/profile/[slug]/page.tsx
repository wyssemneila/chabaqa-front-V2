"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthContext } from "@/app/providers/auth-provider"
import ProfilePage from "../page"
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

export default function ProfileSlugPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuthContext()
  const [slugUser, setSlugUser] = useState<SlugUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const handle = String(params?.slug || "")
  const currentUserHandle = getUserProfileHandle(currentUser)

  useEffect(() => {
    const fetchSlugUser = async () => {
      if (!handle) {
        setError("No handle provided")
        setLoading(false)
        return
      }

      try {
        setError(null)
        
        // If viewing own profile and already authenticated, use current user
        if (currentUser && !authLoading && handle.toLowerCase() === currentUserHandle) {
          if (handle !== currentUserHandle) {
            router.replace(`/profile/${currentUserHandle}`)
            return
          }

          setSlugUser({
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
          })
          setLoading(false)
          return
        }

        // Fetch user by username handle from API
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
          // Fallback for contexts where only user id is available.
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
          setError(`User @${safeDecodeHandle(handle)} not found`)
          setLoading(false)
          return
        }

        const canonicalHandle = getUserProfileHandle(resolvedUser)
        if (canonicalHandle && canonicalHandle !== handle.toLowerCase()) {
          router.replace(`/profile/${canonicalHandle}`)
          return
        }
        setSlugUser(resolvedUser)
      } catch (err) {
        console.error("Error fetching slug user:", err)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchSlugUser()
  }, [handle, currentUser, authLoading, currentUserHandle, router])

  if (loading || authLoading) {
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
          <p className="text-muted-foreground mb-4">{error}</p>
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

  if (!slugUser) {
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
      String((slugUser as any)._id || (slugUser as any).id || ""),
  )

  // Pass the fetched user data to the existing ProfilePage component
  return <ProfilePage overrideUser={slugUser} isOwnProfile={isOwnProfile} />
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
