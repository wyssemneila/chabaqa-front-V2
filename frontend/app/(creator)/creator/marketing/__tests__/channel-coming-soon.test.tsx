import React from "react"
import { render, screen } from "@testing-library/react"
import MessageCampaignsPage from "../messages/page"
import WhatsAppCampaignsPage from "../whatsapp/page"

const mockUseCreatorCommunity = jest.fn()

jest.mock("@/app/(creator)/creator/context/creator-community-context", () => ({
  useCreatorCommunity: () => mockUseCreatorCommunity(),
}))

describe("creator marketing non-email channels", () => {
  beforeEach(() => {
    mockUseCreatorCommunity.mockReturnValue({
      selectedCommunityId: "community-1",
      selectedCommunity: { _id: "community-1", name: "Community" },
      communities: [{ _id: "community-1", name: "Community" }],
      isLoading: false,
    })
  })

  it("renders coming soon state for messages page", () => {
    render(<MessageCampaignsPage />)
    expect(screen.getByText("SMS Campaigns")).toBeInTheDocument()
    expect(screen.getByText(/Email campaigns are fully available now/i)).toBeInTheDocument()
  })

  it("renders coming soon state for whatsapp page", () => {
    render(<WhatsAppCampaignsPage />)
    expect(screen.getByText("WhatsApp Campaigns")).toBeInTheDocument()
    expect(screen.getByText(/WhatsApp automation is being finalized/i)).toBeInTheDocument()
  })
})
