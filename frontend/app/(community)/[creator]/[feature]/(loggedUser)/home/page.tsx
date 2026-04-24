"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import React from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MessageSquare,
  ImageIcon,
  Video,
  LinkIcon,
  Send,
  Smile,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Zap,
  Loader2,
  AlertCircle,
  Star,
  Settings2,
  Hash,
  PencilLine,
} from "lucide-react"
import Link from "next/link"
import { communityHomeApi, type CommunityHomeData } from "@/lib/api/community-home.api"
import { communityMembersApi, type CommunityMentionMember } from "@/lib/api/community-members.api"
import { postsApi } from "@/lib/api/posts.api"
import type { Post, PostLink } from "@/lib/api/types"
import { PostCard } from "@/app/(community)/components/post-card"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { getUserProfileHref } from "@/lib/profile-handle"
import { trackingApi } from "@/lib/api/tracking.api"

const POSTS_PAGE = 1
const POSTS_LIMIT = 10

interface FeedPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const EMPTY_PAGINATION: FeedPagination = {
  page: 1,
  limit: POSTS_LIMIT,
  total: 0,
  totalPages: 0,
}

const normalizeSavedPostForCard = (post: Post): Post => {
  const rawAuthor = ((post as any)?.author || {}) as Record<string, any>
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

export default function CommunityDashboard({ params }: { params: Promise<{ creator?: string; feature: string }> }) {
  const resolvedParams = React.use(params)
  const { feature } = resolvedParams
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // State management
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CommunityHomeData | null>(null)

  const [newPost, setNewPost] = useState("")
  const [postTitle, setPostTitle] = useState("")
  const [postTags, setPostTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [showMetadata, setShowMetadata] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [activeFeedTab, setActiveFeedTab] = useState<"all" | "saved">("all")
  const [bookmarkPendingIds, setBookmarkPendingIds] = useState<Set<string>>(new Set())

  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [savedPagination, setSavedPagination] = useState<FeedPagination>(EMPTY_PAGINATION)
  const [isLoadingSaved, setIsLoadingSaved] = useState(false)
  const [isLoadingMoreSaved, setIsLoadingMoreSaved] = useState(false)
  const [savedError, setSavedError] = useState<string | null>(null)
  const [hasLoadedSavedOnce, setHasLoadedSavedOnce] = useState(false)

  const [links, setLinks] = useState<PostLink[]>([])
  const [linkUrl, setLinkUrl] = useState<string>("")
  const [linkTitle, setLinkTitle] = useState<string>("")
  const [showLinks, setShowLinks] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isComposerExpanded, setIsComposerExpanded] = useState(false)
  const [composerCaretPosition, setComposerCaretPosition] = useState(0)
  const [composerMentionQuery, setComposerMentionQuery] = useState<string | null>(null)
  const [composerMentionStart, setComposerMentionStart] = useState<number | null>(null)
  const [composerMentionSuggestions, setComposerMentionSuggestions] = useState<CommunityMentionMember[]>([])
  const [isComposerMentionLoading, setIsComposerMentionLoading] = useState(false)

  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)

  // Media upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([])
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)

  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const postTextareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const composerMentionRequestRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusedSharedPostIdsRef = useRef<Set<string>>(new Set())
  const fetchedSharedPostIdsRef = useRef<Set<string>>(new Set())
  const hasTrackedCommunityViewRef = useRef(false)

  const COMMON_EMOJIS = ["😀", "😂", "😍", "🎉", "🔥", "👍", "❤️", "🚀", "✨", "💯"]

  const resetComposer = useCallback(() => {
    setEditingPost(null)
    setNewPost("")
    setPostTitle("")
    setPostTags([])
    setTagInput("")
    setUploadedImages([])
    setUploadedVideos([])
    setLinks([])
    setLinkUrl("")
    setLinkTitle("")
    setShowLinks(false)
    setShowEmojiPicker(false)
    setShowMetadata(false)
    setIsComposerExpanded(false)
    setComposerMentionQuery(null)
    setComposerMentionStart(null)
    setComposerMentionSuggestions([])
    setComposerCaretPosition(0)
  }, [])

  const openComposer = useCallback(() => {
    setIsComposerExpanded(true)
    requestAnimationFrame(() => {
      postTextareaRef.current?.focus()
    })
  }, [])

  const focusPostById = useCallback((postId: string) => {
    if (!postId || typeof window === "undefined") return

    const targetElementId = `post-${postId}`
    let attempts = 0

    const scrollToPost = () => {
      const el = document.getElementById(targetElementId)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlightedPostId(postId)

        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current)
        }
        highlightTimerRef.current = setTimeout(() => {
          setHighlightedPostId((prev) => (prev === postId ? null : prev))
        }, 3500)
        return
      }

      attempts += 1
      if (attempts < 8) {
        window.setTimeout(scrollToPost, 120)
      }
    }

    scrollToPost()
  }, [])

  const sharedPostId = (searchParams.get("post") || "").trim()

  const fetchHomeData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const homeData = await communityHomeApi.getHomeData(feature, POSTS_PAGE, POSTS_LIMIT)
      setData(homeData)
    } catch (err: any) {
      console.error("Error fetching community home data:", err)
      setError(err?.message || "Failed to load community data")
    } finally {
      setLoading(false)
    }
  }, [feature])

  useEffect(() => {
    if (!data || hasTrackedCommunityViewRef.current) return
    const trackingId = String((data as any)?.community?._id || (data as any)?.community?.id || (data as any)?.communityId || "").trim()
    if (!trackingId) return
    hasTrackedCommunityViewRef.current = true
    void trackingApi.trackView("community", trackingId, { source: "community_home_page" }).catch(() => undefined)
  }, [data])

  const loadSavedPosts = useCallback(
    async (page = 1, append = false) => {
      if (!data?.currentUser) {
        setSavedPosts([])
        setSavedPagination(EMPTY_PAGINATION)
        setSavedError(null)
        setHasLoadedSavedOnce(false)
        return
      }

      if (append) {
        setIsLoadingMoreSaved(true)
      } else {
        setIsLoadingSaved(true)
      }

      try {
        setSavedError(null)
        const response = await postsApi.getBookmarks({ page, limit: POSTS_LIMIT })
        const fetchedPosts = (response.posts || []).map((post) => ({
          ...normalizeSavedPostForCard(post),
          isBookmarkedByUser: true,
        }))

        if (append) {
          setSavedPosts((prev) => {
            const map = new Map<string, Post>()
            prev.forEach((post) => map.set(post.id, post))
            fetchedPosts.forEach((post) => map.set(post.id, post))
            return Array.from(map.values())
          })
        } else {
          setSavedPosts(fetchedPosts)
        }

        setSavedPagination({
          page: response.pagination?.page ?? page,
          limit: response.pagination?.limit ?? POSTS_LIMIT,
          total: response.pagination?.total ?? fetchedPosts.length,
          totalPages: response.pagination?.totalPages ?? (fetchedPosts.length > 0 ? 1 : 0),
        })
      } catch (err: any) {
        console.error("Error loading bookmarks:", err)
        setSavedError(err?.message || "Failed to load saved posts")
        toast({
          title: "Could not load saved posts",
          description: err?.message || "Please try again.",
          variant: "destructive",
        })
      } finally {
        if (!append) {
          setHasLoadedSavedOnce(true)
        }
        setIsLoadingSaved(false)
        setIsLoadingMoreSaved(false)
      }
    },
    [data?.currentUser, toast],
  )

  // Fetch data on mount and feature changes
  useEffect(() => {
    void fetchHomeData()
  }, [fetchHomeData])

  useEffect(() => {
    // Prefetch saved posts once so Saved badge count is accurate before tab is opened.
    if (!data?.currentUser?.id) return
    if (isLoadingSaved || isLoadingMoreSaved) return
    if (hasLoadedSavedOnce) return
    void loadSavedPosts(1, false)
  }, [data?.currentUser?.id, hasLoadedSavedOnce, isLoadingMoreSaved, isLoadingSaved, loadSavedPosts])

  useEffect(() => {
    setSavedPosts([])
    setSavedPagination(EMPTY_PAGINATION)
    setSavedError(null)
    setHasLoadedSavedOnce(false)
  }, [feature, data?.currentUser?.id])

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
      if (composerMentionRequestRef.current) {
        clearTimeout(composerMentionRequestRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const communityId = String(data?.community?.id || "")
    const query = (composerMentionQuery || "").trim()

    if (!communityId || !query) {
      setComposerMentionSuggestions([])
      setIsComposerMentionLoading(false)
      return
    }

    if (composerMentionRequestRef.current) {
      clearTimeout(composerMentionRequestRef.current)
    }

    setIsComposerMentionLoading(true)
    composerMentionRequestRef.current = setTimeout(() => {
      void communityMembersApi
        .searchMembersForMention(communityId, query, 6)
        .then((results) => {
          setComposerMentionSuggestions(results)
        })
        .catch(() => {
          setComposerMentionSuggestions([])
        })
        .finally(() => {
          setIsComposerMentionLoading(false)
        })
    }, 180)

    return () => {
      if (composerMentionRequestRef.current) {
        clearTimeout(composerMentionRequestRef.current)
      }
    }
  }, [composerMentionQuery, data?.community?.id])

  useEffect(() => {
    if (!sharedPostId || !data?.community?.id) return

    if (activeFeedTab !== "all") {
      setActiveFeedTab("all")
      return
    }

    const postExistsInFeed = data.posts.some((post) => String(post.id) === sharedPostId)
    if (postExistsInFeed) {
      if (!focusedSharedPostIdsRef.current.has(sharedPostId)) {
        focusedSharedPostIdsRef.current.add(sharedPostId)
        focusPostById(sharedPostId)
      }
      return
    }

    if (fetchedSharedPostIdsRef.current.has(sharedPostId)) return
    fetchedSharedPostIdsRef.current.add(sharedPostId)

    let isMounted = true
    const loadSharedPost = async () => {
      try {
        const response = await postsApi.getById(sharedPostId)
        if (!isMounted) return

        const fetchedPost = normalizeSavedPostForCard(response.data as Post)
        const fetchedCommunityId = String((response.data as any)?.communityId || "")
        if (fetchedCommunityId && fetchedCommunityId !== String(data.community.id)) {
          return
        }

        setData((prevData) => {
          if (!prevData) return prevData
          if (prevData.posts.some((post) => String(post.id) === String(fetchedPost.id))) {
            return prevData
          }
          return {
            ...prevData,
            posts: [fetchedPost, ...prevData.posts],
          }
        })
      } catch (error) {
        console.error("Unable to load shared post:", error)
      }
    }

    void loadSharedPost()

    return () => {
      isMounted = false
    }
  }, [activeFeedTab, data?.community?.id, data?.posts, focusPostById, sharedPostId])

  const insertEmojiIntoPost = (emoji: string) => {
    const el = postTextareaRef.current
    if (!el) {
      setNewPost((prev) => prev + emoji)
      return
    }

    const start = el.selectionStart ?? newPost.length
    const end = el.selectionEnd ?? newPost.length
    const next = newPost.slice(0, start) + emoji + newPost.slice(end)
    setNewPost(next)

    // restore cursor position after state update
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + emoji.length
      el.setSelectionRange(pos, pos)
    })
  }

  const updateComposerMentionContext = useCallback((value: string, caretPosition: number) => {
    const beforeCaret = value.slice(0, Math.max(0, caretPosition))
    const mentionMatch = beforeCaret.match(/(^|\s)@([a-zA-Z0-9._-]{1,30})$/)

    if (!mentionMatch) {
      setComposerMentionQuery(null)
      setComposerMentionStart(null)
      return
    }

    const query = mentionMatch[2] || ""
    if (!query) {
      setComposerMentionQuery(null)
      setComposerMentionStart(null)
      return
    }

    setComposerMentionQuery(query)
    setComposerMentionStart(caretPosition - query.length - 1)
  }, [])

  const handleComposerTextChange = (value: string, caretPosition?: number) => {
    setNewPost(value)
    const nextCaretPosition = Math.max(0, Math.min(caretPosition ?? value.length, value.length))
    setComposerCaretPosition(nextCaretPosition)
    updateComposerMentionContext(value, nextCaretPosition)
  }

  const handleComposerMentionSelect = (member: CommunityMentionMember) => {
    if (composerMentionStart === null) return

    const caretPosition = composerCaretPosition
    const mentionEnd = Math.max(composerMentionStart + 1, caretPosition)
    const nextValue = `${newPost.slice(0, composerMentionStart)}@${member.username} ${newPost.slice(mentionEnd)}`
    const nextCaret = composerMentionStart + member.username.length + 2

    setNewPost(nextValue)
    setComposerMentionQuery(null)
    setComposerMentionStart(null)
    setComposerMentionSuggestions([])
    setComposerCaretPosition(nextCaret)

    requestAnimationFrame(() => {
      postTextareaRef.current?.focus()
      postTextareaRef.current?.setSelectionRange(nextCaret, nextCaret)
    })
  }

  const handleAddTag = () => {
    const normalizedTag = tagInput.trim().replace(/^#/, "")
    if (!normalizedTag) return
    if (postTags.includes(normalizedTag)) {
      setTagInput("")
      return
    }
    setPostTags((prev) => [...prev, normalizedTag])
    setTagInput("")
  }

  const handleRemoveTag = (tag: string) => {
    setPostTags((prev) => prev.filter((item) => item !== tag))
  }

  const handlePostUpdate = (updatedPost: Post) => {
    setData((prevData) => {
      if (!prevData) return prevData
      return {
        ...prevData,
        posts: prevData.posts.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post)),
      }
    })

    setSavedPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post)))
  }

  const handleBookmarkToggle = async (post: Post) => {
    if (!data?.currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save posts.",
        variant: "destructive",
      })
      return
    }

    let alreadyPending = false
    setBookmarkPendingIds((prev) => {
      if (prev.has(post.id)) {
        alreadyPending = true
        return prev
      }
      const next = new Set(prev)
      next.add(post.id)
      return next
    })
    if (alreadyPending) return

    const shouldBookmark = !Boolean(post.isBookmarkedByUser)

    setData((prevData) => {
      if (!prevData) return prevData
      return {
        ...prevData,
        posts: prevData.posts.map((item) =>
          item.id === post.id ? { ...item, isBookmarkedByUser: shouldBookmark } : item,
        ),
      }
    })

    setSavedPosts((prev) => {
      if (shouldBookmark) {
        const existing = prev.find((saved) => saved.id === post.id)
        if (existing) {
          return prev.map((saved) => (saved.id === post.id ? { ...saved, isBookmarkedByUser: true } : saved))
        }
        return [{ ...post, isBookmarkedByUser: true }, ...prev]
      }
      return prev.filter((saved) => saved.id !== post.id)
    })

    setSavedPagination((prev) => ({
      ...prev,
      total: Math.max(0, prev.total + (shouldBookmark ? 1 : -1)),
      totalPages:
        prev.limit > 0
          ? Math.ceil(Math.max(0, prev.total + (shouldBookmark ? 1 : -1)) / prev.limit)
          : prev.totalPages,
    }))

    try {
      if (shouldBookmark) {
        await postsApi.bookmark(post.id)
      } else {
        await postsApi.unbookmark(post.id)
      }
    } catch (err: any) {
      console.error("Bookmark toggle failed:", err)

      // rollback optimistic updates
      setData((prevData) => {
        if (!prevData) return prevData
        return {
          ...prevData,
          posts: prevData.posts.map((item) =>
            item.id === post.id ? { ...item, isBookmarkedByUser: !shouldBookmark } : item,
          ),
        }
      })

      setSavedPosts((prev) => {
        if (!shouldBookmark) {
          const exists = prev.some((saved) => saved.id === post.id)
          if (exists) {
            return prev.map((saved) => (saved.id === post.id ? { ...saved, isBookmarkedByUser: true } : saved))
          }
          return [{ ...post, isBookmarkedByUser: true }, ...prev]
        }
        return prev.filter((saved) => saved.id !== post.id)
      })

      setSavedPagination((prev) => ({
        ...prev,
        total: Math.max(0, prev.total + (shouldBookmark ? -1 : 1)),
        totalPages:
          prev.limit > 0
            ? Math.ceil(Math.max(0, prev.total + (shouldBookmark ? -1 : 1)) / prev.limit)
            : prev.totalPages,
      }))

      toast({
        title: "Save failed",
        description: err?.message || "Could not update saved state.",
        variant: "destructive",
      })
    } finally {
      setBookmarkPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(post.id)
        return next
      })
    }
  }

  const handleRequestDelete = (postId: string) => {
    setDeletePostId(postId)
  }

  const handleDeletePost = async () => {
    if (!deletePostId || isDeletingPost) return

    setIsDeletingPost(true)
    try {
      await postsApi.delete(deletePostId)
      setData((prevData) => {
        if (!prevData) return prevData
        return {
          ...prevData,
          posts: prevData.posts.filter((post) => post.id !== deletePostId),
        }
      })
      setSavedPosts((prev) => prev.filter((post) => post.id !== deletePostId))

      setDeletePostId(null)
      toast({
        title: "Post deleted",
      })
    } catch (err: any) {
      console.error("Error deleting post:", err)
      toast({
        title: "Delete failed",
        description: err?.message || "Failed to delete post.",
        variant: "destructive",
      })
    } finally {
      setIsDeletingPost(false)
    }
  }

  const handleEditPost = (post: Post) => {
    setIsComposerExpanded(true)
    setEditingPost(post)
    setNewPost(post.content || "")
    setPostTitle(post.title || "")
    setPostTags(Array.isArray(post.tags) ? post.tags : [])
    setUploadedImages(Array.isArray(post.images) ? post.images : [])
    setUploadedVideos(Array.isArray(post.videos) ? post.videos : [])
    setLinks(Array.isArray(post.links) ? post.links : [])
    setShowMetadata(Boolean(post.title || (post.tags && post.tags.length > 0)))
    setShowLinks(Boolean(post.links && post.links.length > 0))
    setShowEmojiPicker(false)

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleCreateOrUpdatePost = async () => {
    const community = data?.community
    const currentUser = data?.currentUser
    if (!newPost.trim() || !community || !currentUser) return

    setIsCreatingPost(true)
    try {
      const payload = {
        title: postTitle.trim() || undefined,
        content: newPost.trim(),
        tags: postTags.length > 0 ? postTags : undefined,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        videos: uploadedVideos.length > 0 ? uploadedVideos : undefined,
        links: links.length > 0 ? links : undefined,
      }

      if (editingPost) {
        await postsApi.update(editingPost.id, payload)
      } else {
        await postsApi.create({
          ...payload,
          communityId: community.id,
        })
      }

      await fetchHomeData()
      if (activeFeedTab === "saved") {
        await loadSavedPosts(1, false)
      }

      toast({
        title: editingPost ? "Post updated" : "Post created",
      })
      resetComposer()
    } catch (err: any) {
      console.error("Error saving post:", err)
      toast({
        title: editingPost ? "Update failed" : "Create failed",
        description: err?.message || "Failed to save post.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingPost(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingMedia(true)
    try {
      const { storageApi } = await import("@/lib/api")
      const newImages: string[] = []

      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Image too large",
            description: `${file.name} exceeds 10MB limit.`,
            variant: "destructive",
          })
          continue
        }
        const response = await storageApi.upload(file)
        if (response?.url) {
          newImages.push(response.url)
        }
      }

      setUploadedImages((prev) => [...prev, ...newImages])
    } catch (err: any) {
      console.error("Error uploading image:", err)
      toast({
        title: "Upload failed",
        description: err?.message || "Failed to upload image.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingMedia(false)
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  // Handle video upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingMedia(true)
    try {
      const { storageApi } = await import("@/lib/api")
      const newVideos: string[] = []

      for (const file of Array.from(files)) {
        if (file.size > 100 * 1024 * 1024) {
          toast({
            title: "Video too large",
            description: `${file.name} exceeds 100MB limit.`,
            variant: "destructive",
          })
          continue
        }
        const response = await storageApi.upload(file)
        if (response?.url) {
          newVideos.push(response.url)
        }
      }

      setUploadedVideos((prev) => [...prev, ...newVideos])
    } catch (err: any) {
      console.error("Error uploading video:", err)
      toast({
        title: "Upload failed",
        description: err?.message || "Failed to upload video.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingMedia(false)
      if (videoInputRef.current) videoInputRef.current.value = ""
    }
  }

  // Remove uploaded media
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const removeVideo = (index: number) => {
    setUploadedVideos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddLink = () => {
    const url = linkUrl.trim()
    if (!url) return
    setLinks((prev) => [...prev, { url, title: linkTitle.trim() || undefined }])
    setLinkUrl("")
    setLinkTitle("")
  }

  const handleRemoveLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500 mb-4" />
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load community</h2>
          <p className="text-gray-600 mb-4">{error || "Community not found"}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const { community, posts, activeChallenges, courses, currentUser, stats } = data

  // Use /[creator_name]/[feature] route structure for all navigation
  const basePath = `/${community.creator.name}/${feature}`
  const communityCreatorProfileHref = getUserProfileHref({
    username: (community.creator as any)?.username,
    name: community.creator.name,
  })
  const feedPosts = activeFeedTab === "saved" ? savedPosts : posts
  const isSavedFeedEmpty = activeFeedTab === "saved" && !isLoadingSaved && feedPosts.length === 0
  const canLoadMoreSaved =
    activeFeedTab === "saved" &&
    !isLoadingSaved &&
    !isLoadingMoreSaved &&
    savedPagination.totalPages > 0 &&
    savedPagination.page < savedPagination.totalPages
  const savedCount = Math.max(savedPagination.total, savedPosts.length)
  const isEditMode = Boolean(editingPost)
  const isComposerOpen = isEditMode || isComposerExpanded
  const composerHasContent = newPost.trim().length > 0
  const composerMediaCount = uploadedImages.length + uploadedVideos.length
  const composerLinkCount = links.length
  const currentUserId = String((currentUser as any)?.id || (currentUser as any)?._id || "")
  const creatorId = String((community.creator as any)?.id || (community.creator as any)?._id || "")
  const canPinPost = Boolean(currentUserId && creatorId && currentUserId === creatorId)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-28 sm:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Main Feed */}
            <div className="lg:col-span-3 space-y-6">
              {/* Create / Edit Post */}
              <Card className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] bg-white">
                <CardContent className="p-0">
                  {/* ── Collapsed bar ──────────────────────────────────────── */}
                  {!isComposerOpen && (
                    <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
                      {/* Avatar with online dot */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12 ring-2 ring-primary-100">
                          <AvatarImage src={currentUser?.avatar || "/placeholder.svg?height=48&width=48"} className="object-cover" />
                          <AvatarFallback className="bg-primary-100 text-primary-700 font-semibold text-base">
                            {(currentUser?.username || currentUser?.firstName || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />
                      </div>

                      {/* Pill trigger */}
                      <button
                        type="button"
                        onClick={openComposer}
                        className="group flex-1 h-11 min-w-0 rounded-full border border-slate-200 bg-slate-50/80 px-5 text-left text-sm transition-all duration-200 hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-1"
                      >
                        <span className="text-slate-400 group-hover:text-primary-500 transition-colors">Write something to the community…</span>
                      </button>

                      {/* Quick action buttons */}
                      <div className="hidden sm:flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded-full px-1 py-1 flex-shrink-0">
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="h-8 w-8 rounded-full text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Add Photo"
                          onClick={() => { setIsComposerExpanded(true); window.setTimeout(() => imageInputRef.current?.click(), 40) }}
                          disabled={isUploadingMedia}
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-slate-200" />
                        <Button
                          type="button" variant="ghost" size="icon"
                          className="h-8 w-8 rounded-full text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Add Video"
                          onClick={() => { setIsComposerExpanded(true); window.setTimeout(() => videoInputRef.current?.click(), 40) }}
                          disabled={isUploadingMedia}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ── Expanded composer ──────────────────────────────────── */}
                  {isComposerOpen && (
                    <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">

                      {/* Brand header */}
                      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-500">
                        <div className="flex items-center gap-2.5">
                          <Image src="/logo_chabaqa.png" alt="Chabaqa" width={96} height={24} sizes="96px" className="h-6 w-auto brightness-0 invert" />
                          <div className="w-px h-4 bg-white/30" />
                          <span className="text-white font-semibold text-sm tracking-tight">
                            {isEditMode ? "Edit Post" : "Create a Post"}
                          </span>
                        </div>
                        {!isEditMode && (
                          <button
                            type="button"
                            onClick={resetComposer}
                            disabled={isCreatingPost}
                            className="flex items-center gap-1 text-white/80 hover:text-white hover:bg-white/20 px-2.5 py-1.5 rounded-full transition-colors text-xs font-medium"
                          >
                            <X className="h-3.5 w-3.5" />
                            Close
                          </button>
                        )}
                      </div>

                      {/* Body */}
                      <div className="px-5 pt-4 pb-3 space-y-4">

                        {/* User row */}
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-12 w-12 ring-2 ring-primary-100">
                              <AvatarImage src={currentUser?.avatar || "/placeholder.svg?height=48&width=48"} className="object-cover" />
                              <AvatarFallback className="bg-primary-100 text-primary-700 font-semibold text-base">
                                {(currentUser?.username || currentUser?.firstName || "U").charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-tight">
                              {currentUser?.username || currentUser?.firstName || "You"}
                            </p>
                            <p className="text-xs text-slate-400 leading-tight mt-0.5">
                              posting in <span className="font-medium text-primary-500">{community.name}</span>
                            </p>
                          </div>
                        </div>

                        {/* Edit mode banner */}
                        {isEditMode && (
                          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                            <div className="flex items-center gap-2 text-sm text-amber-800">
                              <PencilLine className="h-4 w-4" />
                              Editing post
                            </div>
                            <Button
                              type="button" variant="ghost" size="sm"
                              onClick={resetComposer} disabled={isCreatingPost}
                              className="text-amber-800 hover:text-amber-900 h-7 text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}

                        {/* Textarea */}
                        <div className="relative">
                          <Textarea
                            placeholder="Share your progress, ask questions, or celebrate wins…"
                            value={newPost}
                            onChange={(e) => {
                              handleComposerTextChange(e.target.value, e.target.selectionStart ?? e.target.value.length)
                            }}
                            onClick={(e) => {
                              const target = e.currentTarget
                              const nextCaret = target.selectionStart ?? newPost.length
                              setComposerCaretPosition(nextCaret)
                              updateComposerMentionContext(newPost, nextCaret)
                            }}
                            onKeyUp={(e) => {
                              const target = e.currentTarget
                              const nextCaret = target.selectionStart ?? newPost.length
                              setComposerCaretPosition(nextCaret)
                              updateComposerMentionContext(newPost, nextCaret)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Tab" && composerMentionSuggestions.length > 0 && composerMentionQuery) {
                                e.preventDefault()
                                handleComposerMentionSelect(composerMentionSuggestions[0])
                              }
                            }}
                            ref={postTextareaRef}
                            className="min-h-[120px] sm:min-h-[140px] resize-none border border-slate-200 bg-slate-50/50 rounded-xl px-4 py-3 focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:border-primary-300 text-sm sm:text-[15px] leading-6 text-slate-700 placeholder:text-slate-400 transition-colors"
                          />
                          {composerMentionQuery && (composerMentionSuggestions.length > 0 || isComposerMentionLoading) && (
                            <div className="absolute left-2 right-2 bottom-12 z-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                              {isComposerMentionLoading ? (
                                <div className="px-3 py-2 text-xs text-slate-500">Searching members...</div>
                              ) : (
                                <ul className="max-h-52 overflow-y-auto py-1">
                                  {composerMentionSuggestions.map((member) => (
                                    <li key={member.id}>
                                      <button
                                        type="button"
                                        onClick={() => handleComposerMentionSelect(member)}
                                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                                      >
                                        <Avatar className="h-7 w-7">
                                          <AvatarImage src={member.avatar || "/placeholder.svg?height=28&width=28"} className="object-cover" />
                                          <AvatarFallback className="text-[11px]">
                                            {(member.username || member.firstName || "U").charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-medium text-slate-800">@{member.username}</p>
                                          <p className="truncate text-xs text-slate-500">{[member.firstName, member.lastName].filter(Boolean).join(" ")}</p>
                                        </div>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                          {newPost.length > 0 && (
                            <div className="absolute bottom-2.5 right-3 text-[10px] font-medium text-slate-400 select-none">
                              {newPost.length}
                            </div>
                          )}
                        </div>

                        {/* Media Preview */}
                        {(uploadedImages.length > 0 || uploadedVideos.length > 0) && (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {uploadedImages.map((url, index) => (
                              <div key={`img-${index}`} className="relative group aspect-square">
                                <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover rounded-xl" />
                                <button
                                  onClick={() => removeImage(index)}
                                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            {uploadedVideos.map((url, index) => (
                              <div key={`vid-${index}`} className="relative group aspect-square">
                                <video src={url} className="w-full h-full object-cover rounded-xl" />
                                <button
                                  onClick={() => removeVideo(index)}
                                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Metadata accordion */}
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setShowMetadata((v) => !v)}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                              showMetadata
                                ? "bg-primary-50 text-primary-700 border-primary-200"
                                : "text-slate-500 bg-white border-slate-200 hover:border-slate-300 hover:text-slate-700"
                            }`}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            {showMetadata ? "Hide title & tags" : "Add title & tags"}
                            {showMetadata ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          {showMetadata && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                              <Input
                                placeholder="Post title (optional)"
                                value={postTitle}
                                onChange={(e) => setPostTitle(e.target.value)}
                                className="bg-white"
                              />
                              <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Input
                                    placeholder="Add a tag (press Enter)"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag() } }}
                                    className="bg-white"
                                  />
                                  <Button type="button" variant="secondary" onClick={handleAddTag} disabled={!tagInput.trim()} className="shrink-0">
                                    <Hash className="h-4 w-4 mr-1" /> Add
                                  </Button>
                                </div>
                                {postTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {postTags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
                                        #{tag}
                                        <button type="button" onClick={() => handleRemoveTag(tag)} className="rounded-full p-0.5 hover:bg-gray-300">
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Links accordion */}
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => setShowLinks((v) => !v)}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                              showLinks
                                ? "bg-primary-50 text-primary-700 border-primary-200"
                                : "text-slate-500 bg-white border-slate-200 hover:border-slate-300 hover:text-slate-700"
                            }`}
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            {showLinks ? "Hide links" : "Add links"}
                            {composerLinkCount > 0 && (
                              <span className="ml-0.5 bg-primary-500 text-white rounded-full px-1.5 py-0 text-[10px] leading-4">{composerLinkCount}</span>
                            )}
                            {showLinks ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          {showLinks && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="bg-white" />
                                <Input placeholder="Title (optional)" value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} className="bg-white" />
                                <Button type="button" variant="secondary" onClick={handleAddLink} disabled={!linkUrl.trim()} className="shrink-0">Add</Button>
                              </div>
                              {links.length > 0 && (
                                <div className="space-y-2">
                                  {links.map((link, idx) => (
                                    <div key={`${link.url}-${idx}`} className="flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5">
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">{link.title || link.url}</div>
                                        <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                                      </div>
                                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLink(idx)}>
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Emoji picker */}
                        {showEmojiPicker && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="grid grid-cols-10 gap-1">
                              {COMMON_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji} type="button"
                                  onClick={() => insertEmojiIntoPost(emoji)}
                                  className="text-xl hover:bg-white p-1.5 rounded-lg transition hover:scale-110"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>{/* end body */}

                      {/* Hidden file inputs */}
                      <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                      <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />

                      {/* ── Toolbar footer ─────────────────────────────────── */}
                      <div className="flex items-center justify-between gap-2 px-5 py-3 bg-slate-50/80 border-t border-slate-100">
                        <div className="flex items-center gap-0.5">
                          <Button
                            type="button" variant="ghost" size="sm"
                            className="h-9 rounded-full px-2.5 sm:px-3 text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Add Photo" onClick={() => imageInputRef.current?.click()} disabled={isUploadingMedia}
                          >
                            <ImageIcon className="h-4 w-4" />
                            <span className="ml-1.5 hidden sm:inline text-xs font-medium">{isUploadingMedia ? "…" : "Photo"}</span>
                          </Button>
                          <Button
                            type="button" variant="ghost" size="sm"
                            className="h-9 rounded-full px-2.5 sm:px-3 text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Add Video" onClick={() => videoInputRef.current?.click()} disabled={isUploadingMedia}
                          >
                            <Video className="h-4 w-4" />
                            <span className="ml-1.5 hidden sm:inline text-xs font-medium">Video</span>
                          </Button>
                          <Button
                            type="button" variant="ghost" size="sm"
                            className="h-9 rounded-full px-2.5 sm:px-3 text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="Add Link" onClick={() => setShowLinks(true)}
                          >
                            <LinkIcon className="h-4 w-4" />
                            <span className="ml-1.5 hidden sm:inline text-xs font-medium">Link</span>
                          </Button>
                          <Button
                            type="button" variant="ghost" size="sm"
                            className={`h-9 rounded-full px-2.5 sm:px-3 transition-colors ${showEmojiPicker ? "text-primary-600 bg-primary-50" : "text-slate-500 hover:text-primary-600 hover:bg-primary-50"}`}
                            title="Emoji" onClick={() => setShowEmojiPicker((v) => !v)}
                          >
                            <Smile className="h-4 w-4" />
                            <span className="ml-1.5 hidden sm:inline text-xs font-medium">Emoji</span>
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isEditMode && (
                            <Button
                              type="button" variant="ghost" size="sm"
                              className="h-9 rounded-full px-4 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                              onClick={resetComposer} disabled={isCreatingPost}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            onClick={handleCreateOrUpdatePost}
                            disabled={!composerHasContent || isCreatingPost || !currentUser || isUploadingMedia}
                            className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white text-xs sm:text-sm px-5 h-9 sm:h-10 rounded-full transition-all disabled:opacity-50 shadow-md shadow-primary-200/60 font-semibold tracking-tight"
                          >
                            {isCreatingPost ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                {isEditMode ? "Saving…" : "Posting…"}
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                {isEditMode ? "Save changes" : "Post"}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                    </div>
                  )}

                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white/95 backdrop-blur-sm sticky top-[65px] z-40 rounded-2xl">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex rounded-2xl bg-gray-100/80 p-1 shadow-inner">
                      <Button
                        type="button"
                        variant={activeFeedTab === "all" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setActiveFeedTab("all")}
                      >
                        All Posts ({posts.length})
                      </Button>
                      <Button
                        type="button"
                        variant={activeFeedTab === "saved" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => {
                          setHasLoadedSavedOnce(false)
                          setActiveFeedTab("saved")
                        }}
                      >
                        Saved ({savedCount})
                      </Button>
                    </div>
                    {activeFeedTab === "saved" && (isLoadingSaved || isLoadingMoreSaved) && (
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Loading saved posts...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Posts Feed */}
              <div className="space-y-6">
                {activeFeedTab === "saved" && isLoadingSaved && feedPosts.length === 0 ? (
                  <Card className="border-0 shadow-sm bg-white/95 backdrop-blur-sm sticky top-[65px] z-40 rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-500 mb-3" />
                      <p className="text-gray-600">Loading saved posts...</p>
                    </CardContent>
                  </Card>
                ) : activeFeedTab === "saved" && savedError && feedPosts.length === 0 ? (
                  <Card className="border-0 shadow-sm bg-white/95 backdrop-blur-sm sticky top-[65px] z-40 rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load saved posts</h3>
                      <p className="text-sm text-gray-600 mb-4">{savedError}</p>
                      <Button onClick={() => void loadSavedPosts(1, false)}>Try again</Button>
                    </CardContent>
                  </Card>
                ) : feedPosts.length === 0 ? (
                  <Card className="border-0 shadow-sm bg-white/95 backdrop-blur-sm sticky top-[65px] z-40 rounded-2xl">
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {isSavedFeedEmpty ? "No saved posts yet" : "No posts yet"}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {isSavedFeedEmpty
                          ? "Saved posts will appear here when you bookmark them."
                          : "Be the first to share something with the community!"}
                      </p>
                      {!isSavedFeedEmpty && currentUser && (
                        <Button onClick={openComposer}>Create First Post</Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {feedPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        canPinPost={canPinPost}
                        currentUser={currentUser}
                        isHighlighted={highlightedPostId === post.id}
                        isBookmarked={Boolean(post.isBookmarkedByUser)}
                        isBookmarkPending={bookmarkPendingIds.has(post.id)}
                        onPostUpdate={handlePostUpdate}
                        onDelete={handleRequestDelete}
                        onBookmark={handleBookmarkToggle}
                        onEdit={handleEditPost}
                      />
                    ))}

                    {canLoadMoreSaved && (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void loadSavedPosts(savedPagination.page + 1, true)}
                          disabled={isLoadingMoreSaved}
                        >
                          {isLoadingMoreSaved ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            "Load more saved posts"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block lg:col-span-1 space-y-6 lg:sticky lg:top-0 lg:self-start">
              {/* Active Challenge */}
              {activeChallenges.length > 0 && (
                <Card className="border-0 shadow-sm bg-gradient-to-br from-challenges-50 to-orange-50">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center text-base sm:text-lg">
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-challenges-500" />
                      Active Challenge
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm sm:text-base">{activeChallenges[0].title}</h4>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{activeChallenges[0].description}</p>
                      <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                        <span className="text-muted-foreground">Participants</span>
                        <span className="font-medium">{activeChallenges[0].participantCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm mb-3">
                        <span className="text-muted-foreground">Days Left</span>
                        <span className="font-medium">
                          {Math.ceil((new Date(activeChallenges[0].endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                      <Button size="sm" className="w-full bg-challenges-500 hover:bg-challenges-600 text-xs sm:text-sm" asChild>
                        <Link href={`${basePath}/challenges`}>Continue Challenge</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Community Info */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg">About Community</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                  {/* Creator Info */}
                  <Link href={communityCreatorProfileHref} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-slate-200 flex-shrink-0">
                      <AvatarImage src={community.creator.avatar || "/placeholder.svg"} className="object-cover" />
                      <AvatarFallback className="text-base font-semibold">
                        {community.creator.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm sm:text-base truncate">{community.creator.name}</h4>
                      <p className="text-xs text-muted-foreground">Community Creator</p>
                    </div>
                  </Link>

                  {/* Description */}
                  <div>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{community.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Courses */}
              {courses.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-base sm:text-lg">Continue Learning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                    {courses.slice(0, 2).map((course) => (
                      <Link
                        key={course.id}
                        href={`${basePath}/courses/${course.id}`}
                        className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-courses-50 rounded-lg hover:bg-courses-100 transition-colors cursor-pointer"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-courses-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-courses-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm truncate">{course.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {course.enrollmentCount} student{course.enrollmentCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </Link>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full text-xs sm:text-sm" asChild>
                      <Link href={`${basePath}/courses`}>
                        View All {courses.length} Course{courses.length !== 1 ? "s" : ""}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Community Stats */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg">Community</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Total Members</span>
                    <span className="font-semibold">{community.members.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Active Today</span>
                    <span className="font-semibold">{stats.activeToday.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">Posts This Week</span>
                    <span className="font-semibold">{stats.postsThisWeek.toLocaleString()}</span>
                  </div>
                  {stats.userRank && (
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Your Rank</span>
                      <span className="font-semibold text-primary-600">#{stats.userRank}</span>
                    </div>
                  )}
                  {/* Community Rating */}
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Rating</span>
                    <Link href={`${basePath}/reviews`} className="flex items-center gap-1 hover:text-primary-600 transition-colors">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{(community as any).averageRating?.toFixed(1) || community.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-muted-foreground">({(community as any).ratingCount || 0})</span>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
        </div>
      </div>

      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will remove the post from the community feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingPost}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeletingPost}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingPost ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
