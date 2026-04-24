import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { CheckCircle, Clock, Eye, XCircle } from "lucide-react"
import type * as React from "react"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      status: {
        active: "bg-green-100 text-green-700",
        inactive: "bg-gray-100 text-gray-700",
        pending: "bg-orange-100 text-orange-700",
        completed: "bg-blue-100 text-blue-700",
        draft: "bg-gray-100 text-gray-700",
        published: "bg-green-100 text-green-700", // Added published status
        upcoming: "bg-blue-100 text-blue-700",
        cancelled: "bg-red-100 text-red-700",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      status: "active",
      size: "default",
    },
  },
)

const statusIcons = {
  active: CheckCircle,
  inactive: XCircle,
  pending: Clock,
  completed: CheckCircle,
  draft: Clock,
  published: Eye, // Icon for published
  upcoming: Clock,
  cancelled: XCircle,
}

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status: "active" | "inactive" | "pending" | "completed" | "draft" | "published" | "upcoming" | "cancelled"
  showIcon?: boolean
}

function StatusBadge({ className, status, showIcon = true, size, ...props }: StatusBadgeProps) {
  const Icon = statusIcons[status]
  return (
    <div className={cn(statusBadgeVariants({ status, size }), className)} {...props}>
      {showIcon && Icon && <Icon className="mr-1 h-3 w-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  )
}

export { StatusBadge, statusBadgeVariants }
