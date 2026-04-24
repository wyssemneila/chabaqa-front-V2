"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { communitiesApi } from "@/lib/api"
import { useAuthContext } from "@/app/providers/auth-provider"

const STORAGE_KEY = "creator_selected_community_id"

type AnyCommunity = any

interface CreatorCommunityContextValue {
  communities: AnyCommunity[]
  selectedCommunityId: string | null
  selectedCommunity: AnyCommunity | null
  setSelectedCommunityId: (communityId: string | null) => void
  refreshCommunities: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const CreatorCommunityContext = createContext<CreatorCommunityContextValue | undefined>(undefined)

function getCommunityId(community: AnyCommunity): string {
  const rawId = community?.id ?? community?._id
  if (typeof rawId === "string") return rawId
  if (rawId && typeof rawId.toString === "function") return rawId.toString()
  return ""
}

export function CreatorCommunityProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuthContext()

  const [communities, setCommunities] = useState<AnyCommunity[]>([])
  const [selectedCommunityId, setSelectedCommunityIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const selectInitialCommunity = useCallback((nextCommunities: AnyCommunity[]) => {
    const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    const normalizedSaved = savedId ? String(savedId) : null

    const exists = normalizedSaved
      ? nextCommunities.some((c) => getCommunityId(c) === normalizedSaved)
      : false

    const initialId = exists
      ? normalizedSaved
      : (getCommunityId(nextCommunities[0]) || null)

    setSelectedCommunityIdState(initialId)

    if (typeof window !== "undefined") {
      if (initialId) {
        localStorage.setItem(STORAGE_KEY, initialId)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const refreshCommunities = useCallback(async () => {
    if (!isAuthenticated || authLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await communitiesApi.getMyManageable().catch(() => null as any)
      const list = (res?.data || res) ?? []
      const next = Array.isArray(list) ? list : []

      setCommunities(next)

      setSelectedCommunityIdState((prev) => {
        const prevId = prev || (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null)
        const normalizedPrev = prevId ? String(prevId) : null

        const stillExists = normalizedPrev
          ? next.some((c) => getCommunityId(c) === normalizedPrev)
          : false

        const nextId = stillExists ? normalizedPrev : (getCommunityId(next[0]) || null)

        if (typeof window !== "undefined") {
          if (nextId) {
            localStorage.setItem(STORAGE_KEY, nextId)
          } else {
            localStorage.removeItem(STORAGE_KEY)
          }
        }

        return nextId
      })
    } catch (e: any) {
      setCommunities([])
      setSelectedCommunityIdState(null)
      setError(e?.message || "Failed to load communities")
    } finally {
      setIsLoading(false)
    }
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      setCommunities([])
      setSelectedCommunityIdState(null)
      setIsLoading(false)
      setError(null)
      return
    }

    let mounted = true
    ;(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await communitiesApi.getMyManageable().catch(() => null as any)
        const list = (res?.data || res) ?? []
        const next = Array.isArray(list) ? list : []

        if (!mounted) return

        setCommunities(next)
        selectInitialCommunity(next)
      } catch (e: any) {
        if (!mounted) return
        setCommunities([])
        setSelectedCommunityIdState(null)
        setError(e?.message || "Failed to load communities")
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [authLoading, isAuthenticated, selectInitialCommunity])

  const setSelectedCommunityId = useCallback((communityId: string | null) => {
    const nextId = communityId ? String(communityId) : null
    setSelectedCommunityIdState(nextId)

    if (typeof window !== "undefined") {
      if (nextId) {
        localStorage.setItem(STORAGE_KEY, nextId)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const selectedCommunity = useMemo(() => {
    if (!selectedCommunityId) return null
    return communities.find((c) => getCommunityId(c) === selectedCommunityId) || null
  }, [communities, selectedCommunityId])

  const value = useMemo<CreatorCommunityContextValue>(
    () => ({
      communities,
      selectedCommunityId,
      selectedCommunity,
      setSelectedCommunityId,
      refreshCommunities,
      isLoading,
      error,
    }),
    [communities, selectedCommunityId, selectedCommunity, setSelectedCommunityId, refreshCommunities, isLoading, error]
  )

  return <CreatorCommunityContext.Provider value={value}>{children}</CreatorCommunityContext.Provider>
}

export function useCreatorCommunity() {
  const ctx = useContext(CreatorCommunityContext)
  if (!ctx) {
    throw new Error("useCreatorCommunity must be used within CreatorCommunityProvider")
  }
  return ctx
}
