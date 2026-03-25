"use client"

import React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Heart,
  MessageSquare,
  Share,
  Bookmark,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Pin,
  PinOff,
  Smile,
  CornerDownRight,
} from "lucide-react"
import { postsApi } from "@/lib/api/posts.api"
import { communityMembersApi, type CommunityMentionMember } from "@/lib/api/community-members.api"
import type { Post, PostComment, PostStats, User } from "@/lib/api/types"
import { trackingApi } from "@/lib/api/tracking.api"
import { resolveImageUrl } from "@/lib/hooks/useUser"
import { getUserProfileHref } from "@/lib/profile-handle"
import { useToast } from "@/hooks/use-toast"
import { PostShareDialog } from "@/app/(community)/components/post-share-dialog"

// ─── Emoji quick-pick list ────────────────────────────────────────────────────
const QUICK_REACTIONS = ["👍", "🔥", "😂", "😮", "👏", "🎉", "💯"]

// ─── Standalone helpers (defined once, outside the component) ─────────────────

function formatTimeAgo(dateString: string | Date) {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60_000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function getLinkMeta(rawUrl?: string) {
  if (!rawUrl) return { href: "#", hostname: "invalid-url", isValid: false }
  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
  try {
    const u = new URL(withProtocol)
    return { href: u.toString(), hostname: u.hostname, isValid: true }
  } catch {
    return { href: "#", hostname: "invalid-url", isValid: false }
  }
}

function renderMentions(text: string) {
  const parts = text.split(/(@[a-zA-Z0-9._-]+)/g)
  return parts.map((part, i) =>
    /^@[a-zA-Z0-9._-]+$/.test(part)
      ? <span key={i} className="text-blue-600 font-medium hover:underline">{part}</span>
      : <React.Fragment key={i}>{part}</React.Fragment>,
  )
}

function getReactionUsernames(reaction: any): string[] {
  const fromFlat = [
    ...(Array.isArray(reaction?.usernames) ? reaction.usernames : []),
    ...(Array.isArray(reaction?.userNames) ? reaction.userNames : []),
  ]

  const fromUsers = Array.isArray(reaction?.users)
    ? reaction.users
        .map((u: any) => u?.username || u?.name || u?.firstName)
        .filter((v: unknown): v is string => typeof v === "string" && v.trim().length > 0)
    : []

  return Array.from(new Set([...fromFlat, ...fromUsers]))
}

// ─── MentionInput ─────────────────────────────────────────────────────────────
// Self-contained textarea with live @mention autocomplete dropdown.

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  communityId: string
  placeholder?: string
  minHeight?: string
  disabled?: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement>
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  className?: string
}

