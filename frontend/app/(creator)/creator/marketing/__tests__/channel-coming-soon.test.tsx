import React from "react"
import { render, screen } from "@testing-library/react"
import WhatsAppCampaignsPage from "../whatsapp/page"

const mockUseCreatorCommunity = jest.fn()
const mockUseWhatsappSession = jest.fn()
const mockUseWhatsappPage = jest.fn()

jest.mock("@/app/(creator)/creator/context/creator-community-context", () => ({
  useCreatorCommunity: () => mockUseCreatorCommunity(),
}))

jest.mock("@/hooks/use-dash-prefs", () => ({
  useDashPrefs: () => ({ lang: "en" }),
}))

jest.mock("@/components/creator-dashboard/DashSidebar", () => ({
  __esModule: true,
  default: () => <aside data-testid="dash-sidebar" />,
}))

jest.mock("@/components/creator-dashboard/DashTopbar", () => ({
  __esModule: true,
  default: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <header>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  ),
}))

jest.mock("@/hooks/creator-dashboard/use-whatsapp-session", () => ({
  useWhatsappSession: () => mockUseWhatsappSession(),
}))

jest.mock("@/hooks/creator-dashboard/use-whatsapp-page", () => ({
  useWhatsappPage: () => mockUseWhatsappPage(),
}))

describe("creator marketing WhatsApp channel", () => {
  beforeEach(() => {
    mockUseCreatorCommunity.mockReturnValue({
      selectedCommunityId: "community-1",
      selectedCommunity: { _id: "community-1", name: "Community" },
      communities: [{ _id: "community-1", name: "Community" }],
      isLoading: false,
    })
    mockUseWhatsappSession.mockReturnValue({
      session: { status: "ready", phone: "+21650123456" },
      qrCodeData: undefined,
      loading: false,
      error: null,
      start: jest.fn(),
      disconnect: jest.fn(),
      refreshQr: jest.fn(),
    })
    mockUseWhatsappPage.mockReturnValue({
      campaigns: [],
      automations: [],
      contacts: [],
      eligibleContacts: [],
      stats: {
        campaigns: 0,
        recipients: 0,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
        failed: 0,
        remainingQuota: 250,
      },
      loading: false,
      error: null,
      load: jest.fn(),
      createCampaign: jest.fn(),
      sendCampaign: jest.fn(),
      cancelCampaign: jest.fn(),
      deleteCampaign: jest.fn(),
      importContact: jest.fn(),
      previewAudience: jest.fn(),
      createAutomation: jest.fn(),
      toggleAutomation: jest.fn(),
    })
  })

  it("renders backend-backed whatsapp page", () => {
    render(<WhatsAppCampaignsPage />)
    expect(screen.getByText("WhatsApp Campaigns")).toBeInTheDocument()
    expect(screen.getByText(/Connected to \+21650123456/i)).toBeInTheDocument()
    expect(screen.getByText(/No campaigns yet/i)).toBeInTheDocument()
  })
})
