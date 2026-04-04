'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import {
  ArrowLeft, ArrowRight, Check, Image as ImageIcon,
  Globe, Share2, Sparkles, Upload, X,
  Unlock, CreditCard, Repeat, CalendarDays, Receipt,
  Instagram, Facebook, Youtube, Twitter, Linkedin,
  Link as LinkIcon,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingPeriod = 'one_time' | 'monthly' | 'yearly'
interface CommunityForm {
  name: string; country: string; description: string
  logo: string; thumbnail: string
  pricingType: 'free' | 'paid'; billingPeriod: BillingPeriod; price: string
  instagram: string; facebook: string; youtube: string
  tiktok: string; twitter: string; linkedin: string; website: string
}

const INIT: CommunityForm = {
  name: '', country: '', description: '',
  logo: '', thumbnail: '',
  pricingType: 'free', billingPeriod: 'monthly', price: '',
  instagram: '', facebook: '', youtube: '',
  tiktok: '', twitter: '', linkedin: '', website: '',
}

// ─── Countries ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Algeria','Bahrain','Egypt','Iraq','Jordan','Kuwait','Lebanon','Libya',
  'Mauritania','Morocco','Oman','Palestine','Qatar','Saudi Arabia','Sudan',
  'Syria','Tunisia','UAE','Yemen',
  'France','Germany','Italy','Spain','United Kingdom','United States',
  'Canada','Australia','Netherlands','Belgium','Switzerland','Turkey','Other',
]

// ─── Social platforms ─────────────────────────────────────────────────────────

const SOCIALS = [
  { key: 'instagram', label: 'Instagram',   color: '#E1306C', Icon: Instagram },
  { key: 'facebook',  label: 'Facebook',    color: '#1877F2', Icon: Facebook  },
  { key: 'youtube',   label: 'YouTube',     color: '#FF0000', Icon: Youtube   },
  { key: 'twitter',   label: 'X (Twitter)', color: '#000000', Icon: Twitter   },
  { key: 'linkedin',  label: 'LinkedIn',    color: '#0A66C2', Icon: Linkedin  },
  { key: 'website',   label: 'Website',     color: '#7c3aed', Icon: LinkIcon  },
]

// TikTok outline icon (not in lucide)
function TikTokIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
    </svg>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Info'   },
  { id: 2, label: 'Branding'     },
  { id: 3, label: 'Pricing'      },
  { id: 4, label: 'Social Links' },
]

// ─── Logo / image upload ──────────────────────────────────────────────────────

function useImgPick(onPick: (url: string) => void) {
  const ref = useRef<HTMLInputElement>(null)
  const open = () => ref.current?.click()
  const node = (
    <input ref={ref} type="file" accept="image/*" className="hidden"
      onChange={e => {
        const f = e.target.files?.[0]; if (!f) return
        const r = new FileReader(); r.onload = ev => onPick(ev.target?.result as string); r.readAsDataURL(f)
        e.target.value = ''
      }} />
  )
  return { open, node }
}

// ─── Celebration popup ────────────────────────────────────────────────────────

