"use client"

import * as React from "react"
import { X, Loader2, LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "./confirm-dialog"
import { cn } from "@/lib/utils"

export interface BulkAction {
  label: string
  icon?: LucideIcon
  onClick: () => void | Promise<void>
  variant?: 'default' | 'destructive' | 'success' | 'outline' | 'secondary'
  requiresConfirmation?: boolean
  confirmationMessage?: string
  confirmationTitle?: string
  showProgress?: boolean // New: whether to show progress dialog
}

export interface BulkActionBarProps {
  selectedCount: number
  actions: BulkAction[]
  onClearSelection: () => void
  className?: string
  totalCount?: number
  disabled?: boolean // New: disable all actions
}

export function BulkActionBar({
  selectedCount,
  actions,
  onClearSelection,
  className,
  totalCount,
  disabled = false
}: BulkActionBarProps) {
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean
    action: BulkAction | null
  }>({
    open: false,
    action: null
  })

  const handleActionClick = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setConfirmDialog({ open: true, action })
      return
    }

    await executeAction(action)
  }

  const executeAction = async (action: BulkAction) => {
    setLoadingAction(action.label)
    try {
      await action.onClick()
    } catch (error) {
      console.error('[BulkActionBar] Action error:', error)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleConfirmAction = async () => {
    if (confirmDialog.action) {
      await executeAction(confirmDialog.action)
      setConfirmDialog({ open: false, action: null })
    }
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "bg-background border shadow-2xl rounded-lg",
          "animate-in slide-in-from-bottom-5 duration-300",
          className
        )}
        role="toolbar"
        aria-label="Bulk actions"
      >
        <div className="flex items-center gap-4 px-6 py-4">
          {/* Selection count */}
          <div className="flex items-center gap-2">
            <div 
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              aria-hidden="true"
            >
              {selectedCount}
            </div>
            <div className="text-sm">
              <p className="font-medium">
                {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
              </p>
              {totalCount && (
                <p className="text-xs text-muted-foreground">
                  of {totalCount} total
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" aria-hidden="true" />

          {/* Action buttons */}
          <div className="flex items-center gap-2" role="group" aria-label="Bulk action buttons">
            {actions.map((action) => {
              const Icon = action.icon
              const isLoading = loadingAction === action.label
              const isDisabled = disabled || loadingAction !== null

              return (
                <Button
                  key={action.label}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  disabled={isDisabled}
                  className={cn(
                    "gap-2",
                    action.variant === 'success' && "bg-green-600 hover:bg-green-700 text-white"
                  )}
                  aria-label={`${action.label} ${selectedCount} selected ${selectedCount === 1 ? 'item' : 'items'}`}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    Icon && <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                  {action.label}
                </Button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" aria-hidden="true" />

          {/* Clear selection button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={disabled || loadingAction !== null}
            className="gap-2"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog({ open: false, action: null })
          }
        }}
        title={confirmDialog.action?.confirmationTitle || "Confirm Action"}
        description={
          confirmDialog.action?.confirmationMessage ||
          `Are you sure you want to perform this action on ${selectedCount} ${selectedCount === 1 ? 'item' : 'items'}?`
        }
        confirmLabel={confirmDialog.action?.label || "Confirm"}
        variant={confirmDialog.action?.variant === 'destructive' ? 'destructive' : 'default'}
        onConfirm={handleConfirmAction}
      />
    </>
  )
}

