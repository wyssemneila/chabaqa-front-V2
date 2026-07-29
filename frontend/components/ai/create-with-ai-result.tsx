"use client"

import * as React from "react"
import { Check, Copy, FileText, ListChecks, Mail, Megaphone, Sparkles } from "lucide-react"
import type { AiCreateWithMeResponse } from "@/lib/api/ai.api"
import {
  IOSCard,
  IOSCardContent,
  IOSCardHeader,
  IOSList,
  IOSListRow,
  IOSBadge,
  IOSText,
  IOSButton,
  IOSLabel,
  IOSTextarea,
} from "@/components/ui/ios"
import { toast } from "sonner"

function useCopy() {
  const [copied, setCopied] = React.useState<string | null>(null)
  const copy = React.useCallback(async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1400)
    } catch {
      toast.error("Copy failed")
    }
  }, [])
  return { copied, copy }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const { copied, copy } = useCopy()
  const key = `${label}:${value}`
  return (
    <button
      type="button"
      onClick={() => copy(key, value)}
      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-[var(--p)] transition-colors hover:bg-[var(--p2)]/70"
      aria-label={`Copy ${label}`}
    >
      {copied === key ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied === key ? "Copied" : "Copy"}
    </button>
  )
}

/** Render the draft object as key/value rows, since draft shape varies by type. */
function DraftFields({ draft }: { draft: Record<string, any> }) {
  const rows = Object.entries(draft).filter(([k]) =>
    ["titre", "title", "description", "prix", "price", "devise", "currency", "category", "niveau", "difficulty", "duree", "duration", "isPaid", "isPublished", "isActive"].includes(
      k,
    ),
  )
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (typeof value === "number") return String(value)
    if (typeof value === "string") return value
    return JSON.stringify(value)
  }
  return (
    <IOSList>
      {rows.map(([key, value], i) => (
        <IOSListRow
          key={key}
          title={key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
          accessory={<span className="truncate font-medium text-[var(--t1)]">{formatValue(value)}</span>}
          divider={i === rows.length - 1 ? "none" : "bottom"}
        />
      ))}
    </IOSList>
  )
}

export interface CreateWithAiResultProps {
  result: AiCreateWithMeResponse
  onApply?: () => void
  onRegenerate?: () => void
  applying?: boolean
}

