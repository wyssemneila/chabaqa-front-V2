"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText as FileTextIcon, Download as DownloadIcon, Video, Code, Link as LinkIcon, FileType, Wrench, Star, Sparkles } from "lucide-react"
import { CourseReviewsSection } from "@/components/reviews/course-reviews-section"
import AiTutorWidget from "./ai-tutor-widget"

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
}: ChapterTabsProps) {
  const chapterResources = currentChapter?.resources || []
  const chapterNotes = currentChapter?.notes || ''
  const chapterContent = currentChapter?.content || ''

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
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-5 md:grid-cols-5 lg:grid-cols-5 h-auto p-1.5 bg-muted/50">
        <TabsTrigger value="content" className="py-2.5 md:py-3 text-xs md:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Content</TabsTrigger>
        <TabsTrigger value="ai-tutor" className="py-2.5 md:py-3 text-xs md:text-sm font-medium gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Sparkles className="h-3 w-3 md:h-4 md:w-4 text-purple-500" /> AI</TabsTrigger>
        <TabsTrigger value="notes" className="py-2.5 md:py-3 text-xs md:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Notes</TabsTrigger>
        <TabsTrigger value="resources" className="py-2.5 md:py-3 text-xs md:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Resources</TabsTrigger>
        <TabsTrigger value="reviews" className="py-2.5 md:py-3 text-xs md:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">Reviews</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="mt-4 md:mt-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg">{currentChapter?.title}</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Chapter {currentChapterIndex + 1} of {allChapters.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {chapterContent ? (
              <div className="prose prose-sm md:prose-base max-w-none">
                <p className="whitespace-pre-wrap text-sm md:text-base leading-relaxed">{chapterContent}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic text-sm md:text-base">No content description for this chapter.</p>
            )}

            <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
              {isCurrentChapterCompleted && nextChapterId && onGoToNextChapter ? (
                <Button type="button" onClick={() => void handleGoToNextChapterClick()} className="text-sm md:text-base">
                  Next Chapter
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai-tutor" className="mt-4 md:mt-6">
        {courseId && currentChapter?.id ? (
          <AiTutorWidget courseId={courseId!} chapterId={String(currentChapter.id)} />
        ) : (
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Sparkles className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm md:text-base">Please select a chapter to use the AI Tutor.</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="notes" className="mt-4 md:mt-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg">Instructor Notes</CardTitle>
            <CardDescription className="text-xs md:text-sm">Additional notes and tips from the instructor</CardDescription>
          </CardHeader>
          <CardContent>
            {chapterNotes ? (
              <div className="border-2 rounded-lg p-4 md:p-5 bg-yellow-50/80">
                <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">{chapterNotes}</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileTextIcon className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm md:text-base">No instructor notes for this chapter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="resources" className="mt-4 md:mt-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base md:text-lg">Chapter Resources</CardTitle>
            <CardDescription className="text-xs md:text-sm">Downloadable materials and links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {chapterResources.length > 0 ? (
              chapterResources.map((resource: any, index: number) => (
                <div key={resource.id || index} className="flex items-center justify-between p-3 md:p-4 border-2 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all">
                  <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{resource.titre || resource.title}</p>
                      {resource.description && (
                        <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">{resource.description}</p>
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
              <div className="text-center py-12 text-muted-foreground">
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
          <Card className="border shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Star className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm md:text-base">Reviews unavailable</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}
