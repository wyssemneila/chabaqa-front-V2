"use client"

import * as React from "react"
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import {
  adminApi,
  type AdminExportFormat,
  type AdminExportJob,
  type AdminExportType,
  type CreateAdminExportJobDto,
} from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const ADMIN_ACCESS_TOKEN_KEY = "admin_access_token"

const exportTypeOptions: Array<{ value: AdminExportType; label: string; description: string }> = [
  { value: "users", label: "Users", description: "Profiles, status, registration, and lifecycle data." },
  { value: "communities", label: "Communities", description: "Community records, moderation state, and creators." },
  { value: "content", label: "Content", description: "Moderation queues, content flags, and publishing status." },
  { value: "financial", label: "Financial", description: "Transactions, subscriptions, payouts, and revenue records." },
  { value: "audit_logs", label: "Audit Logs", description: "Security audit trail and admin action history." },
  { value: "analytics", label: "Analytics", description: "Platform metrics and dashboard reporting datasets." },
]

const exportFormatOptions: Array<{ value: AdminExportFormat; label: string }> = [
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel" },
  { value: "json", label: "JSON" },
  { value: "pdf", label: "PDF" },
]

const suggestedFields: Record<AdminExportType, string[]> = {
  users: ["id", "email", "name", "status", "createdAt", "lastLoginAt"],
  communities: ["id", "name", "slug", "status", "creator", "createdAt"],
  content: ["id", "contentType", "status", "priority", "createdAt", "updatedAt"],
  financial: ["id", "type", "amount", "currency", "status", "createdAt"],
  audit_logs: ["id", "action", "entityType", "status", "timestamp", "ipAddress"],
  analytics: ["period", "activeUsers", "revenue", "retention", "engagement"],
}

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
}

