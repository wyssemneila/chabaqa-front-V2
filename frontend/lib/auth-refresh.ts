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

async function issueBrowserCsrfToken(apiBase: string): Promise<void> {
  await fetch(`${normalizeApiBase(apiBase)}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  }).catch(() => undefined)
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
