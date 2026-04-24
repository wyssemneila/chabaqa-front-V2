"use client"

import { usePathname } from "next/navigation"
import { useAdminAuth } from "../providers/admin-auth-provider"
import { AdminLayoutProvider } from "../providers/admin-layout-provider"
import { AdminSidebar } from "../_components/admin-sidebar"
import { AdminHeader } from "../_components/admin-header"
import { SkipNav } from "../_components/skip-nav"
import { Toaster } from "sonner"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { canAccessAdminPath, getAdminLandingPath, requiresCapabilityGuard } from "../lib/admin-capability-routing"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading, capabilities, isAuthenticated } = useAdminAuth()
  const pathname = usePathname()
  const t = useTranslations("admin.dashboard")
  const routingT = useTranslations("admin.routing")
  const internalPath = stripLocaleFromPath(pathname)
  const isAuthPage =
    internalPath === "/admin/login" ||
    internalPath === "/admin/verify-2fa" ||
    internalPath === "/login"

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div
        className="admin-shell flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label={t("loadingDashboard")}
      >
        <div className="admin-surface rounded-3xl px-10 py-8">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
        <span className="sr-only">{t("loadingDashboardData")}</span>
      </div>
    )
  }

  if (isAuthPage) {
    return <>{children}</>
  }

  const canAccessCurrentRoute = canAccessAdminPath(internalPath, capabilities)

  if (isAuthenticated && requiresCapabilityGuard(internalPath) && !canAccessCurrentRoute) {
    const landingPath = getAdminLandingPath(capabilities)
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center p-6">
        <div className="admin-surface w-full max-w-xl rounded-3xl border border-[hsl(var(--admin-border)/0.75)] p-4 sm:p-6 lg:p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold">{routingT("accessRestrictedTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {routingT("accessRestrictedDescription")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href={localizeHref(pathname, landingPath)}>{routingT("goToAllowedArea")}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={localizeHref(pathname, "/admin")}>{routingT("reevaluateLanding")}</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminLayoutProvider>
      <SkipNav />
      <div className="admin-shell min-h-screen">
        <AdminSidebar />
        <div className="lg:pl-72">
          <div className="px-4 pt-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1480px]">
              <AdminHeader />
            </div>
          </div>
          <main 
            id="main-content" 
            className="admin-page px-4 pb-10 pt-6 sm:px-6 lg:px-8"
            role="main"
            aria-label="Main content"
            tabIndex={-1}
          >
            <div className="mx-auto w-full max-w-[1480px]">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton 
        expand={false}
        duration={4000}
      />
    </AdminLayoutProvider>
  )
}
