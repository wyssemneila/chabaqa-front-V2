import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  MessageSquare, Bookmark, Search, Info,
} from 'lucide-react'
import { getCommunity } from '@/lib/community-data'
import Link from 'next/link'
import FeedSection from '@/components/community/feed-section'
import CommunityHero from '@/components/community/community-hero'

interface Props { params: Promise<{ slug: string }> }

export default async function CommunityFeedPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const adminCount = community.members.filter(m => m.role === 'owner' || m.role === 'admin').length

  return (
    <div className="flex flex-col gap-4">

      {/* ── HERO: info left + banner right ──── */}
      <CommunityHero
        name={isAr ? community.nameAr : community.name}
        description={isAr ? community.descriptionAr : community.description}
        slug={slug}
        membersCount={community.membersCount}
        onlineCount={community.activeTodayCount}
        adminCount={adminCount}
        bannerSrc="/images/community/banner.png"
        avatarInitials={community.avatarInitials}
        avatarColor={community.avatarColor}
      />

      {/* ── FILTER TABS ─────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-gray-100">
        {[
          { label: isAr ? 'المنشورات' : 'Feed', icon: MessageSquare, href: `/communities/${slug}`, active: true },
          { label: isAr ? 'المحفوظ' : 'Saved', icon: Bookmark, href: `/communities/${slug}?tab=saved`, active: false },
          { label: isAr ? 'حول' : 'About', icon: Info, href: `/communities/${slug}/reviews`, active: false },
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

      {/* ── FEED (composer + posts) ──────────────── */}
      <FeedSection
        communityName={isAr ? community.nameAr : community.name}
        avatarColor={community.avatarColor}
        isJoined={community.isJoined}
        initialPosts={community.posts.map(p => ({
          id: p.id,
          authorName: p.authorName,
          authorInitials: p.authorInitials,
          authorColor: p.authorColor,
          content: p.content,
          timeAgo: p.timeAgo,
          likes: p.likes,
          comments: p.comments,
        }))}
        members={community.members.slice(0, 3).map(m => ({ id: m.id, initials: m.initials, color: m.color }))}
      />
    </div>
  )
}
