import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  MessageSquare, Bookmark, Info,
} from 'lucide-react'
import { getCommunity, isCurrentUserOwner } from '@/lib/community-data'
import Link from 'next/link'
import FeedSection from '@/components/community/feed-section'
import CommunityHero from '@/components/community/community-hero'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function CommunityFeedPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { tab } = await searchParams
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'
  const activeTab = tab === 'saved' ? 'saved' : tab === 'about' ? 'about' : 'feed'

  const adminCount = community.members.filter(m => m.role === 'owner' || m.role === 'admin').length

  return (
    <div className="flex flex-col gap-4">

      {/* ── HERO: always visible ──── */}
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
          { label: isAr ? 'المنشورات' : 'Feed', icon: MessageSquare, href: `/communities/${slug}`, key: 'feed' },
          { label: isAr ? 'المحفوظ' : 'Saved', icon: Bookmark, href: `/communities/${slug}?tab=saved`, key: 'saved' },
          { label: isAr ? 'حول' : 'About', icon: Info, href: `/communities/${slug}?tab=about`, key: 'about' },
        ].map(t => (
          <Link key={t.key} href={t.href}
            className="flex items-center gap-1.5 px-4 pb-2.5 text-[13px] font-medium transition-colors"
            style={{
              color: activeTab === t.key ? '#1a1730' : '#999',
              borderBottom: activeTab === t.key ? '2px solid #8e78fb' : '2px solid transparent',
            }}>
            <t.icon className="w-3.5 h-3.5" strokeWidth={1.7} />
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── FEED / SAVED / ABOUT ──────────────── */}
      {activeTab === 'about' ? (
        <div className="rounded-2xl p-6" style={{ background: '#f9f8fd', border: '1px solid #e8e4ff' }}>
          <h2 className="text-[18px] font-bold mb-3" style={{ color: '#1a1730' }}>
            {isAr ? 'حول المجتمع' : 'About this community'}
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: '#46426a' }}>
            {isAr ? community.descriptionAr : community.description}
          </p>
          <div className="mt-4 flex items-center gap-4 text-[13px]" style={{ color: '#9590b8' }}>
            <span><strong style={{ color: '#1a1730' }}>{community.membersCount}</strong> members</span>
            <span><strong style={{ color: '#1a1730' }}>{community.activeTodayCount}</strong> online today</span>
            <span><strong style={{ color: '#1a1730' }}>{adminCount}</strong> admins</span>
          </div>
        </div>
      ) : (
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
          isAdmin={isCurrentUserOwner(community)}
          showSavedOnly={activeTab === 'saved'}
        />
      )}
    </div>
  )
}
