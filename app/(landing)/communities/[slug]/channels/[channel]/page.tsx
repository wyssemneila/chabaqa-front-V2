'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Hash, Pin, Heart, Image as ImageIcon, FileText, Play, Mic, Download,
  Send, Paperclip, ImagePlus, Video, MoreHorizontal, Trash2,
} from 'lucide-react'

interface ChannelPost {
  id: string
  author: string
  initials: string
  color: string
  content: string
  time: string
  pinned?: boolean
  likes: number
  liked?: boolean
  media?: { type: 'image' | 'video' | 'file' | 'voice'; label: string; duration?: string; size?: string }
}

const MOCK_CHANNEL_POSTS: Record<string, ChannelPost[]> = {
  general: [
    { id: '1', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: "Welcome everyone! 🎉 This is the General channel — here you'll find important announcements and community updates.",
      time: '2d ago', pinned: true, likes: 12,
      media: { type: 'image', label: 'community-welcome-banner.png' } },
    { id: '2', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: "New course dropping next week! 🚀 Check out this sneak peek.",
      time: '1d ago', likes: 8,
      media: { type: 'video', label: 'course-preview.mp4', duration: '2:34' } },
    { id: '3', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: 'Quick reminder: our weekly live session is every Thursday at 7PM UTC. See you there! 🙌',
      time: '5h ago', likes: 5,
      media: { type: 'voice', label: 'Weekly reminder', duration: '0:45' } },
    { id: '4', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: "Here's the updated schedule for August — download it and pin it somewhere visible!",
      time: '3h ago', likes: 3,
      media: { type: 'file', label: 'august-schedule-2026.pdf', size: '1.2 MB' } },
  ],
  resources: [
    { id: '1', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: '📚 Resource Pack #1 — Free After Effects templates and project files!',
      time: '3d ago', pinned: true, likes: 24,
      media: { type: 'file', label: 'AE-templates-pack-v1.zip', size: '45 MB' } },
    { id: '2', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: '🎨 Color grading LUTs pack — 50+ professional LUTs for your video projects.',
      time: '1d ago', likes: 15,
      media: { type: 'file', label: 'pro-luts-pack-50.zip', size: '12 MB' } },
  ],
  showcase: [
    { id: '1', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: "✨ Member spotlight this week goes to @ahmed-benali! Check out their amazing reel 🔥",
      time: '2d ago', pinned: true, likes: 18,
      media: { type: 'image', label: 'ahmed-reel-screenshot.jpg' } },
  ],
}

const IS_ADMIN = true

function MediaBlock({ media }: { media: ChannelPost['media'] }) {
  if (!media) return null
  if (media.type === 'image') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden" style={{ background: '#f0eeff', border: '1px solid #e4dffb' }}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ImageIcon className="w-10 h-10 mx-auto mb-2" style={{ color: '#8e78fb' }} strokeWidth={1.3} />
            <p className="text-[12px] font-medium" style={{ color: '#6c52f0' }}>{media.label}</p>
          </div>
        </div>
      </div>
    )
  }
  if (media.type === 'video') {
    return (
      <div className="mt-3 rounded-xl overflow-hidden" style={{ background: '#1a1730' }}>
        <div className="flex items-center justify-center py-10 relative">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(142,120,251,.9)' }}>
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" strokeWidth={0} />
          </div>
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-medium text-white" style={{ background: 'rgba(0,0,0,.6)' }}>
            {media.duration}
          </div>
        </div>
        <div className="px-3 py-2 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
          <Play className="w-3 h-3 text-gray-400" strokeWidth={1.7} />
          <p className="text-[11px] text-gray-400">{media.label}</p>
        </div>
      </div>
    )
  }
  if (media.type === 'file') {
    return (
      <div className="mt-3 rounded-xl p-3 flex items-center gap-3" style={{ background: '#f9fafb', border: '1px solid #f0f0f0' }}>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fee2e2' }}>
          <FileText className="w-5 h-5 text-red-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-gray-800 truncate">{media.label}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{media.size}</p>
        </div>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
          <Download className="w-4 h-4" strokeWidth={1.7} />
        </button>
      </div>
    )
  }
  if (media.type === 'voice') {
    return (
      <div className="mt-3 rounded-xl p-3 flex items-center gap-3" style={{ background: '#f4f2fc', border: '1px solid #e4dffb' }}>
        <button className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer" style={{ background: 'linear-gradient(135deg, #8e78fb, #6c52f0)' }}>
          <Play className="w-4 h-4 text-white ml-0.5" fill="white" strokeWidth={0} />
        </button>
        <div className="flex-1">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#e4dffb' }}>
            <div className="h-full rounded-full" style={{ width: '35%', background: 'linear-gradient(90deg, #8e78fb, #6c52f0)' }} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Mic className="w-3.5 h-3.5" style={{ color: '#8e78fb' }} strokeWidth={1.7} />
          <span className="text-[11px] font-medium" style={{ color: '#6c52f0' }}>{media.duration}</span>
        </div>
      </div>
    )
  }
  return null
}

