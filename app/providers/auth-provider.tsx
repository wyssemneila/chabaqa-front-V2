"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { normalizeUser } from "@/lib/hooks/useUser"
import { registerBrowserPushForCurrentUser } from "@/lib/push-notifications"
import { io, Socket } from "socket.io-client"
import { resolveSocketBaseUrl } from "@/lib/socket-url"
import { localizeHref } from "@/lib/i18n/client"

export interface User {
  _id: string
  name: string
  username?: string
  email: string
  role: string
  [key: string]: any
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  register: (payload: any) => Promise<void>
  login: (payload: { email: string; password: string; rememberMe?: boolean }) => Promise<void>
  updateAuth: (accessToken: string, user: any) => void
  logout: () => Promise<void>
  fetchMe: () => Promise<User | null>
  token?: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const ACCESS_TOKEN_COOKIE_NAME = 'accessToken'
const ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

function extractAccessTokenFromResponse(payload: any): string {
  const rawToken =
    payload?.accessToken ||
    payload?.access_token ||
    payload?.token ||
    payload?.jwt ||
    ''

  return String(rawToken || '').trim()
}

function extractRefreshTokenFromResponse(payload: any): string {
  const rawToken =
    payload?.refreshToken ||
    payload?.refresh_token ||
    ''

  return String(rawToken || '').trim()
}
function clearAllAuthCookies() {
  if (typeof document === 'undefined') return
  const isSecure =
    (typeof window !== 'undefined' && window.location.protocol === 'https:') ||
    process.env.NODE_ENV === 'production'
  const securePart = isSecure ? '; Secure' : ''
  
  // Clear cookies with multiple names and paths for thorough cleanup
  const cookieNames = ['accessToken', 'access_token', 'token', 'refreshToken', 'refresh_token']
  const paths = ['/', '/en', '/ar', '/api', '/creator', '/admin', '/dashboard']
  
  for (const name of cookieNames) {
    for (const path of paths) {
      document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax${securePart}`
      document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Strict${securePart}`
      document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 UTC${securePart}`
      // Also try without Secure for local dev
      document.cookie = `${name}=; Path=${path}; Max-Age=0; SameSite=Lax`
    }
  }
}



function syncAccessTokenCookie(accessToken: string | null) {
  if (typeof document === 'undefined') return
  const isSecure =
    (typeof window !== 'undefined' && window.location.protocol === 'https:') ||
    process.env.NODE_ENV === 'production'
  const securePart = isSecure ? '; Secure' : ''

  if (!accessToken) {
    // Clear cookie with multiple methods for better browser compatibility
    document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${securePart}`
    document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax${securePart}`
    return
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${ACCESS_TOKEN_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${securePart}`
}

function extractErrorMessage(data: any): string {
  if (typeof data?.error?.message === 'string' && data.error.message.trim()) {
    return data.error.message.trim()
  }
  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }
  if (Array.isArray(data?.message) && data.message.length > 0) {
    return String(data.message[0])
  }
  return 'Login failed'
}

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const padding = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4))
  return atob(base64 + padding)
}

function isSafeRedirectPath(path: string | null): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//')
}

