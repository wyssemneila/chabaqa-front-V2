"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, Palette, Type, Layout, Zap, Eye, Lock } from "lucide-react"
import { ImageUpload } from "@/app/(dashboard)/components/image-upload"
import { ColorPicker } from "@/app/(dashboard)/components/color-picker"
import { communitiesApi } from "@/lib/api/communities.api"
import type { UpdateCommunityData } from "@/lib/api/communities.api"
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import type { Community } from "@/lib/api/types"
import { isValidCustomDomain, normalizeCommunitySettings } from "@/lib/community-settings"
import { resolveImageUrl } from "@/lib/resolve-image-url"

type EditableCommunity = Community & {
  _id?: string
  settings: ReturnType<typeof normalizeCommunitySettings>
}

function resolveCommunityIdentifier(
  community: { id?: string; _id?: string; slug?: string } | null | undefined,
  fallbackSlug?: string,
): string {
  const value = community?.id || community?._id || community?.slug || fallbackSlug || ""
  return String(value).trim()
}

function isRouteNotFoundError(error: any): boolean {
  const statusCode = Number(error?.statusCode ?? error?.status ?? 0)
  const code = String(error?.code || error?.error?.code || "").toUpperCase()
  const nestedMessage =
    typeof error?.message === "string"
      ? error.message
      : typeof error?.message?.message === "string"
        ? error.message.message
        : typeof error?.error?.message === "string"
          ? error.error.message
          : ""

  return (
    statusCode === 404 ||
    code === "NOT_FOUND" ||
    /cannot\s+(patch|put)\s+/i.test(nestedMessage)
  )
}

function extractStatusCode(error: any): number {
  return Number(error?.statusCode ?? error?.status ?? 0)
}

function toOptionalTrimmedString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  return trimmed.slice(0, maxLength)
}

function toOptionalLongDescription(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value.trim().slice(0, 5000)
  }
  if (value && typeof value === "object") {
    const text =
      typeof (value as any).text === "string"
        ? (value as any).text
        : typeof (value as any).content === "string"
          ? (value as any).content
          : undefined
    if (text) {
      return text.trim().slice(0, 5000)
    }
  }
  return undefined
}

function toStringArray(value: unknown, maxItems: number, maxItemLength: number): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxItemLength))
}

function sanitizeSocialLinks(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined
  }

  const social = value as Record<string, unknown>
  const normalized = {
    twitter: toOptionalTrimmedString(social.twitter, 500),
    instagram: toOptionalTrimmedString(social.instagram, 500),
    linkedin: toOptionalTrimmedString(social.linkedin, 500),
    discord: toOptionalTrimmedString(social.discord, 500),
    behance: toOptionalTrimmedString(social.behance, 500),
    github: toOptionalTrimmedString(social.github, 500),
    facebook: toOptionalTrimmedString(social.facebook, 500),
    youtube: toOptionalTrimmedString(social.youtube, 500),
    tiktok: toOptionalTrimmedString(social.tiktok, 500),
    website: toOptionalTrimmedString(social.website, 500),
  }

  return Object.values(normalized).some(Boolean) ? normalized : undefined
}

