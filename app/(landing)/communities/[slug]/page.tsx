import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  MessageSquare, Heart, Bookmark, Send, Image as ImageIcon,
  Video, Calendar, SlidersHorizontal, Pin,
} from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function CommunityFeedPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const upcomingEvent = community.events.find(e => !e.registered)

  return (
    <div className="flex flex-col gap-5">

      {/* ── POST COMPOSER ──────────────────────────────────────── */}
      {community.isJoined && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
              style={{ background: 'var(--p)' }}>WN</div>
            <button className="flex-1 text-left px-4 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--bg)]"
              style={{ color: 'var(--t3)', border: '1px solid var(--bd)' }}>
              {isAr ? 'اكتب شيئاً...' : 'Write something...'}
            </button>
          </div>
        </div>
      )}

      {/* ── UPCOMING EVENT BANNER ──────────────────────────────── */}
      {upcomingEvent && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
          <p className="text-sm flex-1" style={{ color: 'var(--t2)' }}>
            <span className="font-semibold" style={{ color: 'var(--t1)' }}>
              {upcomingEvent.title}
            </span>
            {' '}{isAr ? 'قريباً' : `is happening soon`}
          </p>
        </div>
      )}

      {/* ── FILTER TABS + CATEGORY PILLS ──────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* All */}
        <button className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          style={{ background: 'var(--t1)', color: 'var(--white)' }}>
          {isAr ? 'الكل' : 'All'}
        </button>

        {/* Example category pills */}
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors"
          style={{ background: 'var(--white)', color: 'var(--t2)', border: '1px solid var(--bd)' }}>
          💬 {isAr ? 'مناقشات عامة' : 'General'}
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors"
          style={{ background: 'var(--white)', color: 'var(--t2)', border: '1px solid var(--bd)' }}>
          📚 {isAr ? 'موارد' : 'Resources'}
        </button>

        {/* Filter icon */}
        <button className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg)]"
          style={{ color: 'var(--t3)', border: '1px solid var(--bd)' }}>
          <SlidersHorizontal className="w-4 h-4" strokeWidth={1.7} />
        </button>
      </div>

      {/* ── POSTS ──────────────────────────────────────────────── */}
      {community.posts.length === 0 ? (
        <div className="rounded-xl p-16 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg)' }}>
            <MessageSquare className="w-7 h-7" style={{ color: 'var(--t3)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-semibold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد منشورات بعد' : 'No posts yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'كن أول من يشارك في المجتمع' : 'Be the first to share in this community'}
          </p>
        </div>
      ) : (
        community.posts.map(post => (
          <article key={post.id}
            className="rounded-xl overflow-hidden transition-shadow hover:shadow-sm"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

            {/* Post header */}
            <div className="flex items-start gap-3 p-5 pb-0">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                style={{ background: post.authorColor }}>
                {post.authorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--t1)' }}>{post.authorName}</span>
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>@{post.authorHandle}</span>
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>·</span>
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>{post.timeAgo}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
                    💬 {isAr ? 'مناقشات عامة' : 'General'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Pin className="w-3.5 h-3.5" strokeWidth={1.7} style={{ color: 'var(--t3)' }} />
                <span className="text-[11px] font-medium" style={{ color: 'var(--t3)' }}>
                  {isAr ? 'مثبت' : 'Pinned'}
                </span>
              </div>
            </div>

            {/* Post content */}
            <div className="px-5 py-4">
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--t1)' }}>
                {post.content}
              </p>
            </div>

            {/* Post actions */}
            <div className="flex items-center px-5 py-3" style={{ borderTop: '1px solid var(--bd)' }}>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                  style={{ color: 'var(--t3)' }}>
                  <Heart className="w-[18px] h-[18px]" strokeWidth={1.7} />
                  <span>{post.likes}</span>
                  <span className="hidden sm:inline">{isAr ? 'إعجاب' : 'Like'}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                  style={{ color: 'var(--t3)' }}>
                  <MessageSquare className="w-[18px] h-[18px]" strokeWidth={1.7} />
                  <span>{post.comments}</span>
                  <span className="hidden sm:inline">{isAr ? 'تعليق' : 'Comment'}</span>
                </button>
              </div>

              {/* Comment avatars */}
              {post.comments > 0 && (
                <div className="hidden sm:flex items-center gap-1 ml-3">
                  {community.members.slice(0, 3).map((m, i) => (
                    <div key={m.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold border-2"
                      style={{
                        background: m.color,
                        borderColor: 'var(--white)',
                        marginLeft: i > 0 ? -4 : 0,
                        zIndex: 5 - i,
                        position: 'relative',
                      }}>
                      {m.initials}
                    </div>
                  ))}
                </div>
              )}

              {/* New comment indicator */}
              {post.comments > 0 && (
                <span className="ml-2 text-xs font-medium hidden sm:inline" style={{ color: 'var(--p)' }}>
                  {isAr ? 'تعليقات جديدة' : `New comment ${post.timeAgo}`}
                </span>
              )}

              <button className="ml-auto flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
                style={{ color: 'var(--t3)' }}>
                <Bookmark className="w-[18px] h-[18px]" strokeWidth={1.7} />
                <span className="hidden sm:inline">{isAr ? 'حفظ' : 'Save'}</span>
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  )
}
