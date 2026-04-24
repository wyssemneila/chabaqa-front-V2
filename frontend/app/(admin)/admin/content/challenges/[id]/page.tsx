"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  CheckCircle, 
  Calendar,
  Loader2,
  Target,
  Award,
  Clock,
  Hash,
  FileText,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"

interface Challenge {
  id: string
  title: string
  description: string
  coverImage?: string
  status: string
  creator: { id: string; name: string; email: string; avatar?: string }
  community: { id: string; name: string; slug: string }
  startDate: string
  endDate: string
  participantCount: number
  submissionCount: number
  prizeInfo?: string
  challengeStatus: 'upcoming' | 'active' | 'ended'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  maxParticipants?: number
  isTeamChallenge: boolean
  isFeatured: boolean
  rules: string
  evaluationCriteria?: string[]
  tasks: Array<{
    id: string
    day: number
    title: string
    description: string
    deliverable: string
    points: number
    isActive: boolean
  }>
  resources: Array<{
    id: string
    title: string
    type: string
    url: string
  }>
  prizes?: Array<{
    position: number
    description: string
    value?: string
  }>
  hashtags?: string[]
  createdAt: string
}

export default function ChallengeDetailPage() {
  const t = useTranslations("admin.content.challenges.detail")
  const params = useParams()
  const pathname = usePathname()
  const challengeId = params.id as string
  const internalPath = stripLocaleFromPath(pathname)

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        const response = await adminApi.content.getChallengeById(challengeId)
        if (response.success) {
          setChallenge(response.data)
        }
      } catch (error) {
        console.error("Failed to fetch challenge:", error)
        toast.error(t("fetchError"))
      } finally {
        setLoading(false)
      }
    }

    fetchChallenge()
  }, [challengeId, t])

  const handleApprove = async () => {
    try {
      await adminApi.content.approveChallenge(challengeId)
      toast.success(t("approveSuccess"))
      const response = await adminApi.content.getChallengeById(challengeId)
      if (response.success) setChallenge(response.data)
    } catch (error) {
      toast.error(t("approveError"))
    }
  }

  const handleEndEarly = async () => {
    try {
      await adminApi.content.endChallengeEarly(challengeId)
      toast.success(t("endSuccess"))
      const response = await adminApi.content.getChallengeById(challengeId)
      if (response.success) setChallenge(response.data)
    } catch (error) {
      toast.error(t("endError"))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
        <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">{t("notFound")}</h3>
        <p className="text-muted-foreground">{t("notFoundDescription")}</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: "bg-blue-500",
      active: "bg-emerald-500",
      ended: "bg-gray-500",
    }
    return colors[status] || "bg-gray-500"
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-amber-100 text-amber-800",
      advanced: "bg-red-100 text-red-800",
    }
    return colors[difficulty] || "bg-gray-100"
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={localizeHref(pathname, "/admin/content/challenges")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{challenge.title}</h1>
            <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {challenge.status === "pending" && (
            <Button onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("actions.approve")}
            </Button>
          )}
          {challenge.challengeStatus === "active" && (
            <Button variant="outline" onClick={handleEndEarly}>
              <Clock className="h-4 w-4 mr-2" />
              {t("actions.endEarly")}
            </Button>
          )}
          <Button asChild>
            <Link href={localizeHref(pathname, `/admin/content/challenges/${challengeId}/submissions`)}>
              <Trophy className="h-4 w-4 mr-2" />
              {t("actions.viewSubmissions")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            {challenge.coverImage && (
              <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                <img 
                  src={challenge.coverImage} 
                  alt={challenge.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {t(`difficulty.${challenge.difficulty}`)}
                </Badge>
                <Badge className={getStatusColor(challenge.challengeStatus)}>
                  {t(`status.${challenge.challengeStatus}`)}
                </Badge>
                {challenge.isTeamChallenge && (
                  <Badge variant="outline">{t("teamChallenge")}</Badge>
                )}
                {challenge.isFeatured && (
                  <Badge className="bg-primary">{t("featured")}</Badge>
                )}
              </div>
              <CardTitle>{t("overview.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{challenge.description}</p>
              
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("overview.startDate")}</p>
                    <p className="font-medium">{new Date(challenge.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("overview.endDate")}</p>
                    <p className="font-medium">{new Date(challenge.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("overview.participants")}</p>
                    <p className="font-medium">{challenge.participantCount}</p>
                    {challenge.maxParticipants && (
                      <p className="text-xs text-muted-foreground">/ {challenge.maxParticipants} {t("overview.max")}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("overview.submissions")}</p>
                    <p className="font-medium">{challenge.submissionCount}</p>
                  </div>
                </div>
              </div>

              {challenge.prizeInfo && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">{t("overview.prizes")}: {challenge.prizeInfo}</span>
                  </div>
                </>
              )}

              {challenge.hashtags && challenge.hashtags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{t("overview.hashtags")}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {challenge.hashtags.map((tag, index) => (
                        <Badge key={index} variant="outline">#{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="tasks" className="w-full">
            <TabsList>
              <TabsTrigger value="tasks">{t("tabs.tasks")}</TabsTrigger>
              <TabsTrigger value="rules">{t("tabs.rules")}</TabsTrigger>
              <TabsTrigger value="prizes">{t("tabs.prizes")}</TabsTrigger>
              <TabsTrigger value="resources">{t("tabs.resources")}</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("tasks.title")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {challenge.tasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">{t("tasks.day")} {task.day}</Badge>
                        <div className="flex-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-muted-foreground" />
                              {task.deliverable}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="h-4 w-4 text-amber-500" />
                              {task.points} {t("tasks.points")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rules">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("rules.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line">{challenge.rules}</p>
                  {challenge.evaluationCriteria && challenge.evaluationCriteria.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <h4 className="font-medium mb-2">{t("rules.evaluationCriteria")}</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {challenge.evaluationCriteria.map((criteria, index) => (
                          <li key={index}>{criteria}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="prizes">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("prizes.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {challenge.prizes && challenge.prizes.length > 0 ? (
                    <div className="space-y-3">
                      {challenge.prizes.map((prize) => (
                        <div key={prize.position} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="font-bold text-amber-600">#{prize.position}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{prize.description}</p>
                            {prize.value && (
                              <p className="text-sm text-muted-foreground">{t("prizes.value")}: {prize.value}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">{t("prizes.empty")}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="resources">
              <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
                <CardHeader>
                  <CardTitle>{t("resources.title")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {challenge.resources.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">{t("resources.empty")}</p>
                  ) : (
                    <div className="space-y-2">
                      {challenge.resources.map((resource) => (
                        <a 
                          key={resource.id} 
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{resource.title}</p>
                            <p className="text-sm text-muted-foreground uppercase">{resource.type}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("creator.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {challenge.creator.avatar ? (
                  <img 
                    src={challenge.creator.avatar} 
                    alt={challenge.creator.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {challenge.creator.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium">{challenge.creator.name}</p>
                  <p className="text-sm text-muted-foreground">{challenge.creator.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
            <CardHeader>
              <CardTitle>{t("community.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{challenge.community.name}</p>
                  <Link 
                    href={localizeHref(pathname, `/admin/communities/${challenge.community.id}`)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t("community.viewCommunity")}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" asChild>
            <Link href={localizeHref(pathname, `/admin/content/challenges/${challengeId}/submissions`)}>
              <Trophy className="h-4 w-4 mr-2" />
              {t("viewSubmissions")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
