import { postsApi } from "@/lib/api/posts.api"
import { apiClient } from "@/lib/api/client"

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

describe("postsApi share endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("calls POST /posts/:id/share with optional tracking payload", async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        postId: "post-1",
        totalLikes: 0,
        totalComments: 0,
        totalShares: 1,
        isLikedByUser: false,
        isSharedByUser: true,
      },
    })

    await postsApi.share("post-1", {
      method: "copy_link",
      targetUrl: "https://chabaqa.io/Creator/chabaqa-test/home?post=post-1",
    })

    expect(apiClient.post).toHaveBeenCalledWith("/posts/post-1/share", {
      method: "copy_link",
      targetUrl: "https://chabaqa.io/Creator/chabaqa-test/home?post=post-1",
    })
  })

  it("keeps backward compatibility for share(id) without payload", async () => {
    ;(apiClient.post as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        postId: "post-2",
        totalLikes: 0,
        totalComments: 0,
        totalShares: 1,
        isLikedByUser: false,
        isSharedByUser: true,
      },
    })

    await postsApi.share("post-2")

    expect(apiClient.post).toHaveBeenCalledWith("/posts/post-2/share", undefined)
  })

  it("fetches share metadata using GET /posts/:id/share", async () => {
    ;(apiClient.get as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        postId: "post-3",
        shareUrl: "https://chabaqa.io/Creator/chabaqa-test/home?post=post-3",
      },
    })

    await postsApi.getShareMeta("post-3")

    expect(apiClient.get).toHaveBeenCalledWith("/posts/post-3/share")
  })
})

