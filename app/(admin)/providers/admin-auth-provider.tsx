"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  adminApi,
  type AdminCapabilities,
  type AdminLoginResponse,
  type AdminSessionResponse,
} from "@/lib/api/admin-api"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { getAdminLandingPath } from "../lib/admin-capability-routing"

export interface AdminUser {
  _id: string
  name: string
  email: string
  role: string
  avatar?: string
  createdAt: string | Date
  lastLogin?: string | Date
  twoFactorEnabled?: boolean
}

interface AdminAuthContextType {
  admin: AdminUser | null
  roles: string[]
  permissions: string[]
  capabilities: AdminCapabilities
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ requires2FA: boolean; message?: string }>
  verify2FA: (email: string, code: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  syncSession: () => Promise<void>
  hasCapability: (capability: keyof AdminCapabilities) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000
const BYPASS_ADMIN_2FA = false
const ADMIN_ACCESS_TOKEN_KEY = "admin_access_token"
const ADMIN_REFRESH_TOKEN_KEY = "admin_refresh_token"
const ADMIN_USER_KEY = "admin_user"
const ADMIN_SESSION_KEY = "admin_session"

const EMPTY_CAPABILITIES: AdminCapabilities = {
  dashboard: false,
  users: false,
  communities: false,
  contentModeration: false,
  financial: false,
  analytics: false,
  security: false,
  communication: false,
  liveSupport: false,
  settings: false,
}

function clearStoredAdminAuth() {
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY)
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

function extractPayload<T>(response: { data?: T } | T): T {
  if (response && typeof response === "object" && "data" in response && response.data) {
    return response.data
  }

  return response as T
}

function normalizeAdmin(admin?: AdminSessionResponse["admin"] | AdminLoginResponse["admin"] | null): AdminUser | null {
  if (!admin) return null

  return {
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    createdAt: admin.createdAt,
    twoFactorEnabled: admin.twoFactorEnabled,
  }
}

function readStoredSession(): Partial<AdminSessionResponse> | null {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    clearStoredAdminAuth()
    return null
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [permissions, setPermissions] = useState<string[]>([])
  const [capabilities, setCapabilities] = useState<AdminCapabilities>(EMPTY_CAPABILITIES)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const normalizedPath = stripLocaleFromPath(pathname || "/")
  const isAdminAuthPage = normalizedPath === "/admin/login" || normalizedPath === "/admin/verify-2fa"
  const isAuthenticated = !!admin

  const resetSessionState = useCallback(() => {
    setAdmin(null)
    setAccessToken(null)
    setRoles([])
    setPermissions([])
    setCapabilities(EMPTY_CAPABILITIES)
  }, [])

  const applySessionPayload = useCallback((payload: Partial<AdminSessionResponse | AdminLoginResponse>) => {
    const nextAdmin = normalizeAdmin(payload.admin || null)
    const nextRoles = Array.isArray(payload.roles) ? payload.roles.map((role) => String(role)) : []
    const nextPermissions = Array.isArray(payload.permissions)
      ? payload.permissions.map((permission) => String(permission))
      : []
    const nextCapabilities = payload.capabilities || EMPTY_CAPABILITIES

    if (payload.access_token) {
      localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, payload.access_token)
      setAccessToken(payload.access_token)
    } else {
      setAccessToken(localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY))
    }

    if (payload.refresh_token) {
      localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, payload.refresh_token)
    }

    if (nextAdmin) {
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(nextAdmin))
      localStorage.setItem(
        ADMIN_SESSION_KEY,
        JSON.stringify({
          admin: nextAdmin,
          roles: nextRoles,
          permissions: nextPermissions,
          capabilities: nextCapabilities,
        }),
      )
    }

    setAdmin(nextAdmin)
    setRoles(nextRoles)
    setPermissions(nextPermissions)
    setCapabilities(nextCapabilities)
  }, [])

  const syncSession = useCallback(async (): Promise<void> => {
    const response = await adminApi.auth.me()
    const payload = extractPayload<AdminSessionResponse>(response)
    applySessionPayload(payload)
  }, [applySessionPayload])

  useEffect(() => {
    let cancelled = false

    const bootstrapAuth = async () => {
      try {
        const storedAccessToken = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY)
        const storedRefreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
        const storedSession = readStoredSession()
        const hasStoredSession = Boolean(storedAccessToken || storedRefreshToken || storedSession?.admin)

        if (storedAccessToken) {
          setAccessToken(storedAccessToken)
        }

        if (storedSession?.admin && !cancelled) {
          applySessionPayload(storedSession)
        }

        if (!isAdminAuthPage && hasStoredSession) {
          try {
            await syncSession()
          } catch (sessionError) {
            if (!storedRefreshToken) {
              clearStoredAdminAuth()
              if (!cancelled) {
                resetSessionState()
              }
              return
            }

            try {
              const refreshResponse = await adminApi.auth.refreshToken(storedRefreshToken)
              const refreshPayload = extractPayload<AdminSessionResponse>(refreshResponse)
              applySessionPayload(refreshPayload)
            } catch {
              clearStoredAdminAuth()
              if (!cancelled) {
                resetSessionState()
              }
            }
          }
        } else if (!isAdminAuthPage && !hasStoredSession && !cancelled) {
          resetSessionState()
        }
      } catch (bootstrapError) {
        clearStoredAdminAuth()
        if (!cancelled) {
          resetSessionState()
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [applySessionPayload, isAdminAuthPage, resetSessionState, syncSession])

  useEffect(() => {
    if (loading) return

    if (!isAuthenticated && !isAdminAuthPage) {
      const redirect = normalizedPath.startsWith("/admin") ? `?redirect=${encodeURIComponent(pathname)}` : ""
      router.replace(`${localizeHref(pathname || "/", "/admin/login")}${redirect}`)
      return
    }

    if (isAuthenticated && isAdminAuthPage) {
      router.replace(localizeHref(pathname || "/", getAdminLandingPath(capabilities)))
    }
  }, [capabilities, isAdminAuthPage, isAuthenticated, loading, normalizedPath, pathname, router])

  const login = useCallback(async (email: string, password: string): Promise<{ requires2FA: boolean; message?: string }> => {
    try {
      setError(null)
      setLoading(true)
      clearStoredAdminAuth()
      resetSessionState()

      const response = await adminApi.auth.login({ email, password })
      const data = extractPayload<AdminLoginResponse>(response)

      if (data.requires2FA && !BYPASS_ADMIN_2FA) {
        return {
          requires2FA: true,
          message: data.message,
        }
      }

      applySessionPayload(data)
      return { requires2FA: false, message: data.message }
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || "Login failed"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [applySessionPayload, resetSessionState])

  const verify2FA = useCallback(async (email: string, code: string): Promise<void> => {
    try {
      setError(null)
      setLoading(true)

      const response = await adminApi.auth.verify2FA({
        email,
        verificationCode: code,
      })
      const data = extractPayload<AdminLoginResponse>(response)
      applySessionPayload(data)
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || "2FA verification failed"
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [applySessionPayload])

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const storedRefreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
      if (!storedRefreshToken) {
        throw new Error("Missing admin refresh token")
      }

      const response = await adminApi.auth.refreshToken(storedRefreshToken)
      const data = extractPayload<AdminSessionResponse>(response)
      applySessionPayload(data)
    } catch (e) {
      console.error("[AdminAuth] Token refresh error:", e)
      throw e
    }
  }, [applySessionPayload])

  const logout = useCallback(async (): Promise<void> => {
    const hadSession =
      !!localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) ||
      !!localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) ||
      !!localStorage.getItem(ADMIN_SESSION_KEY)

    try {
      if (hadSession) {
        await adminApi.auth.logout().catch((err: any) => {
          console.error("[AdminAuth] Logout API error:", err)
        })
      }
    } finally {
      clearStoredAdminAuth()
      resetSessionState()
      setError(null)
      router.replace("/admin/login")
    }
  }, [resetSessionState, router])

  useEffect(() => {
    if (!isAuthenticated || isAdminAuthPage) return

    let cancelled = false

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken()
      } catch (refreshError) {
        if (cancelled) return
        clearStoredAdminAuth()
        resetSessionState()
        setError(null)
        router.replace("/admin/login")
      }
    }, TOKEN_REFRESH_INTERVAL)

    return () => {
      cancelled = true
      clearInterval(refreshInterval)
    }
  }, [isAdminAuthPage, isAuthenticated, refreshToken, resetSessionState, router])

  const hasCapability = useCallback(
    (capability: keyof AdminCapabilities) => Boolean(capabilities?.[capability]),
    [capabilities],
  )

  const value = useMemo<AdminAuthContextType>(() => ({
    admin,
    roles,
    permissions,
    capabilities,
    isAuthenticated,
    loading,
    error,
    login,
    verify2FA,
    logout,
    refreshToken,
    syncSession,
    hasCapability,
  }), [
    admin,
    roles,
    permissions,
    capabilities,
    isAuthenticated,
    loading,
    error,
    login,
    verify2FA,
    logout,
    refreshToken,
    syncSession,
    hasCapability,
  ])

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider")
  }
  return context
}
