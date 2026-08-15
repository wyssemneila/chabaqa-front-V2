import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Hash, Pin, Heart, MessageCircle } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string; channel: string }> }

const MOCK_CHANNEL_POSTS: Record<string, { id: string; author: string; initials: string; color: string; content: string; time: string; pinned?: boolean; likes: number }[]> = {
  general: [
    { id: '1', author: 'Motion Masters', initials: 'MM', color: '#f97316', content: "Welcome everyone! 🎉 This is the General channel — here you'll find important announcements and community updates. Feel free to read through and stay in the loop!", time: '2d ago', pinned: true, likes: 12 },
    { id: '2', author: 'Motion Masters', initials: 'MM', color: '#f97316', content: "New course dropping next week! 🚀 Keep your eyes peeled for the announcement. It's going to be a game changer for your workflow.", time: '1d ago', likes: 8 },
    { id: '3', author: 'Motion Masters', initials: 'MM', color: '#f97316', content: 'Quick reminder: our weekly live session is every Thursday at 7PM UTC. See you there! 🙌', time: '5h ago', likes: 5 },
  ],
  resources: [
    { id: '1', author: 'Motion Masters', initials: 'MM', color: '#f97316', content: '📚 Resource Pack #1 — Free After Effects templates and project files. Download link in the pinned post above!', time: '3d ago', pinned: true, likes: 24 },
    { id: '2', author: 'Motion Masters', initials: 'MM', color: '#f97316', content: '🎨 Color grading LUTs pack — 50+ professional LUTs for your video projects. Enjoy!', time: '1d ago', likes: 15 },
  ],
  showcase: [
    { id: '1', author: 'Motion Masters', initials: 'MM', color: '#f97316', content: "✨ Member spotlight this week goes to @ahmed-benali! Check out their amazing reel in the comments. You're killing it! 🔥", time: '2d ago', pinned: true, likes: 18 },
  ],
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
