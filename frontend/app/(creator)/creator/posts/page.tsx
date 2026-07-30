'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, MessageSquare, Plus, RefreshCw, Search, ThumbsUp } from 'lucide-react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useAuthContext } from '@/app/providers/auth-provider'
import { postsApi, type Post } from '@/lib/api'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import { CreatePostDialog } from './components/create-post-dialog'
import { PostsList } from './components/posts-list'

const getUserId = (user: any) => String(user?._id || user?.id || '')

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const getPostTitle = (post: any) =>
  String(post?.title || post?.excerpt || post?.content || 'Untitled post').trim()

const getPostCommunity = (post: any) =>
  String(post?.community?.name || post?.communityName || post?.communityId?.name || 'Community')

const getPostDate = (post: any) => {
  const raw = post?.createdAt || post?.updatedAt
  const date = raw ? new Date(raw) : null
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    : 'No date'
}

export default function CreatorPostsPage() {
  const { user, loading: authLoading } = useAuthContext()
  const creatorId = getUserId(user)
  const { selectedCommunityId } = useCreatorCommunity()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const loadPosts = async () => {
    if (!creatorId) {
      if (!authLoading) {
        setPosts([])
        setError('Sign in to load your posts.')
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await postsApi.getByCreator(creatorId, { page: 1, limit: 100, currentUserId: creatorId })
      setPosts(response.posts || [])
    } catch (err: any) {
      setPosts([])
      setError(err?.message || 'Failed to load posts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPosts()
  }, [creatorId, authLoading])

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((post: any) =>
      [getPostTitle(post), post?.content, getPostCommunity(post)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
  }, [posts, search])

  const metrics = useMemo(() => {
    return posts.reduce(
      (acc, post: any) => {
        const stats = post?.stats || post
        acc.likes += toNumber(stats?.likesCount ?? stats?.likes)
        acc.comments += toNumber(stats?.commentsCount ?? stats?.comments)
        acc.shares += toNumber(stats?.sharesCount ?? stats?.shares)
        return acc
      },
      { posts: posts.length, likes: 0, comments: 0, shares: 0 },
    )
  }, [posts])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar title="Posts" subtitle="Review posts, engagement, and community activity." />

        <main id="main-content" className="flex-1 p-6 lg:p-8 space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
              {[
                ['Posts', metrics.posts, BarChart3],
                ['Likes', metrics.likes, ThumbsUp],
                ['Comments', metrics.comments, MessageSquare],
                ['Shares', metrics.shares, RefreshCw],
              ].map(([label, value, Icon]: any) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingPost(null)
                setDialogOpen(true)
              }}
              disabled={!selectedCommunityId}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-[13px] font-bold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New post
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search posts or communities"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>
            <button
              type="button"
              onClick={loadPosts}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-[13px] font-bold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-[14px] font-semibold text-rose-700">{error}</div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <p className="text-[15px] font-black text-slate-800">No posts found</p>
              <p className="mt-2 text-[13px] text-slate-500">Posts you publish will appear here with their engagement metrics.</p>
            </div>
          ) : (
            <PostsList
              posts={filteredPosts}
              onPostDeleted={loadPosts}
              onEdit={(post) => {
                setEditingPost(post)
                setDialogOpen(true)
              }}
            />
          )}
        </main>
      </div>
      {selectedCommunityId && (
        <CreatePostDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          communityId={selectedCommunityId}
          onPostSaved={loadPosts}
          mode={editingPost ? 'edit' : 'create'}
          postToEdit={editingPost}
          showTrigger={false}
        />
      )}
    </div>
  )
}
