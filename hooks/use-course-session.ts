"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { coursesApi } from "@/lib/api/learning/courses.api"
import { tokenStorage } from "@/lib/token-storage"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ChapterAccess {
  canAccess: boolean
  lockCode: string
  lockReason?: string
  needsPayment?: boolean
  chapterPrice?: number
  requiredChapterId?: string
}

export interface SessionChapter {
  chapterId: string
  chapterTitle: string
  sectionId: string
  sectionTitle: string
  index: number
  isPreview: boolean
  isPaidChapter: boolean
  isCompleted: boolean
  watchTime: number
  videoDuration: number
  access: ChapterAccess
}

export interface NextChapterAction {
  action: "navigate" | "blocked" | "course_complete"
  chapterId?: string
  chapterTitle?: string
  sectionId?: string
  lockCode?: string
  reason?: string
  needsPayment?: boolean
  chapterPrice?: number
  requiredChapterId?: string
}

export interface CourseSessionState {
  /** Ordered list of chapters with backend-authoritative access decisions. */
  chapters: SessionChapter[]
  /** True when the user has an active enrollment. */
  isEnrolled: boolean
  /** Whether the course enforces sequential progression. */
  sequentialProgressionEnabled: boolean
  /** Custom unlock message from the creator. */
  unlockMessage?: string

  /** Overall course progress (0–100). */
  progressPercent: number
  completedChapters: number
  totalChapters: number

  /** Currently selected chapter ID. */
  currentChapterId: string | null
  /** Backend's deterministic next-chapter action for currentChapterId. */
  nextChapterAction: NextChapterAction | null
}

type SelectChapterResult = { success: true } | { success: false; reason: string; lockCode?: string; needsPayment?: boolean }

export interface CourseSession extends CourseSessionState {
  // ── Derived state ─────────────────────────────────────────────────────────
  currentChapter: SessionChapter | null
  isCurrentChapterCompleted: boolean
  nextChapterId: string | null
  canGoToNext: boolean
  nextBlockReason: string | null

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Select a chapter. Returns explicit success/failure. */
  selectChapter: (chapterId: string) => Promise<SelectChapterResult>
  /** Navigate to next chapter. Returns explicit success/failure. No-ops are forbidden. */
  goToNextChapter: () => Promise<SelectChapterResult>
  /** Report watch time from the video player. Updates optimistic state and refreshes session when threshold crossed. */
  reportWatchTime: (chapterId: string, seconds: number, duration?: number) => void
  /** Notify that the video player marked a chapter as completed. */
  reportChapterComplete: (chapterId: string) => void
  /** Force-refresh session state from the backend. */
  refreshSession: () => Promise<void>
  /** Check if a chapter is accessible (synchronous, from cached session). */
  isChapterAccessible: (chapterId: string) => boolean

