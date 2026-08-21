"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  CalendarClock,
  GraduationCap,
  Handshake,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  Newspaper,
  RotateCcw,
  Rocket,
  ShoppingBag,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { cn } from "@/lib/utils"
import {
  emailCampaignsApi,
  EmailCampaignType,
  MarketingEmailTemplate,
} from "@/lib/api"
import { CampaignBuilderDialog } from "./campaign-builder-dialog"

type BuilderKind = "announcement" | "inactive-users" | "content-reminder" | "course-progress" | "custom-invitation"

const templateIcon = (template: MarketingEmailTemplate) => {
  const icons: Record<string, typeof Sparkles> = {
    "community-announcement-rich": Megaphone,
    "weekly-member-digest": Newspaper,
    "content-launch": Rocket,
    "course-progress-rescue": GraduationCap,
    "inactive-winback": RotateCcw,
    "event-reminder-rich": CalendarClock,
    "product-offer": ShoppingBag,
    "welcome-onboarding": Handshake,
  }

  return icons[template.id] || Sparkles
}

const templateIconTone = (template: MarketingEmailTemplate) => {
  const tones: Record<string, string> = {
    "community-announcement-rich": "bg-chabaqa-primary/10 text-chabaqa-primary",
    "weekly-member-digest": "bg-courses/10 text-courses-700",
    "content-launch": "bg-challenges/10 text-challenges-700",
    "course-progress-rescue": "bg-emerald-50 text-emerald-700",
    "inactive-winback": "bg-sessions/10 text-sessions-700",
    "event-reminder-rich": "bg-events/10 text-events-700",
    "product-offer": "bg-products/10 text-products-700",
    "welcome-onboarding": "bg-[var(--p2)] text-[var(--p-dark)]",
  }

  return tones[template.id] || "bg-[var(--p2)] text-chabaqa-primary"
}

const templateKind = (template: MarketingEmailTemplate): BuilderKind => {
  if (template.type === "inactive_user_reactivation") return "inactive-users"
  if (template.type === "course_progress_reminder") return "course-progress"
  if (template.contentType && template.contentType !== "all") return "content-reminder"
  if (template.id.includes("content") || template.contentType === "all") return "content-reminder"
  return "announcement"
}

const templateTypeLabel = (type: EmailCampaignType) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())

export function EmailTemplateCards(props: { onCampaignCreated?: () => void }) {
  const { onCampaignCreated } = props
  const { selectedCommunityId } = useCreatorCommunity()

  const [templates, setTemplates] = useState<MarketingEmailTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [builderSeed, setBuilderSeed] = useState<any>(null)

  const loadTemplates = useCallback(async () => {
    if (!selectedCommunityId) return
    setLoading(true)
    setError(null)
    try {
      const response = await emailCampaignsApi.getMarketingTemplates(selectedCommunityId)
      setTemplates(response.templates || [])
      setCategories(response.categories || [])
    } catch (err: any) {
      setTemplates([])
      setCategories([])
      setError(err?.message || "Could not load templates.")
    } finally {
      setLoading(false)
    }
  }, [selectedCommunityId])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const filteredTemplates = useMemo(() => {
    if (activeCategory === "all") return templates
    return templates.filter((template) => template.category === activeCategory)
  }, [activeCategory, templates])

  const handleUseTemplate = (template: MarketingEmailTemplate) => {
    setBuilderSeed({
      title: template.name,
      kind: templateKind(template),
      subject: template.subject,
      content: template.content,
      isHtml: template.isHtml,
      trackOpens: true,
      trackClicks: true,
      contentType: template.contentType,
      templateId: template.id,
      templateCategory: template.category,
      campaignType: template.type,
    })
    setBuilderOpen(true)
  }

  return (
    <section className="rounded-lg border border-[var(--bd)] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-chabaqa-primary/10 text-chabaqa-primary">
              <Mail className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[var(--t1)]">Backend template library</h2>
              <p className="text-sm text-[var(--t2)]">
                Pick rich email/message templates powered by real member, content, and progress data.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeCategory === "all" ? "default" : "outline"}
              className={cn(activeCategory === "all" && "bg-chabaqa-primary hover:bg-chabaqa-primary/90")}
              onClick={() => setActiveCategory("all")}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={activeCategory === category ? "default" : "outline"}
                className={cn("capitalize", activeCategory === category && "bg-chabaqa-primary hover:bg-chabaqa-primary/90")}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        <Button type="button" variant="outline" onClick={loadTemplates} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Sync templates
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-60 animate-pulse rounded-lg border border-[var(--bd)] bg-[var(--p2)]/40" />
          ))
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-[var(--bd)] bg-white px-4 py-10 text-center">
            <p className="font-medium text-[var(--t1)]">No templates in this category</p>
            <p className="mt-1 text-sm text-[var(--t2)]">Switch category or sync templates again.</p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const Icon = templateIcon(template)
            const iconTone = templateIconTone(template)
            return (
              <article
                key={template.id}
                className="group flex min-h-[260px] flex-col rounded-lg border border-[var(--bd)] bg-white p-4 shadow-sm transition hover:border-chabaqa-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    aria-label={`${template.name} icon`}
                    className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", iconTone)}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex flex-wrap justify-end gap-1">
                    {template.channelCompatibility.includes("email") ? (
                      <Badge variant="secondary" className="gap-1 rounded-full bg-courses/10 text-courses-700 hover:bg-courses/10">
                        <Mail className="h-3 w-3" />
                        Email
                      </Badge>
                    ) : null}
                    {template.channelCompatibility.includes("message") ? (
                      <Badge variant="secondary" className="gap-1 rounded-full bg-sessions/10 text-sessions-700 hover:bg-sessions/10">
                        <MessageSquare className="h-3 w-3" />
                        Message
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-chabaqa-primary">{template.category}</p>
                  <h3 className="mt-1 line-clamp-2 text-base font-semibold text-[var(--t1)]">{template.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--t2)]">{template.description}</p>
                </div>

                <div className="mt-4 rounded-lg border border-[var(--bd)] bg-[var(--bg)]/60 p-3">
                  <p className="line-clamp-2 text-sm font-medium text-[var(--t1)]">{template.renderedPreview.subject || template.subject}</p>
                  <p className="mt-1 text-xs text-[var(--t3)]">{templateTypeLabel(template.type)}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {template.recommendedVariables.slice(0, 4).map((variable) => (
                    <span key={variable} className="rounded-full border border-[var(--bd)] bg-white px-2 py-0.5 text-[11px] font-medium text-[var(--t2)]">
                      {`{{${variable}}}`}
                    </span>
                  ))}
                  {template.recommendedVariables.length > 4 ? (
                    <span className="rounded-full border border-[var(--bd)] bg-white px-2 py-0.5 text-[11px] font-medium text-[var(--t3)]">
                      +{template.recommendedVariables.length - 4}
                    </span>
                  ) : null}
                </div>

                <div className="mt-auto pt-4">
                  <p className="mb-3 line-clamp-2 text-xs text-[var(--t3)]">{template.audienceHint}</p>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full bg-chabaqa-primary hover:bg-chabaqa-primary/90"
                    onClick={() => handleUseTemplate(template)}
                  >
                    Use template
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Button>
                </div>
              </article>
            )
          })
        )}
      </div>

      <CampaignBuilderDialog
        open={builderOpen}
        onOpenChange={(next) => {
          setBuilderOpen(next)
          if (!next) setBuilderSeed(null)
        }}
        initialValues={builderSeed || undefined}
        onSuccess={onCampaignCreated}
      />
    </section>
  )
}
