"use client"

import { useState, useCallback } from "react"
import { Loader2, Mail, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { communityInvitationsApi } from "@/lib/api/community-invitations.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { TemplatePicker } from "./template-picker"
import { fillTemplate, type InvitationTemplate } from "@/lib/invitation-templates"

interface SingleInviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  communityId: string
  onSuccess: () => void
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const EXPIRY_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
] as const

export function SingleInviteDialog({
  open,
  onOpenChange,
  communityId,
  onSuccess,
}: SingleInviteDialogProps) {
  const { toast } = useToast()
  const { selectedCommunity } = useCreatorCommunity()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [personalMessage, setPersonalMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [expiryDays, setExpiryDays] = useState<number>(30) // TODO: wire to backend

  const isValid = EMAIL_REGEX.test(email.trim())
  const charPercent = Math.min((personalMessage.length / 500) * 100, 100)

  const handleTemplateSelect = useCallback(
    (template: InvitationTemplate) => {
      setSelectedTemplateId(template.id)
      const communityName = selectedCommunity?.name || selectedCommunity?.nom || ""
      const filled = fillTemplate(template.body, {
        name: name.trim() || undefined,
        community: communityName || undefined,
      })
      setPersonalMessage(filled)
    },
    [name, selectedCommunity],
  )

  const handleSubmit = useCallback(async () => {
    if (!isValid) {
      setEmailError("Please enter a valid email address")
      return
    }
    setSending(true)
    setEmailError("")
    try {
      await communityInvitationsApi.inviteSingle({
        email: email.trim().toLowerCase(),
        ...(name.trim() ? { name: name.trim() } : {}),
        communityId,
        ...(personalMessage.trim() ? { personalMessage: personalMessage.trim() } : {}),
      })
      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${email.trim()}`,
      })
      setEmail("")
      setName("")
      setPersonalMessage("")
      setSelectedTemplateId(null)
      setExpiryDays(30)
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Failed to send invitation",
        description: error?.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }, [email, name, personalMessage, communityId, isValid, toast, onOpenChange, onSuccess])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        setEmail("")
        setName("")
        setPersonalMessage("")
        setEmailError("")
        setSelectedTemplateId(null)
        setExpiryDays(30)
      }
      onOpenChange(open)
    },
    [onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-500" />
            <DialogTitle className="text-lg">Send Invitation</DialogTitle>
          </div>
          <DialogDescription>
            Invite someone to join your community with a personalized message.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-5 pb-2">
          {/* Section 1: Contact details */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Contact details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="invite-email" className="text-sm">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  className="mt-1"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError("")
                  }}
                />
                {emailError && (
                  <p className="text-xs text-red-500 mt-1">{emailError}</p>
                )}
              </div>
              <div>
                <Label htmlFor="invite-name" className="text-sm">
                  Name <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="invite-name"
                  placeholder="John Doe"
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Section 2: Template picker */}
          <TemplatePicker
            selectedId={selectedTemplateId}
            onSelect={handleTemplateSelect}
          />

          {/* Section 3: Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="invite-message" className="text-sm">
                Your message <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 20 20" className="w-4 h-4 -rotate-90">
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted/30"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${charPercent * 0.5027} 50.27`}
                    className={
                      charPercent > 90
                        ? "text-red-500"
                        : charPercent > 70
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }
                  />
                </svg>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {personalMessage.length}/500
                </span>
              </div>
            </div>
            <Textarea
              id="invite-message"
              placeholder="Write a personal note or select a template above..."
              className="min-h-[100px] text-sm leading-relaxed resize-none"
              maxLength={500}
              value={personalMessage}
              onChange={(e) => {
                setPersonalMessage(e.target.value)
                // Clear template selection when user edits manually
                if (selectedTemplateId) setSelectedTemplateId(null)
              }}
            />
            {personalMessage.length > 0 && (
              <p className="text-xs text-muted-foreground italic truncate">
                Preview: &ldquo;{personalMessage.slice(0, 80)}
                {personalMessage.length > 80 ? "..." : ""}&rdquo;
              </p>
            )}
          </div>

          {/* Section 4: Options */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Expires in
            </p>
            <div className="flex gap-1.5">
              {EXPIRY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpiryDays(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    expiryDays === opt.value
                      ? "bg-purple-50 border-purple-400 text-purple-700 ring-1 ring-purple-400/30"
                      : "border-border text-muted-foreground hover:border-purple-300 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)} disabled={sending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!isValid || sending}>
            {sending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send Invitation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
