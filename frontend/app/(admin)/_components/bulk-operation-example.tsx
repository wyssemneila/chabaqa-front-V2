"use client"

/**
 * Example component demonstrating how to use the enhanced bulk operation features
 * 
 * This example shows:
 * 1. Progress indicators during bulk operations
 * 2. Operation summary after completion
 * 3. Error details for failed items
 * 4. Cancel bulk operation functionality
 * 5. Retry failed items functionality
 */

import * as React from "react"
import { CheckCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { BulkActionBar, BulkAction } from "./bulk-action-bar"
import { BulkOperationProgress } from "./bulk-operation-progress"
import { useBulkOperation } from "../_hooks/use-bulk-operation"

interface ExampleItem {
  id: string
  name: string
  status: string
}

export function BulkOperationExample() {
  const [selectedRows, setSelectedRows] = React.useState<string[]>([])
  const [showProgress, setShowProgress] = React.useState(false)
  const [items] = React.useState<ExampleItem[]>([
    { id: '1', name: 'Item 1', status: 'pending' },
    { id: '2', name: 'Item 2', status: 'pending' },
    { id: '3', name: 'Item 3', status: 'pending' },
    { id: '4', name: 'Item 4', status: 'pending' },
    { id: '5', name: 'Item 5', status: 'pending' },
  ])

  // Get selected items
  const selectedItems = items.filter(item => selectedRows.includes(item.id))

  // Simulate an API operation that might fail
  const performOperation = async (item: ExampleItem): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
    
    // Simulate random failures (20% chance)
    if (Math.random() < 0.2) {
      throw new Error(`Failed to process ${item.name}`)
    }
  }

  // Configure bulk operation
  const bulkOperation = useBulkOperation({
    items: selectedItems,
    operation: performOperation,
    getItemId: (item) => item.id,
    getItemLabel: (item) => item.name,
    batchSize: 3, // Process 3 items at a time
    delayBetweenBatches: 500, // 500ms delay between batches
    onComplete: (result) => {
      if (result.failed === 0) {
        toast.success(`Successfully processed ${result.successful} items`)
      } else {
        toast.warning(
          `Completed with ${result.successful} successful and ${result.failed} failed`
        )
      }
    },
    onProgress: (progress) => {
      console.log(`Progress: ${progress.percentage.toFixed(0)}%`)
    }
  })

  // Handle bulk approve
  const handleBulkApprove = async () => {
    setShowProgress(true)
    await bulkOperation.execute()
  }

  // Handle bulk reject
  const handleBulkReject = async () => {
    // Simple operation without progress tracking
    try {
      for (const item of selectedItems) {
        await performOperation(item)
      }
      toast.success(`Rejected ${selectedItems.length} items`)
      setSelectedRows([])
    } catch (error) {
      toast.error('Failed to reject items')
    }
  }

  // Bulk actions configuration
  const bulkActions: BulkAction[] = [
    {
      label: 'Approve Selected',
      icon: CheckCheck,
      onClick: handleBulkApprove,
      variant: 'default',
      requiresConfirmation: true,
      confirmationTitle: 'Approve Items',
      confirmationMessage: `Are you sure you want to approve ${selectedRows.length} items?`,
      showProgress: true
    },
    {
      label: 'Reject Selected',
      icon: X,
      onClick: handleBulkReject,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationTitle: 'Reject Items',
      confirmationMessage: `Are you sure you want to reject ${selectedRows.length} items?`
    }
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Operation Example</CardTitle>
          <CardDescription>
            Demonstrates enhanced bulk operations with progress tracking, error handling, and retry functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Item Selection */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Select items to process:</p>
              <div className="space-y-2">
                {items.map(item => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, item.id])
                        } else {
                          setSelectedRows(selectedRows.filter(id => id !== item.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{item.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Select All / Clear All */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRows(items.map(i => i.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRows([])}
              >
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedRows.length}
        actions={bulkActions}
        onClearSelection={() => setSelectedRows([])}
        totalCount={items.length}
        disabled={bulkOperation.isRunning}
      />

      {/* Bulk Operation Progress Dialog */}
      <BulkOperationProgress
        open={showProgress}
        onOpenChange={(open) => {
          if (!open && !bulkOperation.isRunning) {
            setShowProgress(false)
            bulkOperation.reset()
            setSelectedRows([])
          }
        }}
        title="Processing Items"
        items={bulkOperation.items}
        onCancel={bulkOperation.cancel}
        onRetryFailed={async (failedIds) => {
          await bulkOperation.retryFailed()
        }}
        canCancel={bulkOperation.isRunning}
      />
    </div>
  )
}
