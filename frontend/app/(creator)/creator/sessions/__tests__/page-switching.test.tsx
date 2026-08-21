import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import CreatorSessionsPage from "@/app/(creator)/creator/sessions/page"

const mockUseCreatorSessionsPage = jest.fn()
const mockRefetch = jest.fn()

jest.mock("@/hooks/creator-dashboard/use-creator-dashboard-data", () => ({
  useCreatorSessionsPage: () => mockUseCreatorSessionsPage(),
}))

jest.mock("@/hooks/use-dash-prefs", () => ({
  useDashPrefs: () => ({ lang: "en" }),
}))

jest.mock("@/components/creator-dashboard/DashSidebar", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/creator-dashboard/DashTopbar", () => ({
  __esModule: true,
  default: () => null,
}))

const session = {
  _id: "session-1",
  title: "Strategy Session",
  duration: 60,
  priceType: "paid",
  price: 80,
  isPublished: true,
  availabilityDays: 3,
  totalSlots: 6,
}

const booking = {
  _id: "booking-1",
  studentName: "Ada Student",
  studentEmail: "ada@example.com",
  sessionId: "session-1",
  sessionTitle: "Strategy Session",
  duration: 60,
  price: 80,
  date: "2099-06-22T10:00:00.000Z",
  status: "confirmed",
}

describe("Creator sessions page", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCreatorSessionsPage.mockReturnValue({
      sessions: [session],
      bookings: [booking],
      loading: false,
      error: "",
      refetch: mockRefetch,
    })
  })

  test("renders sessions and upcoming bookings from the current data hook", () => {
    render(<CreatorSessionsPage />)

    expect(screen.getByText("1 sessions · 1 bookings")).toBeInTheDocument()
    expect(screen.getAllByText("Strategy Session").length).toBeGreaterThan(0)
    expect(screen.getByText("Ada Student")).toBeInTheDocument()
  })

  test("renders loading state while session data is being fetched", () => {
    mockUseCreatorSessionsPage.mockReturnValue({
      sessions: [],
      bookings: [],
      loading: true,
      error: "",
      refetch: mockRefetch,
    })

    render(<CreatorSessionsPage />)
    expect(screen.getByText("Loading…")).toBeInTheDocument()
  })

  test("retries through the current data hook after an error", () => {
    mockUseCreatorSessionsPage.mockReturnValue({
      sessions: [],
      bookings: [],
      loading: false,
      error: "Failed to load sessions",
      refetch: mockRefetch,
    })

    render(<CreatorSessionsPage />)
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })
})