function buildCustomizationPayload(community: EditableCommunity): UpdateCommunityData {
  const features = toStringArray(community.settings.features, 20, 160)
  const benefits = toStringArray(community.settings.benefits, 20, 220)
  const tags = toStringArray(community.tags, 20, 40)

  return {
    name: toOptionalTrimmedString(community.name, 100),
    description: toOptionalTrimmedString(community.description, 500),
    longDescription: toOptionalLongDescription(community.longDescription),
    category: toOptionalTrimmedString(community.category, 100),
    tags,
    coverImage: toOptionalTrimmedString(
      resolveImageUrl(community.coverImage) || community.coverImage,
      1000,
    ),
    logo: toOptionalTrimmedString(resolveImageUrl(community.logo) || community.logo, 1000),
    price:
      typeof community.price === "number" && Number.isFinite(community.price)
        ? Math.max(0, Math.min(1_000_000, community.price))
        : undefined,
    priceType:
      community.priceType === "free" ||
      community.priceType === "one-time" ||
      community.priceType === "monthly" ||
      community.priceType === "yearly"
        ? community.priceType
        : undefined,
    type:
      community.type === "community" ||
      community.type === "course" ||
      community.type === "challenge" ||
      community.type === "event" ||
      community.type === "oneToOne" ||
      community.type === "product"
        ? community.type
        : "community",
    settings: {
      primaryColor: toOptionalTrimmedString(community.settings.primaryColor, 7),
      secondaryColor: toOptionalTrimmedString(community.settings.secondaryColor, 7),
      welcomeMessage: toOptionalTrimmedString(community.settings.welcomeMessage, 1000),
      features,
      benefits,
      logo: toOptionalTrimmedString(
        resolveImageUrl(community.settings.logo) || community.settings.logo,
        1000,
      ),
      heroBackground: toOptionalTrimmedString(
        resolveImageUrl(community.settings.heroBackground) || community.settings.heroBackground,
        1000,
      ),
      headerStyle:
        community.settings.headerStyle === "default" ||
        community.settings.headerStyle === "centered" ||
        community.settings.headerStyle === "minimal"
          ? community.settings.headerStyle
          : "default",
      contentWidth:
        community.settings.contentWidth === "narrow" ||
        community.settings.contentWidth === "normal" ||
        community.settings.contentWidth === "wide" ||
        community.settings.contentWidth === "full"
          ? community.settings.contentWidth
          : "normal",
      showHero: Boolean(community.settings.showHero),
      showFeatures: Boolean(community.settings.showFeatures),
      showPosts: Boolean(community.settings.showPosts),
      showBenefits: Boolean(community.settings.showBenefits),
      showTestimonials: Boolean(community.settings.showTestimonials),
      showStats: Boolean(community.settings.showStats),
      customDomain: toOptionalTrimmedString(community.settings.customDomain, 253)?.toLowerCase(),
      headerScripts: toOptionalTrimmedString(community.settings.headerScripts, 10000),
      socialLinks: sanitizeSocialLinks(community.settings.socialLinks),
    },
  }
}

function extractValidationMessage(error: any): string | null {
  const details = error?.details || error?.message?.details || error?.error?.details
  if (!Array.isArray(details) || details.length === 0) {
    return null
  }
  const lines = details
    .map((item: any) => {
      const field = typeof item?.field === "string" ? item.field : "field"
      const messages = Array.isArray(item?.messages) ? item.messages.filter(Boolean) : []
      return messages.length > 0 ? `${field}: ${messages.join(", ")}` : null
    })
    .filter(Boolean)
  return lines.length > 0 ? lines.join(" | ") : null
}

