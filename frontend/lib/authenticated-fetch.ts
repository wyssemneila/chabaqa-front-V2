// Universal authenticatedFetch that works in both client and server contexts

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // This will be handled differently based on context
  // In server components: cookies will be available
  // In client components: tokenManager will be used

  // Try to get token from different sources
  let token: string | null = null

  // Try server-side cookies first (won't work in browser)
  try {
    if (typeof window === 'undefined') {
      // Server-side: use cookies
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const accessToken = cookieStore.get('accessToken')
      token = accessToken?.value || null
    }
  } catch (error) {
    // Cookies not available, will try client-side
  }

  // Try client-side token manager
  if (!token && typeof window !== 'undefined') {
    try {
      const { tokenManager } = await import('@/lib/token-manager')
      token = tokenManager.getAccessToken()
    } catch (error) {
      // Token manager not available
    }
  }

  const headers = new Headers(options.headers || {})

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  headers.set('Content-Type', 'application/json')

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Ensure cookies are sent
    cache: options.cache || 'no-store',
  })
}