  /** True while initial session is loading. */
  isLoading: boolean
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useCourseSession(
  courseId: string,
  options?: {
    /** Initial enrollment data (from page-level fetch). Used until first session fetch completes. */
    initialEnrollment?: any
    /** Callback to refresh enrollment on the page level (backward compat). */
    onRefreshEnrollment?: () => Promise<void>
  },
): CourseSession {
  const [state, setState] = useState<CourseSessionState>({
    chapters: [],
    isEnrolled: Boolean(options?.initialEnrollment),
    sequentialProgressionEnabled: false,
    progressPercent: 0,
    completedChapters: 0,
    totalChapters: 0,
    currentChapterId: null,
    nextChapterAction: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Refs for latest values inside callbacks (avoid stale closures)
  const stateRef = useRef(state)
  stateRef.current = state
  const courseIdRef = useRef(courseId)
  courseIdRef.current = courseId

  // Track which chapters have been locally completed (optimistic) to avoid flicker
  const localCompletionRef = useRef<Set<string>>(new Set())

  // Throttle session refreshes (minimum 5s between calls)
  const lastRefreshRef = useRef(0)
  const REFRESH_THROTTLE_MS = 5_000

  // ── Session fetch ─────────────────────────────────────────────────────────

  const fetchSession = useCallback(
    async (currentChapterId?: string): Promise<CourseSessionState | null> => {
      try {
        const raw = await coursesApi.getCourseSession(courseIdRef.current, currentChapterId)
        const data = raw?.data ?? raw
        if (!data || typeof data !== "object") return null

        const chapters: SessionChapter[] = Array.isArray(data.chapters)
          ? data.chapters.map((c: any) => ({
              chapterId: String(c.chapterId ?? ""),
              chapterTitle: String(c.chapterTitle ?? ""),
              sectionId: String(c.sectionId ?? ""),
              sectionTitle: String(c.sectionTitle ?? ""),
              index: Number(c.index ?? 0),
              isPreview: Boolean(c.isPreview),
              isPaidChapter: Boolean(c.isPaidChapter),
              isCompleted: Boolean(c.isCompleted) || localCompletionRef.current.has(String(c.chapterId ?? "")),
              watchTime: Number(c.watchTime ?? 0),
              videoDuration: Number(c.videoDuration ?? 0),
              access: {
                canAccess: Boolean(c.canAccess),
                lockCode: String(c.lockCode ?? ""),
                lockReason: c.lockReason ? String(c.lockReason) : undefined,
                needsPayment: c.needsPayment ? Boolean(c.needsPayment) : undefined,
                chapterPrice: c.chapterPrice != null ? Number(c.chapterPrice) : undefined,
                requiredChapterId: c.requiredChapterId ? String(c.requiredChapterId) : undefined,
              },
            }))
          : []

        const nextAction: NextChapterAction | null = data.nextChapterAction
          ? {
              action: data.nextChapterAction.action,
              chapterId: data.nextChapterAction.chapterId,
              chapterTitle: data.nextChapterAction.chapterTitle,
              sectionId: data.nextChapterAction.sectionId,
              lockCode: data.nextChapterAction.lockCode,
              reason: data.nextChapterAction.reason,
              needsPayment: data.nextChapterAction.needsPayment,
              chapterPrice: data.nextChapterAction.chapterPrice,
              requiredChapterId: data.nextChapterAction.requiredChapterId,
            }
          : null

        return {
          chapters,
          isEnrolled: Boolean(data.isEnrolled),
          sequentialProgressionEnabled: Boolean(data.sequentialProgressionEnabled),
          unlockMessage: data.unlockMessage ? String(data.unlockMessage) : undefined,
          progressPercent: Number(data.progressPercent ?? 0),
          completedChapters: Number(data.completedChapters ?? 0),
          totalChapters: Number(data.totalChapters ?? 0),
          currentChapterId: stateRef.current.currentChapterId,
          nextChapterAction: nextAction,
        }
      } catch (err) {
        console.error("[useCourseSession] Failed to fetch session:", err)
        return null
      }
    },
    [],
  )

  const refreshSession = useCallback(async () => {
    const now = Date.now()
    if (now - lastRefreshRef.current < REFRESH_THROTTLE_MS) return
    lastRefreshRef.current = now

    const currentId = stateRef.current.currentChapterId
    const sessionState = await fetchSession(currentId || undefined)
    if (sessionState) {
      setState((prev) => ({
        ...sessionState,
        currentChapterId: prev.currentChapterId,
      }))
      // Also trigger page-level enrollment refresh for backward compat
      options?.onRefreshEnrollment?.().catch(() => {})
    }
  }, [fetchSession, options?.onRefreshEnrollment])

  // Initial fetch
  useEffect(() => {
    let active = true
    setIsLoading(true)
    fetchSession().then((sessionState) => {
      if (!active) return
      if (sessionState) {
        // Auto-select first accessible chapter
        const firstAccessible = sessionState.chapters.find((c) => c.access.canAccess)
        setState({
          ...sessionState,
          currentChapterId: firstAccessible?.chapterId ?? sessionState.chapters[0]?.chapterId ?? null,
        })
      }
      setIsLoading(false)
    })
    return () => { active = false }
  }, [courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ─────────────────────────────────────────────────────────

  const currentChapter = useMemo(
    () => state.chapters.find((c) => c.chapterId === state.currentChapterId) ?? null,
    [state.chapters, state.currentChapterId],
  )

  const isCurrentChapterCompleted = useMemo(
    () => Boolean(currentChapter?.isCompleted) || localCompletionRef.current.has(state.currentChapterId || ""),
    [currentChapter?.isCompleted, state.currentChapterId],
  )

  const nextChapterId = useMemo(() => {
    if (!currentChapter) return null
    const next = state.chapters[currentChapter.index + 1]
    return next?.chapterId ?? null
  }, [state.chapters, currentChapter])

  const canGoToNext = useMemo(() => {
    if (!state.nextChapterAction) return false
    return state.nextChapterAction.action === "navigate"
  }, [state.nextChapterAction])

  const nextBlockReason = useMemo(() => {
    if (!state.nextChapterAction) return null
    if (state.nextChapterAction.action === "course_complete") return "You've completed all chapters!"
    if (state.nextChapterAction.action === "blocked") {
      return state.nextChapterAction.reason || "Next chapter is locked."
    }
    return null
  }, [state.nextChapterAction])

  // ── isChapterAccessible (synchronous) ─────────────────────────────────────

  const isChapterAccessible = useCallback(
    (chapterId: string): boolean => {
      const chapter = stateRef.current.chapters.find((c) => c.chapterId === chapterId)
      if (!chapter) return false
      return chapter.access.canAccess
    },
    [],
  )

  // ── selectChapter ────────────────────────────────────────────────────────

  const selectChapter = useCallback(
    async (chapterId: string): Promise<SelectChapterResult> => {
      const chapter = stateRef.current.chapters.find((c) => c.chapterId === chapterId)
      if (!chapter) return { success: false, reason: "Chapter not found." }

      if (!chapter.access.canAccess) {
        return {
          success: false,
          reason: chapter.access.lockReason || "Chapter is locked.",
          lockCode: chapter.access.lockCode,
          needsPayment: chapter.access.needsPayment,
        }
      }

      setState((prev) => ({ ...prev, currentChapterId: chapterId }))

      // Fetch fresh session with new current chapter for next-action
      const sessionState = await fetchSession(chapterId)
      if (sessionState) {
        setState((prev) => ({
          ...sessionState,
          currentChapterId: chapterId,
        }))
      }

      // Start chapter on backend (best-effort)
      try {
        const sectionId = chapter.sectionId
        if (stateRef.current.isEnrolled) {
          await coursesApi.startChapter(courseIdRef.current, sectionId, chapterId, { watchTime: 0 })
        }
      } catch (err) {
        console.warn("[useCourseSession] Failed to start chapter on backend:", err)
      }

      return { success: true }
    },
    [fetchSession],
  )

  // ── goToNextChapter ──────────────────────────────────────────────────────

  const goToNextChapter = useCallback(async (): Promise<SelectChapterResult> => {
    const currentState = stateRef.current
    const action = currentState.nextChapterAction

    if (!action) {
      return { success: false, reason: "No next chapter information available." }
    }

    if (action.action === "course_complete") {
      return { success: false, reason: "You've completed all chapters!" }
    }

    if (action.action === "blocked") {
      // The current chapter might just have been completed on the frontend side.
      // Try a fresh session fetch to get updated access decisions.
      const freshSession = await fetchSession(currentState.currentChapterId || undefined)
      if (freshSession) {
        setState((prev) => ({ ...freshSession, currentChapterId: prev.currentChapterId }))
        const freshAction = freshSession.nextChapterAction
        if (freshAction?.action === "navigate" && freshAction.chapterId) {
          return selectChapter(freshAction.chapterId)
        }
      }

      return {
        success: false,
        reason: action.reason || "Next chapter is locked.",
        lockCode: action.lockCode,
        needsPayment: action.needsPayment,
      }
    }

    // action === "navigate"
    if (!action.chapterId) {
      return { success: false, reason: "Next chapter not available." }
    }

    return selectChapter(action.chapterId)
  }, [fetchSession, selectChapter])

  // ── reportWatchTime ──────────────────────────────────────────────────────

  // Track whether a session refresh has been scheduled for each chapter
  const completionRefreshScheduledRef = useRef<Set<string>>(new Set())
  // Track last watch time per chapter to throttle state updates
  const lastReportedWatchTimeRef = useRef<Record<string, number>>({})

  const reportWatchTime = useCallback(
    (chapterId: string, seconds: number, duration?: number) => {
      const newWatchTime = Math.max(
        stateRef.current.chapters.find(c => c.chapterId === chapterId)?.watchTime ?? 0,
        Math.floor(seconds),
      )
      const lastReported = lastReportedWatchTimeRef.current[chapterId] ?? -1

      // Only update React state when watch time changes by >=2 seconds to prevent
      // re-rendering courseSession consumers every single polling tick.
      if (Math.abs(newWatchTime - lastReported) >= 2) {
        lastReportedWatchTimeRef.current[chapterId] = newWatchTime
        setState((prev) => {
          const chapters = prev.chapters.map((c) => {
            if (c.chapterId !== chapterId) return c
            const effectiveDuration = duration && duration > 0 ? Math.floor(duration) : c.videoDuration
            return {
              ...c,
              watchTime: newWatchTime,
              videoDuration: effectiveDuration > 0 ? effectiveDuration : c.videoDuration,
            }
          })
          return { ...prev, chapters }
        })
      }

      // Schedule a session refresh when the 90% threshold is crossed
      if (duration && duration > 0 && seconds >= duration * 0.9) {
        if (!completionRefreshScheduledRef.current.has(chapterId)) {
          completionRefreshScheduledRef.current.add(chapterId)
          // Small delay to let the backend process the auto-completion
          setTimeout(() => {
            void refreshSession()
          }, 1500)
        }
      }
    },
    [refreshSession],
  )

  // ── reportChapterComplete ────────────────────────────────────────────────

  const reportChapterComplete = useCallback(
    (chapterId: string) => {
      localCompletionRef.current.add(chapterId)
      // Optimistically mark as completed and unlock the immediately next chapter
      // so sequential progression works without waiting for a backend round-trip.
      setState((prev) => {
        const completedIdx = prev.chapters.findIndex((c) => c.chapterId === chapterId)
        const chapters = prev.chapters.map((c, idx) => {
          if (c.chapterId === chapterId) {
            return { ...c, isCompleted: true }
          }
          // Unlock the immediately next chapter after the one just completed
          if (completedIdx !== -1 && idx === completedIdx + 1 && !c.access.canAccess && c.access.lockCode === 'previous_chapter_incomplete') {
            return { ...c, access: { ...c.access, canAccess: true, lockCode: 'allowed' as const, lockReason: undefined } }
          }
          return c
        })
        const completedChapters = chapters.filter((c) => c.isCompleted).length
        // Also update nextChapterAction optimistically so "Next Chapter" works immediately
        let nextChapterAction = prev.nextChapterAction
        if (completedIdx !== -1 && completedIdx + 1 < chapters.length) {
          const nextCh = chapters[completedIdx + 1]
          if (nextCh.access.canAccess) {
            nextChapterAction = {
              action: 'navigate' as const,
              chapterId: nextCh.chapterId,
              chapterTitle: nextCh.chapterTitle,
              sectionId: nextCh.sectionId,
            }
          }
        }
        return {
          ...prev,
          chapters,
          completedChapters,
          progressPercent: chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0,
          nextChapterAction,
        }
      })
      // Bypass the throttle so next-chapter access is refreshed immediately after completion.
      lastRefreshRef.current = 0
      void refreshSession()
    },
    [refreshSession],
  )

  return {
    ...state,
    currentChapter,
    isCurrentChapterCompleted,
    nextChapterId,
    canGoToNext,
    nextBlockReason,
    selectChapter,
    goToNextChapter,
    reportWatchTime,
    reportChapterComplete,
    refreshSession,
    isChapterAccessible,
    isLoading,
  }
}
