"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileText as FileTextIcon, Download as DownloadIcon, Video, Code, Link as LinkIcon, FileType, Wrench, Star, Sparkles, Captions } from "lucide-react"
import { CourseReviewsSection } from "@/components/reviews/course-reviews-section"
import { FloatingAiTutorSheet } from "./ai-tutor-widget"
import { TranscriptTracker, type TranscriptSegment } from "./transcript-tracker"

interface ChapterTabsProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  currentChapter: any
  currentChapterIndex: number
  allChapters: any[]
  isCurrentChapterCompleted?: boolean
  nextChapterId?: string | null
  onGoToNextChapter?: () => void | Promise<void>
  courseId?: string
  onRefreshCourse?: () => Promise<void>
  isTheaterMode?: boolean
  onVideoSeek?: (ms: number) => void
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video className="h-5 w-5 text-purple-500" />
    case 'article':
      return <FileTextIcon className="h-5 w-5 text-blue-500" />
    case 'code':
      return <Code className="h-5 w-5 text-green-500" />
    case 'outil':
    case 'tool':
      return <Wrench className="h-5 w-5 text-orange-500" />
    case 'pdf':
      return <FileType className="h-5 w-5 text-red-500" />
    case 'lien':
    case 'link':
      return <LinkIcon className="h-5 w-5 text-cyan-500" />
    default:
      return <FileTextIcon className="h-5 w-5 text-gray-500" />
  }
}

