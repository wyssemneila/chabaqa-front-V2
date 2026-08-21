"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { adminApi } from "@/lib/api/admin-api"
import { localizeHref } from "@/lib/i18n/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Award, CheckCircle, ChevronLeft, ChevronRight, Loader2, Trophy, XCircle } from "lucide-react"
import { toast } from "sonner"

interface Submission {
  id: string
  user: { name: string; email: string; avatar?: string }
  content: string
  attachments?: string[]
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  feedback?: string
  isWinner: boolean
  points: number
}

interface SubmissionPage {
  data: Submission[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function ChallengeSubmissionsPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const challengeId = params.id as string
  const page = Number(searchParams.get("page") || 1)
  const status = searchParams.get("status") || "all"
  const limit = 20

  const [submissions, setSubmissions] = useState<SubmissionPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const filters: Record<string, unknown> = { page, limit }
      if (status !== "all") filters.status = status
      const response = await adminApi.content.getChallengeSubmissions(challengeId, filters)
      if (response.success) setSubmissions(response.data)
    } catch (error) {
      toast.error("Failed to load submissions.")
    } finally {
      setLoading(false)
    }
  }, [challengeId, page, status])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const updateStatusFilter = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value === "all") params.delete("status")
    else params.set("status", value)
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const changePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(nextPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  const approve = async (submission: Submission, markAsWinner = false) => {
    try {
      await adminApi.content.approveSubmission(submission.id, feedback[submission.id], markAsWinner)
      toast.success(markAsWinner ? "Submission approved as winner." : "Submission approved.")
      fetchSubmissions()
    } catch {
      toast.error("Failed to approve submission.")
    }
  }

  const reject = async (submission: Submission) => {
    const reason = feedback[submission.id]?.trim()
    if (!reason) {
      toast.error("Add feedback or a rejection reason first.")
      return
    }
    try {
      await adminApi.content.rejectSubmission(submission.id, reason, reason)
      toast.success("Submission rejected.")
      fetchSubmissions()
    } catch {
      toast.error("Failed to reject submission.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="admin-section-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={localizeHref(pathname, `/admin/content/challenges/${challengeId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Challenge submissions</h1>
            <p className="text-muted-foreground mt-2">Review participant work, approve winners, and leave feedback.</p>
          </div>
        </div>
        <Select value={status} onValueChange={updateStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="admin-surface border-0 shadow-none">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : submissions?.data.length === 0 ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <Trophy className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No submissions found.</p>
            </div>
          ) : (
            <div className="divide-y">
              {submissions?.data.map((submission) => (
                <div key={submission.id} className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={submission.user.avatar} />
                        <AvatarFallback>{submission.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{submission.user.name}</p>
                        <p className="text-sm text-muted-foreground">{submission.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {submission.isWinner && <Badge className="bg-amber-500"><Award className="mr-1 h-3 w-3" /> Winner</Badge>}
                      <Badge variant={submission.status === "rejected" ? "destructive" : submission.status === "approved" ? "default" : "outline"}>
                        {submission.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{submission.content}</p>
                  {submission.attachments && submission.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {submission.attachments.map((attachment) => (
                        <a key={attachment} href={attachment} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                          Attachment
                        </a>
                      ))}
                    </div>
                  )}
                  <Textarea
                    value={feedback[submission.id] || submission.feedback || ""}
                    onChange={(event) => setFeedback((current) => ({ ...current, [submission.id]: event.target.value }))}
                    placeholder="Feedback or rejection reason..."
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => approve(submission)}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => approve(submission, true)}>
                      <Award className="mr-2 h-4 w-4" /> Approve as winner
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => reject(submission)}>
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {submissions && submissions.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{submissions.total} submissions</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!submissions.hasPrevPage} onClick={() => changePage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={!submissions.hasNextPage} onClick={() => changePage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
