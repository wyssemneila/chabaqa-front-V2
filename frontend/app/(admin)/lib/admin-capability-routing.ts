import type { AdminCapabilities } from "@/lib/api/admin-api"

const FALLBACK_PATH = "/admin/dashboard"

const LANDING_PRIORITY: Array<{ path: string; enabled: (caps: AdminCapabilities) => boolean }> = [
  { path: "/admin/dashboard", enabled: (caps) => caps.dashboard },
  { path: "/admin/users", enabled: (caps) => caps.users },
  { path: "/admin/communities", enabled: (caps) => caps.communities },
  { path: "/admin/content-moderation", enabled: (caps) => caps.contentModeration },
  { path: "/admin/financial", enabled: (caps) => caps.financial },
  { path: "/admin/analytics", enabled: (caps) => caps.analytics },
  { path: "/admin/security", enabled: (caps) => caps.security },
  { path: "/admin/communication", enabled: (caps) => caps.communication || caps.liveSupport },
  { path: "/admin/settings", enabled: (caps) => caps.settings },
]

type CapabilityGuard = keyof AdminCapabilities | ((caps: AdminCapabilities, path: string) => boolean) | null

const ROUTE_GUARDS: Array<{ prefix: string; guard: CapabilityGuard }> = [
  { prefix: "/admin/dashboard", guard: "dashboard" },
  { prefix: "/admin/users", guard: "users" },
  { prefix: "/admin/communities", guard: "communities" },
  { prefix: "/admin/content-moderation", guard: "contentModeration" },
  { prefix: "/admin/financial", guard: "financial" },
  { prefix: "/admin/analytics", guard: "analytics" },
  { prefix: "/admin/security", guard: "security" },
  {
    prefix: "/admin/communication/support",
    guard: (caps) => caps.liveSupport || caps.communication,
  },
  { prefix: "/admin/communication", guard: "communication" },
  { prefix: "/admin/settings", guard: "settings" },
  {
    prefix: "/admin/export",
    guard: (caps) => caps.financial || caps.security || caps.analytics || caps.dashboard,
  },
  {
    prefix: "/admin/data-management",
    guard: (caps) => caps.financial || caps.security || caps.analytics || caps.dashboard,
  },
]

export function getAdminLandingPath(capabilities: AdminCapabilities): string {
  const found = LANDING_PRIORITY.find((route) => route.enabled(capabilities))
  return found?.path ?? FALLBACK_PATH
}

export function canAccessAdminPath(path: string, capabilities: AdminCapabilities): boolean {
  if (path === "/admin" || path === "/admin/login" || path === "/admin/verify-2fa") {
    return true
  }

  const guard = ROUTE_GUARDS.find((entry) => path.startsWith(entry.prefix))?.guard
  if (!guard) return true
  if (typeof guard === "function") {
    return guard(capabilities, path)
  }
  return Boolean(capabilities[guard])
}

export function requiresCapabilityGuard(path: string): boolean {
  return ROUTE_GUARDS.some((entry) => path.startsWith(entry.prefix))
}
