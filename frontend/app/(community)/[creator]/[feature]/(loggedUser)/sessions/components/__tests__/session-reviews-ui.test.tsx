import React from "react"
import { render, screen } from "@testing-library/react"
import SessionCard from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/SessionCard"
import BookedSessions from "@/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/BookedSessions"

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/community/test/sessions",
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
}))

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock("@/lib/api", () => ({
  api: {
    dm: {
      startSessionConversation: jest.fn(),
    },
  },
}))

jest.mock("@/lib/api/feedback.api", () => ({
  feedbackApi: {
    getByRelated: jest.fn(),
    getStats: jest.fn(),
    getMyFeedback: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}))

jest.mock("@/components/ui/status-badge", () => ({
  StatusBadge: ({ status }: { status: string }) => <span>{status}</span>,
}))

describe("Sessions reviews UI", () => {
  it("shows session rating from backend values instead of hardcoded defaults", () => {
    render(
      <SessionCard
        session={{
          id: "session-1",
          title: "Design Review Session",
          description: "Get feedback on design systems",
          category: "Design",
          price: 0,
          duration: 60,
          tags: [],
          averageRating: 4.2,
          ratingCount: 7,
          mentor: {
            name: "Mentor Name",
            role: "Mentor",
          },
        }}
        selectedSession=""
        setSelectedSession={() => undefined}
      />,
    )

    expect(screen.getByText("4.2")).toBeInTheDocument()
    expect(screen.getByText("7 reviews")).toBeInTheDocument()
    expect(screen.queryByText("4.9")).not.toBeInTheDocument()
  })

  it("shows review CTA only for completed bookings", () => {
    render(
      <BookedSessions
        setActiveTab={() => undefined}
        userBookings={[
          {
            id: "booking-completed",
            status: "completed",
            scheduledAt: new Date().toISOString(),
            sessionId: "session-completed",
            session: {
              id: "session-completed",
              title: "Completed Session",
              description: "",
              duration: 60,
            },
          },
          {
            id: "booking-confirmed",
            status: "confirmed",
            scheduledAt: new Date().toISOString(),
            sessionId: "session-confirmed",
            session: {
              id: "session-confirmed",
              title: "Confirmed Session",
              description: "",
              duration: 60,
            },
          },
        ]}
      />,
    )

    expect(screen.getAllByText(/Leave Review|Update Review/)).toHaveLength(1)
  })
})
