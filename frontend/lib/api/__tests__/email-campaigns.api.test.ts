import { emailCampaignsApi } from "@/lib/api/email-campaigns.api"
import { apiClient } from "@/lib/api/client"

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}))

describe("emailCampaignsApi response normalization", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("unwraps nested campaign list payloads", async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          campaigns: [{ _id: "campaign-1", title: "Campaign" }],
          total: 1,
          page: 1,
          limit: 10,
        },
      },
    })

    const response = await emailCampaignsApi.getCommunityCampaigns("community-1", { page: 1, limit: 10 })

    expect(response.campaigns).toHaveLength(1)
    expect(response.total).toBe(1)
  })

  it("returns queued send response from wrapped data", async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      data: { message: "Campaign queued for sending", campaignId: "campaign-1", queued: true },
    })

    const response = await emailCampaignsApi.sendCampaign("campaign-1")

    expect(response.queued).toBe(true)
    expect(response.campaignId).toBe("campaign-1")
  })

  it("normalizes inactivity periods payload", async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      periods: [{ value: "last_7_days", label: "Last 7 days", days: 7 }],
    })

    const response = await emailCampaignsApi.getInactivityPeriods()

    expect(response.periods[0].value).toBe("last_7_days")
  })

  it("loads marketing merge fields from the backend composer endpoint", async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        communityId: "community-1",
        fields: [{ key: "userFirstName", token: "{{userFirstName}}" }],
        groups: [{ key: "recipient", label: "Recipient", fields: [] }],
        sampleData: { userFirstName: "Lina" },
        dataSummary: { members: 12 },
      },
    })

    const response = await emailCampaignsApi.getMarketingMergeFields("community-1", {
      campaignType: "announcement",
    })

    expect(apiClient.get).toHaveBeenCalledWith(
      "/email-campaigns/community/community-1/merge-fields",
      { campaignType: "announcement" },
    )
    expect(response.sampleData.userFirstName).toBe("Lina")
    expect(response.dataSummary.members).toBe(12)
  })

  it("loads backend marketing templates", async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        communityId: "community-1",
        templates: [{ id: "content-launch", name: "Content Launch" }],
        categories: ["content"],
        total: 1,
      },
    })

    const response = await emailCampaignsApi.getMarketingTemplates("community-1", {
      category: "content",
    })

    expect(apiClient.get).toHaveBeenCalledWith(
      "/email-campaigns/community/community-1/templates",
      { category: "content" },
    )
    expect(response.templates[0].id).toBe("content-launch")
  })

  it("renders marketing preview through the backend", async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        subject: "Hello Lina",
        content: "Body",
        isHtml: false,
        variables: { userFirstName: "Lina" },
        usedVariables: ["userFirstName"],
        missingVariables: [],
        contentData: {},
      },
    })

    const response = await emailCampaignsApi.renderMarketingPreview({
      communityId: "community-1",
      subject: "Hello {{userFirstName}}",
      content: "Body",
    })

    expect(apiClient.post).toHaveBeenCalledWith(
      "/email-campaigns/render-preview",
      {
        communityId: "community-1",
        subject: "Hello {{userFirstName}}",
        content: "Body",
      },
    )
    expect(response.subject).toBe("Hello Lina")
  })
})
