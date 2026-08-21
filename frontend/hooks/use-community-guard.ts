"use client"

import { createElement, type ReactElement } from "react"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { PageState } from "@/components/creator-dashboard/page-state"

export function useCommunityGuard() {
  const ctx = useCreatorCommunity()
  const { isLoading, error, selectedCommunityId, refreshCommunities } = ctx
  const communities = Array.isArray(ctx.communities)
    ? ctx.communities
    : selectedCommunityId
      ? [{ id: selectedCommunityId }]
      : []

  let guard: ReactElement | null = null

  if (isLoading) {
    guard = createElement(PageState, { variant: "loading" })
  } else if (error) {
    guard = createElement(PageState, {
      variant: "error",
      title: "Could not load communities",
      description: error,
      onRetry: () => void refreshCommunities(),
    })
  } else if (communities.length === 0) {
    guard = createElement(PageState, {
      variant: "no-community",
      title: "No communities yet",
      description: "Create your first community to start managing content, revenue, and your audience.",
    })
  } else if (!selectedCommunityId) {
    guard = createElement(PageState, {
      variant: "no-community",
      title: "No community selected",
      description: "Select a community from the sidebar to continue.",
    })
  }

  return { ...ctx, guard }
}
