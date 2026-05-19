"use client"

import type React from "react"
import type { ComponentType } from "react"
import { ActionBar, PageHeader, PageShell, StatsGrid } from "./page-framework"
import { PageState } from "./page-state"
import { MetricCard } from "@/components/ui/metric-card"

type MetricColor = "primary" | "courses" | "challenges" | "sessions" | "success" | "warning" | "danger"
type ModulePageIcon = ComponentType<{ className?: string }>

interface ModulePageAction {
  label: string
  href?: string
  onClick?: () => void
  icon?: ModulePageIcon
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive"
}

interface ModulePageMetric {
  title: string
  value: string | number
  icon?: ModulePageIcon
  color?: MetricColor
  change?: {
    value: string
    trend: "up" | "down"
  }
}

interface ModulePageTab {
  value: string
  label: string
  count?: number
}

interface ModulePageProps {
  title: string
  description?: string
  badge?: { label: string; variant?: "default" | "secondary" | "outline" | "destructive" }
  primaryAction?: ModulePageAction
  secondaryActions?: ModulePageAction[]
  metrics?: ModulePageMetric[]
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  tabs?: ModulePageTab[]
  activeTab?: string
  onTabChange?: (value: string) => void
  toolbar?: React.ReactNode
  dataFreshnessLabel?: string
  density?: "compact" | "standard"
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyState?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function ModulePage({
  title,
  description,
  badge,
  primaryAction,
  secondaryActions = [],
  metrics = [],
  searchValue,
  onSearchChange,
  searchPlaceholder,
  tabs,
  activeTab,
  onTabChange,
  toolbar,
  dataFreshnessLabel,
  density = "standard",
  loading = false,
  error,
  onRetry,
  emptyState,
  children,
  className,
}: ModulePageProps) {
  const actions = [primaryAction, ...secondaryActions].filter(Boolean) as ModulePageAction[]
  const hasActionBar = Boolean(onSearchChange || toolbar || (tabs && tabs.length > 0))

  return (
    <PageShell className={className}>
      <PageHeader
        title={title}
        description={description}
        badge={badge}
        breadcrumbs={[{ label: "Dashboard", href: "/creator/dashboard" }, { label: title }]}
        actions={actions}
      />

      {dataFreshnessLabel && (
        <p className="-mt-4 text-xs text-muted-foreground">{dataFreshnessLabel}</p>
      )}

      {loading ? (
        <PageState variant="loading" compact />
      ) : error ? (
        <PageState variant="error" description={error} onRetry={onRetry} />
      ) : (
        <>
          {metrics.length > 0 && (
            <StatsGrid columns={Math.min(Math.max(metrics.length, 2), 4) as 2 | 3 | 4} className={density === "compact" ? "gap-3" : undefined}>
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.title}
                  title={metric.title}
                  value={metric.value}
                  change={metric.change}
                  icon={metric.icon}
                  color={metric.color}
                />
              ))}
            </StatsGrid>
          )}

          {hasActionBar && (
            <ActionBar
              searchValue={searchValue}
              onSearchChange={onSearchChange}
              searchPlaceholder={searchPlaceholder}
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
            >
              {toolbar}
            </ActionBar>
          )}

          {emptyState || children}
        </>
      )}
    </PageShell>
  )
}

export type {
  ModulePageAction,
  ModulePageMetric,
  ModulePageTab,
}
