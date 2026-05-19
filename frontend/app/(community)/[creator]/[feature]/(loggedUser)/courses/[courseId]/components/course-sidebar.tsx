import React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, PlayCircle, Lock, MessageSquare, StickyNote, ArrowRight, ShoppingCart, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"
import { coursesApi } from "@/lib/api/courses.api"
import { tokenStorage } from "@/lib/token-storage"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import Link from "next/link"
import { getUserProfileHref } from "@/lib/profile-handle"
import type { CourseSession } from "@/hooks/use-course-session"

interface CourseSidebarProps {
  course: any
  enrollment: any
  allChapters: any[]
  progress: number
  completedChaptersCount: number
  remainingChaptersCount: number
  selectedChapter: string | null
  setSelectedChapter: (chapterId: string) => void | Promise<void>
  isChapterAccessible: (chapterId: string) => boolean
  /** Live watch time for current chapter (from player) so % updates second-by-second */
  currentChapterProgress?: { watchTime: number; duration: number }
  /** ID used for storage keys (matches what player uses) */
  courseId?: string
  pendingPaidChapterId?: string | null
  chapterUnlockState?: "idle" | "syncing" | "unlocked" | "timeout"
  onRetryUnlock?: () => Promise<void> | void
  onOpenEnrollment?: (options?: {
    targetChapterId?: string
    targetChapterPaid?: boolean
    source?: "sidebar-next" | "player-lock" | "manual"
  }) => void | Promise<void>
  /** Centralized course session from useCourseSession hook. */
  courseSession?: CourseSession
}

