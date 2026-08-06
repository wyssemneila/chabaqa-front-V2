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
  GripVertical,
  ImageIcon,
  LayoutTemplate,
  Loader2,
  LockKeyhole,
  Palette,
  Plus,
  RotateCcw,
  Redo2,
  Save,
  Sparkles,
  Trash2,
  Undo2,
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
import { mediaApi, type MediaAsset, type MediaPurpose } from "@/lib/api/media.api"
import { normalizeCommunitySettings } from "@/lib/community-settings"
import { buildCommunityTheme, getContrastRatio } from "@/lib/community-theme"
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

const templatePresets = [
  { id: "modern", name: "Modern", description: "Clean, confident, conversion-focused.", primary: "#8e78fb", secondary: "#f48fb1", font: "Inter" },
  { id: "editorial", name: "Editorial", description: "Story-first, refined, and spacious.", primary: "#111827", secondary: "#d97706", font: "Serif" },
  { id: "minimal", name: "Minimal", description: "Quiet, direct, and content-led.", primary: "#2563eb", secondary: "#14b8a6", font: "Manrope" },
  { id: "immersive", name: "Immersive", description: "High-impact visuals and bold energy.", primary: "#7c3aed", secondary: "#ec4899", font: "Space Grotesk" },
] as const

type CommunityCustomizePageProps = {
  slug: string
}

type UploadTarget = "logo" | "favicon" | "cover" | "hero" | "gallery" | "cta" | "video" | null

function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    image.src = url
  })
}

