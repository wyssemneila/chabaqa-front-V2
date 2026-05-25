import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import CourseSidebar from "@/app/(community)/[creator]/[feature]/(loggedUser)/courses/[courseId]/components/course-sidebar"
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
    initChapterStripePayment: jest.fn(),
  },
}))

describe("CourseSidebar chapter selection", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(coursesApi.initChapterStripePayment as jest.Mock).mockResolvedValue({
      checkoutUrl: "https://checkout.test/session",
    })
  })

  it("does not call setSelectedChapter when chapter is locked", () => {
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

    expect(setSelectedChapter).not.toHaveBeenCalled()
    expect(screen.getByText("Buy chapter")).toBeInTheDocument()
  })

  it("does not show Preview badges for later chapters with stale preview flags", () => {
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
                { id: "chapter-1", title: "Intro", sectionId: "section-1", duration: 60, isPreview: true, isPaidChapter: false },
                { id: "chapter-2", title: "Old Preview", sectionId: "section-1", duration: 60, isPreview: true, isPaidChapter: false },
              ],
            },
          ],
        }}
        enrollment={null}
        allChapters={[
          { id: "chapter-1", title: "Intro", sectionId: "section-1", duration: 60, isPreview: true, isPaidChapter: false },
          { id: "chapter-2", title: "Old Preview", sectionId: "section-1", duration: 60, isPreview: true, isPaidChapter: false },
        ]}
        progress={0}
        completedChaptersCount={0}
        remainingChaptersCount={2}
        selectedChapter={null}
        setSelectedChapter={jest.fn()}
        isChapterAccessible={(id) => id === "chapter-1"}
      />,
    )

    expect(screen.getAllByText("Preview")).toHaveLength(1)
    expect(screen.getByText("Locked")).toBeInTheDocument()
  })

  it("starts checkout directly for locked paid next chapter", async () => {
    const goToNextChapter = jest.fn()

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
                { id: "chapter-1", title: "Intro", sectionId: "section-1", duration: 60, isPaidChapter: false },
                { id: "chapter-2", title: "Premium Next", sectionId: "section-1", duration: 60, isPaidChapter: true },
              ],
            },
          ],
        }}
        enrollment={{
          progress: [{ chapterId: "chapter-1", isCompleted: true, watchTime: 60, videoDuration: 60 }],
          progressPercentage: 50,
        }}
        allChapters={[
          { id: "chapter-1", title: "Intro", sectionId: "section-1", duration: 60, isPaidChapter: false },
          { id: "chapter-2", title: "Premium Next", sectionId: "section-1", duration: 60, isPaidChapter: true },
        ]}
        progress={100}
        completedChaptersCount={1}
        remainingChaptersCount={1}
        selectedChapter="chapter-1"
        setSelectedChapter={jest.fn()}
        isChapterAccessible={(id) => id === "chapter-1"}
        courseId="65f0f0f0f0f0f0f0f0f0f0f0"
        courseSession={{ goToNextChapter } as any}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /buy next/i }))

    await waitFor(() => {
      expect(coursesApi.initChapterStripePayment).toHaveBeenCalledWith(
        "65f0f0f0f0f0f0f0f0f0f0f0",
        "chapter-2",
      )
    })
    expect(goToNextChapter).not.toHaveBeenCalled()
  })

  it("selects unlocked next chapter after session navigation succeeds", async () => {
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
                { id: "chapter-1", title: "Intro", sectionId: "section-1", duration: 60, isPaidChapter: false },
                { id: "chapter-2", title: "Free Next", sectionId: "section-1", duration: 60, isPaidChapter: false },
              ],
            },
          ],
        }}
        enrollment={{
          progress: [{ chapterId: "chapter-1", isCompleted: true, watchTime: 60, videoDuration: 60 }],
          progressPercentage: 50,
        }}
        allChapters={[
          { id: "chapter-1", title: "Intro", sectionId: "section-1", duration: 60, isPaidChapter: false },
          { id: "chapter-2", title: "Free Next", sectionId: "section-1", duration: 60, isPaidChapter: false },
        ]}
        progress={100}
        completedChaptersCount={1}
        remainingChaptersCount={1}
        selectedChapter="chapter-1"
        setSelectedChapter={setSelectedChapter}
        isChapterAccessible={() => true}
        courseSession={{ goToNextChapter: jest.fn().mockResolvedValue({ success: true, chapterId: "chapter-2" }) } as any}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /next chapter/i }))

    await waitFor(() => {
      expect(setSelectedChapter).toHaveBeenCalledWith("chapter-2")
    })
  })
})
