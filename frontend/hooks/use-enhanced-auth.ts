"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/app/providers/auth-provider"
import { tokenManager } from "@/lib/token-manager"
import { secureStorage } from "@/lib/secure-storage"

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  user: any
  error: string | null
}

interface AuthActions {
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<void>
  logout: () => Promise<void>
  register: (data: any) => Promise<void>
  refreshToken: () => Promise<boolean>
  clearError: () => void
  requireAuth: (redirectTo?: string) => { isLoading: boolean; isAuthenticated: boolean }
}

export const useEnhancedAuth = (): AuthState & AuthActions => {
  const ctx = useAuthContext()
  const router = useRouter()
  const [localError, setLocalError] = useState<string | null>(null)

  // Enhanced authentication check
  const isAuthenticated = ctx.isAuthenticated && tokenManager.isAuthenticated()

  const clearError = useCallback(() => {
    setLocalError(null)
    // Clear context error if it exists
    if (ctx.error) {
      ctx.fetchMe() // This will clear the error in context
    }
  }, [ctx])

  const login = useCallback(async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      setLocalError(null)
      await ctx.login(credentials)
      
      // Store auth preferences
      if (credentials.rememberMe) {
        secureStorage.setAuthPreferences({ rememberMe: true })
      }
      
      // Get user info and store session
      const userInfo = tokenManager.getUserInfo()
      if (userInfo) {
        secureStorage.setUserSession(userInfo)
      }
    } catch (error: any) {
      setLocalError(error?.message || 'Login failed')
      throw error
    }
  }, [ctx])

  const register = useCallback(async (data: any) => {
    try {
      setLocalError(null)
      await ctx.register(data)
      
      // Store user session after successful registration
      const userInfo = tokenManager.getUserInfo()
      if (userInfo) {
        secureStorage.setUserSession(userInfo)
      }
    } catch (error: any) {
      setLocalError(error?.message || 'Registration failed')
      throw error
    }
  }, [ctx])

  const logout = useCallback(async () => {
    try {
      await ctx.logout()
      
      // Clear all local storage
      tokenManager.clearTokens()
      secureStorage.clear()
      
      // Redirect to login
      router.push('/signin')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if API call fails
      tokenManager.clearTokens()
      secureStorage.clear()
      router.push('/signin')
    }
  }, [ctx, router])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      // This will be handled automatically by tokenManager
      return tokenManager.isAuthenticated()
    } catch (error) {
      console.error('Token refresh failed:', error)
      return false
    }
  }, [])

  const requireAuth = useCallback((redirectTo: string = "/signin") => {
    const { loading } = ctx
    
    useEffect(() => {
      if (loading) return
      
      if (!isAuthenticated) {
        const currentPath = window.location.pathname
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        router.replace(redirectUrl)
      }
    }, [loading, isAuthenticated, redirectTo, router])
    
    return { isLoading: loading, isAuthenticated }
  }, [ctx, isAuthenticated, router])

  // Auto-refresh token on mount and periodically
  useEffect(() => {
    if (isAuthenticated) {
      // Check token validity periodically
      const interval = setInterval(() => {
        if (!tokenManager.isAuthenticated()) {
          logout()
        }
      }, 60000) // Check every minute

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, logout])

  // Listen for storage events (multi-tab logout)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.includes('accessToken') && !event.newValue) {
        // Token was cleared in another tab
        ctx.fetchMe() // This will update the auth state
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [ctx])

  // Restore session on page load
  useEffect(() => {
    const restoreSession = async () => {
      if (!ctx.user && tokenManager.isAuthenticated()) {
        const storedUser = secureStorage.getUserSession()
        if (storedUser) {
          await ctx.fetchMe()
        }
      }
    }

    restoreSession()
  }, [ctx])

  return {
    // State
    isLoading: ctx.loading,
    isAuthenticated,
    user: ctx.user,
    error: localError || ctx.error,
    
    // Actions
    login,
    logout,
    register,
    refreshToken,
    clearError,
    requireAuth,
  }
}
