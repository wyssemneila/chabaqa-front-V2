'use client'

import { useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, Pencil,
  Blocks, Type, Palette, Star, Play, Check, Plus, Monitor,
  Tablet, Smartphone, Save, Rocket, ShieldCheck, Lock,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   Landing Page Builder — drag & drop, section editing.
   Conversion structure (AIDA + psychology): 13 sections.
   Uses the Chabaqa purple design system (--p #8e78fb).
═══════════════════════════════════════════════════════════ */

type BlockId =
  | 'hero' | 'trust' | 'problem' | 'outcomes' | 'curriculum'
  | 'instructor' | 'testimonials' | 'audience' | 'pricing'
  | 'guarantee' | 'faq' | 'cta' | 'footer'

interface BlockDef {
  id: BlockId
  label: { en: string; ar: string }
  desc: { en: string; ar: string }
  Icon: React.ElementType
  tint: string
  visible: boolean
  locked?: boolean // psychology note
}

const DEFAULT_BLOCKS: BlockDef[] = [
  { id: 'hero',        label: { en: 'Hero Banner',    ar: 'الواجهة' },      desc: { en: 'Headline, CTA & offer card', ar: 'العنوان والعرض' }, Icon: Rocket,      tint: '#8e78fb', visible: true },
  { id: 'trust',       label: { en: 'Trust Bar',      ar: 'شريط الثقة' },   desc: { en: 'Stats & social proof',       ar: 'الأرقام والإثبات' }, Icon: Star,       tint: '#47c7ea', visible: true },
  { id: 'problem',     label: { en: 'Problem',        ar: 'المشكلة' },      desc: { en: 'Agitate the pain point',     ar: 'إبراز الألم' },     Icon: Type,        tint: '#f65887', visible: true },
  { id: 'outcomes',    label: { en: 'Outcomes',       ar: 'النتائج' },      desc: { en: 'The transformation',         ar: 'التحوّل' },        Icon: Check,       tint: '#52c41a', visible: true },
  { id: 'curriculum',  label: { en: "What's Inside",  ar: 'المحتوى' },      desc: { en: 'Modules & lessons',          ar: 'الوحدات' },        Icon: Blocks,      tint: '#6c52f0', visible: true },
  { id: 'instructor',  label: { en: 'Creator',        ar: 'المنشئ' },       desc: { en: 'Authority & bio',            ar: 'السيرة' },         Icon: Pencil,      tint: '#ff9b28', visible: true },
  { id: 'testimonials',label: { en: 'Testimonials',   ar: 'الشهادات' },     desc: { en: 'Reviews & results',          ar: 'التقييمات' },      Icon: Star,        tint: '#e89000', visible: true },
  { id: 'audience',    label: { en: "Who It's For",   ar: 'لمن' },          desc: { en: 'Self-identification',        ar: 'الجمهور' },        Icon: Type,        tint: '#1890ff', visible: true },
  { id: 'pricing',     label: { en: 'Pricing',        ar: 'الأسعار' },      desc: { en: 'Tiers & anchor',             ar: 'الباقات' },        Icon: Blocks,      tint: '#8e78fb', visible: true },
  { id: 'guarantee',   label: { en: 'Guarantee',      ar: 'الضمان' },       desc: { en: 'Risk reversal',              ar: 'ضمان الاسترجاع' }, Icon: ShieldCheck, tint: '#52c41a', visible: true },
  { id: 'faq',         label: { en: 'FAQ',            ar: 'الأسئلة' },      desc: { en: 'Objection handling',         ar: 'الاعتراضات' },     Icon: Type,        tint: '#6c52f0', visible: true },
  { id: 'cta',         label: { en: 'Final CTA',      ar: 'الدعوة النهائية' }, desc: { en: 'Urgency close',            ar: 'الإغلاق' },        Icon: Rocket,      tint: '#f65887', visible: true },
  { id: 'footer',      label: { en: 'Footer',         ar: 'التذييل' },      desc: { en: 'Links & branding',           ar: 'الروابط' },        Icon: Blocks,      tint: '#46426a', visible: true },
]

interface Content {
  eyebrow: string
  title: string
  highlight: string
  desc: string
  ctaPrimary: string
  ctaSecondary: string
  price: string
  origPrice: string
  currency: string
  rating: string
  reviews: string
  students: string
  hours: string
  lessons: string
  guaranteeDays: string
  instName: string
  instRole: string
  instBio: string
  instStudents: string
  instCourses: string
  instRating: string
}

const DEFAULT_CONTENT: Content = {
  eyebrow: 'Motion Design Community',
  title: 'Master Motion Graphics &',
  highlight: 'Animation From Zero to Pro',
  desc: "Stop watching scattered tutorials that lead nowhere. Follow one proven path — from motion principles to portfolio-ready animations — alongside a community that keeps you moving.",
  ctaPrimary: 'Join the Community',
  ctaSecondary: 'Watch Preview',
  price: '149',
  origPrice: '299',
  currency: 'TND',
  rating: '4.9',
  reviews: '89',
  students: '1,240',
  hours: '18',
  lessons: '42',
  guaranteeDays: '30',
  instName: 'Mohamed Ismail',
  instRole: 'Motion Designer & Community Creator',
  instBio: 'Professional motion designer with 8+ years of experience working with leading brands across MENA. Passionate about building the next generation of motion artists in Tunisia and the Arab world.',
  instStudents: '1,240',
  instCourses: '4',
  instRating: '4.9',
}

export default function BrandingPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const [blocks, setBlocks] = useState<BlockDef[]>(DEFAULT_BLOCKS)
  const [tab, setTab] = useState<'blocks' | 'content' | 'design'>('blocks')
  const [content, setContent] = useState<Content>(DEFAULT_CONTENT)
  const [accent, setAccent] = useState('#8e78fb')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [openSec, setOpenSec] = useState<number | null>(0)
  const dragIndex = useRef<number | null>(null)

  const set = <K extends keyof Content>(k: K, v: Content[K]) =>
    setContent(c => ({ ...c, [k]: v }))

  /* ── block operations ── */
  const toggleBlock = (id: BlockId) =>
    setBlocks(bs => bs.map(b => (b.id === id ? { ...b, visible: !b.visible } : b)))

  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    setBlocks(bs => {
      const next = [...bs]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const onDrop = (i: number) => {
    const from = dragIndex.current
    if (from === null || from === i) return
    setBlocks(bs => {
      const next = [...bs]
      const [moved] = next.splice(from, 1)
      next.splice(i, 0, moved)
      return next
    })
    dragIndex.current = null
  }

  const frameWidth = device === 'mobile' ? 390 : device === 'tablet' ? 768 : 960

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .bld-scroll::-webkit-scrollbar{width:5px}
        .bld-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:10px}
        .prev-scroll::-webkit-scrollbar{width:6px}
        .prev-scroll::-webkit-scrollbar-thumb{background:var(--bd2,#d4ccff);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar
            title={t('Branding', 'الهوية')}
            subtitle={t('Design your community landing page', 'صمّم صفحة هبوط مجتمعك')}
          />

          {/* Builder shell — editor + preview */}
          <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

            {/* ══════════ EDITOR PANEL (dark) ══════════ */}
            <div className="w-[300px] shrink-0 flex flex-col" style={{ background: '#1a1730' }} dir={isAr ? 'rtl' : 'ltr'}>

              {/* header */}
              <div className="px-4 py-3.5 flex items-center gap-2.5 shrink-0" style={{ borderBottom: '1px solid #2e2950' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white" style={{ background: accent }}>
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white/90">{t('Page Builder', 'محرّر الصفحة')}</p>
                  <p className="text-[10px] text-white/35">{t('Community landing page', 'صفحة هبوط المجتمع')}</p>
                </div>
              </div>

              {/* tabs */}
              <div className="flex shrink-0" style={{ borderBottom: '1px solid #2e2950' }}>
                {([
                  { id: 'blocks', label: t('Blocks', 'الأقسام'), Icon: Blocks },
                  { id: 'content', label: t('Content', 'المحتوى'), Icon: Type },
                  { id: 'design', label: t('Design', 'التصميم'), Icon: Palette },
                ] as const).map(x => (
                  <button key={x.id} onClick={() => setTab(x.id)}
                    className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors"
                    style={{
                      color: tab === x.id ? accent : 'rgba(255,255,255,.4)',
                      borderBottom: `2px solid ${tab === x.id ? accent : 'transparent'}`,
                    }}>
                    <x.Icon className="w-3.5 h-3.5" />
                    {x.label}
                  </button>
                ))}
              </div>

              {/* body */}
              <div className="flex-1 overflow-y-auto bld-scroll">

                {/* ── BLOCKS TAB ── */}
                {tab === 'blocks' && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-2.5 px-1">
                      {t('Drag to reorder · click eye to hide', 'اسحب لإعادة الترتيب')}
                    </p>
                    {blocks.map((b, i) => (
                      <div key={b.id}
                        draggable
                        onDragStart={() => { dragIndex.current = i }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => onDrop(i)}
                        className="flex items-center gap-2 p-2 rounded-lg mb-1.5 cursor-grab transition-colors"
                        style={{
                          background: '#252140',
                          border: '1px solid #2e2950',
                          opacity: b.visible ? 1 : 0.45,
                        }}>
                        <GripVertical className="w-3.5 h-3.5 text-white/25 shrink-0" />
                        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: `${b.tint}22`, border: `1px solid ${b.tint}44` }}>
                          <b.Icon className="w-3.5 h-3.5" style={{ color: b.tint }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-white/85 truncate">{b.label[lang]}</p>
                          <p className="text-[10px] text-white/35 truncate">{b.desc[lang]}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => toggleBlock(b.id)} title={b.visible ? 'Hide' : 'Show'}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white/50 hover:text-white/90 transition-colors"
                            style={{ background: '#2e2950' }}>
                            {b.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button onClick={() => moveBlock(i, -1)} className="w-6 h-6 rounded-md flex items-center justify-center text-white/50 hover:text-white/90 transition-colors" style={{ background: '#2e2950' }}>
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveBlock(i, 1)} className="w-6 h-6 rounded-md flex items-center justify-center text-white/50 hover:text-white/90 transition-colors" style={{ background: '#2e2950' }}>
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── CONTENT TAB ── */}
                {tab === 'content' && (
                  <div className="pb-6">
                    <EditGroup title={t('Hero', 'الواجهة')}>
                      <Field label={t('Eyebrow', 'التمهيد')} value={content.eyebrow} onChange={v => set('eyebrow', v)} />
                      <Field label={t('Title', 'العنوان')} value={content.title} onChange={v => set('title', v)} />
                      <Field label={t('Highlighted title', 'العنوان المميّز')} value={content.highlight} onChange={v => set('highlight', v)} />
                      <Field label={t('Description', 'الوصف')} value={content.desc} onChange={v => set('desc', v)} textarea />
                      <Field label={t('Primary button', 'الزر الأساسي')} value={content.ctaPrimary} onChange={v => set('ctaPrimary', v)} />
                      <Field label={t('Secondary button', 'الزر الثانوي')} value={content.ctaSecondary} onChange={v => set('ctaSecondary', v)} />
                    </EditGroup>

                    <EditGroup title={t('Offer', 'العرض')}>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label={t('Price', 'السعر')} value={content.price} onChange={v => set('price', v)} />
                        <Field label={t('Original', 'السعر الأصلي')} value={content.origPrice} onChange={v => set('origPrice', v)} />
                      </div>
                      <Field label={t('Currency', 'العملة')} value={content.currency} onChange={v => set('currency', v)} />
                      <Field label={t('Guarantee (days)', 'الضمان (أيام)')} value={content.guaranteeDays} onChange={v => set('guaranteeDays', v)} />
                    </EditGroup>

                    <EditGroup title={t('Trust numbers', 'أرقام الثقة')}>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label={t('Rating', 'التقييم')} value={content.rating} onChange={v => set('rating', v)} />
                        <Field label={t('Reviews', 'المراجعات')} value={content.reviews} onChange={v => set('reviews', v)} />
                        <Field label={t('Students', 'الطلاب')} value={content.students} onChange={v => set('students', v)} />
                        <Field label={t('Hours', 'الساعات')} value={content.hours} onChange={v => set('hours', v)} />
                        <Field label={t('Lessons', 'الدروس')} value={content.lessons} onChange={v => set('lessons', v)} />
                      </div>
                    </EditGroup>

                    <EditGroup title={t('Creator', 'المنشئ')}>
                      <Field label={t('Name', 'الاسم')} value={content.instName} onChange={v => set('instName', v)} />
                      <Field label={t('Role', 'المسمّى')} value={content.instRole} onChange={v => set('instRole', v)} />
                      <Field label={t('Bio', 'السيرة')} value={content.instBio} onChange={v => set('instBio', v)} textarea />
                      <div className="grid grid-cols-3 gap-2">
                        <Field label={t('Students', 'الطلاب')} value={content.instStudents} onChange={v => set('instStudents', v)} />
                        <Field label={t('Courses', 'الدورات')} value={content.instCourses} onChange={v => set('instCourses', v)} />
                        <Field label={t('Rating', 'التقييم')} value={content.instRating} onChange={v => set('instRating', v)} />
                      </div>
                    </EditGroup>
                  </div>
                )}

                {/* ── DESIGN TAB ── */}
                {tab === 'design' && (
                  <div className="pb-6">
                    <EditGroup title={t('Brand color', 'لون العلامة')}>
                      <div className="flex items-center gap-2.5">
                        <input type="color" value={accent} onChange={e => setAccent(e.target.value)}
                          className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0" />
                        <div>
                          <p className="text-[12px] font-semibold text-white/85">{t('Accent', 'اللون المميّز')}</p>
                          <p className="text-[10px] text-white/35 font-mono">{accent}</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-3">
                        {['#8e78fb', '#6c52f0', '#f65887', '#47c7ea', '#ff9b28', '#52c41a'].map(c => (
                          <button key={c} onClick={() => setAccent(c)}
                            className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
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
                            style={{
                              background: device === d.id ? `${accent}22` : '#252140',
                              color: device === d.id ? accent : 'rgba(255,255,255,.5)',
                              border: `1px solid ${device === d.id ? accent : '#2e2950'}`,
                            }}>
                            <d.Icon className="w-4 h-4" />
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </EditGroup>

                    <div className="px-4 py-3 mx-3 mt-2 rounded-xl" style={{ background: '#252140', border: '1px solid #2e2950' }}>
                      <p className="text-[11px] font-semibold text-white/80 mb-1">💡 {t('Conversion tip', 'نصيحة تحويل')}</p>
                      <p className="text-[10px] text-white/40 leading-relaxed">
                        {t(
                          'Keep the hero above the fold and one primary CTA. Trust numbers right after the hero lift conversions the most.',
                          'اجعل الواجهة والزر الأساسي واضحين في الأعلى. أرقام الثقة بعد الواجهة ترفع التحويل أكثر.'
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* publish bar */}
              <div className="p-3 flex gap-2 shrink-0" style={{ borderTop: '1px solid #2e2950' }}>
                <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 text-white/60 transition-colors hover:text-white/90"
                  style={{ background: '#252140' }}>
                  <Save className="w-3.5 h-3.5" /> {t('Save Draft', 'حفظ')}
                </button>
                <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 text-white transition-opacity hover:opacity-90"
                  style={{ background: accent }}>
                  <Rocket className="w-3.5 h-3.5" /> {t('Publish', 'نشر')}
                </button>
              </div>
            </div>

            {/* ══════════ PREVIEW PANEL ══════════ */}
            <div className="flex-1 flex flex-col min-w-0" style={{ background: '#e8e4ff' }}>
              {/* preview topbar */}
              <div className="h-11 px-4 flex items-center justify-between shrink-0" style={{ background: '#252140' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <div className="px-3 py-1 rounded-md text-[11px] font-mono text-white/40 max-w-[340px] truncate" style={{ background: '#1a1730' }}>
                  chabaqa.io/communities/motion-masters
                </div>
                <div className="flex gap-1">
                  {([
                    { id: 'desktop', Icon: Monitor },
                    { id: 'tablet', Icon: Tablet },
                    { id: 'mobile', Icon: Smartphone },
                  ] as const).map(d => (
                    <button key={d.id} onClick={() => setDevice(d.id)}
                      className="w-7 h-6 rounded-md flex items-center justify-center transition-colors"
                      style={{ background: device === d.id ? '#2e2950' : 'transparent', color: device === d.id ? '#fff' : 'rgba(255,255,255,.35)' }}>
                      <d.Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* preview canvas */}
              <div className="flex-1 overflow-y-auto prev-scroll flex justify-center p-6">
                <div className="w-full transition-all duration-300"
                  style={{ maxWidth: frameWidth, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 48px rgba(26,23,48,.16)', height: 'fit-content' }}
                  dir={isAr ? 'rtl' : 'ltr'}>
                  {blocks.filter(b => b.visible).map(b => (
                    <Section key={b.id} id={b.id} content={content} accent={accent}
                      compact={device === 'mobile'} isAr={isAr} t={t}
                      openFaq={openFaq} setOpenFaq={setOpenFaq}
                      openSec={openSec} setOpenSec={setOpenSec} />
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

function Field({ label, value, onChange, textarea }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean
}) {
  const cls = "w-full px-2.5 py-2 rounded-lg text-[12px] text-white/90 outline-none transition-colors"
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

/* ═══════════════ PREVIEW SECTIONS ═══════════════ */

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} width={size} height={size}
          className={i <= Math.round(n) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </span>
  )
}

interface SectionProps {
  id: BlockId; content: Content; accent: string; compact: boolean; isAr: boolean
  t: (en: string, ar: string) => string
  openFaq: number | null; setOpenFaq: (n: number | null) => void
  openSec: number | null; setOpenSec: (n: number | null) => void
}

function Section({ id, content: c, accent, compact, t, openFaq, setOpenFaq, openSec, setOpenSec }: SectionProps) {
  const pad = compact ? 'px-5 py-9' : 'px-11 py-12'
  const ink = '#1a1730', ink2 = '#46426a', ink3 = '#9590b8', line = '#e8e4ff', soft = '#f7f7fe'

  const Eyebrow = ({ text }: { text: string }) => (
    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.08em] mb-2" style={{ color: accent }}>
      <span className="w-3.5 h-0.5 rounded-full" style={{ background: accent }} />{text}
    </div>
  )
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="font-extrabold tracking-tight" style={{ color: ink, fontSize: compact ? 22 : 27, letterSpacing: '-0.02em' }}>{children}</h2>
  )

  switch (id) {
    /* ── HERO ── */
    case 'hero':
      return (
        <div className={pad + ' relative overflow-hidden grid gap-8'}
          style={{ background: 'linear-gradient(135deg,#1a1730 0%,#2a2350 60%,#3a2f6e 100%)', gridTemplateColumns: compact ? '1fr' : '1fr 320px', alignItems: 'center' }}>
          <div className="absolute rounded-full" style={{ top: -80, insetInlineEnd: 60, width: 360, height: 360, background: accent, opacity: 0.14 }} />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.08em] mb-3.5" style={{ color: accent }}>
              <span className="w-4 h-0.5 rounded-full" style={{ background: accent }} />{c.eyebrow}
            </div>
            <h1 className="font-extrabold text-white leading-[1.1] tracking-tight" style={{ fontSize: compact ? 30 : 42 }}>
              {c.title} <span style={{ color: accent }}>{c.highlight}</span>
            </h1>
            <p className="mt-4 leading-relaxed" style={{ color: 'rgba(255,255,255,.55)', fontSize: compact ? 14 : 15 }}>{c.desc}</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {[`⭐ ${c.rating} (${c.reviews})`, `👥 ${c.students} ${t('members', 'عضو')}`, `🕐 ${c.hours}h`, `📘 ${c.lessons} ${t('lessons', 'درس')}`].map(tag => (
                <span key={tag} className="text-[12px] px-2.5 py-1 rounded-full" style={{ color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)' }}>{tag}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2.5 mt-6">
              <button className="px-6 py-3 rounded-xl text-[14px] font-bold text-white inline-flex items-center gap-2" style={{ background: accent }}>{c.ctaPrimary} →</button>
              <button className="px-5 py-3 rounded-xl text-[14px] font-semibold inline-flex items-center gap-2" style={{ color: 'rgba(255,255,255,.75)', border: '1px solid rgba(255,255,255,.2)' }}><Play className="w-3.5 h-3.5" /> {c.ctaSecondary}</button>
            </div>
          </div>
          {/* offer card */}
          <div className="relative rounded-2xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 16px 48px rgba(0,0,0,.35)' }}>
            <div className="h-36 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg,${accent},#6c52f0)` }}>
              <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center"><Play className="w-4 h-4 text-gray-800 fill-gray-800" /></div>
            </div>
            <div className="p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold" style={{ color: ink }}>{c.price}<span className="text-[13px] font-medium" style={{ color: ink3 }}> {c.currency}</span></span>
                <span className="text-[13px] line-through" style={{ color: ink3 }}>{c.origPrice} {c.currency}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#dc2626' }}>-50%</span>
              </div>
              <button className="w-full py-3 mt-3 rounded-xl text-[14px] font-bold text-white" style={{ background: accent }}>{c.ctaPrimary}</button>
              <div className="mt-3 pt-3 flex flex-col gap-1.5" style={{ borderTop: `1px solid ${line}` }}>
                {[`📹 ${c.hours}h ${t('of content', 'محتوى')}`, `📁 ${c.lessons} ${t('lessons', 'درس')}`, `🏆 ${t('Certificate', 'شهادة')}`, `♾️ ${t('Lifetime access', 'وصول دائم')}`].map(x => (
                  <div key={x} className="text-[11px]" style={{ color: ink3 }}>{x}</div>
                ))}
              </div>
              <p className="text-center text-[10px] mt-2.5" style={{ color: ink3 }}>🔒 {c.guaranteeDays}-{t('day money-back guarantee', 'يوم ضمان الاسترجاع')}</p>
            </div>
          </div>
        </div>
      )

    /* ── TRUST BAR ── */
    case 'trust':
      return (
        <div className="px-11 py-5 flex flex-wrap items-center justify-around gap-3" style={{ background: '#fff', borderBottom: `1px solid ${line}` }}>
          {[
            { v: c.students, l: t('Members', 'عضو'), accent: true },
            { v: `${c.hours}h`, l: t('Content', 'محتوى') },
            { v: c.lessons, l: t('Lessons', 'درس') },
            { v: `${c.rating} ⭐`, l: t('Avg rating', 'التقييم') },
            { v: `${c.reviews}+`, l: t('Reviews', 'مراجعة') },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-[22px] font-extrabold leading-none" style={{ color: s.accent ? accent : ink }}>{s.v}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide mt-1" style={{ color: ink3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )

    /* ── PROBLEM ── */
    case 'problem':
      return (
        <div className={pad} style={{ background: soft }}>
          <Eyebrow text={t('Sound familiar?', 'يبدو مألوفاً؟')} />
          <H>{t("You've watched 100 tutorials — and still can't finish a project", 'شاهدت 100 درس — وما زلت عاجزاً عن إنهاء مشروع')}</H>
          <div className="grid gap-3 mt-6" style={{ gridTemplateColumns: compact ? '1fr' : '1fr 1fr' }}>
            {[
              t('Scattered YouTube tutorials with no clear path or order', 'دروس يوتيوب مبعثرة بلا مسار واضح'),
              t('You start motivated, then get stuck and give up', 'تبدأ بحماس ثم تتعثّر وتستسلم'),
              t('No feedback, no community, no accountability', 'لا ملاحظات ولا مجتمع ولا التزام'),
              t('A portfolio that still looks like a beginner made it', 'معرض أعمال ما زال يبدو مبتدئاً'),
            ].map((x, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3.5 rounded-xl" style={{ background: '#fff', border: `1px solid ${line}` }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] shrink-0 mt-0.5" style={{ background: '#ffe4ee', color: '#f65887' }}>✕</span>
                <span className="text-[13px] leading-snug" style={{ color: ink2 }}>{x}</span>
              </div>
            ))}
          </div>
        </div>
      )

    /* ── OUTCOMES ── */
    case 'outcomes':
      return (
        <div className={pad} style={{ background: '#fff' }}>
          <Eyebrow text={t('The transformation', 'التحوّل')} />
          <H>{t("What you'll be able to do", 'ما ستتمكّن من فعله')}</H>
          <p className="text-[14px] mt-1.5" style={{ color: ink3 }}>{t('By the end, you create professional motion graphics from scratch.', 'ستنشئ في النهاية موشن جرافيكس احترافي من الصفر.')}</p>
          <div className="grid gap-2.5 mt-6" style={{ gridTemplateColumns: compact ? '1fr' : '1fr 1fr' }}>
            {[
              t('Master the 12 principles of animation', 'إتقان مبادئ التحريك الـ12'),
              t('Build smooth keyframe animations in After Effects', 'بناء تحريكات سلسة في After Effects'),
              t('Design and animate custom characters & logos', 'تصميم وتحريك شخصيات وشعارات'),
              t('Automate work with expressions', 'أتمتة العمل بالـexpressions'),
              t('Export at broadcast quality', 'التصدير بجودة البث'),
              t('Build a portfolio of real projects', 'بناء معرض بمشاريع حقيقية'),
            ].map((x, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: soft, border: `1px solid ${line}` }}>
                <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: accent }}><Check className="w-3 h-3 text-white" /></span>
                <span className="text-[13px] leading-snug" style={{ color: ink2 }}>{x}</span>
              </div>
            ))}
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
        <div className={pad} style={{ background: soft }}>
          <Eyebrow text={t('The curriculum', 'المنهج')} />
          <H>{t("What's inside", 'ماذا بالداخل')}</H>
          <p className="text-[14px] mt-1.5 mb-6" style={{ color: ink3 }}>8 {t('modules', 'وحدات')} · {c.lessons} {t('lessons', 'درس')} · {c.hours}h</p>
          <div className="flex flex-col gap-2">
            {secs.map((s, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${line}` }}>
                <button onClick={() => setOpenSec(openSec === i ? null : i)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: ink }}>{i + 1}</span>
                  <span className="flex-1 text-[13px] font-bold" style={{ color: ink }}>{s.title}</span>
                  <span className="text-[11px]" style={{ color: ink3 }}>{s.chapters.length} {t('lessons', 'درس')}</span>
                  <span className="text-[12px] transition-transform" style={{ color: ink3, transform: openSec === i ? 'rotate(90deg)' : 'none' }}>▶</span>
                </button>
                {openSec === i && (
                  <div className="pb-1.5">
                    {s.chapters.map((ch, j) => (
                      <div key={j} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px]" style={{ color: ink2, borderTop: `1px solid ${line}` }}>
                        <Play className="w-3 h-3 shrink-0" style={{ color: ink3 }} />
                        <span className="flex-1">{ch}</span>
                        {j === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#ede9ff', color: accent }}>{t('FREE', 'مجاني')}</span>}
                        <span className="text-[11px]" style={{ color: ink3 }}>{8 + j * 3} min</span>
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

    /* ── INSTRUCTOR ── */
    case 'instructor':
      return (
        <div className={pad} style={{ background: '#fff' }}>
          <Eyebrow text={t('Meet your creator', 'تعرّف على المنشئ')} />
          <H>{t('Learn from a working pro', 'تعلّم من محترف ممارس')}</H>
          <div className="flex gap-6 mt-6 p-6 rounded-2xl" style={{ background: soft, border: `1px solid ${line}`, flexDirection: compact ? 'column' : 'row' }}>
            <div className="w-18 h-18 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shrink-0" style={{ background: `linear-gradient(135deg,${accent},#6c52f0)`, width: 72, height: 72 }}>
              {c.instName.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-[18px] font-extrabold" style={{ color: ink }}>{c.instName}</p>
              <p className="text-[13px]" style={{ color: ink3 }}>{c.instRole}</p>
              <div className="flex gap-6 my-3.5">
                {[[c.instStudents, t('Students', 'طالب')], [c.instCourses, t('Courses', 'دورة')], [`${c.instRating} ⭐`, t('Rating', 'تقييم')]].map(([v, l], i) => (
                  <div key={i}><div className="text-[17px] font-extrabold" style={{ color: ink }}>{v}</div><div className="text-[10px] font-semibold uppercase" style={{ color: ink3 }}>{l}</div></div>
                ))}
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: ink2 }}>{c.instBio}</p>
            </div>
          </div>
        </div>
      )

    /* ── TESTIMONIALS ── */
    case 'testimonials': {
      const revs = [
        { av: 'AB', bg: '#ede9ff', tc: accent, name: 'Amine Benali', date: t('2 weeks ago', 'قبل أسبوعين'), r: 5, text: t('Best motion design path I\'ve taken. Clear, real-world projects. 100% worth it.', 'أفضل مسار تعلّمته. مشاريع واقعية وواضحة. يستحق تماماً.') },
        { av: 'WN', bg: '#e4f8fd', tc: '#47c7ea', name: 'Wyssem Neila', date: t('1 month ago', 'قبل شهر'), r: 5, text: t('From zero to my first pro animation in 3 weeks. Perfectly structured.', 'من الصفر لأول تحريك احترافي في 3 أسابيع. منظّم تماماً.') },
        { av: 'SA', bg: '#ffe4ee', tc: '#f65887', name: 'Sara Alaoui', date: t('3 weeks ago', 'قبل 3 أسابيع'), r: 4, text: t('The community keeps me accountable. The challenges push me to practice.', 'المجتمع يبقيني ملتزماً والتحديات تدفعني للتدرّب.') },
      ]
      return (
        <div className={pad} style={{ background: soft }}>
          <Eyebrow text={t('Social proof', 'إثبات اجتماعي')} />
          <H>{t('Members are getting results', 'الأعضاء يحقّقون نتائج')}</H>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-4xl font-extrabold" style={{ color: ink }}>{c.rating}</span>
            <div><Stars n={Number(c.rating)} size={18} /><p className="text-[12px] mt-1" style={{ color: ink3 }}>{t('Based on', 'بناءً على')} {c.reviews} {t('reviews', 'مراجعة')}</p></div>
          </div>
          <div className="grid gap-3 mt-6" style={{ gridTemplateColumns: compact ? '1fr' : '1fr 1fr 1fr' }}>
            {revs.map((r, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: '#fff', border: `1px solid ${line}` }}>
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-bold" style={{ background: r.bg, color: r.tc }}>{r.av}</div>
                  <div><p className="text-[13px] font-bold" style={{ color: ink }}>{r.name}</p><p className="text-[10px]" style={{ color: ink3 }}>{r.date}</p></div>
                </div>
                <Stars n={r.r} size={12} />
                <p className="text-[13px] leading-snug mt-2" style={{ color: ink2 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* ── AUDIENCE ── */
    case 'audience':
      return (
        <div className={pad} style={{ background: '#fff' }}>
          <Eyebrow text={t('Who should join', 'لمن هذا')} />
          <H>{t('This is for you if…', 'هذا لك إذا كنت…')}</H>
          <div className="grid gap-3 mt-6" style={{ gridTemplateColumns: compact ? '1fr' : '1fr 1fr 1fr' }}>
            {[
              { icon: '🌱', title: t('Complete beginners', 'مبتدئ تماماً'), desc: t('No experience needed. We start from the very basics.', 'لا خبرة مطلوبة. نبدأ من الأساسيات.') },
              { icon: '📈', title: t('Intermediate learners', 'متعلّم متوسط'), desc: t('Know the basics? Reach a professional level fast.', 'تعرف الأساسيات؟ اصعد للاحتراف بسرعة.') },
              { icon: '💼', title: t('Freelancers & pros', 'مستقلّون ومحترفون'), desc: t('Add motion design and charge premium rates.', 'أضف الموشن واطلب أسعاراً أعلى.') },
            ].map((a, i) => (
              <div key={i} className="p-5 rounded-xl text-center" style={{ background: soft, border: `1px solid ${line}` }}>
                <div className="text-3xl mb-2.5">{a.icon}</div>
                <p className="text-[13px] font-bold mb-1" style={{ color: ink }}>{a.title}</p>
                <p className="text-[12px] leading-snug" style={{ color: ink3 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )

    /* ── PRICING (anchor + decoy) ── */
    case 'pricing': {
      const tiers = [
        { name: t('Free', 'مجاني'), price: '0', feat: [t('3 free lessons', '3 دروس مجانية'), t('Community access', 'وصول للمجتمع'), t('Weekly newsletter', 'نشرة أسبوعية')], cta: t('Start Free', 'ابدأ مجاناً'), highlight: false },
        { name: t('All-Access', 'وصول كامل'), price: c.price, orig: c.origPrice, feat: [t('All', 'كل') + ` ${c.lessons} ${t('lessons', 'درس')}`, t('Live sessions & challenges', 'جلسات وتحديات'), t('Certificate', 'شهادة'), t('Lifetime access', 'وصول دائم'), t('Feedback on your work', 'ملاحظات على عملك')], cta: c.ctaPrimary, highlight: true },
        { name: t('Mentorship', 'إرشاد'), price: '499', feat: [t('Everything in All-Access', 'كل ما سبق'), t('1-on-1 monthly calls', 'مكالمات شهرية'), t('Portfolio review', 'مراجعة المعرض'), t('Priority support', 'دعم أولوية')], cta: t('Apply Now', 'قدّم الآن'), highlight: false },
      ]
      return (
        <div className={pad} style={{ background: soft }}>
          <Eyebrow text={t('Simple pricing', 'أسعار بسيطة')} />
          <H>{t('Choose your path', 'اختر مسارك')}</H>
          <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: compact ? '1fr' : '1fr 1fr 1fr', alignItems: 'start' }}>
            {tiers.map((tr, i) => (
              <div key={i} className="rounded-2xl p-5 relative" style={{ background: '#fff', border: tr.highlight ? `2px solid ${accent}` : `1px solid ${line}`, boxShadow: tr.highlight ? `0 12px 32px ${accent}22` : 'none' }}>
                {tr.highlight && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full" style={{ background: accent }}>{t('MOST POPULAR', 'الأكثر شيوعاً')}</span>}
                <p className="text-[13px] font-bold" style={{ color: ink }}>{tr.name}</p>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-3xl font-extrabold" style={{ color: tr.highlight ? accent : ink }}>{tr.price}</span>
                  <span className="text-[12px] font-medium" style={{ color: ink3 }}>{c.currency}</span>
                  {tr.orig && <span className="text-[12px] line-through" style={{ color: ink3 }}>{tr.orig}</span>}
                </div>
                <div className="flex flex-col gap-2 my-4">
                  {tr.feat.map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-[12px]" style={{ color: ink2 }}>
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />{f}
                    </div>
                  ))}
                </div>
                <button className="w-full py-2.5 rounded-xl text-[13px] font-bold" style={tr.highlight ? { background: accent, color: '#fff' } : { background: soft, color: ink, border: `1px solid ${line}` }}>{tr.cta}</button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* ── GUARANTEE ── */
    case 'guarantee':
      return (
        <div className={pad} style={{ background: '#fff' }}>
          <div className="flex items-center gap-5 p-6 rounded-2xl" style={{ background: '#eafaf0', border: '1px solid #b7ebc9', flexDirection: compact ? 'column' : 'row', textAlign: compact ? 'center' : 'start' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#52c41a' }}>
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[17px] font-extrabold" style={{ color: ink }}>{c.guaranteeDays}-{t('day money-back guarantee', 'يوم ضمان استرجاع المال')}</p>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: ink2 }}>{t("Join, go through the material, join the sessions. If it's not for you within", 'انضم وجرّب المحتوى والجلسات. إن لم يناسبك خلال')} {c.guaranteeDays} {t("days, we'll refund every dinar — no questions asked.", 'يوماً، نعيد لك كل دينار — دون أسئلة.')}</p>
            </div>
          </div>
        </div>
      )

    /* ── FAQ ── */
    case 'faq': {
      const faqs = [
        { q: t('How long do I have access?', 'كم مدة الوصول؟'), a: t('Lifetime access — the community and content are yours forever, including future updates.', 'وصول دائم — المحتوى والمجتمع لك للأبد مع التحديثات.') },
        { q: t('Is there a money-back guarantee?', 'هل يوجد ضمان استرجاع؟'), a: t(`Yes — a full ${c.guaranteeDays}-day guarantee. Not satisfied? We refund you, no questions asked.`, `نعم — ضمان ${c.guaranteeDays} يوماً. غير راضٍ؟ نعيد المال دون أسئلة.`) },
        { q: t('Do I need experience to start?', 'هل أحتاج خبرة؟'), a: t('No. We start from zero and guide you through setup in the first lessons.', 'لا. نبدأ من الصفر ونرشدك في الدروس الأولى.') },
        { q: t('What language is it in?', 'ما اللغة؟'), a: t('Arabic with French subtitles. Resources are labeled in both.', 'العربية مع ترجمة فرنسية. المصادر بكلتا اللغتين.') },
        { q: t('Will I get a certificate?', 'هل أحصل على شهادة؟'), a: t('Yes — a Chabaqa certificate you can share on LinkedIn and your portfolio.', 'نعم — شهادة شبقة تشاركها على لينكدإن ومعرضك.') },
      ]
      return (
        <div className={pad} style={{ background: soft }}>
          <Eyebrow text={t('Questions?', 'أسئلة؟')} />
          <H>{t('Frequently asked', 'الأسئلة الشائعة')}</H>
          <div className="flex flex-col gap-2 mt-6">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${line}` }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
                  <span className="text-[14px] font-semibold" style={{ color: ink }}>{f.q}</span>
                  <span className="text-[16px] transition-transform shrink-0" style={{ color: openFaq === i ? accent : ink3, transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-[13px] leading-relaxed" style={{ color: ink2, borderTop: `1px solid ${line}`, paddingTop: 12 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* ── FINAL CTA ── */
    case 'cta':
      return (
        <div className="px-11 py-14 text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1a1730,#2a2350)' }}>
          <div className="absolute rounded-full" style={{ top: -60, left: '50%', transform: 'translateX(-50%)', width: 480, height: 280, background: accent, opacity: 0.1 }} />
          <div className="relative">
            <h2 className="font-extrabold text-white leading-tight" style={{ fontSize: compact ? 24 : 30 }}>{t('Ready to start your motion journey?', 'جاهز لبدء رحلتك؟')}</h2>
            <p className="mt-2.5 text-[15px]" style={{ color: 'rgba(255,255,255,.5)' }}>{t('Join', 'انضم إلى')} {c.students}+ {t('members already transforming their skills.', 'عضو يطوّرون مهاراتهم الآن.')}</p>
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <button className="px-6 py-3 rounded-xl text-[14px] font-bold text-white" style={{ background: accent }}>{c.ctaPrimary} →</button>
              <button className="px-5 py-3 rounded-xl text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,.75)', border: '1px solid rgba(255,255,255,.2)' }}>{c.ctaSecondary}</button>
            </div>
            <p className="mt-4 text-[12px]" style={{ color: 'rgba(255,255,255,.4)' }}>🔒 {c.guaranteeDays}-{t('day guarantee', 'يوم ضمان')} · {t('Cancel anytime', 'إلغاء في أي وقت')}</p>
          </div>
        </div>
      )

    /* ── FOOTER ── */
    case 'footer':
      return (
        <div className="px-11 py-5 flex flex-wrap items-center justify-between gap-3" style={{ background: '#1a1730' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: accent }}>Ch</div>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,.3)' }}>© 2026 Chabaqa · Motion Masters</span>
          </div>
          <div className="flex gap-4">
            {[t('Privacy', 'الخصوصية'), t('Terms', 'الشروط'), t('Contact', 'اتصل'), t('Help', 'مساعدة')].map(l => (
              <span key={l} className="text-[11px] cursor-pointer" style={{ color: 'rgba(255,255,255,.3)' }}>{l}</span>
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}