function parseHashUserPayload(userEncoded: string): any {
  try {
    return JSON.parse(decodeBase64Url(userEncoded))
  } catch {
    return JSON.parse(userEncoded)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const pushRegistrationAttemptedForUserRef = useRef<string | null>(null)
  const presenceSocketRef = useRef<Socket | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const isAuthenticated = !!user

  const fetchMe = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
      setToken(token)
      if (!token) {
        syncAccessTokenCookie(null)
        setUser(null)
        setLoading(false)
        return null
      }

      // Normalize legacy key to the middleware-consumed key.
      localStorage.setItem('accessToken', token)
      localStorage.removeItem('access_token')

      // Keep middleware-accessible cookie synced with local storage token.
      syncAccessTokenCookie(token)

      // We can just use the stored user if we want to be super simple, 
      // or verify token with backend. For now, let's verify.
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (res.ok) {
        const data = await res.json()
        const userData = data.data || data
        const normalizedUser = normalizeUser(userData)
        setUser(normalizedUser)
        return normalizedUser
      } else {
        // Token invalid
        localStorage.removeItem('accessToken')
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        syncAccessTokenCookie(null)
        setUser(null)
        return null
      }
    } catch (e) {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (payload: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      setError(null)
      // Use configured API URL or fallback to APP_URL/api, then localhost
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 
                     (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api` : "http://localhost:3000/api")
      
      const normalizedPayload = {
        email: String(payload.email || '').trim().toLowerCase(),
        password: String(payload.password || ''),
        remember_me: Boolean(payload.rememberMe),
      }

      console.log(`Attempting login to: ${apiBase}/auth/login`);

      let res;
      try {
        res = await fetch(`${apiBase}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(normalizedPayload)
        });
      } catch (fetchError: any) {
        console.error('Network error:', fetchError);
        throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(extractErrorMessage(data))
      }

      // Handle potential data wrapping (e.g. { data: { user, accessToken } })
      const responseData = data.data || data;
      const accessToken = extractAccessTokenFromResponse(responseData)
      const refreshToken = extractRefreshTokenFromResponse(responseData)
      const user = responseData?.user

      if (!user || !accessToken) {
        console.error("Login response missing user data:", data);
        throw new Error("Invalid server response: auth payload missing");
      }

      localStorage.setItem('accessToken', accessToken)
      localStorage.removeItem('access_token')
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      localStorage.setItem('user', JSON.stringify(user))
      syncAccessTokenCookie(accessToken)
      setToken(accessToken)
      const normalizedUser = normalizeUser(user)
      setUser(normalizedUser)

      const redirectParam = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('redirect') ||
          new URLSearchParams(window.location.search).get('returnUrl')
        : null
      const safeRedirect =
        redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
          ? redirectParam
          : null
      if (safeRedirect && safeRedirect !== localizeHref(pathname || '/', '/signin')) {
        router.push(localizeHref(pathname || '/', safeRedirect))
        return
      }

      // Redirect based on role
      const role = user.role?.toLowerCase()
      if (role === 'creator') {
        router.push(localizeHref(pathname || '/', '/creator/dashboard'))
      } else if (role === 'admin') {
        router.push(localizeHref(pathname || '/', '/admin'))
      } else {
        router.push(localizeHref(pathname || '/', '/explore'))
      }

    } catch (e: any) {
      console.error("Login error:", e);
      const errorMessage = e?.message || 'Login failed';
      setError(errorMessage);
      // Show user-friendly message for connection errors
      if (errorMessage.includes('Unable to connect') || errorMessage.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your internet connection.');
      }
      throw e
    }
  }, [router, pathname])

  const updateAuth = useCallback((accessToken: string, userData: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken)
      localStorage.removeItem('access_token')
      localStorage.setItem('user', JSON.stringify(userData))
    }
    syncAccessTokenCookie(accessToken)
    setToken(accessToken)
    const normalizedUser = normalizeUser(userData)
    setUser(normalizedUser)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const rawHash = window.location.hash?.replace(/^#/, '')
    if (!rawHash) return

    const hashParams = new URLSearchParams(rawHash)
    const accessToken = (hashParams.get('access_token') || hashParams.get('accessToken') || '').trim()
    const userEncoded = hashParams.get('user')
    const redirectFromHash = hashParams.get('redirect')

    if (!accessToken || !userEncoded) return

    try {
      const userData = parseHashUserPayload(userEncoded)
      updateAuth(accessToken, userData)

      const cleanUrl = `${window.location.pathname}${window.location.search}`
      window.history.replaceState({}, document.title, cleanUrl)

      if (isSafeRedirectPath(redirectFromHash) && redirectFromHash !== localizeHref(pathname || '/', '/signin')) {
        router.replace(localizeHref(pathname || '/', redirectFromHash))
        return
      }

      const role = String(userData?.role || '').toLowerCase()
      if (role === 'creator') {
        router.replace(localizeHref(pathname || '/', '/creator/dashboard'))
      } else if (role === 'admin') {
        router.replace(localizeHref(pathname || '/', '/admin'))
      } else {
        router.replace(localizeHref(pathname || '/', '/explore'))
      }
    } catch (hashError) {
      console.error('Failed to finalize OAuth hash login:', hashError)
    }
  }, [pathname, router, updateAuth])

  // Keep a lightweight DM socket connected for all authenticated web users.
  // This makes cross-platform presence (mobile online dots) accurate everywhere on web.
  useEffect(() => {
    const userId = user?._id ? String(user._id) : ""
    const accessToken = token ? String(token).trim() : ""

    if (!isAuthenticated || !userId || !accessToken) {
      if (presenceSocketRef.current) {
        presenceSocketRef.current.disconnect()
        presenceSocketRef.current = null
      }
      return
    }

    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    const socket = io(`${socketUrl}/dm`, {
      auth: {
        token: `Bearer ${accessToken}`,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
    presenceSocketRef.current = socket

    return () => {
      socket.disconnect()
      if (presenceSocketRef.current === socket) {
        presenceSocketRef.current = null
      }
    }
  }, [isAuthenticated, user?._id, token])

  const register = useCallback(async (payload: any) => {
    try {
      setError(null)
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
      
      let res;
      try {
        res = await fetch(`${apiBase}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (fetchError: any) {
        console.error('Network error during registration:', fetchError);
        throw new Error('Unable to connect to server. Please check your internet connection or try again later.');
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Auto login after register? Or just redirect to login.
      // For simplicity, let's just return and let the component handle it (usually redirect to login)
      // Or if the backend returns a token, we can auto-login.
      const registerToken = extractAccessTokenFromResponse(data)
      if (data.user && registerToken) {
        localStorage.setItem('accessToken', registerToken)
        localStorage.removeItem('access_token')
        localStorage.setItem('user', JSON.stringify(data.user))
        syncAccessTokenCookie(registerToken)
        setToken(registerToken)
        const normalizedUser = normalizeUser(data.user)
        setUser(normalizedUser)
        router.push(localizeHref(pathname || '/', '/explore'))
      }

    } catch (e: any) {
      const errorMessage = e?.message || 'Registration failed';
      setError(errorMessage);
      // Show user-friendly message for connection errors
      if (errorMessage.includes('Unable to connect') || errorMessage.includes('Failed to fetch')) {
        setError('Unable to connect to server. Please check your internet connection.');
      }
      throw e
    }
  }, [router, pathname])

  const logout = useCallback(async () => {
    // 1. Save the current token BEFORE clearing (needed for backend API calls)
    const currentToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token')
    
    // 2. Call the backend logout endpoints FIRST (while we still have the token)
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 
                   (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api` : "http://localhost:3000/api")
    
    const authHeaders: HeadersInit = currentToken 
      ? { 'Authorization': `Bearer ${currentToken}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' }
    
    // Revoke tokens on the backend (parallel, non-blocking)
    await Promise.allSettled([
      fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      }).catch(() => {}),
      fetch(`${apiBase}/auth/revoke-all-tokens`, {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      }).catch(() => {}),
    ])

    // 3. Clear all local storage keys
    localStorage.removeItem('accessToken')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('auth-preferences')
    localStorage.removeItem('user-session')
    
    // 4. Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
    }

    // 5. Clear client-side cookies (non-httpOnly ones)
    clearAllAuthCookies()
    syncAccessTokenCookie(null)
    
    // 6. Clear React state
    setToken(null)
    setUser(null)

    // 7. Navigate to the server-side signout route which clears httpOnly cookies
    // and redirects to signin. This is a full navigation (not fetch) so the
    // browser processes Set-Cookie headers before reaching the signin page.
    window.location.href = '/api/auth/signout'
  }, [pathname])

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    const userId = user?._id ? String(user._id) : null;
    if (!isAuthenticated || !userId) {
      pushRegistrationAttemptedForUserRef.current = null;
      return;
    }

    if (pushRegistrationAttemptedForUserRef.current === userId) {
      return;
    }
    pushRegistrationAttemptedForUserRef.current = userId;

    registerBrowserPushForCurrentUser(userId).catch((pushError) => {
      console.warn('Push registration skipped:', pushError);
    });
  }, [isAuthenticated, user?._id])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    updateAuth,
    logout,
    fetchMe,
    token,
  }), [user, loading, error, isAuthenticated, register, login, updateAuth, logout, fetchMe, token])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider")
  return ctx
}
