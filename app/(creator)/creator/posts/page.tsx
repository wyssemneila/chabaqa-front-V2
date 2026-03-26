"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useCreatorCommunity } from "@/app/(creator)/creator/context/creator-community-context"
import { useCommunityGuard } from "@/hooks/use-community-guard"
import { PageShell } from "@/components/creator-dashboard"
import { useAuthContext } from "@/app/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Loader2 } from "lucide-react"
import Link from "next/link"
import { CreatePostDialog } from "./components/create-post-dialog"
import { PostsList } from "./components/posts-list"
import type { Post } from "@/lib/api/core/types"

export default function CreatorPostsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuthContext()
  const { guard, selectedCommunity, selectedCommunityId, isLoading: communityLoading } = useCommunityGuard()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    likes: 0,
    comments: 0,
  })
  const editPostId = searchParams.get("edit")

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

  const handlePostSaved = useCallback(() => {
    setEditingPost(null)
    setIsPostDialogOpen(false)
    if (editPostId) {
      router.replace("/creator/posts")
    }
    void refreshPosts()
  }, [editPostId, refreshPosts, router])

  const handleOpenCreate = useCallback(() => {
    setEditingPost(null)
    setIsPostDialogOpen(true)
    if (editPostId) {
      router.replace("/creator/posts")
    }
  }, [editPostId, router])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setIsPostDialogOpen(open)
    if (!open) {
      setEditingPost(null)
      if (editPostId) {
        router.replace("/creator/posts")
      }
    }
  }, [editPostId, router])

  const mode = useMemo(() => (editingPost ? "edit" : "create"), [editingPost])



  if (guard) return guard

  return (
    <PageShell className="max-w-6xl mx-auto space-y-8 p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts Management</h1>
          <p className="text-gray-600 mt-1">Manage posts for {selectedCommunity.name}</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </div>

      <CreatePostDialog
        open={isPostDialogOpen}
        onOpenChange={handleDialogOpenChange}
        communityId={selectedCommunityId || ""}
        onPostSaved={handlePostSaved}
        mode={mode}
        postToEdit={editingPost}
        showTrigger={false}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Likes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.likes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.comments}</p>
          </CardContent>
        </Card>
      </div>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Posts</CardTitle>
          <CardDescription>View and manage all your posts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No posts yet</p>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Post
              </Button>
            </div>
          ) : (
            <PostsList
              posts={posts}
              onPostDeleted={handlePostSaved}
              onEdit={(post) => {
                setEditingPost(post)
                setIsPostDialogOpen(true)
              }}
            />
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
