'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import {
  ArrowLeft, ArrowRight, Check, Image as ImageIcon,
  Globe, DollarSign, Share2, Sparkles, Upload, X,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingPeriod = 'one_time' | 'monthly' | 'yearly'

interface FormData {
  name: string
  country: string
  description: string
  logo: string        // data URL
  thumbnail: string   // data URL
  pricingType: 'free' | 'paid'
  billingPeriod: BillingPeriod
  price: string
  instagram: string
  facebook: string
  youtube: string
  tiktok: string
  twitter: string
  linkedin: string
  website: string
}

// ─── Steps config ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Basic Info',    icon: <Globe     className="w-3.5 h-3.5" strokeWidth={1.8} /> },
  { id: 2, label: 'Branding',      icon: <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.8} /> },
  { id: 3, label: 'Pricing',       icon: <DollarSign className="w-3.5 h-3.5" strokeWidth={1.8} /> },
  { id: 4, label: 'Social Links',  icon: <Share2    className="w-3.5 h-3.5" strokeWidth={1.8} /> },
]

// ─── Countries ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  'Algeria','Bahrain','Egypt','Iraq','Jordan','Kuwait','Lebanon','Libya',
  'Mauritania','Morocco','Oman','Palestine','Qatar','Saudi Arabia','Sudan',
  'Syria','Tunisia','UAE','Yemen',
  'France','Germany','Italy','Spain','United Kingdom','United States',
  'Canada','Australia','Netherlands','Belgium','Switzerland','Turkey',
  'Other',
]

// ─── Image upload helper ──────────────────────────────────────────────────────