function CelebrationPopup({ name, onOk }: { name: string; onOk: () => void }) {
  useEffect(() => {
    const colors = ['#8e78fb','#fb923c','#22d3ee','#f472b6','#a78bfa','#ffffff','#fbbf24']
    const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999, colors }
    const rand = (a: number, b: number) => Math.random() * (b - a) + a
    const end = Date.now() + 4000
    const iv = window.setInterval(() => {
      const left = end - Date.now(); if (left <= 0) return clearInterval(iv)
      const n = 60 * (left / 4000)
      confetti({ ...defaults, particleCount: n, origin: { x: rand(.1, .3), y: Math.random() - .2 } })
      confetti({ ...defaults, particleCount: n, origin: { x: rand(.7, .9), y: Math.random() - .2 } })
    }, 250)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }}>
      <style>{`
        @keyframes popIn  { 0%{transform:scale(.35);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ring   { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.5)} 60%{box-shadow:0 0 0 20px rgba(124,58,237,0)} }
      `}</style>

      <div className="w-full max-w-[380px] rounded-3xl overflow-hidden text-center"
        style={{ background: 'var(--white)', boxShadow: '0 40px 100px rgba(0,0,0,.3)' }}>
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg,var(--p),#22d3ee,#fb923c)' }} />
        <div className="px-8 py-8">

          <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'var(--p)', animation: 'popIn .55s cubic-bezier(.34,1.56,.64,1) both, ring 2s 1s infinite' }}>
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>

          <div style={{ animation: 'fadeUp .45s .2s ease both' }}>
            <p className="text-[11px] font-bold tracking-[.12em] uppercase mb-1" style={{ color: 'var(--p)' }}>Community Created</p>
            <h2 className="text-[22px] font-bold mb-1.5" style={{ color: 'var(--t1)' }}>Congratulations! 🎉</h2>
            <p className="text-[13px]" style={{ color: 'var(--t3)' }}>
              <span className="font-semibold" style={{ color: 'var(--p)' }}>"{name || 'Your Community'}"</span> is now live
            </p>
          </div>

          <div className="mt-5 mb-6 px-4 py-4 rounded-2xl text-left"
            style={{ background: 'var(--p2)', border: '1px solid var(--bd)', animation: 'fadeUp .45s .4s ease both' }}>
            <div className="flex gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--p)' }} strokeWidth={1.8} />
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--t1)' }}>
                You can now <strong>create content</strong> and turn your expertise into a business —
                publish courses, run live sessions, launch challenges and grow your community.
              </p>
            </div>
          </div>

          <button onClick={onOk}
            className="w-full h-11 rounded-2xl text-[14px] font-bold text-white cursor-pointer transition-all hover:opacity-90 active:scale-[.97]"
            style={{ background: 'var(--p)', boxShadow: '0 8px 24px rgba(124,58,237,.35)', animation: 'fadeUp .45s .55s ease both' }}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared field wrapper ─────────────────────────────────────────────────────

