"use client"

import * as React from "react"
import Link from "next/link"
import { Download, Eye, FileText, Send, ShieldCheck, Siren, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { DataTable, ColumnDef } from "@/app/(admin)/_components/data-table"
import { FilterPanel, FilterConfig } from "@/app/(admin)/_components/filter-panel"
import { ExportDialog } from "@/app/(admin)/_components/export-dialog"
import { adminApi, AuditLogFilters, type AdminAuditLog, type AdminComplianceReport, type AdminSecurityAuditReport, type AdminSecurityConfig, type AdminSecurityNotificationStats } from "@/lib/api/admin-api"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function AuditLogsPage() {
  const { toast } = useToast()
  
  // State
  const [logs, setLogs] = React.useState<AdminAuditLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false)
  const [detailLog, setDetailLog] = React.useState<AdminAuditLog | null>(null)
  const [configSaving, setConfigSaving] = React.useState(false)
  const [securityConfig, setSecurityConfig] = React.useState<AdminSecurityConfig>({
    maxFailedLogins: 5,
    failedLoginTimeWindow: 15,
    maxActionsPerHour: 100,
    maxBulkOperationsPerDay: 10,
    maxDataExportsPerDay: 5,
    businessHoursStart: 8,
    businessHoursEnd: 18,
    enableGeographicMonitoring: false,
    allowedCountries: [],
    notifyOnCritical: true,
    notifyOnHigh: true,
    alertRecipients: [],
  })
  const [notificationStats, setNotificationStats] = React.useState<AdminSecurityNotificationStats | null>(null)
  const [auditReport, setAuditReport] = React.useState<AdminSecurityAuditReport | null>(null)
  const [complianceReport, setComplianceReport] = React.useState<AdminComplianceReport | null>(null)
  const [reportLoading, setReportLoading] = React.useState(true)
  
  // Pagination state
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [total, setTotal] = React.useState(0)
  
  // Sorting state
  const [sortBy, setSortBy] = React.useState('timestamp')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  
  // Filter state
  const [filterValues, setFilterValues] = React.useState<Record<string, any>>({
    action: '',
    entityType: '',
    entityId: '',
    adminUserId: '',
    status: '',
    searchTerm: '',
    ipAddress: '',
    dateRange: { from: '', to: '' }
  })

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'action',
      label: 'Action',
      type: 'select',
      options: [
        { label: 'All Actions', value: 'all' },
        { label: 'User Create', value: 'user_create' },
        { label: 'User Update', value: 'user_update' },
        { label: 'User Suspend', value: 'user_suspend' },
        { label: 'User Activate', value: 'user_activate' },
        { label: 'User Delete', value: 'user_delete' },
        { label: 'Community Approve', value: 'community_approve' },
        { label: 'Community Reject', value: 'community_reject' },
        { label: 'Content Moderate', value: 'content_moderate' },
        { label: 'Payout Process', value: 'payout_process' },
        { label: 'System Config', value: 'system_configuration' },
        { label: 'Audit View', value: 'audit_log_view' },
        { label: 'Audit Export', value: 'audit_log_export' },
      ],
      placeholder: 'Select action...'
    },
    {
      key: 'entityType',
      label: 'Entity Type',
      type: 'select',
      options: [
        { label: 'All Types', value: 'all' },
        { label: 'User', value: 'User' },
        { label: 'Community', value: 'Community' },
        { label: 'Content', value: 'Content' },
        { label: 'Payout', value: 'Payout' },
        { label: 'Campaign', value: 'Campaign' },
        { label: 'Security Config', value: 'SecurityConfig' },
      ],
      placeholder: 'Select entity type...'
    },
    {
      key: 'adminUserId',
      label: 'Admin User',
      type: 'text',
      placeholder: 'Enter admin user ID...'
    },
    {
      key: 'entityId',
      label: 'Entity ID',
      type: 'text',
      placeholder: 'Enter entity ID...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
      ],
      placeholder: 'Select status...'
    },
    {
      key: 'searchTerm',
      label: 'Search',
      type: 'text',
      placeholder: 'Search action, entity, metadata...'
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      type: 'text',
      placeholder: 'Enter IP address...'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'dateRange'
    }
  ]

  // Column definitions
  const columns: ColumnDef<AdminAuditLog>[] = [
    {
      id: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      cell: (row) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">
            {new Date(row.timestamp).toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(row.timestamp), { addSuffix: true })}
          </div>
        </div>
      ),
      width: '200px'
    },
    {
      id: 'action',
      header: 'Action',
      accessorKey: 'action',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">{row.action}</div>
      ),
      width: '180px'
    },
    {
      id: 'adminUser',
      header: 'Admin User',
      cell: (row) => (
        <div className="space-y-1">
          <div className="text-sm font-medium">{row.adminUser.name}</div>
          <div className="text-xs text-muted-foreground">{row.adminUser._id}</div>
        </div>
      ),
      width: '180px'
    },
    {
      id: 'entityType',
      header: 'Entity Type',
      accessorKey: 'entityType',
      sortable: true,
      width: '120px'
    },
    {
      id: 'entityId',
      header: 'Entity ID',
      accessorKey: 'entityId',
      cell: (row) => (
        <div className="font-mono text-xs">{row.entityId}</div>
      ),
      width: '150px'
    },
    {
      id: 'ipAddress',
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: (row) => (
        <div className="font-mono text-xs">{row.ipAddress}</div>
      ),
      width: '130px'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            handleViewDetails(row)
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      ),
      width: '100px'
    }
  ]

  // Fetch audit logs
  const fetchLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      const filters: AuditLogFilters = {
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
        action: filterValues.action || undefined,
        entityType: filterValues.entityType || undefined,
        adminUserId: filterValues.adminUserId || undefined,
        ipAddress: filterValues.ipAddress || undefined,
        startDate: filterValues.dateRange?.from || undefined,
        endDate: filterValues.dateRange?.to || undefined
      }

      const response = await adminApi.security.searchAuditLogs(filters)
      
      if (response.data) {
        setLogs(response.data.data || [])
        setTotal(response.data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('[Audit Logs] Fetch error:', error)
      toast({
        title: "Error",
        description: "Failed to load audit logs. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, sortOrder, filterValues, toast])

  const fetchSecurityAdminData = React.useCallback(async () => {
    setReportLoading(true)
    try {
      const [configRes, notificationStatsRes, auditReportRes, complianceReportRes] = await Promise.all([
        adminApi.security.getSecurityConfig(),
        adminApi.security.getNotificationStatistics(),
        adminApi.security.getAuditReport(),
        adminApi.security.getComplianceReport(),
      ])

      setSecurityConfig(configRes.data)
      setNotificationStats(notificationStatsRes.data)
      setAuditReport(auditReportRes.data)
      setComplianceReport(complianceReportRes.data)
    } catch (error) {
      console.error("[Security Dashboard] Failed to load security admin data", error)
      toast({
        title: "Error",
        description: "Failed to load security configuration and reports.",
        variant: "destructive",
      })
    } finally {
      setReportLoading(false)
    }
  }, [toast])

  // Load logs on mount and when dependencies change
  React.useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  React.useEffect(() => {
    fetchSecurityAdminData()
  }, [fetchSecurityAdminData])

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value === 'all' ? '' : value }))
  }

  // Handle filter reset
  const handleFilterReset = () => {
    setFilterValues({
      action: '',
      entityType: '',
      entityId: '',
      adminUserId: '',
      status: '',
      searchTerm: '',
      ipAddress: '',
      dateRange: { from: '', to: '' }
    })
  }

  // Handle filter apply
  const handleFilterApply = () => {
    setPage(1) // Reset to first page
    fetchLogs()
  }

  // Handle sorting
  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page
  }

  // Handle view details
  const handleViewDetails = (log: AdminAuditLog) => {
    setDetailLog(log)
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'json' | 'pdf', options: any) => {
    try {
      const filters: AuditLogFilters = {
        action: filterValues.action || undefined,
        entityType: filterValues.entityType || undefined,
        entityId: filterValues.entityId || undefined,
        adminUserId: filterValues.adminUserId || undefined,
        status: filterValues.status || undefined,
        searchTerm: filterValues.searchTerm || undefined,
        ipAddress: filterValues.ipAddress || undefined,
        startDate: options.startDate || filterValues.dateRange?.from || undefined,
        endDate: options.endDate || filterValues.dateRange?.to || undefined
      }

      const response = await adminApi.security.exportAuditLogsCustom({
        format: format === 'pdf' ? 'csv' : format,
        fields: options.fields,
        adminUserId: filters.adminUserId,
        action: filters.action,
        entityType: filters.entityType,
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      
      // Create download link
      const blob = new Blob([response.data.content || response.data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Audit logs exported successfully"
      })
      
      setExportDialogOpen(false)
    } catch (error) {
      console.error('[Audit Logs] Export error:', error)
      toast({
        title: "Error",
        description: "Failed to export audit logs. Please try again.",
        variant: "destructive"
      })
    }
  }

  const updateConfigField = <K extends keyof AdminSecurityConfig>(key: K, value: AdminSecurityConfig[K]) => {
    setSecurityConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveConfig = async () => {
    setConfigSaving(true)
    try {
      const response = await adminApi.security.updateSecurityConfig(securityConfig)
      setSecurityConfig(response.data)
      toast({
        title: "Success",
        description: "Security configuration updated successfully.",
      })
    } catch (error) {
      console.error("[Security Dashboard] Config save failed", error)
      toast({
        title: "Error",
        description: "Failed to update security configuration.",
        variant: "destructive",
      })
    } finally {
      setConfigSaving(false)
    }
  }

  const handleSendTestAlert = async () => {
    try {
      await adminApi.security.sendTestAlert()
      await fetchSecurityAdminData()
      toast({
        title: "Success",
        description: "Test security alert sent successfully.",
      })
    } catch (error) {
      console.error("[Security Dashboard] Test alert failed", error)
      toast({
        title: "Error",
        description: "Failed to send test security alert.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            View and export administrative action logs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/security/reports">
              <FileText className="mr-2 h-4 w-4" />
              Security Reports
            </Link>
          </Button>
          <Button onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border-0 shadow-lg xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Security Configuration
            </CardTitle>
            <CardDescription>Live backend-backed thresholds and monitoring settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxFailedLogins">Max failed logins</Label>
                <Input
                  id="maxFailedLogins"
                  type="number"
                  value={securityConfig.maxFailedLogins ?? 0}
                  onChange={(e) => updateConfigField("maxFailedLogins", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="failedLoginTimeWindow">Window (minutes)</Label>
                <Input
                  id="failedLoginTimeWindow"
                  type="number"
                  value={securityConfig.failedLoginTimeWindow ?? 0}
                  onChange={(e) => updateConfigField("failedLoginTimeWindow", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxActionsPerHour">Max actions / hour</Label>
                <Input
                  id="maxActionsPerHour"
                  type="number"
                  value={securityConfig.maxActionsPerHour ?? 0}
                  onChange={(e) => updateConfigField("maxActionsPerHour", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDataExportsPerDay">Max exports / day</Label>
                <Input
                  id="maxDataExportsPerDay"
                  type="number"
                  value={securityConfig.maxDataExportsPerDay ?? 0}
                  onChange={(e) => updateConfigField("maxDataExportsPerDay", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="alertRecipients">Alert recipients</Label>
              <Input
                id="alertRecipients"
                value={(securityConfig.alertRecipients || []).join(", ")}
                onChange={(e) =>
                  updateConfigField(
                    "alertRecipients",
                    e.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="security@example.com, ops@example.com"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Notify on critical alerts</p>
                <p className="text-xs text-muted-foreground">Immediate notification channel for critical events.</p>
              </div>
              <Switch
                checked={Boolean(securityConfig.notifyOnCritical)}
                onCheckedChange={(checked) => updateConfigField("notifyOnCritical", checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Geographic monitoring</p>
                <p className="text-xs text-muted-foreground">Track suspicious country changes for admin access.</p>
              </div>
              <Switch
                checked={Boolean(securityConfig.enableGeographicMonitoring)}
                onCheckedChange={(checked) => updateConfigField("enableGeographicMonitoring", checked)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveConfig} disabled={configSaving}>
                <Save className="mr-2 h-4 w-4" />
                Save Config
              </Button>
              <Button variant="outline" onClick={handleSendTestAlert}>
                <Send className="mr-2 h-4 w-4" />
                Send Test Alert
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:col-span-2">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Risk Score</CardTitle>
                <CardDescription>Computed from unresolved alerts and audit behavior.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{reportLoading ? "..." : auditReport?.riskScore ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Compliance Score</CardTitle>
                <CardDescription>Current compliance posture based on backend checks.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{reportLoading ? "..." : complianceReport?.complianceScore ?? 0}%</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notification Delivery</CardTitle>
                <CardDescription>Admin security notification pipeline status.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-sm">Sent: <span className="font-semibold">{notificationStats?.sent ?? 0}</span></div>
                <div className="text-sm">Pending: <span className="font-semibold">{notificationStats?.pending ?? 0}</span></div>
                <div className="text-sm">Failed: <span className="font-semibold">{notificationStats?.failed ?? 0}</span></div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Siren className="h-5 w-5" />
                  Security Recommendations
                </CardTitle>
                <CardDescription>Generated from the audit report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(auditReport?.recommendations || []).map((item) => (
                  <div key={item} className="rounded-lg border p-3 text-sm">
                    {item}
                  </div>
                ))}
                {!reportLoading && (!auditReport?.recommendations || auditReport.recommendations.length === 0) && (
                  <p className="text-sm text-muted-foreground">No recommendations returned.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Compliance Recommendations
                </CardTitle>
                <CardDescription>Action items from the compliance report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(complianceReport?.recommendations || []).map((item) => (
                  <div key={item} className="rounded-lg border p-3 text-sm">
                    {item}
                  </div>
                ))}
                {!reportLoading && (!complianceReport?.recommendations || complianceReport.recommendations.length === 0) && (
                  <p className="text-sm text-muted-foreground">No compliance recommendations returned.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filterConfigs}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleFilterReset}
        onApply={handleFilterApply}
        collapsible
      />

      {/* Data Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            {total} log {total === 1 ? 'entry' : 'entries'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: handlePageChange,
              onPageSizeChange: handlePageSizeChange
            }}
            sorting={{
              sortBy,
              sortOrder,
              onSortChange: handleSortChange
            }}
            emptyMessage="No audit logs found"
          />
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
        availableFormats={['csv', 'json']}
        dateRangeRequired={false}
      />

      <Dialog open={Boolean(detailLog)} onOpenChange={(open) => !open && setDetailLog(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Audit Log Detail</DialogTitle>
            <DialogDescription>
              Review the complete audit context instead of relying on a transient toast.
            </DialogDescription>
          </DialogHeader>
          {detailLog && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <div><span className="font-medium">Action:</span> {detailLog.action}</div>
                <div><span className="font-medium">Entity:</span> {detailLog.entityType}</div>
                <div><span className="font-medium">Entity ID:</span> <span className="font-mono text-xs">{detailLog.entityId}</span></div>
                <div><span className="font-medium">Admin:</span> {detailLog.adminUser.name}</div>
                <div><span className="font-medium">IP Address:</span> {detailLog.ipAddress}</div>
                <div><span className="font-medium">User Agent:</span> {detailLog.userAgent || "N/A"}</div>
                <div><span className="font-medium">Status:</span> {detailLog.status}</div>
                <div><span className="font-medium">Timestamp:</span> {new Date(detailLog.timestamp).toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <Label>Changes</Label>
                <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs">
                  {JSON.stringify(detailLog.changes || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
