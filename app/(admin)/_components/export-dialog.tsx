"use client"

import * as React from "react"
import { Download, Loader2, FileText, FileJson, FileType } from "lucide-react"
import { format } from "date-fns"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select"
import { cn } from "@/lib/utils"

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  startDate?: string
  endDate?: string
  includeDetails?: boolean
}

export interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (format: 'csv' | 'json' | 'pdf', options: ExportOptions) => Promise<void>
  availableFormats?: Array<'csv' | 'json' | 'pdf'>
  dateRangeRequired?: boolean
  title?: string
  description?: string
}

const formatIcons = {
  csv: FileText,
  json: FileJson,
  pdf: FileType
}

const formatLabels = {
  csv: 'CSV (Comma-Separated Values)',
  json: 'JSON (JavaScript Object Notation)',
  pdf: 'PDF (Portable Document Format)'
}

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  availableFormats = ['csv', 'json', 'pdf'],
  dateRangeRequired = false,
  title = "Export Data",
  description = "Choose your export format and options"
}: ExportDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [format, setFormat] = React.useState<'csv' | 'json' | 'pdf'>(availableFormats[0])
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [includeDetails, setIncludeDetails] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setFormat(availableFormats[0])
      setStartDate("")
      setEndDate("")
      setIncludeDetails(false)
      setError(null)
      setLoading(false)
    }
  }, [open, availableFormats])

  const handleExport = async () => {
    setError(null)

    // Validate date range if required
    if (dateRangeRequired) {
      if (!startDate || !endDate) {
        setError("Please select both start and end dates")
        return
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start > end) {
        setError("Start date must be before end date")
        return
      }
    }

    setLoading(true)

    try {
      const options: ExportOptions = {
        format,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        includeDetails
      }

      await onExport(format, options)
      onOpenChange(false)
    } catch (error) {
      console.error('[ExportDialog] Error:', error)
      setError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (!loading) {
      onOpenChange(false)
    }
  }

  const isExportDisabled = loading || (dateRangeRequired && (!startDate || !endDate))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px]"
        aria-labelledby="export-dialog-title"
        aria-describedby="export-dialog-description"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"
              aria-hidden="true"
            >
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle id="export-dialog-title">{title}</DialogTitle>
          </div>
          <DialogDescription id="export-dialog-description" className="pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4" role="form" aria-label="Export options">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as 'csv' | 'json' | 'pdf')}
              disabled={loading}
            >
              <SelectTrigger id="format" aria-label="Select export format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableFormats.map((fmt) => {
                  const Icon = formatIcons[fmt]
                  return (
                    <SelectItem key={fmt} value={fmt}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{formatLabels[fmt]}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>
              Date Range {dateRangeRequired && <span className="text-red-500" aria-label="required">*</span>}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setError(null)
                  }}
                  disabled={loading}
                  max={endDate || undefined}
                  className={cn(
                    dateRangeRequired && !startDate && "border-red-500"
                  )}
                  aria-invalid={dateRangeRequired && !startDate}
                  aria-required={dateRangeRequired}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setError(null)
                  }}
                  disabled={loading}
                  min={startDate || undefined}
                  className={cn(
                    dateRangeRequired && !endDate && "border-red-500"
                  )}
                  aria-invalid={dateRangeRequired && !endDate}
                  aria-required={dateRangeRequired}
                />
              </div>
            </div>
          </div>

          {/* Include Details Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeDetails"
              checked={includeDetails}
              onCheckedChange={(checked) => setIncludeDetails(checked === true)}
              disabled={loading}
            />
            <Label
              htmlFor="includeDetails"
              className="text-sm font-normal cursor-pointer"
            >
              Include detailed information
            </Label>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="rounded-md bg-red-50 dark:bg-red-900/20 p-3"
              role="alert"
              aria-live="assertive"
            >
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExportDisabled}
            aria-busy={loading}
            aria-label={`Export data as ${format.toUpperCase()}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
