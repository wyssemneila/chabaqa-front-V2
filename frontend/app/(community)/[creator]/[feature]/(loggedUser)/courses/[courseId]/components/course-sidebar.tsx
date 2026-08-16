import React from "react"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, CheckCircle, Clock3, Lock, MessageSquare, Play, StickyNote, ArrowRight, ShoppingCart, Trash2 } from "lucide-react"
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

function ChapterProgressRing({
  progress,
  isCompleted,
  isLocked,
  isActive,
}: {
  progress: number
  isCompleted: boolean
  isLocked: boolean
  isActive: boolean
}) {
  const radius = 14
  const strokeWidth = 3
  const circumference = 2 * Math.PI * radius
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)))
  const strokeDashoffset = circumference - (circumference * safeProgress) / 100

  return (
    <div className="relative flex h-9 w-9 items-center justify-center">
      <svg className="h-9 w-9 -rotate-90" aria-hidden="true">
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="stroke-slate-100"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          className={isLocked ? "stroke-slate-300" : isCompleted ? "stroke-green-500" : isActive ? "stroke-[#47c7ea]" : "stroke-[#8e78fb]"}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-slate-500">
        {isCompleted ? "✓" : isLocked ? "•" : safeProgress > 0 ? `${safeProgress}` : "0"}
      </span>
    </div>
  )
}

function getChapterState({
  isCompleted,
  accessible,
  isPaidChapter,
  isPreview,
  isActive,
}: {
  isCompleted: boolean
  accessible: boolean
  isPaidChapter: boolean
  isPreview: boolean
  isActive: boolean
}) {
  if (isCompleted) return { label: "Completed", className: "text-emerald-700" }
  if (isActive) return { label: "Now playing", className: "text-[#6f58df]" }
  if (isPreview && accessible) return { label: "Free preview", className: "text-sky-700" }
  if (isPaidChapter && !accessible) return { label: "Purchase required", className: "text-amber-800" }
  if (!accessible) return { label: "Locked", className: "text-slate-500" }
  return { label: "Ready to start", className: "text-slate-500" }
}

