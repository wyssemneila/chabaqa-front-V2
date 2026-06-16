import { whatsappApi } from "@/lib/api/whatsapp.api"
import { apiClient } from "@/lib/api/client"

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}))

describe("whatsappApi", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("loads campaigns for a community", async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValueOnce({ campaigns: [] })

    await whatsappApi.listCampaigns("community-1", { limit: 10 })

    expect(apiClient.get).toHaveBeenCalledWith("/whatsapp-campaigns/community/community-1", { limit: 10 })
  })

  it("creates a campaign through the Chabaqa backend", async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValueOnce({ _id: "campaign-1" })

    await whatsappApi.createCampaign({
      communityId: "community-1",
      title: "Launch",
      body: "Hello",
      targetAudience: "all_members",
    })

    expect(apiClient.post).toHaveBeenCalledWith("/whatsapp-campaigns", {
      communityId: "community-1",
      title: "Launch",
      body: "Hello",
      targetAudience: "all_members",
    })
  })
})
