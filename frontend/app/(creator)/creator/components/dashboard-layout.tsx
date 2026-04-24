"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "./dashboard-sidebar"
import { useAuthContext } from "@/app/providers/auth-provider"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const { user, loading, isAuthenticated, logout } = useAuthContext()

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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <DashboardSidebar user={user} onLogout={logout} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