interface CourseSidebarProps {
  course: any
  enrollment: any
  allChapters: any[]
  progress: number
  completedChaptersCount: number
  remainingChaptersCount: number
  selectedChapter: string | null
  setSelectedChapter: (chapterId: string) => boolean | void | Promise<boolean | void>
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
  const orderedSections = useMemo(
    () => [...(course?.sections || [])].sort(
      (left: any, right: any) => Number(left?.order ?? 0) - Number(right?.order ?? 0),
    ),
    [course?.sections],
  )

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
      const selected = await Promise.resolve(setSelectedChapter(targetChapterId))
      if (selected === false) return false
      console.info("[CourseNextFlow] Chapter selection resolved", {
        source,
        targetChapterId,
      })
      return true
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
      return false
    }
  }

  const hasPaidEntitlement = (chapterId: string) => {
    if (!Array.isArray(courseSession?.chapters)) {
      // Legacy callers/tests without a session snapshot still defer to their
      // supplied access authority. Production player sessions always include it.
      return isChapterAccessible(chapterId)
    }
    const sessionChapter = courseSession.chapters.find(
      (chapter) => String(chapter.chapterId) === String(chapterId),
    )
    return Boolean(
      sessionChapter?.access.canAccess &&
        ["chapter_purchase", "staff"].includes(
          String(sessionChapter.access.accessSource || ""),
        ),
    )
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

    if (nextChapterRequiresPayment && !hasPaidEntitlement(nextChapterId)) {
      if (onOpenEnrollment) {
        await onOpenEnrollment({
          targetChapterId: nextChapterId,
          targetChapterPaid: true,
          source: "sidebar-next",
        })
        return
      }
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

    const nextChapterRequiresPayment = Boolean(nextChapter.isPaidChapter)
    const nextChapterAccessible =
      isChapterAccessible(nextChapterId) &&
      (!nextChapterRequiresPayment || hasPaidEntitlement(nextChapterId))

    if (nextChapterRequiresPayment && !nextChapterAccessible) {
      await handleNextChapter(nextChapter)
      return
    }

    if (!isUserEnrolled && !nextChapterAccessible && onOpenEnrollment) {
      await onOpenEnrollment({
        targetChapterId: nextChapterId,
        targetChapterPaid: nextChapterRequiresPayment,
        source: "sidebar-next",
      })
      return
    }

    // When the session hook is available, use its deterministic goToNextChapter action.
    // This bypasses the stale-closure problem because the session fetches fresh access from backend.
    if (courseSession && isCurrentChapterCompleted) {
      const result = await courseSession.goToNextChapter()
      if (result.success) {
        const targetChapterId = result.chapterId ? String(result.chapterId) : nextChapterId
        await requestChapterSelection(targetChapterId, "sidebar-next")
        console.info("[CourseNextFlow] Session-based next chapter navigation succeeded")
        return
      }

      // Session says blocked — check if it's a payment/enrollment issue
      const lockCode = 'lockCode' in result ? result.lockCode : undefined
      const needsPayment = 'needsPayment' in result ? result.needsPayment : false
      const resultChapterId = 'chapterId' in result && result.chapterId ? String(result.chapterId) : nextChapterId

      if (needsPayment && onOpenEnrollment) {
        await onOpenEnrollment({
          targetChapterId: resultChapterId,
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
                <CardTitle className="text-sm md:text-base font-semibold">Course content</CardTitle>
                <p className="text-xs md:text-sm text-muted-foreground font-medium">
                  {completedChaptersCount} of {allChapters.length} completed
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
                  {orderedSections.map((section: any, sectionIndex: number) => (
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
                        {[...(section.chapters || [])]
                          .sort((left: any, right: any) => Number(left?.order ?? 0) - Number(right?.order ?? 0))
                          .map((chapter: any, chapterIndex: number) => {
                          const sessionChapter = Array.isArray(courseSession?.chapters) ? courseSession.chapters.find(
                            (entry) => String(entry.chapterId) === String(chapter.id),
                          ) : undefined
                          const chapterProgress = enrollment?.progress?.find((p: any) => String(p.chapterId) === String(chapter.id))
                          const isCompleted = Boolean(sessionChapter?.isCompleted || chapterProgress?.isCompleted)
                          const isActive = String(selectedChapter) === String(chapter.id)
                          const accessible = sessionChapter ? sessionChapter.access.canAccess : isChapterAccessible(String(chapter.id))
                          // Calculate chapter progress percentage
                          const watchTime = Number(chapterProgress?.watchTime ?? 0)
                          const duration = Number(chapterProgress?.videoDuration ?? chapter.duration ?? 0)
                          const progressPct = isCompleted ? 100 : (duration > 0 ? Math.min((watchTime / duration) * 100, 100) : 0)
                          const chapterState = getChapterState({
                            isCompleted: Boolean(isCompleted),
                            accessible,
                            isPaidChapter: Boolean(sessionChapter?.isPaidChapter ?? chapter.isPaidChapter),
                            isPreview: Boolean(chapter.isPreview && !chapter.isPaidChapter),
                            isActive,
                          })

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
                                  if (sessionChapter?.access.needsPayment && onOpenEnrollment) {
                                    void onOpenEnrollment({
                                      targetChapterId: chapterId,
                                      targetChapterPaid: true,
                                      source: "manual",
                                    })
                                    return
                                  }
                                  const reason =
                                    sessionChapter?.access.lockReason ||
                                    (sessionChapter?.access.needsPayment || chapter.isPaidChapter
                                      ? "Buy this chapter to continue learning."
                                      : isUserEnrolled
                                        ? "This chapter is currently locked."
                                        : "Enroll in the course to open this chapter.")
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
                                    ? "border border-transparent hover:border-slate-200 hover:bg-slate-50"
                                    : "cursor-not-allowed border border-transparent opacity-60"
                              }`}
                            >
                              <div className="flex items-start gap-2.5 md:gap-3 w-full">
                                <div className="flex-shrink-0">
                                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${Boolean(isCompleted) ? "bg-emerald-100 text-emerald-700" : !accessible ? "bg-slate-100 text-slate-400" : isActive ? "bg-white text-[#8e78fb] ring-1 ring-[#8e78fb]" : "bg-slate-100 text-slate-500"}`}>{Boolean(isCompleted) ? <Check className="h-4 w-4" strokeWidth={2.5} /> : !accessible ? <Lock className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3 w-3" fill="currentColor" />}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <span className={`text-xs md:text-sm font-semibold block line-clamp-2 ${isActive ? 'text-primary' : accessible ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {chapterIndex + 1}. {chapter.title}
                                      </span>
                                    </div>
                                    {chapter.duration && (
                                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{Math.max(1, Math.ceil(Number(chapter.duration) / 60))} min</span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                    <span className={`text-[11px] font-medium ${chapterState.className}`}>
                                      {sessionChapter?.access.accessSource === "staff"
                                        ? "Staff access"
                                        : sessionChapter?.access.accessSource === "chapter_purchase"
                                          ? "Purchased"
                                          : chapterState.label}
                                    </span>
                                    {!accessible && sessionChapter?.access.lockReason && (
                                      <span className="text-[11px] text-slate-500">
                                        · {sessionChapter.access.lockReason}
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
