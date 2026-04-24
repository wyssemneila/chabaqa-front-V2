import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import CourseSidebar from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-sidebar"

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
    initChapterStripePayment: jest.fn(),
  },
}))

describe("CourseSidebar chapter selection", () => {
  it("calls setSelectedChapter even when chapter is currently rendered as locked", () => {
    const setSelectedChapter = jest.fn()

    render(
      <CourseSidebar
        course={{
          id: "course-1",
          mongoId: "65f0f0f0f0f0f0f0f0f0f0f0",
          creator: { name: "Creator", avatar: "", bio: "Instructor" },
          sections: [
            {
              id: "section-1",
              title: "Section 1",
              chapters: [
                {
                  id: "chapter-2",
                  title: "Premium Chapter",
                  sectionId: "section-1",
                  duration: 600,
                  isPreview: false,
                  isPaidChapter: true,
                  price: 25,
                },
              ],
            },
          ],
        }}
        enrollment={{ progress: [], progressPercentage: 0 }}
        allChapters={[
          {
            id: "chapter-2",
            title: "Premium Chapter",
            sectionId: "section-1",
            duration: 600,
            isPreview: false,
            isPaidChapter: true,
            price: 25,
          },
        ]}
        progress={0}
        completedChaptersCount={0}
        remainingChaptersCount={1}
        selectedChapter={null}
        setSelectedChapter={setSelectedChapter}
        isChapterAccessible={() => false}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /premium chapter/i }))

    expect(setSelectedChapter).toHaveBeenCalledWith("chapter-2")
  })
})
