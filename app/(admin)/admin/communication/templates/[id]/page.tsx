"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Copy, RotateCcw, Send } from "lucide-react"
import { toast } from "sonner"

interface TemplateDetailPageProps {
  params: {
    id: string
  }
}

export default function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [template, setTemplate] = useState<any | null>(null)
  const [versions, setVersions] = useState<Array<{ version: number; subject: string; createdAt: string }>>([])
  const [preview, setPreview] = useState<{ subject: string; content: string } | null>(null)

  const [previewData, setPreviewData] = useState('{"name":"Admin"}')
  const [duplicateName, setDuplicateName] = useState("")
  const [testEmail, setTestEmail] = useState("")

  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)

  const parsedPreviewData = useMemo(() => {
    try {
      return JSON.parse(previewData)
    } catch {
      return null
    }
  }, [previewData])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  const loadData = async () => {
    setLoading(true)
    try {
      const [templateResponse, versionsResponse] = await Promise.all([
        adminApi.communication.getEmailTemplateById(params.id),
        adminApi.communication.getTemplateVersionHistory(params.id),
      ])

      setTemplate(templateResponse.data)
      setVersions((versionsResponse.data?.versions ?? []).map((entry) => ({
        version: entry.version,
        subject: entry.subject,
        createdAt: entry.createdAt,
      })))
      setDuplicateName(`${templateResponse.data?.name || "Template"} Copy`)
    } catch (error) {
      console.error("[Template Detail] Failed to load", error)
      toast.error("Failed to load template details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void loadData()
    }
  }, [authLoading, isAuthenticated])

  const handlePreview = async () => {
    if (!parsedPreviewData || typeof parsedPreviewData !== "object") {
      toast.error("Preview JSON must be a valid object")
      return
    }

    setSubmitting(true)
    try {
      const response = await adminApi.communication.previewTemplate(params.id, parsedPreviewData as Record<string, unknown>)
      setPreview(response.data)
      toast.success("Preview generated")
    } catch (error) {
      console.error("[Template Preview] Failed", error)
      toast.error("Failed to generate preview")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestore = async (version: number) => {
    setSubmitting(true)
    try {
      await adminApi.communication.restoreTemplateVersion(params.id, version)
      toast.success(`Restored version ${version}`)
      await loadData()
    } catch (error) {
      console.error("[Template Restore] Failed", error)
      toast.error("Failed to restore template version")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDuplicate = async () => {
    if (!duplicateName.trim()) {
      toast.error("Duplicate name is required")
      return
    }

    setSubmitting(true)
    try {
      const response = await adminApi.communication.duplicateTemplate(params.id, duplicateName.trim())
      toast.success("Template duplicated")
      setDuplicateOpen(false)
      router.push(`/admin/communication/templates/${response.data?._id}`)
    } catch (error) {
      console.error("[Template Duplicate] Failed", error)
      toast.error("Failed to duplicate template")
    } finally {
      setSubmitting(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Test email is required")
      return
    }
    if (!parsedPreviewData || typeof parsedPreviewData !== "object") {
      toast.error("Test data JSON must be a valid object")
      return
    }

    setSubmitting(true)
    try {
      await adminApi.communication.sendTestEmail(params.id, {
        testEmail: testEmail.trim(),
        testData: parsedPreviewData as Record<string, unknown>,
      })
      toast.success("Test email sent")
      setTestOpen(false)
    } catch (error) {
      console.error("[Template Test] Failed", error)
      toast.error("Failed to send test email")
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-muted-foreground">Loading template...</div>
  }

  if (!template) {
    return <div className="p-4 sm:p-6 lg:p-8 text-destructive">Template not found.</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/communication/templates")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{template.name}</h1>
            <p className="text-sm text-muted-foreground">Template advanced actions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDuplicateOpen(true)}>
            <Copy className="h-4 w-4 mr-2" />Duplicate
          </Button>
          <Button variant="outline" onClick={() => setTestOpen(true)}>
            <Send className="h-4 w-4 mr-2" />Send Test
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Generate rendered content using test data JSON.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={previewData} onChange={(e) => setPreviewData(e.target.value)} rows={5} />
          <Button onClick={handlePreview} disabled={submitting}>Generate Preview</Button>
          {preview && (
            <div className="space-y-3 border rounded-md p-4">
              <div>
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="font-medium">{preview.subject}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Content</p>
                <div className="text-sm whitespace-pre-wrap">{preview.content}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>Restore an older version as the active content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No versions available.</p>
          ) : (
            versions.map((version) => (
              <div key={`${version.version}-${version.createdAt}`} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <p className="font-medium">Version {version.version}</p>
                  <p className="text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{version.subject}</p>
                </div>
                <Button variant="outline" disabled={submitting} onClick={() => handleRestore(version.version)}>
                  <RotateCcw className="h-4 w-4 mr-2" />Restore
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Template</DialogTitle>
            <DialogDescription>Create a copy with a new name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">New name</Label>
            <Input id="duplicate-name" value={duplicateName} onChange={(e) => setDuplicateName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>Cancel</Button>
            <Button onClick={handleDuplicate} disabled={submitting}>Duplicate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>Send test output to a mailbox.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email</Label>
              <Input id="test-email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="test@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-data">Test data JSON</Label>
              <Textarea id="test-data" value={previewData} onChange={(e) => setPreviewData(e.target.value)} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestOpen(false)}>Cancel</Button>
            <Button onClick={handleTestEmail} disabled={submitting}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
