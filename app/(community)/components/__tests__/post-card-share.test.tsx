import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { PostCard } from "@/app/(community)/components/post-card"
import type { Post, User } from "@/lib/api/types"

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}))

jest.mock("@/lib/api/posts.api", () => ({
  postsApi: {
    like: jest.fn(),
    unlike: jest.fn(),
    getComments: jest.fn(),
    createComment: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
  },
}))

jest.mock("@/app/(community)/components/post-share-dialog", () => ({
  PostShareDialog: ({ open }: { open: boolean }) => (
    <div data-testid="post-share-dialog">{open ? "open" : "closed"}</div>
  ),
}))

describe("PostCard share behavior", () => {
  it("opens share dialog even when post is already shared", () => {
    const currentUser: User = {
      id: "user-1",
      email: "user@test.com",
      username: "User",
      role: "member",
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const post: Post = {
      id: "post-1",
      title: "Post title",
      content: "Post content",
      communityId: "community-1",
      authorId: "author-1",
      isPublished: true,
      likes: 1,
      commentsCount: 2,
      shareCount: 7,
      isLikedByUser: false,
      isSharedByUser: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: {
        id: "author-1",
        email: "author@test.com",
        username: "Author",
        role: "creator",
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }

    render(<PostCard post={post} currentUser={currentUser} />)

    const shareCounter = screen.getByText("7")
    const shareButton = shareCounter.closest("button")

    expect(shareButton).not.toBeNull()
    expect(shareButton).not.toBeDisabled()
    expect(screen.getByTestId("post-share-dialog")).toHaveTextContent("closed")

    fireEvent.click(shareButton as HTMLButtonElement)

    expect(screen.getByTestId("post-share-dialog")).toHaveTextContent("open")
  })
})

