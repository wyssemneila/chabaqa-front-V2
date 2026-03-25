import React from "react"
import { render, screen } from "@testing-library/react"
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
})
