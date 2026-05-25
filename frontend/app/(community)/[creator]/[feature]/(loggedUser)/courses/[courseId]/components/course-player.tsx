"use client"

import React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import CourseHeader from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-header"
import EnhancedVideoPlayer from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/enhanced-video-player"
import ChapterTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/chapter-tabs"
import CourseSidebar from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-sidebar"
import { Button } from "@/components/ui/button"
import { coursesApi } from "@/lib/api/courses.api"
import { cn } from "@/lib/utils"
import { tokenStorage } from "@/lib/token-storage"
import { useToast } from "@/components/ui/use-toast"
import type { CourseSession } from "@/hooks/use-course-session"
import { Focus, Maximize2, Minimize2, X } from "lucide-react"

interface CoursePlayerProps {
  creatorSlug: string
  slug: string
  courseId: string
  course: any
  enrollment: any
  unlockedChapters: any[] | null
  sequentialProgressionEnabled: boolean
  unlockMessage?: string
  /** Centralized course session from useCourseSession hook. */
  courseSession?: CourseSession
  onRefreshCourse?: () => Promise<void>
  onRefreshProgress?: () => Promise<void>
  onRefreshUnlockedChapters?: () => Promise<void>
  onOpenEnrollment?: (options?: {
    targetChapterId?: string
    targetChapterPaid?: boolean
    source?: "sidebar-next" | "player-lock" | "manual"
  }) => void | Promise<void>
  requestedChapterId?: string | null
  onRequestedChapterConsumed?: (chapterId: string) => void
  pendingPaidChapterId?: string | null
  chapterUnlockState?: "idle" | "syncing" | "unlocked" | "timeout"
  onRetryUnlock?: () => Promise<void> | void
}

