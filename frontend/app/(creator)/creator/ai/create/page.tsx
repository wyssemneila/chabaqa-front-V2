"use client"

import { useMemo, useState } from "react"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { api, type AiCreateDraftType, type AiCreateWithMeResponse } from "@/lib/api"
import { AiShellLayout } from "@/components/ai/ai-shell-layout"
import {
  AiCodeBlock,
  AiEmptyDraft,
  AiHeroStrip,
  AiPanel,
  AiTypeSelector,
} from "@/components/ai/ai-primitives"
import { MemberAiBadge } from "@/components/ai/member-ai-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  BookOpen,
  Calendar,
  Check,
  Copy,
  Loader2,
  Megaphone,
  Package,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  Video,
} from "lucide-react"

const TYPES: Array<{ value: AiCreateDraftType; label: string; icon: typeof BookOpen }> = [
  { value: "course", label: "Course", icon: BookOpen },
  { value: "challenge", label: "Challenge", icon: Trophy },
  { value: "event", label: "Event", icon: Calendar },
  { value: "product", label: "Product", icon: Package },
  { value: "session", label: "Session", icon: Video },
]

function getCommunitySlug(community: any) {
  return community?.slug || community?.communitySlug || community?.name?.toLowerCase?.().replace(/\s+/g, "-") || ""
}

function getCommunityId(community: any, selectedCommunityId: string | null) {
  return community?.id || community?._id || selectedCommunityId || ""
}

