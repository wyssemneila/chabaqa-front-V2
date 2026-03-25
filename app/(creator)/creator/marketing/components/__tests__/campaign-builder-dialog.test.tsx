import React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CampaignBuilderDialog } from "../campaign-builder-dialog"

const mockToast = jest.fn()

const mockGetInactiveUserStats = jest.fn()
const mockCreateCampaign = jest.fn()
const mockCreateInactiveUserCampaign = jest.fn()
const mockCreateContentReminder = jest.fn()
const mockSendCampaign = jest.fn()

const mockEventsGetAll = jest.fn()

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

jest.mock("@/app/(creator)/creator/context/creator-community-context", () => ({
  useCreatorCommunity: () => ({
    selectedCommunityId: "community-1",
    selectedCommunity: { id: "community-1", slug: "community-slug", name: "Community One" },
  }),
}))

jest.mock("@/lib/api", () => ({
  emailCampaignsApi: {
    getInactiveUserStats: (...args: any[]) => mockGetInactiveUserStats(...args),
    createCampaign: (...args: any[]) => mockCreateCampaign(...args),
    createInactiveUserCampaign: (...args: any[]) => mockCreateInactiveUserCampaign(...args),
    createContentReminder: (...args: any[]) => mockCreateContentReminder(...args),
    sendCampaign: (...args: any[]) => mockSendCampaign(...args),
  },
  eventsApi: {
    getAll: (...args: any[]) => mockEventsGetAll(...args),
  },
  coursesApi: { getByCommunity: jest.fn() },
  challengesApi: { getByCommunity: jest.fn() },
  productsApi: { getByCommunity: jest.fn() },
  sessionsApi: { getByCommunity: jest.fn() },
}))

describe("CampaignBuilderDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetInactiveUserStats.mockResolvedValue({
      totalMembers: 100,
      activeUsers: 80,
      inactive7d: 5,
      inactive15d: 4,
      inactive30d: 3,
      inactive60dPlus: 2,
      totalInactiveUsers: 14,
      breakdown: [],
    })
  })

  it("announcement + Send Now creates then sends", async () => {
    mockCreateCampaign.mockResolvedValue({ _id: "campaign-1" })
    mockSendCampaign.mockResolvedValue({ queued: true, campaignId: "campaign-1" })

    render(<CampaignBuilderDialog open={true} onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    await userEvent.type(screen.getByLabelText(/campaign title/i), "My Campaign")
    await userEvent.type(screen.getByLabelText(/subject line/i), "Hello {{userName}}")
    await userEvent.type(screen.getByLabelText(/email content/i), "Body")

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /create & send/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /create & send/i }))

    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalled()
      expect(mockSendCampaign).toHaveBeenCalledWith("campaign-1")
    })
  })

  it("inactive-users + Send Now creates then sends", async () => {
    mockCreateInactiveUserCampaign.mockResolvedValue({ _id: "campaign-2" })
    mockSendCampaign.mockResolvedValue({ queued: true, campaignId: "campaign-2" })

    render(<CampaignBuilderDialog open={true} onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole("button", { name: /inactive users/i }))
    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    // inactivity period required
    await userEvent.click(screen.getByRole("combobox", { name: /inactive period/i }))
    await userEvent.click(await screen.findByText("15 days"))

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    await userEvent.type(screen.getByLabelText(/campaign title/i), "Winback")
    await userEvent.type(screen.getByLabelText(/subject line/i), "We miss you")
    await userEvent.type(screen.getByLabelText(/email content/i), "Come back")

    fireEvent.click(screen.getByRole("button", { name: /next/i }))
    fireEvent.click(await screen.findByRole("button", { name: /create & send/i }))

    await waitFor(() => {
      expect(mockCreateInactiveUserCampaign).toHaveBeenCalled()
      expect(mockSendCampaign).toHaveBeenCalledWith("campaign-2")
    })
  })

  it("scheduled announcement creates without sending", async () => {
    mockCreateCampaign.mockResolvedValue({ _id: "campaign-3" })

    render(<CampaignBuilderDialog open={true} onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    await userEvent.type(screen.getByLabelText(/campaign title/i), "Scheduled")
    await userEvent.type(screen.getByLabelText(/subject line/i), "Subject")
    await userEvent.type(screen.getByLabelText(/email content/i), "Content")

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    // switch to scheduled
    await userEvent.click(screen.getByRole("combobox", { name: /when to send/i }))
    await userEvent.click(await screen.findByText("Schedule for Later"))

    const future = new Date(Date.now() + 60_000)
    const date = future.toISOString().slice(0, 10)
    const time = future.toISOString().slice(11, 16)

    fireEvent.change(screen.getByLabelText(/^date$/i), { target: { value: date } })
    fireEvent.change(screen.getByLabelText(/^time$/i), { target: { value: time } })

    fireEvent.click(screen.getByRole("button", { name: /schedule campaign/i }))

    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalled()
      expect(mockSendCampaign).not.toHaveBeenCalled()
    })
  })

  it("content reminder uses content picker and only calls createContentReminder", async () => {
    mockEventsGetAll.mockResolvedValue({
      success: true,
      data: [{ _id: "event-1", title: "Event 1" }],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    })
    mockCreateContentReminder.mockResolvedValue({ campaignId: "campaign-4", queued: true })

    render(<CampaignBuilderDialog open={true} onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole("button", { name: /content reminder/i }))

    // select content type
    await userEvent.click(screen.getByRole("combobox", { name: /content type/i }))
    await userEvent.click(await screen.findByText("Event"))

    await waitFor(() => {
      expect(mockEventsGetAll).toHaveBeenCalled()
    })

    // open picker and select item
    fireEvent.click(screen.getByRole("button", { name: /content item/i }))
    fireEvent.click(await screen.findByText("Event 1"))

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    await userEvent.type(screen.getByLabelText(/campaign title/i), "Reminder")
    await userEvent.type(screen.getByLabelText(/subject line/i), "Subject")
    await userEvent.type(screen.getByLabelText(/email content/i), "Content")

    fireEvent.click(screen.getByRole("button", { name: /next/i }))
    fireEvent.click(await screen.findByRole("button", { name: /create & send/i }))

    await waitFor(() => {
      expect(mockCreateContentReminder).toHaveBeenCalled()
      expect(mockSendCampaign).not.toHaveBeenCalled()
    })
  })

  it("variable chips insert at cursor in subject", async () => {
    render(<CampaignBuilderDialog open={true} onOpenChange={() => {}} />)

    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    const subjectInput = screen.getByLabelText(/subject line/i) as HTMLInputElement
    fireEvent.focus(subjectInput)

    fireEvent.click(screen.getByText("{{userName}}"))

    await waitFor(() => {
      expect((screen.getByLabelText(/subject line/i) as HTMLInputElement).value).toContain("{{userName}}")
    })
  })
})