export function CreateWithAiResult({
  result,
  onApply,
  onRegenerate,
  applying,
}: CreateWithAiResultProps) {
  const [checked, setChecked] = React.useState<Record<number, boolean>>({})
  const [showJson, setShowJson] = React.useState(false)
  const { draft, landingPage, launchCampaign, reviewChecklist, model } = result

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IOSBadge variant="success" size="md">
            <Sparkles className="h-3 w-3" /> Draft ready
          </IOSBadge>
          {model ? (
            <IOSBadge variant="outline" size="md">
              {model}
            </IOSBadge>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <IOSButton variant="plain" size="sm" onClick={() => setShowJson((s) => !s)}>
            {showJson ? "Hide JSON" : "Developer view"}
          </IOSButton>
          {onRegenerate ? (
            <IOSButton variant="outline" size="sm" onClick={onRegenerate}>
              Regenerate
            </IOSButton>
          ) : null}
          {onApply ? (
            <IOSButton variant="filled" size="sm" onClick={onApply} disabled={applying}>
              {applying ? "Opening…" : "Apply draft"}
            </IOSButton>
          ) : null}
        </div>
      </div>

      <IOSCard variant="inset">
        <IOSCardHeader className="pt-4">
          <IOSText size="headline" weight="semibold">
            <FileText className="mr-1.5 inline h-4 w-4 text-[var(--p)]" /> Draft
          </IOSText>
        </IOSCardHeader>
        <IOSCardContent className="space-y-3 pt-0">
          <DraftFields draft={draft} />
          <div className="text-right">
            <CopyButton value={JSON.stringify(draft, null, 2)} label="draft JSON" />
          </div>
        </IOSCardContent>
      </IOSCard>

      {landingPage ? (
        <IOSCard variant="inset">
          <IOSCardHeader className="pt-4">
            <IOSText size="headline" weight="semibold">
              <Megaphone className="mr-1.5 inline h-4 w-4 text-[var(--p)]" /> Landing page copy
            </IOSText>
          </IOSCardHeader>
          <IOSCardContent className="space-y-3 pt-0">
            <div>
              <IOSLabel>Headline</IOSLabel>
              <div className="rounded-xl bg-[var(--bd)]/40 p-3 text-[15px] font-medium text-[var(--t1)]">
                {landingPage.headline}
              </div>
            </div>
            <div>
              <IOSLabel>Subheadline</IOSLabel>
              <div className="rounded-xl bg-[var(--bd)]/40 p-3 text-[14px] text-[var(--t2)]">
                {landingPage.subheadline}
              </div>
            </div>
            {landingPage.bullets?.length ? (
              <div>
                <IOSLabel>Key bullets</IOSLabel>
                <IOSList>
                  {landingPage.bullets.map((b, i) => (
                    <IOSListRow
                      key={i}
                      icon={<span className="text-[13px]">•</span>}
                      title={b}
                      divider={i === landingPage.bullets.length - 1 ? "none" : "bottom"}
                    />
                  ))}
                </IOSList>
              </div>
            ) : null}
            {landingPage.faq?.length ? (
              <div>
                <IOSLabel>FAQ</IOSLabel>
                <IOSList>
                  {landingPage.faq.map((f, i) => (
                    <IOSListRow
                      key={i}
                      title={f.question}
                      subtitle={f.answer}
                      divider={i === landingPage.faq.length - 1 ? "none" : "bottom"}
                    />
                  ))}
                </IOSList>
              </div>
            ) : null}
          </IOSCardContent>
        </IOSCard>
      ) : null}

      {launchCampaign ? (
        <IOSCard variant="inset">
          <IOSCardHeader className="pt-4">
            <IOSText size="headline" weight="semibold">
              <Mail className="mr-1.5 inline h-4 w-4 text-[var(--p)]" /> Launch campaign
            </IOSText>
          </IOSCardHeader>
          <IOSCardContent className="space-y-3 pt-0">
            <div>
              <IOSLabel>Subject</IOSLabel>
              <div className="rounded-xl bg-[var(--bd)]/40 p-3 text-[14px] font-medium text-[var(--t1)]">
                {launchCampaign.subject}
              </div>
            </div>
            <div>
              <IOSLabel>Preview</IOSLabel>
              <div className="rounded-xl bg-[var(--bd)]/40 p-3 text-[13px] text-[var(--t2)]">
                {launchCampaign.preview}
              </div>
            </div>
            <div>
              <IOSLabel>Email body</IOSLabel>
              <IOSTextarea readOnly value={launchCampaign.emailBody} className="min-h-[120px]" />
            </div>
            <div>
              <IOSLabel>DM script</IOSLabel>
              <div className="rounded-xl bg-[var(--bd)]/40 p-3 text-[14px] text-[var(--t2)]">
                {launchCampaign.dmScript}
              </div>
            </div>
          </IOSCardContent>
        </IOSCard>
      ) : null}

      {reviewChecklist?.length ? (
        <IOSCard variant="inset">
          <IOSCardHeader className="pt-4">
            <IOSText size="headline" weight="semibold">
              <ListChecks className="mr-1.5 inline h-4 w-4 text-[var(--p)]" /> Review checklist
            </IOSText>
          </IOSCardHeader>
          <IOSCardContent className="pt-0">
            <IOSList>
              {reviewChecklist.map((item, i) => (
                <IOSListRow
                  key={i}
                  title={item}
                  icon={
                    <span
                      onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[7px] border-2"
                      style={{
                        borderColor: checked[i] ? "var(--p)" : "var(--bd2)",
                        backgroundColor: checked[i] ? "var(--p)" : "transparent",
                      }}
                    >
                      {checked[i] ? <Check className="h-4 w-4 text-white" /> : null}
                    </span>
                  }
                  iconBg={checked[i] ? "transparent" : "transparent"}
                  divider={i === reviewChecklist.length - 1 ? "none" : "bottom"}
                  onClick={() => setChecked((c) => ({ ...c, [i]: !c[i] }))}
                  clickable
                />
              ))}
            </IOSList>
          </IOSCardContent>
        </IOSCard>
      ) : null}

      {showJson ? (
        <IOSCard variant="inset">
          <IOSCardHeader className="pt-4">
            <IOSText size="headline" weight="semibold">
              Raw JSON
            </IOSText>
          </IOSCardHeader>
          <IOSCardContent className="pt-0">
            <pre className="max-h-80 overflow-auto rounded-xl bg-[var(--t1)] p-4 text-[12px] leading-relaxed text-[var(--white)]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </IOSCardContent>
        </IOSCard>
      ) : null}
    </div>
  )
}
