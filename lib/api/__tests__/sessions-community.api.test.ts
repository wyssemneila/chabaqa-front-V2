import { sessionsCommunityApi } from "@/lib/api/sessions-community.api"
import { communitiesApi } from "@/lib/api/communities.api"
import { sessionsApi } from "@/lib/api/sessions.api"

jest.mock("@/lib/api/communities.api", () => ({
  communitiesApi: {
    getBySlug: jest.fn(),
  },
}))

jest.mock("@/lib/api/sessions.api", () => ({
  sessionsApi: {
    getByCommunity: jest.fn(),
  },
}))

describe("sessionsCommunityApi mapping", () => {
  it("maps backend session averageRating/ratingCount to session and mentor fields", async () => {
    ;(communitiesApi.getBySlug as jest.Mock).mockResolvedValue({
      data: { id: "community-1", name: "Community" },
    })
    ;(sessionsApi.getByCommunity as jest.Mock).mockResolvedValue([
      {
        _id: "mongo-session-id",
        id: "custom-session-id",
        title: "Session A",
        description: "desc",
        duration: 60,
        price: 50,
        currency: "USD",
        creatorId: "creator-1",
        communityId: "community-1",
        isActive: true,
        averageRating: 4.6,
        ratingCount: 12,
      },
    ])

    const result = await sessionsCommunityApi.getSessionsPageData("community-slug")

    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0].id).toBe("custom-session-id")
    expect(result.sessions[0].averageRating).toBe(4.6)
    expect(result.sessions[0].ratingCount).toBe(12)
    expect(result.sessions[0].mentor?.rating).toBe(4.6)
    expect(result.sessions[0].mentor?.reviews).toBe(12)
  })
})
