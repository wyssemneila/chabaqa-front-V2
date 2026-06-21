import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  MessageSquare, Bookmark, Image as ImageIcon,
  Video, SlidersHorizontal, Send,
  ThumbsUp, MessageCircle, MoreHorizontal,
} from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function CommunityFeedPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col gap-4">

      {/* ── COMPOSER ─────────────────────────── */}
      {community.isJoined && (
        <div className="rounded-2xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0"
              style={{ background: 'var(--p)' }}>
              WN
            </div>
            <button className="flex-1 text-left px-4 py-2.5 rounded-xl text-[13px]"
              style={{ color: 'var(--t3)', background: 'var(--bg)', border: '1px solid var(--bd)' }}>
              {isAr ? 'شارك شيئاً مع المجتمع...' : 'Share something with the community...'}
            </button>
          </div>
          <div className="px-4 pb-3 flex items-center gap-1" style={{ borderTop: '1px solid var(--bd)', paddingTop: '10px' }}>
            {[
              { icon: <ImageIcon className="w-4 h-4" strokeWidth={1.7} />, label: isAr ? 'صورة' : 'Photo', color: '#10b981' },
              { icon: <Video className="w-4 h-4" strokeWidth={1.7} />, label: isAr ? 'فيديو' : 'Video', color: '#f65887' },
            ].map((b, i) => (
              <button key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-[var(--bg)] transition-colors"
                style={{ color: b.color }}>
                {b.icon}{b.label}
              </button>
            ))}
            <button className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ background: 'var(--p)' }}>
              <Send className="w-3.5 h-3.5" strokeWidth={2} />
              {isAr ? 'نشر' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* ── FILTER PILLS ─────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { label: isAr ? 'الكل' : 'All', active: true },
          { label: isAr ? 'مناقشات' : 'General', active: false },
          { label: isAr ? 'موارد' : 'Resources', active: false },
        ].map((pill, i) => (
          <button key={i}
            className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors"
            style={pill.active
              ? { background: 'var(--t1)', color: 'var(--white)' }
              : { background: 'var(--white)', color: 'var(--t2)', border: '1px solid var(--bd)' }
            }>
            {pill.label}
          </button>
        ))}

        <button className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-[var(--bg)] transition-colors"
          style={{ color: 'var(--t3)', border: '1px solid var(--bd)' }}>
          <SlidersHorizontal className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* ── POSTS ─────────────────────────────── */}
      {community.posts.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--t3)' }} strokeWidth={1.3} />
          <p className="text-sm font-semibold" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد منشورات بعد' : 'No posts yet'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
            {isAr ? 'كن أول من يشارك' : 'Be the first to share'}
          </p>
        </div>
      ) : (
        community.posts.map(post => (
          <article key={post.id}
            className="rounded-2xl transition-shadow hover:shadow-md"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

            {/* Post header */}
            <div className="flex items-start gap-3 p-4 pb-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0"
                style={{ background: post.authorColor }}>
                {post.authorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{post.authorName}</span>
                  <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{post.timeAgo}</span>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--t3)' }}>@{post.authorHandle}</span>
              </div>
              <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg)] transition-colors flex-shrink-0"
                style={{ color: 'var(--t3)' }}>
                <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </div>

            {/* Post body */}
            <div className="px-4 py-3">
              <p className="text-[14px] leading-[1.7]" style={{ color: 'var(--t1)' }}>
                {post.content}
              </p>
            </div>

            {/* Post footer */}
            <div className="flex items-center gap-1 px-4 py-2.5" style={{ borderTop: '1px solid var(--bd)' }}>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-[var(--bg)] transition-colors"
                style={{ color: 'var(--t3)' }}>
                <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.8} />
                {post.likes > 0 && <span>{post.likes}</span>}
              </button>

              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-[var(--bg)] transition-colors"
                style={{ color: 'var(--t3)' }}>
                <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.8} />
                {post.comments > 0 && <span>{post.comments}</span>}
              </button>

              <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium hover:bg-[var(--bg)] transition-colors"
                style={{ color: 'var(--t3)' }}>
                <Bookmark className="w-3.5 h-3.5" strokeWidth={1.8} />
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  )
}
