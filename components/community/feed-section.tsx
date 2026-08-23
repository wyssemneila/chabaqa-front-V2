'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  MessageSquare, BarChart3, Pin, Trash2, Send,
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
  pinned?: boolean
}

interface Comment {
  id: string
  authorName: string
  authorInitials: string
  authorColor: string
  content: string
  timeAgo: string
  likes: number
  liked?: boolean
  replies?: Comment[]
}

interface Props {
  communityName: string
  avatarColor: string
  isJoined: boolean
  initialPosts: PostData[]
  members: { id: string; initials: string; color: string }[]
  isAdmin?: boolean
  showSavedOnly?: boolean
}

export default function FeedSection({ communityName, avatarColor, isJoined, initialPosts, members, isAdmin, showSavedOnly }: Props) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [commentsOpen, setCommentsOpen] = useState<string | null>(null)
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [commentInput, setCommentInput] = useState('')
  const [replyTo, setReplyTo] = useState<{ postId: string; commentId: string; name: string } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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

  function pinPost(id: string) {
    setPosts(prev => prev.map(p => ({ ...p, pinned: p.id === id ? !p.pinned : false })))
    setMenuOpen(null)
  }

  function deletePost(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
    setMenuOpen(null)
  }

  function addComment(postId: string) {
    if (!commentInput.trim()) return
    const newComment: Comment = {
      id: Date.now().toString(),
      authorName: 'Wyssem Neila',
      authorInitials: 'WN',
      authorColor: avatarColor,
      content: commentInput.trim(),
      timeAgo: 'Just now',
      likes: 0,
      replies: [],
    }

    if (replyTo && replyTo.postId === postId) {
      setPostComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).map(c =>
          c.id === replyTo.commentId
            ? { ...c, replies: [...(c.replies || []), newComment] }
            : c
        ),
      }))
    } else {
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }))
    }

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: p.comments + 1 } : p))
    setCommentInput('')
    setReplyTo(null)
  }

  const displayPosts = showSavedOnly ? posts.filter(p => p.saved) : posts
  const sortedPosts = [...displayPosts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <>
      {isJoined && (
        <FeedComposer communityName={communityName} avatarColor={avatarColor} onPost={handleNewPost} />
      )}

      {sortedPosts.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" strokeWidth={1.3} />
          <p className="text-sm font-medium text-gray-600">No posts yet — be the first to share!</p>
          <p className="text-xs text-gray-400 mt-1">Click &quot;Write something&quot; above to get started</p>
        </div>
      ) : (
        sortedPosts.map(post => (
          <article key={post.id} className="p-5 rounded-2xl relative mb-3"
            style={{ background: '#fff', border: '1px solid #e8e4ff' }}>

            {/* Pinned indicator */}
            {post.pinned && (
              <div className="flex items-center gap-1.5 mb-2 text-[11px] font-medium" style={{ color: '#8e78fb' }}>
                <Pin className="w-3 h-3" /> Pinned post
              </div>
            )}

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
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer"
                  style={{ color: post.saved ? '#8e78fb' : '#ccc' }}>
                  <Bookmark className="w-4 h-4" strokeWidth={1.5} fill={post.saved ? '#8e78fb' : 'none'} />
                </button>
                <div className="relative" ref={menuOpen === post.id ? menuRef : undefined}>
                  <button onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                    className="w-8 h-8 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
                    <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                  {menuOpen === post.id && isAdmin && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border py-1 z-50 min-w-[160px]"
                      style={{ borderColor: '#e8e4ff' }}>
                      <button onClick={() => pinPost(post.id)}
                        className="w-full px-4 py-2.5 text-left text-[13px] font-medium flex items-center gap-2.5 hover:bg-[#f9f8fd] transition-colors cursor-pointer"
                        style={{ color: '#46426a' }}>
                        <Pin className="w-3.5 h-3.5" style={{ color: '#8e78fb' }} />
                        {post.pinned ? 'Unpin post' : 'Pin post'}
                      </button>
                      <button onClick={() => deletePost(post.id)}
                        className="w-full px-4 py-2.5 text-left text-[13px] font-medium flex items-center gap-2.5 hover:bg-red-50 transition-colors cursor-pointer"
                        style={{ color: '#ef4444' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete post
                      </button>
                    </div>
                  )}
                </div>
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
                      className="w-full mb-1.5 h-9 rounded-lg text-[13px] font-medium text-left px-3 relative overflow-hidden transition-colors hover:opacity-90 cursor-pointer"
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

            {/* Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-5">
                <button onClick={() => toggleLike(post.id)}
                  className="flex items-center gap-1.5 transition-colors cursor-pointer"
                  style={{ color: post.liked ? '#ef4444' : '#9ca3af' }}>
                  <Heart className="w-4 h-4" strokeWidth={1.5} fill={post.liked ? '#ef4444' : 'none'} />
                  {post.likes > 0 && <span className="text-[12px]">{post.likes}</span>}
                </button>
                <button onClick={() => setCommentsOpen(commentsOpen === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                  {post.comments > 0 && <span className="text-[12px]">{post.comments}</span>}
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
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

            {/* Comments section */}
            {commentsOpen === post.id && (
              <div className="mt-4 pt-3" style={{ borderTop: '1px solid #ede9ff' }}>
                {(postComments[post.id] || []).map(comment => (
                  <div key={comment.id} className="mb-3">
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                        style={{ background: comment.authorColor }}>
                        {comment.authorInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="rounded-xl px-3 py-2" style={{ background: '#f9f8fd' }}>
                          <span className="text-[12px] font-semibold text-gray-900">{comment.authorName}</span>
                          <p className="text-[13px] text-gray-700 mt-0.5">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 ml-3">
                          <span className="text-[10px] text-gray-400">{comment.timeAgo}</span>
                          <button onClick={() => setReplyTo({ postId: post.id, commentId: comment.id, name: comment.authorName })}
                            className="text-[10px] font-medium cursor-pointer" style={{ color: '#8e78fb' }}>
                            Reply
                          </button>
                        </div>
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-4 mt-2 space-y-2">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="flex gap-2">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0"
                                  style={{ background: reply.authorColor }}>
                                  {reply.authorInitials}
                                </div>
                                <div className="flex-1">
                                  <div className="rounded-xl px-3 py-2" style={{ background: '#f3f1ff' }}>
                                    <span className="text-[11px] font-semibold text-gray-900">{reply.authorName}</span>
                                    <p className="text-[12px] text-gray-700 mt-0.5">{reply.content}</p>
                                  </div>
                                  <span className="text-[10px] text-gray-400 ml-3">{reply.timeAgo}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Comment input */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                    style={{ background: avatarColor }}>
                    WN
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addComment(post.id) }}
                      placeholder={replyTo?.postId === post.id ? `Reply to ${replyTo.name}...` : 'Write a comment...'}
                      className="w-full px-3 py-2 text-[13px] rounded-full bg-white focus:outline-none pr-10"
                      style={{ border: '1px solid #e8e4ff' }}
                    />
                    <button onClick={() => addComment(post.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                      style={{ background: commentInput.trim() ? '#8e78fb' : '#e8e4ff' }}>
                      <Send className="w-3 h-3" style={{ color: commentInput.trim() ? '#fff' : '#9590b8' }} />
                    </button>
                  </div>
                  {replyTo?.postId === post.id && (
                    <button onClick={() => setReplyTo(null)}
                      className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer">
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
          </article>
        ))
      )}
    </>
  )
}
