"use client"

import type React from "react"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { CreatorLayout } from "@/components/creator-sidebar"
import { useAuthContext } from "@/app/providers/auth-provider"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading, isAuthenticated } = useAuthContext()
  const normalizedPathname = pathname.replace(/^\/(en|ar)(?=\/)/, "")
  const isWideDashboard =
    normalizedPathname === "/creator/analytics" ||
    normalizedPathname === "/creator/marketing/emails"

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-chabaqa-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className={cn(isWideDashboard ? "bg-white" : "bg-gray-50")}>
      <CreatorLayout>
        <div
          className={cn(
            "mx-auto w-full",
            isWideDashboard ? "max-w-none" : "max-w-7xl",
          )}
        >
          {children}
        </div>
      </CreatorLayout>
    </div>
  )
}
