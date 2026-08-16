'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BarChart3, Check, CircleHelp, Compass, LayoutDashboard, Network, PanelTop, Sparkles } from 'lucide-react'
import { useAuthContext } from '@/app/providers/auth-provider'
import { updateCreatorDashboardOnboarding, type CreatorDiscoverySource } from '@/lib/api/user.api'
import { trackEvent } from '@/lib/ga4'

const discoverySources: Array<{ id: CreatorDiscoverySource; label: string }> = [
  { id: 'instagram_tiktok', label: 'Instagram or TikTok' },
  { id: 'search', label: 'Google or search' },
  { id: 'friend_creator', label: 'A friend or creator' },
  { id: 'youtube_podcast', label: 'YouTube or a podcast' },
  { id: 'event', label: 'An event or workshop' },
  { id: 'other', label: 'Somewhere else' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const tour = [
  { title: 'Your overview', description: 'This is your home base. Watch members, revenue, and engagement move as your community grows.', action: 'Stay on overview', href: '/creator/dashboard', Icon: LayoutDashboard },
  { title: 'Your community', description: 'Choose a community here, then shape its name, landing page, members, and settings.', action: 'Open communities', href: '/creator/communities', Icon: Network },
  { title: 'Your content', description: 'Courses, challenges, sessions, events, and products live in one focused workspace.', action: 'Explore content', href: '/creator/courses', Icon: PanelTop },
  { title: 'Your growth', description: 'Use analytics to learn what is working, then return to marketing tools when you are ready to share.', action: 'View analytics', href: '/creator/analytics', Icon: BarChart3 },
]

export default function DashOnboarding() {
  const { user } = useAuthContext()
  const persisted = user?.creatorOnboarding || {}
  const [source, setSource] = useState<CreatorDiscoverySource | null>(null)
  const [sourceSaved, setSourceSaved] = useState(Boolean(persisted.discoverySource))
  const [tourStep, setTourStep] = useState(Math.min(Math.max(Number(persisted.dashboardTourStep) || 0, 0), tour.length - 1))
  const [completed, setCompleted] = useState(Boolean(persisted.dashboardTourCompleted))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSourceSaved(Boolean(persisted.discoverySource))
    setCompleted(Boolean(persisted.dashboardTourCompleted))
    setTourStep(Math.min(Math.max(Number(persisted.dashboardTourStep) || 0, 0), tour.length - 1))
  }, [persisted.dashboardTourCompleted, persisted.dashboardTourStep, persisted.discoverySource, user?._id])

  if (!user || completed) return null

  const saveSource = async () => {
    if (!source) return
    setSaving(true)
    setError('')
    try {
      await updateCreatorDashboardOnboarding({ discoverySource: source, dashboardTourStep: tourStep })
      setSourceSaved(true)
      trackEvent('creator_dashboard_discovery_source', { source })
    } catch (saveError: any) {
      setError(saveError?.message || 'We could not save your answer. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const moveTour = async (nextStep: number, finish = false) => {
    setSaving(true)
    setError('')
    try {
      await updateCreatorDashboardOnboarding(
        finish ? { dashboardTourCompleted: true } : { dashboardTourStep: nextStep },
      )
      if (finish) {
        setCompleted(true)
        trackEvent('creator_dashboard_tour_completed')
      } else {
        setTourStep(nextStep)
        trackEvent('creator_dashboard_tour_progressed', { step: nextStep + 1 })
      }
    } catch (saveError: any) {
      setError(saveError?.message || 'We could not save your progress. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const step = tour[tourStep]
  const StepIcon = step.Icon

  return (
    <section aria-label="Creator dashboard onboarding" className="mb-6 overflow-hidden rounded-[18px] border border-white/70 p-4 backdrop-blur-xl sm:p-5" style={{ background: 'rgba(255,255,255,.43)', boxShadow: '0 12px 42px rgba(70,72,125,.07)', animation: 'dashFadeUp .4s ease both' }}>
      <div className="flex items-center gap-3 border-b border-slate-200/70 pb-4">
        <div className="grid h-10 w-10 place-items-center rounded-[13px] border border-white/80 bg-white/65 p-2 shadow-sm">
          <img src="/logo-icon.png" alt="Chabaqa" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-slate-800">Welcome to your creator dashboard</p>
          <p className="mt-0.5 text-[12px] text-slate-500">A short introduction, then this space stays out of your way.</p>
        </div>
        <span className="hidden rounded-full border border-indigo-200/70 bg-indigo-50/50 px-2.5 py-1 text-[11px] font-medium text-indigo-700 sm:inline">{sourceSaved ? `Step ${tourStep + 1} of ${tour.length}` : 'Quick question'}</span>
      </div>

      {!sourceSaved ? (
        <div className="pt-5">
          <div className="flex items-start gap-3">
            <Compass className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" strokeWidth={1.6} />
            <div><h2 className="text-[17px] font-medium text-slate-900">Where did you first hear about Chabaqa?</h2><p className="mt-1 text-[13px] leading-5 text-slate-500">This optional answer helps us understand which creator education is useful. We do not use it in your public profile.</p></div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {discoverySources.map((item) => <button key={item.id} type="button" onClick={() => setSource(item.id)} className="min-h-11 rounded-xl border px-3 text-left text-[12px] font-normal transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" style={{ background: source === item.id ? 'rgba(224,231,255,.72)' : 'rgba(255,255,255,.35)', borderColor: source === item.id ? 'rgb(129 140 248)' : 'rgba(203,213,225,.8)', color: source === item.id ? '#3730a3' : '#475569' }}>{item.label}</button>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-[11px] text-slate-400">You can change other account details in Settings at any time.</p><button type="button" disabled={!source || saving} onClick={saveSource} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-indigo-300 bg-indigo-500/90 px-4 text-[12px] font-medium text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-45">{saving ? 'Saving...' : 'Continue'} <ArrowRight className="h-3.5 w-3.5" /></button></div>
        </div>
      ) : (
        <div className="pt-5">
          <div className="flex flex-wrap items-center gap-2" aria-label={`Dashboard tour step ${tourStep + 1} of ${tour.length}`}>
            {tour.map((item, index) => <span key={item.title} className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-medium" style={{ background: index < tourStep ? 'rgba(52,211,153,.18)' : index === tourStep ? 'rgba(99,102,241,.16)' : 'rgba(148,163,184,.12)', color: index < tourStep ? '#047857' : index === tourStep ? '#4338ca' : '#64748b' }}>{index < tourStep ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>{index < tour.length - 1 && <span className="h-px w-6 bg-slate-200 sm:w-10" />}</span>)}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-indigo-100 bg-indigo-50/65 text-indigo-600"><StepIcon className="h-5 w-5" strokeWidth={1.5} /></div>
            <div><h2 className="text-[17px] font-medium text-slate-900">{step.title}</h2><p className="mt-1 max-w-2xl text-[13px] leading-6 text-slate-500">{step.description}</p></div>
            <div className="flex flex-wrap gap-2 sm:justify-end"><Link href={step.href} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white/45 px-3 text-[12px] font-medium text-slate-600 transition hover:bg-white/80">{step.action} <ArrowRight className="h-3.5 w-3.5" /></Link><button type="button" disabled={saving} onClick={() => void moveTour(Math.min(tourStep + 1, tour.length - 1), tourStep === tour.length - 1)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-500/90 px-3 text-[12px] font-medium text-white transition hover:bg-indigo-600 disabled:opacity-50">{tourStep === tour.length - 1 ? 'Finish tour' : 'Next'} <ArrowRight className="h-3.5 w-3.5" /></button></div>
          </div>
          <button type="button" disabled={saving} onClick={() => void moveTour(tour.length - 1, true)} className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-normal text-slate-400 transition hover:text-slate-700"><CircleHelp className="h-3.5 w-3.5" /> I know my way around</button>
        </div>
      )}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-[12px] text-rose-700">{error}</p>}
    </section>
  )
}
