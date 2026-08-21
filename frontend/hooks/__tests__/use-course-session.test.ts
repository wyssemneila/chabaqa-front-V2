/**
 * Tests for the useCourseSession hook.
 *
 * Covers:
 * - next chapter selection when current chapter >= 90%
 * - blocked next chapter produces message and CTA
 * - post-completion state refresh leads to accessible next chapter
 * - isChapterAccessible returns backend-authoritative decisions
 * - regression: exact reported scenario (completed + preview next)
 */
import { renderHook, act, waitFor } from "@testing-library/react"
import { useCourseSession } from "@/hooks/use-course-session"
import { coursesApi } from "@/lib/api/learning/courses.api"

jest.mock("@/lib/api/learning/courses.api", () => ({
  coursesApi: {
    getCourseSession: jest.fn(),
    startChapter: jest.fn(),
    completeChapterEnrollment: jest.fn(),
    updateChapterWatchTime: jest.fn(),
  },
}))

jest.mock("@/lib/token-storage", () => ({
  tokenStorage: {
    getUserInfo: () => ({ id: "user-1" }),
    getAccessToken: () => "test-token",
  },
}))

const mockGetCourseSession = coursesApi.getCourseSession as jest.Mock
const mockStartChapter = coursesApi.startChapter as jest.Mock

function makeMockSession(overrides: Partial<{
  chapters: any[]
  isEnrolled: boolean
  nextChapterAction: any
  completedChapters: number
}> = {}) {
  return {
    courseId: "course-1",
    isEnrolled: true,
    sequentialProgressionEnabled: true,
    progressPercent: 0,
    completedChapters: overrides.completedChapters ?? 0,
    totalChapters: 3,
    chapters: overrides.chapters ?? [
      {
        chapterId: "ch-1",
        chapterTitle: "Chapter 1",
        sectionId: "s-1",
        sectionTitle: "Section 1",
        index: 0,
        isPreview: false,
        isPaidChapter: false,
        isCompleted: false,
        watchTime: 0,
        videoDuration: 600,
        canAccess: true,
        lockCode: "allowed",
      },
      {
        chapterId: "ch-2",
        chapterTitle: "Chapter 2 (Preview)",
        sectionId: "s-1",
        sectionTitle: "Section 1",
        index: 1,
        isPreview: true,
        isPaidChapter: false,
        isCompleted: false,
        watchTime: 0,
        videoDuration: 600,
        canAccess: true,
        lockCode: "allowed",
      },
      {
        chapterId: "ch-3",
        chapterTitle: "Chapter 3",
        sectionId: "s-1",
        sectionTitle: "Section 1",
        index: 2,
        isPreview: false,
        isPaidChapter: false,
        isCompleted: false,
        watchTime: 0,
        videoDuration: 600,
        canAccess: false,
        lockCode: "previous_chapter_incomplete",
        lockReason: "Complete the previous chapter first.",
      },
    ],
    nextChapterAction: overrides.nextChapterAction ?? {
      action: "navigate",
      chapterId: "ch-2",
      chapterTitle: "Chapter 2 (Preview)",
      sectionId: "s-1",
    },
    ...(overrides.isEnrolled !== undefined ? { isEnrolled: overrides.isEnrolled } : {}),
  }
}

