import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Hash, Pin, Heart, MessageCircle, Image as ImageIcon, FileText, Play, Mic, Download } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string; channel: string }> }

interface ChannelPost {
  id: string
  author: string
  initials: string
  color: string
  content: string
  time: string
  pinned?: boolean
  likes: number
  media?: { type: 'image' | 'video' | 'file' | 'voice'; label: string; duration?: string; size?: string }
}

const MOCK_CHANNEL_POSTS: Record<string, ChannelPost[]> = {
  general: [
    { id: '1', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: "Welcome everyone! 🎉 This is the General channel — here you'll find important announcements and community updates. Feel free to read through and stay in the loop!",
      time: '2d ago', pinned: true, likes: 12,
      media: { type: 'image', label: 'community-welcome-banner.png' } },
    { id: '2', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: "New course dropping next week! 🚀 Check out this sneak peek of what we've been working on.",
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
    { id: '3', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: 'Tutorial walkthrough — how to use the templates from Pack #1. Watch this first!',
      time: '1d ago', likes: 9,
      media: { type: 'video', label: 'templates-tutorial.mp4', duration: '8:12' } },
    { id: '4', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: 'Quick voice note explaining the difference between the Standard and Pro packs 🎙️',
      time: '12h ago', likes: 6,
      media: { type: 'voice', label: 'Packs explanation', duration: '1:22' } },
  ],
  showcase: [
    { id: '1', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: "✨ Member spotlight this week goes to @ahmed-benali! Check out their amazing reel 🔥",
      time: '2d ago', pinned: true, likes: 18,
      media: { type: 'image', label: 'ahmed-reel-screenshot.jpg' } },
    { id: '2', author: 'Motion Masters', initials: 'MM', color: '#f97316',
      content: "This week's top 3 submissions — incredible work from our community!",
      time: '1d ago', likes: 22,
      media: { type: 'video', label: 'top3-showcase-aug.mp4', duration: '3:45' } },
  ],
}

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
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Download className="w-4 h-4" strokeWidth={1.7} />
        </button>
      </div>
    )
  }

  if (media.type === 'voice') {
    return (
      <div className="mt-3 rounded-xl p-3 flex items-center gap-3" style={{ background: '#f4f2fc', border: '1px solid #e4dffb' }}>
        <button className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #8e78fb, #6c52f0)' }}>
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

export default async function ChannelPage({ params }: Props) {
  const { slug, channel } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const channelName = channel.charAt(0).toUpperCase() + channel.slice(1)
  const posts = MOCK_CHANNEL_POSTS[channel] || []

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
            {isAr ? 'قناة للقراءة فقط — المشرفون فقط يمكنهم النشر' : 'Read-only channel — only admins can post here'}
          </p>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="py-16 text-center">
          <Hash className="w-10 h-10 mx-auto mb-3 text-gray-200" strokeWidth={1.3} />
          <p className="text-[14px] font-medium text-gray-500">
            {isAr ? 'لا توجد منشورات في هذه القناة بعد' : 'Nothing here yet — stay tuned!'}
          </p>
          <p className="text-[12px] text-gray-400 mt-1">
            {isAr ? 'ترقبوا التحديثات' : "The admins haven't posted anything yet, but they will soon 🙌"}
          </p>
        </div>
      ) : (
        posts.map(post => (
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
                </div>
                <p className="text-[13.5px] leading-[1.7] text-gray-700 mt-1.5">{post.content}</p>
                <MediaBlock media={post.media} />
                <div className="flex items-center gap-4 mt-3">
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-[12px]">
                    <Heart className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors text-[12px]">
                    <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))
      )}

      {/* Read-only notice */}
      <div className="rounded-xl p-4 text-center" style={{ background: '#fafbfc', border: '1px solid #f0f0f0' }}>
        <p className="text-[12px] text-gray-400">
          {isAr
            ? '🔒 هذه القناة للقراءة فقط — فقط المشرفون يمكنهم النشر هنا'
            : "🔒 This channel is read-only — only the community admins can post here"}
        </p>
      </div>
    </div>
  )
}
