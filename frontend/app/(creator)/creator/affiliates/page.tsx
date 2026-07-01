'use client'

import { useEffect, useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'
import {
  affiliateApi,
  type AffiliateMarketingResponse,
  type AffiliatePartner,
  type AffiliateProgram,
} from '@/lib/api/affiliate.api'
import {
  Plus, Link2, Copy, Check, Users, TrendingUp, DollarSign,
  MousePointerClick, Trash2, X, Pause, Play, Search,
  ToggleLeft, ToggleRight, Percent, Coins, ExternalLink,
  Clock, ShieldCheck, Inbox,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Affiliate {
  id: string
  name: string
  email: string
  slug: string
  commissionType: 'percent' | 'fixed'
  commissionValue: number
  status: 'active' | 'paused' | 'pending'
  createdAt: string
  stats: {
    clicks: number
    conversions: number
    earned: number
    pendingPayout: number
  }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

const SEED: Affiliate[] = [
  {
    id: 'af1', name: 'Sarra Mansour', email: 'sarra@gmail.com', slug: 'sarra-ref',
    commissionType: 'percent', commissionValue: 20, status: 'active', createdAt: '2026-02-10',
    stats: { clicks: 312, conversions: 47, earned: 840, pendingPayout: 120 },
  },
  {
    id: 'af2', name: 'Yassine Belhaj', email: 'yassine@outlook.com', slug: 'yassine20',
    commissionType: 'percent', commissionValue: 15, status: 'active', createdAt: '2026-02-18',
    stats: { clicks: 198, conversions: 28, earned: 504, pendingPayout: 75 },
  },
  {
    id: 'af3', name: 'Ines Trabelsi', email: 'ines.t@gmail.com', slug: 'ines-motion',
    commissionType: 'fixed', commissionValue: 10, status: 'active', createdAt: '2026-03-01',
    stats: { clicks: 87, conversions: 12, earned: 120, pendingPayout: 40 },
  },
  {
    id: 'af4', name: 'Khalil Oueslati', email: 'khalil@proton.me', slug: 'khalil-ref',
    commissionType: 'percent', commissionValue: 25, status: 'paused', createdAt: '2026-03-15',
    stats: { clicks: 44, conversions: 5, earned: 90, pendingPayout: 0 },
  },
  {
    id: 'af5', name: 'Nour Ben Ali', email: 'nour.benali@gmail.com', slug: 'nour-mm',
    commissionType: 'fixed', commissionValue: 15, status: 'pending', createdAt: '2026-04-01',
    stats: { clicks: 0, conversions: 0, earned: 0, pendingPayout: 0 },
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL  = 'https://chabaqa.com/r/'
const TABS      = ['all', 'active', 'paused', 'pending'] as const
const AVATAR_BG = ['var(--p)', 'var(--cyan)', 'var(--orange)', 'var(--pink)', '#8b5cf6', '#14b8a6']

const STATUS_META: Record<Affiliate['status'], { label: string; bg: string; color: string; border: string }> = {
  active:  { label: 'Active',  bg: 'rgba(74,222,128,.12)',  color: '#16a34a',       border: 'rgba(74,222,128,.3)' },
  paused:  { label: 'Paused',  bg: 'rgba(251,146,60,.12)',  color: 'var(--orange)', border: 'rgba(251,146,60,.3)' },
  pending: { label: 'Pending', bg: 'var(--p2)',              color: 'var(--p)',      border: 'var(--bd)' },
}

const pct = (a: number, b: number) => b === 0 ? '0%' : `${Math.round((a / b) * 100)}%`
const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const getId = (value: any) => String(value?._id || value?.id || value || '')
const getPartnerUser = (partner: AffiliatePartner): any =>
  typeof partner.partnerUserId === 'object' ? partner.partnerUserId : partner.user
const getPartnerName = (partner: AffiliatePartner): string => {
  const user = getPartnerUser(partner)
  return partner.displayName || user?.fullName || user?.name || partner.email || partner.inviteEmail || 'Affiliate'
}
const getPartnerEmail = (partner: AffiliatePartner): string => {
  const user = getPartnerUser(partner)
  return partner.email || partner.inviteEmail || user?.email || ''
}
const normalizeStatus = (status: AffiliatePartner['status']): Affiliate['status'] => {
  if (status === 'approved') return 'active'
  if (status === 'paused' || status === 'rejected') return 'paused'
  return 'pending'
}
const mapAffiliate = (
  partner: AffiliatePartner,
  program?: AffiliateProgram,
  marketing?: AffiliateMarketingResponse | null,
): Affiliate => {
  const partnerId = getId(partner._id || partner.id)
  const userId = typeof partner.partnerUserId === 'object' ? getId(partner.partnerUserId) : String(partner.partnerUserId || '')
  const perf = marketing?.leaderboards?.partners?.find(p =>
    String(p.partnerUserId) === userId ||
    String(p.partnerUserId) === partnerId ||
    p.email === getPartnerEmail(partner)
  )
  const recentLink = marketing?.linkBuilder?.recentLinks?.find(link =>
    String((link as any).partnerUserId || '') === userId ||
    String((link as any).partnerId || '') === partnerId
  )
  const commission = Number(partner.customCommissionPercent || program?.commissionPercent || 0)
  return {
    id: partnerId,
    name: getPartnerName(partner),
    email: getPartnerEmail(partner),
    slug: partner.couponCode || recentLink?.code || partnerId,
    commissionType: 'percent',
    commissionValue: commission,
    status: normalizeStatus(partner.status),
    createdAt: partner.createdAt || new Date().toISOString(),
    stats: {
      clicks: Number(perf?.clicks || 0),
      conversions: Number(perf?.conversions || 0),
      earned: Number(perf?.commissionDT || 0),
      pendingPayout: 0,
    },
  }
}

// ─── Copy Hook ────────────────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(null), 1800)
  }
  return { copied, copy }
}

// ─── Affiliate Card ───────────────────────────────────────────────────────────

function AffiliateCard({ aff, idx, onToggle, onDelete }: {
  aff: Affiliate; idx: number
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { copied, copy } = useCopy()
  const st  = STATUS_META[aff.status]
  const cvr = aff.stats.conversions && aff.stats.clicks ? pct(aff.stats.conversions, aff.stats.clicks) : '0%'
  const link = BASE_URL + aff.slug

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,.07)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>

      {/* header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {/* avatar */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold text-white"
          style={{ background: AVATAR_BG[idx % AVATAR_BG.length] }}>
          {initials(aff.name)}
        </div>

        {/* info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold truncate" style={{ color: 'var(--t1)' }}>{aff.name}</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
              style={{ background: st.bg, color: st.color, borderColor: st.border }}>{st.label}</span>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--t3)' }}>{aff.email}</p>
        </div>

        {/* commission badge */}
        <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-xl"
          style={{ background: 'var(--p2)', border: '1px solid var(--bd)' }}>
          {aff.commissionType === 'percent'
            ? <Percent className="w-3 h-3" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
            : <Coins className="w-3 h-3" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
          }
          <p className="text-[12px] font-bold" style={{ color: 'var(--p)' }}>
            {aff.commissionType === 'percent' ? `${aff.commissionValue}%` : `${aff.commissionValue} TND`}
          </p>
        </div>
      </div>

      {/* link row */}
      <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
        <Link2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
        <p className="text-[12px] flex-1 truncate" style={{ color: 'var(--t2)', fontFamily: 'monospace' }}>{link}</p>
        <button onClick={() => copy(link, aff.id)}
          className="flex items-center gap-1 text-[11px] font-semibold cursor-pointer hover:opacity-70 transition-opacity shrink-0"
          style={{ color: copied === aff.id ? '#16a34a' : 'var(--p)' }}>
          {copied === aff.id ? <Check className="w-3.5 h-3.5" strokeWidth={1.7} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.7} />}
          {copied === aff.id ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--bd)' }} />

      {/* stats */}
      <div className="px-4 py-3 grid grid-cols-4 gap-3">
        {[
          { label: 'Clicks',      value: aff.stats.clicks.toLocaleString(),           color: 'var(--p)'     },
          { label: 'Conversions', value: aff.stats.conversions.toLocaleString(),       color: 'var(--cyan)'  },
          { label: 'Conv. Rate',  value: cvr,                                          color: 'var(--orange)'},
          { label: 'Earned',      value: `${aff.stats.earned} TND`,                   color: '#16a34a'      },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-2.5" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
            <p className="text-[13px] font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--t2)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* pending payout */}
      {aff.stats.pendingPayout > 0 && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(251,146,60,.08)', border: '1px solid rgba(251,146,60,.25)' }}>
          <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--orange)' }} strokeWidth={1.7} />
          <p className="text-[12px]" style={{ color: 'var(--orange)' }}>
            <span className="font-semibold">{aff.stats.pendingPayout} TND</span> pending payout
          </p>
          <button className="ml-auto text-[11px] font-bold cursor-pointer hover:opacity-70" style={{ color: 'var(--orange)' }}>
            Pay Out
          </button>
        </div>
      )}

      {/* actions */}
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={() => onToggle(aff.id)}
          className="flex items-center gap-1.5 flex-1 h-8 rounded-xl text-[12px] font-semibold cursor-pointer hover:opacity-80 transition-opacity justify-center"
          style={aff.status === 'active'
            ? { background: 'rgba(251,146,60,.1)', color: 'var(--orange)' }
            : { background: 'rgba(74,222,128,.1)', color: '#16a34a' }}>
          {aff.status === 'active'
            ? <><Pause className="w-3.5 h-3.5" /> Pause</>
            : <><Play  className="w-3.5 h-3.5" /> Activate</>}
        </button>
        <button onClick={() => onDelete(aff.id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
          style={{ background: 'rgba(239,68,68,.08)', color: '#ef4444' }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Create Drawer ────────────────────────────────────────────────────────────

function CreateDrawer({ open, onClose, onSave }: {
  open: boolean; onClose: () => void; onSave: (a: Affiliate) => Promise<void> | void
}) {
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [slug,      setSlug]      = useState('')
  const [comType,   setComType]   = useState<'percent' | 'fixed'>('percent')
  const [comVal,    setComVal]    = useState('20')
  const [saving,    setSaving]    = useState(false)

  const autoSlug = (n: string) =>
    n.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 24)

  const handleNameChange = (v: string) => {
    setName(v)
    if (!slug || slug === autoSlug(name)) setSlug(autoSlug(v))
  }

  const canSave = name.trim() && email.trim() && slug.trim() && comVal

  const submit = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({
      id: '',
      name, email, slug,
      commissionType: comType,
      commissionValue: Number(comVal),
      status: 'pending',
      createdAt: new Date().toISOString().slice(0, 10),
      stats: { clicks: 0, conversions: 0, earned: 0, pendingPayout: 0 },
      })
      onClose()
      setName(''); setEmail(''); setSlug(''); setComVal('20')
    } finally {
      setSaving(false)
    }
  }

  const inp = "w-full h-10 px-3 rounded-xl text-[13px] outline-none transition-colors"
  const fs  = { border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t1)' }
  const fo  = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--p)'),
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = 'var(--bd)'),
  }

  const LBL = ({ text, req, htmlFor }: { text: string; req?: boolean; htmlFor?: string }) => (
    <label htmlFor={htmlFor} className="text-[12px] font-semibold mb-1.5 block" style={{ color: 'var(--t2)' }}>
      {text}{req && <span style={{ color: 'var(--p)' }}> *</span>}
    </label>
  )

  return (
    <>
      <div className="fixed inset-0 z-40 transition-all duration-300"
        style={{ background: open ? 'rgba(0,0,0,.35)' : 'transparent', backdropFilter: open ? 'blur(2px)' : 'none', pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[440px] z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{ background: 'var(--white)', borderLeft: '1px solid var(--bd)', transform: open ? 'translateX(0)' : 'translateX(100%)' }}>

        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div>
            <p className="text-[15px] font-bold" style={{ color: 'var(--t1)' }}>Add Affiliate</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--t2)' }}>Create a tracked referral link</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-70"
            style={{ background: 'var(--bg)', color: 'var(--t3)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>Affiliate Info</p>
            <div className="space-y-3">
              <div>
                <LBL text="Full Name" req />
                <input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Sarra Mansour"
                  className={inp} style={fs} {...fo} />
              </div>
              <div>
                <LBL text="Email Address" req />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="affiliate@email.com"
                  className={inp} style={fs} {...fo} />
              </div>
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>Referral Link</p>
            <LBL text="Link Slug" req />
            <div className="flex items-center gap-0 rounded-xl overflow-hidden"
              style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)' }}>
              <span className="px-3 text-[12px] shrink-0 h-10 flex items-center" style={{ color: 'var(--t3)', borderRight: '1px solid var(--bd)', background: 'var(--white)' }}>
                chabaqa.com/r/
              </span>
              <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="custom-slug" className="flex-1 h-10 px-3 text-[13px] outline-none bg-transparent"
                style={{ color: 'var(--t1)', fontFamily: 'monospace' }}
                onFocus={e => ((e.target as HTMLInputElement).closest('div') as HTMLElement)!.style.borderColor = 'var(--p)'}
                onBlur={e  => ((e.target as HTMLInputElement).closest('div') as HTMLElement)!.style.borderColor = 'var(--bd)'} />
            </div>
            {slug && (
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--t3)' }}>
                Full link: <span style={{ color: 'var(--p)', fontFamily: 'monospace' }}>{BASE_URL}{slug}</span>
              </p>
            )}
          </section>

          <div style={{ borderTop: '1px solid var(--bd)' }} />

          <section>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--p)' }}>Commission</p>

            <div className="flex gap-2 mb-3">
              {([['percent', 'Percentage %'], ['fixed', 'Fixed Amount']] as const).map(([t, l]) => (
                <button key={t} onClick={() => setComType(t)}
                  className="flex-1 h-9 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
                  style={comType === t
                    ? { background: 'var(--p)', color: '#fff' }
                    : { background: 'var(--bg)', color: 'var(--t2)', border: '1.5px solid var(--bd)' }}>
                  {l}
                </button>
              ))}
            </div>

            <LBL text={comType === 'percent' ? 'Commission %' : 'Commission per sale (TND)'} req />
            <div className="relative">
              <input type="number" value={comVal} onChange={e => setComVal(e.target.value)}
                min="1" max={comType === 'percent' ? '100' : '500'}
                placeholder={comType === 'percent' ? '20' : '10'}
                className={inp + ' pr-12'} style={fs} {...fo} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold" style={{ color: 'var(--t3)' }}>
                {comType === 'percent' ? '%' : 'TND'}
              </span>
            </div>

            {/* quick presets */}
            <div className="flex gap-2 mt-2">
              {(comType === 'percent' ? ['10', '15', '20', '25', '30'] : ['5', '10', '15', '20']).map(v => (
                <button key={v} onClick={() => setComVal(v)}
                  className="h-7 px-3 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
                  style={comVal === v
                    ? { background: 'var(--p2)', color: 'var(--p)', border: '1px solid var(--p)' }
                    : { background: 'var(--bg)', color: 'var(--t3)', border: '1px solid var(--bd)' }}>
                  {v}{comType === 'percent' ? '%' : ' TND'}
                </button>
              ))}
            </div>
          </section>

          {/* info box */}
          <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl"
            style={{ background: 'var(--p2)', border: '1px solid var(--bd)' }}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
            <p className="text-[12px]" style={{ color: 'var(--t2)' }}>
              The affiliate will receive an email with their link. Commission is tracked on all conversions from this link.
            </p>
          </div>

          <div className="h-2" />
        </div>

        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--bd)' }}>
          <button onClick={submit} disabled={!canSave || saving}
            className="w-full h-10 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: 'var(--p)' }}>
            {saving
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <><Link2 className="w-4 h-4" strokeWidth={1.7} /> Create Affiliate Link</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string
}) {
  return (
    <div className="rounded-2xl p-5 flex gap-4 items-start"
      style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + '1a' }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div>
        <p className="text-[22px] font-bold leading-tight" style={{ color: 'var(--t1)' }}>{value}</p>
        <p className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--t2)' }}>{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--t2)' }}>{sub}</p>
      </div>
    </div>
  )
}

