"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  Mail,
  Plus,
  Timer,
  Trash2,
  UserMinus,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { emailCampaignsApi, EmailCampaign } from "@/lib/api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { cn } from "@/lib/utils"

// ─── Welcome Email ────────────────────────────────────────────────────────────

function WelcomeEmailSection() {
  const { selectedCommunityId, selectedCommunity } = useCreatorCommunity()
  const { toast } = useToast()

  const [template, setTemplate] = useState<EmailCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [expandContent, setExpandContent] = useState(false)

  // Form state (shared for create + edit)
  const [formSubject, setFormSubject] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formIsHtml, setFormIsHtml] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const isEdit = template !== null

  const load = useCallback(async () => {
    if (!selectedCommunityId) return
    setLoading(true)
    try {
      const t = await emailCampaignsApi.getWelcomeTemplate(selectedCommunityId)
      setTemplate(t)
    } catch {
      setTemplate(null)
    } finally {
      setLoading(false)
    }
  }, [selectedCommunityId])

  useEffect(() => {
    load()
  }, [load])

  const openForm = () => {
    setFormSubject(template?.subject ?? `Welcome to {{communityName}}, {{userName}}!`)
    setFormContent(
      template?.content ??
        `<p>Hi {{userName}},</p>\n<p>Welcome to <strong>{{communityName}}</strong>! We're so glad you joined.</p>\n<p>Explore the community, engage with posts, and have fun!</p>`,
    )
    setFormIsHtml(template?.isHtml ?? true)
    setShowForm(true)
  }

  const saveForm = async () => {
    if (!selectedCommunityId) return
    if (!formSubject.trim() || !formContent.trim()) {
      toast({ title: "Required fields missing", description: "Subject and content are required.", variant: "destructive" })
      return
    }
    setFormSaving(true)
    try {
      let saved: EmailCampaign
      if (isEdit && template) {
        saved = await emailCampaignsApi.updateWelcomeTemplate(selectedCommunityId, {
          subject: formSubject.trim(),
          content: formContent,
          isHtml: formIsHtml,
        })
      } else {
        saved = await emailCampaignsApi.createWelcomeTemplate(selectedCommunityId, {
          subject: formSubject.trim(),
          content: formContent,
          isHtml: formIsHtml,
          automationActive: true,
        })
      }
      setTemplate(saved)
      setShowForm(false)
      toast({ title: isEdit ? "Welcome email updated" : "Welcome email created", description: "It will be sent automatically to every new member." })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to save welcome email", variant: "destructive" })
    } finally {
      setFormSaving(false)
    }
  }

  const toggleActive = async (active: boolean) => {
    if (!selectedCommunityId || !template) return
    setToggling(true)
    try {
      const updated = await emailCampaignsApi.toggleWelcomeTemplate(selectedCommunityId, active)
      setTemplate(updated)
      toast({ title: active ? "Welcome email enabled" : "Welcome email disabled" })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to update", variant: "destructive" })
    } finally {
      setToggling(false)
    }
  }

  const deleteTemplate = async () => {
    if (!selectedCommunityId) return
    setDeleting(true)
    try {
      await emailCampaignsApi.deleteWelcomeTemplate(selectedCommunityId)
      setTemplate(null)
      setShowDeleteConfirm(false)
      toast({ title: "Welcome email deleted" })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to delete", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Card className="border-2 border-dashed border-chabaqa-primary/30 hover:border-chabaqa-primary/60 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-chabaqa-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-chabaqa-primary" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Welcome Email
                  <Badge variant="secondary" className="text-xs">Triggered on join</Badge>
                </CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  Automatically sent to every new member the moment they join your community.
                  Supports <code className="text-xs bg-gray-100 px-1 rounded">{"{{userName}}"}</code> and{" "}
                  <code className="text-xs bg-gray-100 px-1 rounded">{"{{communityName}}"}</code>.
                </CardDescription>
              </div>
            </div>

            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 flex-shrink-0 mt-1" />
            ) : template ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={template.automationActive !== false}
                  onCheckedChange={toggleActive}
                  disabled={toggling}
                  aria-label="Enable welcome email"
                />
                <Button variant="ghost" size="icon" onClick={openForm} title="Edit">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)} title="Delete" className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={openForm} className="flex-shrink-0">
                <Plus className="w-4 h-4 mr-1" />
                Set up
              </Button>
            )}
          </div>
        </CardHeader>

        {template && (
          <CardContent className="pt-0">
            <div className="rounded-lg border bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-700 mb-1">Subject</p>
              <p className="text-gray-600">{template.subject}</p>
              <button
                className="mt-2 flex items-center gap-1 text-xs text-chabaqa-primary hover:underline"
                onClick={() => setExpandContent((v) => !v)}
              >
                {expandContent ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expandContent ? "Hide content" : "Preview content"}
              </button>
              {expandContent && (
                <div className="mt-2 border-t pt-2">
                  {template.isHtml ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: template.content }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-gray-600">{template.content}</p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>{template.sentCount ?? 0} emails sent</span>
              <span>{template.openCount ?? 0} opens</span>
              <span className={cn("font-medium", template.automationActive !== false ? "text-green-600" : "text-gray-400")}>
                {template.automationActive !== false ? "Active" : "Paused"}
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Welcome Email" : "Set Up Welcome Email"}</DialogTitle>
            <DialogDescription>
              This email is sent automatically when someone joins <strong>{selectedCommunity?.name}</strong>.
              Use <code>{"{{userName}}"}</code> and <code>{"{{communityName}}"}</code> as placeholders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="welcome-subject">Subject line</Label>
              <Input
                id="welcome-subject"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder='Welcome to {{communityName}}, {{userName}}!'
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="welcome-content">Email content</Label>
              <Textarea
                id="welcome-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Hi {{userName}}, welcome to {{communityName}}!"
                rows={10}
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="welcome-html" checked={formIsHtml} onCheckedChange={setFormIsHtml} />
              <Label htmlFor="welcome-html">HTML content</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveForm} disabled={formSaving}>
              {formSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Save changes" : "Create & activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete welcome email?</AlertDialogTitle>
            <AlertDialogDescription>
              New members will no longer receive an automated welcome email. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTemplate} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── Inactivity Automation Card ───────────────────────────────────────────────

function InactivityAutomationCard({
  automation,
  onToggle,
}: {
  automation: EmailCampaign
  onToggle: (id: string, active: boolean) => void
}) {
  const [toggling, setToggling] = useState(false)
  const { toast } = useToast()
  const days = automation.metadata?.minInactiveDays ?? automation.targetDaysThreshold ?? "?"
  const isActive = automation.metadata?.automationActive !== false

  const handleToggle = async (val: boolean) => {
    setToggling(true)
    try {
      await onToggle(automation._id, val)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed", variant: "destructive" })
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border p-4 bg-white">
      <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Timer className="w-4 h-4 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm truncate">{automation.title}</p>
          <Badge variant={isActive ? "default" : "outline"} className={cn("text-xs", isActive ? "bg-green-100 text-green-700 border-green-200" : "")}>
            {isActive ? "Active" : "Paused"}
          </Badge>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Triggers when a member is inactive for <strong>{days} days</strong>
        </p>
        <p className="text-xs text-gray-400 mt-1 truncate">{automation.subject}</p>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span>{automation.sentCount ?? 0} sent</span>
          <span>{automation.openCount ?? 0} opens</span>
        </div>
      </div>
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={toggling}
        aria-label="Toggle automation"
        className="flex-shrink-0 mt-0.5"
      />
    </div>
  )
}

// ─── Inactivity Automations Section ──────────────────────────────────────────

function InactivityAutomationsSection() {
  const { selectedCommunityId, selectedCommunity } = useCreatorCommunity()
  const { toast } = useToast()

  const [automations, setAutomations] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formTitle, setFormTitle] = useState("")
  const [formSubject, setFormSubject] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formDays, setFormDays] = useState("15")
  const [formIsHtml, setFormIsHtml] = useState(false)

  const load = useCallback(async () => {
    if (!selectedCommunityId) return
    setLoading(true)
    try {
      const list = await emailCampaignsApi.getInactivityAutomations(selectedCommunityId)
      setAutomations(Array.isArray(list) ? list : [])
    } catch {
      setAutomations([])
    } finally {
      setLoading(false)
    }
  }, [selectedCommunityId])

  useEffect(() => {
    load()
  }, [load])

  const openCreateForm = () => {
    setFormTitle("We miss you!")
    setFormSubject("{{userName}}, we miss you in {{communityName}}!")
    setFormContent(`Hi {{userName}},\n\nYou haven't visited {{communityName}} in {{daysThreshold}} days. Come back and see what's new!\n\nSee you soon,\nThe {{communityName}} team`)
    setFormDays("15")
    setFormIsHtml(false)
    setShowForm(true)
  }

  const saveAutomation = async () => {
    if (!selectedCommunityId) return
    const days = parseInt(formDays, 10)
    if (isNaN(days) || days < 1) {
      toast({ title: "Invalid days", description: "Enter a number ≥ 1", variant: "destructive" })
      return
    }
    if (!formTitle.trim() || !formSubject.trim() || !formContent.trim()) {
      toast({ title: "Required fields missing", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await emailCampaignsApi.createInactivityAutomation({
        communityId: selectedCommunityId,
        title: formTitle.trim(),
        subject: formSubject.trim(),
        content: formContent,
        minInactiveDays: days,
        isHtml: formIsHtml,
      })
      await load()
      setShowForm(false)
      toast({
        title: "Inactivity automation created",
        description: `Members inactive for ${days} days will receive this email automatically every day.`,
      })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Failed to create", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string, active: boolean) => {
    const updated = await emailCampaignsApi.toggleInactivityAutomation(id, active)
    setAutomations((prev) => prev.map((a) => (a._id === id ? { ...a, metadata: { ...(a.metadata ?? {}), automationActive: active } } : a)))
    toast({ title: active ? "Automation enabled" : "Automation paused" })
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                <UserMinus className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-base">Inactivity Re-engagement</CardTitle>
                <CardDescription className="text-sm mt-0.5">
                  Automatically send a re-engagement email when a member hasn't visited for N days.
                  The system checks daily and respects a 30-day cooldown per member.
                  Supports <code className="text-xs bg-gray-100 px-1 rounded">{"{{daysThreshold}}"}</code>.
                </CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={openCreateForm} className="flex-shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              Add rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
              <UserMinus className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No inactivity rules yet</p>
              <p className="text-xs mt-1">Add a rule to automatically reach inactive members.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map((a) => (
                <InactivityAutomationCard key={a._id} automation={a} onToggle={handleToggle} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Inactivity Automation</DialogTitle>
            <DialogDescription>
              This email will be sent automatically every day to members whose last visit was exactly{" "}
              <strong>N days ago</strong>. Each member can receive it at most once every 30 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="ia-title">Rule name</Label>
                <Input id="ia-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder='e.g. "We miss you — 15 days"' className="mt-1" />
              </div>
              <div>
                <Label htmlFor="ia-days">
                  Inactive days
                  <span className="ml-1 text-xs text-gray-400">(min 1)</span>
                </Label>
                <Input
                  id="ia-days"
                  type="number"
                  min={1}
                  max={365}
                  value={formDays}
                  onChange={(e) => setFormDays(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="ia-subject">Email subject</Label>
              <Input
                id="ia-subject"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                placeholder="{{userName}}, we miss you in {{communityName}}!"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ia-content">
                Email content
                <span className="ml-2 text-xs text-gray-400">Variables: {"{{userName}}"}, {"{{communityName}}"}, {"{{daysThreshold}}"}</span>
              </Label>
              <Textarea
                id="ia-content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={8}
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="ia-html" checked={formIsHtml} onCheckedChange={setFormIsHtml} />
              <Label htmlFor="ia-html">HTML content</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveAutomation} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function AutomationsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-chabaqa-primary/5 to-purple-50 border border-chabaqa-primary/10">
        <div className="w-10 h-10 rounded-full bg-chabaqa-primary/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-chabaqa-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Email Automations</h3>
          <p className="text-sm text-gray-500">
            Set-and-forget emails that fire automatically based on member behaviour — no manual work needed.
          </p>
        </div>
      </div>

      {/* Welcome email */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Bot className="w-4 h-4 text-chabaqa-primary" />
          Onboarding
        </h4>
        <WelcomeEmailSection />
      </div>

      {/* Inactivity automations */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Timer className="w-4 h-4 text-orange-500" />
          Re-engagement Rules
        </h4>
        <InactivityAutomationsSection />
      </div>
    </div>
  )
}
