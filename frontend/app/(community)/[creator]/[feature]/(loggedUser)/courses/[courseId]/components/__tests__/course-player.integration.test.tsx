import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import CoursePlayer from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-player"
import { coursesApi } from "@/lib/api/courses.api"

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock("@/lib/api", () => ({
  api: {
    courses: {
      getNotes: jest.fn(),
      createNote: jest.fn(),
      deleteNote: jest.fn(),
    },
  },
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
    default: ({ currentChapter }: any) => (
      <div data-testid="enhanced-video-player">{currentChapter?.title || ""}</div>
    ),
  }),
)

jest.mock(
  "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/chapter-tabs",
  () => ({
    __esModule: true,
    default: ({ onGoToNextChapter }: any) => (
      <button type="button" data-testid="chapter-tabs-next" onClick={() => void onGoToNextChapter?.()}>
        ChapterTabs Next
      </button>
    ),
  }),
)

describe("CoursePlayer unlock integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(coursesApi.trackStart as jest.Mock).mockResolvedValue({ success: true })
  })

  it("renders paid chapter as unlocked when unlockedChapters includes it", () => {
    const course = {
      id: "course-1",
      mongoId: "65f0f0f0f0f0f0f0f0f0f0f0",
      creator: { name: "Creator", avatar: "" },
      sections: [
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
        enrollment={{ progress: [], progressPercentage: 0 }}
        unlockedChapters={[{ id: "chapter-2", isUnlocked: true }]}
        sequentialProgressionEnabled
      />,
    )

    expect(screen.queryByText("Premium")).not.toBeInTheDocument()
  })

  it("prefers fresh unlockedChapters over stale session access after paid checkout", () => {
    const course = {
      id: "course-1",
      mongoId: "65f0f0f0f0f0f0f0f0f0f0f0",
      creator: { name: "Creator", avatar: "" },
      sections: [
        {
          id: "section-1",
          title: "Section 1",
          chapters: [
            { id: "chapter-1", title: "Intro", sectionId: "section-1", duration: 60, isPaidChapter: false },
            { id: "chapter-2", title: "Paid Next", sectionId: "section-1", duration: 60, isPaidChapter: true },
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
        enrollment={{
          progress: [{ chapterId: "chapter-1", isCompleted: true, watchTime: 60, videoDuration: 60 }],
          progressPercentage: 50,
        }}
        unlockedChapters={[
          { id: "chapter-1", isUnlocked: true },
          { id: "chapter-2", isUnlocked: true },
        ]}
        sequentialProgressionEnabled
        pendingPaidChapterId="chapter-2"
        chapterUnlockState="unlocked"
        courseSession={{
          chapters: [
            { chapterId: "chapter-1", access: { canAccess: true } },
            { chapterId: "chapter-2", access: { canAccess: false } },
          ],
          currentChapterId: "chapter-1",
          isChapterAccessible: (id: string) => id === "chapter-1",
        } as any}
      />,
    )

    expect(screen.queryByText("Premium")).not.toBeInTheDocument()
    expect(screen.queryByText("Locked")).not.toBeInTheDocument()
  })

  it("syncs local selected chapter when session next navigation succeeds", async () => {
    const course = {
      id: "course-1",
      mongoId: "65f0f0f0f0f0f0f0f0f0f0f0",
      creator: { name: "Creator", avatar: "" },
      sections: [
        {
          id: "section-1",
          title: "Section 1",
          chapters: [
            { id: "chapter-1", title: "Intro", sectionId: "section-1", duration: 60, isPaidChapter: false },
            { id: "chapter-2", title: "Next Lesson", sectionId: "section-1", duration: 60, isPaidChapter: false },
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
        enrollment={{
          progress: [{ chapterId: "chapter-1", isCompleted: true, watchTime: 60, videoDuration: 60 }],
          progressPercentage: 50,
        }}
        unlockedChapters={[]}
        sequentialProgressionEnabled
        courseSession={{
          chapters: [
            { chapterId: "chapter-1", access: { canAccess: true } },
            { chapterId: "chapter-2", access: { canAccess: true } },
          ],
          currentChapterId: "chapter-1",
          isChapterAccessible: () => true,
          goToNextChapter: jest.fn().mockResolvedValue({ success: true, chapterId: "chapter-2" }),
        } as any}
      />,
    )

    expect(screen.getByTestId("enhanced-video-player")).toHaveTextContent("Intro")
    screen.getByTestId("chapter-tabs-next").click()

    await waitFor(() => {
      expect(screen.getByTestId("enhanced-video-player")).toHaveTextContent("Next Lesson")
    })
  })
})
