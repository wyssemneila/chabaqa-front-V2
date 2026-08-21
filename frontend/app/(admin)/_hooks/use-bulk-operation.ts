"use client"

import { useState, useCallback, useRef } from "react"
import { BulkOperationItem } from "../_components/bulk-operation-progress"

export interface BulkOperationConfig<T> {
  items: T[]
  operation: (item: T) => Promise<void>
  getItemId: (item: T) => string
  getItemLabel: (item: T) => string
  onComplete?: (results: BulkOperationResult) => void
  onProgress?: (progress: BulkOperationProgress) => void
  batchSize?: number
  delayBetweenBatches?: number
}

export interface BulkOperationResult {
  total: number
  successful: number
  failed: number
  items: BulkOperationItem[]
}

export interface BulkOperationProgress {
  total: number
  completed: number
  successful: number
  failed: number
  percentage: number
}

export interface UseBulkOperationReturn {
  items: BulkOperationItem[]
  isRunning: boolean
  isCancelled: boolean
  progress: BulkOperationProgress
  execute: () => Promise<BulkOperationResult>
  cancel: () => void
  retryFailed: () => Promise<BulkOperationResult>
  reset: () => void
}

export function useBulkOperation<T>(
  config: BulkOperationConfig<T>
): UseBulkOperationReturn {
  const [items, setItems] = useState<BulkOperationItem[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const cancelledRef = useRef(false)

  const {
    items: sourceItems,
    operation,
    getItemId,
    getItemLabel,
    onComplete,
    onProgress,
    batchSize = 5,
    delayBetweenBatches = 100
  } = config

  // Initialize items
  const initializeItems = useCallback((itemsToProcess: T[]) => {
    return itemsToProcess.map(item => ({
      id: getItemId(item),
      label: getItemLabel(item),
      status: 'pending' as const,
    }))
  }, [getItemId, getItemLabel])

  // Calculate progress
  const calculateProgress = useCallback((currentItems: BulkOperationItem[]): BulkOperationProgress => {
    const total = currentItems.length
    const successful = currentItems.filter(i => i.status === 'success').length
    const failed = currentItems.filter(i => i.status === 'error').length
    const completed = successful + failed
    const percentage = total > 0 ? (completed / total) * 100 : 0

    return { total, completed, successful, failed, percentage }
  }, [])

  // Process items in batches
  const processItems = useCallback(async (
    itemsToProcess: T[],
    operationItems: BulkOperationItem[]
  ): Promise<BulkOperationResult> => {
    setIsRunning(true)
    setIsCancelled(false)
    cancelledRef.current = false

    const updatedItems = [...operationItems]
    setItems(updatedItems)

    // Process in batches
    for (let i = 0; i < itemsToProcess.length; i += batchSize) {
      // Check if cancelled
      if (cancelledRef.current) {
        // Mark remaining items as pending
        for (let j = i; j < itemsToProcess.length; j++) {
          const itemId = getItemId(itemsToProcess[j])
          const itemIndex = updatedItems.findIndex(item => item.id === itemId)
          if (itemIndex !== -1) {
            updatedItems[itemIndex].status = 'pending'
          }
        }
        setItems([...updatedItems])
        break
      }

      const batch = itemsToProcess.slice(i, i + batchSize)
      
      // Process batch in parallel
      await Promise.all(
        batch.map(async (item) => {
          const itemId = getItemId(item)
          const itemIndex = updatedItems.findIndex(i => i.id === itemId)
          
          if (itemIndex === -1) return

          // Mark as processing
          updatedItems[itemIndex].status = 'processing'
          setItems([...updatedItems])

          try {
            await operation(item)
            
            // Mark as success
            updatedItems[itemIndex].status = 'success'
            updatedItems[itemIndex].error = undefined
          } catch (error) {
            // Mark as error
            updatedItems[itemIndex].status = 'error'
            updatedItems[itemIndex].error = error instanceof Error 
              ? error.message 
              : 'Operation failed'
          }

          setItems([...updatedItems])

          // Report progress
          if (onProgress) {
            const progress = calculateProgress(updatedItems)
            onProgress(progress)
          }
        })
      )

      // Delay between batches (except for last batch)
      if (i + batchSize < itemsToProcess.length && !cancelledRef.current) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    setIsRunning(false)

    const result: BulkOperationResult = {
      total: updatedItems.length,
      successful: updatedItems.filter(i => i.status === 'success').length,
      failed: updatedItems.filter(i => i.status === 'error').length,
      items: updatedItems
    }

    if (onComplete) {
      onComplete(result)
    }

    return result
  }, [batchSize, delayBetweenBatches, operation, getItemId, onProgress, onComplete, calculateProgress])

  // Execute operation
  const execute = useCallback(async (): Promise<BulkOperationResult> => {
    const operationItems = initializeItems(sourceItems)
    return processItems(sourceItems, operationItems)
  }, [sourceItems, initializeItems, processItems])

  // Cancel operation
  const cancel = useCallback(() => {
    cancelledRef.current = true
    setIsCancelled(true)
  }, [])

  // Retry failed items
  const retryFailed = useCallback(async (): Promise<BulkOperationResult> => {
    const failedItems = items.filter(item => item.status === 'error')
    const failedSourceItems = sourceItems.filter(item => 
      failedItems.some(failed => failed.id === getItemId(item))
    )

    // Reset failed items to pending
    const updatedItems = items.map(item => 
      item.status === 'error' 
        ? { ...item, status: 'pending' as const, error: undefined }
        : item
    )

    return processItems(failedSourceItems, updatedItems)
  }, [items, sourceItems, getItemId, processItems])

  // Reset operation
  const reset = useCallback(() => {
    setItems([])
    setIsRunning(false)
    setIsCancelled(false)
    cancelledRef.current = false
  }, [])

  const progress = calculateProgress(items)

  return {
    items,
    isRunning,
    isCancelled,
    progress,
    execute,
    cancel,
    retryFailed,
    reset
  }
}
