"use client"

import * as React from "react"
import { X, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface BulkOperationItem {
  id: string
  label: string
  status: 'pending' | 'processing' | 'success' | 'error'
  error?: string
}

export interface BulkOperationProgressProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  items: BulkOperationItem[]
  onCancel?: () => void
  onRetryFailed?: (failedIds: string[]) => void
  canCancel?: boolean
  className?: string
}

export function BulkOperationProgress({
  open,
  onOpenChange,
  title,
  items,
  onCancel,
  onRetryFailed,
  canCancel = true,
  className
}: BulkOperationProgressProps) {
  const totalItems = items.length
  const successCount = items.filter(item => item.status === 'success').length
  const errorCount = items.filter(item => item.status === 'error').length
  const processingCount = items.filter(item => item.status === 'processing').length
  const pendingCount = items.filter(item => item.status === 'pending').length
  
  const completedCount = successCount + errorCount
  const progressPercentage = totalItems > 0 ? (completedCount / totalItems) * 100 : 0
  const isComplete = completedCount === totalItems
  const isProcessing = processingCount > 0 || pendingCount > 0
  
  const failedItems = items.filter(item => item.status === 'error')

  const handleClose = () => {
    if (isProcessing && canCancel) {
      // Confirm before closing during processing
      if (window.confirm('Operation is still in progress. Are you sure you want to close?')) {
        onOpenChange(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    if (onCancel && window.confirm('Are you sure you want to cancel this operation?')) {
      onCancel()
    }
  }

  const handleRetryFailed = () => {
    if (onRetryFailed && failedItems.length > 0) {
      onRetryFailed(failedItems.map(item => item.id))
    }
  }

  if (!open) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm",
        "flex items-center justify-center p-4",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-operation-title"
    >
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle id="bulk-operation-title" className="text-xl">
                {title}
              </CardTitle>
              <CardDescription>
                {isComplete
                  ? `Completed: ${successCount} successful, ${errorCount} failed`
                  : `Processing ${totalItems} ${totalItems === 1 ? 'item' : 'items'}...`}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isProcessing && !canCancel}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progress: {completedCount} of {totalItems}
              </span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium">{successCount}</div>
                <div className="text-xs text-muted-foreground">Success</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <div className="font-medium">{errorCount}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <div>
                <div className="font-medium">{processingCount}</div>
                <div className="text-xs text-muted-foreground">Processing</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium">{pendingCount}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg transition-colors",
                    item.status === 'success' && "bg-green-50 dark:bg-green-950/20",
                    item.status === 'error' && "bg-red-50 dark:bg-red-950/20",
                    item.status === 'processing' && "bg-blue-50 dark:bg-blue-950/20",
                    item.status === 'pending' && "bg-gray-50 dark:bg-gray-900/20"
                  )}
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {item.status === 'success' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" aria-label="Success" />
                    )}
                    {item.status === 'error' && (
                      <XCircle className="h-5 w-5 text-red-600" aria-label="Error" />
                    )}
                    {item.status === 'processing' && (
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" aria-label="Processing" />
                    )}
                    {item.status === 'pending' && (
                      <AlertCircle className="h-5 w-5 text-gray-400" aria-label="Pending" />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.label}</div>
                    {item.error && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {item.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              {isComplete && errorCount > 0 && onRetryFailed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryFailed}
                  className="gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Retry Failed ({errorCount})
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isProcessing && canCancel && onCancel && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel Operation
                </Button>
              )}
              {isComplete && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
