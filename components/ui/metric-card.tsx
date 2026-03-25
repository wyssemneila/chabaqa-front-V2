"use client"

import type * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    trend: "up" | "down"
  }
  icon?: React.ComponentType<{ className?: string }>
  color?: "primary" | "courses" | "challenges" | "sessions" | "success" | "warning" | "danger"
  className?: string
}

const colorConfig = {
  primary: {
    bg: "bg-primary-100",
    text: "text-primary-600",
    trend: "text-primary-600",
  },
  courses: {
    bg: "bg-courses-100",
    text: "text-courses-600",
    trend: "text-courses-600",
  },
  challenges: {
    bg: "bg-challenges-100",
    text: "text-challenges-600",
    trend: "text-challenges-600",
  },
  sessions: {
    bg: "bg-sessions-100",
    text: "text-sessions-600",
    trend: "text-sessions-600",
  },
  success: {
    bg: "bg-green-100",
    text: "text-green-600",
    trend: "text-green-600",
  },
  warning: {
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    trend: "text-yellow-600",
  },
  danger: {
    bg: "bg-red-100",
    text: "text-red-600",
    trend: "text-red-600",
  },
}

export function MetricCard({ title, value, change, icon: Icon, color = "primary", className }: MetricCardProps) {
  const config = colorConfig[color]

  return (
    <Card className={cn("hover-lift", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className={cn("p-2 rounded-lg", config.bg)}>
            <Icon className={cn("h-4 w-4", config.text)} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center text-xs mt-1">
            {change.trend === "up" ? (
              <TrendingUp className={cn("h-3 w-3 mr-1", config.trend)} />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            <span className={cn(change.trend === "up" ? config.trend : "text-red-500")}>{change.value}</span>
            <span className="text-muted-foreground ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
