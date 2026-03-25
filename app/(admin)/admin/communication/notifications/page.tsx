"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAdminAuth } from "@/app/(admin)/providers/admin-auth-provider"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface NotificationConfigForm {
  title: string
  name: string
  description: string
  channels: string
  enabled: boolean
  isCritical: boolean
}

const defaultForm: NotificationConfigForm = {
  title: "",
  name: "",
  description: "",
  channels: "email,in_app",
  enabled: true,
  isCritical: false,
}

export default function CommunicationNotificationsPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAdminAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [configs, setConfigs] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<NotificationConfigForm>(defaultForm)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [authLoading, isAuthenticated, router])

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const response = await adminApi.communication.getNotificationConfigs()
      setConfigs(response.data?.configs ?? [])
    } catch (error) {
      console.error("[Notification Config] Failed to load", error)
      toast.error("Failed to load notification configuration")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      void fetchConfigs()
    }
  }, [authLoading, isAuthenticated])

  const openCreate = () => {
    setSelectedId(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEdit = (config: any) => {
    setSelectedId(config._id)
    setForm({
      title: config.title || "",
      name: config.name || "",
      description: config.description || "",
      channels: (config.channels || []).join(","),
      enabled: config.enabled !== false,
      isCritical: config.isCritical === true,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.title.trim()) {
      toast.error("Name and title are required")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        channels: form.channels.split(",").map((entry) => entry.trim()).filter(Boolean),
        enabled: form.enabled,
        isCritical: form.isCritical,
      }

      if (selectedId) {
        await adminApi.communication.updateNotificationConfig(selectedId, payload)
        toast.success("Notification config updated")
      } else {
        await adminApi.communication.createNotificationConfig(payload)
        toast.success("Notification config created")
      }

      setDialogOpen(false)
      await fetchConfigs()
    } catch (error) {
      console.error("[Notification Config] Failed to save", error)
      toast.error("Failed to save notification config")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSubmitting(true)
    try {
      await adminApi.communication.deleteNotificationConfig(id)
      toast.success("Notification config deleted")
      await fetchConfigs()
    } catch (error) {
      console.error("[Notification Config] Failed to delete", error)
      toast.error("Failed to delete notification config")
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return <div className="p-4 sm:p-6 lg:p-8 text-muted-foreground">Loading notification config...</div>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/communication") }>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Notification Configuration</h1>
            <p className="text-sm text-muted-foreground">Manage communication notification types and channels.</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Config</Button>
      </div>

      {configs.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">No notification configuration found.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {configs.map((config) => (
            <Card key={config._id}>
              <CardHeader>
                <CardTitle className="text-lg">{config.title || config.name}</CardTitle>
                <CardDescription>{config.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm"><span className="text-muted-foreground">Name:</span> {config.name}</p>
                <p className="text-sm"><span className="text-muted-foreground">Channels:</span> {(config.channels || []).join(", ") || "none"}</p>
                <p className="text-sm"><span className="text-muted-foreground">Enabled:</span> {config.enabled ? "Yes" : "No"}</p>
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(config)}>Edit</Button>
                  <Button variant="destructive" size="sm" disabled={submitting} onClick={() => handleDelete(config._id)}>
                    <Trash2 className="h-3 w-3 mr-1" />Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedId ? "Edit" : "Create"} Notification Config</DialogTitle>
            <DialogDescription>Define delivery behavior for a notification type.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cfg-name">Name</Label>
              <Input id="cfg-name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfg-title">Title</Label>
              <Input id="cfg-title" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfg-desc">Description</Label>
              <Input id="cfg-desc" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cfg-channels">Channels (comma separated)</Label>
              <Input id="cfg-channels" value={form.channels} onChange={(e) => setForm((prev) => ({ ...prev, channels: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Label htmlFor="cfg-enabled">Enabled</Label>
              <Switch id="cfg-enabled" checked={form.enabled} onCheckedChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cfg-critical">Critical</Label>
              <Switch id="cfg-critical" checked={form.isCritical} onCheckedChange={(isCritical) => setForm((prev) => ({ ...prev, isCritical }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>{selectedId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
