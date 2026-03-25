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
      selectedCommunity: { _id: "community-1", name: "Community" },
    })
  })

  it("renders coming soon state for messages page", () => {
    render(<MessageCampaignsPage />)
    expect(screen.getByText("Coming Soon")).toBeInTheDocument()
    expect(screen.getByText(/Email campaigns are fully available now/i)).toBeInTheDocument()
  })

  it("renders coming soon state for whatsapp page", () => {
    render(<WhatsAppCampaignsPage />)
    expect(screen.getByText("Coming Soon")).toBeInTheDocument()
    expect(screen.getByText(/WhatsApp channel support/i)).toBeInTheDocument()
  })
})
