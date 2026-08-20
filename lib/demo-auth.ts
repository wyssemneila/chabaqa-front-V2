/**
 * Frontend-only demo auth helpers.
 *
 * Flow:
 *  1. User clicks "Try Demo" (or signs in with demo@demo.com / demo123)
 *  2. Browser is redirected to /api/auth/demo?role=creator
 *  3. That API route signs a real JWT with the same secret used by middleware
 *     and sets it as the `accessToken` cookie → redirects to the dashboard
 *  4. On page load, auth-provider's fetchMe() reads the cookie (localStorage is
 *     empty after a fresh server-side redirect), detects isDemoToken(), builds
 *     the user object from the JWT payload and skips the /auth/me backend call.
 */

/** sub values embedded in JWTs issued by /api/auth/demo */
const DEMO_SUBS = new Set(["demo-learner", "demo-creator", "demo-admin"])

/** Parse a JWT payload client-side without verification (for display / detection only) */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, part] = token.split(".")
    const padded   = part.replace(/-/g, "+").replace(/_/g, "/")
    const padding  = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4))
    return JSON.parse(atob(padded + padding))
  } catch {
    return null
  }
}

/** Returns true when the token was issued by /api/auth/demo */
export function isDemoToken(token: string | null): boolean {
  if (!token) return false
  const p = parseJwtPayload(token)
  return typeof p?.sub === "string" && DEMO_SUBS.has(p.sub)
}

/** Build a plain user object from a demo JWT payload */
export function userFromDemoPayload(payload: Record<string, unknown>) {
  return {
    _id:      String(payload.sub      ?? "demo-creator"),
    name:     String(payload.name     ?? "Demo User"),
    username: String(payload.username ?? "demo_user"),
    email:    String(payload.email    ?? "demo@demo.com"),
    role:     String(payload.role     ?? "creator"),
  }
}

/**
 * Read the `accessToken` cookie value directly from document.cookie.
 * Used to sync a server-set cookie back into localStorage when the
 * auth-provider initialises after a demo/OAuth redirect.
 */
export function readAccessTokenCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Hardcoded demo credentials — used to intercept sign-in form submission */
export const DEMO_CREDENTIALS = {
  email:    "demo@demo.com",
  password: "demo123",
} as const
