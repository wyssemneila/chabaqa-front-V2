import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { getResourceIcon } from "@/lib/utils"

interface ResourceListProps {
  resources: any[]
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
  const pathname = parsed.pathname.toLowerCase()
  return DIRECT_VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext))
}

function getVideoPresentation(url: string): { kind: "direct"; src: string } | { kind: "embed"; src: string } | null {
  if (!url) return null

  const youtubeEmbed = getYoutubeEmbedUrl(url)
  if (youtubeEmbed) return { kind: "embed", src: youtubeEmbed }

  const vimeoEmbed = getVimeoEmbedUrl(url)
  if (vimeoEmbed) return { kind: "embed", src: vimeoEmbed }

  if (isDirectVideoUrl(url)) return { kind: "direct", src: url }

  return null
}

export default function ResourceList({ resources }: ResourceListProps) {
  return (
    <div className="space-y-3">
      {resources.map((resource, index) => {
        const IconComponent = getResourceIcon(resource.type)
        const title = resource.title || "Resource"
        const description = resource.description || ""
        const url = resource.url || ""
        const isVideoResource = resource.type === "video"
        const videoPresentation = isVideoResource ? getVideoPresentation(url) : null
        const key = resource.id || `${title}-${url}-${index}`

        if (isVideoResource) {
          return (
            <div key={key} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <IconComponent className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{title}</div>
                    {description && <div className="text-sm text-muted-foreground mt-1">{description}</div>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>

              {videoPresentation?.kind === "direct" && (
                <video src={videoPresentation.src} controls preload="metadata" className="w-full aspect-video rounded-md bg-black" />
              )}

              {videoPresentation?.kind === "embed" && (
                <iframe
                  src={videoPresentation.src}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full aspect-video rounded-md border"
                />
              )}

              {!videoPresentation && (
                <p className="text-xs text-muted-foreground">
                  Preview unavailable for this video URL. Use the external link button to open it.
                </p>
              )}
            </div>
          )
        }

        return (
          <div
            key={key}
            className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <IconComponent className="h-5 w-5 text-primary-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium">{title}</div>
              {description && <div className="text-sm text-muted-foreground">{description}</div>}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        )
      })}
    </div>
  )
}
