'use client'

/**
 * Shared utility for syncing the access token to a JS-accessible cookie.
 *
 * Why this exists:
 * - The backend sets an httpOnly `accessToken` cookie on every auth operation.
 * - httpOnly cookies cannot be read or written by JavaScript, so the frontend
 *   cannot update them after a client-side token refresh.
 * - We maintain a parallel non-httpOnly `accessToken` cookie via JS so that the
 *   Next.js middleware (running at the edge) can always read the latest token.
 * - Both cookies share the same name: `accessToken`. They must be kept in sync.
 *
 * Every place that updates the access token MUST call syncAccessTokenCookie():
 *   - auth-provider.tsx  (login, OAuth callback, fetchMe refresh)
 *   - lib/api/client.ts  (tryRefreshToken)
 *   - lib/token-manager.ts (setAccessToken)
 *   - lib/token-storage.ts (clearTokens)
 */

const COOKIE_NAME = 'accessToken'
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days — covers the longest refresh token window

export function syncAccessTokenCookie(token: string | null): void {
  if (typeof document === 'undefined') return

  const secure =
    window.location.protocol === 'https:' || process.env.NODE_ENV === 'production'
  const s = secure ? '; Secure' : ''

  if (!token) {
    // Clear with both Max-Age and Expires for maximum browser compatibility
    document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${s}`
    document.cookie = `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax${s}`
    return
  }

  // JWT tokens only use base64url chars (A-Za-z0-9-_.) — safe in cookie values without encoding
  document.cookie = `${COOKIE_NAME}=${token}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${s}`
}