export default function CreateWithAiPage() {
  const { guard, selectedCommunityId, selectedCommunity } = useCommunityGuard()
  const [type, setType] = useState<AiCreateDraftType>("course")
  const [idea, setIdea] = useState("")
  const [audience, setAudience] = useState("")
  const [outcome, setOutcome] = useState("")
  const [niche, setNiche] = useState("")
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner")
  const [monetization, setMonetization] = useState<"free" | "paid">("paid")
  const [price, setPrice] = useState("49")
  const [currency, setCurrency] = useState<"USD" | "EUR" | "TND">("TND")
  const [language, setLanguage] = useState("English")
  const [result, setResult] = useState<AiCreateWithMeResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const canGenerate = idea.trim().length >= 10 && audience.trim() && outcome.trim()
  const selectedType = useMemo(() => TYPES.find((item) => item.value === type) || TYPES[0], [type])

  if (guard) return guard

  const generate = async () => {
    if (!canGenerate) {
      toast.error("Add an idea, audience, and outcome first")
      return
    }
    setIsGenerating(true)
    try {
      const data = await api.ai.createWithMe({
        type,
        idea,
        audience,
        outcome,
        niche: niche || undefined,
        difficulty,
        monetization,
        price: monetization === "free" ? 0 : Number(price || 0),
        currency,
        language,
      })
      setResult(data)
      toast.success("Draft generated")
    } catch (error: any) {
      toast.error(error?.message || "Failed to generate draft")
    } finally {
      setIsGenerating(false)
    }
  }

  const saveDraft = async () => {
    if (!result?.draft) return
    const communitySlug = getCommunitySlug(selectedCommunity)
    const communityId = getCommunityId(selectedCommunity, selectedCommunityId)
    setIsSaving(true)
    try {
      if (result.type === "course") {
        await api.courses.create({ ...result.draft, communitySlug, isPublished: false } as any)
      } else if (result.type === "challenge") {
        await api.challenges.create({ ...result.draft, communitySlug, isActive: false } as any)
      } else if (result.type === "event") {
        await api.events.create({ ...result.draft, communityId, isPublished: false } as any)
      } else if (result.type === "product") {
        await api.products.create({ ...result.draft, communityId, isPublished: false } as any)
      } else {
        await api.sessions.create({ ...result.draft, communitySlug, isActive: false } as any)
      }
      toast.success("Saved as draft")
    } catch (error: any) {
      toast.error(error?.message || "Could not save draft. Review required fields and try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const copyJson = async () => {
    if (!result) return
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    toast.success("Draft copied")
  }

  const Icon = selectedType.icon

  return (
    <AiShellLayout
      title="Create with AI"
      description="Turn one rough idea into a reviewable offer draft — structure, landing copy, and launch message included."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <AiPanel className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-3 border-b border-[var(--bd)] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--t1)]">Offer brief</h2>
              <p className="text-xs text-[var(--t3)]">Generate a {selectedType.label.toLowerCase()} draft</p>
            </div>
          </div>

          <AiTypeSelector options={TYPES} value={type} onChange={setType} />

          <div className="space-y-2">
            <Label htmlFor="idea">Idea</Label>
            <Textarea
              id="idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Example: a 14-day Instagram growth challenge for handmade jewelry sellers"
              className="min-h-24 resize-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="audience">Audience</Label>
              <Input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Busy coaches" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Input id="outcome" value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Book more paid sessions" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="niche">Niche</Label>
              <Input id="niche" value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Fitness, design…" />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_88px_80px]">
            <div className="space-y-2">
              <Label>Monetization</Label>
              <Select value={monetization} onValueChange={(v: any) => setMonetization(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} disabled={monetization === "free"} inputMode="decimal" />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TND">TND</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} />
          </div>

          <Button onClick={generate} disabled={!canGenerate || isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
            Generate {selectedType.label}
          </Button>
        </AiPanel>

        <div className="space-y-4">
          <AiHeroStrip
            badge="Create with AI"
            title="Turn one rough idea into an editable Chabaqa offer."
            icon={Icon}
          />

          {!result ? (
            <AiEmptyDraft
              icon={Target}
              title="Your draft will appear here"
              description="Chabaqa AI will generate the offer structure, landing copy, launch message, and a review checklist before anything goes live."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <MemberAiBadge />
                    {result.model ? (
                      <span className="text-xs text-muted-foreground">Model: {result.model}</span>
                    ) : null}
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--t1)]">{result.landingPage.headline}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copyJson}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy JSON
                  </Button>
                  <Button size="sm" onClick={saveDraft} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Save as draft
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <AiPanel>
                  <h3 className="mb-3 text-sm font-semibold text-[var(--t1)]">Offer structure</h3>
                  <AiCodeBlock>{JSON.stringify(result.draft, null, 2)}</AiCodeBlock>
                </AiPanel>
                <div className="space-y-4">
                  <AiPanel className="space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--t1)]">Landing page copy</h3>
                    <p className="text-base font-medium text-[var(--t1)]">{result.landingPage.headline}</p>
                    <p className="text-sm text-[var(--t2)]">{result.landingPage.subheadline}</p>
                    <ul className="space-y-2 text-sm">
                      {result.landingPage.bullets.map((item) => (
                        <li key={item} className="flex gap-2 text-[var(--t2)]">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </AiPanel>
                  <AiPanel className="space-y-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--t1)]">
                      <Megaphone className="h-4 w-4 text-primary" aria-hidden="true" />
                      Launch campaign
                    </h3>
                    <div className="text-sm text-[var(--t2)]">
                      <p><span className="font-medium text-[var(--t1)]">Subject:</span> {result.launchCampaign.subject}</p>
                      <p className="mt-1"><span className="font-medium text-[var(--t1)]">Preview:</span> {result.launchCampaign.preview}</p>
                    </div>
                    <Separator />
                    <p className="whitespace-pre-wrap text-sm text-[var(--t2)]">{result.launchCampaign.emailBody}</p>
                  </AiPanel>
                  <AiPanel className="space-y-2">
                    <h3 className="text-sm font-semibold text-[var(--t1)]">Review checklist</h3>
                    {result.reviewChecklist.map((item) => (
                      <div key={item} className="flex gap-2 text-sm text-[var(--t2)]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                        {item}
                      </div>
                    ))}
                  </AiPanel>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AiShellLayout>
  )
}
