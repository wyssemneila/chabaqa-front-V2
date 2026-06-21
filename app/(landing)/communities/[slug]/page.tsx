import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  MessageSquare, Heart, Bookmark, Image as ImageIcon,
  Video, Calendar, SlidersHorizontal, Pin, Send,
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

  const upcomingEvent = community.events.find(e => !e.registered)

  return (
    <div className="flex flex-col gap-5">

      {/* ── COMPOSER ─────────────────────────────────────────── */}
      {community.isJoined && (
        <div className="rounded-2xl overflow-hidden transition-shadow hover:shadow-[0_8px_32px_rgba(142,120,251,.08)]"
          style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>
          <div className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--p), #a78bfa)', boxShadow: '0 4px 12px rgba(142,120,251,.25)' }}>
              WN
            </div>
            <button className="flex-1 text-left px-4 py-3 rounded-xl text-sm transition-all hover:border-[var(--p)]"
              style={{ color: 'var(--t3)', background: 'var(--bg)', border: '1.5px solid transparent' }}>
              {isAr ? 'شارك شيئاً مع المجتمع...' : 'Share something with the community...'}
            </button>
          </div>
          <div className="px-4 pb-3 flex items-center gap-1" style={{ borderTop: '1px solid var(--bd)', paddingTop: '10px' }}>
            {[
              { icon: <ImageIcon className="w-4 h-4" strokeWidth={1.7} />, label: isAr ? 'صورة' : 'Photo', color: '#10b981' },
              { icon: <Video className="w-4 h-4" strokeWidth={1.7} />, label: isAr ? 'فيديو' : 'Video', color: '#f65887' },
            ].map((b, i) => (
              <button key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-[var(--bg)]"
                style={{ color: b.color }}>
                {b.icon}{b.label}
              </button>
            ))}
            <button className="ml-auto flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, var(--p), #a78bfa)', boxShadow: '0 4px 14px rgba(142,120,251,.3)' }}>
              <Send className="w-3.5 h-3.5" strokeWidth={2} />
              {isAr ? 'نشر' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* ── EVENT BANNER ─────────────────────────────────────── */}
      {upcomingEvent && (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-shadow hover:shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--p2), rgba(142,120,251,.05))', border: '1px solid var(--bd)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--p)', boxShadow: '0 4px 12px rgba(142,120,251,.25)' }}>
            <Calendar className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--t1)' }}>
              {upcomingEvent.title}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--t3)' }}>
              {isAr ? 'قريباً — احجز مكانك' : 'Coming soon — reserve your spot'}
            </p>
          </div>
          <button className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90"
            style={{ background: 'var(--p)', color: '#fff' }}>
            {isAr ? 'سجّل' : 'RSVP'}
          </button>
        </div>
      )}

      {/* ── FILTER PILLS ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[
          { label: isAr ? 'الكل' : 'All', active: true },
          { label: isAr ? 'مناقشات عامة' : 'General', emoji: '💬', active: false },
          { label: isAr ? 'موارد' : 'Resources', emoji: '📚', active: false },
        ].map((pill, i) => (
          <button key={i}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={pill.active
              ? { background: 'var(--p)', color: '#fff', boxShadow: '0 4px 14px rgba(142,120,251,.3)' }
              : { background: 'var(--white)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }
            }>
            {pill.emoji && <span>{pill.emoji}</span>}
            {pill.label}
          </button>
        ))}

        <button className="ml-auto w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-[var(--p2)] hover:text-[var(--p)]"
          style={{ color: 'var(--t3)', border: '1.5px solid var(--bd)', background: 'var(--white)' }}>
          <SlidersHorizontal className="w-4 h-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* ── POSTS ─────────────────────────────────────────────── */}
      {community.posts.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, var(--p2), rgba(142,120,251,.1))' }}>
            <MessageSquare className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد منشورات بعد' : 'No posts yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'كن أول من يشارك في المجتمع' : 'Be the first to share in this community'}
          </p>
        </div>
      ) : (
        community.posts.map(post => (
          <article key={post.id}
            className="group rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_8px_32px_rgba(142,120,251,.08)]"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>

            {/* Post header */}
            <div className="flex items-start gap-3 p-5 pb-0">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${post.authorColor}, ${post.authorColor}bb)` }}>
                {post.authorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{post.authorName}</span>
                  <span className="text-xs" style={{ color: 'var(--t3)' }}>@{post.authorHandle}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px]" style={{ color: 'var(--t3)' }}>{post.timeAgo}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
                    💬 {isAr ? 'مناقشات عامة' : 'General'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                  <Pin className="w-3 h-3" strokeWidth={2} />
                  {isAr ? 'مثبت' : 'Pinned'}
                </span>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--bg)]"
                  style={{ color: 'var(--t3)' }}>
                  <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>

            {/* Post body */}
            <div className="px-5 py-4">
              <p className="text-[15px] leading-[1.7]" style={{ color: 'var(--t1)' }}>
                {post.content}
              </p>
            </div>

            {/* Post footer */}
            <div className="flex items-center gap-2 px-5 py-3" style={{ borderTop: '1px solid var(--bd)' }}>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--p2)] hover:text-[var(--p)]"
                style={{ color: 'var(--t3)' }}>
                <ThumbsUp className="w-4 h-4" strokeWidth={1.8} />
                {post.likes > 0 && <span>{post.likes}</span>}
                <span className="hidden sm:inline">{isAr ? 'إعجاب' : 'Like'}</span>
              </button>

              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--p2)] hover:text-[var(--p)]"
                style={{ color: 'var(--t3)' }}>
                <MessageCircle className="w-4 h-4" strokeWidth={1.8} />
                {post.comments > 0 && <span>{post.comments}</span>}
                <span className="hidden sm:inline">{isAr ? 'تعليق' : 'Comment'}</span>
              </button>

              {/* Commenters */}
              {post.comments > 0 && (
                <div className="hidden sm:flex items-center gap-2 ml-1">
                  <div className="flex -space-x-1.5">
                    {community.members.slice(0, 3).map((m) => (
                      <div key={m.id}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[7px] font-bold ring-[1.5px] ring-[var(--white)]"
                        style={{ background: m.color }}>
                        {m.initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--p)' }}>
                    {isAr ? 'تعليق جديد' : 'New comment'}
                  </span>
                </div>
              )}

              <button className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--p2)] hover:text-[var(--p)]"
                style={{ color: 'var(--t3)' }}>
                <Bookmark className="w-4 h-4" strokeWidth={1.8} />
                <span className="hidden sm:inline">{isAr ? 'حفظ' : 'Save'}</span>
              </button>
            </div>
          </article>
        ))
      )}
    </div>
  )
}
