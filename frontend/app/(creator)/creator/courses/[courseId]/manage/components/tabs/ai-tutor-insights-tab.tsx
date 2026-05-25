"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { api, type TutorChapterInsight } from "@/lib/api"
import { EnhancedCard } from "@/components/ui/enhanced-card"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, MessageCircleQuestion, Sparkles, AlertTriangle } from "lucide-react"

interface AiTutorInsightsTabProps {
  courseId: string
}

export function AiTutorInsightsTab({ courseId }: AiTutorInsightsTabProps) {
  const [chapters, setChapters] = useState<TutorChapterInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.ai.getCourseTutorInsights(courseId)
        if (!cancelled) setChapters(data.chapters || [])
      } catch {
        if (!cancelled) setError("Could not load tutor insights.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        Loading tutor insights…
      </div>
    )
  }

  if (error) {
    return (
      <EnhancedCard>
        <CardContent className="py-12 text-center text-muted-foreground">{error}</CardContent>
      </EnhancedCard>
    )
  }

  const hasActivity = chapters.some((c) => c.totalQuestions > 0)
  const activeChapters = chapters.filter((c) => c.totalQuestions > 0)
  const alertChapters = activeChapters.filter((c) => c.isConfusing)
  const storyChapters = alertChapters.length > 0 ? alertChapters : activeChapters.slice(0, 4)

  return (
    <div className="space-y-6">
      <EnhancedCard>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-700" />
            <CardTitle>AI Tutor Insights</CardTitle>
          </div>
          <CardDescription>
            See what learners ask most — spot chapters that need clearer explanations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Community-wide AI settings live in{" "}
            <Link href="/creator/ai" className="font-medium text-teal-700 underline">
              Chabaqa AI
            </Link>
            .
          </p>
        </CardContent>
      </EnhancedCard>

      {!hasActivity ? (
        <EnhancedCard>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <MessageCircleQuestion className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="font-medium">No learner questions yet</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              When students use the AI tutor on chapters, common questions will appear here.
            </p>
          </CardContent>
        </EnhancedCard>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">AI Tutor Alerts</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none" aria-label="AI tutor chapter alerts">
              {storyChapters.map((chapter) => {
                const topQuestion = chapter.topQuestions[0]
                return (
                  <EnhancedCard
                    key={chapter.chapterId}
                    className="shrink-0 w-80 border-l-4 border-[#ff9b28] bg-white shadow-sm"
                  >
                    <CardContent className="flex h-full flex-col justify-between p-5">
                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-[#ff9b28]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#ff9b28]">
                            {chapter.isConfusing ? "Attention Required" : "Learner Signal"}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {chapter.totalQuestions} asks
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{chapter.chapterTitle}</h4>
                        {chapter.sectionTitle && <p className="mt-0.5 text-xs text-slate-400">{chapter.sectionTitle}</p>}
                        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-500">
                          {topQuestion
                            ? `${topQuestion.count} learner question${topQuestion.count !== 1 ? "s" : ""}: ${topQuestion.text}`
                            : `${chapter.uniqueLearners} learner${chapter.uniqueLearners !== 1 ? "s" : ""} used the tutor on this chapter.`}
                        </p>
                      </div>
                      <Link
                        href={`/creator/courses/${courseId}/manage`}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#8e78fb]"
                      >
                        Optimize Chapter Syllabus
                      </Link>
                    </CardContent>
                  </EnhancedCard>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4">
            {activeChapters.map((chapter) => (
              <EnhancedCard key={chapter.chapterId}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{chapter.chapterTitle}</CardTitle>
                      {chapter.sectionTitle && (
                        <CardDescription>{chapter.sectionTitle}</CardDescription>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {chapter.totalQuestions} question{chapter.totalQuestions !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline">{chapter.uniqueLearners} learners</Badge>
                      {chapter.isConfusing && (
                        <Badge className="gap-1 bg-amber-100 text-amber-900 hover:bg-amber-100">
                          <AlertTriangle className="h-3 w-3" />
                          Needs attention
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {chapter.topQuestions.length > 0 ? (
                    <ul className="space-y-2">
                      {chapter.topQuestions.map((q: { text: string; count: number }, i: number) => (
                        <li
                          key={i}
                          className="flex items-start justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                        >
                          <span className="text-foreground">{q.text}</span>
                          <Badge variant="outline" className="shrink-0">
                            x{q.count}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No repeated questions yet.</p>
                  )}
                </CardContent>
              </EnhancedCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
