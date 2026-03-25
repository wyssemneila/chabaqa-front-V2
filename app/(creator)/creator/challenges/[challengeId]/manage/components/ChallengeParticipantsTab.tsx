"use client"

import { useMemo, useState } from "react"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Trophy, Clock, MessageSquare, Wallet, ExternalLink, Image as ImageIcon, FileText } from "lucide-react"
import { apiClient } from "@/lib/api"
import { challengesApi } from "@/lib/api/challenges.api"
import { resolveImageUrl } from "@/lib/hooks/useUser"
import { toast } from "sonner"

interface Participant {
  id: string
  odId: string
  joinedAt: Date
  isActive: boolean
  progress: number
  totalPoints: number
  completedTasks: string[]
  lastActivityAt: Date
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

interface Props {
  participants: Participant[]
  challengeId: string
  onSubmissionReviewed?: () => Promise<void> | void
}

type ReviewStatus = "approved" | "rejected" | "feedback_required"

export default function ChallengeParticipantsTab({ participants, challengeId, onSubmissionReviewed }: Props) {
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { status: ReviewStatus; feedback: string }>>({})
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [eligibilityLoading, setEligibilityLoading] = useState(false)
  const [eligibility, setEligibility] = useState<any>(null)
  const [distributionInFlight, setDistributionInFlight] = useState(false)

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const loadSubmissions = async () => {
    try {
      setSubmissionsLoading(true)
      const response = await challengesApi.getAllSubmissions(challengeId)
      const data = (response as any)?.data || response
      setSubmissions(Array.isArray(data?.submissions) ? data.submissions : [])
    } catch (error) {
      console.error('Failed to load submissions:', error)
      toast.error("Failed to load submissions")
    } finally {
      setSubmissionsLoading(false)
    }
  }

  const loadEligibility = async () => {
    try {
      setEligibilityLoading(true)
      const response = await challengesApi.getRewardEligibility(challengeId)
      setEligibility((response as any)?.data || response)
    } catch (error) {
      console.error('Failed to load reward eligibility:', error)
      toast.error("Failed to load reward eligibility")
    } finally {
      setEligibilityLoading(false)
    }
  }

  const updateDraft = (submissionId: string, patch: Partial<{ status: ReviewStatus; feedback: string }>) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [submissionId]: {
        status: prev[submissionId]?.status || "approved",
        feedback: prev[submissionId]?.feedback || "",
        ...patch,
      },
    }))
  }

  const toReviewStatus = (status: any): ReviewStatus => {
    if (status === "approved" || status === "rejected" || status === "feedback_required") return status
    return "approved"
  }

  const buildDraft = (submission: any): { status: ReviewStatus; feedback: string } => {
    return reviewDrafts[submission._id] || {
      status: toReviewStatus(submission?.status),
      feedback: submission?.feedback || "",
    }
  }

  const getTaskPoints = (submission: any) => {
    const points = Number(submission?.taskPoints)
    if (Number.isFinite(points) && points >= 0) return points
    const existing = Number(submission?.pointsAwarded)
    return Number.isFinite(existing) && existing >= 0 ? existing : 0
  }

  const isImageAsset = (url: string) => /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url)

  const reviewSubmission = async (submission: any) => {
    const draft = buildDraft(submission)
    const pointsAwarded = draft.status === "approved" ? getTaskPoints(submission) : 0

    try {
      setReviewingId(submission._id)
      await apiClient.patch(`/challenges/submissions/${submission._id}/review`, {
        status: draft.status,
        feedback: draft.feedback || undefined,
        pointsAwarded,
      })
      toast.success("Submission reviewed")
      await loadSubmissions()
      await onSubmissionReviewed?.()
    } catch (error) {
      console.error('Failed to review submission:', error)
      toast.error("Failed to submit review")
    } finally {
      setReviewingId(null)
    }
  }

  const distributeRewards = async () => {
    try {
      setDistributionInFlight(true)
      await challengesApi.distributeRewards(challengeId, {
        idempotencyKey: `${challengeId}:${new Date().toISOString().slice(0, 10)}`,
      })
      toast.success("Rewards distributed")
      await loadEligibility()
    } catch (error) {
      console.error('Failed to distribute rewards:', error)
      toast.error("Failed to distribute rewards")
    } finally {
      setDistributionInFlight(false)
    }
  }

  const pendingSubmissions = useMemo(
    () => submissions.filter((submission) => submission.status === "pending"),
    [submissions],
  )

  return (
    <Tabs defaultValue="participants" className="space-y-4">
      <TabsList>
        <TabsTrigger value="participants">Participants</TabsTrigger>
        <TabsTrigger value="reviews" onClick={loadSubmissions}>Submission Reviews</TabsTrigger>
        <TabsTrigger value="rewards" onClick={loadEligibility}>Rewards Distribution</TabsTrigger>
      </TabsList>

      <TabsContent value="participants">
        <EnhancedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participants ({participants.length})
            </CardTitle>
            <CardDescription>Manage challenge participants and their progress</CardDescription>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No participants yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {participant.user?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveImageUrl(participant.user.avatar) || '/placeholder.svg'}
                            alt={participant.user?.name || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-medium">
                            {(participant.user?.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{participant.user?.name || 'Unknown User'}</h4>
                        <p className="text-sm text-muted-foreground">{participant.user?.email || ''}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={participant.isActive ? "default" : "secondary"} className="text-xs">
                            {participant.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Joined {formatDate(participant.joinedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-amber-600">
                          <Trophy className="h-4 w-4" />
                          <span className="font-semibold">{participant.totalPoints}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{participant.completedTasks?.length || 0}</div>
                        <div className="text-xs text-muted-foreground">Tasks Done</div>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className="font-semibold">{participant.progress}%</div>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${participant.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </EnhancedCard>
      </TabsContent>

      <TabsContent value="reviews">
        <EnhancedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Submission Reviews
            </CardTitle>
            <CardDescription>
              Review pending submissions and provide feedback ({pendingSubmissions.length} pending)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissionsLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No submissions yet</div>
            ) : (
              submissions.map((submission: any) => {
                const draft = buildDraft(submission)
                const autoPoints = draft.status === "approved" ? getTaskPoints(submission) : 0
                const isApprovedLocked = submission.status === "approved"
                const normalizedFiles = (submission.files || [])
                  .map((file: string) => resolveImageUrl(file) || file)
                  .filter(Boolean)
                const imageFiles = normalizedFiles.filter((file: string) => isImageAsset(file))
                const otherFiles = normalizedFiles.filter((file: string) => !isImageAsset(file))
                const links = (submission.links || []).filter((link: string) => typeof link === "string" && link.trim().length > 0)

                return (
                  <div key={submission._id} className="rounded-lg border p-4 space-y-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-base">{submission.taskTitle || `Task ${submission.taskId}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {submission.user?.name || "Unknown user"} • Day {submission.taskDay || "-"} • Submitted{" "}
                          {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : "-"}
                        </p>
                      </div>
                      <Badge variant={submission.status === "pending" ? "secondary" : "outline"} className="capitalize">
                        {submission.status}
                      </Badge>
                    </div>

                    {submission.content && (
                      <div className="rounded-md border bg-muted/30 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Submission Details</p>
                        <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
                      </div>
                    )}

                    {imageFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Photos
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {imageFiles.map((file: string, index: number) => (
                            <a key={`${file}-${index}`} href={file} target="_blank" rel="noreferrer" className="block rounded-md overflow-hidden border bg-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={file}
                                alt={`Submission file ${index + 1}`}
                                className="h-32 w-full object-cover"
                                loading="lazy"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {links.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          URLs
                        </p>
                        <div className="space-y-2">
                          {links.map((link: string, index: number) => (
                            <a
                              key={`${link}-${index}`}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/40"
                            >
                              <span className="truncate pr-3">{link}</span>
                              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {otherFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Uploaded Files
                        </p>
                        <div className="space-y-2">
                          {otherFiles.map((file: string, index: number) => (
                            <a
                              key={`${file}-${index}`}
                              href={file}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted/40"
                            >
                              <span className="truncate pr-3">{file}</span>
                              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <select
                          className="h-9 w-full rounded-md border px-2 text-sm"
                          value={draft.status}
                          disabled={isApprovedLocked}
                          onChange={(e) => updateDraft(submission._id, { status: e.target.value as ReviewStatus })}
                        >
                          <option value="approved">approved</option>
                          <option value="feedback_required">feedback_required</option>
                          <option value="rejected">rejected</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Points Awarded (Auto)</Label>
                        <Input type="number" value={autoPoints} readOnly disabled />
                      </div>
                      <div className="flex items-end">
                        <Button
                          className="w-full"
                          disabled={reviewingId === submission._id || isApprovedLocked}
                          onClick={() => reviewSubmission(submission)}
                        >
                          {isApprovedLocked
                            ? "Approved (Locked)"
                            : reviewingId === submission._id
                              ? "Submitting..."
                              : "Submit Review"}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Feedback</Label>
                      <Textarea
                        value={draft.feedback}
                        disabled={isApprovedLocked}
                        onChange={(e) => updateDraft(submission._id, { feedback: e.target.value })}
                        placeholder={isApprovedLocked ? "Locked after approval." : "Write actionable feedback..."}
                      />
                    </div>
                    {isApprovedLocked && (
                      <p className="text-xs text-muted-foreground">
                        This submission is locked after approval. It can only be reviewed again if a new submission is created.
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </CardContent>
        </EnhancedCard>
      </TabsContent>

      <TabsContent value="rewards">
        <EnhancedCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Rewards Distribution
            </CardTitle>
            <CardDescription>Preview eligibility and trigger manual payout distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadEligibility} disabled={eligibilityLoading}>
                {eligibilityLoading ? "Refreshing..." : "Refresh Eligibility"}
              </Button>
              <Button onClick={distributeRewards} disabled={distributionInFlight || eligibilityLoading}>
                {distributionInFlight ? "Distributing..." : "Distribute Rewards"}
              </Button>
            </div>
            {!eligibility ? (
              <p className="text-sm text-muted-foreground">Load eligibility to preview recipients.</p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md border p-3 text-sm">
                  <p><strong>Completion recipients:</strong> {(eligibility.completionRecipients || []).length}</p>
                  <p><strong>Top performer winners:</strong> {(eligibility.topPerformerWinner || []).length}</p>
                  <p><strong>Streak recipients:</strong> {(eligibility.streakRecipients || []).length}</p>
                </div>
                {eligibility.latestDistribution && (
                  <div className="rounded-md border p-3 text-sm">
                    <p><strong>Last distribution status:</strong> {eligibility.latestDistribution.status}</p>
                    <p><strong>Total amount:</strong> {eligibility.latestDistribution.summary?.totalAmount ?? 0}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </EnhancedCard>
      </TabsContent>
    </Tabs>
  )
}