function MentionInput({
  value,
  onChange,
  communityId,
  placeholder = "Write something…",
  minHeight = "60px",
  disabled = false,
  inputRef: externalRef,
  onKeyDown: externalKeyDown,
  className = "",
}: MentionInputProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const ref = (externalRef || internalRef) as React.RefObject<HTMLTextAreaElement>

  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionStart, setMentionStart] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<CommunityMentionMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const detectMention = useCallback((text: string, caret: number) => {
    const before = text.slice(0, Math.max(0, caret))
    const m = before.match(/(^|\s)@([a-zA-Z0-9._-]{1,30})$/)
    if (!m || !m[2]) {
      setMentionQuery(null)
      setMentionStart(null)
      return
    }
    setMentionQuery(m[2])
    setMentionStart(caret - m[2].length - 1)
  }, [])

  useEffect(() => {
    const q = (mentionQuery || "").trim()
    if (!q || !communityId) {
      setSuggestions([])
      setIsLoading(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIsLoading(true)
    debounceRef.current = setTimeout(() => {
      void communityMembersApi
        .searchMembersForMention(communityId, q, 6)
        .then(setSuggestions)
        .catch(() => setSuggestions([]))
        .finally(() => setIsLoading(false))
    }, 180)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [mentionQuery, communityId])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const selectMember = (member: CommunityMentionMember) => {
    if (mentionStart === null) return
    const caret = ref.current?.selectionStart ?? value.length
    const end = Math.max(mentionStart + 1, caret)
    const next = `${value.slice(0, mentionStart)}@${member.username} ${value.slice(end)}`
    const nextCaret = mentionStart + member.username.length + 2
    onChange(next)
    setMentionQuery(null)
    setMentionStart(null)
    setSuggestions([])
    requestAnimationFrame(() => {
      ref.current?.focus()
      ref.current?.setSelectionRange(nextCaret, nextCaret)
    })
  }

  const hasSuggestions = suggestions.length > 0 || isLoading

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        style={{ minHeight }}
        className={`resize-none bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:border-primary-300 text-slate-700 placeholder:text-slate-400 ${className}`}
        onChange={(e) => {
          onChange(e.target.value)
          detectMention(e.target.value, e.target.selectionStart ?? e.target.value.length)
        }}
        onClick={(e) => detectMention(value, e.currentTarget.selectionStart ?? value.length)}
        onKeyUp={(e) => detectMention(value, e.currentTarget.selectionStart ?? value.length)}
        onKeyDown={(e) => {
          if (e.key === "Tab" && suggestions.length > 0 && mentionQuery) {
            e.preventDefault()
            selectMember(suggestions[0])
          }
          if (e.key === "Escape" && mentionQuery) {
            setMentionQuery(null)
            setSuggestions([])
          }
          externalKeyDown?.(e)
        }}
      />
      {mentionQuery && hasSuggestions && (
        <div className="absolute left-0 right-0 bottom-full mb-1.5 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-slate-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching members…
            </div>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {suggestions.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => selectMember(m)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-primary-50 transition-colors text-left"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={m.avatar || "/placeholder.svg?height=28&width=28"} className="object-cover" />
                      <AvatarFallback className="text-[10px] bg-primary-100 text-primary-700 font-semibold">
                        {(m.username || m.firstName || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">@{m.username}</p>
                      <p className="truncate text-xs text-slate-500">
                        {[m.firstName, m.lastName].filter(Boolean).join(" ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post
  currentUser: User | null
  canPinPost?: boolean
  isHighlighted?: boolean
  isBookmarked?: boolean
  isBookmarkPending?: boolean
  onPostUpdate?: (updatedPost: Post) => void
  onDelete?: (postId: string) => void
  onBookmark?: (post: Post) => void
  onEdit?: (post: Post) => void
}

export function PostCard({
  post,
  currentUser,
  canPinPost = false,
  isHighlighted = false,
  isBookmarked = false,
  isBookmarkPending = false,
  onPostUpdate,
  onDelete,
  onBookmark,
  onEdit,
}: PostCardProps) {
  const { toast } = useToast()

  // ── Derived identity ────────────────────────────────────────────────────────
  const currentUserId = useMemo(
    () => String(currentUser?.id || (currentUser as any)?._id || ""),
    [currentUser],
  )
  const canManagePost =
    currentUserId.length > 0 &&
    currentUserId === String(post.author?.id || (post as any).author?._id || "")
  const postAuthorProfileHref = getUserProfileHref({
    username: (post.author as any)?.username,
    name: post.author?.username || post.author?.firstName || "Anonymous",
  })

  // ── Like ────────────────────────────────────────────────────────────────────
  const [isLiking, setIsLiking] = useState(false)

  const handleLike = async () => {
    if (!currentUserId) {
      toast({ title: "Sign in required", description: "Please sign in to like posts.", variant: "destructive" })
      return
    }
    if (isLiking) return
    setIsLiking(true)
    try {
      const response = post.isLikedByUser
        ? await postsApi.unlike(post.id)
        : await postsApi.like(post.id)
      const stats = response.data
      onPostUpdate?.({
        ...post,
        likes: stats.totalLikes,
        commentsCount: stats.totalComments,
        shareCount: stats.totalShares,
        isLikedByUser: stats.isLikedByUser,
        isSharedByUser: stats.isSharedByUser,
      })
    } catch (err: any) {
      toast({ title: "Like failed", description: err?.message, variant: "destructive" })
    } finally {
      setIsLiking(false)
    }
  }

  // ── Reactions ───────────────────────────────────────────────────────────────
  const [isReacting, setIsReacting] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const reactionPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showReactionPicker) return
    const handler = (e: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(e.target as Node)) {
        setShowReactionPicker(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showReactionPicker])

  const handleReact = async (emoji: string) => {
    if (!currentUserId) {
      toast({ title: "Sign in required", variant: "destructive" })
      return
    }
    if (isReacting) return
    setIsReacting(true)
    setShowReactionPicker(false)
    try {
      const response = await postsApi.react(post.id, { emoji })
      const updatedPost = response.data
      onPostUpdate?.({ ...post, reactions: updatedPost.reactions ?? post.reactions })
    } catch (err: any) {
      toast({ title: "Reaction failed", description: err?.message, variant: "destructive" })
    } finally {
      setIsReacting(false)
    }
  }

  // ── Pin ─────────────────────────────────────────────────────────────────────
  const [isPinning, setIsPinning] = useState(false)

  const handlePinToggle = async () => {
    if (!canPinPost || isPinning) return
    setIsPinning(true)
    try {
      const response = post.isPinned
        ? await postsApi.unpinPost(post.id)
        : await postsApi.pinPost(post.id)
      const updatedPost = response.data
      onPostUpdate?.({ ...post, isPinned: updatedPost.isPinned, pinnedAt: updatedPost.pinnedAt })
      toast({ title: post.isPinned ? "Post unpinned" : "Post pinned" })
    } catch (err: any) {
      toast({ title: "Pin action failed", description: err?.message, variant: "destructive" })
    } finally {
      setIsPinning(false)
    }
  }

  // ── Share ───────────────────────────────────────────────────────────────────
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const hasTrackedViewRef = useRef(false)

  const handleShare = () => {
    if (!currentUserId) {
      toast({ title: "Sign in required", variant: "destructive" })
      return
    }
    if (!hasTrackedViewRef.current) {
      hasTrackedViewRef.current = true
      void trackingApi.trackView("post", post.id, { source: "post_share_open" }).catch(() => undefined)
    }
    setShareDialogOpen(true)
  }

  const handleShareTracked = (stats: PostStats) => {
    onPostUpdate?.({
      ...post,
      likes: stats.totalLikes,
      commentsCount: stats.totalComments,
      shareCount: stats.totalShares,
      isLikedByUser: stats.isLikedByUser,
      isSharedByUser: stats.isSharedByUser,
    })
  }

  // ── Comments ─────────────────────────────────────────────────────────────────
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentDraft, setCommentDraft] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // Replies
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)

  // Edit / delete
  const [editingComment, setEditingComment] = useState<{ id: string; content: string } | null>(null)
  const [isUpdatingComment, setIsUpdatingComment] = useState(false)
  const [commentToDeleteId, setCommentToDeleteId] = useState<string | null>(null)
  const [isDeletingComment, setIsDeletingComment] = useState(false)

  // Build threaded view
  const { topLevel, repliesMap } = useMemo(() => {
    const topLevel: PostComment[] = []
    const repliesMap: Record<string, PostComment[]> = {}
    for (const c of comments) {
      if (c.parentId) {
        repliesMap[c.parentId] = repliesMap[c.parentId] || []
        repliesMap[c.parentId].push(c)
      } else {
        topLevel.push(c)
        if (!repliesMap[c.id]) repliesMap[c.id] = c.replies || []
      }
    }
    return { topLevel, repliesMap }
  }, [comments])

  const handleToggleComments = async () => {
    if (!showComments) {
      if (!hasTrackedViewRef.current) {
        hasTrackedViewRef.current = true
        void trackingApi.trackView("post", post.id, { source: "post_comments_open" }).catch(() => undefined)
      }
      setShowComments(true)
      if (comments.length === 0) {
        setIsLoadingComments(true)
        try {
          const response = await postsApi.getComments(post.id, { page: 1, limit: 100 })
          const fetched = (response.data || []) as PostComment[]
          const normalized = fetched.map((c) => ({
            ...c,
            userAvatar: resolveImageUrl(c.userAvatar) || c.userAvatar,
          }))
          setComments(normalized)
          if (onPostUpdate && normalized.length !== post.commentsCount) {
            onPostUpdate({ ...post, commentsCount: normalized.length })
          }
        } catch (err: any) {
          toast({ title: "Comments unavailable", description: err?.message, variant: "destructive" })
        } finally {
          setIsLoadingComments(false)
        }
      }
    } else {
      setShowComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!currentUserId) {
      toast({ title: "Sign in required", variant: "destructive" })
      return
    }
    if (!commentDraft.trim()) return
    setIsSubmittingComment(true)
    try {
      const response = await postsApi.createComment(post.id, { content: commentDraft })
      const newComment: PostComment = {
        ...(response.data as PostComment),
        userAvatar: resolveImageUrl((response.data as PostComment)?.userAvatar) || (response.data as PostComment)?.userAvatar,
      }
      setComments((prev) => [...prev, newComment])
      setCommentDraft("")
      onPostUpdate?.({ ...post, commentsCount: post.commentsCount + 1 })
    } catch (err: any) {
      toast({ title: "Comment failed", description: err?.message, variant: "destructive" })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleAddReply = async (parentId: string) => {
    if (!currentUserId) {
      toast({ title: "Sign in required", variant: "destructive" })
      return
    }
    const content = (replyDrafts[parentId] || "").trim()
    if (!content) return
    setIsSubmittingReply(true)
    try {
      const response = await postsApi.createComment(post.id, { content, parentId })
      const newReply: PostComment = {
        ...(response.data as PostComment),
        userAvatar: resolveImageUrl((response.data as PostComment)?.userAvatar) || (response.data as PostComment)?.userAvatar,
      }
      setComments((prev) => [...prev, newReply])
      setReplyDrafts((prev) => ({ ...prev, [parentId]: "" }))
      setReplyingToId(null)
      onPostUpdate?.({ ...post, commentsCount: post.commentsCount + 1 })
    } catch (err: any) {
      toast({ title: "Reply failed", description: err?.message, variant: "destructive" })
    } finally {
      setIsSubmittingReply(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!commentToDeleteId || isDeletingComment) return
    setIsDeletingComment(true)
    try {
      await postsApi.deleteComment(post.id, commentToDeleteId)
      // remove comment + its replies
      setComments((prev) => prev.filter((c) => c.id !== commentToDeleteId && c.parentId !== commentToDeleteId))
      setCommentToDeleteId(null)
      onPostUpdate?.({ ...post, commentsCount: Math.max(0, post.commentsCount - 1) })
      toast({ title: "Comment deleted" })
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message, variant: "destructive" })
    } finally {
      setIsDeletingComment(false)
    }
  }

  const handleUpdateComment = async () => {
    if (!editingComment || !editingComment.content.trim()) return
    setIsUpdatingComment(true)
    try {
      const response = await postsApi.updateComment(post.id, editingComment.id, { content: editingComment.content })
      const updated = response.data as PostComment
      setComments((prev) =>
        prev.map((c) =>
          c.id === editingComment.id
            ? { ...updated, userAvatar: resolveImageUrl(updated.userAvatar) || updated.userAvatar }
            : c,
        ),
      )
      setEditingComment(null)
      toast({ title: "Comment updated" })
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message, variant: "destructive" })
    } finally {
      setIsUpdatingComment(false)
    }
  }

  // ── Derived reaction data ────────────────────────────────────────────────────
  const visibleReactions = (post.reactions || []).filter((r) => r.count > 0)
  const myReaction = visibleReactions.find((r) => r.usersIncludeMe)
  const reactionTriggerEmoji = myReaction?.emoji || "🙂"
  const reactionTotalCount = visibleReactions.reduce((sum, r) => sum + (r.count || 0), 0)
  const reactionHoverText = useMemo(() => {
    if (visibleReactions.length === 0) return "React to this post"

    const lines = visibleReactions.map((r) => {
      const names = getReactionUsernames(r)
      const people = names.length > 0 ? names.join(", ") : `${r.count} reaction${r.count > 1 ? "s" : ""}`
      return `${r.emoji} ${people}`
    })

    const hasAnyNames = visibleReactions.some((r) => getReactionUsernames(r).length > 0)
    if (!hasAnyNames) {
      lines.push("(Usernames unavailable in current payload)")
    }

    return lines.join("\n")
  }, [visibleReactions])

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Card
      id={`post-${post.id}`}
      className={`overflow-hidden transition-all duration-300 bg-white border rounded-2xl ${
        post.isPinned ? "border-amber-200 shadow-amber-50" : "border-slate-200/70"
      } shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] active:scale-[0.995] ${isHighlighted ? "ring-2 ring-primary-400 shadow-md" : ""}`}
    >
      {/* ── Pinned banner ───────────────────────────────────────────────────── */}
      {post.isPinned && (
        <div className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-50 border-b border-amber-100">
          <Pin className="h-3 w-3 fill-amber-500 text-amber-500" />
          <span className="text-xs font-medium text-amber-700">Pinned post</span>
        </div>
      )}

      <CardContent className="p-4 sm:p-6">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href={postAuthorProfileHref} className="shrink-0 hover:opacity-90 transition-opacity">
              <Avatar className="h-10 w-10 sm:h-11 sm:w-11 ring-2 ring-white shadow-md">
                <AvatarImage
                  src={post.author?.avatar || "/placeholder.svg?height=44&width=44"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary-100 text-primary-700 font-semibold text-sm">
                  {(post.author?.username || post.author?.firstName || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-semibold text-sm sm:text-base leading-tight">
                  <Link href={postAuthorProfileHref} className="hover:underline">
                    {post.author?.username || post.author?.firstName || "Anonymous"}
                  </Link>
                </h4>
                {post.author?.role === "creator" && (
                  <Badge className="px-1.5 py-0 text-[10px] h-4 bg-primary-100 text-primary-700 border-0">
                    Creator
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-tight mt-0.5">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full shrink-0 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem disabled={isBookmarkPending} onClick={() => onBookmark?.(post)}>
                <Bookmark className="h-4 w-4 mr-2" />
                {isBookmarked ? "Remove from saved" : "Save post"}
              </DropdownMenuItem>
              {canPinPost && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePinToggle} disabled={isPinning}>
                    {isPinning ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : post.isPinned ? (
                      <PinOff className="h-4 w-4 mr-2" />
                    ) : (
                      <Pin className="h-4 w-4 mr-2" />
                    )}
                    {post.isPinned ? "Unpin post" : "Pin post"}
                  </DropdownMenuItem>
                </>
              )}
              {canManagePost && (
                <>
                  <DropdownMenuSeparator />
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(post)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit post
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(post.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete post
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────────── */}
        <div className="mb-3 sm:mb-4">
          {post.title && (
            <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2 leading-snug">
              {post.title}
            </h3>
          )}
          <p className="text-slate-700 leading-relaxed text-sm sm:text-[15px] whitespace-pre-wrap">
            {renderMentions(post.content || "")}
          </p>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs font-normal px-2 py-0.5">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* ── Images ─────────────────────────────────────────────────────────── */}
        {post.images && post.images.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <div
              className={`grid gap-2 ${
                post.images.length === 1
                  ? "grid-cols-1"
                  : post.images.length === 2
                    ? "grid-cols-2"
                    : post.images.length === 3
                      ? "grid-cols-3"
                      : "grid-cols-2"
              }`}
            >
              {post.images.map((image, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                    style={{ maxHeight: (post.images?.length ?? 0) === 1 ? "500px" : "260px" }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Videos ─────────────────────────────────────────────────────────── */}
        {post.videos && post.videos.length > 0 && (
          <div className="mb-3 sm:mb-4 space-y-2">
            {post.videos.map((video, index) => (
              <div key={index} className="rounded-xl overflow-hidden">
                <video src={video} controls className="w-full h-auto max-h-96 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* ── Links ──────────────────────────────────────────────────────────── */}
        {post.links && post.links.length > 0 && (
          <div className="mb-3 sm:mb-4 space-y-2">
            {post.links.map((link, index) => {
              const meta = getLinkMeta(link.url)
              const inner = (
                <div className="flex items-center gap-3">
                  {link.thumbnail && (
                    <img src={link.thumbnail} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{link.title || link.url}</p>
                    {link.description && (
                      <p className="text-xs text-slate-500 truncate">{link.description}</p>
                    )}
                    <p className={`text-xs truncate ${meta.isValid ? "text-primary-600" : "text-amber-600"}`}>
                      {meta.hostname}
                    </p>
                  </div>
                </div>
              )
              return meta.isValid ? (
                <a
                  key={index}
                  href={meta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {inner}
                </a>
              ) : (
                <div key={index} className="block p-3 border border-amber-200 rounded-xl bg-amber-50/60">
                  {inner}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Action bar ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100/80">
          <div className="flex items-center gap-0.5">

            {/* Like */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={`h-8 px-2.5 rounded-full text-xs gap-1.5 transition-all disabled:opacity-50 ${
                post.isLikedByUser
                  ? "text-red-500 bg-red-50 hover:bg-red-100"
                  : "text-slate-500 hover:text-red-500 hover:bg-red-50"
              }`}
            >
              {isLiking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Heart className={`h-3.5 w-3.5 ${post.isLikedByUser ? "fill-red-500" : ""}`} />
              )}
              <span>{post.likes}</span>
            </Button>

            {/* Emoji reaction picker trigger */}
            <div className="relative" ref={reactionPickerRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReactionPicker((v) => !v)}
                disabled={isReacting}
                title={reactionHoverText}
                className={`h-8 px-2.5 rounded-full text-xs gap-1.5 transition-all ${
                  showReactionPicker
                    ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                    : myReaction
                      ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                      : "text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                }`}
              >
                <span className="text-sm leading-none">{reactionTriggerEmoji}</span>
                {reactionTotalCount > 0 && <span>{reactionTotalCount}</span>}
              </Button>
              {showReactionPicker && (
                <div className="absolute left-0 bottom-full mb-2 z-20 bg-white border border-slate-200 rounded-2xl shadow-xl px-3 py-2">
                  <div className="flex items-center gap-0.5">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleReact(emoji)}
                        className="text-xl p-1.5 rounded-xl hover:bg-slate-100 transition-all hover:scale-125 active:scale-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comment */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleComments}
              disabled={isLoadingComments}
              className={`h-8 px-2.5 rounded-full text-xs gap-1.5 transition-all ${
                showComments
                  ? "text-primary-600 bg-primary-50 hover:bg-primary-100"
                  : "text-slate-500 hover:text-primary-600 hover:bg-primary-50"
              }`}
            >
              {isLoadingComments ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageSquare className="h-3.5 w-3.5" />
              )}
              <span>{post.commentsCount}</span>
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className={`h-8 px-2.5 rounded-full text-xs gap-1.5 transition-all ${
                post.isSharedByUser
                  ? "text-green-600 bg-green-50 hover:bg-green-100"
                  : "text-slate-500 hover:text-green-600 hover:bg-green-50"
              }`}
            >
              <Share className="h-3.5 w-3.5" />
              <span>{post.shareCount || 0}</span>
            </Button>
          </div>

          {/* Bookmark */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBookmark?.(post)}
            disabled={isBookmarkPending}
            className={`h-8 w-8 p-0 rounded-full transition-all ${
              isBookmarked
                ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
            }`}
          >
            {isBookmarkPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
            )}
          </Button>
        </div>

        <PostShareDialog
          postId={post.id}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          onShareTracked={handleShareTracked}
        />

        {/* ── Comments section ─────────────────────────────────────────────── */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">

            {/* New comment input */}
            {currentUserId && (
              <div className="flex items-start gap-2.5">
                <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                  <AvatarImage
                    src={resolveImageUrl(currentUser?.avatar) || currentUser?.avatar || "/placeholder.svg?height=32&width=32"}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs bg-primary-100 text-primary-700 font-semibold">
                    {(currentUser?.username || currentUser?.firstName || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <MentionInput
                    value={commentDraft}
                    onChange={setCommentDraft}
                    communityId={post.communityId}
                    placeholder="Write a comment… Use @ to mention someone"
                    minHeight="64px"
                    disabled={isSubmittingComment}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        void handleAddComment()
                      }
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Ctrl+Enter to post</span>
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={isSubmittingComment || !commentDraft.trim()}
                      className="h-7 px-3 text-xs rounded-full bg-primary-600 hover:bg-primary-700"
                    >
                      {isSubmittingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments list */}
            <div className="space-y-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : topLevel.length === 0 ? (
                <p className="text-sm text-slate-400 py-1">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                topLevel.map((c) => {
                  const isEditingThis = editingComment?.id === c.id
                  const canManageComment = c.userId === currentUserId
                  const commentReplies = repliesMap[c.id] || []
                  const isReplying = replyingToId === c.id
                  const commentAuthorHref = getUserProfileHref({
                    username: (c as any)?.username,
                    name: c.userName || "Anonymous",
                  })

                  return (
                    <div key={c.id} className="space-y-2">

                      {/* Top-level comment */}
                      <div className="flex items-start gap-2.5">
                        <Link href={commentAuthorHref} className="shrink-0 mt-0.5 hover:opacity-90 transition-opacity">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={c.userAvatar || "/placeholder.svg?height=32&width=32"}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-semibold">
                              {(c.userName || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <div className="rounded-2xl bg-slate-50 px-3.5 py-2.5">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <Link
                                href={commentAuthorHref}
                                className="text-sm font-semibold text-slate-800 hover:underline truncate"
                              >
                                {c.userName}
                              </Link>
                              <span className="text-[11px] text-slate-400 shrink-0">
                                {formatTimeAgo(c.createdAt)}
                              </span>
                            </div>

                            {isEditingThis ? (
                              <div className="space-y-2 mt-1">
                                <MentionInput
                                  value={editingComment.content}
                                  onChange={(val) => setEditingComment({ ...editingComment, content: val })}
                                  communityId={post.communityId}
                                  placeholder="Edit your comment…"
                                  minHeight="56px"
                                  disabled={isUpdatingComment}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingComment(null)}
                                    className="h-7 text-xs rounded-full"
                                  >
                                    <X className="h-3 w-3 mr-1" />Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleUpdateComment}
                                    disabled={isUpdatingComment || !editingComment.content.trim()}
                                    className="h-7 text-xs rounded-full bg-primary-600 hover:bg-primary-700"
                                  >
                                    {isUpdatingComment
                                      ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                      : <Check className="h-3 w-3 mr-1" />
                                    }
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {renderMentions(c.content)}
                              </p>
                            )}
                          </div>

                          {/* Comment actions */}
                          {!isEditingThis && (
                            <div className="flex items-center gap-1 mt-1 px-1">
                              {currentUserId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingToId(isReplying ? null : c.id)
                                    setReplyDrafts((prev) => ({ ...prev, [c.id]: prev[c.id] || "" }))
                                  }}
                                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-primary-600 transition-colors px-1.5 py-0.5 rounded"
                                >
                                  <CornerDownRight className="h-3 w-3" />
                                  Reply
                                </button>
                              )}
                              {canManageComment && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setEditingComment({ id: c.id, content: c.content })}
                                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors px-1.5 py-0.5 rounded"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCommentToDeleteId(c.id)}
                                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Inline reply input */}
                          {isReplying && (
                            <div className="mt-2 flex items-start gap-2">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarImage
                                  src={resolveImageUrl(currentUser?.avatar) || currentUser?.avatar || "/placeholder.svg?height=28&width=28"}
                                  className="object-cover"
                                />
                                <AvatarFallback className="text-[10px] bg-primary-100 text-primary-700 font-semibold">
                                  {(currentUser?.username || currentUser?.firstName || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1.5">
                                <MentionInput
                                  value={replyDrafts[c.id] || ""}
                                  onChange={(val) => setReplyDrafts((prev) => ({ ...prev, [c.id]: val }))}
                                  communityId={post.communityId}
                                  placeholder={`Reply to ${c.userName}… Use @ to mention`}
                                  minHeight="52px"
                                  disabled={isSubmittingReply}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                      e.preventDefault()
                                      void handleAddReply(c.id)
                                    }
                                    if (e.key === "Escape") setReplyingToId(null)
                                  }}
                                />
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setReplyingToId(null)}
                                    className="h-6 px-2 text-[11px] rounded-full"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => void handleAddReply(c.id)}
                                    disabled={isSubmittingReply || !(replyDrafts[c.id] || "").trim()}
                                    className="h-6 px-2 text-[11px] rounded-full bg-primary-600 hover:bg-primary-700"
                                  >
                                    {isSubmittingReply ? (
                                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                    ) : (
                                      "Reply"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Threaded replies */}
                      {commentReplies.length > 0 && (
                        <div className="ml-10 space-y-2 border-l-2 border-slate-100 pl-3">
                          {commentReplies.map((reply) => {
                            const isEditingReply = editingComment?.id === reply.id
                            const canManageReply = reply.userId === currentUserId
                            const replyAuthorHref = getUserProfileHref({
                              username: (reply as any)?.username,
                              name: reply.userName || "Anonymous",
                            })
                            return (
                              <div key={reply.id} className="flex items-start gap-2">
                                <Link href={replyAuthorHref} className="shrink-0 hover:opacity-90 transition-opacity">
                                  <Avatar className="h-7 w-7">
                                    <AvatarImage
                                      src={reply.userAvatar || "/placeholder.svg?height=28&width=28"}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600 font-semibold">
                                      {(reply.userName || "U").charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </Link>
                                <div className="flex-1 min-w-0">
                                  <div className="rounded-2xl bg-white border border-slate-100 px-3 py-2">
                                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                      <Link
                                        href={replyAuthorHref}
                                        className="text-xs font-semibold text-slate-800 hover:underline truncate"
                                      >
                                        {reply.userName}
                                      </Link>
                                      <span className="text-[11px] text-slate-400 shrink-0">
                                        {formatTimeAgo(reply.createdAt)}
                                      </span>
                                    </div>
                                    {isEditingReply ? (
                                      <div className="space-y-1.5 mt-1">
                                        <MentionInput
                                          value={editingComment.content}
                                          onChange={(val) => setEditingComment({ ...editingComment, content: val })}
                                          communityId={post.communityId}
                                          placeholder="Edit reply…"
                                          minHeight="44px"
                                          disabled={isUpdatingComment}
                                        />
                                        <div className="flex justify-end gap-1.5">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingComment(null)}
                                            className="h-6 px-2 text-[11px] rounded-full"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={handleUpdateComment}
                                            disabled={isUpdatingComment || !editingComment.content.trim()}
                                            className="h-6 px-2 text-[11px] rounded-full bg-primary-600 hover:bg-primary-700"
                                          >
                                            {isUpdatingComment ? (
                                              <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                            ) : (
                                              "Save"
                                            )}
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                                        {renderMentions(reply.content)}
                                      </p>
                                    )}
                                  </div>
                                  {canManageReply && !isEditingReply && (
                                    <div className="flex items-center gap-1 mt-0.5 px-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingComment({ id: reply.id, content: reply.content })}
                                        className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors p-1 rounded"
                                      >
                                        <Pencil className="h-2.5 w-2.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setCommentToDeleteId(reply.id)}
                                        className="text-[11px] text-slate-400 hover:text-red-600 transition-colors p-1 rounded"
                                      >
                                        <Trash2 className="h-2.5 w-2.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!commentToDeleteId} onOpenChange={(open) => !open && setCommentToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingComment}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              disabled={isDeletingComment}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingComment ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