export default function CustomizeCommunityPage() {
  const params = useParams()
  const router = useRouter()
  const [community, setCommunity] = useState<EditableCommunity | null>(null)
  const [activeTab, setActiveTab] = useState("design")
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customDomainStatus, setCustomDomainStatus] = useState<"idle" | "valid" | "invalid" | "taken">("idle")

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true)
        setError(null)
        const slug = params.slug as string
        if (!slug) {
          setError("Community slug not found")
          return
        }

        const response = await communitiesApi.getBySlug(slug)
        if (response && response.data) {
          const normalizedSettings = normalizeCommunitySettings(
            response.data.settings,
            response.data.name,
          )
          const fetchedCommunity = response.data as Community & { _id?: string }
          setCommunity({
            ...fetchedCommunity,
            id: resolveCommunityIdentifier(fetchedCommunity, slug),
            _id: fetchedCommunity._id || fetchedCommunity.id,
            coverImage: resolveImageUrl(fetchedCommunity.coverImage) || fetchedCommunity.coverImage,
            logo: resolveImageUrl(fetchedCommunity.logo) || fetchedCommunity.logo,
            settings: normalizedSettings,
          } as EditableCommunity)
          if (normalizedSettings.customDomain) {
            setCustomDomainStatus("valid")
          }
        } else {
          setError("Community not found")
        }
      } catch (err) {
        console.error("Error fetching community:", err)
        setError("Failed to load community. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchCommunity()
  }, [params.slug])

  const saveCommunityCustomization = async (): Promise<boolean> => {
    try {
      if (!community) {
        return false
      }
      if (customDomainStatus === "invalid") {
        setError("Please enter a valid custom domain before saving.")
        return false
      }
      const fallbackSlug = Array.isArray(params.slug) ? params.slug[0] : String(params.slug || "")
      const persistedIdentifier = resolveCommunityIdentifier(community, "")
      const communityIdentifier = fallbackSlug || persistedIdentifier
      if (!communityIdentifier) {
        setError("Community ID not found")
        return false
      }

      setIsSaving(true)
      setError(null)

      // Send only backend-allowed customization fields.
      const updateData = buildCustomizationPayload(community)

      let response
      try {
        response = await communitiesApi.update(
          communityIdentifier,
          updateData,
          persistedIdentifier && persistedIdentifier !== communityIdentifier ? persistedIdentifier : undefined,
        )
      } catch (primaryUpdateError) {
        // Backward compatibility fallback: some deployed APIs expose only settings update routes.
        if (!isRouteNotFoundError(primaryUpdateError)) {
          throw primaryUpdateError
        }

        const settingsIdentifierCandidates = Array.from(
          new Set(
            [communityIdentifier, persistedIdentifier]
              .map((value) => String(value || "").trim())
              .filter(Boolean),
          ),
        )

        let settingsSaved = false
        let settingsResponse: any = null
        let settingsError: any = null

        for (const candidate of settingsIdentifierCandidates) {
          try {
            settingsResponse = await communitiesApi.updateSettings(candidate, (updateData.settings || {}) as any)
            settingsSaved = true
            break
          } catch (fallbackError) {
            settingsError = fallbackError
          }
        }

        if (!settingsSaved || !settingsResponse?.data) {
          throw settingsError || primaryUpdateError
        }

        const normalizedFallbackSettings = normalizeCommunitySettings(
          settingsResponse.data as any,
          updateData.name || community.name,
        )

        setCommunity((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            name: updateData.name ?? prev.name,
            description: updateData.description ?? prev.description,
            longDescription: updateData.longDescription ?? prev.longDescription,
            category: updateData.category ?? prev.category,
            tags: updateData.tags ?? prev.tags,
            coverImage:
              (resolveImageUrl(updateData.coverImage) || updateData.coverImage || prev.coverImage) as string,
            logo: (resolveImageUrl(updateData.logo) || updateData.logo || prev.logo) as string,
            price: typeof updateData.price === "number" ? updateData.price : prev.price,
            priceType: (updateData.priceType || prev.priceType) as any,
            type: (updateData.type || prev.type) as any,
            settings: normalizedFallbackSettings,
          }
        })
        setCustomDomainStatus(normalizedFallbackSettings.customDomain ? "valid" : "idle")
        setHasChanges(false)
        return true
      }

      if (!response || !response.data) {
        setError("Failed to save changes. Please try again.")
        return false
      }

      const normalizedSettings = normalizeCommunitySettings(
        response.data.settings,
        response.data.name,
      )
      const updatedCommunity = response.data as Community & { _id?: string }
      setCommunity({
        ...updatedCommunity,
        id: resolveCommunityIdentifier(updatedCommunity, fallbackSlug),
        _id: updatedCommunity._id || updatedCommunity.id,
        coverImage: resolveImageUrl(updatedCommunity.coverImage) || updatedCommunity.coverImage,
        logo: resolveImageUrl(updatedCommunity.logo) || updatedCommunity.logo,
        settings: normalizedSettings,
      } as EditableCommunity)
      if (normalizedSettings.customDomain) {
        setCustomDomainStatus("valid")
      } else {
        setCustomDomainStatus("idle")
      }
      setHasChanges(false)
      console.log("Community updated successfully")
      return true
    } catch (err) {
      console.error("Error saving community:", err)
      const statusCode = extractStatusCode(err)
      const rawMessage = (err as any)?.message
      const validationMessage = extractValidationMessage(err)
      const message =
        statusCode === 401
          ? "Session expired. Please sign in again."
          : statusCode === 403
            ? "You are not allowed to edit this community."
            : statusCode === 404
              ? "Save route not available on server. Please redeploy backend."
            : statusCode === 400
                ? (validationMessage || (typeof rawMessage === "string" ? rawMessage : "Some fields are invalid. Please review and try again."))
                : (typeof rawMessage === "string" ? rawMessage : "Failed to save changes. Please try again.")
      setError(message)
      const normalizedMessage = String(message).toLowerCase()
      if (normalizedMessage.includes("domaine") || normalizedMessage.includes("domain")) {
        setCustomDomainStatus("taken")
      }
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    await saveCommunityCustomization()
  }

  const handlePreview = async () => {
    if (!community) {
      return
    }
    if (customDomainStatus === "invalid") {
      setError("Please enter a valid custom domain before previewing.")
      return
    }

    const fallbackSlug = Array.isArray(params.slug) ? params.slug[0] : String(params.slug || "")
    const previewSlug = community.slug || fallbackSlug
    if (!previewSlug) {
      setError("Community slug not found")
      return
    }

    setIsPreviewing(true)
    const previewUrl = `/community/${previewSlug}?preview=creator&t=${Date.now()}`
    let previewWindow: Window | null = null

    try {
      if (hasChanges) {
        previewWindow = window.open("", "_blank")
        if (previewWindow && previewWindow.document) {
          previewWindow.document.write(
            '<!doctype html><html><head><title>Opening preview...</title></head><body style="font-family:system-ui;padding:24px;">Opening community preview...</body></html>',
          )
          previewWindow.document.close()
        }
      }

      const saveSucceeded = hasChanges ? await saveCommunityCustomization() : true
      if (!saveSucceeded) {
        if (previewWindow && !previewWindow.closed) {
          previewWindow.close()
        }
        return
      }

      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.assign(previewUrl)
      } else {
        const opened = window.open(previewUrl, "_blank")
        if (!opened) {
          setError("Preview popup was blocked. Please allow popups and try again.")
        }
      }
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setCommunity((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value,
      }
    })
    setHasChanges(true)
  }

  const handleSettingsChange = <K extends keyof EditableCommunity["settings"]>(
    field: K,
    value: EditableCommunity["settings"][K],
  ) => {
    setCommunity((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        settings: {
          ...prev.settings,
          [field]: value,
        },
      }
    })
    if (field === "customDomain") {
      const nextDomain = String(value || "")
      if (!nextDomain) {
        setCustomDomainStatus("idle")
      } else if (isValidCustomDomain(nextDomain)) {
        setCustomDomainStatus("valid")
      } else {
        setCustomDomainStatus("invalid")
      }
    }
    setHasChanges(true)
  }

  const handleDomainChange = (value: string) => {
    const normalized = value.trim().toLowerCase()
    setCommunity((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        settings: {
          ...prev.settings,
          customDomain: normalized,
        },
      }
    })
    if (!normalized) {
      setCustomDomainStatus("idle")
    } else if (isValidCustomDomain(normalized)) {
      setCustomDomainStatus("valid")
    } else {
      setCustomDomainStatus("invalid")
    }
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Community not found"}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }




  return (

    <div className="space-y-8 p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customize {community.name}</h1>
            <p className="text-gray-600 mt-1">Personalize your community's appearance and settings</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={loading || isSaving || isPreviewing || customDomainStatus === "invalid"}
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>{isPreviewing ? "Opening..." : "Preview"}</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || customDomainStatus === "invalid" || loading || isSaving || isPreviewing}
              className="flex items-center space-x-2"
              style={{
                backgroundColor: hasChanges ? community.settings.primaryColor : undefined,
                opacity: hasChanges ? 1 : 0.5,
              }}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </Button>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div
          className="border rounded-lg p-4"
          style={{
            backgroundColor: `${community.settings.primaryColor}10`,
            borderColor: `${community.settings.primaryColor}30`,
          }}
        >
          <div className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: community.settings.primaryColor }}
            ></div>
            <p className="font-medium" style={{ color: community.settings.primaryColor }}>
              You have unsaved changes
            </p>
          </div>
        </div>
      )}

      <div className="w-full">
        {/* Customization Panel */}
        <div className="w-full">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b" style={{ borderColor: `${community.settings.primaryColor}20` }}>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" style={{ color: community.settings.primaryColor }} />
                <span>Customization Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-50 rounded-none border-b">
                  <TabsTrigger value="content" className="flex items-center space-x-2">
                    <Type className="w-4 h-4" />
                    <span>Content</span>
                  </TabsTrigger>
                  <TabsTrigger value="design" className="flex items-center space-x-2">
                    <Palette className="w-4 h-4" />
                    <span>Design</span>
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="flex items-center space-x-2">
                    <Layout className="w-4 h-4" />
                    <span>Layout</span>
                  </TabsTrigger>
                  <TabsTrigger value="advanced" className="flex items-center space-x-2">
                    <Zap className="w-4 h-4" />
                    <span>Advanced</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="design" className="p-6 sm:p-8 space-y-8">


                  {/* Color Customization */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Brand Colors</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Primary Color</Label>
                        <ColorPicker
                          color={community.settings.primaryColor}
                          onChange={(color) => handleSettingsChange("primaryColor", color)}
                        />
                        <p className="text-xs text-gray-500">Used for buttons, accents, and primary elements</p>
                      </div>
                      <div className="space-y-3">
                        <Label>Secondary Color</Label>
                        <ColorPicker
                          color={community.settings.secondaryColor}
                          onChange={(color) => handleSettingsChange("secondaryColor", color)}
                        />
                        <p className="text-xs text-gray-500">Used for gradients and secondary elements</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Images */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Images</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Cover Image</Label>
                        <ImageUpload
                          currentImage={community.coverImage}
                          onImageChange={(image) => handleInputChange("coverImage", image)}
                          aspectRatio="wide"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label>Logo</Label>
                        <ImageUpload
                          currentImage={community.settings.logo}
                          onImageChange={(image) => handleSettingsChange("logo", image)}
                          aspectRatio="square"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="p-6 sm:p-8 space-y-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Basic Information</Label>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Community Name</Label>
                        <Input
                          id="name"
                          value={community.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Short Description</Label>
                        <Input
                          id="description"
                          value={community.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longDescription">Long Description</Label>
                        <Textarea
                          id="longDescription"
                          value={community.longDescription || ''}
                          onChange={(e) => handleInputChange("longDescription", e.target.value)}
                          rows={4}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          value={community.category || ''}
                          onChange={(e) => handleInputChange("category", e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Tags */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {(community.tags || []).map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-2 pl-3 pr-1">
                          {tag}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={() => {
                              const newTags = [...(community.tags || [])]
                              newTags.splice(index, 1)
                              handleInputChange("tags", newTags)
                            }}
                          >
                            &times;
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="newTagInput"
                        placeholder="Add a tag and press Enter"
                        onKeyDown={(e) => {
                          const nextTag = e.currentTarget.value.trim()
                          if (e.key === "Enter" && nextTag) {
                            e.preventDefault()
                            const newTags = [...(community.tags || []), nextTag]
                            handleInputChange("tags", newTags)
                            e.currentTarget.value = ""
                          }
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Welcome Message */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Welcome Message</Label>
                    <Textarea
                      value={community.settings.welcomeMessage}
                      onChange={(e) => handleSettingsChange("welcomeMessage", e.target.value)}
                      rows={3}
                      placeholder="Welcome new members with a personalized message..."
                    />
                  </div>

                  <Separator />

                  {/* Features */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Community Features</Label>
                    <div className="space-y-3">
                      {(community.settings.features || []).map((feature: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Input
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...(community.settings.features || [])]
                              newFeatures[index] = e.target.value
                              handleSettingsChange("features", newFeatures)
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newFeatures = (community.settings.features || []).filter(
                                (_: any, i: number) => i !== index,
                              )
                              handleSettingsChange("features", newFeatures)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const currentFeatures = (community.settings.features || [])
                            .filter((item) => typeof item === "string")
                            .map((item) => item.trim())
                            .filter(Boolean)
                          if (currentFeatures.length >= 20) {
                            return
                          }
                          const newFeatures = [...currentFeatures, "New Feature"]
                          handleSettingsChange("features", newFeatures)
                        }}
                        style={{
                          borderColor: community.settings.primaryColor,
                          color: community.settings.primaryColor,
                        }}
                      >
                        Add Feature
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Benefits */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Member Benefits</Label>
                    <div className="space-y-3">
                      {(community.settings.benefits || []).map((benefit: string, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Textarea
                            value={benefit}
                            onChange={(e) => {
                              const newBenefits = [...(community.settings.benefits || [])]
                              newBenefits[index] = e.target.value
                              handleSettingsChange("benefits", newBenefits)
                            }}
                            rows={2}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newBenefits = (community.settings.benefits || []).filter(
                                (_: any, i: number) => i !== index,
                              )
                              handleSettingsChange("benefits", newBenefits)
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const currentBenefits = (community.settings.benefits || [])
                            .filter((item) => typeof item === "string")
                            .map((item) => item.trim())
                            .filter(Boolean)
                          if (currentBenefits.length >= 20) {
                            return
                          }
                          const newBenefits = [...currentBenefits, "New benefit for members"]
                          handleSettingsChange("benefits", newBenefits)
                        }}
                        style={{
                          borderColor: community.settings.primaryColor,
                          color: community.settings.primaryColor,
                        }}
                      >
                        Add Benefit
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="p-6 sm:p-8 space-y-8">
                  {/* Section Toggles */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Page Sections</Label>
                    <div className="space-y-4">
                      {([
                        { key: "showHero", label: "Hero Section", description: "Main banner with community info" },
                        {
                          key: "showFeatures",
                          label: "Features Section",
                          description: "Highlight community features",
                        },
                        { key: "showPosts", label: "Posts Section", description: "Recent community updates" },
                        { key: "showBenefits", label: "Benefits Section", description: "Member benefits and perks" },
                        { key: "showTestimonials", label: "Testimonials", description: "Member success stories" },
                        { key: "showStats", label: "Statistics", description: "Community metrics and numbers" },
                      ] as const).map((section) => (
                        <div
                          key={section.key}
                          className="flex items-center justify-between p-4 border rounded-lg"
                          style={{ borderColor: `${community.settings.primaryColor}20` }}
                        >
                          <div>
                            <Label className="font-medium">{section.label}</Label>
                            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                          </div>
                          <Switch
                            checked={community.settings[section.key] !== false}
                            onCheckedChange={(checked) => handleSettingsChange(section.key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Layout Options */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Layout Options</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Header Style</Label>
                        <select
                          value={community.settings.headerStyle || "default"}
                          onChange={(e) =>
                            handleSettingsChange(
                              "headerStyle",
                              e.target.value as "default" | "centered" | "minimal",
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="default">Default</option>
                          <option value="centered">Centered</option>
                          <option value="minimal">Minimal</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <Label>Content Width</Label>
                        <select
                          value={community.settings.contentWidth || "normal"}
                          onChange={(e) =>
                            handleSettingsChange(
                              "contentWidth",
                              e.target.value as "narrow" | "normal" | "wide" | "full",
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="narrow">Narrow</option>
                          <option value="normal">Normal</option>
                          <option value="wide">Wide</option>
                          <option value="full">Full Width</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="p-6 sm:p-8 space-y-8">
                  {/* Pricing */}
                  <div className="space-y-6">
                    <Label className="text-lg font-semibold">Pricing</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          type="number"
                          value={community.price || 0}
                          onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priceType">Price Type</Label>
                        <Select
                          value={community.priceType || "free"}
                          onValueChange={(value) => handleInputChange("priceType", value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select price type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="one-time">One-time</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Community Type */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Community Type</Label>
                    <Select
                      value={community.type || "community"}
                      onValueChange={(value) => handleInputChange("type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="course">Course</SelectItem>
                        <SelectItem value="challenge">Challenge</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="oneToOne">One-to-One</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Other Advanced Settings from original file would go here */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Label className="text-lg font-semibold">Custom Domain</Label>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--p)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--p)]">
                        <Lock className="h-3 w-3" />
                        Pro feature
                      </span>
                    </div>
                    <div className="relative space-y-2">
                      <div className="pointer-events-none select-none opacity-50">
                        <Label htmlFor="customDomain">Domain Name</Label>
                        <Input
                          id="customDomain"
                          placeholder="e.g., community.yourdomain.com"
                          value=""
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/70 backdrop-blur-[2px]">
                        <Lock className="h-5 w-5 text-[var(--p)]" />
                        <p className="text-sm font-medium text-[var(--t1)]">Upgrade to Pro to use a custom domain</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Label className="text-lg font-semibold">Custom Scripts</Label>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--p)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--p)]">
                        <Lock className="h-3 w-3" />
                        Pro feature
                      </span>
                    </div>
                    <div className="relative space-y-2">
                      <div className="pointer-events-none select-none opacity-50">
                        <Label htmlFor="headerScripts">Header Scripts</Label>
                        <Textarea
                          id="headerScripts"
                          rows={4}
                          placeholder="<script>...</script>"
                          value=""
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/70 backdrop-blur-[2px]">
                        <Lock className="h-5 w-5 text-[var(--p)]" />
                        <p className="text-sm font-medium text-[var(--t1)]">Upgrade to Pro to add custom scripts</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>



  )
}
