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
      <div data-testid="paid-chapter-access">{String(isChapterAccessible("chapter-2"))}</div>
    ),
  }),
)

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
      />,
    )

    expect(screen.getByTestId("paid-chapter-access")).toHaveTextContent("true")
  })
})
