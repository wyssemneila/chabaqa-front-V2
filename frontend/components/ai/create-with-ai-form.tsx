"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Wand2, Loader2 } from "lucide-react"
import { aiApi, type AiCreateDraftType, type CreateWithAiPayload, type AiCreateWithMeResponse } from "@/lib/api/ai.api"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { toast } from "sonner"
import {
  IOSCard,
  IOSCardContent,
  IOSCardHeader,
  IOSText,
  IOSSegmentedControl,
  IOSInput,
  IOSTextarea,
  IOSLabel,
  IOSButton,
  IOSBadge,
} from "@/components/ui/ios"
import { CreateWithAiResult } from "./create-with-ai-result"
import { saveAiCreateDraft, AI_DRAFT_FORM_ROUTE } from "@/lib/ai-create-draft-store"

const TYPE_OPTIONS: { value: AiCreateDraftType; label: string }[] = [
  { value: "course", label: "Course" },
  { value: "challenge", label: "Challenge" },
  { value: "event", label: "Event" },
  { value: "product", label: "Product" },
  { value: "session", label: "Session" },
]

const DIFFICULTY_OPTIONS: { value: "beginner" | "intermediate" | "advanced"; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

const MONETIZATION_OPTIONS: { value: "free" | "paid"; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
]

export interface CreateWithAiFormProps {
  /** When provided, used as the title bar instead of the community name. */
  communityName?: string
}

export function CreateWithAiForm({ communityName }: CreateWithAiFormProps) {
  const router = useRouter()
  const { selectedCommunity } = useCreatorCommunity()

  const [type, setType] = React.useState<AiCreateDraftType>("course")
  const [idea, setIdea] = React.useState("")
  const [audience, setAudience] = React.useState("")
  const [outcome, setOutcome] = React.useState("")
  const [niche, setNiche] = React.useState("")
  const [difficulty, setDifficulty] = React.useState<"beginner" | "intermediate" | "advanced">("beginner")
  const [monetization, setMonetization] = React.useState<"free" | "paid">("paid")
  const [price, setPrice] = React.useState("")
  const [language, setLanguage] = React.useState("English")

  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState<AiCreateWithMeResponse | null>(null)
  const [applying, setApplying] = React.useState(false)

  const canSubmit = idea.trim().length >= 10 && audience.trim().length > 0 && outcome.trim().length > 0 && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setResult(null)
    try {
      const payload: CreateWithAiPayload = {
        type,
        idea: idea.trim(),
        audience: audience.trim(),
        outcome: outcome.trim(),
        difficulty,
        monetization,
        ...(monetization === "paid" && price ? { price: Number(price) } : {}),
        language,
        ...(niche.trim() ? { niche: niche.trim() } : {}),
      }
      const response = await aiApi.createWithMe(payload)
      setResult(response)
      toast.success("Draft generated — review before publishing")
    } catch (error: any) {
      toast.error(error?.message || "AI generation failed")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!result) return
    setApplying(true)
    try {
      saveAiCreateDraft(result, { createdAt: new Date().toISOString() })
      const route = AI_DRAFT_FORM_ROUTE[result.type]
      router.push(`${route}?aiDraft=1`)
    } catch (error: any) {
      toast.error(error?.message || "Could not open the form")
      setApplying(false)
    }
  }

  return (
    <div className="space-y-6">
      <IOSCard>
        <IOSCardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <IOSText size="title3" weight="semibold">
              <Wand2 className="mr-1.5 inline h-5 w-5 text-[var(--p)]" />
              Describe what you want to create
            </IOSText>
            <IOSBadge variant="outline" size="sm">
              <Sparkles className="h-3 w-3" /> Cofounder
            </IOSBadge>
          </div>
          <IOSText size="footnote" color="secondary" className="mt-1">
            {communityName || selectedCommunity?.name || "Pick a content type and describe your idea — the AI drafts a reviewable version in seconds."}
          </IOSText>
        </IOSCardHeader>
        <IOSCardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <IOSLabel>Content type</IOSLabel>
              <IOSSegmentedControl
                ariaLabel="Content type"
                fullWidth
                options={TYPE_OPTIONS}
                value={type}
                onChange={(v) => setType(v as AiCreateDraftType)}
              />
            </div>

            <div>
              <IOSLabel htmlFor="ai-create-idea">Your idea</IOSLabel>
              <IOSTextarea
                id="ai-create-idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g. A 2-week challenge that helps product designers ship their first portfolio piece"
                rows={3}
                maxLength={1200}
                required
              />
              <p className="mt-1 text-right text-[11px] text-[var(--t3)]">
                {idea.length}/1200
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <IOSLabel htmlFor="ai-create-audience">Audience</IOSLabel>
                <IOSInput
                  id="ai-create-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. Junior product designers"
                  maxLength={240}
                  required
                  clearable
                  onClear={() => setAudience("")}
                />
              </div>
              <div>
                <IOSLabel htmlFor="ai-create-outcome">Outcome</IOSLabel>
                <IOSInput
                  id="ai-create-outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="e.g. Ship a portfolio piece"
                  maxLength={240}
                  required
                  clearable
                  onClear={() => setOutcome("")}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <IOSLabel htmlFor="ai-create-niche">Niche (optional)</IOSLabel>
                <IOSInput
                  id="ai-create-niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. Product design"
                  maxLength={120}
                  clearable
                  onClear={() => setNiche("")}
                />
              </div>
              <div>
                <IOSLabel htmlFor="ai-create-language">Language</IOSLabel>
                <IOSInput
                  id="ai-create-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="English"
                  maxLength={20}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <IOSLabel>Difficulty</IOSLabel>
                <IOSSegmentedControl
                  ariaLabel="Difficulty"
                  fullWidth
                  options={DIFFICULTY_OPTIONS}
                  value={difficulty}
                  onChange={(v) => setDifficulty(v as typeof difficulty)}
                />
              </div>
              <div>
                <IOSLabel>Monetization</IOSLabel>
                <IOSSegmentedControl
                  ariaLabel="Monetization"
                  fullWidth
                  options={MONETIZATION_OPTIONS}
                  value={monetization}
                  onChange={(v) => setMonetization(v as typeof monetization)}
                />
              </div>
            </div>

            {monetization === "paid" ? (
              <div className="sm:max-w-[220px]">
                <IOSLabel htmlFor="ai-create-price">Price (TND)</IOSLabel>
                <IOSInput
                  id="ai-create-price"
                  type="number"
                  min={0}
                  max={100000}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="49"
                />
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <IOSButton type="submit" size="default" disabled={!canSubmit}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate draft
                  </>
                )}
              </IOSButton>
            </div>
          </form>
        </IOSCardContent>
      </IOSCard>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-7 w-7 animate-spin text-[var(--p)]" />
          <IOSText size="footnote" color="secondary" className="mt-3">
            Drafting your {type}…
          </IOSText>
        </div>
      ) : null}

      {result ? (
        <CreateWithAiResult
          result={result}
          onApply={handleApply}
          onRegenerate={() => {
            setResult(null)
            setTimeout(() => {
              const form = document.getElementById("ai-create-idea")
              ;(form as HTMLElement | null)?.focus()
            }, 0)
          }}
          applying={applying}
        />
      ) : null}
    </div>
  )
}
