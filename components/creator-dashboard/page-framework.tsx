"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, type LucideIcon } from "lucide-react"
import Link from "next/link"

interface BreadcrumbSegment { label: string; href?: string }
interface PageHeaderAction { label: string; href?: string; onClick?: () => void; icon?: LucideIcon; variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" }

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbSegment[]
  badge?: { label: string; variant?: "default" | "secondary" | "outline" | "destructive" }
  actions?: PageHeaderAction[]
  className?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, breadcrumbs, badge, actions, className, children }: PageHeaderProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <BreadcrumbItem key={i}>
                {i < breadcrumbs.length - 1 ? (
                  <><BreadcrumbLink asChild><Link href={crumb.href || "#"}>{crumb.label}</Link></BreadcrumbLink><BreadcrumbSeparator /></>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
          {badge && <Badge variant={badge.variant || "secondary"}>{badge.label}</Badge>}
        </div>
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions.map((action, i) => {
              const ActionIcon = action.icon
              const btn = <Button key={i} variant={action.variant || (i === 0 ? "default" : "outline")} size="sm" onClick={action.onClick}>{ActionIcon && <ActionIcon className="h-4 w-4 me-2" />}{action.label}</Button>
              return action.href ? <Link key={i} href={action.href}>{btn}</Link> : btn
            })}
          </div>
        )}
      </div>
      {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      {children}
    </div>
  )
}

interface StatsGridProps { children: React.ReactNode; columns?: 2 | 3 | 4; className?: string }

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  return (
    <div className={cn("grid gap-4",
      columns === 2 && "grid-cols-1 sm:grid-cols-2",
      columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      className,
    )}>{children}</div>
  )
}

interface TabConfig { value: string; label: string; count?: number }
interface ActionBarProps { searchValue?: string; onSearchChange?: (value: string) => void; searchPlaceholder?: string; tabs?: TabConfig[]; activeTab?: string; onTabChange?: (value: string) => void; children?: React.ReactNode; className?: string }

export function ActionBar({ searchValue, onSearchChange, searchPlaceholder = "Search\u2026", tabs, activeTab, onTabChange, children, className }: ActionBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {tabs && tabs.length > 0 && (
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && <Badge variant="secondary" className="text-[11px] px-1.5 py-0">{tab.count}</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <div className="flex items-center gap-3">
        {onSearchChange && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchValue} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} className="ps-9 h-9" />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

interface PageShellProps { children: React.ReactNode; className?: string }
export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn("space-y-6", className)}>{children}</div>
}

interface ContentGridProps { children: React.ReactNode; columns?: 1 | 2 | 3 | 4; className?: string }
export function ContentGrid({ children, columns = 3, className }: ContentGridProps) {
  return (
    <div className={cn("grid gap-4",
      columns === 1 && "grid-cols-1",
      columns === 2 && "grid-cols-1 md:grid-cols-2",
      columns === 3 && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
      columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className,
    )}>{children}</div>
  )
}

interface SectionProps { title?: string; description?: string; actions?: PageHeaderAction[]; children: React.ReactNode; className?: string }
export function Section({ title, description, actions, children, className }: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, i) => {
                const ActionIcon = action.icon
                const btn = <Button key={i} variant={action.variant || "outline"} size="sm" onClick={action.onClick}>{ActionIcon && <ActionIcon className="h-4 w-4 me-2" />}{action.label}</Button>
                return action.href ? <Link key={i} href={action.href}>{btn}</Link> : btn
              })}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
