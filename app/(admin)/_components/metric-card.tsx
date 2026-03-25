"use client"

import * as React from "react"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface MetricCardProps {
  title: string
  value: number | string
  change?: {
    value: string
    trend: 'up' | 'down' | 'neutral'
  }
  icon?: LucideIcon
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  loading?: boolean
  onClick?: () => void
}

const colorVariants = {
  primary: {
    bg: 'bg-[hsl(var(--admin-primary)/0.14)]',
    icon: 'text-[hsl(var(--admin-primary-strong))]',
    border: 'border-[hsl(var(--admin-primary)/0.18)]'
  },
  success: {
    bg: 'bg-[hsl(var(--admin-success)/0.12)]',
    icon: 'text-[hsl(var(--admin-success))]',
    border: 'border-[hsl(var(--admin-success)/0.2)]'
  },
  warning: {
    bg: 'bg-[hsl(var(--admin-warning)/0.14)]',
    icon: 'text-[hsl(var(--admin-warning))]',
    border: 'border-[hsl(var(--admin-warning)/0.24)]'
  },
  danger: {
    bg: 'bg-[hsl(var(--admin-danger)/0.12)]',
    icon: 'text-[hsl(var(--admin-danger))]',
    border: 'border-[hsl(var(--admin-danger)/0.2)]'
  },
  info: {
    bg: 'bg-[hsl(var(--admin-cyan)/0.14)]',
    icon: 'text-[hsl(var(--admin-cyan))]',
    border: 'border-[hsl(var(--admin-cyan)/0.22)]'
  }
}

export const MetricCard = React.memo(({
  title,
  value,
  change,
  icon: Icon,
  color = 'primary',
  loading = false,
  onClick
}: MetricCardProps) => {
  const colors = colorVariants[color]
  const isClickable = !!onClick

  if (loading) {
    return (
      <Card className="admin-kpi-card overflow-hidden rounded-3xl border-0 shadow-none">
        <CardContent className="p-6">
          <div className="space-y-3" role="status" aria-label="Loading metric">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
            </div>
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
            {change && (
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            )}
            <span className="sr-only">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const content = (
    <CardContent className="p-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          {Icon && (
            <div 
              className={cn(
                "p-2 rounded-lg",
                colors.bg,
                colors.border,
                "border"
              )}
              aria-hidden="true"
            >
              <Icon className={cn("h-5 w-5", colors.icon)} />
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-3xl font-bold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {change && (
            <div className="flex items-center gap-1">
              {change.trend === 'up' && (
                <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
              )}
              {change.trend === 'down' && (
                <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />
              )}
              <span 
                className={cn(
                  "text-sm font-medium",
                  change.trend === 'up' && "text-green-600",
                  change.trend === 'down' && "text-red-600",
                  change.trend === 'neutral' && "text-muted-foreground"
                )}
                aria-label={`${change.trend === 'up' ? 'Increased' : change.trend === 'down' ? 'Decreased' : 'No change'} by ${change.value}`}
              >
                {change.value}
              </span>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  )

  if (isClickable) {
    return (
      <Card 
        className={cn(
          "admin-kpi-card cursor-pointer overflow-hidden rounded-3xl border-0 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-26px_rgba(95,74,180,0.38)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
        aria-label={`${title}: ${typeof value === 'number' ? value.toLocaleString() : value}${change ? `, ${change.trend === 'up' ? 'increased' : change.trend === 'down' ? 'decreased' : 'no change'} by ${change.value}` : ''}. Click to view details.`}
      >
        {content}
      </Card>
    )
  }

  return (
    <Card className="admin-kpi-card overflow-hidden rounded-3xl border-0 shadow-none">
      {content}
    </Card>
  )
})

MetricCard.displayName = "MetricCard"
