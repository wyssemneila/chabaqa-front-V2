"use client"

import type React from "react"
import type { ComponentType } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CREATOR_EMPTY_STATE_DEFINITIONS, type CreatorEmptyStateModule } from "@/lib/creator-dashboard/empty-state-definitions"
import {
  Loader2,
  AlertCircle,
  SearchX,
  ShieldAlert,
  Building,
  Clock,
  PackageOpen,
  RefreshCw,
  ArrowRight,
  Plus,
} from "lucide-react"
import Link from "next/link"

type CreatorStateIcon = ComponentType<{ className?: string }>

export type PageStateVariant =
  | "loading"
  | "refreshing"
  | "empty"
  | "no-results"
  | "error"
  | "no-permission"
  | "no-community"
  | "unavailable"
  | "coming-soon"

interface PageStateAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: "default" | "outline" | "ghost" | "secondary"
  icon?: CreatorStateIcon
}

interface PageStateProps {
  variant: PageStateVariant
  title?: string
  description?: string
  icon?: CreatorStateIcon
  actions?: PageStateAction[]
  onRetry?: () => void
  className?: string
  compact?: boolean
  children?: React.ReactNode
}

const VARIANT_DEFAULTS: Record<
  PageStateVariant,
  { icon: CreatorStateIcon; title: string; description: string }
> = {
  loading: { icon: Loader2, title: "Loading…", description: "Fetching your data, please wait." },
  refreshing: { icon: RefreshCw, title: "Refreshing…", description: "Updating your data." },
  empty: { icon: PackageOpen, title: "Nothing here yet", description: "Get started by creating your first item." },
  "no-results": { icon: SearchX, title: "No results found", description: "Try adjusting your search or filter criteria." },
  error: { icon: AlertCircle, title: "Something went wrong", description: "We couldn’t load this page. Please try again." },
  "no-permission": { icon: ShieldAlert, title: "Access restricted", description: "You don’t have permission to view this section. Contact your community owner to request access." },
  "no-community": { icon: Building, title: "No community selected", description: "Select or create a community to start managing your content." },
  unavailable: { icon: AlertCircle, title: "Feature unavailable", description: "This feature is temporarily unavailable. Please check back soon." },
  "coming-soon": { icon: Clock, title: "Coming soon", description: "We’re building this feature and it will be available shortly." },
}

export function PageState({ variant, title, description, icon, actions, onRetry, className, compact = false, children }: PageStateProps) {
  const defaults = VARIANT_DEFAULTS[variant]
  const Icon = icon || defaults.icon
  const resolvedTitle = title || defaults.title
  const resolvedDescription = description || defaults.description
  const isSpinning = variant === "loading" || variant === "refreshing"

  if (variant === "loading" && compact) {
    return <PageStateSkeleton className={className} />
  }

  const allActions: PageStateAction[] = [...(actions || [])]
  if (onRetry && variant === "error") {
    allActions.unshift({ label: "Try again", onClick: onRetry, variant: "default", icon: RefreshCw })
  }
  if (variant === "no-community" && allActions.length === 0) {
    allActions.push({ label: "Create Community", href: "/creator/communities/create", variant: "default", icon: Plus })
  }

  return (
    <EnhancedCard className={cn("border-dashed", compact ? "py-6" : "py-12", className)}>
      <CardContent className="flex flex-col items-center justify-center text-center">
        <div className={cn("mb-4 rounded-full p-3",
          variant === "error" && "bg-destructive/10",
          variant === "no-permission" && "bg-amber-50",
          variant === "coming-soon" && "bg-primary/5",
          (variant === "empty" || variant === "no-results" || variant === "no-community") && "bg-muted",
        )}>
          <Icon className={cn(compact ? "h-8 w-8" : "h-10 w-10",
            isSpinning && "animate-spin",
            variant === "error" && "text-destructive",
            variant === "no-permission" && "text-amber-600",
            variant === "coming-soon" && "text-primary",
            (variant === "empty" || variant === "no-results" || variant === "no-community" || variant === "unavailable") && "text-muted-foreground/60",
          )} />
        </div>
        <h3 className={cn("font-semibold", compact ? "text-base mb-1" : "text-lg mb-2")}>{resolvedTitle}</h3>
        <p className={cn("text-muted-foreground max-w-md", compact ? "text-xs mb-4" : "text-sm mb-6")}>{resolvedDescription}</p>
        {children}
        {allActions.length > 0 && (
          <div className="flex items-center gap-3">
            {allActions.map((action, i) => {
              const ActionIcon = action.icon
              const btn = (
                <Button key={i} variant={action.variant || (i === 0 ? "default" : "outline")} size={compact ? "sm" : "default"} onClick={action.onClick}>
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              )
              return action.href ? <Link key={i} href={action.href}>{btn}</Link> : btn
            })}
          </div>
        )}
      </CardContent>
    </EnhancedCard>
  )
}

export function PageStateSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
    </div>
  )
}

interface ModuleEmptyStateProps { module: CreatorEmptyStateModule; hasSearchQuery?: boolean; className?: string; compact?: boolean; showTips?: boolean }

export function ModuleEmptyState({ module, hasSearchQuery = false, className, compact = false, showTips = true }: ModuleEmptyStateProps) {
  if (hasSearchQuery) return <PageState variant="no-results" description="Try adjusting your search terms or clearing your filters." className={className} />
  const config = CREATOR_EMPTY_STATE_DEFINITIONS[module]
  return (
    <PageState
      variant="empty"
      icon={config.icon}
      title={config.title}
      description={config.description}
      actions={config.action ? [{ label: config.action.label, href: config.action.href, icon: config.action.icon }] : undefined}
      className={className}
      compact={compact}
    >
      {showTips && !compact && config.tips && config.tips.length > 0 && (
        <div className="mb-6 w-full max-w-md rounded-lg bg-muted/60 p-4 text-left">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tips</p>
          <ul className="space-y-1.5">
            {config.tips.slice(0, 3).map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageState>
  )
}