export default function AffiliatesPage() {
  const { selectedCommunityId, isLoading: communityLoading } = useCreatorCommunity()
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [programs,   setPrograms]   = useState<AffiliateProgram[]>([])
  const [loadError,  setLoadError]  = useState('')
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState<typeof TABS[number]>('all')
  const [search,     setSearch]     = useState('')
  const [drawer,     setDrawer]     = useState(false)

  const loadAffiliates = async () => {
    if (communityLoading) return
    if (!selectedCommunityId) {
      setAffiliates([])
      setPrograms([])
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError('')
    try {
      const [programList, marketing] = await Promise.all([
        affiliateApi.creator.listPrograms(),
        affiliateApi.creator.getMarketing({ communityId: selectedCommunityId, days: 30, limit: 100 }),
      ])
      const scopedPrograms = programList.filter(p => !p.communityId || String(p.communityId) === String(selectedCommunityId))
      const activePrograms = scopedPrograms.length ? scopedPrograms : programList
      setPrograms(activePrograms)

      const partnersById = new Map<string, AffiliatePartner>()
      const partnerLists = await Promise.all(
        activePrograms.length
          ? activePrograms.map(p => affiliateApi.creator.listPartners(getId(p._id || p.id)).catch(() => []))
          : [affiliateApi.creator.listPartners().catch(() => [])],
      )
      partnerLists.flat().forEach(partner => {
        const id = getId(partner._id || partner.id)
        if (id) partnersById.set(id, partner)
      })

      const partners = Array.from(partnersById.values())
      setAffiliates(partners.map(partner => {
        const program = activePrograms.find(p => getId(p._id || p.id) === String(partner.programId)) || activePrograms[0]
        return mapAffiliate(partner, program, marketing)
      }))
    } catch (error: any) {
      setAffiliates([])
      setLoadError(error?.message || 'Failed to load affiliates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadAffiliates() }, [communityLoading, selectedCommunityId])

  const save = (list: Affiliate[]) => setAffiliates(list)

  const toggle = async (id: string) => {
    const current = affiliates.find(a => a.id === id)
    if (!current) return
    const nextStatus = current.status === 'active' ? 'paused' : 'approved'
    setLoadError('')
    try {
      await affiliateApi.creator.updatePartnerStatus(id, nextStatus)
      setAffiliates(prev => prev.map(a => a.id !== id ? a : {
        ...a,
        status: nextStatus === 'approved' ? 'active' : 'paused',
      }))
    } catch (error: any) {
      setLoadError(error?.message || 'Failed to update affiliate')
    }
  }

  const removeAffiliate = async (id: string) => {
    setLoadError('')
    try {
      await affiliateApi.creator.updatePartnerStatus(id, 'rejected')
      setAffiliates(prev => prev.filter(a => a.id !== id))
    } catch (error: any) {
      setLoadError(error?.message || 'Failed to remove affiliate')
    }
  }

  const ensureProgram = async (commissionPercent: number) => {
    const existing = programs.find(p => p.status === 'active') || programs[0]
    if (existing) return existing
    if (!selectedCommunityId) throw new Error('Select a community first')
    const created = await affiliateApi.creator.createProgram({
      communityId: selectedCommunityId,
      name: 'Community Affiliate Program',
      description: 'Default affiliate program for this community.',
      scopeType: 'community',
      commissionPercent,
      cookieWindowDays: 30,
      holdDays: 14,
      attributionModel: 'last_click',
      autoApprovePartners: false,
    })
    setPrograms(prev => [created, ...prev])
    return created
  }

  const createAffiliate = async (affiliate: Affiliate) => {
    setLoadError('')
    try {
      const program = await ensureProgram(affiliate.commissionType === 'percent' ? affiliate.commissionValue : 10)
      const partner = await affiliateApi.creator.invitePartner(getId(program._id || program.id), {
        email: affiliate.email,
        displayName: affiliate.name,
        customCommissionPercent: affiliate.commissionType === 'percent' ? affiliate.commissionValue : undefined,
        couponCode: affiliate.slug,
        source: 'creator_dashboard',
      })
      await loadAffiliates()
    } catch (error: any) {
      setLoadError(error?.message || 'Failed to create affiliate')
    }
  }

  const filtered = affiliates
    .filter(a => tab === 'all' || a.status === tab)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()))

  const totalClicks      = affiliates.reduce((s, a) => s + a.stats.clicks,      0)
  const totalConversions = affiliates.reduce((s, a) => s + a.stats.conversions, 0)
  const totalEarned      = affiliates.reduce((s, a) => s + a.stats.earned,      0)
  const totalPending     = affiliates.reduce((s, a) => s + a.stats.pendingPayout, 0)

  const tabCount = (t: string) => t === 'all' ? affiliates.length : affiliates.filter(a => a.status === t).length

  return (
    <>
      <style>{`
        @keyframes dashFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Affiliates" subtitle="Track referral links, conversions and commissions" />

          <main id="main-content" className="p-7 flex-1" style={{ animation: 'dashFadeUp .4s ease both' }}>
            {loadError && (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.22)', color: '#ef4444' }}>
                <p className="text-[12px] font-semibold truncate">{loadError}</p>
                <button onClick={() => void loadAffiliates()} className="text-[12px] font-bold cursor-pointer hover:opacity-70">Retry</button>
              </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              <KpiCard icon={<Users className="w-5 h-5" />}             label="Total Affiliates" value={String(affiliates.length)} sub={`${affiliates.filter(a=>a.status==='active').length} active`} color="var(--p)" />
              <KpiCard icon={<MousePointerClick className="w-5 h-5" />} label="Total Clicks"     value={totalClicks.toLocaleString()} sub="all affiliate links"    color="var(--cyan)" />
              <KpiCard icon={<TrendingUp className="w-5 h-5" />}        label="Conversions"      value={totalConversions.toLocaleString()} sub={`${pct(totalConversions, totalClicks)} conv. rate`} color="var(--orange)" />
              <KpiCard icon={<DollarSign className="w-5 h-5" />}        label="Commissions Paid" value={`${totalEarned} TND`}       sub={`${totalPending} TND pending`} color="#16a34a" />
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-semibold cursor-pointer transition-all capitalize"
                    style={tab === t ? { background: 'var(--p)', color: '#fff' } : { color: 'var(--t3)' }}>
                    {t}
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full"
                      style={tab === t ? { background: 'rgba(255,255,255,.25)', color: '#fff' } : { background: 'var(--bg)', color: 'var(--t3)' }}>
                      {tabCount(t)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[160px] h-9 px-3 rounded-xl"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--t3)' }} strokeWidth={1.7} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search affiliates…"
                  className="flex-1 bg-transparent text-[13px] outline-none" style={{ color: 'var(--t1)' }} />
                {search && <button onClick={() => setSearch('')} style={{ color: 'var(--t3)' }}><X className="w-3.5 h-3.5" /></button>}
              </div>

              <button onClick={() => setDrawer(true)}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90"
                style={{ background: 'var(--p)' }}>
                <Plus className="w-4 h-4" strokeWidth={1.7} /> Add Affiliate
              </button>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--p3)] border-t-[var(--p)] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed"
                style={{ borderColor: 'var(--bd)', background: 'var(--white)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--p2)' }}>
                  <Inbox className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.7} />
                </div>
                <p className="text-[15px] font-bold mb-1.5" style={{ color: 'var(--t1)' }}>No affiliates found</p>
                <p className="text-[13px] mb-6" style={{ color: 'var(--t2)' }}>Add your first affiliate to start tracking</p>
                {!search && (
                  <button onClick={() => setDrawer(true)}
                    className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90"
                    style={{ background: 'var(--p)' }}>
                    <Plus className="w-4 h-4" strokeWidth={1.7} /> Add Affiliate
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-w-5xl">
                {filtered.map((a, i) => (
                  <div key={a.id} style={{ animation: `dashFadeUp .3s ${i * 50}ms ease both` }}>
                    <AffiliateCard aff={a} idx={i}
                      onToggle={toggle}
                      onDelete={removeAffiliate} />
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <CreateDrawer open={drawer} onClose={() => setDrawer(false)} onSave={a => void createAffiliate(a)} />
    </>
  )
}
