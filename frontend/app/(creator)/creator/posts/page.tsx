"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { ModuleEmptyState, ModulePage } from "@/components/creator-dashboard"
import { useAuthContext } from "@/app/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { FileText, Heart, MessageSquare, Plus } from "lucide-react"
import { CreatePostDialog } from "./components/create-post-dialog"
import { PostsList } from "./components/posts-list"
import type { Post } from "@/lib/api/types"

export default function CreatorPostsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuthContext()
  const { guard, selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCommunityGuard()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    likes: 0,
    comments: 0,
  })
  const editPostId = searchParams.get("edit")
  const shouldOpenCreate = searchParams.get("create") === "1"

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin?redirect=/creator/posts')
    }
  }, [authLoading, isAuthenticated, router])

  const refreshPosts = useCallback(async () => {
    if (communityLoading || !authUser) return
    if (!selectedCommunityId) {
      setPosts([])
      setStats({ total: 0, likes: 0, comments: 0 })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await api.posts.getByCreator(authUser._id || authUser.id, {
        page: 1,
        limit: 50,
        communityId: selectedCommunityId,
      })

      const postsList = response.posts || []
      setPosts(postsList)
    } catch (error: any) {
      console.error('Failed to load posts:', error)
      setError(error?.message || "Failed to load posts")
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [communityLoading, authUser, selectedCommunityId, toast])

  // Load posts when community changes
  useEffect(() => {
    void refreshPosts()
  }, [refreshPosts])

  useEffect(() => {
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0)
    const totalComments = posts.reduce((sum, post) => sum + (post.commentsCount || post.comments?.length || 0), 0)
    setStats({
      total: posts.length,
      likes: totalLikes,
      comments: totalComments,
    })
  }, [posts])

  useEffect(() => {
    if (!editPostId) return
    const matchedPost = posts.find((post) => post.id === editPostId)
    if (!matchedPost) return
    setEditingPost(matchedPost)
    setIsPostDialogOpen(true)
  }, [editPostId, posts])

  useEffect(() => {
    if (!shouldOpenCreate || editPostId) return
    setEditingPost(null)
    setIsPostDialogOpen(true)
  }, [editPostId, shouldOpenCreate])

  const handlePostSaved = useCallback(() => {
    setEditingPost(null)
    setIsPostDialogOpen(false)
    if (editPostId || shouldOpenCreate) {
      router.replace("/creator/posts")
    }
    void refreshPosts()
  }, [editPostId, refreshPosts, router, shouldOpenCreate])

  const handleOpenCreate = useCallback(() => {
    setEditingPost(null)
    setIsPostDialogOpen(true)
    if (editPostId || shouldOpenCreate) {
      router.replace("/creator/posts")
    }
  }, [editPostId, router, shouldOpenCreate])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsPostDialogOpen(open)
    if (!open) {
      setEditingPost(null)
      if (editPostId || shouldOpenCreate) {
        router.replace("/creator/posts")
      }
    }
  }, [editPostId, router, shouldOpenCreate])

  const mode = useMemo(() => (editingPost ? "edit" : "create"), [editingPost])

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return posts
    return posts.filter((post) => {
      const title = post.title || ""
      const content = post.content || ""
      return title.toLowerCase().includes(query) || content.toLowerCase().includes(query)
    })
  }, [posts, searchQuery])



  if (guard) return guard

  return (
    <>
      <CreatePostDialog
        open={isPostDialogOpen}
        onOpenChange={handleDialogOpenChange}
        communityId={selectedCommunityId || ""}
        onPostSaved={handlePostSaved}
        mode={mode}
        postToEdit={editingPost}
        showTrigger={false}
      />

      <ModulePage
        title="Posts"
        description={`Share updates and announcements for ${selectedCommunity.name}.`}
        primaryAction={{ label: "Create Post", onClick: handleOpenCreate, icon: Plus }}
        metrics={[
          { title: "Posts", value: stats.total, icon: FileText, color: "courses" },
          { title: "Likes", value: stats.likes, icon: Heart, color: "success" },
          { title: "Comments", value: stats.comments, icon: MessageSquare, color: "primary" },
        ]}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search posts..."
        dataFreshnessLabel="Post metrics refresh after publishing, editing, or deleting a post."
        density="compact"
        loading={loading}
        error={error}
        onRetry={refreshPosts}
        emptyState={
          !loading && !error && posts.length === 0 ? (
            <ModuleEmptyState module="posts" />
          ) : !loading && !error && filteredPosts.length === 0 ? (
            <ModuleEmptyState module="posts" hasSearchQuery />
          ) : null
        }
      >
        <PostsList
          posts={filteredPosts}
          onPostDeleted={handlePostSaved}
          onEdit={(post) => {
            setEditingPost(post)
            setIsPostDialogOpen(true)
          }}
        />
      </ModulePage>
    </>
  )
}