export default function ChannelPage() {
  const params = useParams()
  const channel = params.channel as string
  const channelName = channel.charAt(0).toUpperCase() + channel.slice(1)

  const [posts, setPosts] = useState<ChannelPost[]>(MOCK_CHANNEL_POSTS[channel] || [])
  const [message, setMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleLike(id: string) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
  }

  function pinPost(id: string) {
    setPosts(prev => prev.map(p => ({ ...p, pinned: p.id === id ? !p.pinned : false })))
    setMenuOpen(null)
  }

  function deletePost(id: string) {
    setPosts(prev => prev.filter(p => p.id !== id))
    setMenuOpen(null)
  }

  function sendMessage() {
    if (!message.trim()) return
    const newPost: ChannelPost = {
      id: Date.now().toString(),
      author: 'Wyssem Neila',
      initials: 'WN',
      color: '#f97316',
      content: message.trim(),
      time: 'Just now',
      likes: 0,
    }
    setPosts(prev => [newPost, ...prev])
    setMessage('')
  }

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return 0
  })

  return (
    <div className="flex flex-col gap-5">
      {/* Channel header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#f4f2fc' }}>
          <Hash className="w-5 h-5" style={{ color: '#8e78fb' }} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{channelName}</h1>
          <p className="text-[12px] text-gray-400">
            {IS_ADMIN ? 'You can post messages, files, and media here' : 'Read-only channel — only admins can post here'}
          </p>
        </div>
      </div>

      {/* Admin composer — AT TOP, directly under title */}
      {IS_ADMIN && (
        <div className="rounded-xl p-3" style={{ background: '#f9f8fd', border: '1px solid #e8e4ff' }}>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Write a message..."
                rows={2}
                className="w-full px-3 py-2.5 text-[13px] rounded-xl resize-none focus:outline-none bg-white"
                style={{ border: '1px solid #e8e4ff' }}
              />
              <div className="flex items-center gap-2 mt-2">
                <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors cursor-pointer" style={{ color: '#9590b8' }}>
                  <ImagePlus className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors cursor-pointer" style={{ color: '#9590b8' }}>
                  <Video className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-colors cursor-pointer" style={{ color: '#9590b8' }}>
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button onClick={sendMessage}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-90 cursor-pointer flex-shrink-0"
              style={{ background: message.trim() ? '#8e78fb' : '#e8e4ff' }}>
              <Send className="w-4 h-4" style={{ color: message.trim() ? '#fff' : '#9590b8' }} />
            </button>
          </div>
        </div>
      )}

      {/* Posts — recent on top, pinned first */}
      {sortedPosts.length === 0 ? (
        <div className="py-16 text-center">
          <Hash className="w-10 h-10 mx-auto mb-3 text-gray-200" strokeWidth={1.3} />
          <p className="text-[14px] font-medium text-gray-500">Nothing here yet — stay tuned!</p>
          <p className="text-[12px] text-gray-400 mt-1">The admins haven&apos;t posted anything yet, but they will soon 🙌</p>
        </div>
      ) : (
        sortedPosts.map(post => (
          <article key={post.id} className="rounded-xl p-4 transition-colors"
            style={{
              background: post.pinned ? '#faf8ff' : '#fff',
              border: post.pinned ? '1px solid #e4dffb' : '1px solid #f0f0f0',
            }}>
            {post.pinned && (
              <div className="flex items-center gap-1 mb-2">
                <Pin className="w-3 h-3" style={{ color: '#8e78fb' }} strokeWidth={2} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8e78fb' }}>Pinned</span>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[11px] flex-shrink-0"
                style={{ background: post.color }}>
                {post.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-900">{post.author}</span>
                  <span className="text-[11px] text-gray-400">· {post.time}</span>
                  {/* Admin 3-dot menu */}
                  {IS_ADMIN && (
                    <div className="ml-auto relative" ref={menuOpen === post.id ? menuRef : undefined}>
                      <button onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
                        <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      {menuOpen === post.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border py-1 z-50 min-w-[150px]"
                          style={{ borderColor: '#e8e4ff' }}>
                          <button onClick={() => pinPost(post.id)}
                            className="w-full px-4 py-2.5 text-left text-[13px] font-medium flex items-center gap-2.5 hover:bg-[#f9f8fd] transition-colors cursor-pointer"
                            style={{ color: '#46426a' }}>
                            <Pin className="w-3.5 h-3.5" style={{ color: '#8e78fb' }} />
                            {post.pinned ? 'Unpin' : 'Pin post'}
                          </button>
                          <button onClick={() => deletePost(post.id)}
                            className="w-full px-4 py-2.5 text-left text-[13px] font-medium flex items-center gap-2.5 hover:bg-red-50 transition-colors cursor-pointer"
                            style={{ color: '#ef4444' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[13.5px] leading-[1.7] text-gray-700 mt-1.5">{post.content}</p>
                <MediaBlock media={post.media} />
                <div className="flex items-center gap-4 mt-3">
                  <button onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-1.5 transition-colors text-[12px] cursor-pointer"
                    style={{ color: post.liked ? '#ef4444' : '#9ca3af' }}>
                    <Heart className="w-3.5 h-3.5" strokeWidth={1.5} fill={post.liked ? '#ef4444' : 'none'} />
                    {post.likes > 0 && post.likes}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))
      )}

      {/* Read-only notice for non-admins */}
      {!IS_ADMIN && (
        <div className="rounded-xl p-4 text-center" style={{ background: '#fafbfc', border: '1px solid #f0f0f0' }}>
          <p className="text-[12px] text-gray-400">
            🔒 This channel is read-only — only the community admins can post here
          </p>
        </div>
      )}
    </div>
  )
}
