import React from "react"
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import CommunityAnalyticsPage from "@/app/(creator)/creator/analytics/page"

const mockPush = jest.fn()
const mockToast = jest.fn()

const mockGetOverview = jest.fn()
const mockGetDevices = jest.fn()
const mockGetReferrers = jest.fn()
const mockGetCourses = jest.fn()
const mockGetChallenges = jest.fn()
const mockGetSessions = jest.fn()
const mockGetEvents = jest.fn()
const mockGetPosts = jest.fn()
const mockGetProducts = jest.fn()
const mockBackfill = jest.fn()
const mockExportCsv = jest.fn()

let selectedCommunityId: string | null = "community-a"
let communityLoading = false
const mockSetSelectedCommunityId = jest.fn((nextId: string | null) => {
  selectedCommunityId = nextId
})

const communities = [
  { id: "community-a", slug: "community-a", name: "Community A" },
  { id: "community-b", slug: "community-b", name: "Community B" },
]

const makeOverview = (values?: { views?: number; starts?: number; completes?: number }) => {
  const views = values?.views ?? 191
  const starts = values?.starts ?? 12
  const completes = values?.completes ?? 11

  return {
    data: {
      totals: {
        views,
        starts,
        completes,
        likes: 0,
        shares: 0,
        downloads: 0,
        bookmarks: 0,
        ratingsCount: 0,
        watchTime: 0,
      },
      revenue: { total: 0, count: 0 },
      trend7d: [{ date: "2026-02-16T00:00:00.000Z", views, starts, completes }],
      trend28d: [{ date: "2026-02-16T00:00:00.000Z", views, starts, completes }],
      trendAll: [{ date: "2026-02-16T00:00:00.000Z", views, starts, completes }],
    },
  }
}

const makeDeferred = <T,>() => {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

jest.mock("@/app/providers/auth-provider", () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    loading: false,
    user: { id: "user-1", name: "Creator" },
  }),
}))

jest.mock("@/app/(creator)/creator/context/creator-community-context", () => ({
  useCreatorCommunity: () => ({
    selectedCommunityId,
    selectedCommunity: communities.find((community) => community.id === selectedCommunityId) || null,
    setSelectedCommunityId: mockSetSelectedCommunityId,
    communities,
    isLoading: communityLoading,
  }),
}))

jest.mock("@/lib/api", () => ({
  api: {
    creatorAnalytics: {
      getOverview: (...args: any[]) => mockGetOverview(...args),
      getDevices: (...args: any[]) => mockGetDevices(...args),
      getReferrers: (...args: any[]) => mockGetReferrers(...args),
      getCourses: (...args: any[]) => mockGetCourses(...args),
      getChallenges: (...args: any[]) => mockGetChallenges(...args),
      getSessions: (...args: any[]) => mockGetSessions(...args),
      getEvents: (...args: any[]) => mockGetEvents(...args),
      getPosts: (...args: any[]) => mockGetPosts(...args),
      getProducts: (...args: any[]) => mockGetProducts(...args),
      backfill: (...args: any[]) => mockBackfill(...args),
      exportCsv: (...args: any[]) => mockExportCsv(...args),
    },
  },
}))

jest.mock("recharts", () => {
  const Wrapper = ({ children }: any) => <div>{children}</div>
  return {
    ResponsiveContainer: Wrapper,
    AreaChart: Wrapper,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    BarChart: Wrapper,
    Bar: () => null,
    PieChart: Wrapper,
    Pie: () => null,
    Cell: () => null,
  }
})

