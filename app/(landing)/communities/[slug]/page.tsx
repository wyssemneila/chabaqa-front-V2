import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  MessageSquare, Bookmark, Image as ImageIcon,
  Video, Link2, Search,
  Heart, MessageCircle, MoreHorizontal, Share2,
  Trophy, Users, Info, Smile, Paperclip, BarChart3, ChevronDown, X,
} from 'lucide-react'
import { getCommunity } from '@/lib/community-data'
import Link from 'next/link'

interface Props { params: Promise<{ slug: string }> }

export default async function CommunityFeedPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col gap-5">

      {/* ── HERO BANNER (16:9) ──── */}
      <div className="rounded-2xl overflow-hidden relative w-full" style={{ aspectRatio: '16/9', background: '#ede9ff' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/community/banner.png" alt={community.name}
          className="absolute inset-0 w-full h-full object-cover" />
      </div>

      {/* ── COMMUNITY TITLE + DESCRIPTION ───────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? community.nameAr : community.name}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed max-w-[560px]">
          {isAr ? community.descriptionAr : community.description}
        </p>
      </div>

      {/* ── FILTER TABS ─────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-gray-100">
        {[
          { label: isAr ? 'المنشورات' : 'Feed', icon: MessageSquare, href: `/communities/${slug}`, active: true },
          { label: isAr ? 'المحفوظ' : 'Saved', icon: Bookmark, href: `/communities/${slug}?tab=saved`, active: false },
          { label: isAr ? 'حول' : 'About', icon: Info, href: `/communities/${slug}/reviews`, active: false },
          { label: isAr ? 'المتصدرين' : 'Leaderboards', icon: Trophy, href: `/communities/${slug}/progress`, active: false },
          { label: isAr ? 'الأعضاء' : 'Members', icon: Users, href: `/communities/${slug}/members`, active: false },
        ].map(tab => (
          <Link key={tab.label} href={tab.href}
            className="flex items-center gap-1.5 px-4 pb-2.5 text-[13px] font-medium transition-colors"
            style={{
              color: tab.active ? '#1a1730' : '#999',
              borderBottom: tab.active ? '2px solid #8e78fb' : '2px solid transparent',
            }}>
            <tab.icon className="w-3.5 h-3.5" strokeWidth={1.7} />
            {tab.label}
          </Link>
        ))}

        <div className="ml-auto flex items-center gap-1.5 pb-1">
          <Search className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.7} />
          <span className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
            {isAr ? 'بحث في المنشورات' : 'Search feeds'}
          </span>
        </div>
      </div>

      {/* ── COMPOSER (Skool-style) ── */}
      {community.isJoined && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4dffb' }}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#faf8ff', borderBottom: '1px solid #f0eeff' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[9px] flex-shrink-0"
              style={{ background: '#8e78fb' }}>
              WN
            </div>
            <span className="text-[13px] text-gray-600">
              <span className="font-semibold text-gray-900">Wyssem Neila</span>
              {' '}{isAr ? 'ينشر في' : 'posting in'}{' '}
              <span className="font-semibold" style={{ color: '#8e78fb' }}>{isAr ? community.nameAr : community.name}</span>
            </span>
          </div>

          {/* Body */}
          <div className="p-4 bg-white">
            <input type="text" placeholder={isAr ? 'العنوان (اختياري)' : 'Title (optional)'}
              className="w-full text-[15px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none mb-3" readOnly />
            <textarea rows={4}
              placeholder={isAr ? 'اكتب شيئاً... 💬' : "Write something..."}
              className="w-full text-[13.5px] text-gray-700 placeholder:text-gray-400 bg-transparent outline-none resize-none leading-relaxed"
              readOnly />
          </div>

          {/* Footer toolbar */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#fafbfc', borderTop: '1px solid #f0f0f0' }}>
            <div className="flex items-center gap-0.5">
              {[
                { icon: <Paperclip className="w-4 h-4" strokeWidth={1.5} />, tip: 'Attach file' },
                { icon: <ImageIcon className="w-4 h-4" strokeWidth={1.5} />, tip: 'Image' },
                { icon: <Video className="w-4 h-4" strokeWidth={1.5} />, tip: 'Video' },
                { icon: <Link2 className="w-4 h-4" strokeWidth={1.5} />, tip: 'Link' },
                { icon: <BarChart3 className="w-4 h-4" strokeWidth={1.5} />, tip: 'Poll' },
                { icon: <Smile className="w-4 h-4" strokeWidth={1.5} />, tip: 'Emoji' },
                { icon: <span className="text-[10px] font-bold leading-none">GIF</span>, tip: 'GIF' },
              ].map((item, i) => (
                <button key={i} title={item.tip}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  {item.icon}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button className="h-8 px-3 rounded-lg text-[12px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                {isAr ? 'إلغاء' : 'CANCEL'}
              </button>
              <button className="h-8 px-5 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #8e78fb, #6c52f0)' }}>
                {isAr ? 'نشر' : 'POST'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POSTS ─────────────────────────────────── */}
      {community.posts.length === 0 ? (
        <div className="py-16 text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" strokeWidth={1.3} />
          <p className="text-sm font-medium text-gray-600">
            {isAr ? 'لا توجد منشورات بعد' : 'No posts yet'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {isAr ? 'كن أول من يشارك' : 'Be the first to share'}
          </p>
        </div>
      ) : (
        community.posts.map(post => (
          <article key={post.id} className="py-4" style={{ borderBottom: '1px solid #f0f0f0' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0"
                style={{ background: post.authorColor }}>
                {post.authorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-gray-900">{post.authorName}</span>
                  <span className="text-[11px] text-gray-400">·</span>
                  <span className="text-[11px] text-gray-400">{post.timeAgo}</span>
                </div>
                <span className="text-[11px] text-gray-400">
                  {isAr ? `عضو منذ يوليو 2024` : `Member since July 18, 2024`}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="w-8 h-8 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
                  <Bookmark className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button className="w-8 h-8 rounded-md flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors">
                  <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <p className="text-[14px] leading-[1.75] text-gray-700 mb-4">{post.content}</p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-5">
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <Heart className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                  <Share2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {(post.likes > 0 || post.comments > 0) && (
                <div className="ml-auto flex items-center gap-3">
                  {post.likes > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1">
                        {community.members.slice(0, 2).map(m => (
                          <div key={m.id} className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[6px] font-bold ring-2 ring-white"
                            style={{ background: m.color }}>
                            {m.initials}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-400">{post.likes} {isAr ? 'إعجاب' : 'likes'}</span>
                    </div>
                  )}
                  {post.comments > 0 && (
                    <span className="text-[11px] text-gray-400">
                      {post.comments} {isAr ? 'تعليق' : 'comments'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  )
}
