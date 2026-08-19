// Universal authenticatedFetch that works in both client and server contexts

import {
  ensureBrowserCsrfToken,
  getBrowserCookie,
  issueBrowserCsrfToken,
  isCsrfTokenRejection,
} from '@/lib/auth-refresh'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function getApiBaseFromUrl(url: string): string {
  if (typeof window === 'undefined') return ''

  try {
    const parsed = new URL(url, window.location.origin)
    const apiIndex = parsed.pathname.indexOf('/api/')
    if (apiIndex >= 0) {
      return `${parsed.origin}${parsed.pathname.slice(0, apiIndex + 4)}`
    }
  } catch {
    // Fall through to the configured same-origin API base.
  }

  return '/api'
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token: string | null = null

  try {
    if (typeof window === 'undefined') {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      token = cookieStore.get('accessToken')?.value || null
    }
  } catch {
    // Cookies are unavailable in this context; try client storage below.
  }

  if (!token && typeof window !== 'undefined') {
    try {
      const { tokenManager } = await import('@/lib/token-manager')
      token = tokenManager.getAccessToken()
    } catch {
      // The request may be intentionally unauthenticated.
    }
  }

  const method = String(options.method || 'GET').toUpperCase()
  const isUnsafeBrowserRequest = typeof window !== 'undefined' && !SAFE_METHODS.has(method)
  const apiBase = isUnsafeBrowserRequest ? getApiBaseFromUrl(url) : ''

  if (isUnsafeBrowserRequest) {
    await ensureBrowserCsrfToken(apiBase)
  }

  const doRequest = () => {
    const headers = new Headers(options.headers || {})

    if (token) headers.set('Authorization', `Bearer ${token}`)
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json')
    }

    if (isUnsafeBrowserRequest) {
      const csrfToken = getBrowserCookie('chabaqa_csrf')
      if (csrfToken) headers.set('X-CSRF-Token', csrfToken)
    }

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      cache: options.cache || 'no-store',
    })
  }

  let response = await doRequest()

  // A stale/missing double-submit token is recoverable. Rotate it and retry the
  // original request once; genuine authorization failures remain untouched.
  if (isUnsafeBrowserRequest && await isCsrfTokenRejection(response)) {
    await issueBrowserCsrfToken(apiBase)
    response = await doRequest()
  }

  return response
}