export default function CoursePlayer({
  creatorSlug,
  slug,
  courseId,
  course,
  enrollment,
  unlockedChapters,
  sequentialProgressionEnabled,
  unlockMessage,
  courseSession,
  onRefreshCourse,
  onRefreshProgress,
  onRefreshUnlockedChapters,
  onOpenEnrollment,
  requestedChapterId,
  onRequestedChapterConsumed,
  pendingPaidChapterId,
  chapterUnlockState,
  onRetryUnlock,
}: CoursePlayerProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("content")
  const [theaterMode, setTheaterMode] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const [accessibleChapters, setAccessibleChapters] = useState<Record<string, boolean>>({})
  const [chapterAccessReason, setChapterAccessReason] = useState<Record<string, string | undefined>>({})
  const accessCheckInFlight = useRef<Record<string, Promise<boolean> | undefined>>({})
  // Optimistic watch-time overrides so UI updates live without fetching backend every second
  const [watchTimeOverride, setWatchTimeOverride] = useState<number | null>(null)
  const [videoDurationOverride, setVideoDurationOverride] = useState<number | null>(null)
  const lastProgressRefreshRef = useRef<number>(0)
  const progressBackoffRef = useRef<{ attempts: number; nextAllowed: number }>({
    attempts: 0,
    nextAllowed: 0,
  })
  // Track the live watch time in a ref so auto-advance logic is always up-to-date,
  // but only flush to state every ~3 seconds to prevent re-rendering every polling tick.
  const liveWatchTimeRef = useRef<number | null>(null)
  const watchTimeStateLastUpdatedRef = useRef<number>(0)
  const autoAdvancedFromChapterRef = useRef<Record<string, boolean>>({})
  const currentChapterRef = useRef<any>(null)
  const trackingSentRef = useRef<{ start: boolean; complete: boolean }>({ start: false, complete: false })

  const allChapters = useMemo(() => {
    const sections = Array.isArray(course?.sections) ? [...course.sections] : []
    sections.sort((a: any, b: any) => Number(a?.order || 0) - Number(b?.order || 0))
    return sections.flatMap((section: any) => {
      const chapters = Array.isArray(section?.chapters) ? [...section.chapters] : []
      chapters.sort((a: any, b: any) => Number(a?.order || 0) - Number(b?.order || 0))
      return chapters
    })
  }, [course?.sections])
  const isUserEnrolled = Boolean(enrollment)
  const firstChapterId = allChapters[0]?.id ? String(allChapters[0].id) : null
  const resolvedCourseId = String(course?.mongoId || course?.id || courseId)
  const userStorageScopeId = useMemo(() => {
    const userIdFromEnrollment = enrollment?.userId ? String(enrollment.userId) : ""
    const userIdFromToken = typeof window !== "undefined" ? tokenStorage.getUserInfo()?.id : undefined
    return userIdFromEnrollment || userIdFromToken || "guest"
  }, [enrollment?.userId])
  const effectiveSequentialProgressionEnabled = Boolean(
    sequentialProgressionEnabled || course?.sequentialProgression,
  )
  const effectiveUnlockMessage =
    unlockMessage || (typeof course?.unlockMessage === "string" ? course.unlockMessage : undefined)
  const previewLockedReason = "Only the first chapter is available as preview. Enroll to unlock full course."
  const mapLockCodeToReason = useCallback((lockCode?: string): string | undefined => {
    switch (lockCode) {
      case "payment_required":
        return "Payment is required to unlock this chapter."
      case "not_enrolled_preview_only":
        return previewLockedReason
      case "previous_chapter_incomplete":
        return effectiveUnlockMessage || "You need to complete the previous chapter to unlock this one."
      case "chapter_not_found":
        return "Chapter not found."
      default:
        return undefined
    }
  }, [effectiveUnlockMessage, previewLockedReason])
  const unlockedMap = useMemo(() => {
    if (!Array.isArray(unlockedChapters)) return new Map<string, any>()
    return new Map<string, any>(unlockedChapters.map((c: any) => [String(c.id), c]))
  }, [unlockedChapters])

  const resolveSequentialAccessLocally = useCallback(
    (chapterId: string): { canAccess: boolean; reason?: string } => {
      const resolvedChapterId = String(chapterId)
      const chapterIndex = allChapters.findIndex((c: any) => String(c.id) === resolvedChapterId)
      if (chapterIndex === -1) {
        return { canAccess: false, reason: "Chapter not found" }
      }

      if (chapterIndex === 0) {
        return { canAccess: true }
      }

      const previousChapter = allChapters[chapterIndex - 1]
      const previousProgress = Array.isArray(enrollment?.progress)
        ? enrollment.progress.find((p: any) => String(p.chapterId) === String(previousChapter?.id))
        : null

      if (previousProgress?.isCompleted) {
        return { canAccess: true }
      }

      return {
        canAccess: false,
        reason: effectiveUnlockMessage || "You need to complete the previous chapter to unlock this one.",
      }
    },
    [allChapters, enrollment?.progress, effectiveUnlockMessage],
  )

  // Chapter completion handler: replaces the global window.__onChapterComplete pattern.
  // When the session hook is available, delegate to it for deterministic state updates.
  useEffect(() => {
    const onChapterComplete = async () => {
      if (courseSession) {
        const currentId = currentChapterRef.current?.id ? String(currentChapterRef.current.id) : null
        if (currentId) {
          courseSession.reportChapterComplete(currentId)
        }
      }
      if (onRefreshProgress) await onRefreshProgress()
      if (onRefreshUnlockedChapters) await onRefreshUnlockedChapters()
    }
    ;(window as any).__onChapterComplete = onChapterComplete
    return () => {
      try {
        delete (window as any).__onChapterComplete
      } catch {}
    }
  }, [onRefreshProgress, onRefreshUnlockedChapters, courseSession])

  const resolveChapterAccess = useCallback(
    async (chapterId: string): Promise<{ canAccess: boolean; reason?: string }> => {
      const resolvedChapterId = String(chapterId)
      const chapter = allChapters.find((c: any) => String(c.id) === resolvedChapterId)
      if (!chapter) return { canAccess: false, reason: "Chapter not found" }

      const sessionChapter = courseSession?.chapters.find(
        (c) => String(c.chapterId) === resolvedChapterId,
      )
      if (sessionChapter) {
        if (sessionChapter.access.canAccess) {
          return { canAccess: true }
        }
        return {
          canAccess: false,
          reason:
            sessionChapter.access.lockReason ||
            mapLockCodeToReason(sessionChapter.access.lockCode) ||
            "Chapter is locked.",
        }
      }

      if (!isUserEnrolled) {
        if (firstChapterId && resolvedChapterId === firstChapterId) {
          return { canAccess: true }
        }
        return { canAccess: false, reason: previewLockedReason }
      }

      const requiresPaidAccess = Boolean(chapter.isPaidChapter)
      if (requiresPaidAccess) {
        // Ask backend for paid access decision (covers freemium membership rule)
        try {
          const paidAccessRaw = await coursesApi.checkChapterAccessPaid(resolvedCourseId, resolvedChapterId)
          const paidAccess = (paidAccessRaw as any)?.data || paidAccessRaw
          const paidAllowed = Boolean((paidAccess as any)?.canAccess)
          if (!paidAllowed) {
            const reasonFromCode = mapLockCodeToReason((paidAccess as any)?.lockCode)
            return {
              canAccess: false,
              reason:
                (paidAccess as any)?.reason ||
                reasonFromCode ||
                effectiveUnlockMessage ||
                "You need to enroll to access this chapter.",
            }
          }
        } catch (e: any) {
          // If we cannot confirm paid access, fall back to requiring enrollment to be safe
          if (!isUserEnrolled) {
            return { canAccess: false, reason: effectiveUnlockMessage || "Enrollment required" }
          }
        }
      }

      // Sequential progression is an additional restriction if enabled.
      // We enforce it locally to avoid backend endpoint inconsistencies for free/preview chapters.
      if (!effectiveSequentialProgressionEnabled) {
        return { canAccess: true }
      }

      return resolveSequentialAccessLocally(resolvedChapterId)
    },
    [
      resolvedCourseId,
      allChapters,
      isUserEnrolled,
      firstChapterId,
      previewLockedReason,
      effectiveSequentialProgressionEnabled,
      effectiveUnlockMessage,
      resolveSequentialAccessLocally,
      mapLockCodeToReason,
      courseSession,
    ],
  )

  const ensureChapterAccessCached = useCallback(
    async (chapterId: string): Promise<boolean> => {
      const key = String(chapterId)

      if (!effectiveSequentialProgressionEnabled && typeof accessibleChapters[key] === "boolean") {
        return accessibleChapters[key]
      }

      const existing = accessCheckInFlight.current[key]
      if (existing) return existing

      const promise = resolveChapterAccess(key)
        .then(({ canAccess, reason }) => {
          setAccessibleChapters((prev) => ({ ...prev, [key]: canAccess }))
          setChapterAccessReason((prev) => ({ ...prev, [key]: reason }))
          return canAccess
        })
        .finally(() => {
          accessCheckInFlight.current[key] = undefined
        })

      accessCheckInFlight.current[key] = promise
      return promise
    },
    [accessibleChapters, resolveChapterAccess, effectiveSequentialProgressionEnabled],
  )

  const isChapterAccessible = useCallback(
    (chapterId: string) => {
      const key = String(chapterId)
      const chapter = allChapters.find((c: any) => String(c.id) === key)
      if (!chapter) return false

      const isPendingPaidUnlock =
        chapterUnlockState === "unlocked" &&
        pendingPaidChapterId &&
        key === String(pendingPaidChapterId)
      const unlockedEntry = unlockedMap.get(key)
      if (isPendingPaidUnlock || (Boolean(chapter.isPaidChapter) && Boolean(unlockedEntry?.isUnlocked))) {
        return true
      }
      if (accessibleChapters[key] === true) {
        return true
      }

      // Prefer the centralized session's access decisions (backend-authoritative, no stale closure).
      if (courseSession && courseSession.chapters.length > 0) {
        return courseSession.isChapterAccessible(key)
      }

      // Fail closed while the backend/session source of truth is not ready.
      // The only runtime fallback is the first chapter public preview.
      return Boolean(firstChapterId && key === firstChapterId)
    },
    [
      allChapters,
      firstChapterId,
      courseSession,
      unlockedMap,
      chapterUnlockState,
      pendingPaidChapterId,
      accessibleChapters,
    ],
  )

  useEffect(() => {
    if (!isUserEnrolled) return
    if (!Array.isArray(unlockedChapters) || unlockedChapters.length === 0) return

    const unlockedIds = unlockedChapters
      .filter((chapter: any) => Boolean(chapter?.isUnlocked))
      .map((chapter: any) => String(chapter.id))
      .filter(Boolean)

    if (unlockedIds.length === 0) return

    setAccessibleChapters((prev) => {
      let changed = false
      const next = { ...prev }
      for (const chapterId of unlockedIds) {
        if (next[chapterId] !== true) {
          next[chapterId] = true
          changed = true
        }
      }
      return changed ? next : prev
    })

    setChapterAccessReason((prev) => {
      let changed = false
      const next = { ...prev }
      for (const chapterId of unlockedIds) {
        if (typeof next[chapterId] !== "undefined") {
          delete next[chapterId]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [unlockedChapters, effectiveSequentialProgressionEnabled, isUserEnrolled])

  useEffect(() => {
    // Reset access cache when course or unlock state changes
    setAccessibleChapters({})
    setChapterAccessReason({})
    accessCheckInFlight.current = {}
  }, [courseId, effectiveSequentialProgressionEnabled, unlockedChapters, isUserEnrolled, firstChapterId])

  const tryAutoAdvanceToNext = useCallback(
    async (fromChapterId: string, options?: { refreshBeforeCheck?: boolean; delayMs?: number }): Promise<boolean> => {
      if (!isUserEnrolled) return false
      const sourceId = String(fromChapterId)
      const idx = allChapters.findIndex((c: any) => String(c.id) === sourceId)
      if (idx === -1 || idx >= allChapters.length - 1) return false
      const nextChapter = allChapters[idx + 1]
      const nextChapterId = String(nextChapter.id)

      if (options?.delayMs && options.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, options.delayMs))
      }

      if (options?.refreshBeforeCheck !== false) {
        if (onRefreshProgress) {
          await onRefreshProgress().catch(() => null)
        }
        if (onRefreshUnlockedChapters) {
          await onRefreshUnlockedChapters().catch(() => null)
        }
      }

      if (courseSession) {
        if (courseSession.chapters.length === 0) return false
        const result = await courseSession.selectChapter(nextChapterId)
        if (!result.success) return false
      } else {
        const canAccessNext = await ensureChapterAccessCached(nextChapterId)
        if (!canAccessNext) return false
      }

      autoAdvancedFromChapterRef.current[sourceId] = true
      setSelectedChapter(nextChapterId)
      return true
    },
    [isUserEnrolled, allChapters, onRefreshProgress, onRefreshUnlockedChapters, ensureChapterAccessCached, courseSession],
  )

  // Handler called by EnhancedVideoPlayer with latest seconds (and optional duration)
  const handleWatchTimeUpdate = useCallback(
    async (seconds: number, duration?: number) => {
      const secs = Math.floor(seconds)

      // Always keep the live ref up-to-date (used for auto-advance threshold checks)
      liveWatchTimeRef.current = secs

      // Only flush to React state every ~3 seconds to avoid re-rendering CoursePlayer
      // (and its children) on every single polling tick from the video player.
      const now = Date.now()
      const WATCH_TIME_STATE_THROTTLE_MS = 3_000
      if (now - watchTimeStateLastUpdatedRef.current >= WATCH_TIME_STATE_THROTTLE_MS) {
        watchTimeStateLastUpdatedRef.current = now
        setWatchTimeOverride(secs)
        if (typeof duration === "number" && Number.isFinite(duration) && duration > 0) {
          setVideoDurationOverride(Math.floor(duration))
        }
      }

      // Report to centralized session hook for automatic threshold-based refresh
      const currentChapterId = currentChapterRef.current?.id ? String(currentChapterRef.current.id) : null
      if (currentChapterId && courseSession) {
        courseSession.reportWatchTime(currentChapterId, secs, duration)
      }

      // Build per-chapter contribution breakdown for logging
      const chapters = Array.isArray(allChapters) ? allChapters : []
      const contributions = chapters.map((ch: any) => {
        const chapProgress = enrollment?.progress?.find((p: any) => String(p.chapterId) === String(ch.id))
        const serverWatch = Number(chapProgress?.watchTime ?? 0)
        const serverVideoDuration = Number((chapProgress as any)?.videoDuration ?? 0)

        // Determine duration precedence:
        // 1) If this is the current chapter and frontend provided duration, use it
        // 2) Else use server-stored videoDuration
        // 3) Else use chapter.duration
        let dur = 0
        if (String(ch.id) === String(currentChapterRef.current?.id) && typeof duration === 'number' && duration > 0) {
          dur = duration
        } else if (serverVideoDuration && serverVideoDuration > 0) {
          dur = serverVideoDuration
        } else {
          dur = Number(ch.duration ?? 0)
        }

        // Determine watch time used for this chapter (optimistic for current chapter)
        const watch = String(ch.id) === String(currentChapterRef.current?.id) ? secs : serverWatch

        const isCompleted = Boolean(chapProgress?.isCompleted)
        const pct = isCompleted ? 100 : (dur > 0 ? Math.min((watch / dur) * 100, 100) : 0)

        return {
          chapterId: ch.id,
          title: ch.title || ch.titre || '',
          watchTime: watch,
          duration: dur,
          pct: Number.isFinite(pct) ? Number(pct.toFixed(2)) : 0,
          isCompleted,
        }
      })

      const totalPctSum = contributions.reduce((acc: number, c: any) => acc + (c.isCompleted ? 100 : (Number(c.pct) || 0)), 0)
      const overallCalculated = chapters.length > 0 ? totalPctSum / chapters.length : 0

      console.debug('[Progress Live Math]', {
        timestamp: new Date().toISOString(),
        currentChapterId: currentChapterRef.current?.id ?? null,
        secondsReported: secs,
        contributions,
        overallCalculated: Number(overallCalculated.toFixed(2)),
        enrollmentId: enrollment?.id ?? null,
      })

      // Exponential backoff with jitter for refresh calls to avoid 429
      const refreshNow = Date.now()
      const THROTTLE_MS = 30_000
      const BASE_BACKOFF_MS = 10_000
      const MAX_BACKOFF_MS = 120_000

      // Respect any in-flight backoff window
      if (refreshNow < progressBackoffRef.current.nextAllowed) {
        return
      }

      if (!onRefreshProgress) return
      if (refreshNow - lastProgressRefreshRef.current <= THROTTLE_MS) return

      lastProgressRefreshRef.current = refreshNow
      try {
        await onRefreshProgress()
        // success -> reset backoff
        progressBackoffRef.current.attempts = 0
        progressBackoffRef.current.nextAllowed = 0
      } catch (err: any) {
        const status = err?.response?.status ?? (err && typeof err.status === 'number' ? err.status : null)
        if (status === 429) {
          // increase attempts and compute backoff
          progressBackoffRef.current.attempts = Math.min((progressBackoffRef.current.attempts || 0) + 1, 6)
          const exp = Math.pow(2, progressBackoffRef.current.attempts)
          const backoff = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * exp)
          // jitter up to 50%
          const jitter = Math.floor(Math.random() * Math.floor(backoff * 0.5))
          const wait = backoff + jitter
          progressBackoffRef.current.nextAllowed = refreshNow + wait
          lastProgressRefreshRef.current = progressBackoffRef.current.nextAllowed
          console.warn(`[Progress Refresh] 429 received - backing off for ${Math.round(wait/1000)}s (attempt ${progressBackoffRef.current.attempts})`)
        } else {
          console.error('[Progress Refresh] Failed to refresh progress:', err)
        }
      }
    },
    [onRefreshProgress, enrollment, isUserEnrolled, allChapters, tryAutoAdvanceToNext, videoDurationOverride],
  )

  const defaultChapterId = useMemo(() => {
    const firstAccessible = allChapters.find((c: any) => isChapterAccessible(String(c.id)))
    return firstAccessible ? String(firstAccessible.id) : null
  }, [allChapters, isChapterAccessible])

  const currentChapter = selectedChapter
    ? allChapters.find((c: any) => String(c.id) === String(selectedChapter))
    : defaultChapterId
      ? allChapters.find((c: any) => String(c.id) === String(defaultChapterId))
      : allChapters.length > 0
        ? allChapters[0]
        : null

  useEffect(() => {
    if (currentChapter) {
      console.log(`📖 [CoursePlayer] Current chapter:`, {
        id: currentChapter.id,
        title: currentChapter.title,
        titre: currentChapter.titre,
        videoUrl: currentChapter.videoUrl,
        fullObject: currentChapter
      });
      currentChapterRef.current = currentChapter
    }
  }, [currentChapter]);

  useEffect(() => {
    if (!courseSession || courseSession.chapters.length === 0) return

    const sessionCurrentId = courseSession.currentChapterId ? String(courseSession.currentChapterId) : null
    if (!selectedChapter && sessionCurrentId && courseSession.isChapterAccessible(sessionCurrentId)) {
      setSelectedChapter(sessionCurrentId)
      return
    }

    if (selectedChapter && !courseSession.isChapterAccessible(String(selectedChapter))) {
      const firstAccessible = courseSession.chapters.find((chapter) => chapter.access.canAccess)
      setSelectedChapter(firstAccessible?.chapterId ?? null)
    }
  }, [courseSession, courseSession?.chapters, courseSession?.currentChapterId, selectedChapter])

  useEffect(() => {
    if (!currentChapter?.id) return
    if (trackingSentRef.current.start) return
    const accessAllowed = isChapterAccessible(String(currentChapter.id))
    if (!accessAllowed) return
    trackingSentRef.current.start = true
    void coursesApi.trackStart(resolvedCourseId).catch(() => {
      // ignore tracking failures
    })
  }, [resolvedCourseId, currentChapter?.id, isChapterAccessible])

  // Clear optimistic overrides when switching chapters
  useEffect(() => {
    setWatchTimeOverride(null)
    setVideoDurationOverride(null)
  }, [currentChapter?.id])

  const currentChapterIndex = currentChapter ? allChapters.findIndex((c: any) => c.id === currentChapter.id) : -1

  const progress = useMemo(() => {
    if (!currentChapter?.id) return 0
    if (!enrollment?.progress || !Array.isArray(enrollment.progress)) return 0

    const chapterProgress = enrollment.progress.find((p: any) => String(p.chapterId) === String(currentChapter.id))
    if (chapterProgress?.isCompleted) return 100
    // Prefer optimistic overrides when available (live updates from the player)
    const videoDurationFromProgress = Number(chapterProgress?.videoDuration ?? 0)
    const durationSeconds =
      (videoDurationOverride && videoDurationOverride > 0)
        ? videoDurationOverride
        : videoDurationFromProgress > 0
        ? videoDurationFromProgress
        : Number(currentChapter.duration ?? 0)

    const watchTimeSeconds =
      watchTimeOverride !== null ? Number(watchTimeOverride) : Number(chapterProgress?.watchTime ?? 0)

    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0

    return Math.min((watchTimeSeconds / durationSeconds) * 100, 100)
  }, [currentChapter?.id, currentChapter?.duration, enrollment?.progress, videoDurationOverride, watchTimeOverride])

  const chapterProgressById = useMemo(() => {
    const progressById: Record<string, number> = {}
    const progressItems = Array.isArray(enrollment?.progress) ? enrollment.progress : []
    const currentId = currentChapter?.id ? String(currentChapter.id) : null

    for (const chapter of allChapters) {
      const chapterId = String(chapter.id)
      const chapterProgress = progressItems.find((p: any) => String(p.chapterId) === chapterId)

      if (chapterProgress?.isCompleted) {
        progressById[chapterId] = 100
        continue
      }

      const progressDuration = Number(chapterProgress?.videoDuration ?? 0)
      const chapterDuration = Number(chapter.duration ?? 0)
      const isCurrent = currentId === chapterId
      const durationSeconds =
        isCurrent && Number(videoDurationOverride ?? 0) > 0
          ? Number(videoDurationOverride)
          : progressDuration > 0
            ? progressDuration
            : chapterDuration

      const watchTimeSeconds =
        isCurrent && watchTimeOverride !== null
          ? Number(watchTimeOverride)
          : Number(chapterProgress?.watchTime ?? 0)

      progressById[chapterId] =
        Number.isFinite(durationSeconds) && durationSeconds > 0
          ? Math.min(Math.max((watchTimeSeconds / durationSeconds) * 100, 0), 100)
          : 0
    }

    return progressById
  }, [allChapters, currentChapter?.id, enrollment?.progress, videoDurationOverride, watchTimeOverride])

  // Use overall course progress from enrollment for header/sidebar display
  const overallProgress = Number(enrollment?.progressPercentage ?? 0)

  const completedChaptersCount = useMemo(() => {
    if (!enrollment?.progress || !Array.isArray(enrollment.progress)) return 0
    return enrollment.progress.filter((p: any) => p?.isCompleted).length
  }, [enrollment?.progress])

  const remainingChaptersCount = useMemo(() => {
    const total = Array.isArray(allChapters) ? allChapters.length : 0
    return Math.max(total - completedChaptersCount, 0)
  }, [allChapters, completedChaptersCount])

  const isCurrentChapterCompleted = useMemo(() => {
    if (!currentChapter?.id) return false
    if (!enrollment?.progress || !Array.isArray(enrollment.progress)) return false
    const chapterProgress = enrollment.progress.find((p: any) => String(p.chapterId) === String(currentChapter.id))
    return Boolean(chapterProgress?.isCompleted)
  }, [currentChapter?.id, enrollment?.progress])

  const nextChapterId = useMemo(() => {
    if (!currentChapter?.id) return null
    if (!Array.isArray(allChapters)) return null
    const idx = allChapters.findIndex((c: any) => String(c.id) === String(currentChapter.id))
    if (idx === -1) return null
    const next = allChapters[idx + 1]
    return next ? String(next.id) : null
  }, [allChapters, currentChapter?.id])

  const tryUnlockImmediateNextChapter = useCallback(
    async (targetChapterId: string): Promise<boolean> => {
      if (!isUserEnrolled || !effectiveSequentialProgressionEnabled || !currentChapter?.id) return false

      const currentId = String(currentChapter.id)
      const targetId = String(targetChapterId)
      const currentIndex = allChapters.findIndex((c: any) => String(c.id) === currentId)
      if (currentIndex === -1) return false
      const immediateNext = allChapters[currentIndex + 1]
      if (!immediateNext || String(immediateNext.id) !== targetId) return false

      const currentProgress = Array.isArray(enrollment?.progress)
        ? enrollment.progress.find((p: any) => String(p.chapterId) === currentId)
        : null

      const isCompleted = Boolean(currentProgress?.isCompleted)
      const storedWatch = Number(currentProgress?.watchTime ?? 0)
      let localHighWaterWatch = 0
      if (typeof window !== "undefined") {
        try {
          const storageKey = `course_progress_${userStorageScopeId}_${resolvedCourseId}_${currentId}`
          const raw = localStorage.getItem(storageKey)
          if (raw) {
            const parsed = JSON.parse(raw)
            localHighWaterWatch = Number(parsed?.time ?? 0)
          }
        } catch {
          localHighWaterWatch = 0
        }
      }
      const effectiveWatch =
        String(currentChapterRef.current?.id || "") === currentId && watchTimeOverride !== null
          ? Number(watchTimeOverride)
          : Math.max(storedWatch, localHighWaterWatch)

      const durationFromProgress = Number((currentProgress as any)?.videoDuration ?? 0)
      const durationFromChapter = Number(currentChapter?.duration ?? 0)
      const effectiveDuration =
        String(currentChapterRef.current?.id || "") === currentId && Number(videoDurationOverride ?? 0) > 0
          ? Number(videoDurationOverride)
          : durationFromProgress > 0
            ? durationFromProgress
            : durationFromChapter

      const reachedUnlockThreshold =
        isCompleted ||
        (effectiveDuration > 0 && effectiveWatch > 0 && ((effectiveWatch / effectiveDuration) * 100) >= 99)

      if (!reachedUnlockThreshold) return false

      try {
        if (!isCompleted) {
          if (effectiveWatch > 0) {
            await coursesApi.updateChapterWatchTime(
              resolvedCourseId,
              currentId,
              Math.floor(effectiveWatch),
              effectiveDuration > 0 ? Math.floor(effectiveDuration) : undefined,
            )
          }
          await coursesApi.completeChapterEnrollment(resolvedCourseId, currentId)
        }
      } catch {
        // Even if completion endpoint races, continue with refresh/check
      }

      if (onRefreshProgress) {
        await onRefreshProgress().catch(() => null)
      }
      if (onRefreshUnlockedChapters) {
        await onRefreshUnlockedChapters().catch(() => null)
      }

      setAccessibleChapters({})
      setChapterAccessReason({})
      accessCheckInFlight.current = {}

      return ensureChapterAccessCached(targetId)
    },
    [
      isUserEnrolled,
      effectiveSequentialProgressionEnabled,
      currentChapter?.id,
      currentChapter?.duration,
      allChapters,
      enrollment?.progress,
      watchTimeOverride,
      videoDurationOverride,
      resolvedCourseId,
      userStorageScopeId,
      onRefreshProgress,
      onRefreshUnlockedChapters,
      ensureChapterAccessCached,
    ],
  )

  const attemptSelectChapter = useCallback(async (chapterId: string): Promise<boolean> => {
    const chapter = allChapters.find((c: any) => String(c.id) === String(chapterId))
    if (!chapter) return false
    console.info("[CourseNextFlow] handleSelectChapter called", {
      chapterId: String(chapterId),
      isUserEnrolled,
      selectedChapter,
    })

    if (courseSession) {
      const hasFreshPaidUnlock =
        Boolean(chapter.isPaidChapter) &&
        (Boolean(unlockedMap.get(String(chapterId))?.isUnlocked) ||
          (chapterUnlockState === "unlocked" &&
            pendingPaidChapterId &&
            String(pendingPaidChapterId) === String(chapterId)))

      if (hasFreshPaidUnlock) {
        setSelectedChapter(String(chapterId))
        return true
      }

      if (courseSession.chapters.length === 0) {
        const isFirstChapter = Boolean(firstChapterId && String(chapterId) === firstChapterId)
        if (isFirstChapter) {
          setSelectedChapter(String(chapterId))
          return true
        }
        toast({
          title: "Chapter locked",
          description: "Finish this chapter to unlock the next one.",
          variant: "destructive",
        })
        return false
      }

      const result = await courseSession.selectChapter(String(chapterId))
      if (!result.success) {
        const reason =
          result.reason ||
          mapLockCodeToReason(result.lockCode) ||
          "Finish this chapter to unlock the next one."
        toast({
          title: "Chapter locked",
          description: reason,
          variant: "destructive",
        })
        return false
      }
      setSelectedChapter(String(chapterId))
      return true
    }

    const isFirstChapterFallback = Boolean(firstChapterId && String(chapterId) === firstChapterId)
    if (isFirstChapterFallback) {
      setSelectedChapter(String(chapterId))
      return true
    }

    toast({
      title: "Chapter locked",
      description: "Finish this chapter to unlock the next one.",
      variant: "destructive",
    })
    return false
  }, [
    allChapters,
    isUserEnrolled,
    toast,
    selectedChapter,
    courseSession,
    mapLockCodeToReason,
    firstChapterId,
    unlockedMap,
    chapterUnlockState,
    pendingPaidChapterId,
  ])

  const handleSelectChapter = useCallback(async (chapterId: string) => {
    await attemptSelectChapter(chapterId)
  }, [attemptSelectChapter])

  useEffect(() => {
    if (!pendingPaidChapterId) return
    const targetChapter = allChapters.find((c: any) => String(c.id) === String(pendingPaidChapterId))
    if (!targetChapter) return
    if (!isChapterAccessible(String(targetChapter.id))) return
    void attemptSelectChapter(String(targetChapter.id))
  }, [pendingPaidChapterId, allChapters, isChapterAccessible, attemptSelectChapter])

  useEffect(() => {
    if (!requestedChapterId) return
    const targetChapter = allChapters.find((c: any) => String(c.id) === String(requestedChapterId))
    if (!targetChapter) {
      onRequestedChapterConsumed?.(String(requestedChapterId))
      return
    }

    if (!isUserEnrolled) {
      console.info("[CourseNextFlow] Requested chapter deferred until enrollment is active", {
        requestedChapterId: String(requestedChapterId),
      })
      return
    }

    console.info("[CourseNextFlow] Requested chapter selection", {
      requestedChapterId: String(requestedChapterId),
      isUserEnrolled,
    })

    void attemptSelectChapter(String(targetChapter.id))
      .then(() => {
        onRequestedChapterConsumed?.(String(targetChapter.id))
      })
      .catch((error) => {
        console.error("[CourseNextFlow] Requested chapter selection failed", error)
      })
	  }, [requestedChapterId, allChapters, attemptSelectChapter, onRequestedChapterConsumed, isUserEnrolled])

	  const isCourseCompleted = useMemo(() => {
	    if (!Array.isArray(allChapters) || allChapters.length === 0) return false
	    return completedChaptersCount >= allChapters.length
  }, [allChapters, completedChaptersCount])

  // Compute a single chapter percent to display (prefer optimistic/live values)
  const currentChapterProgressData = currentChapter?.id
    ? {
        watchTime: watchTimeOverride ?? Number(enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))?.watchTime ?? 0),
        duration: videoDurationOverride ?? (Number(enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))?.videoDuration ?? 0) || Number(currentChapter?.duration ?? 0)),
      }
    : null

  const displayChapterPercent = currentChapterProgressData && currentChapterProgressData.duration > 0
    ? Math.min((Number(currentChapterProgressData.watchTime) / Number(currentChapterProgressData.duration)) * 100, 100)
    : progress

  const handleCompleteCourse = useCallback(async () => {
    if (!isCourseCompleted) return
    try {
      await coursesApi.completeCourseEnrollment(resolvedCourseId)

      toast({ title: "Course completed" })
      if (onRefreshProgress) {
        await onRefreshProgress()
      }
      if (onRefreshUnlockedChapters) {
        await onRefreshUnlockedChapters()
      }
    } catch (error) {
      toast({
        title: "Could not complete course",
        description:
          typeof error === "object" && error && "message" in error
            ? String((error as any).message)
            : "Please try again.",
        variant: "destructive",
      })
    }
  }, [resolvedCourseId, isCourseCompleted, onRefreshProgress, onRefreshUnlockedChapters, toast])

  const handleEnrollNow = useCallback(async () => {
    console.debug('[CoursePlayer] handleEnrollNow called', {
      currentChapterId: currentChapter?.id,
      currentChapterIsPreview: currentChapter?.isPreview,
      currentChapterIsPaid: currentChapter?.isPaidChapter,
      enrollment,
      selectedChapter,
    })
    if (enrollment) return

    const targetChapterId = currentChapter?.id ? String(currentChapter.id) : undefined
    const targetChapterPaid = Boolean(currentChapter?.isPaidChapter)

    // Delegate chapter-aware enrollment/payment decision to page handler when available.
    if (onOpenEnrollment) {
      await onOpenEnrollment({
        targetChapterId,
        targetChapterPaid,
        source: "player-lock",
      })
      return
    }

    // Fallback for when no parent handler is provided
    try {
      await coursesApi.enroll(resolvedCourseId)
      toast({ title: "Enrolled successfully" })
      if (onRefreshProgress) {
        await onRefreshProgress()
      }
      if (onRefreshUnlockedChapters) {
        await onRefreshUnlockedChapters()
      }
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: typeof error === "object" && error && "message" in error ? String((error as any).message) : "Please try again.",
        variant: "destructive",
      })
    }
  }, [resolvedCourseId, enrollment, onOpenEnrollment, onRefreshProgress, onRefreshUnlockedChapters, toast, currentChapter, selectedChapter])

  // Stable reference for onChapterComplete so the video player never re-initializes.
  const courseSessionRef = useRef(courseSession)
  useEffect(() => { courseSessionRef.current = courseSession }, [courseSession])
  const handleChapterComplete = useCallback((chapterId: string) => {
    courseSessionRef.current?.reportChapterComplete(chapterId)
    void onRefreshProgress?.()
    void onRefreshUnlockedChapters?.()
  }, [onRefreshProgress, onRefreshUnlockedChapters])

  return (
    <div
      className={cn(
        "min-h-dvh transition-colors duration-500",
        theaterMode
          ? "relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(142,120,251,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(71,199,234,0.16),transparent_32%),linear-gradient(180deg,#fbfbff_0%,#f8fafc_52%,#eef2ff_100%)] text-slate-950"
          : "bg-gray-50",
      )}
      data-testid={theaterMode ? "course-player-theater" : "course-player-standard"}
    >
      {theaterMode && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]">
          <div className="pointer-events-auto flex w-full max-w-6xl flex-col gap-3 rounded-2xl border border-white/80 bg-white/88 p-2 shadow-xl shadow-slate-200/70 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 px-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8e78fb]/10 text-[#8e78fb]">
                <Focus className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">Light theater mode</p>
                <p className="truncate text-xs text-slate-500">Focused lesson view with reduced navigation noise</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTheaterMode(false)}
                className="h-11 gap-2 rounded-xl border-slate-200 bg-white px-3 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950"
                data-testid="exit-theater-mode"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Exit
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setTheaterMode(false)}
                className="h-11 gap-2 rounded-xl bg-slate-950 px-3 text-white shadow-sm hover:bg-slate-800"
                data-testid="theater-toolbar-standard-view"
              >
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
                Standard view
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={cn(theaterMode ? "mx-auto max-w-6xl px-4 pb-10 pt-32 sm:pt-28" : "container mx-auto px-4 py-6")}>
        {!theaterMode && (
          <>
            <CourseHeader
              creatorSlug={creatorSlug}
              slug={slug}
              course={course}
              progress={displayChapterPercent}
              allChapters={allChapters}
              completedChaptersCount={completedChaptersCount}
              remainingChaptersCount={remainingChaptersCount}
              currentChapterProgress={displayChapterPercent}
            />
            <div className="mb-4 flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setTheaterMode(true)}
                className="btn-press-active h-11 gap-2 rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:border-[#8e78fb]/40 hover:bg-[#8e78fb]/5 hover:text-[#8e78fb]"
                data-testid="theater-mode-toggle"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                Focus view
              </Button>
            </div>
          </>
        )}

        <div className={cn(theaterMode ? "grid grid-cols-1 gap-5" : "grid grid-cols-1 gap-6 lg:grid-cols-7 xl:grid-cols-3")}>
          <div className={cn(theaterMode ? "space-y-5" : "space-y-4 lg:col-span-4 xl:col-span-2")}>
            {isCourseCompleted ? (
              <div className={cn("rounded-lg border p-4", theaterMode ? "border-white/80 bg-white/90 shadow-sm backdrop-blur" : "bg-white")}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium">You completed all chapters</div>
                    <div className={cn("text-xs", theaterMode ? "text-slate-500" : "text-muted-foreground")}>
                      Course completion is auto-recorded. Use this button only if you want to retry finalization now.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className={cn(
                "relative",
                theaterMode && "overflow-hidden rounded-[1.75rem] border border-white/90 bg-white p-2 shadow-[0_28px_90px_-28px_rgba(51,65,85,0.48)] ring-1 ring-slate-200/70",
              )}
            >
              {theaterMode && (
                <div className="pointer-events-none absolute inset-x-8 -top-8 h-16 rounded-full bg-[#8e78fb]/18 blur-3xl" aria-hidden="true" />
              )}
              <EnhancedVideoPlayer
                creatorSlug={creatorSlug}
                currentChapter={currentChapter}
                isChapterAccessible={isChapterAccessible}
                enrollment={enrollment}
                slug={slug}
                courseId={resolvedCourseId}
                onWatchTimeUpdate={handleWatchTimeUpdate}
                onEnrollNow={handleEnrollNow}
                onProgressSaved={onRefreshProgress}
                onChapterComplete={handleChapterComplete}
              />

            </div>

            <ChapterTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentChapter={currentChapter}
              currentChapterIndex={currentChapterIndex}
              allChapters={allChapters}
              isTheaterMode={theaterMode}
              isCurrentChapterCompleted={isCurrentChapterCompleted}
              nextChapterId={nextChapterId}
              courseId={resolvedCourseId}
              onRefreshCourse={onRefreshCourse}
              onGoToNextChapter={async () => {
                console.info("[CourseNextFlow] onGoToNextChapter invoked from ChapterTabs", {
                  currentChapterId: currentChapter?.id ? String(currentChapter.id) : null,
                  nextChapterId: nextChapterId ? String(nextChapterId) : null,
                })
                if (!nextChapterId) {
                  console.warn("[CourseNextFlow] onGoToNextChapter blocked: no next chapter id")
                  return
                }

                if (courseSession) {
                  const result = await courseSession.goToNextChapter()
                  if (!result.success) {
                    const resultChapterId = result.chapterId ? String(result.chapterId) : nextChapterId
                    if (result.needsPayment && onOpenEnrollment) {
                      await onOpenEnrollment({
                        targetChapterId: resultChapterId,
                        targetChapterPaid: true,
                        source: "sidebar-next",
                      })
                    } else {
                      toast({
                        title: "Next chapter locked",
                        description: result.reason || "Finish this chapter to unlock the next one.",
                        variant: "destructive",
                      })
                    }
                  } else {
                    const targetChapterId = result.chapterId ? String(result.chapterId) : nextChapterId
                    setSelectedChapter(targetChapterId)
                    setAccessibleChapters({})
                    setChapterAccessReason({})
                    accessCheckInFlight.current = {}
                    if (onRefreshProgress) {
                      await onRefreshProgress().catch(() => null)
                    }
                    if (onRefreshUnlockedChapters) {
                      await onRefreshUnlockedChapters().catch(() => null)
                    }
                  }
                  return
                }

                await handleSelectChapter(nextChapterId)
                if (onRefreshUnlockedChapters) {
                  await onRefreshUnlockedChapters()
                }
              }}
            />
          </div>

          {!theaterMode && (
            <CourseSidebar
              course={course}
              enrollment={enrollment}
              allChapters={allChapters}
              progress={displayChapterPercent}
              completedChaptersCount={completedChaptersCount}
              remainingChaptersCount={remainingChaptersCount}
              selectedChapter={selectedChapter}
              setSelectedChapter={handleSelectChapter}
              isChapterAccessible={isChapterAccessible}
              courseId={resolvedCourseId}
              chapterUnlockState={chapterUnlockState}
              pendingPaidChapterId={pendingPaidChapterId}
              onRetryUnlock={onRetryUnlock}
              onOpenEnrollment={onOpenEnrollment}
              courseSession={courseSession}
              currentChapterProgress={
                currentChapter?.id
                  ? {
                      watchTime: watchTimeOverride ?? Number(enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))?.watchTime ?? 0),
                      duration: videoDurationOverride ?? (Number(enrollment?.progress?.find((p: any) => String(p.chapterId) === String(currentChapter.id))?.videoDuration ?? 0) || Number(currentChapter?.duration ?? 0)),
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
