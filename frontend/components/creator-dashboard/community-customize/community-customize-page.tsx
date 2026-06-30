"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  FileText,
  ImageIcon,
  LayoutTemplate,
  Loader2,
  LockKeyhole,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Video,
} from "lucide-react"
import DashSidebar from "@/components/creator-dashboard/DashSidebar"
import DashTopbar from "@/components/creator-dashboard/DashTopbar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { communitiesApi } from "@/lib/api"
import { communityPageContentApi } from "@/lib/api/community-page-content"
import { mediaApi, type MediaPurpose } from "@/lib/api/media.api"
import { normalizeCommunitySettings } from "@/lib/community-settings"
import { buildCommunityTheme } from "@/lib/community-theme"
import { resolveImageUrl } from "@/lib/resolve-image-url"
import { cn } from "@/lib/utils"
import {
  buildCommunityUpdatePayload,
  buildPageContentUpdatePayload,
  buildSettingsUpdatePayload,
  cloneCustomizeDraft,
  createCustomizeDraft,
  isValidHexColor,
  makeCustomizeId,
  serializeCustomizeDraft,
  validateCustomizeDraft,
  type CommunityCustomizeDraft,
} from "./community-customize-model"

const palettePresets = [
  { name: "Chabaqa", primary: "#8e78fb", secondary: "#f48fb1" },
  { name: "Studio", primary: "#2563eb", secondary: "#14b8a6" },
  { name: "Editorial", primary: "#111827", secondary: "#d97706" },
  { name: "Fresh", primary: "#16a34a", secondary: "#0ea5e9" },
  { name: "Bold", primary: "#e11d48", secondary: "#7c3aed" },
]

const fontOptions = ["Inter", "Manrope", "Poppins", "Space Grotesk", "System", "Serif", "Mono"]

type CommunityCustomizePageProps = {
  slug: string
}

type UploadTarget = "logo" | "cover" | "hero" | "gallery" | "cta" | null

