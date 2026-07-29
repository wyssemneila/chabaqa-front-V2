"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, ChevronRight, Check } from "lucide-react"
import { IOSCard, IOSCardContent, IOSCardHeader } from "@/components/ui/ios/ios-card"
import { IOSButton } from "@/components/ui/ios/ios-button"
import { IOSInput, IOSLabel, IOSTextarea } from "@/components/ui/ios/ios-input"
import { IOSSegmentedControl } from "@/components/ui/ios/ios-segmented-control"

interface OnboardingResult {
  community: {
    draft: { nom: string; description: string; price: number; currency: string; status: string }
    landingCopy: { headline: string; subheadline: string; bullets: string[] }
    posts: Array<{ title: string; content: string }>
  }
  course: {
    draft: { title: string; description: string; price: number; currency: string }
    landingCopy: { headline: string; subheadline: string; bullets: string[] }
  }
  launchPlan: { durationDays: number; goal: string; milestones: string[] }
  skipped: boolean
  reason?: string
}

const STEPS = ["Describe", "Review", "Publish"] as const
type Step = (typeof STEPS)[number]

interface WizardState {
  step: Step
  niche: string
  audience: string
  promise: string
  price: string
  currency: string
  loading: boolean
  result: OnboardingResult | null
  error: string | null
}

/**
 * 3-step AI onboarding wizard for new creators.
 * Step 1 — Describe: free-text inputs for niche/audience/promise.
 * Step 2 — Review: parsed results in iOS cards, editable before publishing.
 * Step 3 — Publish: confirmation + save to backend.
 */
