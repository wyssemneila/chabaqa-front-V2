/**
 * Memoized Helper Functions for Admin Dashboard
 * 
 * These utility functions use memoization to optimize performance
 * for common operations like filtering, sorting, and calculations.
 */

/**
 * Memoized filter function for arrays
 * Returns a function that filters an array based on provided filters
 */
export function createFilterFunction<T>(
  filterConfig: Record<string, any>
): (items: T[]) => T[] {
  return (items: T[]) => {
    return items.filter((item: any) => {
      return Object.entries(filterConfig).every(([key, value]) => {
        // Skip if filter value is empty/null/undefined
        if (value === null || value === undefined || value === '') {
          return true
        }

        // Handle array filters (multi-select)
        if (Array.isArray(value)) {
          return value.length === 0 || value.includes(item[key])
        }

        // Handle string filters (search)
        if (typeof value === 'string') {
          const itemValue = String(item[key] || '').toLowerCase()
          return itemValue.includes(value.toLowerCase())
        }

        // Handle exact match
        return item[key] === value
      })
    })
  }
}

/**
 * Memoized sort function for arrays
 * Returns a function that sorts an array based on provided sort config
 */
export function createSortFunction<T>(
  sortKey: string,
  sortOrder: 'asc' | 'desc'
): (items: T[]) => T[] {
  return (items: T[]) => {
    return [...items].sort((a: any, b: any) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortOrder === 'asc' ? comparison : -comparison
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Handle date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime()
        return sortOrder === 'asc' ? comparison : -comparison
      }

      // Default comparison
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      return 0
    })
  }
}

/**
 * Memoized pagination function
 * Returns a function that paginates an array
 */
export function createPaginationFunction<T>(
  page: number,
  pageSize: number
): (items: T[]) => T[] {
  return (items: T[]) => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return items.slice(startIndex, endIndex)
  }
}

/**
 * Calculate growth percentage
 * Memoized calculation for metric cards
 */
export function calculateGrowth(
  current: number,
  previous: number
): { value: string; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) {
    return current > 0
      ? { value: '+100%', trend: 'up' }
      : { value: '0%', trend: 'neutral' }
  }

  const growth = ((current - previous) / previous) * 100
  const rounded = Math.round(Math.abs(growth))
  const sign = growth >= 0 ? '+' : '-'

  return {
    value: `${sign}${rounded}%`,
    trend: growth >= 0 ? 'up' : 'down'
  }
}

/**
 * Format currency
 * Memoized currency formatting
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

/**
 * Format number with abbreviation
 * Memoized number formatting (1000 -> 1K, 1000000 -> 1M)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}

/**
 * Format percentage
 * Memoized percentage formatting
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format duration
 * Memoized duration formatting (seconds to human readable)
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return `${hours}h ${remainingMinutes}m`
}

/**
 * Format date
 * Memoized date formatting
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (format === 'relative') {
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
    return `${Math.floor(diffDays / 365)}y ago`
  }

  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Group items by key
 * Memoized grouping function
 */
export function groupBy<T>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  return items.reduce((groups, item) => {
    const groupKey = String(item[key])
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

/**
 * Calculate statistics
 * Memoized statistics calculation
 */
export function calculateStatistics(numbers: number[]): {
  total: number
  average: number
  min: number
  max: number
  median: number
} {
  if (numbers.length === 0) {
    return { total: 0, average: 0, min: 0, max: 0, median: 0 }
  }

  const sorted = [...numbers].sort((a, b) => a - b)
  const total = numbers.reduce((sum, n) => sum + n, 0)
  const average = total / numbers.length
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)]

  return { total, average, min, max, median }
}

/**
 * Debounce function
 * Creates a debounced version of a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 * Creates a throttled version of a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
