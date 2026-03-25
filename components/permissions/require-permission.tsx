"use client"

import type { ReactNode } from "react"
import { useCommunityPermissions } from "@/hooks/use-community-permissions"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import type { CommunityPermissionValue } from "@/lib/permissions"

// ── Types ──────────────────────────────────────────────────────────────────

interface RequirePermissionProps {
  /** Permission(s) required. With `mode="any"` (default) at least one must match. */
  permission: CommunityPermissionValue | CommunityPermissionValue[]
  /** "any" = at least one permission must match, "all" = all must match */
  mode?: "any" | "all"
  /** Optional override — skips the context and checks against this community. */
  communityId?: string | null
  /** Rendered when the user has the required permission(s). */
  children: ReactNode
  /** Optional fallback shown when permission is denied. Defaults to `null`. */
  fallback?: ReactNode
}

/**
 * Conditionally renders children based on the current user's community permissions.
 *
 * Reads `selectedCommunityId` from `useCreatorCommunity()` by default; pass
 * `communityId` explicitly to override.
 *
 * ```tsx
 * <RequirePermission permission={CommunityPermission.MARKETING_MANAGE}>
 *   <EmailCampaignsButton />
 * </RequirePermission>
 * ```
 */
export function RequirePermission({
  permission,
  mode = "any",
  communityId: explicitId,
  children,
  fallback = null,
}: RequirePermissionProps) {
  // If no explicit communityId, try to get from context (will throw if outside provider)
  let ctxCommunityId: string | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useCreatorCommunity()
    ctxCommunityId = ctx.selectedCommunityId
  } catch {
    // Not inside a CreatorCommunityProvider — fine, we'll use explicitId or none
  }

  const communityId = explicitId ?? ctxCommunityId
  const { can, canAny, canAll, isLoading } = useCommunityPermissions(communityId)

  // While loading, hide the content to prevent flicker of unauthorized UI
  if (isLoading) return null

  const perms = Array.isArray(permission) ? permission : [permission]
  const granted = mode === "all" ? canAll(...perms) : canAny(...perms)

  return <>{granted ? children : fallback}</>
}

/**
 * Hook-based alternative for conditional logic in code (not JSX gating).
 *
 * ```ts
 * const { can, isStaff } = useCreatorPermissions()
 * if (can(CommunityPermission.FINANCE_VIEW)) { ... }
 * ```
 */
export function useCreatorPermissions() {
  let communityId: string | null = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useCreatorCommunity()
    communityId = ctx.selectedCommunityId
  } catch {
    // Not inside provider
  }
  return useCommunityPermissions(communityId)
}
