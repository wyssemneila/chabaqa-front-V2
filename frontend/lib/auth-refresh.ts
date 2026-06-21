export function getBrowserCookie(name: string): string {
  if (typeof document === 'undefined') return ''

  const encodedName = `${encodeURIComponent(name)}=`
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName))

  return cookie ? decodeURIComponent(cookie.slice(encodedName.length)) : ''
}

function normalizeApiBase(apiBase: string): string {
  return apiBase.replace(/\/+$/, '')
}

function extractAccessToken(payload: any): string {
  const data = payload?.data || payload || {}
  return String(data.accessToken || data.access_token || '').trim()
}

function syncAccessTokenCookie(token: string): void {
  if (typeof document === 'undefined') return

  const secure =
    window.location.protocol === 'https:' || process.env.NODE_ENV === 'production'
  const securePart = secure ? '; Secure' : ''

  document.cookie = `accessToken=${token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${securePart}`
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

export async function refreshBrowserAccessToken(apiBase: string): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const csrfToken = getBrowserCookie('chabaqa_csrf')
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  const response = await fetch(`${normalizeApiBase(apiBase)}/auth/refresh`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: '{}',
  })

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
