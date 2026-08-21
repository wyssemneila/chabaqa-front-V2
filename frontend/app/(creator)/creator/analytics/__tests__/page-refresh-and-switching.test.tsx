import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import CommunityAnalyticsPage from "@/app/(creator)/creator/analytics/page"

const mockUseAnalyticsDashboard = jest.fn()

jest.mock("@/hooks/use-creator-analytics", () => ({
  useAnalyticsDashboard: (...args: any[]) => mockUseAnalyticsDashboard(...args),
}))

jest.mock("@/app/(creator)/creator/context/creator-community-context", () => ({
  useCreatorCommunity: () => ({
    communities: [{ id: "community-1", _id: "community-1", name: "Community One", slug: "community-one" }],
    selectedCommunityId: "community-1",
    selectedCommunity: { id: "community-1", _id: "community-1", name: "Community One", slug: "community-one" },
    setSelectedCommunityId: jest.fn(),
    refreshCommunities: jest.fn(),
    isLoading: false,
    error: null,
  }),
}))

jest.mock("@/components/creator-dashboard/DashSidebar", () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock("@/components/creator-dashboard/DashTopbar", () => ({
  __esModule: true,
  default: () => null,
}))

const dashboard = {
  generatedAt: "2026-06-21T00:00:00.000Z",
  range: { from: "2026-05-23", to: "2026-06-21", timezone: "UTC" },
  filters: { communityId: null, communitySlug: null, contentType: "all" },
  currency: "TND",
  kpis: [
    {
      id: "revenue",
      label: "Total Revenue",
      value: 1250,
      formattedValue: "1,250 TND",
      change: 12,
      sub: "vs previous period",
      color: "#7c3aed",
      iconKey: "revenue",
    },
    {
      id: "members",
      label: "Active Members",
      value: 42,
      formattedValue: "42",
      change: 5,
      sub: "unique tracked users",
      color: "#0891b2",
      iconKey: "members",
    },
  ],
  timeSeries: {
    labels: ["Jun 21"],
    revenue: [1250],
    members: [42],
    enrollments: [12],
    interactions: [7],
    views: [100],
    completions: [9],
  },
  revenueByType: [
    { label: "Courses", type: "course", value: 1250, color: "#7c3aed" },
  ],
  memberSources: [
    { label: "Direct", channel: "direct", value: 100, count: 42, color: "#0891b2" },
  ],
  communityHealth: [
    {
      id: "completion",
      label: "Completion Rate",
      value: "75%",
      rawValue: 75,
      sub: "across tracked content",
      color: "#16a34a",
      iconKey: "completion",
    },
  ],
  contentPerformance: [
    {
      id: "course-1",
      title: "Growth Course",
      type: "course",
      enrollments: 12,
      revenue: 1250,
      rating: 4.8,
      views: 100,
      completionRate: 75,
      engagementRate: 20,
    },
  ],
  devices: { rows: [], details: [] },
  meta: { precisionLabel: "Directional", sources: [], notes: [] },
}

const queryResult = (overrides: Record<string, unknown> = {}) => ({
  data: { data: dashboard },
  isLoading: false,
  isError: false,
  ...overrides,
})

describe("Creator analytics dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAnalyticsDashboard.mockReturnValue(queryResult())
  })

  test("renders dashboard metrics and content from the current dashboard query", () => {
    render(<CommunityAnalyticsPage />)

    expect(mockUseAnalyticsDashboard).toHaveBeenCalledWith("30d", "all", "community-1", true)
    expect(screen.getAllByText("1,250 TND").length).toBeGreaterThan(0)
    expect(screen.getByText("Growth Course")).toBeInTheDocument()
    expect(screen.getByText("75%")).toBeInTheDocument()
  })

  test("updates the dashboard query when period and content filters change", () => {
    render(<CommunityAnalyticsPage />)

    fireEvent.click(screen.getByRole("button", { name: "7D" }))
    expect(mockUseAnalyticsDashboard).toHaveBeenLastCalledWith("7d", "all", "community-1", true)

    fireEvent.click(screen.getByRole("button", { name: "Posts" }))
    expect(mockUseAnalyticsDashboard).toHaveBeenLastCalledWith("7d", "post", "community-1", true)
    expect(screen.getByText("Post Engagement Analytics")).toBeInTheDocument()
  })

  test("shows loading placeholders and the current query error state", () => {
    mockUseAnalyticsDashboard.mockReturnValue(
      queryResult({ data: undefined, isLoading: true }),
    )
    const view = render(<CommunityAnalyticsPage />)
    expect(screen.getAllByText("...").length).toBeGreaterThan(0)

    mockUseAnalyticsDashboard.mockReturnValue(
      queryResult({ data: undefined, isLoading: false, isError: true }),
    )
    view.rerender(<CommunityAnalyticsPage />)
    expect(screen.getByText(/Analytics could not be loaded/)).toBeInTheDocument()
  })
})
