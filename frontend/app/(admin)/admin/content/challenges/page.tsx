"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { localizeHref, stripLocaleFromPath } from "@/lib/i18n/client"
import { adminApi } from "@/lib/api/admin-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Star,
  AlertCircle,
  Loader2,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Clock,
  Calendar
} from "lucide-react"
import { toast } from "sonner"

interface Challenge {
  id: string
  title: string
  description: string
  coverImage?: string
  status: string
  creator: { id: string; name: string; email: string }
  community: { id: string; name: string }
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
  createdAt: string
}

interface PaginatedChallenges {
  data: Challenge[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function ChallengesManagementPage() {
  const t = useTranslations("admin.content.challenges")
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const internalPath = stripLocaleFromPath(pathname)

  const [challenges, setChallenges] = useState<PaginatedChallenges | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")

  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = 20

  const fetchChallenges = useCallback(async () => {
    setLoading(true)
    try {
      const filters: any = { page, limit }
      if (searchTerm) filters.searchTerm = searchTerm
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter
      
      const response = await adminApi.content.getChallenges(filters)
      if (response.success) {
        setChallenges(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch challenges:", error)
      toast.error(t("fetchError"))
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm, statusFilter, t])

  useEffect(() => {
    fetchChallenges()
  }, [fetchChallenges])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchChallenges()
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    const params = new URLSearchParams(searchParams)
    if (value === "all") {
      params.delete("status")
    } else {
      params.set("status", value)
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleApprove = async (challengeId: string) => {
    try {
      await adminApi.content.approveChallenge(challengeId)
      toast.success(t("approveSuccess"))
      fetchChallenges()
    } catch (error) {
      toast.error(t("approveError"))
    }
  }

  const handleEndEarly = async (challengeId: string) => {
    try {
      await adminApi.content.endChallengeEarly(challengeId)
      toast.success(t("endSuccess"))
      fetchChallenges()
    } catch (error) {
      toast.error(t("endError"))
    }
  }

  const getStatusBadge = (status: string, challengeStatus: string) => {
    if (status === "pending") {
      return <Badge variant="outline" className="text-amber-600 border-amber-200">{t("status.pending")}</Badge>
    }
    if (status === "featured") {
      return <Badge className="bg-primary">{t("status.featured")}</Badge>
    }
    if (challengeStatus === "active") {
      return <Badge className="bg-emerald-500">{t("status.active")}</Badge>
    }
    if (challengeStatus === "ended") {
      return <Badge variant="secondary">{t("status.ended")}</Badge>
    }
    if (challengeStatus === "upcoming") {
      return <Badge variant="outline" className="text-blue-600">{t("status.upcoming")}</Badge>
    }
    return <Badge variant="secondary">{t("status.approved")}</Badge>
  }

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-green-100 text-green-800",
      intermediate: "bg-amber-100 text-amber-800",
      advanced: "bg-red-100 text-red-800",
    }
    return <Badge className={colors[difficulty] || "bg-gray-100"}>{t(`difficulty.${difficulty}`)}</Badge>
  }

  return (
    <div className="space-y-8">
      <div className="admin-section-header">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
        </div>
      </div>

      <Card className="admin-surface overflow-hidden rounded-3xl border-0 shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("filterByStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="pending">{t("status.pending")}</SelectItem>
                  <SelectItem value="approved">{t("status.approved")}</SelectItem>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="ended">{t("status.ended")}</SelectItem>
                  <SelectItem value="featured">{t("status.featured")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="admin-table-shell border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : challenges?.data.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">{t("noChallenges")}</h3>
              <p className="text-muted-foreground">{t("noChallengesDescription")}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.challenge")}</TableHead>
                    <TableHead>{t("table.creator")}</TableHead>
                    <TableHead>{t("table.dates")}</TableHead>
                    <TableHead>{t("table.participants")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="w-[100px]">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges?.data.map((challenge) => (
                    <TableRow key={challenge.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {challenge.coverImage && (
                            <img 
                              src={challenge.coverImage} 
                              alt={challenge.title}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <Link 
                              href={localizeHref(pathname, `/admin/content/challenges/${challenge.id}`)}
                              className="font-medium hover:underline"
                            >
                              {challenge.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              {getDifficultyBadge(challenge.difficulty)}
                              {challenge.isTeamChallenge && (
                                <Badge variant="outline" className="text-xs">{t("teamChallenge")}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{challenge.creator.name}</p>
                          <p className="text-muted-foreground">{challenge.community.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{new Date(challenge.startDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{new Date(challenge.endDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span>{challenge.participantCount} {t("participants")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-muted-foreground" />
                            <span>{challenge.submissionCount} {t("submissions")}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(challenge.status, challenge.challengeStatus)}
                          {challenge.prizeInfo && (
                            <Badge variant="outline" className="text-xs">{challenge.prizeInfo}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={localizeHref(pathname, `/admin/content/challenges/${challenge.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t("actions.view")}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={localizeHref(pathname, `/admin/content/challenges/${challenge.id}/submissions`)}>
                                <Trophy className="h-4 w-4 mr-2" />
                                {t("actions.viewSubmissions")}
                              </Link>
                            </DropdownMenuItem>
                            {challenge.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleApprove(challenge.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {t("actions.approve")}
                              </DropdownMenuItem>
                            )}
                            {challenge.challengeStatus === "active" && (
                              <DropdownMenuItem onClick={() => handleEndEarly(challenge.id)}>
                                <Clock className="h-4 w-4 mr-2" />
                                {t("actions.endEarly")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Star className="h-4 w-4 mr-2" />
                              {challenge.isFeatured ? t("actions.unfeature") : t("actions.feature")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {challenges && challenges.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t("showing")} {(page - 1) * limit + 1} - {Math.min(page * limit, challenges.total)} {t("of")} {challenges.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!challenges.hasPrevPage}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams)
                        params.set("page", (page - 1).toString())
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!challenges.hasNextPage}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams)
                        params.set("page", (page + 1).toString())
                        router.push(`${pathname}?${params.toString()}`)
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
