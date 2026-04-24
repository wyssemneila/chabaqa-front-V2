import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MessageSquareQuote, Tag } from "lucide-react"
import type { CommunityThemeTokens } from "@/lib/community-theme"
import { cn } from "@/lib/utils"

interface CommunityContentSectionProps {
  community: {
    name: string
    description?: string
    longDescription?: string
    category?: string
    tags?: string[]
  }
  welcomeMessage?: string
  contentWidthClass?: string
  themeTokens?: CommunityThemeTokens
}

export function CommunityContentSection({
  community,
  welcomeMessage,
  contentWidthClass = "max-w-7xl",
  themeTokens,
}: CommunityContentSectionProps) {
  const description = community.longDescription || community.description || ""
  const tags = Array.isArray(community.tags)
    ? community.tags.filter((tag) => typeof tag === "string" && tag.trim() !== "")
    : []
  const hasCategory = Boolean(community.category && community.category.trim() !== "")
  const hasWelcome = Boolean(welcomeMessage && welcomeMessage.trim() !== "")
  const hasDetails = Boolean(description || hasCategory || tags.length > 0 || hasWelcome)

  if (!hasDetails) {
    return null
  }

  return (
    <section className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12", contentWidthClass)}>
      <Card
        className="overflow-hidden rounded-2xl border shadow-sm"
        style={{
          borderColor: themeTokens?.mutedBorder || undefined,
          background:
            themeTokens?.softPrimary && themeTokens?.softSecondary
              ? `linear-gradient(135deg, ${themeTokens.softPrimary} 0%, #ffffff 48%, ${themeTokens.softSecondary} 100%)`
              : undefined,
        }}
      >
        <div className="space-y-6 p-5 sm:p-7 lg:p-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl lg:text-3xl">
              About {community.name}
            </h2>
            {description && (
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base break-words [overflow-wrap:anywhere]">
                {description}
              </p>
            )}
          </div>

          {hasWelcome && (
            <div
              className="rounded-xl border bg-white/90 p-4 backdrop-blur-[1px] sm:p-5"
              style={{
                borderColor: themeTokens?.mutedBorder || undefined,
              }}
            >
              <div className="flex items-start gap-3">
                <MessageSquareQuote
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  style={{ color: themeTokens?.primary || "#8e78fb" }}
                />
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Welcome Message</p>
                  <p className="mt-1 text-sm sm:text-base text-gray-700 break-words [overflow-wrap:anywhere]">
                    {welcomeMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {hasCategory && (
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs sm:text-sm font-medium"
                style={{ borderColor: themeTokens?.mutedBorder || undefined }}
              >
                Category: {community.category}
              </Badge>
            )}
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="px-3 py-1 text-xs sm:text-sm font-medium flex items-center gap-1.5"
                style={{ backgroundColor: "#ffffff", border: `1px solid ${themeTokens?.mutedBorder || "#e5e7eb"}` }}
              >
                <Tag className="w-3.5 h-3.5" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </section>
  )
}