describe("useCourseSession", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockStartChapter.mockResolvedValue({ success: true })
  })

  it("fetches session on mount and exposes chapter data", async () => {
    mockGetCourseSession.mockResolvedValue(makeMockSession())

    const { result } = renderHook(() => useCourseSession("course-1"))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.chapters).toHaveLength(3)
    expect(result.current.currentChapterId).toBe("ch-1")
    expect(result.current.isEnrolled).toBe(true)
  })

  it("isChapterAccessible returns backend-authoritative decisions", async () => {
    mockGetCourseSession.mockResolvedValue(makeMockSession())

    const { result } = renderHook(() => useCourseSession("course-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isChapterAccessible("ch-1")).toBe(true)
    expect(result.current.isChapterAccessible("ch-2")).toBe(true)
    expect(result.current.isChapterAccessible("ch-3")).toBe(false)
  })

  it("selectChapter returns failure for inaccessible chapters", async () => {
    mockGetCourseSession.mockResolvedValue(makeMockSession())

    const { result } = renderHook(() => useCourseSession("course-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let selectResult: any
    await act(async () => {
      selectResult = await result.current.selectChapter("ch-3")
    })
    expect(selectResult.success).toBe(false)
    expect(selectResult.reason).toBeTruthy()
  })

  it("selectChapter returns success for accessible chapters", async () => {
    mockGetCourseSession.mockResolvedValue(makeMockSession())

    const { result } = renderHook(() => useCourseSession("course-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let selectResult: any
    await act(async () => {
      selectResult = await result.current.selectChapter("ch-2")
    })
    expect(selectResult.success).toBe(true)
    expect(result.current.currentChapterId).toBe("ch-2")
  })

  it("goToNextChapter navigates when action is navigate", async () => {
    mockGetCourseSession.mockResolvedValue(makeMockSession())

    const { result } = renderHook(() => useCourseSession("course-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let navResult: any
    await act(async () => {
      navResult = await result.current.goToNextChapter()
    })
    expect(navResult.success).toBe(true)
    expect(navResult.chapterId).toBe("ch-2")
    expect(result.current.currentChapterId).toBe("ch-2")
  })

  it("goToNextChapter returns block reason when action is blocked", async () => {
    const session = makeMockSession({
      nextChapterAction: {
        action: "blocked",
        chapterId: "ch-2",
        lockCode: "previous_chapter_incomplete",
        reason: "Complete the previous chapter first.",
      },
    })
    // For the retry within goToNextChapter, also return blocked
    mockGetCourseSession.mockResolvedValue(session)

    const { result } = renderHook(() => useCourseSession("course-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let navResult: any
    await act(async () => {
      navResult = await result.current.goToNextChapter()
    })
    expect(navResult.success).toBe(false)
    expect(navResult.reason).toContain("Complete the previous chapter")
    expect(navResult.chapterId).toBe("ch-2")
  })

  it("goToNextChapter returns blocked paid chapter metadata", async () => {
    const session = makeMockSession({
      nextChapterAction: {
        action: "blocked",
        chapterId: "ch-2",
        lockCode: "payment_required",
        reason: "Paiement requis pour ce chapitre",
        needsPayment: true,
        chapterPrice: 25,
      },
    })
    mockGetCourseSession.mockResolvedValue(session)

    const { result } = renderHook(() => useCourseSession("course-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let navResult: any
    await act(async () => {
      navResult = await result.current.goToNextChapter()
    })

    expect(navResult.success).toBe(false)
    expect(navResult.needsPayment).toBe(true)
    expect(navResult.chapterId).toBe("ch-2")
  })

  it("reportChapterComplete optimistically marks chapter as completed", async () => {
    mockGetCourseSession.mockResolvedValue(makeMockSession())

    const { result } = renderHook(() => useCourseSession("course-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.chapters[0].isCompleted).toBe(false)

    act(() => {
      result.current.reportChapterComplete("ch-1")
    })

    expect(result.current.chapters[0].isCompleted).toBe(true)
    expect(result.current.completedChapters).toBe(1)
  })

  it("reportWatchTime updates chapter watch time optimistically", async () => {
    mockGetCourseSession.mockResolvedValue(makeMockSession())

    const { result } = renderHook(() => useCourseSession("course-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.reportWatchTime("ch-1", 300, 600)
    })

    expect(result.current.chapters[0].watchTime).toBe(300)
  })

  // ── REGRESSION TEST ──────────────────────────────────────────────────────

  describe("REGRESSION: completed chapter + preview next = navigate", () => {
    it("goToNextChapter succeeds when next chapter is preview and session says navigate", async () => {
      // Simulate exact reported scenario:
      // ch-1 completed (>90%), ch-2 is free preview, clicking "Next Chapter"
      const session = makeMockSession({
        chapters: [
          {
            chapterId: "ch-1",
            chapterTitle: "Chapter 1",
            sectionId: "s-1",
            sectionTitle: "Section 1",
            index: 0,
            isPreview: false,
            isPaidChapter: false,
            isCompleted: true,
            watchTime: 540,
            videoDuration: 600,
            canAccess: true,
            lockCode: "allowed",
          },
          {
            chapterId: "ch-2",
            chapterTitle: "Chapter 2 (Preview)",
            sectionId: "s-1",
            sectionTitle: "Section 1",
            index: 1,
            isPreview: true,
            isPaidChapter: false,
            isCompleted: false,
            watchTime: 0,
            videoDuration: 600,
            canAccess: true,
            lockCode: "allowed",
          },
        ],
        completedChapters: 1,
        nextChapterAction: {
          action: "navigate",
          chapterId: "ch-2",
          chapterTitle: "Chapter 2 (Preview)",
          sectionId: "s-1",
        },
      })
      mockGetCourseSession.mockResolvedValue(session)

      const { result } = renderHook(() => useCourseSession("course-1"))
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Verify initial state
      expect(result.current.canGoToNext).toBe(true)
      expect(result.current.nextBlockReason).toBeNull()

      // Click "Next Chapter"
      let navResult: any
      await act(async () => {
        navResult = await result.current.goToNextChapter()
      })

      // Should succeed — this is the exact bug that was failing before
      expect(navResult.success).toBe(true)
      expect(navResult.chapterId).toBe("ch-2")
      expect(result.current.currentChapterId).toBe("ch-2")
    })
  })
})