describe("Creator analytics refresh and switching", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()

    selectedCommunityId = "community-a"
    communityLoading = false

    mockGetOverview.mockResolvedValue(makeOverview())
    mockGetDevices.mockResolvedValue({ data: { rows: [] } })
    mockGetReferrers.mockResolvedValue({ data: { rows: [] } })
    mockGetCourses.mockResolvedValue({ data: { items: [{ id: "course-1", title: "Course 1", views: 191, starts: 12, completes: 11 }] } })
    mockGetChallenges.mockResolvedValue({ data: { items: [] } })
    mockGetSessions.mockResolvedValue({ data: { items: [] } })
    mockGetEvents.mockResolvedValue({ data: { items: [] } })
    mockGetPosts.mockResolvedValue({ data: { items: [] } })
    mockGetProducts.mockResolvedValue({ data: { items: [] } })
    mockBackfill.mockResolvedValue({ ok: true, updated: 0 })
    mockExportCsv.mockResolvedValue({ data: { filename: "courses.csv", csv: "metric,value\nviews,10" } })
  })

  test("ignores stale response when community changes quickly", async () => {
    const firstCommunity = makeDeferred<any>()

    mockGetOverview.mockImplementation((params: any) => {
      if (params?.communityId === "community-a") return firstCommunity.promise
      return Promise.resolve(makeOverview({ views: 222, starts: 20, completes: 10 }))
    })
    mockGetCourses.mockImplementation((params: any) => {
      if (params?.communityId === "community-a") {
        return Promise.resolve({ data: { items: [{ id: "course-a", title: "Course A", views: 11, starts: 2, completes: 1 }] } })
      }
      return Promise.resolve({ data: { items: [{ id: "course-b", title: "Course B", views: 222, starts: 20, completes: 10 }] } })
    })

    const view = render(<CommunityAnalyticsPage />)

    selectedCommunityId = "community-b"
    view.rerender(<CommunityAnalyticsPage />)

    await waitFor(() => {
      expect(screen.getAllByText("222").length).toBeGreaterThan(0)
    })

    act(() => {
      firstCommunity.resolve(makeOverview({ views: 11, starts: 2, completes: 1 }))
    })

    await waitFor(() => {
      expect(screen.getAllByText("222").length).toBeGreaterThan(0)
    })
  })

  test("keeps valid completion rate when top items are missing starts/completes", async () => {
    mockGetOverview.mockResolvedValue(makeOverview({ views: 100, starts: 20, completes: 10 }))
    mockGetCourses.mockResolvedValue({
      data: {
        items: [{ id: "course-1", title: "Course 1", views: 100 }],
      },
    })

    render(<CommunityAnalyticsPage />)

    const completionRateLabel = await screen.findAllByText("Completion Rate")
    const metricGroup = completionRateLabel[0].parentElement
    expect(metricGroup).toBeTruthy()
    expect(within(metricGroup as HTMLElement).getByText("50%")).toBeInTheDocument()
  })

  test("uses hybrid loading: first load skeleton, then keeps data during background refresh", async () => {
    const firstLoad = makeDeferred<any>()
    const secondLoad = makeDeferred<any>()
    let callCount = 0

    mockGetOverview.mockImplementation(() => {
      callCount += 1
      if (callCount === 1) return firstLoad.promise
      if (callCount === 2) return secondLoad.promise
      return Promise.resolve(makeOverview({ views: 193, starts: 12, completes: 11 }))
    })

    render(<CommunityAnalyticsPage />)
    expect(screen.getByText("Loading analytics...")).toBeInTheDocument()

    act(() => {
      firstLoad.resolve(makeOverview({ views: 191, starts: 12, completes: 11 }))
    })

    await waitFor(() => {
      expect(screen.getAllByText("191").length).toBeGreaterThan(0)
    })

    act(() => {
      window.dispatchEvent(new Event("focus"))
    })

    await waitFor(() => {
      expect(screen.getByText("Refreshing...")).toBeInTheDocument()
    })
    expect(screen.getAllByText("191").length).toBeGreaterThan(0)

    act(() => {
      secondLoad.resolve(makeOverview({ views: 192, starts: 12, completes: 11 }))
    })

    await waitFor(() => {
      expect(screen.queryByText("Refreshing...")).not.toBeInTheDocument()
    })
  })

  test("sync flow backfills then reloads analytics data", async () => {
    render(<CommunityAnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Sync Data/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Sync Data/i }))

    await waitFor(() => {
      expect(mockBackfill).toHaveBeenCalledWith(90)
    })

    await waitFor(() => {
      expect(mockGetOverview.mock.calls.length).toBeGreaterThanOrEqual(2)
    })
  })

  test("export flow calls creator export and starts csv download", async () => {
    const createObjectURLSpy = jest.fn(() => "blob:analytics")
    const revokeObjectURLSpy = jest.fn()
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: createObjectURLSpy,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: revokeObjectURLSpy,
    })

    render(<CommunityAnalyticsPage />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Export CSV/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /Export CSV/i }))

    await waitFor(() => {
      expect(mockExportCsv).toHaveBeenCalled()
    })
    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalled()

    clickSpy.mockRestore()
  })

  test("refreshes on interval and window focus", async () => {
    jest.useFakeTimers()
    render(<CommunityAnalyticsPage />)

    await waitFor(() => {
      expect(screen.queryByText("Loading analytics...")).not.toBeInTheDocument()
    })
    const initialCalls = mockGetOverview.mock.calls.length

    await act(async () => {
      jest.advanceTimersByTime(60_000)
    })

    await waitFor(() => {
      expect(mockGetOverview.mock.calls.length).toBeGreaterThan(initialCalls)
    })
    const afterIntervalCalls = mockGetOverview.mock.calls.length

    act(() => {
      window.dispatchEvent(new Event("focus"))
    })

    await waitFor(() => {
      expect(mockGetOverview.mock.calls.length).toBeGreaterThan(afterIntervalCalls)
    })
  })
})