export function CommunityCustomizePage({ slug }: CommunityCustomizePageProps) {
  const { toast } = useToast()
  const { setSelectedCommunityId, refreshCommunities } = useCreatorCommunity()
  const [draft, setDraft] = useState<CommunityCustomizeDraft | null>(null)
  const [savedDraft, setSavedDraft] = useState<CommunityCustomizeDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<UploadTarget>(null)
  const [assetLibrary, setAssetLibrary] = useState<MediaAsset[]>([])
  const [loadingAssetLibrary, setLoadingAssetLibrary] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("brand")
  const [undoStack, setUndoStack] = useState<CommunityCustomizeDraft[]>([])
  const [redoStack, setRedoStack] = useState<CommunityCustomizeDraft[]>([])
  const [submittingDomainRequest, setSubmittingDomainRequest] = useState(false)

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
        setUndoStack([])
        setRedoStack([])
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

  useEffect(() => {
    if (!draft?.id) return
    let active = true
    setLoadingAssetLibrary(true)
    void mediaApi.listAssets({ entityType: "community", entityId: draft.id, limit: 48 })
      .then((assets) => { if (active) setAssetLibrary(assets) })
      .catch(() => { if (active) setAssetLibrary([]) })
      .finally(() => { if (active) setLoadingAssetLibrary(false) })
    return () => { active = false }
  }, [draft?.id])

  const dirty = useMemo(() => {
    if (!draft || !savedDraft) return false
    return JSON.stringify(serializeCustomizeDraft(draft)) !== JSON.stringify(serializeCustomizeDraft(savedDraft))
  }, [draft, savedDraft])

  const validationErrors = useMemo(() => (draft ? validateCustomizeDraft(draft) : []), [draft])
  const brandReadiness = useMemo(() => (draft ? getBrandReadiness(draft) : { score: 0, missing: [] as string[] }), [draft])
  const publicHref = `/community/${encodeURIComponent(draft?.slug || slug)}`

  const patchDraft = (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => {
    setDraft((current) => {
      if (!current) return current
      const next = updater(cloneCustomizeDraft(current))
      if (JSON.stringify(next) !== JSON.stringify(current)) {
        setUndoStack((history) => [...history, cloneCustomizeDraft(current)].slice(-60))
        setRedoStack([])
      }
      return next
    })
  }

  const undo = () => {
    if (!draft || undoStack.length === 0) return
    const previous = undoStack[undoStack.length - 1]
    setUndoStack((history) => history.slice(0, -1))
    setRedoStack((history) => [...history, cloneCustomizeDraft(draft)].slice(-60))
    setDraft(cloneCustomizeDraft(previous))
  }

  const redo = () => {
    if (!draft || redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setRedoStack((history) => history.slice(0, -1))
    setUndoStack((history) => [...history, cloneCustomizeDraft(draft)].slice(-60))
    setDraft(cloneCustomizeDraft(next))
  }

  const validateBrandAsset = async (file: File, target: Exclude<UploadTarget, null>): Promise<string | null> => {
    const isVideo = file.type.startsWith("video/")
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"]
    if (isVideo && target !== "video") return "Use the Video upload area for videos."
    if (!isVideo && !allowedImageTypes.includes(file.type)) return "Use a JPG, PNG, WebP, GIF, or SVG image."
    if (file.size > (isVideo ? 100 : 10) * 1024 * 1024) return `${isVideo ? "Videos" : "Images"} must be smaller than ${isVideo ? "100" : "10"} MB.`
    if (isVideo || file.type === "image/svg+xml") return null

    const dimensions = await getImageDimensions(file)
    if (!dimensions) return null
    const ratio = dimensions.width / dimensions.height
    if (target === "logo" && (ratio < 0.8 || ratio > 1.25)) return "Tip: a square logo (1:1) stays sharp in every community surface."
    if ((target === "cover" || target === "hero") && (ratio < 1.5 || ratio > 2.1)) return "Tip: a wide 16:9 image gives the best hero result across desktop and mobile."
    return null
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

    const assetMessage = await validateBrandAsset(file, target)
    if (assetMessage?.startsWith("Use ") || assetMessage?.includes("must be") || assetMessage?.includes("only")) {
      toast({ title: "Choose another file", description: assetMessage, variant: "destructive" })
      return
    }
    if (assetMessage) toast({ title: "Asset guidance", description: assetMessage })

    setUploading(target)
    try {
      const asset = await mediaApi.uploadSmart(file, {
        purpose,
        entityType: "community",
        entityId: draft.id,
        visibility: "public",
      })
      setAssetLibrary((assets) => [asset, ...assets.filter((item) => item.assetId !== asset.assetId)])
      const url = asset.url
      patchDraft((next) => {
        if (target === "logo") {
          next.logo = url
          next.settings.logo = url
        }
        if (target === "favicon") next.settings.favicon = url
        if (target === "cover") {
          next.coverImage = url
          next.settings.heroBackground = url
          next.pageContent.hero.customBanner = url
        }
        if (target === "hero") {
          next.settings.heroBackground = url
          next.pageContent.hero.customBanner = url
        }
        if (target === "video") {
          next.settings.videoUrl = url
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

  const submitDomainRequest = async (request: { domain: string; businessName: string; contactEmail: string; purpose: string }) => {
    if (!draft?.id) return
    setSubmittingDomainRequest(true)
    try {
      await communitiesApi.submitCustomDomainRequest(draft.id, request)
      toast({ title: "Domain request submitted", description: "An administrator will verify and approve it before it becomes active." })
    } catch (error: any) {
      toast({ title: "Could not submit domain request", description: error?.message || "Please check the form and try again.", variant: "destructive" })
    } finally { setSubmittingDomainRequest(false) }
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
                brandReadiness={brandReadiness}
                publicHref={publicHref}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
                onUndo={undo}
                onRedo={redo}
                onReset={() => { if (savedDraft) { setDraft(cloneCustomizeDraft(savedDraft)); setUndoStack([]); setRedoStack([]) } }}
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
                      <BrandPanel draft={draft} patchDraft={patchDraft} onOpenMedia={() => setActiveTab("media")} />
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
                        assetLibrary={assetLibrary}
                        loadingAssetLibrary={loadingAssetLibrary}
                      />
                    </TabsContent>
                    <TabsContent value="access" className="mt-0">
                      <AccessPanel draft={draft} patchDraft={patchDraft} submittingDomainRequest={submittingDomainRequest} onSubmitDomainRequest={submitDomainRequest} />
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
  brandReadiness,
  publicHref,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onSave,
}: {
  draft: CommunityCustomizeDraft
  dirty: boolean
  saving: boolean
  validationErrors: string[]
  brandReadiness: { score: number; missing: string[] }
  publicHref: string
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
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
          <p className="mt-1 text-xs text-slate-600">
            Brand readiness: <span className="font-semibold text-slate-900">{brandReadiness.score}%</span>
            {brandReadiness.missing.length > 0 ? ` · Add ${brandReadiness.missing.slice(0, 2).join(" and ")}` : " · Ready to publish"}
          </p>
          {validationErrors.length > 0 && (
            <p className="mt-1 text-xs font-medium text-red-600">{validationErrors[0]}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo || saving} aria-label="Undo last change">
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo || saving} aria-label="Redo last change">
            <Redo2 className="h-4 w-4" />
            Redo
          </Button>
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
  onOpenMedia,
}: {
  draft: CommunityCustomizeDraft
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
  onOpenMedia: () => void
}) {
  return (
    <Panel title="Brand Studio" description="Everything visitors recognize: identity, visual language, typography, assets, and brand links. Changes are reflected in the live preview before you save.">
      <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-800">Brand essentials</span> are saved with your community settings. Use high-contrast colors and complete your logo, social links, and SEO title for a consistent public presence.
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="font-medium text-slate-900">Start from a design system</h4>
          <p className="text-xs text-slate-500">Choosing a template preserves your current content and settings. Reset visual style only if you want its recommended colors and type pairing.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {templatePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={cn("rounded-lg border p-3 text-left transition hover:border-slate-400", draft.settings.template === preset.id && "border-violet-500 ring-2 ring-violet-100")}
              onClick={() => patchDraft((next) => { next.settings.template = preset.id; return next })}
            >
              <span className="mb-3 flex h-8 overflow-hidden rounded-md">
                <span className="flex-1" style={{ backgroundColor: preset.primary }} />
                <span className="flex-1" style={{ backgroundColor: preset.secondary }} />
              </span>
              <span className="block text-sm font-semibold text-slate-900">{preset.name}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{preset.description}</span>
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => patchDraft((next) => {
            const preset = templatePresets.find((item) => item.id === next.settings.template) || templatePresets[0]
            next.settings.primaryColor = preset.primary
            next.settings.secondaryColor = preset.secondary
            next.settings.accentColor = preset.secondary
            next.settings.fontFamily = preset.font
            next.settings.headingFont = preset.font
            next.settings.bodyFont = preset.font
            return next
          })}
        >
          <RotateCcw className="h-4 w-4" />
          Reset visual style to this template
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="font-medium text-slate-900">Navigation & footer</h4>
          <p className="text-xs text-slate-500">Set the community-facing call to action and a short footer note for members and visitors.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Primary CTA label">
            <Input value={draft.settings.navigationCtaLabel} placeholder="Join the community" onChange={(event) => patchDraft((next) => { next.settings.navigationCtaLabel = event.target.value; return next })} />
          </Field>
          <Field label="Primary CTA URL" hint="Optional external destination. Leave empty to use the join flow.">
            <Input value={draft.settings.navigationCtaUrl} placeholder="https://..." onChange={(event) => patchDraft((next) => { next.settings.navigationCtaUrl = event.target.value; return next })} />
          </Field>
        </div>
        <Field label="Footer note">
          <Textarea value={draft.settings.footerText} rows={2} placeholder="Built for people who want to learn and grow together." onChange={(event) => patchDraft((next) => { next.settings.footerText = event.target.value; return next })} />
        </Field>
        <SwitchRow
          label="Use a sticky community header"
          description="Keeps the community identity and join action within reach while visitors explore the page."
          checked={draft.settings.stickyHeader}
          onCheckedChange={(checked) => patchDraft((next) => { next.settings.stickyHeader = checked; return next })}
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="font-medium text-slate-900">Brand assets</h4>
          <p className="text-xs text-slate-500">Upload every image or video from Media. Assets are saved to this community’s Brand Library and can be reused without copying links.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="col-span-full flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-600">Logo, cover, hero, favicon, gallery, and video are all managed by upload.</p>
            <Button type="button" size="sm" onClick={onOpenMedia}><Upload className="h-4 w-4" /> Open Media uploads</Button>
          </div>
          <Field label="Brand welcome message" hint="Used as supporting copy in the public benefits area.">
            <Input value={draft.settings.welcomeMessage} onChange={(event) => patchDraft((next) => { next.settings.welcomeMessage = event.target.value; return next })} />
          </Field>
          <Field label="Wordmark" hint="Optional short text displayed with your logo.">
            <Input value={draft.settings.wordmark} placeholder="Your brand name" onChange={(event) => patchDraft((next) => { next.settings.wordmark = event.target.value; return next })} />
          </Field>
          <Field label="Brand tagline">
            <Input value={draft.settings.tagline} placeholder="A memorable promise for your members" onChange={(event) => patchDraft((next) => { next.settings.tagline = event.target.value; return next })} />
          </Field>
        </div>
      </div>

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
        <ColorField
          label="Accent color"
          value={draft.settings.accentColor}
          onChange={(value) => patchDraft((next) => { next.settings.accentColor = value; return next })}
        />
        <ColorField
          label="Page text color"
          value={draft.settings.pageTextColor}
          onChange={(value) => patchDraft((next) => { next.settings.pageTextColor = value; return next })}
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

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="font-medium text-slate-900">Typography & visual style</h4>
          <p className="text-xs text-slate-500">The selected font, template, corner radius, and colors are applied to the public landing page.</p>
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
        <SelectField
          label="Heading font"
          value={draft.settings.headingFont}
          options={fontOptions.map((font) => [font, font])}
          onChange={(value) => patchDraft((next) => { next.settings.headingFont = value; return next })}
        />
        <SegmentedField
          label="Button shape"
          value={draft.settings.buttonStyle}
          options={[["rounded", "Rounded"], ["pill", "Pill"], ["square", "Square"]]}
          onChange={(value) => patchDraft((next) => { next.settings.buttonStyle = value as typeof next.settings.buttonStyle; return next })}
        />
      </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="font-medium text-slate-900">Social & brand links</h4>
          <p className="text-xs text-slate-500">Only filled links are shown on the public page. Use complete https:// URLs.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Object.entries(draft.settings.socialLinks).map(([key, value]) => (
            <Field key={key} label={`${key.charAt(0).toUpperCase()}${key.slice(1)} URL`}>
              <Input placeholder="https://..." value={value || ""} onChange={(event) => patchDraft((next) => { next.settings.socialLinks = { ...next.settings.socialLinks, [key]: event.target.value }; return next })} />
            </Field>
          ))}
        </div>
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
      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="font-medium text-slate-900">Community basics</h4>
          <p className="text-xs text-slate-500">These describe your community everywhere it appears. Visual identity is managed in the Brand tab.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Community name">
            <Input value={draft.name} onChange={(event) => patchDraft((next) => ({ ...next, name: event.target.value }))} />
          </Field>
          <Field label="Category">
            <Input value={draft.category} onChange={(event) => patchDraft((next) => ({ ...next, category: event.target.value }))} />
          </Field>
        </div>
        <Field label="Short description">
          <Textarea value={draft.description} onChange={(event) => patchDraft((next) => ({ ...next, description: event.target.value }))} rows={3} />
        </Field>
        <Field label="Long description">
          <Textarea value={draft.longDescription} onChange={(event) => patchDraft((next) => ({ ...next, longDescription: event.target.value }))} rows={5} />
        </Field>
        <TextListEditor title="Tags" values={draft.tags} placeholder="Add tag" onChange={(tags) => patchDraft((next) => ({ ...next, tags }))} />
      </div>

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
  assetLibrary,
  loadingAssetLibrary,
}: {
  draft: CommunityCustomizeDraft
  uploading: UploadTarget
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
  uploadAsset: (file: File, target: Exclude<UploadTarget, null>, purpose: MediaPurpose) => Promise<void>
  assetLibrary: MediaAsset[]
  loadingAssetLibrary: boolean
}) {
  return (
    <Panel title="Media" description="Upload your brand assets once, then reuse them across your community. No image links required.">
      <div className="grid gap-4 lg:grid-cols-2">
        <UploadField
          label="Logo"
          value={draft.logo}
          target="logo"
          purpose="community_logo"
          uploading={uploading}
          onUpload={uploadAsset}
        />
        <UploadField
          label="Favicon"
          value={draft.settings.favicon}
          target="favicon"
          purpose="community_logo"
          uploading={uploading}
          onUpload={uploadAsset}
          accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
        />
        <UploadField
          label="Cover image"
          value={draft.coverImage}
          target="cover"
          purpose="community_cover"
          uploading={uploading}
          onUpload={uploadAsset}
        />
        <UploadField
          label="Hero background"
          value={draft.pageContent.hero.customBanner || draft.settings.heroBackground}
          target="hero"
          purpose="community_cover"
          uploading={uploading}
          onUpload={uploadAsset}
        />
        <UploadField
          label="CTA background"
          value={draft.pageContent.cta.customBackground || ""}
          target="cta"
          purpose="generic"
          uploading={uploading}
          onUpload={uploadAsset}
        />
      </div>

      <UploadField label="Community video" value={draft.settings.videoUrl} target="video" purpose="generic" uploading={uploading} onUpload={uploadAsset} accept="video/*" />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Gallery</h4>
            <p className="text-xs text-slate-500">Upload images from your computer. They are saved to this community’s Brand Library.</p>
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
              <div className="mt-2 flex justify-end gap-2">
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
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="font-medium text-slate-900">Brand Library</h4>
          <p className="text-xs text-slate-500">Reuse assets uploaded to this community instead of copying URLs.</p>
        </div>
        {loadingAssetLibrary ? (
          <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading your assets…</div>
        ) : assetLibrary.filter((asset) => asset.mediaType === "image").length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assetLibrary.filter((asset) => asset.mediaType === "image").map((asset) => (
              <div key={asset.assetId} className="overflow-hidden rounded-lg border bg-white p-2">
                <img src={asset.url} alt="Uploaded brand asset" className="aspect-video w-full rounded-md object-cover" loading="lazy" />
                <div className="mt-2 grid grid-cols-3 gap-1">
                  <Button type="button" variant="outline" size="sm" className="px-1 text-[11px]" onClick={() => patchDraft((next) => { next.logo = asset.url; next.settings.logo = asset.url; return next })}>Logo</Button>
                  <Button type="button" variant="outline" size="sm" className="px-1 text-[11px]" onClick={() => patchDraft((next) => { next.coverImage = asset.url; next.settings.heroBackground = asset.url; next.pageContent.hero.customBanner = asset.url; return next })}>Hero</Button>
                  <Button type="button" variant="outline" size="sm" className="px-1 text-[11px]" onClick={() => patchDraft((next) => { if (!next.settings.gallery.includes(asset.url)) next.settings.gallery.push(asset.url); return next })}>Gallery</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Upload an image above to build your reusable brand library.</p>
        )}
      </div>

      <CustomSectionsEditor draft={draft} patchDraft={patchDraft} />
    </Panel>
  )
}

function AccessPanel({
  draft,
  patchDraft,
  submittingDomainRequest,
  onSubmitDomainRequest,
}: {
  draft: CommunityCustomizeDraft
  patchDraft: (updater: (current: CommunityCustomizeDraft) => CommunityCustomizeDraft) => void
  submittingDomainRequest: boolean
  onSubmitDomainRequest: (request: { domain: string; businessName: string; contactEmail: string; purpose: string }) => Promise<void>
}) {
  const [domain, setDomain] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [purpose, setPurpose] = useState("")
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

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <h4 className="font-medium text-slate-900">Sharing & search controls</h4>
          <p className="text-xs text-slate-500">These values are rendered as server-side metadata for reliable Google and social previews.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Open Graph image URL" hint="Use a 1.91:1 image for the best social preview.">
            <Input value={draft.settings.ogImage} placeholder="https://..." onChange={(event) => patchDraft((next) => { next.settings.ogImage = event.target.value; return next })} />
          </Field>
          <Field label="Canonical URL" hint="Optional: use only the final public HTTPS address.">
            <Input value={draft.settings.canonicalUrl} placeholder="https://your-domain.com" onChange={(event) => patchDraft((next) => { next.settings.canonicalUrl = event.target.value; return next })} />
          </Field>
        </div>
        <SwitchRow
          label="Hide this page from search engines"
          description="Useful for private launches and invite-only communities. Members can still open the page directly."
          checked={draft.settings.noIndex}
          onCheckedChange={(checked) => patchDraft((next) => { next.settings.noIndex = checked; return next })}
        />
      </div>

      <div className="space-y-4 rounded-lg border border-violet-200 bg-violet-50/40 p-4">
        <div><h4 className="font-medium text-slate-900">Custom domain request</h4><p className="text-xs text-slate-600">Domains are never activated automatically. Submit the ownership and contact details below; an admin reviews the request, then activates the domain after approval.</p></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Requested domain" hint="Example: community.yourbrand.com — no http:// or page path."><Input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="community.yourbrand.com" /></Field>
          <Field label="Business or organization name"><Input value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Your organization" /></Field>
          <Field label="Technical contact email"><Input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} placeholder="ops@yourbrand.com" /></Field>
          <Field label="Why this domain?" hint="Include DNS ownership or launch context."><Textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} rows={2} /></Field>
        </div>
        <Button type="button" disabled={submittingDomainRequest || !domain || !businessName || !contactEmail || !purpose} onClick={() => void onSubmitDomainRequest({ domain, businessName, contactEmail, purpose })}>{submittingDomainRequest ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit for admin review</Button>
      </div>

      <p className="text-xs text-slate-500">Social and website links are managed in Brand Studio.</p>

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
  const contrastOnWhite = valid ? getContrastRatio(value, "#ffffff") : 0
  const contrastOnBlack = valid ? getContrastRatio(value, "#111827") : 0
  const bestContrast = Math.max(contrastOnWhite, contrastOnBlack)
  const contrastHint = !valid
    ? "Use #RGB or #RRGGBB."
    : bestContrast >= 4.5
      ? `AA-ready contrast available (${bestContrast.toFixed(1)}:1 against ${contrastOnWhite >= contrastOnBlack ? "white" : "dark"} text).`
      : `Low contrast (${bestContrast.toFixed(1)}:1). Choose a darker or lighter color for readable buttons.`
  return (
    <Field label={label} hint={contrastHint}>
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
          <h4 className="text-sm font-semibold text-slate-900">Page sections</h4>
          <p className="text-xs text-slate-500">Safe, ordered blocks rendered on the public page. No arbitrary HTML, scripts, or components are allowed.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            patchDraft((next) => {
              next.settings.brandSections.push({
                id: makeCustomizeId("section"),
                type: "text",
                title: "",
                content: "",
                visible: true,
                order: next.settings.brandSections.length,
              })
              return next
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add section
        </Button>
      </div>

      {draft.settings.brandSections.map((section, index) => (
        <div
          key={String(section.id || index)}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move"
            event.dataTransfer.setData("text/plain", String(index))
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const from = Number(event.dataTransfer.getData("text/plain"))
            if (!Number.isInteger(from) || from === index) return
            patchDraft((next) => {
              const [moved] = next.settings.brandSections.splice(from, 1)
              next.settings.brandSections.splice(index, 0, moved)
              next.settings.brandSections = next.settings.brandSections.map((item, order) => ({ ...item, order }))
              return next
            })
          }}
          className="space-y-3 rounded-lg border bg-slate-50 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
              <GripVertical className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <SwitchRow
                label={section.title || `Section ${index + 1}`}
                checked={section.visible !== false}
                onCheckedChange={(checked) =>
                  patchDraft((next) => {
                    next.settings.brandSections[index] = { ...next.settings.brandSections[index], visible: checked }
                    return next
                  })
                }
              />
            </div>
            <div className="flex gap-1">
              <MoveButtons
                index={index}
                length={draft.settings.brandSections.length}
                onMove={(from, to) => patchDraft((next) => {
                  const [moved] = next.settings.brandSections.splice(from, 1)
                  next.settings.brandSections.splice(to, 0, moved)
                  next.settings.brandSections = next.settings.brandSections.map((item, order) => ({ ...item, order }))
                  return next
                })}
              />
              <IconButton
                label="Remove custom section"
                onClick={() =>
                  patchDraft((next) => {
                    next.settings.brandSections.splice(index, 1)
                    return next
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <SelectField
              label="Type"
              value={String(section.type || "text")}
              options={[
                ["text", "Text"],
                ["image", "Image"],
                ["video", "Video"],
                ["quote", "Quote"],
                ["stats", "Stats"],
                ["cta", "Call to action"],
                ["link", "Link"],
              ]}
              onChange={(value) =>
                patchDraft((next) => {
                  next.settings.brandSections[index] = { ...next.settings.brandSections[index], type: value as typeof next.settings.brandSections[number]["type"] }
                  return next
                })
              }
            />
            <Field label="Title">
              <Input
                value={String(section.title || "")}
                onChange={(event) =>
                  patchDraft((next) => {
                    next.settings.brandSections[index] = {
                      ...next.settings.brandSections[index],
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
              placeholder={
                section.type === "stats"
                  ? "12k: Members\n4.9: Average rating\n92%: Completion rate"
                  : section.type === "quote"
                    ? "The member quote to highlight."
                    : section.type === "image" || section.type === "video"
                      ? "Paste a public media URL."
                      : section.type === "link" || section.type === "cta"
                        ? "Paste an HTTPS destination URL (CTA can be left empty to open the join flow)."
                        : "Write the section copy shown to visitors."
              }
              onChange={(event) =>
                patchDraft((next) => {
                  next.settings.brandSections[index] = {
                    ...next.settings.brandSections[index],
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
  accept = "image/*",
}: {
  label: string
  value: string
  target: Exclude<UploadTarget, null>
  purpose: MediaPurpose
  uploading: UploadTarget
  onUpload: (file: File, target: Exclude<UploadTarget, null>, purpose: MediaPurpose) => Promise<void>
  accept?: string
}) {
  const isVideo = target === "video"
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
            accept={accept}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void onUpload(file, target, purpose)
              event.currentTarget.value = ""
            }}
          />
        </label>
      </div>
      {isVideo && resolved ? <video src={resolved} className="aspect-video w-full rounded-lg border bg-black object-contain" controls preload="metadata" /> : <MediaThumb url={resolved} alt={label} />}
      <p className="text-xs text-slate-500">{value ? "Uploaded and ready to use." : "Choose a file from your computer."}</p>
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
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
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
  const visibleCustomSections = (normalized.brandSections.length > 0 ? normalized.brandSections : normalized.customSections).filter((section) => {
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
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5" aria-label="Preview device">
            {(["desktop", "tablet", "mobile"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setDevice(value)} className={cn("rounded px-2 py-1 text-[11px] font-medium capitalize", device === value ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100")}>{value}</button>
            ))}
          </div>
          <Badge variant="outline" className="rounded-md">{normalized.template}</Badge>
        </div>
      </div>

      <div className="max-h-[calc(100vh-168px)] overflow-auto bg-slate-100 p-2">
      <div
        className={cn("mx-auto overflow-hidden bg-white transition-[max-width] duration-200", device === "desktop" ? "max-w-none" : device === "tablet" ? "max-w-[768px]" : "max-w-[390px]")}
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
      </div>
    </section>
  )
}

function getBrandReadiness(draft: CommunityCustomizeDraft): { score: number; missing: string[] } {
  const checks = [
    ["a logo", Boolean(draft.logo || draft.settings.logo)],
    ["a hero image", Boolean(draft.coverImage || draft.settings.heroBackground || draft.pageContent.hero.customBanner)],
    ["a public CTA", Boolean(draft.pageContent.hero.ctaButtonText.trim())],
    ["an SEO title", Boolean(draft.settings.metaTitle.trim())],
    ["an SEO description", Boolean(draft.settings.metaDescription.trim())],
    ["a branded color palette", isValidHexColor(draft.settings.primaryColor) && isValidHexColor(draft.settings.secondaryColor)],
  ] as const
  const missing = checks.filter(([, complete]) => !complete).map(([label]) => label)
  return { score: Math.round(((checks.length - missing.length) / checks.length) * 100), missing }
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
