"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/app/providers/auth-provider"

export const useAuth = () => {
  const ctx = useAuthContext()
  const router = useRouter()

  const requireAuth = (redirectTo: string = "/signin") => {
    const { loading, isAuthenticated } = ctx
    useEffect(() => {
      if (loading) return
      if (!isAuthenticated) {
        const currentPath = window.location.pathname
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
        router.replace(redirectUrl)
      }
    }, [loading, isAuthenticated, redirectTo, router])
    return { isLoading: loading, isAuthenticated }
  }

  return {
    ...ctx,
    requireAuth,
  }
}