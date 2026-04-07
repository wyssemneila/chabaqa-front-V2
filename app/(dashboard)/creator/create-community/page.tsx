'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, Check, X, Upload, Sparkles,
  FileText, Palette, Tag, AtSign,
  Unlock, CreditCard, Repeat, CalendarDays, Receipt,
  Instagram, Facebook, Youtube, Twitter, Linkedin,
  Link as LinkIcon, Globe, Image as ImageIcon,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingPeriod = 'one_time' | 'monthly' | 'yearly'
interface CForm {
  name: string; country: string; description: string
  logo: string; thumbnail: string
  pricingType: 'free' | 'paid'; billingPeriod: BillingPeriod; price: string
  instagram: string; facebook: string; youtube: string
  tiktok: string; twitter: string; linkedin: string; website: string
}

const INIT: CForm = {
  name:'', country:'', description:'', logo:'', thumbnail:'',
  pricingType:'free', billingPeriod:'monthly', price:'',
  instagram:'', facebook:'', youtube:'', tiktok:'', twitter:'', linkedin:'', website:'',
}

const COUNTRIES = [
  'Algeria','Bahrain','Egypt','Iraq','Jordan','Kuwait','Lebanon','Libya',
  'Mauritania','Morocco','Oman','Palestine','Qatar','Saudi Arabia','Sudan',
  'Syria','Tunisia','UAE','Yemen',
  'France','Germany','Italy','Spain','United Kingdom','United States',
  'Canada','Australia','Netherlands','Belgium','Switzerland','Turkey','Other',
]

const SOCIALS = [
  { key:'instagram', label:'Instagram',   color:'#E1306C', Icon:Instagram },
  { key:'facebook',  label:'Facebook',    color:'#1877F2', Icon:Facebook  },
  { key:'youtube',   label:'YouTube',     color:'#FF0000', Icon:Youtube   },
  { key:'twitter',   label:'X (Twitter)', color:'#000000', Icon:Twitter   },
  { key:'linkedin',  label:'LinkedIn',    color:'#0A66C2', Icon:Linkedin  },
  { key:'website',   label:'Website',     color:'#7c3aed', Icon:LinkIcon  },
]

function TikTokIcon({ size=16, color='currentColor' }: { size?:number; color?:string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
    </svg>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id:1, label:'Basic Info',   Icon:FileText  },
  { id:2, label:'Branding',     Icon:Palette   },
  { id:3, label:'Pricing',      Icon:Tag       },
  { id:4, label:'Social Links', Icon:AtSign    },
]

// ─── Image picker hook ────────────────────────────────────────────────────────

function useFilePick(cb: (url:string)=>void) {
  const ref = useRef<HTMLInputElement>(null)
  return {
    open: () => ref.current?.click(),
    node: <input ref={ref} type="file" accept="image/*" className="hidden"
      onChange={e => {
        const f = e.target.files?.[0]; if (!f) return
        const r = new FileReader(); r.onload = ev => cb(ev.target?.result as string); r.readAsDataURL(f)
        e.target.value=''
      }} />,
  }
}

// ─── Celebration popup ────────────────────────────────────────────────────────

