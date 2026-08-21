"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Clock3, Loader2, RefreshCw, ShieldCheck, SquareX } from "lucide-react"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { BulkOperationProgress, type BulkOperationItem } from "@/app/(admin)/_components/bulk-operation-progress"
import { adminApi, type AdminBulkOperationProgress, type AdminValidationResult } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

function formatDateTime(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatEta(seconds?: number) {
  if (!seconds || seconds <= 0) return "-"
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  return `${minutes}m ${remainder}s`
}

function toProgressItems(operation: AdminBulkOperationProgress): BulkOperationItem[] {
  const failures = operation.failures ?? []
  const successItems = Array.from({ length: operation.successCount }, (_, index) => ({
    id: `success-${operation.operationId}-${index}`,
    label: `Processed item ${index + 1}`,
    status: "success" as const,
  }))
  const failureItems = failures.map((failure) => ({
    id: failure.itemId,
    label: failure.itemId,
    status: "error" as const,
    error: failure.error,
  }))
  const pendingCount = Math.max(operation.totalItems - operation.processedItems, 0)
  const pendingItems = Array.from({ length: pendingCount }, (_, index) => ({
    id: `pending-${operation.operationId}-${index}`,
    label: `Pending item ${operation.processedItems + index + 1}`,
    status: operation.status === "in_progress" ? ("processing" as const) : ("pending" as const),
  }))

  return [...failureItems, ...successItems, ...pendingItems]
}

function validationTone(result: AdminValidationResult | null) {
  if (!result) return "outline"
  if (result.isValid && (result.errors?.length ?? 0) === 0) return "default"
  return "destructive"
}

export default function AdminDataManagementPage() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [autoRefresh, setAutoRefresh] = React.useState(true)
  const [operations, setOperations] = React.useState<AdminBulkOperationProgress[]>([])
  const [selectedOperation, setSelectedOperation] = React.useState<AdminBulkOperationProgress | null>(null)
  const [validationSubmitting, setValidationSubmitting] = React.useState(false)
  const [validationResult, setValidationResult] = React.useState<AdminValidationResult | null>(null)
  const [constraintsText, setConstraintsText] = React.useState('{\n  "email": {\n    "required": true,\n    "type": "email"\n  },\n  "role": {\n    "enum": ["admin", "moderator"]\n  }\n}')
  const [dataText, setDataText] = React.useState('{\n  "email": "ops@chabaqa.com",\n  "role": "admin"\n}')

  const loadOperations = React.useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true)
    else setRefreshing(true)

    try {
      const response = await adminApi.dataManagement.getActiveOperations()
      setOperations(response.data)
      setSelectedOperation((current) =>
        current ? response.data.find((item) => item.operationId === current.operationId) ?? current : null,
      )
    } catch (error) {
      console.error("[AdminDataManagement] Failed to load operations", error)
      toast.error("Failed to load bulk operations")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void loadOperations()
    }
  }, [authLoading, isAuthenticated, loadOperations])

  React.useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => {
      void loadOperations(false)
    }, 2500)
    return () => window.clearInterval(timer)
  }, [autoRefresh, loadOperations])

  const summary = React.useMemo(() => {
    return operations.reduce(
      (acc, operation) => {
        acc.total += 1
        if (operation.status === "in_progress" || operation.status === "pending") acc.running += 1
        if (operation.status === "failed" || operation.status === "partially_completed") acc.atRisk += 1
        acc.items += operation.totalItems
        return acc
      },
      { total: 0, running: 0, atRisk: 0, items: 0 },
    )
  }, [operations])

  const handleCancel = async (operationId: string) => {
    try {
      await adminApi.dataManagement.cancelOperation(operationId)
      await loadOperations(false)
      toast.success("Bulk operation cancelled")
    } catch (error) {
      console.error("[AdminDataManagement] Failed to cancel operation", error)
      toast.error("Failed to cancel operation")
    }
  }

  const handleValidate = async () => {
    try {
      setValidationSubmitting(true)
      const payload = {
        data: JSON.parse(dataText),
        constraints: JSON.parse(constraintsText),
      }
      const response = await adminApi.dataManagement.validate(payload)
      setValidationResult(response.data)
      toast.success(response.data.isValid ? "Validation passed" : "Validation returned issues")
    } catch (error) {
      console.error("[AdminDataManagement] Validation failed", error)
      toast.error("Validation payload must be valid JSON")
    } finally {
      setValidationSubmitting(false)
    }
  }

  if (authLoading || !isAuthenticated) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-muted-foreground">Loading bulk operations...</div>
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Operations Monitor</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Track active background operations, inspect failures, cancel long-running jobs, and validate payloads before bulk workflows are triggered elsewhere in the admin suite.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Label htmlFor="operations-auto-refresh" className="text-xs text-muted-foreground">
              Auto refresh
            </Label>
            <Switch id="operations-auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" onClick={() => void loadOperations(false)} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active operations</CardDescription>
            <CardTitle className="text-3xl">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Currently running</CardDescription>
            <CardTitle className="text-3xl">{summary.running}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Items in flight</CardDescription>
            <CardTitle className="text-3xl">{summary.items}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Need review</CardDescription>
            <CardTitle className="text-3xl">{summary.atRisk}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Live Operation Feed</CardTitle>
            <CardDescription>
              Operations here come directly from the backend progress tracker and update on a short polling interval.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading active operations...
              </div>
            ) : operations.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-3 font-medium">No active bulk operations</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  When admins run long-running bulk tasks, progress and failures will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {operations.map((operation) => (
                  <div key={operation.operationId} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={operation.status === "failed" || operation.status === "partially_completed" ? "destructive" : "outline"}>
                            {operation.status}
                          </Badge>
                          <Badge variant="outline">{operation.operationId}</Badge>
                        </div>
                        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
                          <div>Processed: <span className="font-medium text-foreground">{operation.processedItems}/{operation.totalItems}</span></div>
                          <div>Success: <span className="font-medium text-foreground">{operation.successCount}</span></div>
                          <div>Failures: <span className="font-medium text-foreground">{operation.failureCount}</span></div>
                          <div>ETA: <span className="font-medium text-foreground">{formatEta(operation.estimatedTimeRemaining)}</span></div>
                        </div>
                        <div className="space-y-2">
                          <Progress value={operation.progressPercentage} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Started {formatDateTime(operation.startedAt)}</span>
                            <span>{operation.progressPercentage}% complete</span>
                          </div>
                        </div>
                        {(operation.failures?.length ?? 0) > 0 ? (
                          <div className="rounded-lg border bg-destructive/5 p-3 text-sm">
                            <p className="font-medium text-destructive">Latest failure</p>
                            <p className="mt-1 text-muted-foreground">
                              {operation.failures?.[0]?.itemId}: {operation.failures?.[0]?.error}
                            </p>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setSelectedOperation(operation)}>
                          View details
                        </Button>
                        {(operation.status === "in_progress" || operation.status === "pending") ? (
                          <Button variant="destructive" onClick={() => void handleCancel(operation.operationId)}>
                            <SquareX className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Validation Console</CardTitle>
            <CardDescription>
              Test candidate bulk payloads against the backend validation endpoint before pushing them through admin workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="validation-constraints">Constraints JSON</Label>
              <Textarea
                id="validation-constraints"
                value={constraintsText}
                onChange={(event) => setConstraintsText(event.target.value)}
                className="min-h-[220px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validation-data">Data JSON</Label>
              <Textarea
                id="validation-data"
                value={dataText}
                onChange={(event) => setDataText(event.target.value)}
                className="min-h-[180px] font-mono text-sm"
              />
            </div>
            <Button onClick={handleValidate} disabled={validationSubmitting}>
              {validationSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Validate Payload
            </Button>

            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Badge variant={validationTone(validationResult)}>
                  {validationResult ? (validationResult.isValid ? "Valid" : "Has issues") : "Awaiting validation"}
                </Badge>
                {validationResult?.isValid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : validationResult ? (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                ) : (
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {!validationResult ? (
                <p className="mt-3 text-sm text-muted-foreground">Run validation to inspect structured errors, warnings, and sanitized output.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium">Errors</p>
                    {validationResult.errors.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">No validation errors.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {validationResult.errors.map((error, index) => (
                          <div key={`${error.field}-${index}`} className="rounded-lg border bg-destructive/5 p-3 text-sm">
                            <p className="font-medium">{error.field || "field"}</p>
                            <p className="text-muted-foreground">{error.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium">Warnings</p>
                    {validationResult.warnings && validationResult.warnings.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {validationResult.warnings.map((warning, index) => (
                          <div key={`${warning.field}-${index}`} className="rounded-lg border bg-amber-50 p-3 text-sm">
                            <p className="font-medium">{warning.field || "field"}</p>
                            <p className="text-muted-foreground">{warning.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">No warnings.</p>
                    )}
                  </div>

                  {validationResult.sanitizedData ? (
                    <div>
                      <p className="text-sm font-medium">Sanitized output</p>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                        {JSON.stringify(validationResult.sanitizedData, null, 2)}
                      </pre>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <BulkOperationProgress
        open={Boolean(selectedOperation)}
        onOpenChange={(open) => {
          if (!open) setSelectedOperation(null)
        }}
        title={selectedOperation ? `Operation ${selectedOperation.operationId}` : "Operation details"}
        items={selectedOperation ? toProgressItems(selectedOperation) : []}
        canCancel={selectedOperation?.status === "in_progress" || selectedOperation?.status === "pending"}
        onCancel={
          selectedOperation
            ? () => {
                void handleCancel(selectedOperation.operationId)
                setSelectedOperation(null)
              }
            : undefined
        }
      />
    </div>
  )
}
