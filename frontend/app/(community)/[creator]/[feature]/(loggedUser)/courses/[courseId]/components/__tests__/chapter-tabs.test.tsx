import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import ChapterTabs from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/chapter-tabs"

jest.mock("@/components/reviews/course-reviews-section", () => ({
  CourseReviewsSection: () => <div data-testid="course-reviews" />,
}))

jest.mock(
  "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/ai-tutor-widget",
  () => ({
    __esModule: true,
    AiTutorMark: ({ className }: { className?: string }) => (
      <svg aria-hidden="true" className={className} data-testid="ai-tutor-mark" />
    ),
    FloatingAiTutorSheet: ({ open }: { open?: boolean }) => (
      <div
        data-testid="floating-ai-tutor"
        data-open={String(Boolean(open))}
      />
    ),
  }),
)

const chapters = [
  { id: "chapter-1", title: "Intro", duration: 100 },
  { id: "chapter-2", title: "Halfway", duration: 100 },
  { id: "chapter-3", title: "Fresh Start", duration: 100 },
  { id: "chapter-4", title: "Locked Premium", duration: 100, isPaidChapter: true },
]

function renderChapterTabs(overrides: Partial<React.ComponentProps<typeof ChapterTabs>> = {}) {
  return render(
    <ChapterTabs
      activeTab="content"
      setActiveTab={jest.fn()}
      currentChapter={chapters[0]}
      currentChapterIndex={0}
      allChapters={chapters}
      {...overrides}
    />,
  )
}

describe("ChapterTabs", () => {
  it("does not render the horizontal chapter rail", () => {
    renderChapterTabs()

    expect(screen.queryByLabelText("Course chapter rail")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chapter-rail-item-chapter-1")).not.toBeInTheDocument()
  })

  it("mounts the AI tutor sheet controller when a course and chapter are selected", () => {
    renderChapterTabs({ courseId: "course-1" })

    expect(screen.getByTestId("floating-ai-tutor")).toHaveAttribute("data-open", "false")
  })

  it("does not render a persistent bottom Ask AI button", () => {
    renderChapterTabs({ courseId: "course-1" })

    expect(screen.queryByRole("button", { name: "Ask AI Tutor" })).not.toBeInTheDocument()
  })

  it("opens the same AI tutor sheet from the AI tab CTA", async () => {
    renderChapterTabs({ activeTab: "ai-tutor", courseId: "course-1" })

    expect(screen.getByTestId("floating-ai-tutor")).toHaveAttribute("data-open", "false")
    expect(screen.queryByTestId("ai-tutor-widget")).not.toBeInTheDocument()

    screen.getByTestId("open-ai-tutor-cta").click()

    await waitFor(() => {
      expect(screen.getByTestId("floating-ai-tutor")).toHaveAttribute("data-open", "true")
    })
  })

  it("does not render the floating AI tutor without a selected chapter", () => {
    renderChapterTabs({ activeTab: "ai-tutor", courseId: "course-1", currentChapter: null })

    expect(screen.queryByTestId("floating-ai-tutor")).not.toBeInTheDocument()
    expect(screen.getByText("Please select a chapter to use the AI Tutor.")).toBeInTheDocument()
  })
})
