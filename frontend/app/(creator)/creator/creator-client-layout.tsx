"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Bell, CalendarDays, Home, Monitor, Wallet } from "lucide-react"
import { DashboardLayout } from "@/app/(creator)/creator/components/dashboard-layout"
import { CreatorCommunityProvider } from "@/app/(creator)/creator/context/creator-community-context"
import { Toaster } from "@/components/ui/toaster"
import { ExtensionErrorGuard } from "@/app/(auth)/components/extension-error-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/app/providers/auth-provider"
import { cn } from "@/lib/utils"

const CreatorNotificationListener = dynamic(
  () => import("@/app/(creator)/creator/components/creator-notification-listener").then(mod => ({ default: mod.CreatorNotificationListener })),
  { ssr: false }
)

const MOBILE_STATUS_PAGES = [
  { label: "Home", href: "/creator/dashboard", icon: Home },
  { label: "Alerts", href: "/creator/notifications", icon: Bell },
  { label: "Money", href: "/creator/monetization/payouts", icon: Wallet },
  { label: "Bookings", href: "/creator/sessions/bookings", icon: CalendarDays },
  { label: "Stats", href: "/creator/analytics", icon: BarChart3 },
]

const normalizeCreatorPathname = (pathname: string) => pathname.replace(/^\/(en|ar)(?=\/)/, "")

const isMobileStatusPath = (pathname: string) =>
  MOBILE_STATUS_PAGES.some((item) => {
    const normalizedPathname = normalizeCreatorPathname(pathname)
    return normalizedPathname === item.href || normalizedPathname.startsWith(`${item.href}/`)
  })

export default function CreatorClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false)
  const [hasCheckedViewport, setHasCheckedViewport] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { loading, isAuthenticated } = useAuthContext()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // Tailwind md breakpoint
      setHasCheckedViewport(true)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin")
    }
  }, [loading, isAuthenticated, router])

  if (loading || !hasCheckedViewport) {
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
    <CreatorCommunityProvider>
      <ExtensionErrorGuard />
      <CreatorNotificationListener />
      {isMobile ? (
        <MobileCreatorStatusLayout pathname={pathname}>{children}</MobileCreatorStatusLayout>
      ) : (
        <DashboardLayout>{children}</DashboardLayout>
      )}
      <Toaster
        viewportClassName="top-4 right-4 left-auto bottom-auto w-[calc(100vw-2rem)] max-w-[420px] flex-col sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto sm:w-full sm:max-w-[420px] sm:flex-col"
      />
    </CreatorCommunityProvider>
  )
}

function MobileCreatorStatusLayout({
  children,
  pathname,
}: {
  children: React.ReactNode
  pathname: string
}) {
  const normalizedPathname = normalizeCreatorPathname(pathname)
  const canShowStatusPage = isMobileStatusPath(pathname)

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Creator</p>
            <h1 className="text-base font-semibold leading-tight">Status Dashboard</h1>
          </div>
          <Badge variant="outline" className="shrink-0 border-blue-200 bg-blue-50 text-blue-700">
            Read-only
          </Badge>
        </div>
      </header>

      {canShowStatusPage ? (
        <main className="mx-auto w-full max-w-3xl px-3 py-4 pb-24">{children}</main>
      ) : (
        <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md flex-col justify-center px-5 py-10 pb-28 text-center">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Monitor className="h-6 w-6 text-gray-700" />
            </div>
            <h2 className="text-xl font-semibold text-gray-950">Desktop Needed</h2>
            <p className="mt-2 text-sm text-gray-600">
              Creation, editing, and advanced management stay on desktop. On mobile you can still check your most important creator status.
            </p>
            <div className="mt-5 grid gap-2">
              {MOBILE_STATUS_PAGES.map((item) => {
                const Icon = item.icon
                return (
                  <Button key={item.href} variant="outline" className="justify-start" asChild>
                    <Link href={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>
        </main>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1">
          {MOBILE_STATUS_PAGES.map((item) => {
            const Icon = item.icon
            const isActive = normalizedPathname === item.href || normalizedPathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium text-gray-500",
                  isActive && "bg-gray-100 text-gray-950"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