export function CommunityCustomizePage({ slug }: CommunityCustomizePageProps) {
  const { toast } = useToast()
  const { setSelectedCommunityId, refreshCommunities } = useCreatorCommunity()
  const [draft, setDraft] = useState<CommunityCustomizeDraft | null>(null)
  const [savedDraft, setSavedDraft] = useState<CommunityCustomizeDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<UploadTarget>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("brand")

  useEffect(() => {
    let mounted = true
    async function loadCustomizeData() {
      if (!slug) return
      setLoading(true)
      setError(null)
      try {
        const communityResponse = await communitiesApi.getBySlug(slug)
        const community = communityResponse.data || communityResponse
        const communityId = String((community as any)?._id || (community as any)?.id || "")
        let pageContent = null

        if (communityId) {
          try {
            pageContent = await communityPageContentApi.getForEditing(communityId)
          } catch (contentError) {
            pageContent = null
          }
        }

        if (!mounted) return
        const nextDraft = createCustomizeDraft(community, pageContent)
        setDraft(nextDraft)
        setSavedDraft(cloneCustomizeDraft(nextDraft))
        if (nextDraft.id) setSelectedCommunityId(nextDraft.id)
      } catch (loadError: any) {
        if (!mounted) return
        setError(loadError?.message || "Failed to load community customization.")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadCustomizeData()
    return () => {
      mounted = false
    }
  }, [slug, setSelectedCommunityId])

  const dirty = useMemo(() => {
    if (!draft || !savedDraft) return false
    return JSON.stringify(serializeCustomizeDraft(draft)) !== JSON.stringify(serializeCustomizeDraft(savedDraft))
  }, [draft, savedDraft])

  const validationErrors = useMemo(() => (draft ? validateCustomizeDraft(draft) : []), [draft])
  const publicHref = `/community/${encodeURIComponent(draft?.slug || slug)}`

  const patchDraft = (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => {
    setDraft((current) => (current ? updater(cloneCustomizeDraft(current)) : current))
  }

  const uploadAsset = async (
    file: File,
    target: Exclude<UploadTarget, null>,
    purpose: MediaPurpose,
  ) => {
    if (!draft?.id) {
      toast({
        title: "Upload unavailable",
        description: "The community needs to be loaded before media can be uploaded.",
        variant: "destructive",
      })
      return
    }

    setUploading(target)
    try {
      const asset = await mediaApi.uploadSmart(file, {
        purpose,
        entityType: "community",
        entityId: draft.id,
        visibility: "public",
      })
      const url = asset.url
      patchDraft((next) => {
        if (target === "logo") {
          next.logo = url
          next.settings.logo = url
        }
        if (target === "cover") {
          next.coverImage = url
          next.settings.heroBackground = url
          next.pageContent.hero.customBanner = url
        }
        if (target === "hero") {
          next.settings.heroBackground = url
          next.pageContent.hero.customBanner = url
        }
        if (target === "gallery") {
          next.settings.gallery = [...next.settings.gallery, url]
        }
        if (target === "cta") {
          next.pageContent.cta.customBackground = url
        }
        return next
      })
      toast({ title: "Media uploaded", description: "The preview has been updated." })
    } catch (uploadError: any) {
      toast({
        title: "Upload failed",
        description: uploadError?.message || "Please try another file.",
        variant: "destructive",
      })
    } finally {
      setUploading(null)
    }
  }

  const handleSave = async () => {
    if (!draft) return
    const errors = validateCustomizeDraft(draft)
    if (errors.length > 0) {
      toast({
        title: "Fix the highlighted settings",
        description: errors[0],
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    setError(null)
    try {
      const identifier = draft.id || draft.slug || slug
      await communitiesApi.update(identifier, buildCommunityUpdatePayload(draft), draft.slug || slug)
      await communitiesApi.updateSettings(identifier, buildSettingsUpdatePayload(draft))
      if (draft.id) {
        await communityPageContentApi.update(draft.id, buildPageContentUpdatePayload(draft))
        if (savedDraft && savedDraft.pageContent.isPublished !== draft.pageContent.isPublished) {
          await communityPageContentApi.publish(draft.id, draft.pageContent.isPublished)
        }
      }

      const nextSaved = cloneCustomizeDraft(draft)
      setSavedDraft(nextSaved)
      setDraft(cloneCustomizeDraft(nextSaved))
      await refreshCommunities().catch(() => undefined)
      toast({
        title: "Customization saved",
        description: "The public community page is ready with the latest settings.",
      })
    } catch (saveError: any) {
      setError(saveError?.message || "Failed to save customization.")
      toast({
        title: "Save failed",
        description: saveError?.message || "Please review the fields and try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <DashSidebar />
      <div className="min-h-screen md:pl-[220px]">
        <DashTopbar title="Community Customize" subtitle="Shape the public landing page for this community." />

        <main className="px-4 py-4 sm:px-6 lg:px-7">
          {loading ? (
            <LoadingCustomizeWorkspace />
          ) : error && !draft ? (
            <Alert variant="destructive" className="max-w-4xl">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : draft ? (
            <div className="mx-auto max-w-[1600px] space-y-4">
              <CustomizeHeader
                draft={draft}
                dirty={dirty}
                saving={saving}
                validationErrors={validationErrors}
                publicHref={publicHref}
                onReset={() => savedDraft && setDraft(cloneCustomizeDraft(savedDraft))}
                onSave={handleSave}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid h-auto grid-cols-2 gap-1 rounded-lg bg-white p-1 shadow-sm sm:grid-cols-5">
                  <StudioTab value="brand" icon={<Palette className="h-4 w-4" />} label="Brand" />
                  <StudioTab value="layout" icon={<LayoutTemplate className="h-4 w-4" />} label="Layout" />
                  <StudioTab value="content" icon={<FileText className="h-4 w-4" />} label="Content" />
                  <StudioTab value="media" icon={<ImageIcon className="h-4 w-4" />} label="Media" />
                  <StudioTab value="access" icon={<LockKeyhole className="h-4 w-4" />} label="Access & SEO" />
                </TabsList>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.62fr)]">
                  <div className="min-w-0">
                    <TabsContent value="brand" className="mt-0">
                      <BrandPanel draft={draft} patchDraft={patchDraft} />
                    </TabsContent>
                    <TabsContent value="layout" className="mt-0">
                      <LayoutPanel draft={draft} patchDraft={patchDraft} />
                    </TabsContent>
                    <TabsContent value="content" className="mt-0">
                      <ContentPanel draft={draft} patchDraft={patchDraft} />
                    </TabsContent>
                    <TabsContent value="media" className="mt-0">
                      <MediaPanel
                        draft={draft}
                        patchDraft={patchDraft}
                        uploading={uploading}
                        uploadAsset={uploadAsset}
                      />
                    </TabsContent>
                    <TabsContent value="access" className="mt-0">
                      <AccessPanel draft={draft} patchDraft={patchDraft} />
                    </TabsContent>
                  </div>

                  <div className="min-w-0 xl:sticky xl:top-[72px] xl:self-start">
                    <LivePreview draft={draft} />
                  </div>
                </div>
              </Tabs>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}

function StudioTab({ value, icon, label }: { value: string; icon: ReactNode; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="min-h-10 gap-2 rounded-md px-2 text-xs data-[state=active]:bg-[var(--p)] data-[state=active]:text-white sm:text-sm"
    >
      {icon}
      <span className="truncate">{label}</span>
    </TabsTrigger>
  )
}

function CustomizeHeader({
  draft,
  dirty,
  saving,
  validationErrors,
  publicHref,
  onReset,
  onSave,
}: {
  draft: CommunityCustomizeDraft
  dirty: boolean
  saving: boolean
  validationErrors: string[]
  publicHref: string
  onReset: () => void
  onSave: () => void
}) {
  return (
    <div className="sticky top-14 z-30 rounded-lg border bg-white/95 p-3 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-slate-950">{draft.name}</h2>
            <Badge variant={dirty ? "default" : "secondary"} className="rounded-md">
              {dirty ? "Unsaved changes" : "Saved"}
            </Badge>
            {draft.pageContent.isPublished && (
              <Badge variant="outline" className="rounded-md border-emerald-200 text-emerald-700">
                Published
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manual-save editor for the public page, theme, media, content, and access settings.
          </p>
          {validationErrors.length > 0 && (
            <p className="mt-1 text-xs font-medium text-red-600">{validationErrors[0]}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReset} disabled={!dirty || saving}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={publicHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              View public page
            </Link>
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving || validationErrors.length > 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-5 rounded-lg border bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-800">{label}</Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  )
}

function BrandPanel({
  draft,
  patchDraft,
}: {
  draft: CommunityCustomizeDraft
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
}) {
  return (
    <Panel title="Brand" description="Name, positioning, colors, type, and the visible community identity.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Community name">
          <Input
            value={draft.name}
            onChange={(event) => patchDraft((next) => ({ ...next, name: event.target.value }))}
          />
        </Field>
        <Field label="Category">
          <Input
            value={draft.category}
            onChange={(event) => patchDraft((next) => ({ ...next, category: event.target.value }))}
          />
        </Field>
      </div>

      <Field label="Short description">
        <Textarea
          value={draft.description}
          onChange={(event) => patchDraft((next) => ({ ...next, description: event.target.value }))}
          rows={3}
        />
      </Field>

      <Field label="Long description">
        <Textarea
          value={draft.longDescription}
          onChange={(event) => patchDraft((next) => ({ ...next, longDescription: event.target.value }))}
          rows={5}
        />
      </Field>

      <TextListEditor
        title="Tags"
        values={draft.tags}
        placeholder="Add tag"
        onChange={(tags) => patchDraft((next) => ({ ...next, tags }))}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ColorField
          label="Primary color"
          value={draft.settings.primaryColor}
          onChange={(value) =>
            patchDraft((next) => {
              next.settings.primaryColor = value
              return next
            })
          }
        />
        <ColorField
          label="Secondary color"
          value={draft.settings.secondaryColor}
          onChange={(value) =>
            patchDraft((next) => {
              next.settings.secondaryColor = value
              return next
            })
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {palettePresets.map((palette) => (
          <button
            key={palette.name}
            type="button"
            onClick={() =>
              patchDraft((next) => {
                next.settings.primaryColor = palette.primary
                next.settings.secondaryColor = palette.secondary
                return next
              })
            }
            className="rounded-lg border p-3 text-left transition hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)]"
          >
            <div className="mb-2 flex h-7 overflow-hidden rounded-md">
              <span className="flex-1" style={{ backgroundColor: palette.primary }} />
              <span className="flex-1" style={{ backgroundColor: palette.secondary }} />
            </div>
            <span className="text-xs font-semibold text-slate-700">{palette.name}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SelectField
          label="Template"
          value={draft.settings.template}
          options={[
            ["modern", "Modern"],
            ["editorial", "Editorial"],
            ["minimal", "Minimal"],
            ["immersive", "Immersive"],
          ]}
          onChange={(value) =>
            patchDraft((next) => {
              next.settings.template = value as typeof next.settings.template
              return next
            })
          }
        />
        <SelectField
          label="Font family"
          value={draft.settings.fontFamily}
          options={fontOptions.map((font) => [font, font])}
          onChange={(value) =>
            patchDraft((next) => {
              next.settings.fontFamily = value
              return next
            })
          }
        />
      </div>
    </Panel>
  )
}

function LayoutPanel({
  draft,
  patchDraft,
}: {
  draft: CommunityCustomizeDraft
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
}) {
  return (
    <Panel title="Layout" description="Control the page structure, width, section visibility, and motion.">
      <div className="grid gap-4 lg:grid-cols-2">
        <SegmentedField
          label="Header style"
          value={draft.settings.headerStyle}
          options={[
            ["default", "Default"],
            ["centered", "Centered"],
            ["minimal", "Minimal"],
          ]}
          onChange={(value) =>
            patchDraft((next) => {
              next.settings.headerStyle = value as typeof next.settings.headerStyle
              return next
            })
          }
        />
        <SegmentedField
          label="Hero layout"
          value={draft.settings.heroLayout}
          options={[
            ["centered", "Centered"],
            ["split", "Split"],
            ["media-left", "Media left"],
            ["media-right", "Media right"],
          ]}
          onChange={(value) =>
            patchDraft((next) => {
              next.settings.heroLayout = value as typeof next.settings.heroLayout
              return next
            })
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SegmentedField
          label="Content width"
          value={draft.settings.contentWidth}
          options={[
            ["narrow", "Narrow"],
            ["normal", "Normal"],
            ["wide", "Wide"],
            ["full", "Full"],
          ]}
          onChange={(value) =>
            patchDraft((next) => {
              next.settings.contentWidth = value as typeof next.settings.contentWidth
              return next
            })
          }
        />
        <SegmentedField
          label="Background"
          value={draft.settings.backgroundStyle}
          options={[
            ["solid", "Solid"],
            ["soft", "Soft"],
            ["gradient", "Gradient"],
            ["image", "Image"],
          ]}
          onChange={(value) =>
            patchDraft((next) => {
              next.settings.backgroundStyle = value as typeof next.settings.backgroundStyle
              return next
            })
          }
        />
      </div>

      <Field label={`Corner radius: ${draft.settings.borderRadius}px`}>
        <Slider
          value={[draft.settings.borderRadius]}
          min={0}
          max={32}
          step={1}
          onValueChange={([value]) =>
            patchDraft((next) => {
              next.settings.borderRadius = value
              return next
            })
          }
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["showHero", "Hero"],
          ["showStats", "Stats"],
          ["showFeatures", "Overview"],
          ["showBenefits", "Benefits"],
          ["showTestimonials", "Testimonials"],
          ["showPosts", "Posts"],
          ["enableParallax", "Parallax"],
        ].map(([key, label]) => (
          <SwitchRow
            key={key}
            label={label}
            checked={Boolean(draft.settings[key as keyof typeof draft.settings])}
            onCheckedChange={(checked) =>
              patchDraft((next) => {
                ;(next.settings as any)[key] = checked
                return next
              })
            }
          />
        ))}
      </div>
    </Panel>
  )
}

function ContentPanel({
  draft,
  patchDraft,
}: {
  draft: CommunityCustomizeDraft
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
}) {
  return (
    <Panel title="Content" description="Edit the copy and repeatable sections shown on the public page.">
      <Field label="Welcome message">
        <Textarea
          value={draft.settings.welcomeMessage}
          onChange={(event) =>
            patchDraft((next) => {
              next.settings.welcomeMessage = event.target.value
              return next
            })
          }
          rows={3}
        />
      </Field>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextListEditor
          title="Feature bullets"
          values={draft.settings.features}
          placeholder="Add feature"
          onChange={(features) =>
            patchDraft((next) => {
              next.settings.features = features
              return next
            })
          }
        />
        <TextListEditor
          title="Benefit bullets"
          values={draft.settings.benefits}
          placeholder="Add benefit"
          onChange={(benefits) =>
            patchDraft((next) => {
              next.settings.benefits = benefits
              return next
            })
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Hero title">
          <Input
            value={draft.pageContent.hero.customTitle || ""}
            onChange={(event) =>
              patchDraft((next) => {
                next.pageContent.hero.customTitle = event.target.value
                return next
              })
            }
          />
        </Field>
        <Field label="Hero CTA">
          <Input
            value={draft.pageContent.hero.ctaButtonText}
            onChange={(event) =>
              patchDraft((next) => {
                next.pageContent.hero.ctaButtonText = event.target.value
                return next
              })
            }
          />
        </Field>
      </div>

      <Field label="Hero subtitle">
        <Textarea
          value={draft.pageContent.hero.customSubtitle || ""}
          onChange={(event) =>
            patchDraft((next) => {
              next.pageContent.hero.customSubtitle = event.target.value
              return next
            })
          }
          rows={3}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["showMemberCount", "Member count"],
          ["showRating", "Rating"],
          ["showCreator", "Creator"],
        ].map(([key, label]) => (
          <SwitchRow
            key={key}
            label={label}
            checked={Boolean(draft.pageContent.hero[key as keyof typeof draft.pageContent.hero])}
            onCheckedChange={(checked) =>
              patchDraft((next) => {
                ;(next.pageContent.hero as any)[key] = checked
                return next
              })
            }
          />
        ))}
      </div>

      <SectionHeaderEditor
        title="Overview section"
        visible={draft.pageContent.overview.visible}
        fields={[
          {
            label: "Title",
            value: draft.pageContent.overview.title,
            onChange: (value) =>
              patchDraft((next) => {
                next.pageContent.overview.title = value
                return next
              }),
          },
          {
            label: "Subtitle",
            value: draft.pageContent.overview.subtitle,
            onChange: (value) =>
              patchDraft((next) => {
                next.pageContent.overview.subtitle = value
                return next
              }),
          },
        ]}
        onVisibleChange={(checked) =>
          patchDraft((next) => {
            next.pageContent.overview.visible = checked
            return next
          })
        }
      />

      <IconItemsEditor
        type="overview"
        items={draft.pageContent.overview.cards}
        onChange={(items) =>
          patchDraft((next) => {
            next.pageContent.overview.cards = items
            return next
          })
        }
      />

      <SectionHeaderEditor
        title="Benefits section"
        visible={draft.pageContent.benefits.visible}
        fields={[
          {
            label: "Title prefix",
            value: draft.pageContent.benefits.titlePrefix,
            onChange: (value) =>
              patchDraft((next) => {
                next.pageContent.benefits.titlePrefix = value
                return next
              }),
          },
          {
            label: "Title suffix",
            value: draft.pageContent.benefits.titleSuffix || "",
            onChange: (value) =>
              patchDraft((next) => {
                next.pageContent.benefits.titleSuffix = value
                return next
              }),
          },
          {
            label: "Subtitle",
            value: draft.pageContent.benefits.subtitle || "",
            onChange: (value) =>
              patchDraft((next) => {
                next.pageContent.benefits.subtitle = value
                return next
              }),
          },
        ]}
        onVisibleChange={(checked) =>
          patchDraft((next) => {
            next.pageContent.benefits.visible = checked
            return next
          })
        }
      />

      <IconItemsEditor
        type="benefit"
        items={draft.pageContent.benefits.benefits}
        onChange={(items) =>
          patchDraft((next) => {
            next.pageContent.benefits.benefits = items
            return next
          })
        }
      />

      <TestimonialsEditor
        draft={draft}
        patchDraft={patchDraft}
      />

      <SectionHeaderEditor
        title="CTA section"
        visible={draft.pageContent.cta.visible}
        fields={[
          {
            label: "Title",
            value: draft.pageContent.cta.title,
            onChange: (value) =>
              patchDraft((next) => {
                next.pageContent.cta.title = value
                return next
              }),
          },
          {
            label: "Subtitle",
            value: draft.pageContent.cta.subtitle,
            onChange: (value) =>
              patchDraft((next) => {
                next.pageContent.cta.subtitle = value
                return next
              }),
          },
          {
            label: "Button text",
            value: draft.pageContent.cta.buttonText,
            onChange: (value) =>
              patchDraft((next) => {
                next.pageContent.cta.buttonText = value
                return next
              }),
          },
        ]}
        onVisibleChange={(checked) =>
          patchDraft((next) => {
            next.pageContent.cta.visible = checked
            return next
          })
        }
      />
    </Panel>
  )
}

function MediaPanel({
  draft,
  patchDraft,
  uploading,
  uploadAsset,
}: {
  draft: CommunityCustomizeDraft
  uploading: UploadTarget
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
  uploadAsset: (file: File, target: Exclude<UploadTarget, null>, purpose: MediaPurpose) => Promise<void>
}) {
  return (
    <Panel title="Media" description="Upload or paste media URLs for logo, hero, gallery, video, and custom sections.">
      <div className="grid gap-4 lg:grid-cols-2">
        <UploadField
          label="Logo"
          value={draft.logo}
          target="logo"
          purpose="community_logo"
          uploading={uploading}
          onUpload={uploadAsset}
          onUrlChange={(value) =>
            patchDraft((next) => {
              next.logo = value
              next.settings.logo = value
              return next
            })
          }
        />
        <UploadField
          label="Cover image"
          value={draft.coverImage}
          target="cover"
          purpose="community_cover"
          uploading={uploading}
          onUpload={uploadAsset}
          onUrlChange={(value) =>
            patchDraft((next) => {
              next.coverImage = value
              next.settings.heroBackground = value
              return next
            })
          }
        />
        <UploadField
          label="Hero background"
          value={draft.pageContent.hero.customBanner || draft.settings.heroBackground}
          target="hero"
          purpose="community_cover"
          uploading={uploading}
          onUpload={uploadAsset}
          onUrlChange={(value) =>
            patchDraft((next) => {
              next.settings.heroBackground = value
              next.pageContent.hero.customBanner = value
              return next
            })
          }
        />
        <UploadField
          label="CTA background"
          value={draft.pageContent.cta.customBackground || ""}
          target="cta"
          purpose="generic"
          uploading={uploading}
          onUpload={uploadAsset}
          onUrlChange={(value) =>
            patchDraft((next) => {
              next.pageContent.cta.customBackground = value
              return next
            })
          }
        />
      </div>

      <Field label="Video URL">
        <div className="flex gap-2">
          <Video className="mt-2 h-4 w-4 shrink-0 text-slate-400" />
          <Input
            value={draft.settings.videoUrl}
            placeholder="https://youtube.com/watch?v=..."
            onChange={(event) =>
              patchDraft((next) => {
                next.settings.videoUrl = event.target.value
                return next
              })
            }
          />
        </div>
      </Field>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Gallery</h4>
            <p className="text-xs text-slate-500">Public image URLs are saved in settings.</p>
          </div>
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-slate-50">
            {uploading === "gallery" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void uploadAsset(file, "gallery", "generic")
                event.currentTarget.value = ""
              }}
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {draft.settings.gallery.map((item, index) => (
            <div key={`${item}-${index}`} className="rounded-lg border p-3">
              <MediaThumb url={item} alt={`Gallery ${index + 1}`} />
              <div className="mt-2 flex gap-2">
                <Input
                  value={item}
                  onChange={(event) =>
                    patchDraft((next) => {
                      next.settings.gallery[index] = event.target.value
                      return next
                    })
                  }
                />
                <IconButton
                  label="Remove gallery item"
                  onClick={() =>
                    patchDraft((next) => {
                      next.settings.gallery.splice(index, 1)
                      return next
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            patchDraft((next) => {
              next.settings.gallery.push("")
              return next
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add URL
        </Button>
      </div>

      <CustomSectionsEditor draft={draft} patchDraft={patchDraft} />
    </Panel>
  )
}

function AccessPanel({
  draft,
  patchDraft,
}: {
  draft: CommunityCustomizeDraft
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
}) {
  return (
    <Panel title="Access & SEO" description="Control visibility, pricing, publishing, and search metadata.">
      <div className="grid gap-4 lg:grid-cols-2">
        <SelectField
          label="Visibility"
          value={draft.settings.visibility}
          options={[
            ["public", "Public"],
            ["private", "Private"],
          ]}
          onChange={(value) =>
            patchDraft((next) => {
              next.settings.visibility = value as typeof next.settings.visibility
              return next
            })
          }
        />
        <SelectField
          label="Community type"
          value={draft.type}
          options={[
            ["community", "Community"],
            ["course", "Course"],
            ["challenge", "Challenge"],
            ["event", "Event"],
            ["oneToOne", "One-to-one"],
            ["product", "Product"],
          ]}
          onChange={(value) =>
            patchDraft((next) => {
              next.type = value as typeof next.type
              return next
            })
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SelectField
          label="Price type"
          value={draft.priceType}
          options={[
            ["free", "Free"],
            ["one-time", "One-time"],
            ["monthly", "Monthly"],
            ["yearly", "Yearly"],
          ]}
          onChange={(value) =>
            patchDraft((next) => {
              next.priceType = value as typeof next.priceType
              if (value === "free") next.price = 0
              return next
            })
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Price">
          <Input
            type="number"
            min={0}
            value={draft.price}
            disabled={draft.priceType === "free"}
            onChange={(event) =>
              patchDraft((next) => {
                next.price = Number(event.target.value)
                return next
              })
            }
          />
        </Field>
        <SwitchRow
          label="Allow invites"
          checked={draft.settings.allowInvites}
          onCheckedChange={(checked) =>
            patchDraft((next) => {
              next.settings.allowInvites = checked
              return next
            })
          }
        />
      </div>

      <SwitchRow
        label="Published page content"
        description="When enabled, the custom page content is available to the public page endpoint."
        checked={draft.pageContent.isPublished}
        onCheckedChange={(checked) =>
          patchDraft((next) => {
            next.pageContent.isPublished = checked
            return next
          })
        }
      />

      <div className="grid gap-4">
        <Field label="SEO title">
          <Input
            value={draft.settings.metaTitle}
            onChange={(event) =>
              patchDraft((next) => {
                next.settings.metaTitle = event.target.value
                return next
              })
            }
          />
        </Field>
      </div>

      <Field label="SEO description">
        <Textarea
          value={draft.settings.metaDescription}
          rows={3}
          onChange={(event) =>
            patchDraft((next) => {
              next.settings.metaDescription = event.target.value
              return next
            })
          }
        />
      </Field>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(draft.settings.socialLinks).map(([key, value]) => (
          <Field key={key} label={`${key.charAt(0).toUpperCase()}${key.slice(1)} URL`}>
            <Input
              value={value || ""}
              onChange={(event) =>
                patchDraft((next) => {
                  next.settings.socialLinks = {
                    ...next.settings.socialLinks,
                    [key]: event.target.value,
                  }
                  return next
                })
              }
            />
          </Field>
        ))}
      </div>

    </Panel>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const valid = isValidHexColor(value)
  return (
    <Field label={label} hint={valid ? "Contrast-safe text is calculated for public buttons." : "Use #RGB or #RRGGBB."}>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!valid}
          className={cn(!valid && "border-red-400 focus-visible:ring-red-500")}
        />
        <input
          type="color"
          value={valid ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border bg-white p-1"
          aria-label={label}
        />
      </div>
    </Field>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function SegmentedField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <Field label={label}>
      <div className="grid gap-1 rounded-lg border bg-slate-50 p-1 sm:grid-cols-2">
        {options.map(([optionValue, optionLabel]) => {
          const active = optionValue === value
          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(optionValue)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--p)]",
                active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900",
              )}
            >
              {optionLabel}
            </button>
          )
        })}
      </div>
    </Field>
  )
}

function SwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs leading-relaxed text-slate-500">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function TextListEditor({
  title,
  values,
  placeholder,
  onChange,
}: {
  title: string
  values: string[]
  placeholder: string
  onChange: (values: string[]) => void
}) {
  const move = (from: number, to: number) => {
    const next = [...values]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...values, ""])}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={`${title}-${index}`} className="flex gap-2">
            <Input
              value={value}
              placeholder={placeholder}
              onChange={(event) => {
                const next = [...values]
                next[index] = event.target.value
                onChange(next)
              }}
            />
            <MoveButtons
              index={index}
              length={values.length}
              onMove={move}
            />
            <IconButton
              label={`Remove ${title}`}
              onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
        ))}
        {values.length === 0 && <p className="text-sm text-slate-500">No items yet.</p>}
      </div>
    </div>
  )
}

function SectionHeaderEditor({
  title,
  visible,
  fields,
  onVisibleChange,
}: {
  title: string
  visible: boolean
  fields: Array<{ label: string; value: string; onChange: (value: string) => void }>
  onVisibleChange: (checked: boolean) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <SwitchRow label={title} checked={visible} onCheckedChange={onVisibleChange} />
      <div className="grid gap-3 lg:grid-cols-2">
        {fields.map((field) => (
          <Field key={field.label} label={field.label}>
            {field.label.toLowerCase().includes("subtitle") ? (
              <Textarea rows={2} value={field.value} onChange={(event) => field.onChange(event.target.value)} />
            ) : (
              <Input value={field.value} onChange={(event) => field.onChange(event.target.value)} />
            )}
          </Field>
        ))}
      </div>
    </div>
  )
}

function IconItemsEditor({
  type,
  items,
  onChange,
}: {
  type: "overview" | "benefit"
  items: Array<{
    id: string
    title: string
    description: string
    icon: string
    iconColor: string
    order: number
    visible: boolean
  }>
  onChange: (items: any[]) => void
}) {
  const move = (from: number, to: number) => {
    const next = [...items]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next.map((entry, index) => ({ ...entry, order: index })))
  }

  const addLabel = type === "overview" ? "Add overview card" : "Add benefit"
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900">
          {type === "overview" ? "Overview cards" : "Benefit items"}
        </h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onChange([
              ...items,
              {
                id: makeCustomizeId(type),
                title: "",
                description: "",
                icon: type === "overview" ? "Sparkles" : "CheckCircle",
                iconColor: "#8e78fb",
                order: items.length,
                visible: true,
              },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id || index} className="space-y-3 rounded-lg border bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <SwitchRow
                label={item.title || `${type === "overview" ? "Card" : "Benefit"} ${index + 1}`}
                checked={item.visible !== false}
                onCheckedChange={(checked) => {
                  const next = [...items]
                  next[index] = { ...item, visible: checked }
                  onChange(next)
                }}
              />
              <div className="flex shrink-0 gap-1">
                <MoveButtons index={index} length={items.length} onMove={move} />
                <IconButton label="Remove item" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Title">
                <Input
                  value={item.title}
                  onChange={(event) => {
                    const next = [...items]
                    next[index] = { ...item, title: event.target.value }
                    onChange(next)
                  }}
                />
              </Field>
              <Field label="Icon">
                <Input
                  value={item.icon}
                  onChange={(event) => {
                    const next = [...items]
                    next[index] = { ...item, icon: event.target.value }
                    onChange(next)
                  }}
                />
              </Field>
              <Field label="Icon color">
                <Input
                  value={item.iconColor}
                  className={cn(!isValidHexColor(item.iconColor) && "border-red-400")}
                  onChange={(event) => {
                    const next = [...items]
                    next[index] = { ...item, iconColor: event.target.value }
                    onChange(next)
                  }}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={item.description}
                  onChange={(event) => {
                    const next = [...items]
                    next[index] = { ...item, description: event.target.value }
                    onChange(next)
                  }}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TestimonialsEditor({
  draft,
  patchDraft,
}: {
  draft: CommunityCustomizeDraft
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
}) {
  const testimonials = draft.pageContent.testimonials.testimonials
  const move = (from: number, to: number) => {
    patchDraft((next) => {
      const items = [...next.pageContent.testimonials.testimonials]
      const [item] = items.splice(from, 1)
      items.splice(to, 0, item)
      next.pageContent.testimonials.testimonials = items.map((entry, index) => ({ ...entry, order: index }))
      return next
    })
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Testimonials</h4>
          <p className="text-xs text-slate-500">Use real member quotes when available.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            patchDraft((next) => {
              next.pageContent.testimonials.testimonials.push({
                id: makeCustomizeId("testimonial"),
                name: "",
                role: "",
                avatar: "",
                rating: 5,
                content: "",
                order: next.pageContent.testimonials.testimonials.length,
                visible: true,
                createdAt: new Date().toISOString(),
              })
              return next
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add quote
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Section title">
          <Input
            value={draft.pageContent.testimonials.title}
            onChange={(event) =>
              patchDraft((next) => {
                next.pageContent.testimonials.title = event.target.value
                return next
              })
            }
          />
        </Field>
        <SwitchRow
          label="Show testimonial ratings"
          checked={draft.pageContent.testimonials.showRatings}
          onCheckedChange={(checked) =>
            patchDraft((next) => {
              next.pageContent.testimonials.showRatings = checked
              return next
            })
          }
        />
      </div>
      <Field label="Section subtitle">
        <Textarea
          value={draft.pageContent.testimonials.subtitle}
          rows={2}
          onChange={(event) =>
            patchDraft((next) => {
              next.pageContent.testimonials.subtitle = event.target.value
              return next
            })
          }
        />
      </Field>

      <SwitchRow
        label="Show testimonials section"
        checked={draft.pageContent.testimonials.visible}
        onCheckedChange={(checked) =>
          patchDraft((next) => {
            next.pageContent.testimonials.visible = checked
            return next
          })
        }
      />

      <div className="space-y-3">
        {testimonials.map((testimonial, index) => (
          <div key={testimonial.id || index} className="space-y-3 rounded-lg border bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <SwitchRow
                label={testimonial.name || `Quote ${index + 1}`}
                checked={testimonial.visible !== false}
                onCheckedChange={(checked) =>
                  patchDraft((next) => {
                    next.pageContent.testimonials.testimonials[index].visible = checked
                    return next
                  })
                }
              />
              <div className="flex shrink-0 gap-1">
                <MoveButtons index={index} length={testimonials.length} onMove={move} />
                <IconButton
                  label="Remove quote"
                  onClick={() =>
                    patchDraft((next) => {
                      next.pageContent.testimonials.testimonials.splice(index, 1)
                      return next
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <Field label="Name">
                <Input
                  value={testimonial.name}
                  onChange={(event) =>
                    patchDraft((next) => {
                      next.pageContent.testimonials.testimonials[index].name = event.target.value
                      return next
                    })
                  }
                />
              </Field>
              <Field label="Role">
                <Input
                  value={testimonial.role}
                  onChange={(event) =>
                    patchDraft((next) => {
                      next.pageContent.testimonials.testimonials[index].role = event.target.value
                      return next
                    })
                  }
                />
              </Field>
              <Field label="Avatar URL">
                <Input
                  value={testimonial.avatar}
                  onChange={(event) =>
                    patchDraft((next) => {
                      next.pageContent.testimonials.testimonials[index].avatar = event.target.value
                      return next
                    })
                  }
                />
              </Field>
              <Field label="Rating">
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={testimonial.rating}
                  onChange={(event) =>
                    patchDraft((next) => {
                      next.pageContent.testimonials.testimonials[index].rating = Number(event.target.value)
                      return next
                    })
                  }
                />
              </Field>
            </div>
            <Field label="Quote">
              <Textarea
                rows={3}
                value={testimonial.content}
                onChange={(event) =>
                  patchDraft((next) => {
                    next.pageContent.testimonials.testimonials[index].content = event.target.value
                    return next
                  })
                }
              />
            </Field>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomSectionsEditor({
  draft,
  patchDraft,
}: {
  draft: CommunityCustomizeDraft
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Custom sections</h4>
          <p className="text-xs text-slate-500">Saved in settings for public-page extensions.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            patchDraft((next) => {
              next.settings.customSections.push({
                id: makeCustomizeId("section"),
                type: "text",
                title: "",
                content: "",
                visible: true,
              })
              return next
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add section
        </Button>
      </div>

      {draft.settings.customSections.map((section, index) => (
        <div key={String(section.id || index)} className="space-y-3 rounded-lg border bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <SwitchRow
              label={section.title || `Section ${index + 1}`}
              checked={section.visible !== false}
              onCheckedChange={(checked) =>
                patchDraft((next) => {
                  next.settings.customSections[index] = { ...next.settings.customSections[index], visible: checked }
                  return next
                })
              }
            />
            <IconButton
              label="Remove custom section"
              onClick={() =>
                patchDraft((next) => {
                  next.settings.customSections.splice(index, 1)
                  return next
                })
              }
            >
              <Trash2 className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <SelectField
              label="Type"
              value={String(section.type || "text")}
              options={[
                ["text", "Text"],
                ["image", "Image"],
                ["video", "Video"],
                ["link", "Link"],
              ]}
              onChange={(value) =>
                patchDraft((next) => {
                  next.settings.customSections[index] = { ...next.settings.customSections[index], type: value }
                  return next
                })
              }
            />
            <Field label="Title">
              <Input
                value={String(section.title || "")}
                onChange={(event) =>
                  patchDraft((next) => {
                    next.settings.customSections[index] = {
                      ...next.settings.customSections[index],
                      title: event.target.value,
                    }
                    return next
                  })
                }
              />
            </Field>
          </div>
          <Field label="Content">
            <Textarea
              rows={3}
              value={String(section.content || "")}
              onChange={(event) =>
                patchDraft((next) => {
                  next.settings.customSections[index] = {
                    ...next.settings.customSections[index],
                    content: event.target.value,
                  }
                  return next
                })
              }
            />
          </Field>
        </div>
      ))}
    </div>
  )
}

function UploadField({
  label,
  value,
  target,
  purpose,
  uploading,
  onUpload,
  onUrlChange,
}: {
  label: string
  value: string
  target: Exclude<UploadTarget, null>
  purpose: MediaPurpose
  uploading: UploadTarget
  onUpload: (file: File, target: Exclude<UploadTarget, null>, purpose: MediaPurpose) => Promise<void>
  onUrlChange: (value: string) => void
}) {
  const resolved = resolveImageUrl(value) || value
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-slate-900">{label}</Label>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-slate-50">
          {uploading === target ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
          <input
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void onUpload(file, target, purpose)
              event.currentTarget.value = ""
            }}
          />
        </label>
      </div>
      <MediaThumb url={resolved} alt={label} />
      <Input value={value} placeholder="Paste a public URL" onChange={(event) => onUrlChange(event.target.value)} />
    </div>
  )
}

function MediaThumb({ url, alt }: { url: string; alt: string }) {
  if (!url) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed bg-slate-50 text-slate-400">
        <ImageIcon className="h-6 w-6" />
      </div>
    )
  }

  return (
    <div className="aspect-video overflow-hidden rounded-lg border bg-slate-50">
      <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </div>
  )
}

function MoveButtons({
  index,
  length,
  onMove,
}: {
  index: number
  length: number
  onMove: (from: number, to: number) => void
}) {
  return (
    <>
      <IconButton label="Move up" disabled={index === 0} onClick={() => onMove(index, index - 1)}>
        <ArrowUp className="h-4 w-4" />
      </IconButton>
      <IconButton label="Move down" disabled={index >= length - 1} onClick={() => onMove(index, index + 1)}>
        <ArrowDown className="h-4 w-4" />
      </IconButton>
    </>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-10 w-10 shrink-0"
    >
      {children}
    </Button>
  )
}

function LivePreview({ draft }: { draft: CommunityCustomizeDraft }) {
  const normalized = normalizeCommunitySettings(
    {
      ...draft.settings,
      logo: draft.settings.logo || draft.logo,
      heroBackground: draft.pageContent.hero.customBanner || draft.settings.heroBackground || draft.coverImage,
    },
    draft.name,
  )
  const theme = buildCommunityTheme(normalized)
  const heroImage = resolveImageUrl(draft.pageContent.hero.customBanner || draft.coverImage || draft.settings.heroBackground)
  const logo = resolveImageUrl(draft.logo || draft.settings.logo)
  const centered = normalized.heroLayout === "centered"
  const mediaLeft = normalized.heroLayout === "media-left"
  const visibleCards = draft.pageContent.overview.cards.filter((card) => card.visible !== false)
  const visibleBenefits = draft.pageContent.benefits.benefits.filter((benefit) => benefit.visible !== false)
  const visibleTestimonials = draft.pageContent.testimonials.testimonials.filter((item) => item.visible !== false)
  const socialEntries = Object.entries(normalized.socialLinks).filter(([, value]) => value.trim())
  const visibleCustomSections = normalized.customSections.filter((section) => {
    const title = typeof section.title === "string" ? section.title.trim() : ""
    const content = typeof section.content === "string" ? section.content.trim() : ""
    return section.visible !== false && (title || content)
  })

  return (
    <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Live public preview</h3>
          <p className="text-xs text-slate-500">Scripts are not executed here.</p>
        </div>
        <Badge variant="outline" className="rounded-md">
          {normalized.template}
        </Badge>
      </div>

      <div
        className="max-h-[calc(100vh-168px)] overflow-auto"
        style={{
          background: theme.pageBackground,
          fontFamily: theme.fontFamily,
        }}
      >
        <div className="p-4 sm:p-5">
          {normalized.showHero && (
            <div
              className={cn(
                "grid gap-5 overflow-hidden border bg-white p-5",
                centered ? "text-center" : "lg:grid-cols-2",
                mediaLeft && "lg:[&_.preview-media]:order-first",
              )}
              style={{
                borderColor: theme.mutedBorder,
                borderRadius: theme.radiusLg,
                background: normalized.template === "immersive" ? theme.surfaceBackground : "#ffffff",
              }}
            >
              <div className={cn("space-y-4", centered && "mx-auto max-w-xl")}>
                <div className={cn("flex items-center gap-2", centered && "justify-center")}>
                  <div
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md text-sm font-bold text-white"
                    style={{ background: theme.gradient, borderRadius: theme.radius }}
                  >
                    {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : draft.name.charAt(0)}
                  </div>
                  <div className={cn("min-w-0", centered && "text-left")}>
                    <p className="truncate text-sm font-semibold text-slate-950">{draft.name}</p>
                    <p className="truncate text-xs text-slate-500">{draft.category || "Community"}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-bold leading-tight text-slate-950">
                    {draft.pageContent.hero.customTitle || draft.name}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {draft.pageContent.hero.customSubtitle || draft.longDescription || draft.description}
                  </p>
                </div>
                <div className={cn("flex flex-wrap gap-2", centered && "justify-center")}>
                  {draft.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border px-2 py-1 text-xs font-medium"
                      style={{ borderColor: theme.mutedBorder, color: theme.primary }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {normalized.showStats && (
                  <div className={cn("grid gap-2 sm:grid-cols-3", centered && "mx-auto max-w-lg")}>
                    {[
                      ["Members", "1.2k"],
                      ["Rating", "4.9"],
                      ["Access", draft.priceType === "free" ? "Free" : `$${draft.price}`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-md border bg-white p-3" style={{ borderColor: theme.mutedBorder }}>
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="font-semibold text-slate-950">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="rounded-md px-4 py-2 text-sm font-semibold shadow-sm"
                  style={{
                    background: theme.gradient,
                    color: theme.primaryText,
                    borderRadius: theme.radius,
                  }}
                >
                  {draft.pageContent.hero.ctaButtonText}
                </button>
              </div>

              {!centered && (
                <div className="preview-media overflow-hidden border bg-slate-100" style={{ borderRadius: theme.radiusLg }}>
                  {heroImage ? (
                    <img src={heroImage} alt="" className="h-full min-h-[260px] w-full object-cover" />
                  ) : (
                    <div className="flex min-h-[260px] items-center justify-center text-slate-400">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 space-y-5">
            {(socialEntries.length > 0 || normalized.gallery.length > 0 || normalized.videoUrl) && (
              <PreviewSection title="Media and links" subtitle="Saved media settings as they appear on the public page.">
                <div className="space-y-3">
                  {socialEntries.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {socialEntries.map(([key]) => (
                        <span
                          key={key}
                          className="rounded-md border bg-white px-2 py-1 text-xs font-medium"
                          style={{ borderColor: theme.mutedBorder, color: theme.primary }}
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                      ))}
                    </div>
                  )}
                  {normalized.videoUrl && (
                    <div className="rounded-md border bg-white p-3 text-sm text-slate-600" style={{ borderColor: theme.mutedBorder }}>
                      Video: {normalized.videoUrl}
                    </div>
                  )}
                  {normalized.gallery.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {normalized.gallery.slice(0, 4).map((image, index) => (
                        <div key={`${image}-${index}`} className="aspect-video overflow-hidden rounded-md border bg-slate-100" style={{ borderColor: theme.mutedBorder }}>
                          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </PreviewSection>
            )}

            {visibleCustomSections.length > 0 && (
              <PreviewSection title="Custom sections">
                <div className="space-y-3">
                  {visibleCustomSections.slice(0, 3).map((section, index) => (
                    <div key={String(section.id || index)} className="rounded-md border bg-white p-4" style={{ borderColor: theme.mutedBorder, borderRadius: theme.radius }}>
                      <h5 className="font-semibold text-slate-950">{String(section.title || `Section ${index + 1}`)}</h5>
                      <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{String(section.content || "")}</p>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {normalized.showFeatures && draft.pageContent.overview.visible && (
              <PreviewSection title={draft.pageContent.overview.title} subtitle={draft.pageContent.overview.subtitle}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {visibleCards.slice(0, 4).map((card) => (
                    <div
                      key={card.id}
                      className="rounded-md border bg-white p-4"
                      style={{ borderColor: theme.mutedBorder, borderRadius: theme.radius }}
                    >
                      <Sparkles className="mb-3 h-4 w-4" style={{ color: card.iconColor || theme.primary }} />
                      <h5 className="font-semibold text-slate-950">{card.title}</h5>
                      <p className="mt-1 text-sm text-slate-600">{card.description}</p>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {normalized.showBenefits && draft.pageContent.benefits.visible && (
              <PreviewSection
                title={`${draft.pageContent.benefits.titlePrefix} ${draft.pageContent.benefits.titleSuffix || draft.name}`}
                subtitle={draft.pageContent.benefits.subtitle}
              >
                <div className="space-y-2">
                  {visibleBenefits.slice(0, 5).map((benefit) => (
                    <div key={benefit.id} className="flex gap-3 rounded-md border bg-white p-3" style={{ borderColor: theme.mutedBorder }}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: benefit.iconColor || theme.secondary }} />
                      <div>
                        <p className="font-medium text-slate-900">{benefit.title}</p>
                        <p className="text-sm text-slate-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </PreviewSection>
            )}

            {normalized.showTestimonials && draft.pageContent.testimonials.visible && (
              <PreviewSection title={draft.pageContent.testimonials.title} subtitle={draft.pageContent.testimonials.subtitle}>
                {visibleTestimonials.length > 0 ? (
                  <div className="grid gap-3">
                    {visibleTestimonials.slice(0, 2).map((testimonial) => (
                      <blockquote
                        key={testimonial.id}
                        className="rounded-md border bg-white p-4 text-sm text-slate-700"
                        style={{ borderColor: theme.mutedBorder, borderRadius: theme.radius }}
                      >
                        "{testimonial.content}"
                        <footer className="mt-3 font-semibold text-slate-950">{testimonial.name}</footer>
                      </blockquote>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-sm text-slate-500">No testimonials yet.</div>
                )}
              </PreviewSection>
            )}

            {draft.pageContent.cta.visible && (
              <div
                className="overflow-hidden rounded-md border p-5 text-center"
                style={{
                  borderColor: theme.mutedBorder,
                  borderRadius: theme.radiusLg,
                  background: draft.pageContent.cta.customBackground
                    ? `linear-gradient(rgba(17,24,39,0.64), rgba(17,24,39,0.64)), url("${draft.pageContent.cta.customBackground}") center/cover`
                    : theme.gradient,
                  color: "#ffffff",
                }}
              >
                <h4 className="text-xl font-bold">{draft.pageContent.cta.title}</h4>
                <p className="mt-2 text-sm opacity-90">{draft.pageContent.cta.subtitle}</p>
                <button type="button" className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-semibold" style={{ color: theme.primary }}>
                  {draft.pageContent.cta.buttonText}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function PreviewSection({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section>
      <h4 className="text-lg font-bold text-slate-950">{title}</h4>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function LoadingCustomizeWorkspace() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-4">
      <div className="h-24 animate-pulse rounded-lg border bg-white" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.62fr)]">
        <div className="h-[620px] animate-pulse rounded-lg border bg-white" />
        <div className="h-[620px] animate-pulse rounded-lg border bg-white" />
      </div>
    </div>
  )
}
