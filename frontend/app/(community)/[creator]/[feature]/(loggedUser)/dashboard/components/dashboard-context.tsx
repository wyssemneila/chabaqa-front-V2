"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useCommunityPermissions, type CommunityPermissionsState } from "@/hooks/use-community-permissions";
import type { CommunityRole, CommunityStaffRole } from "@/lib/permissions";

// ── Dashboard Context Types ────────────────────────────────────────────────

export interface DashboardContextValue extends CommunityPermissionsState {
  /** Community ID derived from URL params */
  communityId: string;
  /** Creator slug from URL */
  creatorSlug: string;
  /** Resolved staff role for dashboard routing */
  staffRole: CommunityStaffRole | null;
  /** Check if user can access a specific dashboard variant */
  canAccessDashboard: (variant: "admin" | "moderator" | "support") => boolean;
  /** Generate dashboard route for current community */
  getDashboardPath: (variant?: "admin" | "moderator" | "support") => string;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ── Role Resolution ────────────────────────────────────────────────────────

function resolveStaffRole(role: CommunityRole): CommunityStaffRole | null {
  switch (role) {
    case "owner":
    case "admin":
      return "admin";
    case "moderator":
      return "moderator";
    case "support":
      return "support";
    default:
      return null;
  }
}

const DASHBOARD_ROLE_REQUIREMENTS = {
  admin: ["owner", "admin"] as CommunityRole[],
  moderator: ["owner", "admin", "moderator"] as CommunityRole[],
  support: ["owner", "admin", "support"] as CommunityRole[],
} as const;

// ── Provider Component ─────────────────────────────────────────────────────

interface DashboardProviderProps {
  children: ReactNode;
  communityId: string;
  creatorSlug: string;
  feature: string;
}

export function DashboardProvider({
  children,
  communityId,
  creatorSlug,
  feature,
}: DashboardProviderProps) {
  const permissions = useCommunityPermissions(communityId);

  const value = useMemo<DashboardContextValue>(() => {
    const staffRole = resolveStaffRole(permissions.role);

    const canAccessDashboard = (
      variant: "admin" | "moderator" | "support"
    ): boolean => {
      return DASHBOARD_ROLE_REQUIREMENTS[variant].includes(permissions.role);
    };

    const getDashboardPath = (variant?: "admin" | "moderator" | "support") => {
      const base = `/${creatorSlug}/${feature}/dashboard`;
      return variant ? `${base}/${variant}` : base;
    };

    return {
      ...permissions,
      communityId,
      creatorSlug,
      staffRole,
      canAccessDashboard,
      getDashboardPath,
    };
  }, [permissions, communityId, creatorSlug, feature]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

// ── Role Guards ────────────────────────────────────────────────────────────

interface RequireDashboardAccessProps {
  children: ReactNode;
  variant: "admin" | "moderator" | "support";
  fallback?: ReactNode;
}

export function RequireDashboardAccess({
  children,
  variant,
  fallback,
}: RequireDashboardAccessProps) {
  const { canAccessDashboard, isLoading } = useDashboard();

  if (isLoading) {
    return null;
  }

  if (!canAccessDashboard(variant)) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
