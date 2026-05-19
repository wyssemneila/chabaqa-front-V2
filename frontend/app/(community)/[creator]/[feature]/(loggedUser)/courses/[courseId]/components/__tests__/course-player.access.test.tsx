import React from "react"
import { render, screen } from "@testing-library/react"
import CoursePlayer from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-player"
import { coursesApi } from "@/lib/api/courses.api"

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock("@/lib/api/courses.api", () => ({
  coursesApi: {
    trackStart: jest.fn(),
    startChapter: jest.fn(),
    completeChapterEnrollment: jest.fn(),
    completeCourseEnrollment: jest.fn(),
    enroll: jest.fn(),
    initChapterStripePayment: jest.fn(),
  },
}))

jest.mock(
  "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-header",
  () => ({
    __esModule: true,
    default: () => <div data-testid="course-header" />,
  }),
)

jest.mock(
  "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/enhanced-video-player",
  () => ({
    __esModule: true,
    default: () => <div data-testid="enhanced-video-player" />,
  }),
)

jest.mock(
  "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/chapter-tabs",
  () => ({
    __esModule: true,
    default: () => <div data-testid="chapter-tabs" />,
  }),
)

jest.mock(
  "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-sidebar",
  () => ({
    __esModule: true,
    default: ({ isChapterAccessible }: { isChapterAccessible: (chapterId: string) => boolean }) => (
      <div>
        <div data-testid="chapter-1-access">{String(isChapterAccessible("chapter-1"))}</div>
        <div data-testid="chapter-2-access">{String(isChapterAccessible("chapter-2"))}</div>
        <div data-testid="chapter-3-access">{String(isChapterAccessible("chapter-3"))}</div>
      </div>
    ),
  }),
)

const makeCourseSession = (accessibleIds: string[]) =>
  ({
    chapters: [
      { chapterId: "chapter-1", access: { canAccess: accessibleIds.includes("chapter-1") } },
      { chapterId: "chapter-2", access: { canAccess: accessibleIds.includes("chapter-2") } },
      { chapterId: "chapter-3", access: { canAccess: accessibleIds.includes("chapter-3") } },
    ],
    currentChapterId: accessibleIds[0] ?? null,
    isChapterAccessible: (chapterId: string) => accessibleIds.includes(chapterId),
    selectChapter: jest.fn(async (chapterId: string) =>
      accessibleIds.includes(chapterId)
        ? { success: true }
        : {
            success: false,
            reason: "Finish this chapter to unlock the next one.",
            lockCode: "previous_chapter_incomplete",
          },
    ),
    goToNextChapter: jest.fn(),
    reportWatchTime: jest.fn(),
    reportChapterComplete: jest.fn(),
    refreshSession: jest.fn(),
  }) as any

describe("CoursePlayer paid chapter access cache", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(coursesApi.trackStart as jest.Mock).mockResolvedValue({ success: true })
  })

  it("treats unlocked paid chapter as accessible on initial render", () => {
    const course = {
      id: "course-1",
      mongoId: "65f0f0f0f0f0f0f0f0f0f0f0",
      creator: { name: "Creator", avatar: "" },
      sections: [
        {
          id: "section-1",
          title: "Section 1",
          chapters: [
            {
              id: "chapter-1",
              title: "Intro",
              sectionId: "section-1",
              duration: 600,
              isPreview: true,
              isPaidChapter: false,
            },
          ],
        },
        {
          id: "section-2",
          title: "Section 2",
          chapters: [
            {
              id: "chapter-2",
              title: "Premium Chapter",
              sectionId: "section-2",
              duration: 600,
              isPreview: false,
              isPaidChapter: true,
              price: 25,
            },
          ],
        },
      ],
    }

    render(
      <CoursePlayer
        creatorSlug="creator"
        slug="community"
        courseId={String(course.mongoId)}
        course={course}
        enrollment={{ progress: [{ chapterId: "chapter-1", isCompleted: true }], progressPercentage: 50 }}
        unlockedChapters={[{ id: "chapter-2", isUnlocked: true }]}
        sequentialProgressionEnabled
        courseSession={makeCourseSession(["chapter-1", "chapter-2"])}
      />,
    )

    expect(screen.getByTestId("chapter-2-access")).toHaveTextContent("true")
  })

  it("fails closed for enrolled free later chapters while session decisions are empty", () => {
    const course = {
      id: "course-1",
      mongoId: "65f0f0f0f0f0f0f0f0f0f0f0",
      creator: { name: "Creator", avatar: "" },
      sections: [
        {
          id: "section-1",
          title: "Section 1",
          chapters: [
            { id: "chapter-1", title: "Intro", sectionId: "section-1", duration: 600, isPreview: true, isPaidChapter: false },
            { id: "chapter-2", title: "Free Later", sectionId: "section-1", duration: 600, isPreview: true, isPaidChapter: false },
            { id: "chapter-3", title: "Another Later", sectionId: "section-1", duration: 600, isPreview: true, isPaidChapter: false },
          ],
        },
      ],
    }

    render(
      <CoursePlayer
        creatorSlug="creator"
        slug="community"
        courseId={String(course.mongoId)}
        course={course}
        enrollment={{ progress: [], progressPercentage: 0 }}
        unlockedChapters={[{ id: "chapter-2", isUnlocked: true }, { id: "chapter-3", isUnlocked: true }]}
        sequentialProgressionEnabled={false}
        courseSession={{ chapters: [], isChapterAccessible: jest.fn(() => false) } as any}
      />,
    )

    expect(screen.getByTestId("chapter-1-access")).toHaveTextContent("true")
    expect(screen.getByTestId("chapter-2-access")).toHaveTextContent("false")
    expect(screen.getByTestId("chapter-3-access")).toHaveTextContent("false")
  })
})
