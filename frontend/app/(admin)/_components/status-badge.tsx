"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-[hsl(var(--admin-primary)/0.16)] bg-[hsl(var(--admin-primary)/0.12)] text-[hsl(var(--admin-primary-strong))]",
        success: "border-[hsl(var(--admin-success)/0.18)] bg-[hsl(var(--admin-success)/0.12)] text-[hsl(var(--admin-success))]",
        warning: "border-[hsl(var(--admin-warning)/0.2)] bg-[hsl(var(--admin-warning)/0.14)] text-[hsl(var(--admin-warning))]",
        danger: "border-[hsl(var(--admin-danger)/0.18)] bg-[hsl(var(--admin-danger)/0.12)] text-[hsl(var(--admin-danger))]",
        info: "border-[hsl(var(--admin-cyan)/0.2)] bg-[hsl(var(--admin-cyan)/0.14)] text-[hsl(var(--admin-cyan))]",
        secondary: "border-[hsl(var(--admin-border)/0.9)] bg-white/75 text-[hsl(var(--admin-muted))]"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-sm",
        lg: "px-3 py-1 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: string
}

// Map common status values to appropriate color variants
const statusVariantMap: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
  // Active/Success states
  'active': 'success',
  'approved': 'success',
  'completed': 'success',
  'published': 'success',
  'verified': 'success',
  'delivered': 'success',
  'sent': 'success',
  
  // Pending/Warning states
  'pending': 'warning',
  'scheduled': 'warning',
  'processing': 'warning',
  'sending': 'warning',
  'in_review': 'warning',
  'under_review': 'warning',
  'flagged': 'warning',
  
  // Error/Danger states
  'suspended': 'danger',
  'rejected': 'danger',
  'escalated': 'danger',
  'failed': 'danger',
  'cancelled': 'danger',
  'canceled': 'danger',
  'deleted': 'danger',
  'blocked': 'danger',
  'bounced': 'danger',
  
  // Info states
  'draft': 'info',
  'inactive': 'info',
  'archived': 'info',
  
  // Secondary/Neutral states
  'unknown': 'secondary',
  'other': 'secondary'
}

function getVariantFromStatus(status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
  if (!status) return 'default'
  const normalizedStatus = String(status).toLowerCase().replace(/\s+/g, '_')
  return statusVariantMap[normalizedStatus] || 'default'
}

export const StatusBadge = React.memo(({ 
  status, 
  variant, 
  size = 'md',
  className, 
  ...props 
}: StatusBadgeProps) => {
  // Use provided variant or auto-detect from status
  const badgeVariant = variant || getVariantFromStatus(status)
  
  return (
    <div 
      className={cn(statusBadgeVariants({ variant: badgeVariant, size }), className)} 
      {...props}
    >
      {status}
    </div>
  )
})

StatusBadge.displayName = "StatusBadge"

export { statusBadgeVariants }
