"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Trophy, 
  Calendar, 
  MessageSquare, 
  ArrowRight,
  Loader2,
  FileText
} from "lucide-react"

interface StatsBase {
  total: number
  featured: number
}

interface PendingStats extends StatsBase {
  pending: number
}

interface HiddenStats extends StatsBase {
  hidden: number
}

interface ContentSummary {
  courses: PendingStats
  challenges: PendingStats & { active: number }
  events: PendingStats & { upcoming: number }
  posts: HiddenStats
}

type ContentCard = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  stats: PendingStats | HiddenStats | null | undefined
  color: string
  borderColor: string
}

export default function ContentManagementPage() {
  const t = useTranslations("admin.content")
  const pathname = usePathname()
  const internalPath = stripLocaleFromPath(pathname)
  const [summary, setSummary] = useState<ContentSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await adminApi.content.getSummary()
        if (response.success) {
          setSummary(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch content summary:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const contentCards = [
    {
      title: t("courses.title"),
      description: t("courses.description"),
      icon: BookOpen,
      href: "/admin/content/courses",
      stats: summary?.courses,
      color: "bg-blue-500/10 text-blue-600",
      borderColor: "border-blue-500/20",
    },
    {
      title: t("challenges.title"),
      description: t("challenges.description"),
      icon: Trophy,
      href: "/admin/content/challenges",
      stats: summary?.challenges,
      color: "bg-amber-500/10 text-amber-600",
      borderColor: "border-amber-500/20",
    },
    {
      title: t("events.title"),
      description: t("events.description"),
      icon: Calendar,
      href: "/admin/content/events",
      stats: summary?.events,
      color: "bg-emerald-500/10 text-emerald-600",
      borderColor: "border-emerald-500/20",
    },
    {
      title: t("posts.title"),
      description: t("posts.description"),
      icon: MessageSquare,
      href: "/admin/content/posts",
      stats: summary?.posts,
      color: "bg-purple-500/10 text-purple-600",
      borderColor: "border-purple-500/20",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {contentCards.map((card) => {
          const Icon = card.icon
          return (
            <Card 
              key={card.title} 
              className={`admin-surface overflow-hidden rounded-3xl border-0 shadow-none hover:shadow-lg transition-shadow cursor-pointer ${card.borderColor}`}
            >
              <Link href={localizeHref(pathname, card.href)}>
                <CardHeader className="pb-4 px-6 pt-6">
                  <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        {card.stats?.total || 0} {t("total")}
                      </Badge>
                      {card.stats && 'pending' in card.stats && card.stats.pending > 0 && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          {card.stats.pending} {t("pending")}
                        </Badge>
                      )}
                      {card.stats && 'hidden' in card.stats && card.stats.hidden > 0 && (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          {card.stats.hidden} {t("hidden")}
                        </Badge>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>

      <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>{t("quickActions.title")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href={localizeHref(pathname, "/admin/content/courses?status=pending")}>
                {t("quickActions.reviewCourses")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={localizeHref(pathname, "/admin/content/challenges")}>
                {t("quickActions.manageChallenges")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={localizeHref(pathname, "/admin/content/events?startDateAfter=today")}>
                {t("quickActions.upcomingEvents")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={localizeHref(pathname, "/admin/content/posts")}>
                {t("quickActions.moderatePosts")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