export default function CourseSidebar({
  course,
  enrollment,
  allChapters,
  progress,
  completedChaptersCount,
  remainingChaptersCount,
  selectedChapter,
  setSelectedChapter,
  isChapterAccessible,
  currentChapterProgress,
  courseId,
  pendingPaidChapterId,
  chapterUnlockState = "idle",
  onRetryUnlock,
  onOpenEnrollment,
  courseSession,
}: CourseSidebarProps) {
  const [activeTab, setActiveTab] = useState("content")
  const [noteContent, setNoteContent] = useState("")
  const [notes, setNotes] = useState<any[]>([])
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const { toast } = useToast()
  const instructorProfileHref = getUserProfileHref({
    username: course?.creator?.username,
    name: course?.creator?.name || "Instructor",
  })
  const isUserEnrolled = Boolean(enrollment)
  const firstChapterId = allChapters?.[0]?.id ? String(allChapters[0].id) : null

  const loadNotes = async () => {
    setLoadingNotes(true)
    try {
      const response = await api.courses.getNotes(course.id)
      // Backend returns the array directly, but sometimes it might be wrapped.
      // We check if response is array or if response.data is array.
      if (Array.isArray(response)) {
        setNotes(response)
      } else if (response && Array.isArray(response.data)) {
        setNotes(response.data)
      } else {
        setNotes([])
      }
    } catch (error) {
      console.error(error)
      setNotes([])
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleSaveNote = async () => {
    // If no chapter selected, try to use the first one available
    const targetChapter = selectedChapter || (allChapters?.[0]?.id ?? null)

    if (!targetChapter || !noteContent.trim()) {
      toast({
        title: "Cannot save note",
        description: "Please select a chapter and enter some text",
        variant: "destructive"
      })
      return
    }

    try {
      await api.courses.createNote(course.id, targetChapter, noteContent)
      setNoteContent("")
      toast({ title: "Note saved!" })
      loadNotes()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error saving note",
        variant: "destructive"
      })
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!noteId) return
    setDeletingNoteId(noteId)
    try {
      await api.courses.deleteNote(course.id, noteId)
      toast({ title: "Note deleted!" })
      await loadNotes()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error deleting note",
        variant: "destructive",
      })
    } finally {
      setDeletingNoteId(null)
    }
  }

  const requestChapterSelection = async (
    chapterId: string,
    source: "chapter-list" | "sidebar-next",
  ) => {
    const targetChapterId = String(chapterId)
    console.info("[CourseNextFlow] Chapter selection requested", {
      source,
      targetChapterId,
      selectedChapter,
      isUserEnrolled,
    })
    try {
      await Promise.resolve(setSelectedChapter(targetChapterId))
      console.info("[CourseNextFlow] Chapter selection resolved", {
        source,
        targetChapterId,
      })
    } catch (error) {
      console.error("[CourseNextFlow] Chapter selection failed", {
        source,
        targetChapterId,
        error,
      })
      toast({
        title: "Navigation failed",
        description: "Could not open the chapter. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleNextChapter = async (nextChapter: any) => {
    if (!nextChapter) return;
    const nextChapterId = String(nextChapter.id)
    const nextChapterRequiresPayment = Boolean(nextChapter.isPaidChapter)
    console.info("[CourseNextFlow] Sidebar Next clicked", {
      nextChapterId,
      nextChapterRequiresPayment,
      isUserEnrolled,
      currentlyAccessible: isChapterAccessible(nextChapterId),
      selectedChapter,
    })

    if (!isUserEnrolled && !isChapterAccessible(nextChapterId) && onOpenEnrollment) {
      console.info("[CourseNextFlow] Trigger chapter-aware enrollment from sidebar", {
        nextChapterId,
        nextChapterRequiresPayment,
      })
      await onOpenEnrollment({
        targetChapterId: nextChapterId,
        targetChapterPaid: nextChapterRequiresPayment,
        source: "sidebar-next",
      })
      return
    }

    if (nextChapterRequiresPayment && !isChapterAccessible(nextChapterId)) {
      // Initiate payment for the next chapter
      console.info("[CourseNextFlow] Next chapter requires payment; initializing checkout", {
        nextChapterId,
      })
      setPurchasing(true);
      try {
        const resolvedCourseId = String(course?.mongoId || course?.id || courseId || "");
        if (!resolvedCourseId) {
          throw new Error("Missing course identifier")
        }
        const data = await coursesApi.initChapterStripePayment(
          resolvedCourseId,
          nextChapterId,
        );
        const checkoutUrl = data?.checkoutUrl || data?.data?.checkoutUrl
        if (checkoutUrl) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "pending_chapter_checkout",
              JSON.stringify({
                courseId: resolvedCourseId,
                chapterId: nextChapterId,
                createdAt: Date.now(),
              }),
            )
          }
          window.location.href = checkoutUrl;
        } else {
          throw new Error("Payment initialization failed");
        }
      } catch (error) {
        console.error("Chapter checkout init failed:", error)
        toast({
          title: "Error starting payment",
          description:
            typeof error === "object" && error && "message" in error
              ? String((error as any).message)
              : "Please try again later",
          variant: "destructive"
        });
      } finally {
        setPurchasing(false);
      }
    } else {
      // Free or already unlocked
      console.info("[CourseNextFlow] Navigating directly to next chapter", { nextChapterId })
      await requestChapterSelection(nextChapterId, "sidebar-next")
    }
  };

  const handleNextChapterClick = async (nextChapter: any, isCurrentChapterCompleted: boolean) => {
    if (!nextChapter) {
      console.warn("[CourseNextFlow] Next chapter click ignored: missing target chapter")
      return
    }

    const nextChapterId = String(nextChapter.id)
    console.info("[CourseNextFlow] Next chapter button clicked", {
      nextChapterId,
      isCurrentChapterCompleted,
      purchasing,
      selectedChapter,
      usingSession: Boolean(courseSession),
    })

    if (purchasing) {
      console.info("[CourseNextFlow] Next chapter click ignored: purchase already in progress", {
        nextChapterId,
      })
      return
    }

    // When the session hook is available, use its deterministic goToNextChapter action.
    // This bypasses the stale-closure problem because the session fetches fresh access from backend.
    if (courseSession && isCurrentChapterCompleted) {
      const result = await courseSession.goToNextChapter()
      if (result.success) {
        console.info("[CourseNextFlow] Session-based next chapter navigation succeeded")
        return
      }

      // Session says blocked — check if it's a payment/enrollment issue
      const lockCode = 'lockCode' in result ? result.lockCode : undefined
      const needsPayment = 'needsPayment' in result ? result.needsPayment : false

      if (needsPayment && onOpenEnrollment) {
        await onOpenEnrollment({
          targetChapterId: nextChapterId,
          targetChapterPaid: true,
          source: "sidebar-next",
        })
        return
      }

      if (!isUserEnrolled && onOpenEnrollment) {
        await onOpenEnrollment({
          targetChapterId: nextChapterId,
          targetChapterPaid: false,
          source: "sidebar-next",
        })
        return
      }

      // Show the block reason to the user
      toast({
        title: "Next chapter locked",
        description: 'reason' in result ? result.reason : "Complete the current chapter first.",
        variant: "destructive",
      })
      return
    }

    if (!isCurrentChapterCompleted) {
      const reason = "Finish this chapter to unlock the next one."
      console.warn("[CourseNextFlow] Next chapter click blocked", {
        nextChapterId,
        reason,
      })
      toast({
        title: "Next chapter locked",
        description: reason,
        variant: "destructive",
      })
      return
    }

    await handleNextChapter(nextChapter)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => {
        setActiveTab(v)
        if (v === 'notes') loadNotes()
      }}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-3 mt-4">
          {chapterUnlockState === "syncing" && pendingPaidChapterId && (
            <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
              <CardContent className="py-3">
                <p className="text-xs text-blue-700">Payment received. Unlock is syncing for your chapter...</p>
              </CardContent>
            </Card>
          )}
          {chapterUnlockState === "unlocked" && pendingPaidChapterId && (
            <Card className="border-green-200 bg-green-50/60 shadow-sm">
              <CardContent className="py-3">
                <p className="text-xs text-green-700">Chapter unlocked successfully.</p>
              </CardContent>
            </Card>
          )}
          {chapterUnlockState === "timeout" && pendingPaidChapterId && (
            <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
              <CardContent className="py-3 space-y-2">
                <p className="text-xs text-amber-800">Payment received, unlock still syncing. Click retry unlock.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => void onRetryUnlock?.()}
                >
                  Retry Unlock
                </Button>
              </CardContent>
            </Card>
          )}


          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm md:text-base font-semibold">Course Content</CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  {allChapters.length} chapters
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className={`${
                allChapters.length <= 5 ? 'h-auto max-h-[350px] md:max-h-[400px]' :
                allChapters.length <= 10 ? 'h-[450px] md:h-[500px]' :
                allChapters.length <= 20 ? 'h-[600px] md:h-[650px]' :
                'h-[700px] md:h-[750px]'
              }`}>
                <div className="space-y-1 px-3 md:px-4 pb-4">
                  {course.sections.map((section: any, sectionIndex: number) => (
                    <div key={section.id} className="space-y-1">
                      <div className="flex items-center gap-2 py-2 px-2.5 md:px-3 bg-muted/40 rounded-lg mt-2">
                        <span className="text-xs md:text-sm font-bold text-muted-foreground">
                          {sectionIndex + 1}
                        </span>
                        <h4 className="font-semibold text-xs md:text-sm flex-1 truncate">{section.title}</h4>
                        <span className="text-xs md:text-sm text-muted-foreground font-medium">
                          {section.chapters.length}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {section.chapters.map((chapter: any, chapterIndex: number) => {
                          const chapterProgress = enrollment?.progress?.find((p: any) => String(p.chapterId) === String(chapter.id))
                          const isCompleted = chapterProgress?.isCompleted
                          const isActive = String(selectedChapter) === String(chapter.id)
                          const accessible = isChapterAccessible(String(chapter.id))
                          const isFirstPreviewChapter =
                            !isUserEnrolled &&
                            Boolean(firstChapterId && String(chapter.id) === firstChapterId)

                          // Calculate chapter progress percentage
                          const watchTime = Number(chapterProgress?.watchTime ?? 0)
                          const duration = Number(chapterProgress?.videoDuration ?? chapter.duration ?? 0)
                          const progressPct = isCompleted ? 100 : (duration > 0 ? Math.min((watchTime / duration) * 100, 100) : 0)

                          return (
                            <button
                              key={chapter.id}
                              onClick={() => {
                                const chapterId = String(chapter.id)
                                console.info("[CourseNextFlow] Sidebar chapter item clicked", {
                                  chapterId,
                                  accessible,
                                  selectedChapter,
                                  isUserEnrolled,
                                })
                                if (!accessible) {
                                  const reason = isUserEnrolled
                                    ? "Finish this chapter to unlock the next one."
                                    : "You need to enroll to open this chapter."
                                  console.warn("[CourseNextFlow] Sidebar chapter click blocked", {
                                    chapterId,
                                    reason,
                                  })
                                  toast({
                                    title: "Chapter locked",
                                    description: reason,
                                    variant: "destructive",
                                  })
                                  return
                                }
                                void requestChapterSelection(chapterId, "chapter-list")
                              }}
                              className={`w-full flex flex-col p-2.5 md:p-3 rounded-lg text-left transition-all ${
                                isActive
                                  ? "bg-primary/10 border-2 border-primary/30 shadow-md"
                                  : accessible
                                    ? "hover:bg-muted/60 border-2 border-transparent hover:border-muted"
                                    : "cursor-not-allowed opacity-60 border-2 border-transparent"
                              }`}
                            >
                              <div className="flex items-start gap-2.5 md:gap-3 w-full">
                                <div className="flex-shrink-0 mt-0.5">
                                  {isCompleted ? (
                                    <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                                  ) : accessible ? (
                                    <PlayCircle className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                  ) : (
                                    <Lock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <span className={`text-xs md:text-sm font-semibold block line-clamp-2 ${isActive ? 'text-primary' : accessible ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {chapterIndex + 1}. {chapter.title}
                                      </span>
                                    </div>
                                    {chapter.duration && (
                                      <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap font-medium">
                                        {Math.floor(chapter.duration / 60)}
                                        {chapter.duration % 60 > 0 && `:${String(chapter.duration % 60).padStart(2, '0')}`}
                                      </span>
                                    )}
                                  </div>

                                  {/* Progress bar for in-progress chapters */}
                                  {!isCompleted && progressPct > 0 && (
                                    <div className="mt-1.5 md:mt-2">
                                      <Progress value={progressPct} className="h-0.5 md:h-1" />
                                    </div>
                                  )}

                                  {/* Chapter badges */}
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    {isFirstPreviewChapter && accessible && (
                                      <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                                        Preview
                                      </span>
                                    )}
                                    {!accessible && (
                                      <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                                        Locked
                                      </span>
                                    )}
                                    {chapter.isPaidChapter && !accessible && (
                                      <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                                        Premium
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
                    <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm md:text-base font-semibold">Current Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              {/* Current chapter inline progress (allChapters is flat list of chapters from CoursePlayer) */}
              {(() => {
                const currentId = selectedChapter || (allChapters?.[0]?.id ?? null)
                const currentChapter = Array.isArray(allChapters)
                  ? allChapters.find((c: any) => String(c.id) === String(currentId))
                  : null

                // --- HIGH WATER MARK LOGIC FOR SIDEBAR ---
                // We want the sidebar to always show the MAX progress reached, even if the player seeks back.

                // 1. Get backend progress
                const chapterProgress = enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentId))
                const backendWatchTime = Number(chapterProgress?.watchTime ?? 0)
                const isCompleted = chapterProgress?.isCompleted ?? false

                // 2. Get local storage progress (High-Water Mark)
                let maxStoredTime = backendWatchTime
                // Use the passed courseId if available (matches player), otherwise fallback to course.id
                const resolvedCourseId = courseId || course.id
                const userIdFromEnrollment = enrollment?.userId ? String(enrollment.userId) : ""
                const userIdFromToken = typeof window !== "undefined" ? tokenStorage.getUserInfo()?.id : undefined
                const userScopeId = userIdFromEnrollment || userIdFromToken || "guest"
                const storageKey =
                  resolvedCourseId && currentId
                    ? `course_progress_${userScopeId}_${resolvedCourseId}_${currentId}`
                    : null

                if (typeof window !== 'undefined' && storageKey) {
                  const localData = localStorage.getItem(storageKey)
                  if (localData) {
                    try {
                      const parsed = JSON.parse(localData)
                      maxStoredTime = Math.max(maxStoredTime, parsed.time || 0)
                    } catch (e) {}
                  }
                }

                // 3. Get live player progress
                const liveWatchTime = currentChapterProgress?.watchTime ?? 0

                // 4. Calculate effective High-Water Mark to display
                const effectiveWatchTime = Math.max(maxStoredTime, liveWatchTime)

                const duration = currentChapterProgress?.duration ?? Number((chapterProgress && (chapterProgress as any).videoDuration) ?? currentChapter?.duration ?? 0)

                // Calculate percentage
                let currentPct = isCompleted
                  ? 100
                  : (duration > 0 ? Math.min((effectiveWatchTime / duration) * 100, 100) : 0)

                const sessionCurrentCompleted = Boolean(
                  courseSession?.isCurrentChapterCompleted &&
                  String(courseSession.currentChapterId ?? currentId) === String(currentId)
                )
                let effectiveIsCompleted = Boolean(isCompleted || sessionCurrentCompleted)
                if (effectiveIsCompleted) {
                  currentPct = 100
                }

                const adjustedCompletedCount = completedChaptersCount
                const adjustedRemainingCount = Math.max(0, remainingChaptersCount)

                // NEXT CHAPTER LOGIC
                const currentIndex = allChapters.findIndex(c => String(c.id) === String(currentId));
                const nextChapter = currentIndex !== -1 && currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;
                return (
                  <>
                    <div>
                      {currentChapter?.title && (
                        <p className="text-xs font-medium text-foreground mb-1.5 line-clamp-1">
                          {currentChapter.title}
                        </p>
                      )}
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-foreground">{Math.round(currentPct)}%</span>
                      </div>
                      <Progress value={currentPct} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-muted-foreground">{adjustedCompletedCount} done</span>
                      </div>
                      <div className="text-muted-foreground">
                        {adjustedRemainingCount} left
                      </div>
                    </div>

                    {/* NEXT CHAPTER ACTION */}
                    {nextChapter && !effectiveIsCompleted && (
                      <div className="flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Finish this chapter to unlock the next one.
                      </div>
                    )}
                    {nextChapter && effectiveIsCompleted && (
                      <Button
                        className="w-full gap-2 mt-1.5 h-8"
                        size="sm"
                        disabled={purchasing}
                        aria-disabled={purchasing}
                        variant="default"
                        onClick={() => void handleNextChapterClick(nextChapter, true)}
                      >
                        {purchasing ? (
                          "Processing..."
                        ) : nextChapter.isPaidChapter && !isChapterAccessible(nextChapter.id) ? (
                          <>
                            <ShoppingCart className="h-3 w-3" />
                            Buy Next
                          </>
                        ) : !isUserEnrolled && !isChapterAccessible(nextChapter.id) ? (
                          <>
                            Enroll to Continue
                            <ArrowRight className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            Next Chapter
                            <ArrowRight className="h-3 w-3" />
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )
              })()}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Take a Note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your notes for this chapter here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSaveNote} disabled={!noteContent.trim()} className="w-full">
                Save Note
              </Button>
            </CardContent>
          </Card>

          <ScrollArea className="h-[400px] mt-4">
            <div className="space-y-3 pr-4">
              {notes.map((note) => {
                const noteId = String(note?._id || note?.id || "")
                return (
                <Card key={noteId} className="bg-muted/50">
                  <CardContent className="p-3 text-sm space-y-2">
                    <p>{note.content}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-500"
                          onClick={() => void requestChapterSelection(String(note.chapterId), "chapter-list")}
                        >
                          Jump to Chapter
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-red-500"
                          disabled={!noteId || deletingNoteId === noteId}
                          onClick={() => handleDeleteNote(noteId)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
              {notes.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No notes yet. Start taking notes to track your learning!
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Instructor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href={instructorProfileHref} className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <Avatar className="h-10 w-10">
              <AvatarImage src={course.creator.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {course.creator.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate hover:underline">{course.creator.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{course.creator.bio || "Instructor"}</p>
            </div>
          </Link>
          <Button variant="outline" size="sm" className="w-full">
            <MessageSquare className="h-3.5 w-3.5 mr-2" />
            Message
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
