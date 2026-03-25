import React from "react"
import { render, waitFor } from "@testing-library/react"
import CreatorSessionsPage from "@/app/(creator)/creator/sessions/page"

const mockToast = jest.fn()
const mockLoadSessionsCached = jest.fn()
const mockClientSessionsView = jest.fn(() => <div data-testid="sessions-view" />)

let selectedCommunityId: string | null = "community-a"
let isCommunityLoading = false

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

jest.mock("@/app/(creator)/creator/context/creator-community-context", () => ({
  useCreatorCommunity: () => ({
    selectedCommunityId,
    isLoading: isCommunityLoading,
  }),
}))

jest.mock("@/app/(creator)/creator/context/community-switch-cache", () => ({
  loadSessionsCached: (...args: any[]) => mockLoadSessionsCached(...args),
}))

jest.mock(
  "@/app/(creator)/creator/sessions/components/client-sessions-view",
  () => (props: any) => mockClientSessionsView(props)
)

describe("CreatorSessionsPage community switching", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    selectedCommunityId = "community-a"
    isCommunityLoading = false
  })

  test("ignores stale response from previous community switch", async () => {
    let resolveA: (value: any) => void = () => {}
    const promiseA = new Promise((resolve) => {
      resolveA = resolve
    })

    const payloadA = { sessions: [{ id: "a" }], bookings: [], revenue: 10 }
    const payloadB = { sessions: [{ id: "b" }], bookings: [], revenue: 20 }

    mockLoadSessionsCached.mockImplementation((communityId: string) => {
      if (communityId === "community-a") return promiseA
      return Promise.resolve(payloadB)
    })

    const view = render(<CreatorSessionsPage />)

    selectedCommunityId = "community-b"
    view.rerender(<CreatorSessionsPage />)

    await waitFor(() => {
      expect(mockClientSessionsView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          allSessions: payloadB.sessions,
          revenue: payloadB.revenue,
          isSwitchLoading: false,
        })
      )
    })

    resolveA(payloadA)

    await waitFor(() => {
      expect(mockClientSessionsView).toHaveBeenLastCalledWith(
        expect.objectContaining({
          allSessions: payloadB.sessions,
          revenue: payloadB.revenue,
          isSwitchLoading: false,
        })
      )
    })
  })
})