export default function ChapterTabs({
  activeTab,
  setActiveTab,
  currentChapter,
  currentChapterIndex, 
  allChapters,
  isCurrentChapterCompleted,
  nextChapterId,
  onGoToNextChapter,
  courseId,
  onRefreshCourse,
  isTheaterMode = false,
  onVideoSeek,
}: ChapterTabsProps) {
  const chapterResources = currentChapter?.resources || []
  const chapterNotes = currentChapter?.notes || ''
  const chapterContent = currentChapter?.content || ''
  const [isAiTutorOpen, setIsAiTutorOpen] = React.useState(false)
  const canUseAiTutor = Boolean(courseId && currentChapter?.id)
  const chapterTranscript: TranscriptSegment[] = Array.isArray(currentChapter?.transcript) ? currentChapter.transcript : []
  const surfaceClassName = isTheaterMode
    ? "border-white/90 bg-white/92 text-slate-950 shadow-[0_18px_48px_-32px_rgba(51,65,85,0.45)] backdrop-blur"
    : "border shadow-sm"
  const mutedTextClassName = isTheaterMode ? "text-slate-500" : "text-muted-foreground"
  const tabTriggerClassName = cn(
    "min-h-11 py-2.5 md:py-3 text-xs md:text-sm font-medium data-[state=active]:shadow-sm",
    isTheaterMode
      ? "data-[state=active]:bg-white data-[state=active]:text-slate-950"
      : "data-[state=active]:bg-background",
  )

  const handleGoToNextChapterClick = async () => {
    const currentChapterId = currentChapter?.id ? String(currentChapter.id) : null
    console.info("[CourseNextFlow] ChapterTabs Next Chapter clicked", {
      currentChapterId,
      nextChapterId: nextChapterId ? String(nextChapterId) : null,
      hasHandler: Boolean(onGoToNextChapter),
    })

    if (!nextChapterId || !onGoToNextChapter) {
      console.warn("[CourseNextFlow] ChapterTabs next navigation blocked", {
        reason: !nextChapterId ? "No next chapter available" : "Missing next chapter handler",
        currentChapterId,
      })
      return
    }

    try {
      await Promise.resolve(onGoToNextChapter())
      console.info("[CourseNextFlow] ChapterTabs next navigation requested", {
        currentChapterId,
        nextChapterId: String(nextChapterId),
      })
    } catch (error) {
      console.error("[CourseNextFlow] ChapterTabs next navigation failed", {
        currentChapterId,
        nextChapterId: String(nextChapterId),
        error,
      })
    }
  }

  return (
    <>
    {canUseAiTutor ? (
      <FloatingAiTutorSheet
        courseId={courseId!}
        chapterId={String(currentChapter.id)}
        open={isAiTutorOpen}
        onOpenChange={setIsAiTutorOpen}
      />
    ) : null}
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className={cn("grid h-auto w-full gap-1 p-1.5", isTheaterMode ? "border border-white/80 bg-white/80 text-slate-600 shadow-sm backdrop-blur" : "bg-muted/50", chapterTranscript.length ? "grid-cols-6" : "grid-cols-5")}>
        <TabsTrigger value="content" className={tabTriggerClassName}>Content</TabsTrigger>
        <TabsTrigger value="ai-tutor" className={cn(tabTriggerClassName, "gap-1")}><Sparkles className="h-3 w-3 md:h-4 md:w-4 text-purple-500" /> AI</TabsTrigger>
        <TabsTrigger value="notes" className={tabTriggerClassName}>Notes</TabsTrigger>
        <TabsTrigger value="resources" className={tabTriggerClassName}>Resources</TabsTrigger>
        <TabsTrigger value="reviews" className={tabTriggerClassName}>Reviews</TabsTrigger>
        {chapterTranscript.length ? (
          <TabsTrigger value="transcript" className={cn(tabTriggerClassName, "gap-1")}>
            <Captions className="h-3 w-3 md:h-4 md:w-4 text-cyan-500" /> Transcript
          </TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="content" className="mt-4 md:mt-6">
        <Card className={surfaceClassName}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg">{currentChapter?.title}</CardTitle>
            <CardDescription className={cn("text-xs md:text-sm", mutedTextClassName)}>
              Chapter {currentChapterIndex + 1} of {allChapters.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chapterContent ? (
              <div className="prose prose-sm md:prose-base max-w-none">
                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{chapterContent}</p>
              </div>
            ) : (
              <p className={cn("italic text-sm md:text-base", mutedTextClassName)}>No content description for this chapter.</p>
            )}

            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
              {isCurrentChapterCompleted && nextChapterId && onGoToNextChapter ? (
                <Button type="button" onClick={() => void handleGoToNextChapterClick()} className="h-11 rounded-xl text-sm md:text-base">
                  Next Chapter
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {chapterTranscript.length ? (
        <TabsContent value="transcript" className="mt-4 md:mt-6">
          <Card className={surfaceClassName}>
            <CardContent className="px-4 py-4 md:px-6 md:py-6">
              <TranscriptTracker
                segments={chapterTranscript}
                onSeek={onVideoSeek ?? undefined}
              />
            </CardContent>
          </Card>
        </TabsContent>
      ) : null}

      <TabsContent value="ai-tutor" className="mt-4 md:mt-6">
        {canUseAiTutor ? (
          <Card className={cn(surfaceClassName, "overflow-hidden")}>
            <CardContent className="relative px-5 py-10 text-center md:px-8">
              <div className="pointer-events-none absolute inset-x-10 top-0 h-20 rounded-full bg-[#8e78fb]/10 blur-3xl" aria-hidden="true" />
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-lg shadow-purple-100 ring-1 ring-purple-100">
                <Sparkles className="h-8 w-8 text-[#8e78fb]" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <CardTitle className="relative text-lg text-slate-950 md:text-xl">AI Course Tutor</CardTitle>
              <CardDescription className={cn("relative mx-auto mt-2 max-w-md text-sm leading-relaxed md:text-base", mutedTextClassName)}>
                Open a focused tutor that can summarize this chapter, simplify concepts, and generate a quick quiz.
              </CardDescription>
              <Button
                type="button"
                className="btn-press-active relative mt-6 h-11 gap-2 rounded-xl bg-slate-950 px-5 text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
                onClick={() => setIsAiTutorOpen(true)}
                data-testid="open-ai-tutor-cta"
              >
                <Sparkles className="h-4 w-4 text-[#47c7ea]" aria-hidden="true" />
                Open AI Tutor
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className={surfaceClassName}>
            <CardContent className={cn("py-12 text-center", mutedTextClassName)}>
              <Sparkles className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm md:text-base">Please select a chapter to use the AI Tutor.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="notes" className="mt-4 md:mt-6">
        <Card className={surfaceClassName}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg">Instructor Notes</CardTitle>
            <CardDescription className={cn("text-xs md:text-sm", mutedTextClassName)}>Additional notes and tips from the instructor</CardDescription>
          </CardHeader>
          <CardContent>
            {chapterNotes ? (
              <div className={cn("border-2 rounded-lg p-4 md:p-5", isTheaterMode ? "border-yellow-200 bg-yellow-50/80 text-slate-900" : "bg-yellow-50/80")}>
                <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{chapterNotes}</p>
              </div>
            ) : (
              <div className={cn("text-center py-12", mutedTextClassName)}>
                <FileTextIcon className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm md:text-base">No instructor notes for this chapter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="resources" className="mt-4 md:mt-6">
        <Card className={surfaceClassName}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg">Chapter Resources</CardTitle>
            <CardDescription className={cn("text-xs md:text-sm", mutedTextClassName)}>Downloadable materials and links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {chapterResources.length > 0 ? (
              chapterResources.map((resource: any, index: number) => (
                <div
                  key={resource.id || index}
                  className={cn(
                    "flex items-center justify-between p-3 md:p-4 border-2 rounded-lg transition-all",
                    isTheaterMode ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-gray-50" : "hover:bg-gray-50 hover:border-gray-300",
                  )}
                >
                  <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{resource.titre || resource.title}</p>
                      {resource.description && (
                        <p className={cn("text-xs md:text-sm line-clamp-1", mutedTextClassName)}>{resource.description}</p>
                      )}
                    </div>
                  </div>
                  {resource.url && (
                    <Button variant="outline" size="sm" className="ml-3 flex-shrink-0 text-xs md:text-sm" asChild>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <DownloadIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                        {resource.type === 'link' || resource.type === 'lien' ? 'Open' : 'Download'}
                      </a>
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <div className={cn("text-center py-12", mutedTextClassName)}>
                <FileTextIcon className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm md:text-base">No resources for this chapter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reviews" className="mt-4 md:mt-6">
        {courseId ? (
          <CourseReviewsSection courseId={courseId} showForm={true} onRefreshCourse={onRefreshCourse} />
        ) : (
          <Card className={surfaceClassName}>
            <CardContent className={cn("py-12 text-center", mutedTextClassName)}>
              <Star className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm md:text-base">Reviews unavailable</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
    </>
  )
}