function CelebrationPopup({ name, onOk }: { name:string; onOk:()=>void }) {
  useEffect(() => {
    let iv: ReturnType<typeof setInterval>
    ;(async () => {
      const confetti = (await import('canvas-confetti')).default
      const colors = ['#8e78fb','#fb923c','#22d3ee','#f472b6','#a78bfa','#fff','#fbbf24']
      const def = { startVelocity:30, spread:360, ticks:80, zIndex:9999, colors }
      const rand = (a:number,b:number) => Math.random()*(b-a)+a
      const end = Date.now()+4000
      iv = window.setInterval(()=>{
        const t=end-Date.now(); if(t<=0) return clearInterval(iv)
        const n=60*(t/4000)
        confetti({...def,particleCount:n,origin:{x:rand(.1,.3),y:Math.random()-.2}})
        confetti({...def,particleCount:n,origin:{x:rand(.7,.9),y:Math.random()-.2}})
      },250)
    })()
    return ()=>clearInterval(iv)
  },[])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)'}}>
      <style>{`
        @keyframes cPop  {0%{transform:scale(.3);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        @keyframes cFade {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cRing {0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,.5)}60%{box-shadow:0 0 0 22px rgba(124,58,237,0)}}
      `}</style>
      <div className="w-full max-w-[360px] rounded-3xl overflow-hidden text-center"
        style={{background:'var(--white)',boxShadow:'0 40px 100px rgba(0,0,0,.3)'}}>
        <div className="h-1.5" style={{background:'linear-gradient(90deg,var(--p),#22d3ee,#fb923c)'}}/>
        <div className="px-7 py-8">
          <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{background:'var(--p)',animation:'cPop .55s cubic-bezier(.34,1.56,.64,1) both, cRing 2s 1s infinite'}}>
            <Check className="w-10 h-10 text-white" strokeWidth={3}/>
          </div>
          <div style={{animation:'cFade .4s .2s ease both'}}>
            <p className="text-[11px] font-bold tracking-[.12em] uppercase mb-1" style={{color:'var(--p)'}}>Community Created</p>
            <h2 className="text-[22px] font-bold mb-1" style={{color:'var(--t1)'}}>Congratulations! 🎉</h2>
            <p className="text-[13px]" style={{color:'var(--t3)'}}>
              <span className="font-semibold" style={{color:'var(--p)'}}>&ldquo;{name || 'Your Community'}&rdquo;</span> is now live
            </p>
          </div>
          <div className="mt-5 mb-6 px-4 py-3.5 rounded-2xl text-left"
            style={{background:'var(--p2)',border:'1px solid var(--bd)',animation:'cFade .4s .38s ease both'}}>
            <div className="flex gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{color:'var(--p)'}} strokeWidth={1.8}/>
              <p className="text-[12px] leading-relaxed" style={{color:'var(--t1)'}}>
                You can now <strong>create content</strong> and turn your expertise into a business —
                publish courses, run live sessions, launch challenges, and grow your community.
              </p>
            </div>
          </div>
          <button onClick={onOk}
            className="w-full h-11 rounded-2xl text-[14px] font-bold text-white cursor-pointer transition-opacity hover:opacity-90"
            style={{background:'var(--p)',boxShadow:'0 8px 24px rgba(124,58,237,.35)',animation:'cFade .4s .52s ease both'}}>
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function F({label,req,children}:{label:string;req?:boolean;children:React.ReactNode}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1.5" style={{color:'var(--t2)'}}>
        {label}{req && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const iCls = "w-full h-10 px-3 rounded-xl text-[13px] outline-none"
const iSty: React.CSSProperties = {border:'1.5px solid var(--bd)',background:'var(--white)',color:'var(--t1)'}
const onFocus = (e:React.FocusEvent<any>) => (e.target.style.borderColor='var(--p)')
const onBlur  = (e:React.FocusEvent<any>) => (e.target.style.borderColor='var(--bd)')

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreateCommunityPage() {
  const router = useRouter()
  const [step,       setStep]       = useState(1)
  const [dir,        setDir]        = useState<1|-1>(1)   // animation direction
  const [animKey,    setAnimKey]    = useState(0)         // triggers re-mount for animation
  const [submitting, setSubmitting] = useState(false)
  const [celebrate,  setCelebrate]  = useState(false)
  const [data,       setData]       = useState<CForm>(INIT)
  const set = (k:keyof CForm, v:string) => setData(p=>({...p,[k]:v}))

  // right panel image
  const [panelImg, setPanelImg] = useState('')
  const { open: openPanel, node: panelNode } = useFilePick(setPanelImg)

  // branding pickers
  const { open: openLogo,  node: logoNode  } = useFilePick(v=>set('logo',v))
  const { open: openThumb, node: thumbNode } = useFilePick(v=>set('thumbnail',v))

  const canNext = () => {
    if (step===1) return !!(data.name.trim() && data.country && data.description.trim())
    if (step===3) return data.pricingType==='free' || (!!data.price && parseFloat(data.price)>0)
    return true
  }

  const go = (next:number) => {
    setDir(next>step ? 1 : -1)
    setStep(next)
    setAnimKey(k=>k+1)
  }

  const handleNext = () => {
    if (step<4) { go(step+1); return }
    setSubmitting(true)
    setTimeout(()=>{ setSubmitting(false); setCelebrate(true) }, 1100)
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'var(--bg)'}}>
      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform:translateX(calc(var(--dir)*28px)); }
          to   { opacity:1; transform:translateX(0); }
        }
        .step-slide { animation: slideIn 220ms cubic-bezier(.25,.46,.45,.94) both; }
      `}</style>

      {/* ── LEFT — form ──────────────────────────────────────────────────── */}
      <div className="w-1/2 flex flex-col h-full" style={{background:'var(--white)',borderRight:'1px solid var(--bd)'}}>

        {/* Top nav */}
        <div className="px-10 pt-7 shrink-0">
          <button onClick={()=>router.back()}
            className="flex items-center gap-1.5 text-[12px] cursor-pointer hover:opacity-60 transition-opacity mb-7"
            style={{color:'var(--t3)'}}>
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2}/> Back to dashboard
          </button>

          {/* Step bar */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s,i)=>{
              const done   = step>s.id
              const active = step===s.id
              return (
                <div key={s.id} className="flex items-center">
                  {i>0 && (
                    <div className="h-px w-8 transition-all duration-400"
                      style={{background: done ? 'var(--p)' : 'var(--bd)'}}/>
                  )}
                  <button onClick={()=>{ if(done) go(s.id) }}
                    disabled={!done && !active}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer disabled:cursor-default"
                    style={{
                      background: active ? 'var(--p2)' : 'transparent',
                      border: active ? '1.5px solid var(--p3)' : '1.5px solid transparent',
                    }}>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                      style={{
                        background: done||active ? 'var(--p)' : 'var(--bg)',
                        border: done||active ? 'none' : '1.5px solid var(--bd)',
                      }}>
                      {done
                        ? <Check className="w-3 h-3 text-white" strokeWidth={3}/>
                        : <s.Icon className="w-3 h-3" strokeWidth={1.8}
                            style={{color: active ? '#fff' : 'var(--t3)'}}/>
                      }
                    </div>
                    <span className="text-[11px] font-semibold hidden sm:block"
                      style={{color: active ? 'var(--p)' : done ? 'var(--t2)' : 'var(--t3)'}}>
                      {s.label}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Heading */}
          <div key={`h-${step}`} className="step-slide mb-6" style={{'--dir':dir} as React.CSSProperties}>
            <p className="text-[11px] font-bold tracking-[.1em] uppercase mb-1" style={{color:'var(--p)'}}>
              Step {step} of {STEPS.length}
            </p>
            <h1 className="text-[24px] font-bold leading-tight" style={{color:'var(--t1)'}}>
              {step===1 && 'Basic Information'}
              {step===2 && 'Branding'}
              {step===3 && 'Pricing'}
              {step===4 && 'Social Links'}
            </h1>
            <p className="text-[13px] mt-1" style={{color:'var(--t3)'}}>
              {step===1 && 'Tell people what your community is about.'}
              {step===2 && 'Logo and banner make your community recognizable.'}
              {step===3 && 'Choose how members will access your community.'}
              {step===4 && 'Connect your social media. All optional.'}
            </p>
          </div>
        </div>

        {/* Form content — animated */}
        <div key={`f-${animKey}`} className="step-slide flex-1 overflow-y-auto px-10 pb-4"
          style={{'--dir':dir} as React.CSSProperties}>

          {/* Step 1 */}
          {step===1 && (
            <div className="space-y-4">
              <F label="Community Name" req>
                <input value={data.name} onChange={e=>set('name',e.target.value)}
                  placeholder="e.g. Motion Masters" className={iCls} style={iSty}
                  onFocus={onFocus} onBlur={onBlur}/>
              </F>
              <F label="Country" req>
                <select value={data.country} onChange={e=>set('country',e.target.value)}
                  className={iCls} style={{...iSty,color:data.country?'var(--t1)':'var(--t3)'}}
                  onFocus={onFocus} onBlur={onBlur}>
                  <option value="" disabled>Select your country</option>
                  {COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </F>
              <F label="Description" req>
                <textarea value={data.description} onChange={e=>set('description',e.target.value)}
                  rows={4} placeholder="What will members learn or experience in this community?"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none resize-none"
                  style={iSty} onFocus={onFocus} onBlur={onBlur}/>
                <p className="text-[11px] mt-1" style={{color:'var(--t3)'}}>{data.description.length}/300</p>
              </F>
            </div>
          )}

          {/* Step 2 */}
          {step===2 && (
            <div className="space-y-6">
              {/* Logo */}
              <div>
                <p className="text-[12px] font-semibold mb-1" style={{color:'var(--t2)'}}>
                  Community Logo <span className="font-normal" style={{color:'var(--t3)'}}>(shown as circle)</span>
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                    style={{border:'2px dashed var(--bd)',background:'var(--bg)'}}>
                    {data.logo
                      ? <img src={data.logo} alt="Community logo preview" loading="lazy" className="w-full h-full object-cover"/>
                      : <ImageIcon className="w-6 h-6" style={{color:'var(--t3)'}} strokeWidth={1.4}/>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={openLogo}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-80"
                      style={{background:'var(--p2)',color:'var(--p)',border:'1.5px solid var(--bd)'}}>
                      <Upload className="w-3.5 h-3.5" strokeWidth={2}/> Upload Logo
                    </button>
                    {data.logo && (
                      <button onClick={()=>set('logo','')}
                        className="h-9 px-3 rounded-xl text-[12px] cursor-pointer hover:opacity-70 transition-opacity"
                        style={{border:'1.5px solid #fca5a5',background:'#fff1f2',color:'#dc2626'}}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {logoNode}
              </div>
              {/* Thumbnail */}
              <div>
                <p className="text-[12px] font-semibold mb-1" style={{color:'var(--t2)'}}>
                  Thumbnail / Banner <span className="font-normal" style={{color:'var(--t3)'}}>(16:9)</span>
                </p>
                <button onClick={openThumb}
                  className="w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-80 relative mt-2"
                  style={{
                    aspectRatio:'16/9',
                    border: data.thumbnail ? 'none' : '2px dashed var(--bd)',
                    background: data.thumbnail ? 'transparent' : 'var(--bg)',
                  }}>
                  {data.thumbnail
                    ? <img src={data.thumbnail} alt="Community image preview" loading="lazy" className="absolute inset-0 w-full h-full object-cover"/>
                    : <><Upload className="w-5 h-5" style={{color:'var(--t3)'}} strokeWidth={1.5}/>
                        <p className="text-[11px]" style={{color:'var(--t3)'}}>Click to upload banner</p></>
                  }
                </button>
                {data.thumbnail && (
                  <button onClick={()=>set('thumbnail','')} className="mt-1.5 text-[11px] cursor-pointer hover:opacity-70 transition-opacity" style={{color:'#dc2626'}}>Remove</button>
                )}
                {thumbNode}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step===3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {([
                  {v:'free' as const, label:'Free',  sub:'Anyone can join at no cost',              Icon:Unlock     },
                  {v:'paid' as const, label:'Paid',  sub:'Members pay to access your community',    Icon:CreditCard },
                ]).map(opt=>{
                  const active=data.pricingType===opt.v
                  return (
                    <button key={opt.v} onClick={()=>set('pricingType',opt.v)}
                      className="flex items-start gap-3 p-4 rounded-2xl cursor-pointer text-left transition-all"
                      style={{border:`1.5px solid ${active?'var(--p)':'var(--bd)'}`,background:active?'var(--p2)':'var(--white)'}}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{background:active?'var(--p)':'var(--bg)',border:active?'none':'1.5px solid var(--bd)'}}>
                        <opt.Icon className="w-4 h-4" strokeWidth={1.8} style={{color:active?'#fff':'var(--t3)'}}/>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold" style={{color:active?'var(--p)':'var(--t1)'}}>{opt.label}</p>
                        <p className="text-[11px] mt-0.5 leading-snug" style={{color:'var(--t3)'}}>{opt.sub}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {data.pricingType==='paid' && (
                <>
                  <div>
                    <p className="text-[12px] font-semibold mb-2.5" style={{color:'var(--t2)'}}>Billing Period</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        {v:'one_time' as const, label:'One-Time', sub:'Pay once',      Icon:Receipt     },
                        {v:'monthly'  as const, label:'Monthly',  sub:'Every month',   Icon:Repeat      },
                        {v:'yearly'   as const, label:'Yearly',   sub:'Every year',    Icon:CalendarDays},
                      ]).map(opt=>{
                        const active=data.billingPeriod===opt.v
                        return (
                          <button key={opt.v} onClick={()=>set('billingPeriod',opt.v)}
                            className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl cursor-pointer transition-all text-center"
                            style={{border:`1.5px solid ${active?'var(--p)':'var(--bd)'}`,background:active?'var(--p2)':'var(--white)'}}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                              style={{background:active?'var(--p)':'var(--bg)',border:active?'none':'1.5px solid var(--bd)'}}>
                              <opt.Icon className="w-4 h-4" strokeWidth={1.8} style={{color:active?'#fff':'var(--t3)'}}/>
                            </div>
                            <div>
                              <p className="text-[12px] font-bold" style={{color:active?'var(--p)':'var(--t1)'}}>{opt.label}</p>
                              <p className="text-[11px]" style={{color:'var(--t3)'}}>{opt.sub}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <F label={`Price (TND${data.billingPeriod==='monthly'?' / month':data.billingPeriod==='yearly'?' / year':''})`} req>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold select-none" style={{color:'var(--t3)'}}>TND</span>
                      <input type="number" min="0" value={data.price} onChange={e=>set('price',e.target.value)}
                        placeholder="0.00" className={iCls+' pl-12'} style={iSty}
                        onFocus={onFocus} onBlur={onBlur}/>
                    </div>
                  </F>
                </>
              )}
            </div>
          )}

          {/* Step 4 */}
          {step===4 && (
            <div className="space-y-3">
              {SOCIALS.map(s=>{
                const val=data[s.key as keyof CForm] as string
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{background:s.color+'12',border:`1.5px solid ${s.color}25`}}>
                      <s.Icon className="w-4 h-4" strokeWidth={1.8} style={{color:s.color}}/>
                    </div>
                    <input value={val} onChange={e=>set(s.key as keyof CForm,e.target.value)}
                      placeholder={`Your ${s.label} URL`}
                      className={iCls+' flex-1'} style={iSty}
                      onFocus={e=>(e.target.style.borderColor=s.color)} onBlur={onBlur}/>
                    {val && <button onClick={()=>set(s.key as keyof CForm,'')} className="cursor-pointer hover:opacity-60 transition-opacity" style={{color:'var(--t3)'}}><X className="w-4 h-4" strokeWidth={1.8}/></button>}
                  </div>
                )
              })}
              {/* TikTok */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{background:'#00000010',border:'1.5px solid #00000018'}}>
                  <TikTokIcon size={16} color="#000"/>
                </div>
                <input value={data.tiktok} onChange={e=>set('tiktok',e.target.value)}
                  placeholder="Your TikTok URL"
                  className={iCls+' flex-1'} style={iSty}
                  onFocus={e=>(e.target.style.borderColor='#000')} onBlur={onBlur}/>
                {data.tiktok && <button onClick={()=>set('tiktok','')} className="cursor-pointer hover:opacity-60 transition-opacity" style={{color:'var(--t3)'}}><X className="w-4 h-4" strokeWidth={1.8}/></button>}
              </div>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div className="px-10 py-5 shrink-0 flex items-center justify-between" style={{borderTop:'1px solid var(--bd)'}}>
          <button onClick={()=>go(step-1)} disabled={step===1}
            className="flex items-center gap-1.5 h-10 px-5 rounded-xl text-[13px] font-semibold cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{border:'1.5px solid var(--bd)',background:'var(--white)',color:'var(--t2)'}}>
            <ArrowLeft className="w-4 h-4" strokeWidth={2}/> Back
          </button>
          <button onClick={handleNext} disabled={!canNext()||submitting}
            className="flex items-center gap-2 h-10 px-7 rounded-xl text-[13px] font-bold text-white cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{background:'var(--p)',boxShadow:'0 4px 16px rgba(124,58,237,.3)'}}>
            {submitting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              : step===4
                ? <><Check className="w-4 h-4" strokeWidth={2.5}/> Create Community</>
                : <>Continue <ArrowRight className="w-4 h-4" strokeWidth={2}/></>
            }
          </button>
        </div>
      </div>

      {/* ── RIGHT — image panel ───────────────────────────────────────────── */}
      <div className="w-1/2 h-full relative overflow-hidden flex flex-col items-center justify-center"
        style={{background:'var(--bg)'}}>
        {panelImg
          ? <>
              <img src={panelImg} alt="Community image preview" loading="lazy" className="absolute inset-0 w-full h-full object-cover"/>
              {/* Change image button */}
              <button onClick={openPanel}
                className="absolute bottom-6 right-6 flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-semibold cursor-pointer transition-opacity hover:opacity-80 z-10"
                style={{background:'rgba(0,0,0,.55)',color:'#fff',backdropFilter:'blur(6px)'}}>
                <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.8}/> Change Image
              </button>
            </>
          : /* placeholder */
            <div className="flex flex-col items-center gap-4 text-center px-10">
              <button onClick={openPanel}
                className="w-24 h-24 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-80"
                style={{border:'2px dashed var(--bd)',background:'var(--white)'}}>
                <Upload className="w-7 h-7" style={{color:'var(--p)'}} strokeWidth={1.5}/>
              </button>
              <div>
                <button onClick={openPanel}
                  className="text-[14px] font-bold cursor-pointer hover:opacity-70 transition-opacity"
                  style={{color:'var(--p)'}}>
                  Upload your image
                </button>
                <p className="text-[12px] mt-1" style={{color:'var(--t3)'}}>
                  Add a photo that represents your community — it will fill this entire panel.
                </p>
                <p className="text-[11px] mt-1.5" style={{color:'var(--t3)'}}>
                  JPG, PNG · Recommended 1080×1920
                </p>
              </div>
            </div>
        }
        {panelNode}
      </div>

      {celebrate && <CelebrationPopup name={data.name} onOk={()=>router.push('/creator')}/>}
    </div>
  )
}
