'use client'

import { useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  GripVertical, Eye, EyeOff, ArrowUp, ArrowDown,
  Blocks, Type, Palette, Star, Play, Check, Monitor,
  Tablet, Smartphone, Save, Rocket, Lock, Users, Circle,
  Sparkles, MessageSquare, BookOpen, Calendar, ImageIcon,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   Landing Page Builder — drag & drop, section editing.
   Clean, light, Skool / Nas.io inspired. Purple accent, minimal.
═══════════════════════════════════════════════════════════ */

type Device = 'desktop' | 'tablet' | 'mobile'

type BlockId =
  | 'hero' | 'highlights' | 'about' | 'curriculum'
  | 'creator' | 'testimonials' | 'pricing' | 'faq' | 'cta' | 'footer'

interface BlockDef {
  id: BlockId
  label: { en: string; ar: string }
  desc: { en: string; ar: string }
  Icon: React.ElementType
  tint: string
  visible: boolean
}

const DEFAULT_BLOCKS: BlockDef[] = [
  { id: 'hero',        label: { en: 'Hero',          ar: 'الواجهة' },  desc: { en: 'Title, media & join card', ar: 'العنوان وبطاقة الانضمام' }, Icon: Rocket,        tint: '#8e78fb', visible: true },
  { id: 'highlights',  label: { en: 'Highlights',    ar: 'المميزات' }, desc: { en: 'What members get',         ar: 'ما يحصل عليه الأعضاء' },   Icon: Sparkles,      tint: '#47c7ea', visible: true },
  { id: 'about',       label: { en: 'About',         ar: 'حول' },      desc: { en: 'Describe the community',   ar: 'وصف المجتمع' },           Icon: Type,          tint: '#52c41a', visible: true },
  { id: 'curriculum',  label: { en: "What's Inside", ar: 'المحتوى' },  desc: { en: 'Courses & modules',        ar: 'الدورات والوحدات' },      Icon: BookOpen,      tint: '#6c52f0', visible: true },
  { id: 'creator',     label: { en: 'Creator',       ar: 'المنشئ' },   desc: { en: 'About the host',           ar: 'عن المضيف' },             Icon: Users,         tint: '#ff9b28', visible: true },
  { id: 'testimonials',label: { en: 'Testimonials',  ar: 'الشهادات' }, desc: { en: 'Member reviews',           ar: 'آراء الأعضاء' },          Icon: Star,          tint: '#e89000', visible: true },
  { id: 'pricing',     label: { en: 'Pricing',       ar: 'الأسعار' },  desc: { en: 'Membership options',       ar: 'خيارات العضوية' },        Icon: Blocks,        tint: '#8e78fb', visible: true },
  { id: 'faq',         label: { en: 'FAQ',           ar: 'الأسئلة' },  desc: { en: 'Common questions',         ar: 'الأسئلة الشائعة' },       Icon: MessageSquare, tint: '#f65887', visible: true },
  { id: 'cta',         label: { en: 'Join CTA',      ar: 'دعوة الانضمام' }, desc: { en: 'Final invite',        ar: 'الدعوة الأخيرة' },        Icon: Rocket,        tint: '#8e78fb', visible: true },
  { id: 'footer',      label: { en: 'Footer',        ar: 'التذييل' },  desc: { en: 'Links & branding',         ar: 'الروابط' },               Icon: Blocks,        tint: '#9590b8', visible: true },
]

interface Content {
  name: string
  tagline: string
  url: string
  access: string
  ctaPrimary: string
  price: string
  currency: string
  period: string
  members: string
  online: string
  admins: string
  rating: string
  reviews: string
  lessons: string
  creatorName: string
  creatorRole: string
  creatorBio: string
}

const DEFAULT_CONTENT: Content = {
  name: 'Motion Masters',
  tagline: 'Master motion graphics & animation — from zero to pro, with a community that keeps you moving.',
  url: 'chabaqa.io/motion-masters',
  access: 'Private',
  ctaPrimary: 'Join Community',
  price: '149',
  currency: 'TND',
  period: '/month',
  members: '1,240',
  online: '38',
  admins: '2',
  rating: '4.9',
  reviews: '89',
  lessons: '42',
  creatorName: 'Mohamed Ismail',
  creatorRole: 'Motion Designer & Community Host',
  creatorBio: 'Professional motion designer with 8+ years working with leading brands across MENA. I built this community to help the next generation of motion artists go from zero to portfolio-ready — together.',
}

export default function BrandingPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const [blocks, setBlocks] = useState<BlockDef[]>(DEFAULT_BLOCKS)
  const [tab, setTab] = useState<'blocks' | 'content' | 'design'>('blocks')
  const [content, setContent] = useState<Content>(DEFAULT_CONTENT)
  const [accent, setAccent] = useState('#8e78fb')
  const [device, setDevice] = useState<Device>('desktop')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [openSec, setOpenSec] = useState<number | null>(0)
  const dragIndex = useRef<number | null>(null)

  const set = <K extends keyof Content>(k: K, v: Content[K]) =>
    setContent(c => ({ ...c, [k]: v }))

  const toggleBlock = (id: BlockId) =>
    setBlocks(bs => bs.map(b => (b.id === id ? { ...b, visible: !b.visible } : b)))

  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    setBlocks(bs => { const n = [...bs]; [n[i], n[j]] = [n[j], n[i]]; return n })
  }

  const onDrop = (i: number) => {
    const from = dragIndex.current
    if (from === null || from === i) return
    setBlocks(bs => { const n = [...bs]; const [m] = n.splice(from, 1); n.splice(i, 0, m); return n })
    dragIndex.current = null
  }

  const frameWidth = device === 'mobile' ? 400 : device === 'tablet' ? 760 : 1040

  return (
    <>
      <style>{`
        .bld-scroll::-webkit-scrollbar{width:5px}
        .bld-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:10px}
        .prev-scroll::-webkit-scrollbar{width:6px}
        .prev-scroll::-webkit-scrollbar-thumb{background:#cdd2dc;border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar
            title={t('Branding', 'الهوية')}
            subtitle={t('Design your community landing page', 'صمّم صفحة هبوط مجتمعك')}
          />

          <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

            {/* ══════════ EDITOR PANEL ══════════ */}
            <div className="w-[290px] shrink-0 flex flex-col" style={{ background: '#1a1730' }} dir={isAr ? 'rtl' : 'ltr'}>

              <div className="px-4 py-3.5 flex items-center gap-2.5 shrink-0" style={{ borderBottom: '1px solid #2e2950' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: accent }}>
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white/90">{t('Page Builder', 'محرّر الصفحة')}</p>
                  <p className="text-[10px] text-white/35">{t('Community landing page', 'صفحة هبوط المجتمع')}</p>
                </div>
              </div>

              <div className="flex shrink-0" style={{ borderBottom: '1px solid #2e2950' }}>
                {([
                  { id: 'blocks', label: t('Blocks', 'الأقسام'), Icon: Blocks },
                  { id: 'content', label: t('Content', 'المحتوى'), Icon: Type },
                  { id: 'design', label: t('Design', 'التصميم'), Icon: Palette },
                ] as const).map(x => (
                  <button key={x.id} onClick={() => setTab(x.id)}
                    className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors"
                    style={{ color: tab === x.id ? accent : 'rgba(255,255,255,.4)', borderBottom: `2px solid ${tab === x.id ? accent : 'transparent'}` }}>
                    <x.Icon className="w-3.5 h-3.5" />{x.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto bld-scroll">

                {tab === 'blocks' && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-2.5 px-1">
                      {t('Drag to reorder · click eye to hide', 'اسحب لإعادة الترتيب')}
                    </p>
                    {blocks.map((b, i) => (
                      <div key={b.id} draggable
                        onDragStart={() => { dragIndex.current = i }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => onDrop(i)}
                        className="flex items-center gap-2 p-2 rounded-lg mb-1.5 cursor-grab transition-colors"
                        style={{ background: '#252140', border: '1px solid #2e2950', opacity: b.visible ? 1 : 0.45 }}>
                        <GripVertical className="w-3.5 h-3.5 text-white/25 shrink-0" />
                        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${b.tint}22`, border: `1px solid ${b.tint}44` }}>
                          <b.Icon className="w-3.5 h-3.5" style={{ color: b.tint }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-white/85 truncate">{b.label[lang]}</p>
                          <p className="text-[10px] text-white/35 truncate">{b.desc[lang]}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => toggleBlock(b.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-white/50 hover:text-white/90" style={{ background: '#2e2950' }}>
                            {b.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button onClick={() => moveBlock(i, -1)} className="w-6 h-6 rounded-md flex items-center justify-center text-white/50 hover:text-white/90" style={{ background: '#2e2950' }}><ArrowUp className="w-3 h-3" /></button>
                          <button onClick={() => moveBlock(i, 1)} className="w-6 h-6 rounded-md flex items-center justify-center text-white/50 hover:text-white/90" style={{ background: '#2e2950' }}><ArrowDown className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tab === 'content' && (
                  <div className="pb-6">
                    <EditGroup title={t('Community', 'المجتمع')}>
                      <Field label={t('Name', 'الاسم')} value={content.name} onChange={v => set('name', v)} />
                      <Field label={t('Tagline', 'الوصف المختصر')} value={content.tagline} onChange={v => set('tagline', v)} textarea />
                      <Field label={t('Page URL', 'رابط الصفحة')} value={content.url} onChange={v => set('url', v)} />
                      <div className="grid grid-cols-2 gap-2">
                        <Field label={t('Access', 'الوصول')} value={content.access} onChange={v => set('access', v)} />
                        <Field label={t('Join button', 'زر الانضمام')} value={content.ctaPrimary} onChange={v => set('ctaPrimary', v)} />
                      </div>
                    </EditGroup>

                    <EditGroup title={t('Membership', 'العضوية')}>
                      <div className="grid grid-cols-3 gap-2">
                        <Field label={t('Price', 'السعر')} value={content.price} onChange={v => set('price', v)} />
                        <Field label={t('Currency', 'العملة')} value={content.currency} onChange={v => set('currency', v)} />
                        <Field label={t('Period', 'المدة')} value={content.period} onChange={v => set('period', v)} />
                      </div>
                    </EditGroup>

                    <EditGroup title={t('Stats', 'الأرقام')}>
                      <div className="grid grid-cols-3 gap-2">
                        <Field label={t('Members', 'الأعضاء')} value={content.members} onChange={v => set('members', v)} />
                        <Field label={t('Online', 'متصل')} value={content.online} onChange={v => set('online', v)} />
                        <Field label={t('Admins', 'المشرفون')} value={content.admins} onChange={v => set('admins', v)} />
                        <Field label={t('Rating', 'التقييم')} value={content.rating} onChange={v => set('rating', v)} />
                        <Field label={t('Reviews', 'المراجعات')} value={content.reviews} onChange={v => set('reviews', v)} />
                        <Field label={t('Lessons', 'الدروس')} value={content.lessons} onChange={v => set('lessons', v)} />
                      </div>
                    </EditGroup>

                    <EditGroup title={t('Creator', 'المنشئ')}>
                      <Field label={t('Name', 'الاسم')} value={content.creatorName} onChange={v => set('creatorName', v)} />
                      <Field label={t('Role', 'المسمّى')} value={content.creatorRole} onChange={v => set('creatorRole', v)} />
                      <Field label={t('Bio', 'السيرة')} value={content.creatorBio} onChange={v => set('creatorBio', v)} textarea />
                    </EditGroup>
                  </div>
                )}

                {tab === 'design' && (
                  <div className="pb-6">
                    <EditGroup title={t('Brand color', 'لون العلامة')}>
                      <div className="flex items-center gap-2.5">
                        <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
                        <div>
                          <p className="text-[12px] font-semibold text-white/85">{t('Accent', 'اللون المميّز')}</p>
                          <p className="text-[10px] text-white/35 font-mono">{accent}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-3">
                        {['#8e78fb', '#6c52f0', '#f65887', '#47c7ea', '#ff9b28', '#52c41a'].map(c => (
                          <button key={c} onClick={() => setAccent(c)} className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                            style={{ background: c, outline: accent === c ? '2px solid #fff' : 'none', outlineOffset: 2 }} />
                        ))}
                      </div>
                    </EditGroup>

                    <EditGroup title={t('Preview device', 'جهاز المعاينة')}>
                      <div className="flex gap-1.5">
                        {([
                          { id: 'desktop', Icon: Monitor, label: t('Desktop', 'حاسوب') },
                          { id: 'tablet', Icon: Tablet, label: t('Tablet', 'لوحي') },
                          { id: 'mobile', Icon: Smartphone, label: t('Mobile', 'جوال') },
                        ] as const).map(d => (
                          <button key={d.id} onClick={() => setDevice(d.id)}
                            className="flex-1 py-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors"
                            style={{ background: device === d.id ? `${accent}22` : '#252140', color: device === d.id ? accent : 'rgba(255,255,255,.5)', border: `1px solid ${device === d.id ? accent : '#2e2950'}` }}>
                            <d.Icon className="w-4 h-4" />{d.label}
                          </button>
                        ))}
                      </div>
                    </EditGroup>

                    <div className="px-4 py-3 mx-3 mt-2 rounded-xl" style={{ background: '#252140', border: '1px solid #2e2950' }}>
                      <p className="text-[11px] font-semibold text-white/80 mb-1">💡 {t('Tip', 'نصيحة')}</p>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        {t('Keep it clean. A strong name, a clear tagline, and the join card are all most visitors need to decide.', 'اجعلها بسيطة. اسم قوي ووصف واضح وبطاقة انضمام يكفون لاتخاذ القرار.')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 flex gap-2 shrink-0" style={{ borderTop: '1px solid #2e2950' }}>
                <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 text-white/60 hover:text-white/90" style={{ background: '#252140' }}>
                  <Save className="w-3.5 h-3.5" /> {t('Save Draft', 'حفظ')}
                </button>
                <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 text-white hover:opacity-90" style={{ background: accent }}>
                  <Rocket className="w-3.5 h-3.5" /> {t('Publish', 'نشر')}
                </button>
              </div>
            </div>

            {/* ══════════ PREVIEW ══════════ */}
            <div className="flex-1 flex flex-col min-w-0" style={{ background: '#edeef2' }}>
              <div className="h-11 px-4 flex items-center justify-between shrink-0" style={{ background: '#252140' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <div className="px-3 py-1 rounded-md text-[11px] font-mono text-white/40 max-w-[340px] truncate" style={{ background: '#1a1730' }}>{content.url}</div>
                <div className="flex gap-1">
                  {([{ id: 'desktop', Icon: Monitor }, { id: 'tablet', Icon: Tablet }, { id: 'mobile', Icon: Smartphone }] as const).map(d => (
                    <button key={d.id} onClick={() => setDevice(d.id)} className="w-7 h-6 rounded-md flex items-center justify-center"
                      style={{ background: device === d.id ? '#2e2950' : 'transparent', color: device === d.id ? '#fff' : 'rgba(255,255,255,.35)' }}>
                      <d.Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto prev-scroll flex justify-center p-6">
                <div className="w-full transition-all duration-300"
                  style={{ maxWidth: frameWidth, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 40px rgba(26,23,48,.10)', height: 'fit-content', border: '1px solid #e8e4ff' }}
                  dir={isAr ? 'rtl' : 'ltr'}>
                  {blocks.filter(b => b.visible).map(b => (
                    <Section key={b.id} id={b.id} c={content} accent={accent} device={device} isAr={isAr} t={t}
                      openFaq={openFaq} setOpenFaq={setOpenFaq} openSec={openSec} setOpenSec={setOpenSec} />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════ EDITOR SUB-COMPONENTS ═══════════════ */

function EditGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #2e2950' }}>
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-2.5">{title}</h4>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full px-2.5 py-2 rounded-lg text-[12px] text-white/90 outline-none"
  const style = { background: '#252140', border: '1px solid #2e2950' } as React.CSSProperties
  return (
    <div>
      <label className="block text-[11px] font-medium text-white/45 mb-1">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={cls + ' resize-none leading-relaxed'} style={style} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls} style={style} />}
    </div>
  )
}

/* ═══════════════ PREVIEW ═══════════════ */

const INK = '#1a1730', INK2 = '#46426a', INK3 = '#9590b8', LINE = '#ece9f6', SOFT = '#f7f7fb'

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} width={size} height={size} className={i <= Math.round(n) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </span>
  )
}

function MediaBox({ accent, ratio = '16/9', radius = 12 }: { accent: string; ratio?: string; radius?: number }) {
  return (
    <div className="relative w-full flex items-center justify-center" style={{ aspectRatio: ratio, background: `linear-gradient(135deg,${accent}14,${accent}08)`, borderRadius: radius, border: `1px solid ${LINE}` }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#fff', boxShadow: '0 4px 14px rgba(26,23,48,.12)' }}>
        <Play className="w-4 h-4 fill-current" style={{ color: accent }} />
      </div>
    </div>
  )
}

interface SectionProps {
  id: BlockId; c: Content; accent: string; device: Device; isAr: boolean
  t: (en: string, ar: string) => string
  openFaq: number | null; setOpenFaq: (n: number | null) => void
  openSec: number | null; setOpenSec: (n: number | null) => void
}

function Section({ id, c, accent, device, t, openFaq, setOpenFaq, openSec, setOpenSec }: SectionProps) {
  const mob = device === 'mobile'
  const stack = device !== 'desktop'
  const cols3 = mob ? 1 : device === 'tablet' ? 2 : 3
  const cols2 = mob ? 1 : 2
  const pad = mob ? 'px-5 py-8' : device === 'tablet' ? 'px-7 py-9' : 'px-10 py-11'

  const Eyebrow = ({ text }: { text: string }) => (
    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.08em] mb-2" style={{ color: accent }}>
      <span className="w-3.5 h-0.5 rounded-full" style={{ background: accent }} />{text}
    </div>
  )
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="font-bold tracking-tight" style={{ color: INK, fontSize: mob ? 21 : 26, letterSpacing: '-0.02em' }}>{children}</h2>
  )

  switch (id) {

    /* ── HERO (Skool-style, clean & light) ── */
    case 'hero':
      return (
        <div className={pad} style={{ background: '#fff' }}>
          <div className="grid gap-7" style={{ gridTemplateColumns: stack ? '1fr' : '1fr 340px', alignItems: 'start' }}>
            {/* main */}
            <div className="min-w-0">
              <h1 className="font-extrabold tracking-tight" style={{ color: INK, fontSize: mob ? 26 : 34, letterSpacing: '-0.02em' }}>{c.name}</h1>
              <p className="mt-2.5 leading-relaxed" style={{ color: INK2, fontSize: mob ? 14 : 15, maxWidth: 560 }}>{c.tagline}</p>

              <div className="mt-5"><MediaBox accent={accent} /></div>

              {/* thumbnail strip */}
              <div className="flex gap-2 mt-2.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="flex-1 flex items-center justify-center" style={{ aspectRatio: '16/10', background: SOFT, borderRadius: 8, border: `1px solid ${LINE}` }}>
                    <ImageIcon className="w-4 h-4" style={{ color: '#cbc7e0' }} />
                  </div>
                ))}
              </div>

              {/* meta row */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 text-[13px]" style={{ color: INK2 }}>
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" style={{ color: INK3 }} /> {c.access}</span>
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" style={{ color: INK3 }} /> {c.members} {t('members', 'عضو')}</span>
                <span className="flex items-center gap-1.5"><span style={{ color: INK3 }}>🏷️</span> {c.price} {c.currency}{c.period}</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: accent }}>{c.creatorName.charAt(0)}</span>
                  {t('By', 'بواسطة')} {c.creatorName}
                </span>
              </div>
            </div>

            {/* join card */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${LINE}`, background: '#fff', boxShadow: '0 6px 24px rgba(26,23,48,.07)' }}>
              <div className="p-2.5"><MediaBox accent={accent} radius={10} /></div>
              <div className="px-4 pb-4">
                <p className="text-[15px] font-bold" style={{ color: INK }}>{c.name}</p>
                <p className="text-[11px] font-mono mt-0.5" style={{ color: INK3 }}>{c.url}</p>
                <p className="text-[12.5px] leading-relaxed mt-2" style={{ color: INK2 }}>{c.tagline}</p>

                <div className="grid grid-cols-3 gap-2 my-3.5 py-3" style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}` }}>
                  {[[c.members, t('Members', 'أعضاء')], [c.online, t('Online', 'متصل')], [c.admins, t('Admins', 'مشرفون')]].map(([v, l], i) => (
                    <div key={i} className="text-center">
                      <div className="text-[15px] font-bold" style={{ color: INK }}>{v}</div>
                      <div className="text-[10px] font-medium" style={{ color: INK3 }}>{l}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-baseline gap-1 mb-2.5">
                  <span className="text-[20px] font-extrabold" style={{ color: INK }}>{c.price}</span>
                  <span className="text-[12px] font-medium" style={{ color: INK3 }}>{c.currency}{c.period}</span>
                </div>
                <button className="w-full py-3 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90" style={{ background: accent }}>{c.ctaPrimary}</button>
              </div>
            </div>
          </div>
        </div>
      )

    /* ── HIGHLIGHTS ── */
    case 'highlights':
      return (
        <div className={pad} style={{ background: SOFT, borderTop: `1px solid ${LINE}` }}>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols3}, 1fr)` }}>
            {[
              { Icon: BookOpen, title: t('Structured courses', 'دورات منظّمة'), desc: t('One clear path from zero to pro.', 'مسار واضح من الصفر للاحتراف.') },
              { Icon: MessageSquare, title: t('Active community', 'مجتمع نشِط'), desc: t('Get feedback and stay accountable.', 'احصل على ملاحظات وابقَ ملتزماً.') },
              { Icon: Calendar, title: t('Live sessions', 'جلسات مباشرة'), desc: t('Weekly calls and challenges.', 'مكالمات وتحديات أسبوعية.') },
            ].map((h, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: '#fff', border: `1px solid ${LINE}` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5" style={{ background: `${accent}18` }}>
                  <h.Icon className="w-4 h-4" style={{ color: accent }} />
                </div>
                <p className="text-[14px] font-bold" style={{ color: INK }}>{h.title}</p>
                <p className="text-[12.5px] mt-1 leading-snug" style={{ color: INK3 }}>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )

    /* ── ABOUT ── */
    case 'about':
      return (
        <div className={pad} style={{ background: '#fff' }}>
          <Eyebrow text={t('About', 'حول')} />
          <H>{t('What this community is about', 'عن ماذا يدور هذا المجتمع')}</H>
          <div className="mt-3 flex flex-col gap-3 leading-relaxed" style={{ color: INK2, fontSize: 14, maxWidth: 640 }}>
            <p>{t("Stop stitching together scattered tutorials. Inside, you follow one proven path — from the fundamentals of motion to portfolio-ready animations — with people who keep you moving.", 'توقّف عن تجميع دروس مبعثرة. بالداخل تتبع مساراً واحداً مثبتاً — من أساسيات الحركة إلى أعمال جاهزة للمعرض — مع أشخاص يبقونك متقدّماً.')}</p>
            <p>{t('Everything is beginner-friendly, in Arabic, and built around real projects you can show clients.', 'كل شيء مناسب للمبتدئين وبالعربية ومبني على مشاريع حقيقية تعرضها على العملاء.')}</p>
          </div>
        </div>
      )

    /* ── CURRICULUM ── */
    case 'curriculum': {
      const secs = [
        { title: t('Foundations — Motion & Timing', 'الأساسيات — الحركة والتوقيت'), chapters: [t('Intro to Motion Design', 'مقدمة'), t('The 12 Principles', 'المبادئ الـ12'), t('Keyframes & Timeline', 'الإطارات'), t('Easing & Graph Editor', 'التنعيم')] },
        { title: t('After Effects Essentials', 'أساسيات After Effects'), chapters: [t('Workspace Setup', 'الإعداد'), t('Layers, Masks & Shapes', 'الطبقات'), t('Text Animation', 'تحريك النص'), t('Effects & Presets', 'المؤثرات')] },
        { title: t('Intermediate Animation', 'التحريك المتوسط'), chapters: [t('Character Rigging', 'الريغينغ'), t('Walk Cycles', 'دورات المشي'), t('Portfolio Project', 'مشروع المعرض')] },
      ]
      return (
        <div className={pad} style={{ background: SOFT, borderTop: `1px solid ${LINE}` }}>
          <Eyebrow text={t('Inside', 'بالداخل')} />
          <H>{t("What's inside", 'ماذا بالداخل')}</H>
          <p className="text-[13px] mt-1.5 mb-5" style={{ color: INK3 }}>{secs.length} {t('modules', 'وحدات')} · {c.lessons} {t('lessons', 'درس')}</p>
          <div className="flex flex-col gap-2">
            {secs.map((s, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${LINE}` }}>
                <button onClick={() => setOpenSec(openSec === i ? null : i)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold" style={{ background: `${accent}18`, color: accent }}>{i + 1}</span>
                  <span className="flex-1 text-[13px] font-semibold" style={{ color: INK }}>{s.title}</span>
                  <span className="text-[11px]" style={{ color: INK3 }}>{s.chapters.length} {t('lessons', 'درس')}</span>
                  <span className="text-[11px] transition-transform" style={{ color: INK3, transform: openSec === i ? 'rotate(90deg)' : 'none' }}>▶</span>
                </button>
                {openSec === i && (
                  <div className="pb-1.5">
                    {s.chapters.map((ch, j) => (
                      <div key={j} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px]" style={{ color: INK2, borderTop: `1px solid ${LINE}` }}>
                        <Play className="w-3 h-3 shrink-0" style={{ color: INK3 }} />
                        <span className="flex-1">{ch}</span>
                        {j === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${accent}18`, color: accent }}>{t('FREE', 'مجاني')}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* ── CREATOR ── */
    case 'creator':
      return (
        <div className={pad} style={{ background: '#fff' }}>
          <Eyebrow text={t('Your host', 'مضيفك')} />
          <div className="flex gap-5 mt-4 p-5 rounded-2xl" style={{ background: SOFT, border: `1px solid ${LINE}`, flexDirection: stack ? 'column' : 'row', alignItems: stack ? 'flex-start' : 'center' }}>
            <div className="rounded-2xl flex items-center justify-center text-xl font-extrabold text-white shrink-0" style={{ background: `linear-gradient(135deg,${accent},#6c52f0)`, width: 64, height: 64 }}>
              {c.creatorName.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-[16px] font-bold" style={{ color: INK }}>{c.creatorName}</p>
              <p className="text-[13px]" style={{ color: INK3 }}>{c.creatorRole}</p>
              <p className="text-[13px] leading-relaxed mt-2.5" style={{ color: INK2 }}>{c.creatorBio}</p>
            </div>
          </div>
        </div>
      )

    /* ── TESTIMONIALS ── */
    case 'testimonials': {
      const revs = [
        { av: 'AB', bg: `${accent}18`, tc: accent, name: 'Amine Benali', r: 5, text: t('Clear, real-world projects and a community that actually helps. Worth every dinar.', 'مشاريع واقعية ومجتمع يساعد فعلاً. يستحق كل دينار.') },
        { av: 'WN', bg: '#e4f8fd', tc: '#47c7ea', name: 'Wyssem Neila', r: 5, text: t('From zero to my first pro animation in 3 weeks. Perfectly structured.', 'من الصفر لأول تحريك احترافي في 3 أسابيع. منظّم تماماً.') },
        { av: 'SA', bg: '#ffe4ee', tc: '#f65887', name: 'Sara Alaoui', r: 5, text: t('The weekly challenges keep me practicing. Best community I joined.', 'التحديات الأسبوعية تبقيني أتدرّب. أفضل مجتمع انضممت له.') },
      ]
      return (
        <div className={pad} style={{ background: SOFT, borderTop: `1px solid ${LINE}` }}>
          <Eyebrow text={t('Members', 'الأعضاء')} />
          <div className="flex items-center gap-3">
            <H>{t('Loved by members', 'محبوب من الأعضاء')}</H>
          </div>
          <div className="flex items-center gap-2 mt-2 mb-5"><Stars n={Number(c.rating)} size={15} /><span className="text-[13px] font-semibold" style={{ color: INK }}>{c.rating}</span><span className="text-[12px]" style={{ color: INK3 }}>· {c.reviews} {t('reviews', 'مراجعة')}</span></div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols3}, 1fr)` }}>
            {revs.map((r, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: '#fff', border: `1px solid ${LINE}` }}>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: r.bg, color: r.tc }}>{r.av}</div>
                  <div><p className="text-[13px] font-bold" style={{ color: INK }}>{r.name}</p><Stars n={r.r} size={11} /></div>
                </div>
                <p className="text-[13px] leading-snug" style={{ color: INK2 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* ── PRICING ── */
    case 'pricing': {
      const tiers = [
        { name: t('Free', 'مجاني'), price: '0', feat: [t('Community access', 'وصول للمجتمع'), t('2 free lessons', 'درسان مجانيان'), t('Weekly newsletter', 'نشرة أسبوعية')], cta: t('Join Free', 'انضم مجاناً'), hi: false },
        { name: t('All-Access', 'وصول كامل'), price: c.price, feat: [`${t('All', 'كل')} ${c.lessons} ${t('lessons', 'درس')}`, t('Live sessions & challenges', 'جلسات وتحديات'), t('Feedback on your work', 'ملاحظات على عملك'), t('Certificate', 'شهادة')], cta: c.ctaPrimary, hi: true },
        { name: t('Mentorship', 'إرشاد'), price: '499', feat: [t('Everything in All-Access', 'كل ما سبق'), t('1-on-1 monthly calls', 'مكالمات شهرية'), t('Portfolio review', 'مراجعة المعرض')], cta: t('Apply', 'قدّم'), hi: false },
      ]
      return (
        <div className={pad} style={{ background: '#fff' }}>
          <Eyebrow text={t('Membership', 'العضوية')} />
          <H>{t('Choose your access', 'اختر وصولك')}</H>
          <div className="grid gap-4 mt-5" style={{ gridTemplateColumns: `repeat(${cols3}, 1fr)`, alignItems: 'start' }}>
            {tiers.map((tr, i) => (
              <div key={i} className="rounded-2xl p-5 relative" style={{ background: tr.hi ? SOFT : '#fff', border: `${tr.hi ? 2 : 1}px solid ${tr.hi ? accent : LINE}` }}>
                {tr.hi && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: accent }}>{t('MOST POPULAR', 'الأكثر شيوعاً')}</span>}
                <p className="text-[13px] font-bold" style={{ color: INK }}>{tr.name}</p>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-2xl font-extrabold" style={{ color: tr.hi ? accent : INK }}>{tr.price}</span>
                  <span className="text-[12px] font-medium" style={{ color: INK3 }}>{c.currency}{c.period}</span>
                </div>
                <div className="flex flex-col gap-2 my-4">
                  {tr.feat.map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-[12.5px]" style={{ color: INK2 }}><Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />{f}</div>
                  ))}
                </div>
                <button className="w-full py-2.5 rounded-xl text-[13px] font-bold" style={tr.hi ? { background: accent, color: '#fff' } : { background: '#fff', color: INK, border: `1px solid ${LINE}` }}>{tr.cta}</button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* ── FAQ ── */
    case 'faq': {
      const faqs = [
        { q: t('How long do I have access?', 'كم مدة الوصول؟'), a: t('As long as your membership is active, everything is yours — including updates.', 'طالما عضويتك فعّالة، كل شيء لك — مع التحديثات.') },
        { q: t('Do I need experience?', 'هل أحتاج خبرة؟'), a: t('No. We start from zero and guide you through setup in the first lessons.', 'لا. نبدأ من الصفر ونرشدك في الدروس الأولى.') },
        { q: t('What language is it in?', 'ما اللغة؟'), a: t('Arabic, with resources in both Arabic and French.', 'العربية، مع مصادر بالعربية والفرنسية.') },
        { q: t('Can I cancel anytime?', 'هل يمكنني الإلغاء؟'), a: t('Yes — cancel in one click, no questions asked.', 'نعم — إلغاء بنقرة واحدة دون أسئلة.') },
      ]
      return (
        <div className={pad} style={{ background: SOFT, borderTop: `1px solid ${LINE}` }}>
          <Eyebrow text={t('FAQ', 'الأسئلة')} />
          <H>{t('Common questions', 'الأسئلة الشائعة')}</H>
          <div className="flex flex-col gap-2 mt-5">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${LINE}` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
                  <span className="text-[14px] font-semibold" style={{ color: INK }}>{f.q}</span>
                  <span className="text-[16px] transition-transform shrink-0" style={{ color: openFaq === i ? accent : INK3, transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-[13px] leading-relaxed" style={{ color: INK2, borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* ── JOIN CTA (light, soft purple) ── */
    case 'cta':
      return (
        <div className={pad} style={{ background: '#fff' }}>
          <div className="rounded-2xl px-6 py-9 text-center" style={{ background: `linear-gradient(135deg,${accent}12,${accent}06)`, border: `1px solid ${accent}33` }}>
            <h2 className="font-extrabold tracking-tight" style={{ color: INK, fontSize: mob ? 22 : 27 }}>{t('Ready to join', 'جاهز للانضمام')} {c.name}?</h2>
            <p className="mt-2 text-[14px]" style={{ color: INK2 }}>{t('Join', 'انضم إلى')} {c.members}+ {t('members already leveling up.', 'عضو يتطوّرون الآن.')}</p>
            <button className="mt-5 px-7 py-3 rounded-xl text-[14px] font-bold text-white transition-opacity hover:opacity-90" style={{ background: accent }}>{c.ctaPrimary}</button>
            <p className="mt-3 text-[12px]" style={{ color: INK3 }}>🔒 {t('Cancel anytime', 'إلغاء في أي وقت')}</p>
          </div>
        </div>
      )

    /* ── FOOTER (light) ── */
    case 'footer':
      return (
        <div className="px-10 py-5 flex flex-wrap items-center justify-between gap-3" style={{ background: '#fff', borderTop: `1px solid ${LINE}` }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: accent }}>Ch</div>
            <span className="text-[11px]" style={{ color: INK3 }}>© 2026 {c.name} · {t('Powered by Chabaqa', 'مدعوم من شبقة')}</span>
          </div>
          <div className="flex gap-4">
            {[t('Privacy', 'الخصوصية'), t('Terms', 'الشروط'), t('Contact', 'اتصل')].map(l => (
              <span key={l} className="text-[11px] cursor-pointer" style={{ color: INK3 }}>{l}</span>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}
