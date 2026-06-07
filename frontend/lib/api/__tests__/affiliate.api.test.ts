import { affiliateApi } from "@/lib/api/affiliate.api"
import { apiClient } from "@/lib/api/client"

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}))

describe("affiliateApi creator marketing", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("loads rich marketing data with sanitized query params", async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      data: {
        data: {
          generatedAt: "2026-05-25T00:00:00.000Z",
          summary: { clicks: 12 },
          leaderboards: { partners: [], links: [] },
        },
      },
    })

    const response = await affiliateApi.creator.getMarketing({
      communityId: "community-1",
      days: 30,
      interval: "daily",
      includeTemplates: true,
      programId: "",
    })

    expect(apiClient.get).toHaveBeenCalledWith("/affiliate/creator/marketing", {
      communityId: "community-1",
      days: 30,
      interval: "daily",
      includeTemplates: true,
    })
    expect(response.summary.clicks).toBe(12)
  })

  it("translates link builder payload into backend link DTO fields", async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        _id: "link-1",
        code: "ABCD1234",
      },
    })

    await affiliateApi.creator.createLink({
      programId: "program-1",
      partnerId: "partner-1",
      targetType: "course",
      targetId: "course-1",
      targetPath: "/en/community/courses/course-1",
      label: "Course campaign",
      utmSource: "instagram",
      utmMedium: "social",
      utmCampaign: "launch",
    })

    expect(apiClient.post).toHaveBeenCalledWith("/affiliate/creator/links", {
      programId: "program-1",
      partnerUserId: "partner-1",
      targetPath: "/en/community/courses/course-1",
      label: "Course campaign",
      targetContentType: "course",
      targetContentId: "course-1",
      utmSource: "instagram",
      utmMedium: "social",
      utmCampaign: "launch",
    })
  })

  it("supports object-style partner invite calls from the page", async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      data: {
        _id: "partner-1",
        status: "pending",
      },
    })

    await affiliateApi.creator.invitePartner({
      programId: "program-1",
      email: "partner@chabaqa.io",
      displayName: "Partner",
      tags: ["launch"],
    })

    expect(apiClient.post).toHaveBeenCalledWith("/affiliate/creator/programs/program-1/partners", {
      email: "partner@chabaqa.io",
      displayName: "Partner",
      tags: ["launch"],
    })
  })

  it("exposes payout admin aliases used by the creator page", async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({ data: [{ _id: "payout-1" }] })
    ;(apiClient.post as jest.Mock).mockResolvedValue({ data: { _id: "payout-1", status: "approved" } })

    const payouts = await affiliateApi.creator.listPayouts({ status: "pending", limit: 10 })
    await affiliateApi.creator.approvePayout("payout-1")

    expect(apiClient.get).toHaveBeenCalledWith("/admin/affiliate/payouts", {
      status: "pending",
      limit: 10,
    })
    expect(payouts[0]._id).toBe("payout-1")
    expect(apiClient.post).toHaveBeenCalledWith("/admin/affiliate/payouts/payout-1/approve", {
      adminNotes: undefined,
    })
  })
})