function ImgUpload({ label, hint, aspect, value, onChange }: {
  label: string; hint: string; aspect: string; value: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const pick = () => ref.current?.click()
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => onChange(ev.target?.result as string)
    r.readAsDataURL(f)
    e.target.value = ''
  }

  return (
    <div>
      <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--t2)' }}>{label}</p>
      <button type="button" onClick={pick}
        className="w-full flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all hover:opacity-80 overflow-hidden relative"
        style={{
          aspectRatio: aspect,
          border: value ? 'none' : '2px dashed var(--bd)',
          background: value ? 'transparent' : 'var(--bg)',
        }}>
        {value
          ? <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
          : <>
              <Upload className="w-5 h-5" style={{ color: 'var(--t3)' }} strokeWidth={1.5} />
              <p className="text-[11px]" style={{ color: 'var(--t3)' }}>{hint}</p>
            </>
        }
      </button>
      {value && (
        <button type="button" onClick={() => onChange('')}
          className="mt-1.5 text-[11px] cursor-pointer hover:opacity-70 transition-opacity"
          style={{ color: '#dc2626' }}>
          Remove
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  )
}

// ─── Social brand icons ───────────────────────────────────────────────────────

function SocialIcon({ name, color }: { name: string; color: string }) {
  const paths: Record<string, React.ReactNode> = {
    instagram: <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>,
    facebook: <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
    youtube:  <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
    tiktok:   <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.74a4.85 4.85 0 0 1-1-.05z"/></svg>,
    twitter:  <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    linkedin: <svg width="16" height="16" viewBox="0 0 24 24" fill={color}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    website:  null,
  }
  return <>{paths[name] ?? null}</>
}

const SOCIALS = [
  { key: 'instagram', label: 'Instagram',  color: '#E1306C', placeholder: 'https://instagram.com/yourcommunity' },
  { key: 'facebook',  label: 'Facebook',   color: '#1877F2', placeholder: 'https://facebook.com/yourcommunity' },
  { key: 'youtube',   label: 'YouTube',    color: '#FF0000', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok',    label: 'TikTok',     color: '#000000', placeholder: 'https://tiktok.com/@yourcommunity' },
  { key: 'twitter',   label: 'X (Twitter)',color: '#000000', placeholder: 'https://x.com/yourcommunity' },
  { key: 'linkedin',  label: 'LinkedIn',   color: '#0A66C2', placeholder: 'https://linkedin.com/company/your-community' },
  { key: 'website',   label: 'Website',    color: '#7c3aed', placeholder: 'https://yourwebsite.com' },
]

// ─── Celebration popup ────────────────────────────────────────────────────────

function CelebrationScreen({ communityName, onOk }: { communityName: string; onOk: () => void }) {
  useEffect(() => {
    const colors = ['#8e78fb', '#fb923c', '#22d3ee', '#f472b6', '#a78bfa', '#ffffff', '#fbbf24']
    const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999, colors }
    const rand = (min: number, max: number) => Math.random() * (max - min) + min
    const duration = 4000
    const end = Date.now() + duration
    const iv = window.setInterval(() => {
      const left = end - Date.now()
      if (left <= 0) return clearInterval(iv)
      const n = 60 * (left / duration)
      confetti({ ...defaults, particleCount: n, origin: { x: rand(.1, .3), y: Math.random() - .2 } })
      confetti({ ...defaults, particleCount: n, origin: { x: rand(.7, .9), y: Math.random() - .2 } })
    }, 250)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)' }}>
      <style>{`
        @keyframes popIn  { 0%{transform:scale(.4);opacity:0} 70%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.4)} 50%{box-shadow:0 0 0 18px rgba(124,58,237,0)} }
      `}</style>

      <div className="w-full max-w-[400px] rounded-3xl text-center overflow-hidden"
        style={{ background: 'var(--white)', border: '1px solid var(--bd)', boxShadow: '0 32px 100px rgba(0,0,0,.25)' }}>

        {/* Top gradient strip */}
        <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, var(--p), #22d3ee, #fb923c)' }} />

        <div className="px-8 pt-8 pb-8">
          {/* Animated checkmark */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--p)', animation: 'popIn .55s cubic-bezier(.34,1.56,.64,1) both, pulse 2s 1s infinite' }}>
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>

          {/* Texts */}
          <div style={{ animation: 'fadeUp .5s .25s ease both' }}>
            <p className="text-[11px] font-bold tracking-[.12em] uppercase mb-1" style={{ color: 'var(--p)' }}>
              Community Created
            </p>
            <h2 className="text-[22px] font-bold mb-2" style={{ color: 'var(--t1)' }}>
              Congratulations! 🎉
            </h2>
            <p className="text-[13px] leading-relaxed mb-1" style={{ color: 'var(--t2)' }}>
              <span className="font-semibold" style={{ color: 'var(--p)' }}>"{communityName}"</span> is now live!
            </p>
          </div>

          {/* Message card */}
          <div className="mt-5 mb-6 px-5 py-4 rounded-2xl text-left"
            style={{ background: 'var(--p2)', border: '1px solid var(--bd)', animation: 'fadeUp .5s .45s ease both' }}>
            <div className="flex gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--p)' }} strokeWidth={1.8} />
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--t1)' }}>
                You can now <strong>create content</strong> and turn your expertise into a business —
                publish courses, run live sessions, launch challenges, and grow your community.
              </p>
            </div>
          </div>

          {/* OK button */}
          <button onClick={onOk}
            className="w-full h-11 rounded-2xl text-[14px] font-bold text-white cursor-pointer transition-all hover:opacity-90 active:scale-[.97]"
            style={{ background: 'var(--p)', boxShadow: '0 8px 24px rgba(124,58,237,.35)', animation: 'fadeUp .5s .6s ease both' }}>
            Let's Go →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--t2)' }}>
        {label}{required && <span className="ml-0.5" style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inp = "w-full h-10 px-3 rounded-xl text-[13px] outline-none transition-all"

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateCommunityPage() {
  const router = useRouter()
  const [step,        setStep]        = useState(1)
  const [submitting,  setSubmitting]  = useState(false)
  const [celebrate,   setCelebrate]   = useState(false)
  const [data, setData] = useState<FormData>({
    name: '', country: '', description: '',
    logo: '', thumbnail: '',
    pricingType: 'free', billingPeriod: 'monthly', price: '',
    instagram: '', facebook: '', youtube: '',
    tiktok: '', twitter: '', linkedin: '', website: '',
  })

  const set = (k: keyof FormData, v: string) => setData(p => ({ ...p, [k]: v }))

  // step validation
  const canNext = () => {
    if (step === 1) return !!(data.name.trim() && data.country && data.description.trim())
    if (step === 3) return data.pricingType === 'free' || (!!data.price && parseFloat(data.price) > 0)
    return true
  }

  const handleNext = () => {
    if (step < 4) { setStep(s => s + 1); return }
    // final submit
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); setCelebrate(true) }, 1200)
  }

  const progress = Math.round(((step - 1) / STEPS.length) * 100)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── Left sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-[260px] shrink-0 flex flex-col sticky top-0 h-screen overflow-y-auto"
        style={{ background: 'var(--white)', borderRight: '1px solid var(--bd)' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <p className="text-[10px] font-bold tracking-[.1em] uppercase mb-1" style={{ color: 'var(--t3)' }}>New Community</p>
          <p className="text-[15px] font-bold truncate" style={{ color: data.name ? 'var(--t1)' : 'var(--t3)' }}>
            {data.name || 'Untitled Community'}
          </p>
        </div>

        {/* Logo preview */}
        <div className="px-5 py-4 flex flex-col items-center gap-3" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
            style={{ border: '2px dashed var(--bd)', background: 'var(--bg)' }}>
            {data.logo
              ? <img src={data.logo} alt="" className="w-full h-full object-cover" />
              : <ImageIcon className="w-6 h-6" style={{ color: 'var(--t3)' }} strokeWidth={1.4} />
            }
          </div>
          <div className="w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', border: '2px dashed var(--bd)', background: 'var(--bg)' }}>
            {data.thumbnail
              ? <img src={data.thumbnail} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center">
                  <p className="text-[10px]" style={{ color: 'var(--t3)' }}>Thumbnail</p>
                </div>
            }
          </div>
        </div>

        {/* Progress */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--bd)' }}>
          <div className="flex justify-between text-[10px] font-semibold mb-1.5" style={{ color: 'var(--t3)' }}>
            <span>Progress</span><span style={{ color: 'var(--p)' }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bd)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--p)' }} />
          </div>
        </div>

        {/* Step list */}
        <div className="px-4 py-3 flex-1">
          {STEPS.map(s => {
            const done   = step > s.id
            const active = step === s.id
            return (
              <div key={s.id} className="flex items-center gap-2.5 py-2.5 px-2 rounded-xl mb-0.5"
                style={{ background: active ? 'var(--p2)' : 'transparent' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: active || done ? 'var(--p)' : 'var(--bg)' }}>
                  {done
                    ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                    : <span style={{ color: active ? 'white' : 'var(--t3)' }}>{s.icon}</span>
                  }
                </div>
                <span className="text-[12px]"
                  style={{ color: active ? 'var(--p)' : done ? 'var(--t2)' : 'var(--t3)', fontWeight: active ? 700 : 500 }}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Back to dashboard */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--bd)' }}>
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12px] cursor-pointer hover:opacity-70 transition-opacity"
            style={{ color: 'var(--t3)' }}>
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Back
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col max-w-[620px] mx-auto w-full px-8 py-10">

          {/* Step header */}
          <div className="mb-8">
            <p className="text-[11px] font-bold tracking-[.1em] uppercase mb-1" style={{ color: 'var(--p)' }}>
              Step {step} of {STEPS.length}
            </p>
            <h1 className="text-[24px] font-bold" style={{ color: 'var(--t1)' }}>
              {step === 1 && 'Basic Information'}
              {step === 2 && 'Branding'}
              {step === 3 && 'Pricing'}
              {step === 4 && 'Social Links'}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--t3)' }}>
              {step === 1 && 'Tell people what your community is about.'}
              {step === 2 && 'Add a logo and banner to make your community recognizable.'}
              {step === 3 && 'Choose how members will access your community.'}
              {step === 4 && 'Connect your social media so members can follow you. All optional.'}
            </p>
          </div>

          {/* ── Step 1 — Basic Info ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <Field label="Community Name" required>
                <input value={data.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Motion Masters"
                  className={inp}
                  style={{ border: '1.5px solid var(--bd)', background: 'var(--white)', color: 'var(--t1)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--p)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--bd)')} />
              </Field>

              <Field label="Country" required>
                <select value={data.country} onChange={e => set('country', e.target.value)}
                  className={inp}
                  style={{ border: '1.5px solid var(--bd)', background: 'var(--white)', color: data.country ? 'var(--t1)' : 'var(--t3)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--p)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--bd)')}>
                  <option value="" disabled>Select your country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Description" required>
                <textarea value={data.description} onChange={e => set('description', e.target.value)}
                  rows={4} placeholder="What will members learn or experience in this community?"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none transition-all"
                  style={{ border: '1.5px solid var(--bd)', background: 'var(--white)', color: 'var(--t1)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--p)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--bd)')} />
                <p className="text-[11px] mt-1" style={{ color: 'var(--t3)' }}>{data.description.length}/300 characters</p>
              </Field>
            </div>
          )}

          {/* ── Step 2 — Branding ───────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Logo — circular */}
              <div>
                <p className="text-[12px] font-semibold mb-2" style={{ color: 'var(--t2)' }}>Community Logo</p>
                <p className="text-[11px] mb-3" style={{ color: 'var(--t3)' }}>Square image recommended (PNG/JPG). Will appear as a circle.</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    style={{ border: '2px dashed var(--bd)', background: 'var(--bg)' }}>
                    {data.logo
                      ? <img src={data.logo} alt="" className="w-full h-full object-cover" />
                      : <ImageIcon className="w-7 h-7" style={{ color: 'var(--t3)' }} strokeWidth={1.4} />
                    }
                  </div>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: 'var(--p2)', color: 'var(--p)', border: '1.5px solid var(--bd)' }}>
                      <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                      Upload Logo
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0]; if (!f) return
                        const r = new FileReader(); r.onload = ev => set('logo', ev.target?.result as string); r.readAsDataURL(f)
                        e.target.value = ''
                      }} />
                    </label>
                    {data.logo && (
                      <button onClick={() => set('logo', '')}
                        className="h-9 px-3 rounded-xl text-[12px] cursor-pointer hover:opacity-70 transition-opacity"
                        style={{ border: '1.5px solid #fca5a5', background: '#fff1f2', color: '#dc2626' }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnail — 16:9 */}
              <ImgUpload
                label="Community Thumbnail / Banner"
                hint="16:9 ratio recommended — this is your community cover image"
                aspect="16/9"
                value={data.thumbnail}
                onChange={v => set('thumbnail', v)}
              />
            </div>
          )}

          {/* ── Step 3 — Pricing ────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Free vs Paid */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { v: 'free', title: 'Free',   desc: 'Anyone can join at no cost', icon: '🆓' },
                  { v: 'paid', title: 'Paid',   desc: 'Members pay to access your community', icon: '💰' },
                ] as const).map(opt => (
                  <button key={opt.v} onClick={() => set('pricingType', opt.v)}
                    className="flex flex-col items-start gap-2 p-4 rounded-2xl cursor-pointer text-left transition-all hover:opacity-90"
                    style={{
                      border: `2px solid ${data.pricingType === opt.v ? 'var(--p)' : 'var(--bd)'}`,
                      background: data.pricingType === opt.v ? 'var(--p2)' : 'var(--white)',
                    }}>
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="text-[14px] font-bold" style={{ color: data.pricingType === opt.v ? 'var(--p)' : 'var(--t1)' }}>{opt.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--t3)' }}>{opt.desc}</p>
                    </div>
                    {data.pricingType === opt.v && (
                      <Check className="absolute" style={{ display: 'none' }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Billing period — only for paid */}
              {data.pricingType === 'paid' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--t2)' }}>Billing Period</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {([
                        { v: 'one_time', label: 'One-Time',  sub: 'Pay once, access forever' },
                        { v: 'monthly',  label: 'Monthly',   sub: 'Recurring every month' },
                        { v: 'yearly',   label: 'Yearly',    sub: 'Recurring every year' },
                      ] as { v: BillingPeriod; label: string; sub: string }[]).map(opt => (
                        <button key={opt.v} onClick={() => set('billingPeriod', opt.v)}
                          className="flex flex-col gap-1 p-3 rounded-xl cursor-pointer text-left transition-all hover:opacity-90"
                          style={{
                            border: `1.5px solid ${data.billingPeriod === opt.v ? 'var(--p)' : 'var(--bd)'}`,
                            background: data.billingPeriod === opt.v ? 'var(--p2)' : 'var(--bg)',
                          }}>
                          <p className="text-[12px] font-bold" style={{ color: data.billingPeriod === opt.v ? 'var(--p)' : 'var(--t1)' }}>
                            {opt.label}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--t3)' }}>{opt.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Field label={`Price (TND${data.billingPeriod === 'monthly' ? '/month' : data.billingPeriod === 'yearly' ? '/year' : ''})`} required>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-semibold" style={{ color: 'var(--t3)' }}>TND</span>
                      <input type="number" min="0" value={data.price} onChange={e => set('price', e.target.value)}
                        placeholder="0.00"
                        className={inp + ' pl-12'}
                        style={{ border: '1.5px solid var(--bd)', background: 'var(--white)', color: 'var(--t1)' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--p)')}
                        onBlur={e  => (e.target.style.borderColor = 'var(--bd)')} />
                    </div>
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4 — Social Links ────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-3">
              {SOCIALS.map(s => (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: s.color + '15', border: `1px solid ${s.color}30` }}>
                    {s.key === 'website'
                      ? <Globe className="w-4 h-4" style={{ color: s.color }} strokeWidth={1.8} />
                      : <SocialIcon name={s.key} color={s.color} />
                    }
                  </div>
                  <div className="flex-1">
                    <input
                      value={data[s.key as keyof FormData] as string}
                      onChange={e => set(s.key as keyof FormData, e.target.value)}
                      placeholder={s.placeholder}
                      className={inp}
                      style={{ border: '1.5px solid var(--bd)', background: 'var(--white)', color: 'var(--t1)' }}
                      onFocus={e => (e.target.style.borderColor = s.color)}
                      onBlur={e  => (e.target.style.borderColor = 'var(--bd)')} />
                  </div>
                  {(data[s.key as keyof FormData] as string) && (
                    <button onClick={() => set(s.key as keyof FormData, '')}
                      className="cursor-pointer hover:opacity-60 transition-opacity" style={{ color: 'var(--t3)' }}>
                      <X className="w-4 h-4" strokeWidth={1.8} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Navigation ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: '1px solid var(--bd)' }}>
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ border: '1.5px solid var(--bd)', background: 'var(--white)', color: 'var(--t2)' }}>
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canNext() || submitting}
              className="flex items-center gap-1.5 h-10 px-6 rounded-xl text-[13px] font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--p)', boxShadow: '0 4px 16px rgba(124,58,237,.25)' }}>
              {submitting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : step === 4
                  ? <><Check className="w-4 h-4" strokeWidth={2.5} />Create Community</>
                  : <>Continue<ArrowRight className="w-4 h-4" strokeWidth={2} /></>
              }
            </button>
          </div>
        </div>
      </main>

      {/* ── Celebration popup ────────────────────────────────────────────────── */}
      {celebrate && (
        <CelebrationScreen
          communityName={data.name || 'Your Community'}
          onOk={() => router.push('/creator')}
        />
      )}
    </div>
  )
}
