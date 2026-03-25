import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { PostShareDialog } from "@/app/(community)/components/post-share-dialog"
import { postsApi } from "@/lib/api/posts.api"

const mockToast = jest.fn()
const mockOpen = jest.fn()

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

jest.mock("@/lib/api/posts.api", () => ({
  postsApi: {
    getShareMeta: jest.fn(),
    share: jest.fn(),
  },
}))

describe("PostShareDialog", () => {
  const shareMeta = {
    postId: "post-1",
    shareUrl: "https://chabaqa.io/Creator/chabaqa-test/home?post=post-1",
    title: "Design System Tips",
    text: "Check out this post from Chabaqa Test",
    platformUrls: {
      whatsapp: "https://wa.me/?text=abc",
      x: "https://twitter.com/intent/tweet?text=abc",
      facebook: "https://facebook.com/share?u=abc",
      linkedin: "https://linkedin.com/shareArticle?url=abc",
      telegram: "https://t.me/share/url?url=abc",
      email: "mailto:?subject=abc&body=abc",
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(postsApi.getShareMeta as jest.Mock).mockResolvedValue({ success: true, data: shareMeta })
    ;(postsApi.share as jest.Mock).mockResolvedValue({
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
    ;(window as any).open = jest.fn()
    ;(navigator as any).clipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    }
  })

  it("copies link and tracks share action", async () => {
    const onShareTracked = jest.fn()
    render(<PostShareDialog postId="post-1" open onOpenChange={mockOpen} onShareTracked={onShareTracked} />)

    await waitFor(() => {
      expect(postsApi.getShareMeta).toHaveBeenCalledWith("post-1")
    })
    await waitFor(() => {
      expect(screen.getByLabelText("Share URL")).toHaveValue(shareMeta.shareUrl)
    })

    fireEvent.click(screen.getByRole("button", { name: /copy link/i }))

    await waitFor(() => {
      expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith(shareMeta.shareUrl)
      expect(postsApi.share).toHaveBeenCalledWith("post-1", {
        method: "copy_link",
        targetUrl: shareMeta.shareUrl,
      })
      expect(onShareTracked).toHaveBeenCalled()
    })
  })

  it("opens selected platform URL and tracks with platform method", async () => {
    render(<PostShareDialog postId="post-1" open onOpenChange={mockOpen} />)

    await waitFor(() => {
      expect(postsApi.getShareMeta).toHaveBeenCalledWith("post-1")
    })
    await waitFor(() => {
      expect(screen.getByLabelText("Share URL")).toHaveValue(shareMeta.shareUrl)
    })

    fireEvent.click(screen.getByRole("button", { name: /whatsapp/i }))

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(shareMeta.platformUrls.whatsapp, "_blank", "noopener,noreferrer")
      expect(postsApi.share).toHaveBeenCalledWith("post-1", {
        method: "whatsapp",
        targetUrl: shareMeta.platformUrls.whatsapp,
      })
    })
  })

  it("hides native-share button when browser does not support navigator.share", async () => {
    ;(navigator as any).share = undefined

    render(<PostShareDialog postId="post-1" open onOpenChange={mockOpen} />)

    await waitFor(() => {
      expect(postsApi.getShareMeta).toHaveBeenCalledWith("post-1")
    })
    await waitFor(() => {
      expect(screen.getByLabelText("Share URL")).toHaveValue(shareMeta.shareUrl)
    })

    expect(screen.queryByRole("button", { name: /native share/i })).not.toBeInTheDocument()
  })
})
