"use client"

import * as React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  variant?: 'default' | 'destructive'
  requiresInput?: boolean
  inputPlaceholder?: string
  inputMatchText?: string
  children?: React.ReactNode // Support custom content
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  variant = 'default',
  requiresInput = false,
  inputPlaceholder = "Type to confirm",
  inputMatchText,
  children
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setInputValue("")
      setError(null)
      setLoading(false)
    }
  }, [open])

  const handleConfirm = async () => {
    // Validate input if required
    if (requiresInput && inputMatchText) {
      if (inputValue !== inputMatchText) {
        setError(`Please type "${inputMatchText}" to confirm`)
        return
      }
    }

    setError(null)
    setLoading(true)

    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error('[ConfirmDialog] Error:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false)
    }
  }

  const isConfirmDisabled = loading || (requiresInput && !!inputMatchText && inputValue !== inputMatchText)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-[425px]",
        variant === 'destructive' && "border-red-200 dark:border-red-800"
      )}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant === 'destructive' && (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            )}
            <DialogTitle className={cn(
              variant === 'destructive' && "text-red-900 dark:text-red-100"
            )}>
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        {requiresInput && (
          <div className="space-y-2">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setError(null)
              }}
              placeholder={inputPlaceholder}
              disabled={loading}
              className={cn(
                error && "border-red-500 focus-visible:ring-red-500"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isConfirmDisabled) {
                  e.preventDefault()
                  handleConfirm()
                }
              }}
            />
            {inputMatchText && (
              <p className="text-xs text-muted-foreground">
                Type <span className="font-semibold">{inputMatchText}</span> to confirm
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Custom content */}
        {children && <div className="py-2">{children}</div>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
