"use client"

import Link from "next/link"
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Eye, Save, UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface CreatorCreateShellAction {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  variant?: "default" | "outline" | "secondary" | "ghost"
  icon?: "save" | "publish"
}

export interface CreatorCreateShellPreviewAction {
  label?: string
  href?: string
  onClick?: () => void
  disabled?: boolean
}

interface CreatorCreateShellProps {
  title: string
  description?: string
  backHref: string
  backLabel?: string
  communityName?: string
  communityMeta?: string
  autosaveStatus?: "idle" | "saving" | "saved" | "error"
  autosaveLabel?: string
  lastSavedAt?: string | Date | null
  publishBlocked?: boolean
  publishBlockedLabel?: string
  previewAction?: CreatorCreateShellPreviewAction
  mobileMode?: "blocked" | "limited" | "full"
  children: React.ReactNode
  sidebar?: React.ReactNode
  actions?: CreatorCreateShellAction[]
  className?: string
}

const ActionIcon = ({ icon }: { icon?: CreatorCreateShellAction["icon"] }) => {
  if (icon === "publish") return <UploadCloud className="h-4 w-4" />
  return <Save className="h-4 w-4" />
}

export function CreatorCreateShell({
  title,
  description,
  backHref,
  backLabel = "Back",
  communityName,
  communityMeta,
  autosaveStatus = "idle",
  autosaveLabel,
  lastSavedAt,
  publishBlocked = false,
  publishBlockedLabel = "Publish checks need attention",
  previewAction,
  mobileMode = "full",
  children,
  sidebar,
  actions = [],
  className,
}: CreatorCreateShellProps) {
  const autosaveText =
    autosaveLabel ||
    (autosaveStatus === "saving"
      ? "Saving locally"
      : autosaveStatus === "saved"
        ? "Draft saved locally"
        : autosaveStatus === "error"
          ? "Local draft not saved"
          : "Local draft ready")
  const savedAtLabel = lastSavedAt
    ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : null

  const previewButton = previewAction ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={previewAction.onClick}
      disabled={previewAction.disabled}
      className="gap-2"
      asChild={Boolean(previewAction.href)}
    >
      {previewAction.href ? (
        <Link href={previewAction.href}>
          <Eye className="h-4 w-4" />
          {previewAction.label || "Preview"}
        </Link>
      ) : (
        <>
          <Eye className="h-4 w-4" />
          {previewAction.label || "Preview"}
        </>
      )}
    </Button>
  ) : null

  return (
    <div className={cn("mx-auto max-w-6xl space-y-6 p-5 pb-32", className)}>
      {mobileMode === "blocked" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 md:hidden">
          This create flow needs a larger screen. You can review status here, then finish on desktop.
        </div>
      )}
      <header className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="mt-0.5 h-9 w-9 shrink-0 border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
            >
              <Link href={backHref} aria-label={backLabel}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold leading-tight tracking-normal text-gray-950 md:text-[28px]">
                {title}
              </h1>
              {description && (
                <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">{description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="max-w-full rounded-md border-gray-200 bg-gray-50 text-gray-900">
                  <span className="truncate">{communityName || "No community selected"}</span>
                </Badge>
                {communityMeta && (
                  <span className="min-w-0 truncate text-xs text-muted-foreground">{communityMeta}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {previewButton}
            {publishBlocked && (
              <div className="flex w-fit items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span className="whitespace-nowrap">{publishBlockedLabel}</span>
              </div>
            )}
            <div
              aria-live="polite"
              className={cn(
                "flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium",
                autosaveStatus === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-gray-200 bg-gray-50 text-gray-600",
              )}
            >
              {autosaveStatus === "saved" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Clock3 className={cn("h-4 w-4", autosaveStatus === "error" && "text-red-600")} />
              )}
              <span className="whitespace-nowrap">{savedAtLabel || autosaveText}</span>
            </div>
          </div>
        </div>
      </header>

      <div className={cn("grid gap-6", sidebar && "lg:grid-cols-[minmax(0,1fr)_320px]")}>
        <main className="min-w-0 space-y-6">{children}</main>
        {sidebar && <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">{sidebar}</aside>}
      </div>

      {actions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:left-64">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {actions.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant={action.variant || "default"}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className="w-full gap-2 sm:w-auto"
              >
                <ActionIcon icon={action.icon} />
                {action.loading ? "Working..." : action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
