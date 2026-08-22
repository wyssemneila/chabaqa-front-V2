'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  Plus, Trophy, Zap, Star, BookOpen, Target,
  Users, Calendar, Clock, Pencil, Trash2, Inbox, Layers,
} from 'lucide-react'
import { PageStatsBar, PageFilterTabs } from '@/components/creator-dashboard/PageStatsBar'

interface Challenge {
  id: string; title: string; description: string; category: string
  difficulty: string; durationDays: number; sequential: boolean
  maxParticipants: number | 'unlimited'; startDate: string
  completionReward: string; topPerformerReward: string
  priceType: 'free' | 'paid'; price: number
  isPublished: boolean; steps: any[]
}

const DIFF_COLOR: Record<string, { bg: string; color: string }> = {
  beginner:     { bg: 'rgba(34,211,238,.12)',  color: 'var(--cyan)'   },
  intermediate: { bg: 'rgba(251,146,60,.12)',  color: 'var(--orange)' },
  advanced:     { bg: 'var(--p2)',             color: 'var(--p)'      },
  expert:       { bg: 'rgba(236,72,153,.12)',  color: 'var(--pink)'   },
}

export default function ChallengesPage() {
  const router = useRouter()
  const { lang } = useDashPrefs()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading,    setLoading]    = useState(true)
  const [tab, setTab] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chabaqa_challenges')
      setChallenges(raw ? JSON.parse(raw) : [])
    } catch { setChallenges([]) }
    finally   { setLoading(false) }
  }, [])

  const del = (id: string) => {
    const next = challenges.filter(c => c.id !== id)
    setChallenges(next)
    localStorage.setItem('chabaqa_challenges', JSON.stringify(next))
  }

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>
      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Challenges" subtitle="Create and manage your community challenges" />
          <main id="main-content" className="p-7 flex-1 space-y-6" style={{ animation: 'dashFadeUp .4s ease both' }}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-semibold" style={{ color: 'var(--t1)' }}>
                  {lang==='ar' ? 'تحدياتك' : 'Your Challenges'}
                </h2>
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--t3)' }}>
                  {challenges.length} {lang==='ar' ? 'تحدي' : 'challenge'}{challenges.length !== 1 && lang==='en' ? 's' : ''} {lang==='ar' ? 'مُنشأ' : 'created'}
                </p>
              </div>
              <button onClick={() => router.push('/creator/challenges/create')}
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: 'var(--p)', boxShadow: '0 4px 14px rgba(142,120,251,.4)' }}>
                <Plus className="w-4 h-4" strokeWidth={1.7} /> {lang==='ar' ? 'إنشاء تحدي' : 'Create Challenge'}
              </button>
            </div>

            {/* Stats */}
            <PageStatsBar stats={[
              { label: lang==='ar' ? 'إجمالي التحديات' : 'Total Challenges',
                value: challenges.length, icon: Trophy,
                color: 'var(--p)', bg: 'var(--p2)' },
              { label: lang==='ar' ? 'منشور' : 'Published',
                value: challenges.filter(c => c.isPublished).length, icon: Zap,
                color: 'var(--pink)', bg: 'rgba(236,72,153,.1)' },
              { label: lang==='ar' ? 'إجمالي الخطوات' : 'Total Steps',
                value: challenges.reduce((n, c) => n + (c.steps?.length ?? 0), 0), icon: Layers,
                color: 'var(--cyan)', bg: 'rgba(34,211,238,.12)' },
            ]} />

            {/* Section header + tabs */}
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold" style={{ color: 'var(--t1)' }}>
                {lang==='ar' ? 'كل التحديات' : 'All Challenges'}
              </h3>
              <PageFilterTabs<'all' | 'active' | 'inactive'>
                active={tab}
                onChange={setTab}
                tabs={[
                  { key:'all',      label: lang==='ar' ? 'الكل' : 'All' },
                  { key:'active',   label: lang==='ar' ? 'نشط' : 'Active' },
                  { key:'inactive', label: lang==='ar' ? 'غير نشط' : 'Inactive' },
                ]}
                counts={{
                  all:      challenges.length,
                  active:   challenges.filter(c => c.isPublished).length,
                  inactive: challenges.filter(c => !c.isPublished).length,
                }} />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--p3)] border-t-[var(--p)] animate-spin" />
              </div>
            ) : challenges.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed"
                style={{ borderColor: 'var(--bd)', background: 'var(--white)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--p2)' }}>
                  <Trophy className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                </div>
                <p className="text-[15px] font-bold mb-1.5" style={{ color: 'var(--t1)' }}>No challenges yet</p>
                <p className="text-[13px] mb-6" style={{ color: 'var(--t3)' }}>Create your first challenge for the community</p>
                <button onClick={() => router.push('/creator/challenges/create')}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--p)' }}>
                  <Plus className="w-4 h-4" strokeWidth={1.7} /> Create Challenge
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-w-4xl">
                {challenges
                  .filter((c) => tab === 'all' ? true : tab === 'active' ? c.isPublished : !c.isPublished)
                  .map((ch, i) => {
                  const diff = DIFF_COLOR[ch.difficulty] ?? { bg: 'var(--p2)', color: 'var(--p)' }
                  return (
                    <div key={ch.id}
                      className="flex gap-4 rounded-2xl overflow-hidden transition-all duration-200"
                      style={{ background: 'var(--white)', border: '1px solid var(--bd)', animation: `dashFadeUp .3s ${i*60}ms ease both` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,.07)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

                      {/* cover */}
                      <div className="w-[140px] shrink-0 relative"
                        style={{ background: 'linear-gradient(135deg,var(--p) 0%,#6c52f0 100%)' }}>
                        {(ch as any).banner
                          ? <img src={(ch as any).banner} alt="Challenge banner" loading="lazy" className="w-full h-full object-cover" />
                          : <div className="absolute inset-0 flex items-center justify-center">
                              <Trophy className="w-8 h-8 text-white opacity-40" strokeWidth={1.7} />
                            </div>
                        }
                      </div>

                      {/* info */}
                      <div className="flex-1 py-4 pr-4 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className="text-[14px] font-bold truncate" style={{ color: 'var(--t1)' }}>{ch.title}</p>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 border"
                                style={ch.isPublished
                                  ? { background:'rgba(74,222,128,.12)', color:'#16a34a', borderColor:'rgba(74,222,128,.3)' }
                                  : { background:'var(--bg)', color:'var(--t3)', borderColor:'var(--bd)' }}>
                                {ch.isPublished ? (lang==='ar'?'منشور':'Published') : (lang==='ar'?'مسودة':'Draft')}
                              </span>
                            </div>
                            <p className="text-[12px] truncate" style={{ color: 'var(--t2)' }}>{ch.description}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => router.push(`/creator/challenges/${ch.id}/edit`)}
                              aria-label="Edit challenge"
                              className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
                              style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => del(ch.id)}
                              aria-label="Delete challenge"
                              className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
                              style={{ background: 'rgba(239,68,68,.08)', color: '#ef4444' }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full capitalize"
                            style={{ background: diff.bg, color: diff.color }}>
                            {ch.difficulty}
                          </span>
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
                            <Clock className="w-3 h-3" strokeWidth={1.7} /> {ch.durationDays} days
                          </span>
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
                            <Layers className="w-3 h-3" strokeWidth={1.7} /> {ch.steps?.length ?? 0} steps
                          </span>
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
                            <Users className="w-3 h-3" strokeWidth={1.7} />
                            {ch.maxParticipants === 'unlimited' ? 'Unlimited' : ch.maxParticipants}
                          </span>
                          {ch.startDate && (
                            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
                              <Calendar className="w-3 h-3" strokeWidth={1.7} /> {ch.startDate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
