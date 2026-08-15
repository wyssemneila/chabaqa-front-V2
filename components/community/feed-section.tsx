'use client'

import { useState } from 'react'
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  MessageSquare, BarChart3,
} from 'lucide-react'
import FeedComposer from './feed-composer'

interface PostData {
  id: string
  authorName: string
  authorInitials: string
  authorColor: string
  content: string
  timeAgo: string
  likes: number
  comments: number
  title?: string
  images?: string[]
  poll?: { question: string; options: string[]; votes?: number[] } | null
  saved?: boolean
  liked?: boolean
}

interface Props {
  communityName: string
  avatarColor: string
  isJoined: boolean
  initialPosts: PostData[]
  members: { id: string; initials: string; color: string }[]
}

export default function FeedSection({ communityName, avatarColor, isJoined, initialPosts, members }: Props) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts)

  function handleNewPost(post: { id: string; title: string; content: string; images: string[]; poll: { question: string; options: string[] } | null; time: string }) {
    const newPost: PostData = {
      id: post.id,
      authorName: 'Wyssem Neila',
      authorInitials: 'WN',
      authorColor: avatarColor,
      content: post.content,
      timeAgo: post.time,
      likes: 0,
      comments: 0,
      title: post.title,
      images: post.images,
      poll: post.poll ? { ...post.poll, votes: post.poll.options.map(() => 0) } : null,
    }
    setPosts(prev => [newPost, ...prev])
  }

  function toggleLike(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
  }

  function toggleSave(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p))
  }

  function votePoll(postId: string, optIdx: number) {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId || !p.poll?.votes) return p
      const votes = [...p.poll.votes]
      votes[optIdx]++
      return { ...p, poll: { ...p.poll, votes } }
    }))
  }

  return (
    <>
      {isJoined && (
        <FeedComposer communityName={communityName} avatarColor={avatarColor} onPost={handleNewPost} />
      )}

      {posts.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" strokeWidth={1.3} />
          <p className="text-sm font-medium text-gray-600">No posts yet — be the first to share!</p>
          <p className="text-xs text-gray-400 mt-1">Click &quot;Write something&quot; above to get started</p>
        </div>
      ) : (
        posts.map(post => (
          <article key={post.id} className="py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0"
                style={{ background: post.authorColor }}>
                {post.authorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-900">{post.authorName}</span>
                  <span className="text-[11px] text-gray-400">· {post.timeAgo}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggleSave(post.id)}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                  style={{ color: post.saved ? '#8e78fb' : '#ccc' }}>
                  <Bookmark className="w-4 h-4" strokeWidth={1.5} fill={post.saved ? '#8e78fb' : 'none'} />
                </button>
                <button className="w-8 h-8 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
                  <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {post.title && (
              <h3 className="text-[15px] font-bold text-gray-900 mb-1.5">{post.title}</h3>
            )}
            {post.content && (
              <p className="text-[14px] leading-[1.75] text-gray-700 mb-3">{post.content}</p>
            )}

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="rounded-lg max-h-48 object-cover border border-gray-100" />
                ))}
              </div>
            )}

            {/* Poll */}
            {post.poll && (
              <div className="mb-3 p-3 rounded-lg" style={{ background: '#f9f8fe', border: '1px solid #e8e4ff' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 className="w-3.5 h-3.5" style={{ color: '#8e78fb' }} strokeWidth={1.7} />
                  <span className="text-[12px] font-semibold" style={{ color: '#6c52f0' }}>Poll</span>
                </div>
                {post.poll.options.map((opt, i) => {
                  const total = (post.poll!.votes || []).reduce((a, b) => a + b, 0)
                  const votes = post.poll!.votes?.[i] || 0
                  const pct = total > 0 ? Math.round((votes / total) * 100) : 0
                  return (
                    <button key={i} onClick={() => votePoll(post.id, i)}
                      className="w-full mb-1.5 h-9 rounded-lg text-[13px] font-medium text-left px-3 relative overflow-hidden transition-colors hover:opacity-90"
                      style={{ background: '#fff', border: '1px solid #e8e4ff' }}>
                      {total > 0 && (
                        <div className="absolute inset-y-0 left-0 rounded-lg transition-all"
                          style={{ width: `${pct}%`, background: '#ede9ff' }} />
                      )}
                      <span className="relative z-10 flex items-center justify-between">
                        <span className="text-gray-700">{opt}</span>
                        {total > 0 && <span className="text-[11px] text-gray-400">{pct}%</span>}
                      </span>
                    </button>
                  )
                })}
                {(post.poll.votes || []).reduce((a, b) => a + b, 0) > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {(post.poll.votes || []).reduce((a, b) => a + b, 0)} votes
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-5">
                <button onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1.5 transition-colors"
                  style={{ color: post.liked ? '#ef4444' : '#9ca3af' }}>
                  <Heart className="w-4 h-4" strokeWidth={1.5} fill={post.liked ? '#ef4444' : 'none'} />
                  {post.likes > 0 && <span className="text-[12px]">{post.likes}</span>}
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                  {post.comments > 0 && <span className="text-[12px]">{post.comments}</span>}
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <Share2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {post.likes > 0 && (
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {members.slice(0, 2).map(m => (
                      <div key={m.id} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[6px] font-bold ring-2 ring-white"
                        style={{ background: m.color }}>
                        {m.initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-400">{post.likes} likes</span>
                </div>
              )}
            </div>
          </article>
        ))
      )}
    </>
  )
}