function F({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>
        {label}{req && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full h-10 px-3 rounded-xl text-[13px] outline-none"
const inputSty = { border: '1.5px solid var(--bd)', background: 'var(--white)', color: 'var(--t1)' } as React.CSSProperties
const focusBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = 'var(--p)')
const blurBorder = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = 'var(--bd)')

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateCommunityPage() {
  const router = useRouter()
  const [step,       setStep]       = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [celebrate,  setCelebrate]  = useState(false)
  const [data, setData] = useState<CommunityForm>(INIT)
  const set = (k: keyof CommunityForm, v: string) => setData(p => ({ ...p, [k]: v }))

  const canNext = () => {
    if (step === 1) return !!(data.name.trim() && data.country && data.description.trim())
    if (step === 3) return data.pricingType === 'free' || (!!data.price && parseFloat(data.price) > 0)
    return true
  }

  const handleNext = () => {
    if (step < 4) { setStep(s => s + 1); return }
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setCelebrate(true) }, 1100)
  }

  // logo picker
  const { open: openLogo,  node: logoInput  } = useImgPick(v => set('logo', v))
  const { open: openThumb, node: thumbInput } = useImgPick(v => set('thumbnail', v))

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--white)' }}>

      {/* ── LEFT — form ──────────────────────────────────────────────────────── */}
      <div className="w-1/2 flex flex-col h-full overflow-y-auto">

        {/* Top bar */}
        <div className="px-10 pt-8 pb-6 shrink-0">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12px] cursor-pointer hover:opacity-60 transition-opacity mb-8"
            style={{ color: 'var(--t3)' }}>
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Back to dashboard
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => {
              const done   = step > s.id
              const active = step === s.id
              return (
                <div key={s.id} className="flex items-center">
                  {i > 0 && (
                    <div className="h-px w-10 mx-1 transition-all duration-300"
                      style={{ background: done || active ? 'var(--p)' : 'var(--bd)' }} />
                  )}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300"
                      style={{
                        background: done ? 'var(--p)' : active ? 'var(--p)' : 'var(--bg)',
                        color:      done || active ? '#fff' : 'var(--t3)',
                        border:     done || active ? 'none' : '1.5px solid var(--bd)',
                      }}>
                      {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.id}
                    </div>
                    <span className="text-[10px] font-semibold whitespace-nowrap"
                      style={{ color: active ? 'var(--p)' : done ? 'var(--t2)' : 'var(--t3)' }}>
                      {s.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Step heading */}
          <h1 className="text-[26px] font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {step === 1 && 'Basic Information'}
            {step === 2 && 'Branding'}
            {step === 3 && 'Pricing'}
            {step === 4 && 'Social Links'}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--t3)' }}>
            {step === 1 && 'Tell people what your community is about.'}
            {step === 2 && 'Add a logo and banner so your community is recognizable.'}
            {step === 3 && 'Choose how members will access your community.'}
            {step === 4 && 'Connect your social media. Everything is optional.'}
          </p>
        </div>

        {/* Form body */}
        <div className="flex-1 px-10 pb-6">

          {/* ── Step 1 ─────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <F label="Community Name" req>
                <input value={data.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Motion Masters"
                  className={inputCls} style={inputSty}
                  onFocus={focusBorder} onBlur={blurBorder} />
              </F>
              <F label="Country" req>
                <select value={data.country} onChange={e => set('country', e.target.value)}
                  className={inputCls}
                  style={{ ...inputSty, color: data.country ? 'var(--t1)' : 'var(--t3)' }}
                  onFocus={focusBorder} onBlur={blurBorder}>
                  <option value="" disabled>Select your country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </F>
              <F label="Description" req>
                <textarea value={data.description} onChange={e => set('description', e.target.value)}
                  rows={4} placeholder="What will members learn or experience in this community?"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={inputSty}
                  onFocus={focusBorder} onBlur={blurBorder} />
                <p className="text-[10px] mt-1" style={{ color: 'var(--t3)' }}>{data.description.length} / 300</p>
              </F>
            </div>
          )}

          {/* ── Step 2 ─────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Logo */}
              <div>
                <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--t2)' }}>
                  Community Logo <span className="font-normal" style={{ color: 'var(--t3)' }}>(square, shown as circle)</span>
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ border: '2px dashed var(--bd)', background: 'var(--bg)' }}>
                    {data.logo
                      ? <img src={data.logo} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon className="w-6 h-6" style={{ color: 'var(--t3)' }} strokeWidth={1.4} />
                    }
                  </div>
                  <div className="flex gap-2">
                    <button onClick={openLogo}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: 'var(--p2)', color: 'var(--p)', border: '1.5px solid var(--bd)' }}>
                      <Upload className="w-3.5 h-3.5" strokeWidth={2} /> Upload Logo
                    </button>
                    {data.logo && (
                      <button onClick={() => set('logo', '')}
                        className="h-9 px-3 rounded-xl text-[12px] cursor-pointer hover:opacity-70 transition-opacity"
                        style={{ border: '1.5px solid #fca5a5', background: '#fff1f2', color: '#dc2626' }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {logoInput}
              </div>

              {/* Thumbnail */}
              <div>
                <p className="text-[12px] font-semibold mb-1" style={{ color: 'var(--t2)' }}>
                  Thumbnail / Banner <span className="font-normal" style={{ color: 'var(--t3)' }}>(16:9 recommended)</span>
                </p>
                <button onClick={openThumb}
                  className="w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-80 relative"
                  style={{
                    aspectRatio: '16/9',
                    border: data.thumbnail ? 'none' : '2px dashed var(--bd)',
                    background: data.thumbnail ? 'transparent' : 'var(--bg)',
                  }}>
                  {data.thumbnail
                    ? <img src={data.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    : <>
                        <Upload className="w-5 h-5" style={{ color: 'var(--t3)' }} strokeWidth={1.5} />
                        <p className="text-[11px]" style={{ color: 'var(--t3)' }}>Click to upload banner image</p>
                      </>
                  }
                </button>
                {data.thumbnail && (
                  <button onClick={() => set('thumbnail', '')}
                    className="mt-1.5 text-[11px] cursor-pointer hover:opacity-70 transition-opacity"
                    style={{ color: '#dc2626' }}>Remove</button>
                )}
                {thumbInput}
              </div>
            </div>
          )}

          {/* ── Step 3 ─────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Free / Paid */}
              <div>
                <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--t2)' }}>Access Type</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    {
                      v: 'free' as const,
                      label: 'Free',
                      sub: 'Anyone can join at no cost',
                      Icon: Unlock,
                    },
                    {
                      v: 'paid' as const,
                      label: 'Paid',
                      sub: 'Members pay to access your community',
                      Icon: CreditCard,
                    },
                  ]).map(opt => {
                    const active = data.pricingType === opt.v
                    return (
                      <button key={opt.v} onClick={() => set('pricingType', opt.v)}
                        className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer text-left transition-all hover:opacity-90"
                        style={{
                          border: `1.5px solid ${active ? 'var(--p)' : 'var(--bd)'}`,
                          background: active ? 'var(--p2)' : 'var(--white)',
                        }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: active ? 'var(--p)' : 'var(--bg)', border: active ? 'none' : '1.5px solid var(--bd)' }}>
                          <opt.Icon className="w-4 h-4" strokeWidth={1.8}
                            style={{ color: active ? '#fff' : 'var(--t3)' }} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold" style={{ color: active ? 'var(--p)' : 'var(--t1)' }}>{opt.label}</p>
                          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--t3)' }}>{opt.sub}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Billing period + price — paid only */}
              {data.pricingType === 'paid' && (
                <>
                  <div>
                    <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--t2)' }}>Billing Period</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {([
                        { v: 'one_time' as const, label: 'One-Time',  sub: 'Pay once',           Icon: Receipt     },
                        { v: 'monthly'  as const, label: 'Monthly',   sub: 'Every month',        Icon: Repeat      },
                        { v: 'yearly'   as const, label: 'Yearly',    sub: 'Every year',         Icon: CalendarDays },
                      ]).map(opt => {
                        const active = data.billingPeriod === opt.v
                        return (
                          <button key={opt.v} onClick={() => set('billingPeriod', opt.v)}
                            className="flex flex-col items-center gap-2 py-4 px-3 rounded-2xl cursor-pointer transition-all hover:opacity-90 text-center"
                            style={{
                              border: `1.5px solid ${active ? 'var(--p)' : 'var(--bd)'}`,
                              background: active ? 'var(--p2)' : 'var(--white)',
                            }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{ background: active ? 'var(--p)' : 'var(--bg)', border: active ? 'none' : '1.5px solid var(--bd)' }}>
                              <opt.Icon className="w-4 h-4" strokeWidth={1.8}
                                style={{ color: active ? '#fff' : 'var(--t3)' }} />
                            </div>
                            <div>
                              <p className="text-[12px] font-bold" style={{ color: active ? 'var(--p)' : 'var(--t1)' }}>{opt.label}</p>
                              <p className="text-[10px]" style={{ color: 'var(--t3)' }}>{opt.sub}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <F label={`Price (TND${data.billingPeriod === 'monthly' ? ' / month' : data.billingPeriod === 'yearly' ? ' / year' : ''})`} req>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold select-none" style={{ color: 'var(--t3)' }}>TND</span>
                      <input type="number" min="0" value={data.price} onChange={e => set('price', e.target.value)}
                        placeholder="0.00"
                        className={inputCls + ' pl-12'} style={inputSty}
                        onFocus={focusBorder} onBlur={blurBorder} />
                    </div>
                  </F>
                </>
              )}
            </div>
          )}

          {/* ── Step 4 ─────────────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-3">
              {SOCIALS.map(s => {
                const val = data[s.key as keyof CommunityForm] as string
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: s.color + '12', border: `1.5px solid ${s.color}30` }}>
                      <s.Icon className="w-4 h-4" strokeWidth={1.8} style={{ color: s.color }} />
                    </div>
                    <input value={val} onChange={e => set(s.key as keyof CommunityForm, e.target.value)}
                      placeholder={`Your ${s.label} URL`}
                      className={inputCls + ' flex-1'} style={inputSty}
                      onFocus={e => (e.target.style.borderColor = s.color)}
                      onBlur={blurBorder} />
                    {val && (
                      <button onClick={() => set(s.key as keyof CommunityForm, '')}
                        className="cursor-pointer hover:opacity-60 transition-opacity" style={{ color: 'var(--t3)' }}>
                        <X className="w-4 h-4" strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                )
              })}
              {/* TikTok row */}
              {(() => {
                const val = data.tiktok
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: '#00000012', border: '1.5px solid #00000020' }}>
                      <TikTokIcon size={16} color="#000" />
                    </div>
                    <input value={val} onChange={e => set('tiktok', e.target.value)}
                      placeholder="Your TikTok URL"
                      className={inputCls + ' flex-1'} style={inputSty}
                      onFocus={e => (e.target.style.borderColor = '#000')}
                      onBlur={blurBorder} />
                    {val && (
                      <button onClick={() => set('tiktok', '')}
                        className="cursor-pointer hover:opacity-60 transition-opacity" style={{ color: 'var(--t3)' }}>
                        <X className="w-4 h-4" strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* ── Nav buttons ──────────────────────────────────────────────────── */}
        <div className="px-10 py-6 shrink-0 flex items-center justify-between" style={{ borderTop: '1px solid var(--bd)' }}>
          <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
            className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ border: '1.5px solid var(--bd)', background: 'var(--white)', color: 'var(--t2)' }}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Back
          </button>
          <button onClick={handleNext} disabled={!canNext() || submitting}
            className="flex items-center gap-2 h-10 px-7 rounded-xl text-[13px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--p)', boxShadow: '0 4px 18px rgba(124,58,237,.3)' }}>
            {submitting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : step === 4
                ? <><Check className="w-4 h-4" strokeWidth={2.5} /> Create Community</>
                : <>Continue <ArrowRight className="w-4 h-4" strokeWidth={2} /></>
            }
          </button>
        </div>
      </div>

      {/* ── RIGHT — image panel ───────────────────────────────────────────────── */}
      <div className="w-1/2 h-full relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e0a3c 0%, #3b1a6b 40%, #6d28d9 75%, #7c3aed 100%)' }}>

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }} />
        <div className="absolute top-1/2 right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fb923c, transparent 70%)' }} />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(var(--white) 1px, transparent 1px), linear-gradient(90deg, var(--white) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          {/* Logo preview */}
          <div className="w-24 h-24 rounded-3xl mb-6 flex items-center justify-center overflow-hidden"
            style={{
              background: data.logo ? 'transparent' : 'rgba(255,255,255,.1)',
              border: '2px solid rgba(255,255,255,.2)',
              boxShadow: '0 16px 48px rgba(0,0,0,.3)',
            }}>
            {data.logo
              ? <img src={data.logo} alt="" className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center gap-1.5">
                  <div className="text-[22px] font-black text-white/80">
                    {data.name ? data.name.slice(0, 2).toUpperCase() : 'Ch'}
                  </div>
                </div>
            }
          </div>

          {/* Community name */}
          <h2 className="text-[22px] font-black text-white mb-1 tracking-tight">
            {data.name || 'Your Community'}
          </h2>
          {data.country && (
            <p className="text-[13px] text-white/60 mb-4">{data.country}</p>
          )}

          {/* Description preview */}
          {data.description && (
            <p className="text-[13px] text-white/50 leading-relaxed max-w-[320px] line-clamp-3 mb-6">
              {data.description}
            </p>
          )}

          {/* Pricing badge */}
          {(step >= 3 || data.pricingType) && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full mb-4"
              style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)' }}>
              {data.pricingType === 'free'
                ? <><Unlock className="w-3.5 h-3.5 text-white/70" strokeWidth={1.8} /><span className="text-[12px] font-semibold text-white/80">Free Community</span></>
                : <><CreditCard className="w-3.5 h-3.5 text-white/70" strokeWidth={1.8} /><span className="text-[12px] font-semibold text-white/80">{data.price ? `TND ${data.price}` : 'Paid'} · {data.billingPeriod === 'one_time' ? 'One-Time' : data.billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}</span></>
              }
            </div>
          )}

          {/* Thumbnail preview */}
          {data.thumbnail && (
            <div className="w-full max-w-[280px] rounded-2xl overflow-hidden mt-2"
              style={{ aspectRatio: '16/9', boxShadow: '0 12px 40px rgba(0,0,0,.4)' }}>
              <img src={data.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Bottom step label */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex gap-2">
            {STEPS.map(s => (
              <div key={s.id}
                className="rounded-full transition-all duration-300"
                style={{
                  width: step === s.id ? 24 : 6,
                  height: 6,
                  background: step === s.id ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)',
                }} />
            ))}
          </div>
        </div>
      </div>

      {/* Celebration */}
      {celebrate && <CelebrationPopup name={data.name} onOk={() => router.push('/creator')} />}
    </div>
  )
}
