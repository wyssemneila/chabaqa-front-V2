import type { ComponentType, ReactNode } from "react"
import type { CreatorEmptyStateModule } from "@/lib/creator-dashboard/empty-state-definitions"

export type CreatorModuleIcon = ComponentType<{ className?: string }>

export type CreatorContentType =
  | "community"
  | "course"
  | "product"
  | "session"
  | "event"
  | "challenge"
  | "post"
  | "email"
  | "affiliate"
  | "subscription"
  | "payout"

export type CreatorContentStatus =
  | "draft"
  | "published"
  | "scheduled"
  | "archived"
  | "active"
  | "inactive"
  | "pending"
  | "failed"

export interface CreatorContentListItem {
  id: string
  type: CreatorContentType
  title: string
  description?: string
  href: string
  status: CreatorContentStatus
  thumbnailUrl?: string
  communityId?: string
  communityName?: string
  updatedAt?: string
  createdAt?: string
  publishedAt?: string
  metrics?: Array<{
    label: string
    value: string | number
    icon?: CreatorModuleIcon
  }>
  actions?: CreatorModuleAction[]
}

export interface CreatorModuleAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: CreatorModuleIcon
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
}

export interface CreatorModuleMetric {
  title: string
  value: string | number
  icon?: CreatorModuleIcon
  color?: "primary" | "courses" | "challenges" | "sessions" | "success" | "warning" | "danger"
  change?: {
    value: string
    trend: "up" | "down"
  }
}

export interface CreatorModuleTab {
  value: string
  label: string
  count?: number
}

export interface CreatorModuleViewModel {
  title: string
  description?: string
  badge?: {
    label: string
    variant?: "default" | "secondary" | "outline" | "destructive"
  }
  primaryAction?: CreatorModuleAction
  secondaryActions?: CreatorModuleAction[]
  metrics?: CreatorModuleMetric[]
  tabs?: CreatorModuleTab[]
  activeTab?: string
  search?: {
    value: string
    placeholder?: string
  }
  emptyState?: {
    module: CreatorEmptyStateModule
    hasSearchQuery?: boolean
  }
  items?: CreatorContentListItem[]
  toolbar?: ReactNode
}
