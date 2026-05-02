import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { MessageSquare, Heart, Bookmark, BookOpen, Users, Flame, Star, ArrowRight } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props {
  params: Promise<{ slug: string }>
}

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}

export default async function CommunityFeedPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── Main feed ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Post composer */}
        {community.isJoined && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                style={{ background: 'var(--p)' }}
                aria-hidden="true"
              >
                WN
              </div>
              <button
                className="flex-1 text-left px-4 py-2.5 rounded-xl text-sm transition-all hover:opacity-90"
                style={{ background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }}
              >
                {isAr ? 'شارك شيئاً مع المجتمع…' : 'Write something to the community…'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: 'var(--p2)', color: 'var(--p)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
                {isAr ? 'صورة' : 'Photo'}
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: 'var(--p2)', color: 'var(--p)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
                  <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                {isAr ? 'فيديو' : 'Video'}
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {[
            { label: isAr ? 'كل المنشورات' : 'All Posts', count: community.posts.length },
            { label: isAr ? 'المحفوظة' : 'Saved', count: 0 },
          ].map((tab, i) => (
            <button
              key={i}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={
                i === 0
                  ? { background: 'var(--p)', color: '#fff' }
                  : { color: 'var(--t2)', background: 'var(--white)', border: '1px solid var(--bd)' }
              }
            >
              {tab.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={i === 0 ? { background: 'rgba(255,255,255,0.25)' } : { background: 'var(--bg)', color: 'var(--t3)' }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Posts */}
        {community.posts.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
          >
            <MessageSquare className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--p3)' }} strokeWidth={1.5} />
            <p className="text-sm font-semibold" style={{ color: 'var(--t2)' }}>
              {isAr ? 'لا توجد منشورات بعد' : 'No posts yet'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
              {isAr ? 'كن أول من يشارك في المجتمع' : 'Be the first to post in the community'}
            </p>
          </div>
        ) : (
          community.posts.map(post => (
            <article
              key={post.id}
              className="rounded-2xl p-5"
              style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                  style={{ background: post.authorColor }}
                  aria-label={post.authorName}
                >
                  {post.authorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{post.authorName}</p>
                  <p className="text-xs" style={{ color: 'var(--t3)' }}>@{post.authorHandle} · {post.timeAgo}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--t2)' }}>{post.content}</p>
              <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid var(--bd)' }}>
                <button className="flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-70" style={{ color: 'var(--t3)' }}>
                  <Heart className="w-3.5 h-3.5" strokeWidth={1.7} />
                  {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-70" style={{ color: 'var(--t3)' }}>
                  <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.7} />
                  {post.comments}
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium transition-all hover:opacity-70 ml-auto" style={{ color: 'var(--t3)' }}>
                  <Bookmark className="w-3.5 h-3.5" strokeWidth={1.7} />
                  {post.saves}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4">

        {/* About community */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--t1)' }}>
            {isAr ? 'عن المجتمع' : 'About Community'}
          </h2>
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0"
              style={{ background: community.avatarColor }}
            >
              {community.avatarInitials}
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--t1)' }}>{community.creatorName}</p>
              <p className="text-[10px]" style={{ color: 'var(--t3)' }}>
                {isAr ? 'المنشئ' : 'Community Creator'}
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>
            {isAr ? community.descriptionAr : community.description}
          </p>
        </div>

        {/* Continue Learning */}
        {community.courses.some(c => c.enrolled) && (
          <div
            className="rounded-2xl p-5"
            style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--t1)' }}>
              {isAr ? 'تابع التعلم' : 'Continue Learning'}
            </h2>
            {community.courses.filter(c => c.enrolled).slice(0, 1).map(course => (
              <div key={course.id}>
                <div
                  className="w-full rounded-xl mb-2 flex items-center justify-center"
                  style={{ height: 64, background: 'var(--p2)' }}
                  aria-hidden="true"
                >
                  <BookOpen className="w-6 h-6" style={{ color: 'var(--p)' }} strokeWidth={1.5} />
                </div>
                <p className="text-xs font-semibold line-clamp-2 mb-1" style={{ color: 'var(--t1)' }}>
                  {isAr ? course.titleAr : course.title}
                </p>
                <p className="text-[10px] mb-2" style={{ color: 'var(--t3)' }}>
                  {course.studentsCount} {isAr ? 'طالب' : 'students'}
                </p>
                {course.progress !== undefined && (
                  <div className="w-full rounded-full h-1.5 mb-2" style={{ background: 'var(--bg)' }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${course.progress}%`, background: 'var(--p)' }}
                    />
                  </div>
                )}
              </div>
            ))}
            <a
              href={`/communities/${community.slug}/courses`}
              className="flex items-center gap-1 text-xs font-semibold mt-1 transition-all hover:opacity-70"
              style={{ color: 'var(--p)' }}
            >
              {isAr ? 'عرض الكل' : 'View All'}
              <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </a>
          </div>
        )}

        {/* Stats grid */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
        >
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--t1)' }}>
            {isAr ? 'إحصائيات المجتمع' : 'Community Stats'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Users className="w-4 h-4" strokeWidth={1.7} />, value: fmt(community.membersCount), label: isAr ? 'عضو' : 'Total Members', color: 'var(--p)' },
              { icon: <Flame className="w-4 h-4" strokeWidth={1.7} />, value: community.activeTodayCount, label: isAr ? 'نشط اليوم' : 'Active Today', color: 'var(--orange)' },
              { icon: <MessageSquare className="w-4 h-4" strokeWidth={1.7} />, value: community.postsThisWeek, label: isAr ? 'منشور' : 'Posts/Week', color: 'var(--cyan)' },
              { icon: <Star className="w-4 h-4" strokeWidth={1.7} />, value: `${community.rating.toFixed(1)}`, label: isAr ? 'التقييم' : 'Rating', color: 'var(--orange)' },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl p-3 flex flex-col gap-1"
                style={{ background: 'var(--bg)' }}
              >
                <span style={{ color: stat.color }}>{stat.icon}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{stat.value}</span>
                <span className="text-[10px] leading-tight" style={{ color: 'var(--t3)' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
