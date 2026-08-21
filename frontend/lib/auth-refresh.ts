import { syncAccessTokenCookie } from '@/lib/cookie-sync'

export function getBrowserCookie(name: string): string {
  if (typeof document === 'undefined') return ''

  const encodedName = `${encodeURIComponent(name)}=`
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName))

  return cookie ? decodeURIComponent(cookie.slice(encodedName.length)) : ''
}

export function hasBrowserRefreshSession(): boolean {
  if (typeof document === 'undefined') return false

  return Boolean(
    getBrowserCookie('refreshToken') ||
    getBrowserCookie('refresh_token') ||
    getBrowserCookie('accessToken') ||
    getBrowserCookie('access_token'),
  )
}

function normalizeApiBase(apiBase: string): string {
  return apiBase.replace(/\/+$/, '')
}

function extractAccessToken(payload: any): string {
  const data = payload?.data || payload || {}
  return String(data.accessToken || data.access_token || '').trim()
}

function notifyAccessTokenChanged(accessToken: string): void {
  try {
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      newValue: accessToken,
    }))
  } catch {
    window.dispatchEvent(new Event('auth-token-refreshed'))
  }
}

let csrfIssuePromise: Promise<string> | null = null

/**
 * Issue a fresh double-submit CSRF cookie and return its value.
 * Calls are single-flight so concurrent uploads/profile saves do not rotate the
 * cookie underneath one another.
 */
export async function issueBrowserCsrfToken(apiBase: string): Promise<string> {
  if (typeof window === 'undefined') return ''
  if (csrfIssuePromise) return csrfIssuePromise

  csrfIssuePromise = (async () => {
    const response = await fetch(`${normalizeApiBase(apiBase)}/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    })
    if (!response.ok) return ''

    const payload = await response.json().catch(() => ({}))
    return String(payload?.data?.csrfToken || payload?.csrfToken || getBrowserCookie('chabaqa_csrf')).trim()
  })().catch(() => '').finally(() => {
    csrfIssuePromise = null
  })

  return csrfIssuePromise
}

export async function ensureBrowserCsrfToken(apiBase: string): Promise<string> {
  return getBrowserCookie('chabaqa_csrf') || issueBrowserCsrfToken(apiBase)
}

/** True only for the backend's double-submit CSRF rejection, never generic 403s. */
export async function isCsrfTokenRejection(response: Response): Promise<boolean> {
  if (response.status !== 403) return false

  try {
    // Native fetch responses are cloned so the caller can still read the body.
    // The fallback keeps this helper compatible with lightweight test responses.
    const readable = typeof response.clone === 'function' ? response.clone() : response
    const payload = await readable.json()
    const text = [payload?.code, payload?.message, payload?.error]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
    return /CSRF_TOKEN_INVALID|csrf token is missing or invalid/i.test(text)
  } catch {
    return false
  }
}

async function requestAccessTokenRefresh(apiBase: string): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const csrfToken = getBrowserCookie('chabaqa_csrf')
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  return fetch(`${normalizeApiBase(apiBase)}/auth/refresh`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: '{}',
  })
}

export async function refreshBrowserAccessToken(
  apiBase: string,
  options: { skipWhenNoSessionHint?: boolean } = {},
): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (options.skipWhenNoSessionHint && !hasBrowserRefreshSession()) return null

  if (!getBrowserCookie('chabaqa_csrf')) {
    await issueBrowserCsrfToken(apiBase)
  }

  let response = await requestAccessTokenRefresh(apiBase)
  if (response.status === 403) {
    await issueBrowserCsrfToken(apiBase)
    response = await requestAccessTokenRefresh(apiBase)
  }

  if (!response.ok) return null

  const payload = await response.json().catch(() => ({}))
  const accessToken = extractAccessToken(payload)
  if (!accessToken) return null

  localStorage.setItem('accessToken', accessToken)
  localStorage.removeItem('access_token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('refresh_token')
  syncAccessTokenCookie(accessToken)
  notifyAccessTokenChanged(accessToken)

  return accessToken
}
