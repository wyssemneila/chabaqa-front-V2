"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"

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
  icon?: LucideIcon
}

interface PageStateProps {
  variant: PageStateVariant
  title?: string
  description?: string
  icon?: LucideIcon
  actions?: PageStateAction[]
  onRetry?: () => void
  className?: string
  compact?: boolean
  children?: React.ReactNode
}

const VARIANT_DEFAULTS: Record<
  PageStateVariant,
  { icon: LucideIcon; title: string; description: string }
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
                  {ActionIcon && <ActionIcon className="h-4 w-4 me-2" />}
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

const EMPTY_STATES: Record<string, { icon: LucideIcon; title: string; description: string; action: PageStateAction }> = {
  communities: { icon: Building, title: "No communities yet", description: "Communities are the home for your audience. Create one to start sharing content and growing your business.", action: { label: "Create Your First Community", href: "/creator/communities/create", icon: Plus } },
  courses: { icon: PackageOpen, title: "No courses yet", description: "Courses let you package and sell your knowledge. Create your first course to start teaching and earning.", action: { label: "Create Course", href: "/creator/courses/new", icon: Plus } },
  challenges: { icon: PackageOpen, title: "No challenges yet", description: "Challenges help your community stay engaged and accountable. Launch your first challenge today.", action: { label: "Create Challenge", href: "/creator/challenges/new", icon: Plus } },
  sessions: { icon: PackageOpen, title: "No sessions yet", description: "Sessions let you offer live or scheduled 1-on-1 calls. Set up your first session to start booking.", action: { label: "Create Session", href: "/creator/sessions/new", icon: Plus } },
  events: { icon: PackageOpen, title: "No events yet", description: "Events bring your community together. Create a live event, workshop, or webinar.", action: { label: "Create Event", href: "/creator/events/new", icon: Plus } },
  products: { icon: PackageOpen, title: "No products yet", description: "Sell digital or physical products directly to your community. Add your first product to get started.", action: { label: "Add Product", href: "/creator/products/new", icon: Plus } },
  posts: { icon: PackageOpen, title: "No posts yet", description: "Posts keep your community informed and engaged. Share your first update.", action: { label: "Write a Post", href: "/creator/posts/new", icon: Plus } },
  subscriptions: { icon: PackageOpen, title: "No subscriptions yet", description: "Recurring subscriptions give you predictable revenue. Create a plan for your community members.", action: { label: "Create Plan", href: "/creator/monetization/subscriptions", icon: Plus } },
  payouts: { icon: PackageOpen, title: "No payouts yet", description: "Your payout history will appear here once you have earnings to withdraw.", action: { label: "View Revenue", href: "/creator/monetization/subscriptions", icon: ArrowRight } },
  notifications: { icon: PackageOpen, title: "All caught up", description: "You have no new notifications. Check back later for updates.", action: { label: "Go to Dashboard", href: "/creator/dashboard", icon: ArrowRight } },
  analytics: { icon: PackageOpen, title: "No analytics data yet", description: "Analytics will populate once your community has activity. Start by publishing content.", action: { label: "Create Content", href: "/creator/courses", icon: ArrowRight } },
  team: { icon: PackageOpen, title: "No team members yet", description: "Invite collaborators to help manage your community. Assign roles and permissions.", action: { label: "Invite Member", href: "/creator/team", icon: Plus } },
  emails: { icon: PackageOpen, title: "No email campaigns yet", description: "Reach your community directly with email campaigns. Create your first campaign.", action: { label: "Create Campaign", href: "/creator/marketing/emails/new", icon: Plus } },
  affiliates: { icon: PackageOpen, title: "No affiliates yet", description: "Let others promote your content and earn commissions. Set up your affiliate program.", action: { label: "Set Up Affiliates", href: "/creator/marketing/affiliates", icon: Plus } },
}

interface ModuleEmptyStateProps { module: keyof typeof EMPTY_STATES; hasSearchQuery?: boolean; className?: string }

export function ModuleEmptyState({ module, hasSearchQuery = false, className }: ModuleEmptyStateProps) {
  if (hasSearchQuery) return <PageState variant="no-results" description="Try adjusting your search terms or clearing your filters." className={className} />
  const config = EMPTY_STATES[module]
  return <PageState variant="empty" icon={config.icon} title={config.title} description={config.description} actions={[config.action]} className={className} />
}
