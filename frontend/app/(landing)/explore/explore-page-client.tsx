"use client"

import { useState, useEffect, useMemo } from "react"
import { FeaturedCommunities } from "@/app/(landing)/(communities)/components/featured-communities"
import { CommunitiesSearchSection } from "@/app/(landing)/(communities)/components/communities-search-section"
import { CommunitiesCTA } from "@/app/(landing)/(communities)/components/communities-cta"
import type { ExploreItem } from "@/lib/explore-data"

interface ExplorePageClientProps {
  items: ExploreItem[]
  featured: ExploreItem[]
}

/** Minimal fetch to check which communities the logged-in user has joined. */
async function fetchJoinedCommunitySlugs(): Promise<Set<string>> {
  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("token") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("access_token")
        : null

    if (!token) return new Set()

    const apiBase =
      (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "")
    const authHeader = token.toLowerCase().startsWith("bearer ")
      ? token
      : `Bearer ${token}`

    const res = await fetch(
      `${apiBase}/community-aff-crea-join/my-joined`,
      {
        headers: { Authorization: authHeader },
        credentials: "include",
      },
    )
    if (!res.ok) return new Set()

    const json = await res.json()

    // Response can be { data: [...] } or { data: { communities: [...] } } or [...]
    let communities: any[] = []
    if (Array.isArray(json?.data)) communities = json.data
    else if (Array.isArray(json?.data?.communities)) communities = json.data.communities
    else if (Array.isArray(json?.data?.data)) communities = json.data.data
    else if (Array.isArray(json)) communities = json

    const slugs = new Set<string>()
    const ids = new Set<string>()
    for (const c of communities) {
      const slug = (c?.slug || c?.community?.slug || "").toString().trim().toLowerCase()
      const id = (c?._id || c?.id || c?.community?._id || c?.community?.id || "").toString().trim()
      if (slug) slugs.add(slug)
      if (id) ids.add(id)
    }
    // We store both slugs and ids in the same set for easy matching
    return new Set([...slugs, ...ids])
  } catch {
    return new Set()
  }
}

function enrichItemsWithAccess(
  items: ExploreItem[],
  joinedSet: Set<string>,
): ExploreItem[] {
  if (joinedSet.size === 0) return items

  return items.map((item) => {
    if (item.type === "community") {
      const slug = (item.slug || "").toString().trim().toLowerCase()
      const id = (item.id || "").toString().trim()
      const isMember = joinedSet.has(slug) || joinedSet.has(id)
      return { ...item, isMember }
    }

    // For content items, check if user is member of the parent community
    const communitySlug = (item.communitySlug || "").toString().trim().toLowerCase()
    const communityId = (item.communityId || "").toString().trim()
    const isMember = joinedSet.has(communitySlug) || joinedSet.has(communityId)
    return { ...item, isMember }
  })
}

export function ExplorePageClient({ items, featured }: ExplorePageClientProps) {
  const [joinedSet, setJoinedSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchJoinedCommunitySlugs().then(setJoinedSet)
  }, [])

  const enrichedItems = useMemo(
    () => enrichItemsWithAccess(items, joinedSet),
    [items, joinedSet],
  )
  const enrichedFeatured = useMemo(
    () => enrichItemsWithAccess(featured, joinedSet),
    [featured, joinedSet],
  )

  return (
    <>
      <FeaturedCommunities items={enrichedFeatured} />
      <CommunitiesSearchSection items={enrichedItems} />
      <CommunitiesCTA />
    </>
  )
}
