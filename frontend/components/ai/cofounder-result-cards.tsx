"use client"

import * as React from "react"
import { Check, Copy, Megaphone, MessageSquare, Rocket, Sparkles, Target } from "lucide-react"
import {
  IOSCard,
  IOSCardContent,
  IOSCardHeader,
  IOSList,
  IOSListRow,
  IOSBadge,
  IOSText,
} from "@/components/ui/ios"
import { toast } from "sonner"

/**
 * Parsed iOS-card renderers for the three AI Cofounder actions:
 *  - buildCommunity → { draft, landingCopy, posts[] }
 *  - fixFunnel      → { insights[], suggestedCopy }
 *  - grow           → { campaignDraft, inactiveMembersQuery }
 *
 * Falls back to a collapsible raw-JSON block if the shape doesn't match, so
 * creators never see an unstructured wall of JSON by default.
 */

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
      {copied === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied === key ? "Copied" : "Copy"}
    </button>
  )
}

function TextBlock({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  if (!value) return null
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--t2)]">{label}</span>
        <CopyButton value={value} label={label} />
      </div>
      <div
        className={`rounded-xl bg-[var(--bd)]/40 p-3 text-[14px] text-[var(--t1)] ${
          mono ? "font-mono whitespace-pre-wrap" : ""
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function Bullets({ items, label }: { items: string[]; label: string }) {
  if (!items?.length) return null
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--t2)]">{label}</span>
        <CopyButton value={items.map((b) => `• ${b}`).join("\n")} label={label} />
      </div>
      <IOSList>
        {items.map((b, i) => (
          <IOSListRow
            key={i}
            icon={<span className="text-[13px] text-[var(--p)]">•</span>}
            title={b}
            divider={i === items.length - 1 ? "none" : "bottom"}
          />
        ))}
      </IOSList>
    </div>
  )
}

export function CofounderBuildResult({ data }: { data: any }) {
  if (data == null) return null
  const draft = data.draft || {}
  const landingCopy = data.landingCopy || {}
  const posts: Array<{ title: string; content: string }> = Array.isArray(data.posts) ? data.posts : []
  const draftRows = Object.entries(draft)
    .filter(([k]) =>
      ["nom", "name", "title", "description", "price", "prix", "currency", "devise", "status"].includes(k),
    )
    .map(([k, v]) => [k, String(v ?? "")])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IOSBadge variant="success" size="md">
          <Rocket className="h-3 w-3" /> Community draft
        </IOSBadge>
        {data.reviewBadge ? (
          <IOSBadge variant="outline" size="sm">
            {data.reviewBadge}
          </IOSBadge>
        ) : null}
      </div>

      {draftRows.length ? (
        <IOSCard variant="inset">
          <IOSCardHeader className="pt-4">
            <IOSText size="headline" weight="semibold">Draft</IOSText>
          </IOSCardHeader>
          <IOSCardContent className="pt-0">
            <IOSList>
              {draftRows.map(([k, v], i) => (
                <IOSListRow
                  key={k}
                  title={k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
                  accessory={<span className="truncate font-medium text-[var(--t1)]">{v || "—"}</span>}
                  divider={i === draftRows.length - 1 ? "none" : "bottom"}
                />
              ))}
            </IOSList>
          </IOSCardContent>
        </IOSCard>
      ) : null}

      <IOSCard variant="inset">
        <IOSCardHeader className="pt-4">
          <IOSText size="headline" weight="semibold">
            <Megaphone className="mr-1.5 inline h-4 w-4 text-[var(--p)]" /> Landing copy
          </IOSText>
        </IOSCardHeader>
        <IOSCardContent className="space-y-3 pt-0">
          <TextBlock label="Headline" value={landingCopy.headline} />
          <TextBlock label="Subheadline" value={landingCopy.subheadline} />
          <Bullets label="Bullets" items={landingCopy.bullets || []} />
        </IOSCardContent>
      </IOSCard>

      {posts.length ? (
        <IOSCard variant="inset">
          <IOSCardHeader className="pt-4">
            <IOSText size="headline" weight="semibold">
              <MessageSquare className="mr-1.5 inline h-4 w-4 text-[var(--p)]" /> Starter posts
            </IOSText>
          </IOSCardHeader>
          <IOSCardContent className="pt-0">
            <IOSList>
              {posts.map((post, i) => (
                <IOSListRow
                  key={i}
                  title={post.title}
                  subtitle={post.content}
                  divider={i === posts.length - 1 ? "none" : "bottom"}
                />
              ))}
            </IOSList>
          </IOSCardContent>
        </IOSCard>
      ) : null}
    </div>
  )
}

export function CofounderFixFunnelResult({ data }: { data: any }) {
  if (data == null) return null
  const insights: string[] = Array.isArray(data.insights) ? data.insights : []
  const suggestedCopy = data.suggestedCopy || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IOSBadge variant="warning" size="md">
          <Target className="h-3 w-3" /> Funnel recommendations
        </IOSBadge>
        {data.reviewBadge ? (
          <IOSBadge variant="outline" size="sm">
            {data.reviewBadge}
          </IOSBadge>
        ) : null}
      </div>

      {insights.length ? (
        <IOSCard variant="inset">
          <IOSCardHeader className="pt-4">
            <IOSText size="headline" weight="semibold">Insights</IOSText>
          </IOSCardHeader>
          <IOSCardContent className="pt-0">
            <IOSList>
              {insights.map((insight, i) => (
                <IOSListRow
                  key={i}
                  icon={<span className="text-[13px] font-bold text-[var(--p)]">{i + 1}</span>}
                  iconBg="var(--p2)"
                  title={insight}
                  divider={i === insights.length - 1 ? "none" : "bottom"}
                />
              ))}
            </IOSList>
          </IOSCardContent>
        </IOSCard>
      ) : null}

      {suggestedCopy.headline || suggestedCopy.cta ? (
        <IOSCard variant="inset">
          <IOSCardHeader className="pt-4">
            <IOSText size="headline" weight="semibold">Suggested copy</IOSText>
          </IOSCardHeader>
          <IOSCardContent className="space-y-3 pt-0">
            <TextBlock label="Headline" value={suggestedCopy.headline} />
            <TextBlock label="CTA" value={suggestedCopy.cta} />
          </IOSCardContent>
        </IOSCard>
      ) : null}
    </div>
  )
}

export function CofounderGrowResult({ data }: { data: any }) {
  if (data == null) return null
  const campaignDraft = data.campaignDraft || {}
  const inactive = data.inactiveMembersQuery || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <IOSBadge variant="success" size="md">
          <Sparkles className="h-3 w-3" /> Growth campaign
        </IOSBadge>
        {data.reviewBadge ? (
          <IOSBadge variant="outline" size="sm">
            {data.reviewBadge}
          </IOSBadge>
        ) : null}
      </div>

      <IOSCard variant="inset">
        <IOSCardHeader className="pt-4">
          <IOSText size="headline" weight="semibold">Win-back campaign</IOSText>
        </IOSCardHeader>
        <IOSCardContent className="space-y-3 pt-0">
          <TextBlock label="Subject" value={campaignDraft.subject} />
          <TextBlock label="Preview" value={campaignDraft.preview} />
          <TextBlock label="Body" value={campaignDraft.body} mono />
        </IOSCardContent>
      </IOSCard>

      {inactive.inactiveForDays ? (
        <IOSCard variant="inset">
          <IOSCardContent className="pt-4">
            <IOSText size="footnote" color="secondary">
              Targeting members inactive for {String(inactive.inactiveForDays)} days.
            </IOSText>
          </IOSCardContent>
        </IOSCard>
      ) : null}
    </div>
  )
}

/**
 * Generic fallback: a collapsible raw-JSON block (used when the backend shape
 * doesn't match any known action, e.g. the API evolves). Hidden behind a toggle
 * so creators don't see JSON by default.
 */
export function CofounderRawResult({ data, label }: { data: any; label: string }) {
  const [open, setOpen] = React.useState(false)
  if (data == null) return null
  return (
    <IOSCard variant="inset">
      <IOSCardHeader className="pt-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--t1)]"
        >
          <IOSText size="headline" weight="semibold">{label}</IOSText>
          <span className="text-[12px] font-normal text-[var(--t3)]">
            {open ? "Hide" : "Show"}
          </span>
        </button>
      </IOSCardHeader>
      {open ? (
        <IOSCardContent className="pt-0">
          <pre className="max-h-80 overflow-auto rounded-xl bg-[var(--t1)] p-4 text-[12px] leading-relaxed text-[var(--white)]">
            {JSON.stringify(data, null, 2)}
          </pre>
        </IOSCardContent>
      ) : null}
    </IOSCard>
  )
}
