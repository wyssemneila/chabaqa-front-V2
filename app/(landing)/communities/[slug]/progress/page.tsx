import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Lock, Trophy } from 'lucide-react'
import { getCommunity, LEVEL_CONFIG } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function ProgressPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const currentUser = community.members.find(m => m.isYou) || community.members[0]
  const currentLevel = currentUser?.level || 1
  const pointsToNext = 5

  const levels = Array.from({ length: 9 }, (_, i) => ({
    level: i + 1,
    pct: i === 0 ? 95 : i < 5 ? 1 : 0,
    unlocked: i === 0,
    label: i === 8 ? (isAr ? 'محادثة الأعضاء' : 'Chat with members') : undefined,
  }))

  const leaderboard7 = community.members.slice(0, 10).map((m, i) => ({
    ...m, rank: i + 1, points: Math.max(16 - i, 5) + (i < 3 ? 5 : 0),
  }))
  const leaderboard30 = [...community.members].sort(() => 0.5 - Math.random()).slice(0, 10).map((m, i) => ({
    ...m, rank: i + 1, points: Math.max(180 - i * 15, 20),
  }))
  const leaderboardAll = [...community.members].sort(() => 0.5 - Math.random()).slice(0, 10).map((m, i) => ({
    ...m, rank: i + 1, points: Math.max(243 - i * 20, 50),
  }))

  const medalColors = ['#D4AF37', '#C0C0C0', '#CD7F32']

  return (
    <div className="flex flex-col gap-6" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Profile + Levels Card */}
      <div className="rounded-xl p-6" style={{ border: '1px solid #e8e4ff', background: '#fff' }}>
        <div className="flex gap-8">
          {/* Avatar + Info */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="relative">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: currentUser?.color || '#8e78fb' }}>
                {currentUser?.initials || 'WN'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: '#8e78fb', border: '2px solid #fff' }}>
                {currentLevel}
              </div>
            </div>
            <p className="text-sm font-bold" style={{ color: '#1a1730' }}>{currentUser?.name || 'Wyssem Neila'}</p>
            <p className="text-xs" style={{ color: '#8e78fb' }}>Level {currentLevel}</p>
            <p className="text-xs" style={{ color: '#9590b8' }}>
              {pointsToNext} {isAr ? 'نقاط للترقية' : 'points to level up'} ⓘ
            </p>
          </div>

          {/* Level Grid */}
          <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-6">
            {levels.map(lv => (
              <div key={lv.level} className="flex items-center gap-2.5 py-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: lv.unlocked ? '#8e78fb' : '#f3f4f6',
                    color: lv.unlocked ? '#fff' : '#9590b8',
                  }}>
                  {lv.unlocked ? lv.level : <Lock className="w-3 h-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium" style={{ color: '#1a1730' }}>Level {lv.level}</span>
                  {lv.label && (
                    <span className="text-xs ml-1" style={{ color: '#8e78fb' }}>
                      {isAr ? 'فتح ' : 'Unlock '}{lv.label}
                    </span>
                  )}
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: '#9590b8' }}>{lv.pct}% {isAr ? 'من الأعضاء' : 'of members'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs italic" style={{ color: '#9590b8' }}>
        {isAr ? 'آخر تحديث:' : 'Last updated:'} Jun 21st 2026 5:38pm
      </p>

      {/* 3 Leaderboard Columns */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { title: isAr ? 'المتصدرين (7 أيام)' : 'Leaderboard (7-day)', data: leaderboard7, prefix: '+' },
          { title: isAr ? 'المتصدرين (30 يوم)' : 'Leaderboard (30-day)', data: leaderboard30, prefix: '+' },
          { title: isAr ? 'المتصدرين (كل الوقت)' : 'Leaderboard (all-time)', data: leaderboardAll, prefix: '' },
        ].map(board => (
          <div key={board.title} className="rounded-xl" style={{ border: '1px solid #e8e4ff', background: '#fff' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid #e8e4ff' }}>
              <h3 className="text-sm font-bold" style={{ color: '#1a1730' }}>{board.title}</h3>
            </div>
            <div className="divide-y" style={{ borderColor: '#f7f7fe' }}>
              {board.data.map(member => (
                <div key={member.id} className="flex items-center gap-2.5 px-4 py-2.5">
                  {/* Rank */}
                  {member.rank <= 3 ? (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ background: medalColors[member.rank - 1] }}>
                      {member.rank}
                    </div>
                  ) : (
                    <span className="w-5 text-center text-xs font-medium flex-shrink-0" style={{ color: '#9590b8' }}>
                      {member.rank}
                    </span>
                  )}
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: member.color }}>
                    {member.initials}
                  </div>
                  {/* Name */}
                  <span className="flex-1 text-sm truncate" style={{ color: '#1a1730' }}>{member.name}</span>
                  {/* Points */}
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: member.rank <= 3 ? '#8e78fb' : '#46426a' }}>
                    {board.prefix}{member.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
