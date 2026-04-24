/**
 * Predefined empty states for common admin dashboard scenarios
 */

import { 
  Users, 
  Building2, 
  FileText, 
  Coins, 
  Mail, 
  Shield,
  AlertCircle,
  Inbox,
  Search,
  Filter,
} from "lucide-react"
import { EmptyState } from "./empty-state"

/**
 * Empty state for users list
 */
export function EmptyUsers({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No users found"
      description="There are no users in the system yet. Users will appear here once they register."
      action={onCreate ? {
        label: "Invite User",
        onClick: onCreate,
      } : undefined}
    />
  )
}

/**
 * Empty state for communities list
 */
export function EmptyCommunities({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Building2}
      title="No communities found"
      description="There are no communities yet. Communities will appear here once creators start building them."
      action={onCreate ? {
        label: "Create Community",
        onClick: onCreate,
      } : undefined}
    />
  )
}

/**
 * Empty state for pending community approvals
 */
export function EmptyPendingApprovals() {
  return (
    <EmptyState
      icon={Inbox}
      title="No pending approvals"
      description="All communities have been reviewed. New community requests will appear here."
      compact
    />
  )
}

/**
 * Empty state for content moderation queue
 */
export function EmptyModerationQueue() {
  return (
    <EmptyState
      icon={Shield}
      title="Moderation queue is empty"
      description="Great job! There are no items pending moderation. Flagged content will appear here."
      compact
    />
  )
}

/**
 * Empty state for transactions
 */
export function EmptyTransactions() {
  return (
    <EmptyState
      icon={Coins}
      title="No transactions found"
      description="There are no transactions to display. Transactions will appear here once users start making purchases."
      compact
    />
  )
}

/**
 * Empty state for payouts
 */
export function EmptyPayouts({ onCalculate }: { onCalculate?: () => void }) {
  return (
    <EmptyState
      icon={Coins}
      title="No payouts found"
      description="There are no payouts scheduled. Calculate payouts to see pending creator earnings."
      action={onCalculate ? {
        label: "Calculate Payouts",
        onClick: onCalculate,
      } : undefined}
    />
  )
}

/**
 * Empty state for email campaigns
 */
export function EmptyCampaigns({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Mail}
      title="No campaigns found"
      description="You haven't created any email campaigns yet. Start engaging with your users by creating your first campaign."
      action={onCreate ? {
        label: "Create Campaign",
        onClick: onCreate,
      } : undefined}
    />
  )
}

/**
 * Empty state for email templates
 */
export function EmptyTemplates({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No templates found"
      description="Create reusable email templates to streamline your communication workflow."
      action={onCreate ? {
        label: "Create Template",
        onClick: onCreate,
      } : undefined}
    />
  )
}

/**
 * Empty state for audit logs
 */
export function EmptyAuditLogs() {
  return (
    <EmptyState
      icon={Shield}
      title="No audit logs found"
      description="No administrative actions have been logged yet. All admin activities will be recorded here."
      compact
    />
  )
}

/**
 * Empty state for security events
 */
export function EmptySecurityEvents() {
  return (
    <EmptyState
      icon={AlertCircle}
      title="No security events"
      description="Great! There are no security events to review. The system is secure."
      compact
    />
  )
}

/**
 * Empty state for search results
 */
export function EmptySearchResults({ 
  searchTerm, 
  onClear 
}: { 
  searchTerm: string
  onClear?: () => void 
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any results for "${searchTerm}". Try adjusting your search terms.`}
      action={onClear ? {
        label: "Clear Search",
        onClick: onClear,
        variant: "outline",
      } : undefined}
      compact
    />
  )
}

/**
 * Empty state for filtered results
 */
export function EmptyFilteredResults({ 
  onClearFilters 
}: { 
  onClearFilters?: () => void 
}) {
  return (
    <EmptyState
      icon={Filter}
      title="No matching results"
      description="No items match your current filters. Try adjusting or clearing your filters."
      action={onClearFilters ? {
        label: "Clear Filters",
        onClick: onClearFilters,
        variant: "outline",
      } : undefined}
      compact
    />
  )
}

/**
 * Generic empty state with custom message
 */
export function EmptyGeneric({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={onAction && actionLabel ? {
        label: actionLabel,
        onClick: onAction,
      } : undefined}
      compact
    />
  )
}