function formatDateTime(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatFileSize(value?: number) {
  if (!value || value <= 0) return "-"
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function getStatusTone(status: AdminExportJob["status"]) {
  switch (status) {
    case "completed":
      return "default"
    case "failed":
      return "destructive"
    case "processing":
      return "secondary"
    case "expired":
      return "outline"
    default:
      return "outline"
  }
}

export default function AdminExportCenterPage() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth()
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)
  const [cleaningUp, setCleaningUp] = React.useState(false)
  const [jobs, setJobs] = React.useState<AdminExportJob[]>([])
  const [selectedType, setSelectedType] = React.useState<AdminExportType>("users")
  const [selectedFormat, setSelectedFormat] = React.useState<AdminExportFormat>("csv")
  const [filtersText, setFiltersText] = React.useState('{\n  "status": ["active"]\n}')
  const [fieldsText, setFieldsText] = React.useState("id,email,name,status,createdAt")
  const [autoRefresh, setAutoRefresh] = React.useState(true)

  const loadJobs = React.useCallback(async () => {
    setLoading(true)
    try {
      const response = await adminApi.exports.getJobs(50)
      setJobs(response.data.jobs)
    } catch (error) {
      console.error("[AdminExportCenter] Failed to load jobs", error)
      toast.error("Failed to load export jobs")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void loadJobs()
    }
  }, [authLoading, isAuthenticated, loadJobs])

  React.useEffect(() => {
    if (!autoRefresh) return
    const hasActiveJobs = jobs.some((job) => job.status === "pending" || job.status === "processing")
    if (!hasActiveJobs) return

    const timer = window.setInterval(() => {
      void loadJobs()
    }, 2500)

    return () => window.clearInterval(timer)
  }, [autoRefresh, jobs, loadJobs])

  const totals = React.useMemo(() => {
    return jobs.reduce(
      (acc, job) => {
        acc.total += 1
        if (job.status === "completed") acc.completed += 1
        if (job.status === "processing" || job.status === "pending") acc.running += 1
        if (job.status === "failed") acc.failed += 1
        return acc
      },
      { total: 0, completed: 0, running: 0, failed: 0 },
    )
  }, [jobs])

  const parsePayload = React.useCallback((): CreateAdminExportJobDto | null => {
    try {
      const parsedFilters = filtersText.trim() ? JSON.parse(filtersText) : undefined
      const fields = fieldsText
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean)

      return {
        type: selectedType,
        format: selectedFormat,
        filters: parsedFilters,
        fields: fields.length > 0 ? fields : undefined,
      }
    } catch (error) {
      toast.error("Filters must be valid JSON")
      return null
    }
  }, [fieldsText, filtersText, selectedFormat, selectedType])

  const handleCreate = async () => {
    const payload = parsePayload()
    if (!payload) return

    setCreating(true)
    try {
      const response = await adminApi.exports.createJob(payload)
      setJobs((current) => [response.data, ...current])
      toast.success("Export job created")
    } catch (error) {
      console.error("[AdminExportCenter] Failed to create export job", error)
      toast.error("Failed to create export job")
    } finally {
      setCreating(false)
    }
  }

  const handleRetry = async (job: AdminExportJob) => {
    try {
      setSelectedType(job.type)
      setSelectedFormat(job.format)
      const response = await adminApi.exports.createJob({
        type: job.type,
        format: job.format,
      })
      setJobs((current) => [response.data, ...current])
      toast.success("Retry export job queued")
    } catch (error) {
      console.error("[AdminExportCenter] Failed to retry export job", error)
      toast.error("Failed to retry export job")
    }
  }

  const handleCleanup = async () => {
    setCleaningUp(true)
    try {
      await adminApi.exports.cleanupExpiredJobs()
      await loadJobs()
      toast.success("Expired export jobs cleaned up")
    } catch (error) {
      console.error("[AdminExportCenter] Failed to clean up jobs", error)
      toast.error("Failed to clean up expired jobs")
    } finally {
      setCleaningUp(false)
    }
  }

  const handleDownload = async (job: AdminExportJob) => {
    try {
      const accessToken =
        typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) : null
      const response = await fetch(`${getApiBaseUrl()}/admin/export/jobs/${job.id}/download`, {
        method: "GET",
        credentials: "include",
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      })

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `admin-export-${job.type}-${job.id}.${job.format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Export download started")
    } catch (error) {
      console.error("[AdminExportCenter] Failed to download export", error)
      toast.error("Failed to download export file")
    }
  }

  if (authLoading || !isAuthenticated) {
    return <div className="p-4 sm:p-6 lg:p-8 text-sm text-muted-foreground">Loading export center...</div>
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export Center</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Create structured admin exports, monitor background processing, retry failed jobs, and download completed files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Label htmlFor="auto-refresh" className="text-xs text-muted-foreground">
              Auto refresh
            </Label>
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" onClick={() => void loadJobs()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleCleanup} disabled={cleaningUp}>
            <Trash2 className="mr-2 h-4 w-4" />
            {cleaningUp ? "Cleaning..." : "Cleanup Expired"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total jobs</CardDescription>
            <CardTitle className="text-3xl">{totals.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Running</CardDescription>
            <CardTitle className="text-3xl">{totals.running}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{totals.completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl">{totals.failed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Create Export Job</CardTitle>
            <CardDescription>
              Build a reusable export request with explicit type, format, filters, and fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Dataset</Label>
                <Select value={selectedType} onValueChange={(value) => {
                  const type = value as AdminExportType
                  setSelectedType(type)
                  setFieldsText(suggestedFields[type].join(","))
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {exportTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {exportTypeOptions.find((option) => option.value === selectedType)?.description}
                </p>
              </div>
              <div className="space-y-2">
                <Label>File format</Label>
                <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as AdminExportFormat)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {exportFormatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fields">Fields</Label>
              <Input
                id="fields"
                value={fieldsText}
                onChange={(event) => setFieldsText(event.target.value)}
                placeholder="id,email,name,status,createdAt"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated field names. Leave blank if the backend should include its default field set.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filters">Filters JSON</Label>
              <Textarea
                id="filters"
                value={filtersText}
                onChange={(event) => setFiltersText(event.target.value)}
                className="min-h-[220px] font-mono text-sm"
                placeholder='{\n  "status": ["active"]\n}'
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">Audit-friendly export workflow</p>
                  <p className="text-xs text-muted-foreground">
                    Exports run through the backend job system so status, timing, and downloads stay traceable.
                  </p>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
                Create Export
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recommended Payloads</CardTitle>
            <CardDescription>Fast-start presets you can paste into the filters editor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Active users created this year</p>
              <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">{`{
  "status": ["active"],
  "registrationDateRange": {
    "startDate": "2026-01-01",
    "endDate": "2026-12-31"
  }
}`}</pre>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Financial transactions by status</p>
              <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">{`{
  "status": ["completed", "refunded"],
  "currency": "TND"
}`}</pre>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Audit logs for a date range</p>
              <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs">{`{
  "dateRange": {
    "startDate": "2026-03-01",
    "endDate": "2026-03-09"
  },
  "status": "success"
}`}</pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>
            Recent jobs are listed newest first. Active jobs refresh automatically while processing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading export jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-sm text-muted-foreground">No export jobs have been created yet.</div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusTone(job.status)}>{job.status}</Badge>
                        <Badge variant="outline">{job.type}</Badge>
                        <Badge variant="outline">{job.format}</Badge>
                      </div>
                      <div>
                        <p className="font-medium">{job.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDateTime(job.createdAt)}
                          {job.completedAt ? ` • Completed ${formatDateTime(job.completedAt)}` : ""}
                        </p>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                        <div>File size: <span className="font-medium text-foreground">{formatFileSize(job.fileSize)}</span></div>
                        <div>Records: <span className="font-medium text-foreground">{job.recordCount ?? "-"}</span></div>
                        <div>Progress: <span className="font-medium text-foreground">{job.progress}%</span></div>
                      </div>
                      <div className="space-y-2">
                        <Progress value={job.progress} className="h-2" />
                        {job.errorMessage ? (
                          <p className="text-sm text-destructive">{job.errorMessage}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => void adminApi.exports.getJobStatus(job.id).then((response) => {
                        setJobs((current) => current.map((item) => (item.id === job.id ? response.data : item)))
                      }).catch((error) => {
                        console.error("[AdminExportCenter] Failed to refresh job", error)
                        toast.error("Failed to refresh job status")
                      })}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                      {job.status === "completed" ? (
                        <Button onClick={() => void handleDownload(job)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      ) : null}
                      {job.status === "failed" ? (
                        <Button variant="secondary" onClick={() => void handleRetry(job)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Retry
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
    </div>
  )
}
