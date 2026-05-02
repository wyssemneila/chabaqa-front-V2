import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  MessageSquare, Heart, Bookmark, BookOpen, Users, Flame,
  Star, ArrowRight, Image as ImageIcon, Video, Send, Pin,
} from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}

export default async function CommunityFeedPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const enrolledCourse = community.courses.find(c => c.enrolled && (c.progress ?? 0) < 100)

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* ── FEED (center) ──────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">

        {/* Composer */}
        {community.isJoined && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-white text-xs flex-shrink-0 shadow"
                style={{ background: 'var(--p)' }}>WN</div>
              <button className="flex-1 text-left px-4 py-3 rounded-2xl text-sm transition-all hover:border-[var(--p)]"
                style={{ background: 'var(--bg)', color: 'var(--t3)', border: '1.5px solid var(--bd)' }}>
                {isAr ? 'شارك شيئاً مع المجتمع…' : 'Share something with the community…'}
              </button>
            </div>
            <div className="px-4 pb-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--bd)', paddingTop: 12 }}>
              {[
                { icon: <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.7} />, label: isAr ? 'صورة' : 'Photo' },
                { icon: <Video className="w-3.5 h-3.5" strokeWidth={1.7} />, label: isAr ? 'فيديو' : 'Video' },
              ].map((b, i) => (
                <button key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                  {b.icon}{b.label}
                </button>
              ))}
              <button className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: 'var(--p)', color: '#fff' }}>
                <Send className="w-3.5 h-3.5" strokeWidth={1.7} />
                {isAr ? 'نشر' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {[
            { label: isAr ? 'كل المنشورات' : 'All Posts', count: community.posts.length, active: true },
            { label: isAr ? 'المحفوظة' : 'Saved', count: 0, active: false },
          ].map((tab, i) => (
            <button key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={tab.active
                ? { background: 'var(--p)', color: '#fff', boxShadow: '0 4px 12px rgba(142,120,251,.35)' }
                : { background: 'var(--white)', color: 'var(--t2)', border: '1px solid var(--bd)' }
              }>
              {tab.label}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black"
                style={tab.active ? { background: 'rgba(255,255,255,.25)' } : { background: 'var(--bg)', color: 'var(--t3)' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Posts */}
        {community.posts.length === 0 ? (
          <div className="rounded-2xl p-16 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--p2)' }}>
              <MessageSquare className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
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
              className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_8px_32px_rgba(142,120,251,.1)]"
              style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>

              {/* Header */}
              <div className="flex items-start gap-3 p-5 pb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-extrabold text-white text-xs flex-shrink-0 shadow-md"
                  style={{ background: post.authorColor }}>
                  {post.authorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold" style={{ color: 'var(--t1)' }}>{post.authorName}</p>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>
                    @{post.authorHandle} · {post.timeAgo}
                  </p>
                </div>
                <Pin className="w-3.5 h-3.5 flex-shrink-0 opacity-0" strokeWidth={1.7} />
              </div>

              {/* Content */}
              <div className="px-5 pb-5">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--t2)' }}>{post.content}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 px-4 py-3" style={{ borderTop: '1px solid var(--bd)' }}>
                {[
                  { icon: <Heart className="w-4 h-4" strokeWidth={1.7} />, count: post.likes, label: isAr ? 'إعجاب' : 'Like' },
                  { icon: <MessageSquare className="w-4 h-4" strokeWidth={1.7} />, count: post.comments, label: isAr ? 'تعليق' : 'Comment' },
                ].map((action, i) => (
                  <button key={i}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-[var(--bg)]"
                    style={{ color: 'var(--t3)' }}>
                    {action.icon}
                    {action.count > 0 && <span style={{ color: 'var(--t2)' }}>{action.count}</span>}
                    <span>{action.label}</span>
                  </button>
                ))}
                <button className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-[var(--bg)]"
                  style={{ color: 'var(--t3)' }}>
                  <Bookmark className="w-4 h-4" strokeWidth={1.7} />
                  {isAr ? 'حفظ' : 'Save'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* ── RIGHT SIDEBAR ──────────────────────────────────────────── */}
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col gap-4">

        {/* About */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${community.avatarColor}, var(--p))` }} />
          <div className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--t3)' }}>
              {isAr ? 'عن المجتمع' : 'About'}
            </h3>
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-xs flex-shrink-0"
                style={{ background: community.avatarColor }}>
                {community.avatarInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--t1)' }}>{community.creatorName}</p>
                <p className="text-[10px]" style={{ color: 'var(--t3)' }}>{isAr ? 'منشئ المجتمع' : 'Community Creator'}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--t2)' }}>
              {isAr ? community.descriptionAr : community.description}
            </p>
          </div>
        </div>

        {/* Continue Learning */}
        {enrolledCourse && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, var(--p), var(--cyan, #47c7ea))' }} />
            <div className="p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--t3)' }}>
                {isAr ? 'تابع التعلم' : 'Continue Learning'}
              </h3>
              <div className="rounded-xl flex items-center justify-center mb-3" style={{ height: 72, background: 'var(--p2)' }}>
                <BookOpen className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
              </div>
              <p className="text-xs font-bold line-clamp-2 mb-3" style={{ color: 'var(--t1)' }}>
                {isAr ? enrolledCourse.titleAr : enrolledCourse.title}
              </p>
              {enrolledCourse.progress !== undefined && (
                <>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{isAr ? 'التقدم' : 'Progress'}</span>
                    <span className="text-[10px] font-black" style={{ color: 'var(--p)' }}>{enrolledCourse.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full mb-3" style={{ background: 'var(--bg)' }}>
                    <div className="h-2 rounded-full" style={{ width: `${enrolledCourse.progress}%`, background: 'linear-gradient(90deg, var(--p), #a78bfa)' }} />
                  </div>
                </>
              )}
              <a href={`/communities/${community.slug}/courses`}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                style={{ background: 'var(--p2)', color: 'var(--p)' }}>
                {isAr ? 'عرض الكورسات' : 'View All Courses'}
                <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
              </a>
            </div>
          </div>
        )}

        {/* Community stats */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, var(--orange, #ff9b28), var(--pink, #f65887))' }} />
          <div className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--t3)' }}>
              {isAr ? 'إحصائيات' : 'Stats'}
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: <Users className="w-4 h-4" strokeWidth={1.7} />, value: fmt(community.membersCount), label: isAr ? 'عضو' : 'Members', color: 'var(--p)', bg: 'var(--p2)' },
                { icon: <Flame className="w-4 h-4" strokeWidth={1.7} />, value: community.activeTodayCount, label: isAr ? 'نشط اليوم' : 'Active Today', color: 'var(--orange, #ff9b28)', bg: '#fff4e5' },
                { icon: <MessageSquare className="w-4 h-4" strokeWidth={1.7} />, value: community.postsThisWeek, label: isAr ? 'منشور/أسبوع' : 'Posts/Week', color: 'var(--cyan, #47c7ea)', bg: '#e0f7fc' },
                { icon: <Star className="w-4 h-4" strokeWidth={1.7} />, value: community.rating.toFixed(1), label: isAr ? 'التقييم' : 'Rating', color: '#ff9b28', bg: '#fff4e5' },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3 flex flex-col gap-1.5" style={{ background: s.bg }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <span className="text-base font-extrabold leading-none" style={{ color: 'var(--t1)' }}>{s.value}</span>
                  <span className="text-[10px] leading-tight" style={{ color: 'var(--t2)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
