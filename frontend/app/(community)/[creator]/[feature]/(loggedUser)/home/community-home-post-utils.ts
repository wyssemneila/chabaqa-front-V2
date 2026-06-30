import type { Post } from "@/lib/api/types"

export interface FeedPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const POSTS_PAGE = 1
export const POSTS_LIMIT = 10

export const EMPTY_PAGINATION: FeedPagination = {
  page: 1,
  limit: POSTS_LIMIT,
  total: 0,
  totalPages: 0,
}

export const normalizeSavedPostForCard = (post: Post): Post => {
  const rawAuthor = (((post as unknown) as { author?: Record<string, unknown> })?.author || {}) as Record<string, unknown>
  const authorName =
    (typeof rawAuthor.username === "string" && rawAuthor.username.trim()) ||
    (typeof rawAuthor.name === "string" && rawAuthor.name.trim()) ||
    (typeof rawAuthor.firstName === "string" && rawAuthor.firstName.trim()) ||
    "Anonymous"

  const authorId =
    (typeof rawAuthor.id === "string" && rawAuthor.id) ||
    (typeof rawAuthor._id === "string" && rawAuthor._id) ||
    (typeof post.authorId === "string" ? post.authorId : "")

  const firstName = (() => {
    if (typeof rawAuthor.firstName === "string" && rawAuthor.firstName.trim()) return rawAuthor.firstName.trim()
    const [head] = authorName.split(" ")
    return head || authorName
  })()

  const lastName =
    (typeof rawAuthor.lastName === "string" && rawAuthor.lastName.trim())
      ? rawAuthor.lastName.trim()
      : undefined

  const avatar =
    (typeof rawAuthor.avatar === "string" && rawAuthor.avatar) ||
    (typeof rawAuthor.profile_picture === "string" && rawAuthor.profile_picture) ||
    (typeof rawAuthor.photo_profil === "string" && rawAuthor.photo_profil) ||
    undefined

  const role = ((typeof rawAuthor.role === "string" && rawAuthor.role.trim()) || "member") as
    | "admin"
    | "creator"
    | "member"

  return {
    ...post,
    author: {
      id: authorId,
      email: (typeof rawAuthor.email === "string" && rawAuthor.email) || "",
      username: authorName,
      firstName,
      lastName,
      avatar,
      role,
      verified: Boolean(rawAuthor.verified),
      createdAt:
        (typeof rawAuthor.createdAt === "string" && rawAuthor.createdAt) ||
        post.createdAt ||
        new Date().toISOString(),
      updatedAt:
        (typeof rawAuthor.updatedAt === "string" && rawAuthor.updatedAt) ||
        post.updatedAt ||
        new Date().toISOString(),
    },
  }
}
