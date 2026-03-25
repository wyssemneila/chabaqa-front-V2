"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { communityAccessApi } from "@/lib/api/community-access.api";
import type {
  CommunityRole,
  CommunityPermissionValue,
} from "@/lib/permissions";
import { ROLE_PERMISSIONS } from "@/lib/permissions";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CommunityPermissionsState {
  /** The authenticated user's role in the community */
  role: CommunityRole;
  /** Flat list of granted permission keys */
  permissions: CommunityPermissionValue[];
  /** True while the initial fetch is in progress */
  isLoading: boolean;
  /** Error message if the fetch failed */
  error: string | null;
  /** Check whether a specific permission is granted */
  can: (permission: CommunityPermissionValue) => boolean;
  /** Check whether the user has *any* of the given permissions */
  canAny: (...perms: CommunityPermissionValue[]) => boolean;
  /** Check whether the user has *all* of the given permissions */
  canAll: (...perms: CommunityPermissionValue[]) => boolean;
  /** True if user is at least a staff member (owner/admin/moderator/support) */
  isStaff: boolean;
  /** True if user is owner or admin */
  isAdmin: boolean;
  /** Force refetch the permissions */
  refresh: () => Promise<void>;
}

// ── Simple in-memory cache (shared across hook instances) ──────────────────

interface CacheEntry {
  role: CommunityRole;
  permissions: CommunityPermissionValue[];
  ts: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30_000; // 30s

function normalizePermissionList(value: unknown): CommunityPermissionValue[] {
  if (Array.isArray(value)) {
    return value
      .map((permission) => String(permission || "").trim())
      .filter(Boolean) as CommunityPermissionValue[];
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized ? ([normalized] as CommunityPermissionValue[]) : [];
  }

  if (value && typeof value === "object") {
    const fromKnownField = (value as any).permissions;
    if (Array.isArray(fromKnownField)) {
      return fromKnownField
        .map((permission: unknown) => String(permission || "").trim())
        .filter(Boolean) as CommunityPermissionValue[];
    }

    // Defensive fallback for unexpected object payloads from older API shapes.
    return Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry === true)
      .map(([key]) => key)
      .map((permission) => String(permission || "").trim())
      .filter(Boolean) as CommunityPermissionValue[];
  }

  return [];
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Fetch and cache the current user's role & permissions for a community.
 *
 * @param communityId  The community to check access for.
 *                     Pass `null`/`undefined` to skip fetching.
 *
 * Usage:
 * ```tsx
 * const { can, role, isLoading } = useCommunityPermissions(communityId);
 * if (can(CommunityPermission.MARKETING_MANAGE)) { ... }
 * ```
 */
export function useCommunityPermissions(
  communityId: string | null | undefined,
): CommunityPermissionsState {
  const [role, setRole] = useState<CommunityRole>("none");
  const [permissions, setPermissions] = useState<CommunityPermissionValue[]>([]);
  const [isLoading, setIsLoading] = useState(!!communityId);
  const [error, setError] = useState<string | null>(null);

  // Track the latest communityId to prevent stale updates
  const latestId = useRef(communityId);
  latestId.current = communityId;

  const fetchAccess = useCallback(
    async (skipCache = false) => {
      if (!communityId) {
        setRole("none");
        setPermissions([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      // Check cache
      if (!skipCache) {
        const cached = cache.get(communityId);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          setRole(cached.role);
          setPermissions(cached.permissions);
          setIsLoading(false);
          setError(null);
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        const access = await communityAccessApi.getMyAccess(communityId);
        // Stale guard
        if (latestId.current !== communityId) return;

        const r = access.role ?? "none";
        const p = normalizePermissionList(access.permissions);
        const nextPermissions = p.length > 0
          ? p
          : [...(ROLE_PERMISSIONS[r] ?? [])];

        cache.set(communityId, { role: r, permissions: nextPermissions, ts: Date.now() });
        setRole(r);
        setPermissions(nextPermissions);
      } catch (e: any) {
        if (latestId.current !== communityId) return;
        setRole("none");
        setPermissions([]);
        setError(e?.message ?? "Failed to load permissions");
      } finally {
        if (latestId.current === communityId) {
          setIsLoading(false);
        }
      }
    },
    [communityId],
  );

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const permSet = useMemo(() => new Set(permissions), [permissions]);

  const can = useCallback(
    (p: CommunityPermissionValue) => permSet.has(p),
    [permSet],
  );

  const canAny = useCallback(
    (...perms: CommunityPermissionValue[]) => perms.some((p) => permSet.has(p)),
    [permSet],
  );

  const canAll = useCallback(
    (...perms: CommunityPermissionValue[]) => perms.every((p) => permSet.has(p)),
    [permSet],
  );

  const isStaff = role === "owner" || role === "admin" || role === "moderator" || role === "support";
  const isAdmin = role === "owner" || role === "admin";

  const refresh = useCallback(() => fetchAccess(true), [fetchAccess]);

  return {
    role,
    permissions,
    isLoading,
    error,
    can,
    canAny,
    canAll,
    isStaff,
    isAdmin,
    refresh,
  };
}
