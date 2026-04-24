import { useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Upload } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { getResourceIcon } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { mediaApi } from "@/lib/api/media.api"

interface ChallengeResourceCardProps {
  resource: {
    id: string
    title: string
    type: "video" | "article" | "code" | "tool"
    url: string
    description: string
  }
  resIndex: number
  stepIndex: number
  updateResource: (resourceIndex: number, field: string, value: any) => void
  removeResource: (resourceIndex: number) => void
  getError?: (field: "title" | "type" | "url") => string | undefined
}

function ensureAbsoluteUploadUrl(value: unknown): string {
  const raw = typeof value === "string" ? value.trim() : ""
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) return raw

  const configured = process.env.NEXT_PUBLIC_API_URL || ""
  const inferredOrigin = configured ? configured.replace(/\/api$/, "") : ""
  const origin =
    inferredOrigin && !/^https?:\/\/localhost(:\d+)?$/i.test(inferredOrigin)
      ? inferredOrigin
      : "https://api.chabaqa.io"

  if (raw.startsWith("/")) return `${origin}${raw}`
  return `${origin}/${raw}`
}

function deriveTitleFromFileName(filename: string): string {
  const withoutExt = filename.replace(/\.[^.]+$/, "")
  return withoutExt.replace(/[_-]+/g, " ").trim()
}

const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".m4v", ".mkv"]

function parseUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

function getYoutubeEmbedUrl(url: string): string | null {
  const parsed = parseUrl(url)
  if (!parsed) return null

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase()
  let id = ""

  if (host === "youtu.be") {
    id = parsed.pathname.split("/").filter(Boolean)[0] || ""
  } else if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (parsed.pathname === "/watch") {
      id = parsed.searchParams.get("v") || ""
    } else if (parsed.pathname.startsWith("/shorts/")) {
      id = parsed.pathname.split("/")[2] || ""
    } else if (parsed.pathname.startsWith("/embed/")) {
      id = parsed.pathname.split("/")[2] || ""
    }
  }

  return id ? `https://www.youtube.com/embed/${id}` : null
}

function getVimeoEmbedUrl(url: string): string | null {
  const parsed = parseUrl(url)
  if (!parsed) return null

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase()
  const pathParts = parsed.pathname.split("/").filter(Boolean)
  if (host === "vimeo.com") {
    const id = pathParts[0]
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null
  }

  if (host === "player.vimeo.com" && pathParts[0] === "video" && pathParts[1] && /^\d+$/.test(pathParts[1])) {
    return `https://player.vimeo.com/video/${pathParts[1]}`
  }

  return null
}

function isDirectVideoUrl(url: string): boolean {
  const parsed = parseUrl(url)
  if (!parsed) return false
  return DIRECT_VIDEO_EXTENSIONS.some((extension) => parsed.pathname.toLowerCase().endsWith(extension))
}

export function ChallengeResourceCard({
  resource,
  resIndex,
  stepIndex,
  updateResource,
  removeResource,
  getError
}: ChallengeResourceCardProps) {
  const { toast } = useToast()
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const IconComponent = getResourceIcon(resource.type)
  const youtubeEmbed = resource.type === "video" ? getYoutubeEmbedUrl(resource.url) : null
  const vimeoEmbed = resource.type === "video" ? getVimeoEmbedUrl(resource.url) : null
  const isDirectVideo = resource.type === "video" ? isDirectVideoUrl(resource.url) : false

  const uploadVideoResource = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Please select a valid video file.",
        variant: "destructive",
      })
      return
    }

    const maxSizeBytes = 500 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: "Maximum video size is 500MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingVideo(true)
    try {
      const result = await mediaApi.uploadSmart(file, {
        purpose: "challenge_video",
        entityType: "challenge_resource",
        entityId: resource.id,
        visibility: "public",
      })
      const uploadedUrl = ensureAbsoluteUploadUrl(result?.url)
      if (!uploadedUrl) {
        throw new Error("Upload did not return a usable URL.")
      }

      updateResource(resIndex, "url", uploadedUrl)
      if (!(resource.title || "").trim()) {
        updateResource(resIndex, "title", deriveTitleFromFileName(file.name))
      }

      toast({
        title: "Video uploaded",
        description: file.name,
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error?.message || "Unable to upload video. Try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingVideo(false)
      if (videoInputRef.current) {
        videoInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <IconComponent className="h-4 w-4 text-primary-500" />
          <Input
            placeholder="Resource Title"
            value={resource.title}
            onChange={(e) => updateResource(resIndex, "title", e.target.value)}
            className={`h-8 text-sm w-48 ${getError?.("title") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeResource(resIndex)}
          className="text-red-500 hover:text-red-700 h-8 w-8"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select
            value={resource.type}
            onValueChange={(value) => updateResource(resIndex, "type", value)}
          >
            <SelectTrigger className={`h-8 text-sm ${getError?.("type") ? "border-red-500" : ""}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="tool">Tool</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs">URL</Label>
            {resource.type === "video" && (
              <>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    void uploadVideoResource(file)
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={isUploadingVideo}
                  onClick={() => videoInputRef.current?.click()}
                >
                  {isUploadingVideo ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1" />
                  )}
                  {isUploadingVideo ? "Uploading..." : "Upload Video"}
                </Button>
              </>
            )}
          </div>
          <Input
            placeholder="https://example.com/resource"
            value={resource.url}
            onChange={(e) => updateResource(resIndex, "url", e.target.value)}
            className={`h-8 text-sm ${getError?.("url") ? "border-red-500 focus-visible:ring-red-500" : ""}`}
          />
          {resource.type === "video" && (
            <p className="text-[11px] text-muted-foreground">
              Upload a file or paste a public video URL.
            </p>
          )}
        </div>
      </div>
      {(getError?.("title") || getError?.("type") || getError?.("url")) && (
        <p className="mt-2 text-xs text-red-500">
          {getError?.("title") || getError?.("type") || getError?.("url")}
        </p>
      )}
      <div className="space-y-1 mt-3">
        <Label className="text-xs">Description</Label>
        <Textarea
          placeholder="Brief description of resource"
          value={resource.description}
          onChange={(e) => updateResource(resIndex, "description", e.target.value)}
          rows={1}
          className="text-sm"
        />
      </div>
      {resource.type === "video" && resource.url && (
        <div className="mt-3 rounded-md border bg-black overflow-hidden">
          {youtubeEmbed || vimeoEmbed ? (
            <iframe
              src={youtubeEmbed || vimeoEmbed || ""}
              title={resource.title || "Video resource preview"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full aspect-video border-0"
            />
          ) : isDirectVideo ? (
            <video
              src={resource.url}
              controls
              preload="metadata"
              className="w-full aspect-video bg-black"
            />
          ) : (
            <div className="p-3 text-xs text-muted-foreground bg-muted">
              Preview unavailable for this video URL. It will still be saved as a resource link.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
