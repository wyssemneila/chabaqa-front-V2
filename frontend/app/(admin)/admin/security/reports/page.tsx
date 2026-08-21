"use client"

import * as React from "react"
import { FileText, ShieldAlert, ShieldCheck, Siren } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { adminApi } from "@/lib/api/admin-api"

export default function SecurityReportsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [auditReport, setAuditReport] = React.useState<any | null>(null)
  const [complianceReport, setComplianceReport] = React.useState<any | null>(null)
  const [incidentId, setIncidentId] = React.useState("")
  const [incidentReport, setIncidentReport] = React.useState<any | null>(null)
  const [incidentLoading, setIncidentLoading] = React.useState(false)

  const loadReports = React.useCallback(async () => {
    setLoading(true)
    try {
      const [auditRes, complianceRes] = await Promise.all([
        adminApi.security.getAuditReport(),
        adminApi.security.getComplianceReport(),
      ])
      setAuditReport(auditRes.data)
      setComplianceReport(complianceRes.data)
    } catch (error) {
      console.error("[SecurityReports] Failed to load reports", error)
      toast({
        title: "Error",
        description: "Failed to load security reports.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    void loadReports()
  }, [loadReports])

  const loadIncidentReport = async () => {
    const id = incidentId.trim()
    if (!id) {
      toast({
        title: "Missing incident ID",
        description: "Enter an incident ID to generate the incident report.",
        variant: "destructive",
      })
      return
    }

    setIncidentLoading(true)
    try {
      const response = await adminApi.security.getIncidentReport(id)
      setIncidentReport(response.data)
    } catch (error) {
      console.error("[SecurityReports] Failed to load incident report", error)
      toast({
        title: "Error",
        description: "Failed to load incident report for this ID.",
        variant: "destructive",
      })
    } finally {
      setIncidentLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold">Security Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Audit report, compliance report, and incident report generation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Audit Report
            </CardTitle>
            <CardDescription>Live data from `/admin/security/audit/report`.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading audit report...</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div>Risk score: <span className="font-semibold">{auditReport?.riskScore ?? 0}</span></div>
                <div>Alerts: <span className="font-semibold">{auditReport?.alerts?.length ?? 0}</span></div>
                <div>Recommendations: <span className="font-semibold">{auditReport?.recommendations?.length ?? 0}</span></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Compliance Report
            </CardTitle>
            <CardDescription>Live data from `/admin/security/compliance/report`.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading compliance report...</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div>Compliance score: <span className="font-semibold">{complianceReport?.complianceScore ?? 0}%</span></div>
                <div>Recommendations: <span className="font-semibold">{complianceReport?.recommendations?.length ?? 0}</span></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Siren className="h-5 w-5" />
            Incident Report
          </CardTitle>
          <CardDescription>Generate report from `/admin/security/incidents/:incidentId/report`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:max-w-md space-y-2">
              <Label htmlFor="incidentId">Incident ID</Label>
              <Input
                id="incidentId"
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
                placeholder="Enter incident ID from security events"
              />
            </div>
            <Button onClick={loadIncidentReport} disabled={incidentLoading}>
              <FileText className="mr-2 h-4 w-4" />
              {incidentLoading ? "Generating..." : "Generate Incident Report"}
            </Button>
          </div>

          {incidentReport && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm">
                <div>Severity: <span className="font-semibold">{incidentReport.incident?.severity}</span></div>
                <div>Impact: <span className="font-semibold">{incidentReport.impact}</span></div>
                <div>Related logs: <span className="font-semibold">{incidentReport.relatedLogs?.length ?? 0}</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
