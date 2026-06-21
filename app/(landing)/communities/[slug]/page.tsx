import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  MessageSquare, Bookmark, Image as ImageIcon,
  Video, Link2, Search,
  Heart, MessageCircle, MoreHorizontal, Share2,
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
    <div className="flex flex-col gap-5">

      {/* ── HERO BANNER ─────────────────────────── */}
      <div className="rounded-2xl overflow-hidden h-[180px] relative"
        style={{ background: `linear-gradient(135deg, #ede9ff 0%, #e8e4ff 30%, #f7f7fe 60%, #ede9ff 100%)` }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-white text-lg mx-auto mb-2 shadow-md"
              style={{ background: community.avatarColor }}>
              {community.avatarInitials}
            </div>
          </div>
        </div>
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
          { label: isAr ? 'الأحدث' : 'Latest', active: true },
          { label: isAr ? 'الأكثر رواجاً' : 'Trending', active: false },
          { label: isAr ? 'المتابَعون' : 'Following', active: false },
          { label: isAr ? 'المحفوظ' : 'Saved', active: false },
        ].map(tab => (
          <button key={tab.label}
            className="px-4 pb-2.5 text-[13px] font-medium transition-colors"
            style={{
              color: tab.active ? '#111' : '#999',
              borderBottom: tab.active ? '2px solid #111' : '2px solid transparent',
            }}>
            {tab.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5 pb-1">
          <Search className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.7} />
          <span className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
            {isAr ? 'بحث في المنشورات' : 'Search feeds'}
          </span>
        </div>
      </div>

      {/* ── COMPOSER ─────────────────────────────── */}
      {community.isJoined && (
        <div className="flex items-center gap-3 py-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0"
            style={{ background: community.avatarColor }}>
            WN
          </div>
          <button className="flex-1 text-left px-4 py-2.5 rounded-full text-[13px] text-gray-400 border border-gray-200 hover:border-gray-300 transition-colors"
            style={{ background: '#fafafa' }}>
            {isAr ? 'ما الذي يدور في بالك؟' : "What's on your mind?"}
          </button>
          <div className="flex items-center gap-1">
            {[
              <ImageIcon key="img" className="w-[18px] h-[18px]" strokeWidth={1.5} />,
              <Video key="vid" className="w-[18px] h-[18px]" strokeWidth={1.5} />,
              <Link2 key="lnk" className="w-[18px] h-[18px]" strokeWidth={1.5} />,
            ].map((icon, i) => (
              <button key={i} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                {icon}
              </button>
            ))}
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

            {/* Author row */}
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

            {/* Content */}
            <p className="text-[14px] leading-[1.75] text-gray-700 mb-4">
              {post.content}
            </p>

            {/* Actions */}
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
