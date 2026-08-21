"use client"

import * as React from "react"
import { X, Filter, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select"
import { cn } from "@/lib/utils"

export interface FilterConfig {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'dateRange' | 'multiSelect'
  options?: Array<{ label: string; value: string }>
  placeholder?: string
}

export interface FilterPanelProps {
  filters: FilterConfig[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  onReset: () => void
  onApply: () => void
  className?: string
  collapsible?: boolean
}

export function FilterPanel({
  filters,
  values,
  onChange,
  onReset,
  onApply,
  className,
  collapsible = false
}: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const hasActiveFilters = React.useMemo(() => {
    return Object.values(values).some(value => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'string') {
        const trimmed = value.trim()
        return trimmed !== '' && trimmed !== 'all'
      }
      return value !== null && value !== undefined
    })
  }, [values])

  const renderFilterInput = (filter: FilterConfig) => {
    const value = values[filter.key]

    switch (filter.type) {
      case 'text':
        return (
          <Input
            type="text"
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}...`}
            value={value || ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className="w-full"
          />
        )

      case 'select':
        return (
          <Select
            value={value ?? 'all'}
            onValueChange={(newValue) => onChange(filter.key, newValue)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(filter.key, e.target.value)}
            className="w-full"
          />
        )

      case 'dateRange':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                value={value?.from || ''}
                onChange={(e) => onChange(filter.key, { ...value, from: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                value={value?.to || ''}
                onChange={(e) => onChange(filter.key, { ...value, to: e.target.value })}
                className="w-full"
              />
            </div>
          </div>
        )

      case 'multiSelect':
        // For multiSelect, we'll use a simple checkbox list
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
            {filter.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-sm p-1.5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter(v => v !== option.value)
                    onChange(filter.key, newValues)
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
            {(!filter.options || filter.options.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No options available
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (collapsible && isCollapsed) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="gap-2"
          aria-label={`Show filters${hasActiveFilters ? `, ${Object.values(values).filter(v => {
            if (Array.isArray(v)) return v.length > 0
            if (typeof v === 'string') return v.trim() !== ''
            return v !== null && v !== undefined
          }).length} active` : ''}`}
          aria-expanded={false}
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          Show Filters
          {hasActiveFilters && (
            <span 
              className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
              aria-label={`${Object.values(values).filter(v => {
                if (Array.isArray(v)) return v.length > 0
                if (typeof v === 'string') return v.trim() !== ''
                return v !== null && v !== undefined
              }).length} active filters`}
            >
              {Object.values(values).filter(v => {
                if (Array.isArray(v)) return v.length > 0
                if (typeof v === 'string') return v.trim() !== ''
                return v !== null && v !== undefined
              }).length}
            </span>
          )}
        </Button>
      </div>
    )
  }

  return (
    <Card className={cn("admin-surface overflow-hidden rounded-3xl border-0 shadow-none", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="admin-icon-chip h-9 w-9 rounded-xl">
              <Filter className="h-4 w-4 text-[hsl(var(--admin-primary-strong))]" aria-hidden="true" />
            </span>
            <CardTitle className="text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <span
                className="admin-badge h-6 min-w-6 px-2"
                aria-label={`${Object.values(values).filter(v => {
                  if (Array.isArray(v)) return v.length > 0
                  if (typeof v === 'string') return v.trim() !== ''
                  return v !== null && v !== undefined
                }).length} active filters`}
              >
                {Object.values(values).filter(v => {
                  if (Array.isArray(v)) return v.length > 0
                  if (typeof v === 'string') return v.trim() !== ''
                  return v !== null && v !== undefined
                }).length}
              </span>
            )}
          </div>
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8 p-0"
              aria-label="Hide filters"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Hide filters</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          role="group"
          aria-label="Filter controls"
        >
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-2">
              <Label htmlFor={`filter-${filter.key}`} className="text-sm font-medium">
                {filter.label}
              </Label>
              <div id={`filter-${filter.key}`}>
                {renderFilterInput(filter)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[hsl(var(--admin-border)/0.7)] pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="gap-2"
            aria-label="Reset all filters"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onApply}
            className="gap-2"
            aria-label="Apply selected filters"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