export function OnboardingWizard({ communityId }: { communityId?: string }) {
  const router = useRouter()
  const [state, setState] = React.useState<WizardState>({
    step: "Describe",
    niche: "",
    audience: "",
    promise: "",
    price: "",
    currency: "TND",
    loading: false,
    result: null,
    error: null,
  })

  const generate = async () => {
    setState((p) => ({ ...p, loading: true, error: null }))
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/ai/cofounder/onboarding-wizard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined"
            ? { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` }
            : {}),
        },
        body: JSON.stringify({
          niche: state.niche,
          audience: state.audience,
          promise: state.promise,
          price: Number(state.price) || 0,
          currency: state.currency,
        }),
      })
      const json = await res.json()
      const data = json?.data ?? json
      setState((p) => ({ ...p, result: data, step: "Review", loading: false }))
    } catch (e: any) {
      setState((p) => ({ ...p, error: e?.message || "Generation failed", loading: false }))
    }
  }

  const publish = async () => {
    if (!state.result) return
    setState((p) => ({ ...p, loading: true }))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/ai/cofounder/publish-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: JSON.stringify({
          draftType: "onboarding",
          draftPayload: state.result,
          confirm: true,
        }),
      })
      router.push("/creator/dashboard")
    } catch (e: any) {
      setState((p) => ({ ...p, error: e?.message || "Publish failed", loading: false }))
    }
  }

  const canGenerate =
    state.niche.trim().length > 1 &&
    state.audience.trim().length > 1 &&
    state.promise.trim().length > 1

  const stepIndex = STEPS.indexOf(state.step)

  return (
    <div className="max-w-xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8e78fb]/10">
          <Sparkles className="h-5 w-5 text-[#8e78fb]" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-[var(--t1)]">AI Creator Setup</h1>
          <p className="text-[12px] text-[var(--t3)]">Describe what you want to build in one sentence.</p>
        </div>
      </div>

      <IOSSegmentedControl
        options={STEPS.map((s) => ({ value: s, label: s }))}
        value={state.step}
        onChange={() => {}}
      />

      {state.step === "Describe" && (
        <IOSCard>
          <IOSCardContent className="space-y-5">
            <div className="grid gap-2">
              <IOSLabel>Your niche or topic</IOSLabel>
              <IOSTextarea
                value={state.niche}
                onChange={(e) => setState((p) => ({ ...p, niche: e.target.value }))}
                placeholder="e.g. Tunisian street food, productivity for devs, Arabic calligraphy"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <IOSLabel>Target audience</IOSLabel>
              <IOSInput
                value={state.audience}
                onChange={(e) => setState((p) => ({ ...p, audience: e.target.value }))}
                placeholder="e.g. beginners in Tunis, busy freelancers, stay-at-home moms"
              />
            </div>
            <div className="grid gap-2">
              <IOSLabel>Core promise in one sentence</IOSLabel>
              <IOSTextarea
                value={state.promise}
                onChange={(e) => setState((p) => ({ ...p, promise: e.target.value }))}
                placeholder="e.g. Learn authentic recipes in 4 weeks, ship your first product in 30 days"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <IOSLabel>Starting price (optional)</IOSLabel>
                <IOSInput
                  value={state.price}
                  onChange={(e) => setState((p) => ({ ...p, price: e.target.value }))}
                  placeholder="0"
                  type="number"
                />
              </div>
              <div className="grid gap-2">
                <IOSLabel>Currency</IOSLabel>
                <select
                  value={state.currency}
                  onChange={(e) => setState((p) => ({ ...p, currency: e.target.value }))}
                  className="h-11 rounded-xl border border-[var(--bd)] bg-[var(--bg)] px-3 text-[15px] text-[var(--t1)]"
                >
                  {["TND", "USD", "EUR", "MAD"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            {state.error && <p className="text-[12px] text-red-500">{state.error}</p>}
            <IOSButton
              variant="filled"
              block
              onClick={generate}
              disabled={!canGenerate || state.loading}
            >
              {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {state.loading ? "Generating your setup..." : "Generate my setup"}
            </IOSButton>
          </IOSCardContent>
        </IOSCard>
      )}

      {state.step === "Review" && state.result && (
        <IOSCard>
          <IOSCardHeader className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8e78fb]/10">
              <Sparkles className="h-4 w-4 text-[#8e78fb]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[var(--t1)]">Your AI-generated setup</p>
              <p className="text-[12px] text-[var(--t3)]">Review and edit before publishing.</p>
            </div>
          </IOSCardHeader>
          <IOSCardContent className="space-y-4">
            <div className="rounded-xl border border-[var(--bd)] p-4 space-y-2">
              <p className="text-[12px] font-semibold uppercase text-[var(--t3)]">Community</p>
              <p className="text-[15px] font-bold text-[var(--t1)]">{state.result.community.draft.nom}</p>
              <p className="text-[13px] text-[var(--t2)]">{state.result.community.draft.description}</p>
            </div>
            <div className="rounded-xl border border-[var(--bd)] p-4 space-y-2">
              <p className="text-[12px] font-semibold uppercase text-[var(--t3)]">First course</p>
              <p className="text-[15px] font-bold text-[var(--t1)]">{state.result.course.draft.title}</p>
              <p className="text-[13px] text-[var(--t2)]">{state.result.course.draft.description}</p>
            </div>
            {state.result.launchPlan.milestones.length > 0 && (
              <div className="rounded-xl border border-[var(--bd)] p-4 space-y-2">
                <p className="text-[12px] font-semibold uppercase text-[var(--t3)]">Launch plan</p>
                {state.result.launchPlan.milestones.map((m, i) => (
                  <p key={i} className="text-[13px] text-[var(--t2)] flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8e78fb]/10 text-[11px] font-bold text-[#8e78fb]">{i + 1}</span>
                    {m}
                  </p>
                ))}
              </div>
            )}
            {state.error && <p className="text-[12px] text-red-500">{state.error}</p>}
            <div className="flex gap-3">
              <IOSButton variant="gray" className="flex-1" onClick={() => setState((p) => ({ ...p, step: "Describe" }))}>
                Edit
              </IOSButton>
              <IOSButton variant="filled" className="flex-1" onClick={publish} disabled={state.loading}>
                {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Publish setup
              </IOSButton>
            </div>
          </IOSCardContent>
        </IOSCard>
      )}
    </div>
  )
}