"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Send,
  Users,
  MessageSquare,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { communityInvitationsApi } from "@/lib/api/community-invitations.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { TemplatePicker } from "./template-picker"
import { fillTemplate, type InvitationTemplate } from "@/lib/invitation-templates"

interface ParsedContact {
  email: string
  name: string
  valid: boolean
}

interface ImportContactsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityId: string
  onSuccess: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmailLine(line: string): ParsedContact | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // Handle "Name <email>" format
  const angleMatch = trimmed.match(/^(.+?)\s*<([^>]+)>$/)
  if (angleMatch) {
    const name = angleMatch[1].trim().replace(/^["']|["']$/g, "")
    const email = angleMatch[2].trim().toLowerCase()
    return { email, name, valid: EMAIL_REGEX.test(email) }
  }

  // Handle "email, name" or "email; name" format
  const sepMatch = trimmed.match(/^([^\s,;]+)\s*[,;]\s*(.+)$/)
  if (sepMatch && EMAIL_REGEX.test(sepMatch[1].trim().toLowerCase())) {
    return {
      email: sepMatch[1].trim().toLowerCase(),
      name: sepMatch[2].trim(),
      valid: true,
    }
  }

  // Handle bare email
  const email = trimmed.toLowerCase()
  return { email, name: "", valid: EMAIL_REGEX.test(email) }
}

function parseCSV(text: string): ParsedContact[] {
  const lines = text.split(/\r?\n/)
  const results: ParsedContact[] = []

  for (const line of lines) {
    if (!line.trim()) continue
    if (/^email/i.test(line.trim())) continue

    const parts = line.split(/[,;\t]/)
    const email = (parts[0] || "").trim().toLowerCase()
    const name = (parts[1] || "").trim().replace(/^["']|["']$/g, "")

    if (email) {
      results.push({ email, name, valid: EMAIL_REGEX.test(email) })
    }
  }

  return results
}

/* ── Step breadcrumb ────────────────────────────────────────────────── */
function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { num: 1, label: "Add Contacts", icon: Users },
    { num: 2, label: "Customize", icon: MessageSquare },
    { num: 3, label: "Review & Send", icon: Send },
  ] as const

  return (
    <div className="flex items-center gap-1 px-6 pb-3">
      {steps.map((s, idx) => {
        const done = current > s.num
        const active = current === s.num
        const Icon = s.icon
        return (
          <div key={s.num} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                done
                  ? "text-emerald-600"
                  : active
                    ? "text-purple-700 bg-purple-50"
                    : "text-muted-foreground"
              }`}
            >
              {done ? (
                <Check className="w-3 h-3" />
              ) : (
                <Icon className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-6 h-px ${done ? "bg-emerald-400" : "bg-border"}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ImportContactsDialog({
  open,
  onOpenChange,
  communityId,
  onSuccess,
}: ImportContactsDialogProps) {
  const { toast } = useToast()
  const { selectedCommunity } = useCreatorCommunity()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [rawText, setRawText] = useState("")
  const [contacts, setContacts] = useState<ParsedContact[]>([])
  const [personalMessage, setPersonalMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("paste")
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const parsedFromText = useMemo(() => {
    if (!rawText.trim()) return [] as ParsedContact[]
    return rawText
      .split(/\r?\n/)
      .map(parseEmailLine)
      .filter(Boolean) as ParsedContact[]
  }, [rawText])

  const validCount = useMemo(
    () => (step === 1 ? parsedFromText : contacts).filter((c) => c.valid).length,
    [step, parsedFromText, contacts],
  )
  const invalidCount = useMemo(
    () => (step === 1 ? parsedFromText : contacts).filter((c) => !c.valid).length,
    [step, parsedFromText, contacts],
  )
  const uniqueEmails = useMemo(() => {
    const list = step === 1 ? parsedFromText : contacts
    const seen = new Set<string>()
    let dupes = 0
    for (const c of list) {
      if (seen.has(c.email)) dupes++
      else seen.add(c.email)
    }
    return dupes
  }, [step, parsedFromText, contacts])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        if (!text) return
        const parsed = parseCSV(text)
        const seen = new Set<string>()
        const deduped = parsed.filter((c) => {
          if (!c.valid || seen.has(c.email)) return false
          seen.add(c.email)
          return true
        })
        setContacts(deduped)
        setStep(2)
      }
      reader.readAsText(file)
      e.target.value = ""
    },
    [],
  )

  /* Drag-and-drop handlers */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])
  const handleDragLeave = useCallback(() => setIsDragOver(false), [])
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result as string
        if (!text) return
        const parsed = parseCSV(text)
        const seen = new Set<string>()
        const deduped = parsed.filter((c) => {
          if (!c.valid || seen.has(c.email)) return false
          seen.add(c.email)
          return true
        })
        setContacts(deduped)
        setStep(2)
      }
      reader.readAsText(file)
    },
    [],
  )

  const goToCustomize = useCallback(() => {
    const seen = new Set<string>()
    const deduplicated: ParsedContact[] = []
    for (const c of parsedFromText) {
      if (c.valid && !seen.has(c.email)) {
        seen.add(c.email)
        deduplicated.push(c)
      }
    }
    setContacts(deduplicated)
    setStep(2)
  }, [parsedFromText])

  const handleTemplateSelect = useCallback(
    (template: InvitationTemplate) => {
      setSelectedTemplateId(template.id)
      const communityName = selectedCommunity?.name || selectedCommunity?.nom || ""
      const filled = fillTemplate(template.body, {
        community: communityName || undefined,
      })
      setPersonalMessage(filled)
    },
    [selectedCommunity],
  )

  const removeContact = useCallback((email: string) => {
    setContacts((prev) => prev.filter((c) => c.email !== email))
  }, [])

  const handleSend = useCallback(async () => {
    if (contacts.length === 0) return
    setSending(true)
    try {
      const result = await communityInvitationsApi.importContacts({
        contacts: contacts.map((c) => ({
          email: c.email,
          ...(c.name ? { name: c.name } : {}),
        })),
        communityId,
        ...(personalMessage.trim() ? { personalMessage: personalMessage.trim() } : {}),
      })
      toast({
        title: "Invitations sent!",
        description: `${result.created} invitation(s) sent. ${result.skipped > 0 ? `${result.skipped} skipped (already invited or member).` : ""}`,
      })
      setStep(1)
      setRawText("")
      setContacts([])
      setPersonalMessage("")
      setSelectedTemplateId(null)
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Failed to send invitations",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }, [contacts, communityId, personalMessage, toast, onOpenChange, onSuccess])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setStep(1)
        setRawText("")
        setContacts([])
        setPersonalMessage("")
        setSelectedTemplateId(null)
        setIsDragOver(false)
      }
      onOpenChange(open)
    },
    [onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg">
            {step === 1
              ? "Import Contacts"
              : step === 2
                ? "Customize Message"
                : "Review & Send"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Add email addresses of people you'd like to invite."
              : step === 2
                ? "Choose a template or write a custom message."
                : `You're about to invite ${contacts.length} contact(s).`}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator current={step} />

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {/* ── Step 1: Add contacts ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="paste">Paste Emails</TabsTrigger>
                  <TabsTrigger value="csv">Upload CSV</TabsTrigger>
                </TabsList>

                <TabsContent value="paste" className="space-y-3">
                  <div>
                    <Label htmlFor="email-input" className="text-sm">
                      Email addresses
                    </Label>
                    <Textarea
                      id="email-input"
                      placeholder={`Enter one email per line:\n\njohn@example.com\nJane Doe <jane@example.com>\nmark@company.com, Mark Smith`}
                      className="mt-1.5 min-h-[180px] font-mono text-sm"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                    />
                  </div>
                  {parsedFromText.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {validCount} valid
                      </Badge>
                      {invalidCount > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {invalidCount} invalid
                        </Badge>
                      )}
                      {uniqueEmails > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          {uniqueEmails} duplicate(s)
                        </Badge>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="csv" className="space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      isDragOver
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <FileText
                      className={`w-8 h-8 mx-auto mb-3 ${isDragOver ? "text-purple-500" : "text-muted-foreground"}`}
                    />
                    <p className="text-sm text-foreground mb-1 font-medium">
                      {isDragOver ? "Drop your file here" : "Drag & drop a CSV file"}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      or click to browse — first column: email, second: name (optional)
                    </p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".csv,.txt,.tsv"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          Browse Files
                        </span>
                      </Button>
                    </label>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* ── Step 2: Customize message ─────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <TemplatePicker
                selectedId={selectedTemplateId}
                onSelect={handleTemplateSelect}
              />

              <div className="space-y-1.5">
                <Label htmlFor="personal-message" className="text-sm">
                  Your message <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="personal-message"
                  placeholder="Write a personal note that will be included in the invitation email..."
                  className="min-h-[100px] text-sm leading-relaxed resize-none"
                  maxLength={500}
                  value={personalMessage}
                  onChange={(e) => {
                    setPersonalMessage(e.target.value)
                    if (selectedTemplateId) setSelectedTemplateId(null)
                  }}
                />
                <p className="text-xs text-muted-foreground text-right tabular-nums">
                  {personalMessage.length}/500
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Review & send ─────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              {personalMessage.trim() && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Message Preview
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed line-clamp-4">
                    {personalMessage}
                  </p>
                </div>
              )}

              <div>
                <Label className="text-sm">Contacts ({contacts.length})</Label>
                <ScrollArea className="mt-1.5 h-[200px] border rounded-lg">
                  <div className="p-2 flex flex-wrap gap-1.5">
                    {contacts.map((contact) => (
                      <div
                        key={contact.email}
                        className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-muted/60 border text-xs group hover:bg-muted transition-colors"
                      >
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                          {(contact.name || contact.email)[0]}
                        </span>
                        <span className="truncate max-w-[160px] font-medium">
                          {contact.name || contact.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeContact(contact.email)}
                          className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    {contacts.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4 w-full">
                        No contacts to send
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex gap-2">
          {step > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}
              disabled={sending}
            >
              Back
            </Button>
          )}
          {step === 1 && (
            <Button size="sm" onClick={goToCustomize} disabled={validCount === 0}>
              Continue
              <span className="ml-1 text-xs opacity-70">({validCount})</span>
            </Button>
          )}
          {step === 2 && (
            <Button size="sm" onClick={() => setStep(3)}>
              Review
              <span className="ml-1 text-xs opacity-70">({contacts.length})</span>
            </Button>
          )}
          {step === 3 && (
            <Button size="sm" onClick={handleSend} disabled={contacts.length === 0 || sending}>
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Send Invitations
                  <span className="ml-1 text-xs opacity-70">({contacts.length})</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
