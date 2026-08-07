'use client'

import { useRef, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  GripVertical, Eye, EyeOff, ArrowUp, ArrowDown,
  Blocks, Type, Palette, Star, Play, Check, Monitor,
  Tablet, Smartphone, Save, Rocket, Lock, Users,
  Sparkles, MessageSquare, BookOpen, Calendar, ImageIcon,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   Landing Page Builder — light editor + clean, customizable,
   Skool / Nas.io inspired community landing page preview.
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
  { id: 'hero',        label: { en: 'Hero',          ar: 'الواجهة' },  desc: { en: 'Cover, name & join',       ar: 'الغلاف والانضمام' },      Icon: Rocket,        tint: '#8e78fb', visible: true },
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
  name: string; tagline: string; url: string; access: string
  ctaPrimary: string; price: string; currency: string; period: string
  members: string; online: string; admins: string
  rating: string; reviews: string; lessons: string
  creatorName: string; creatorRole: string; creatorBio: string
}

const DEFAULT_CONTENT: Content = {
  name: 'Motion Masters',
  tagline: 'Master motion graphics & animation — from zero to pro, with a community that keeps you moving.',
  url: 'chabaqa.io/motion-masters',
  access: 'Private',
  ctaPrimary: 'Join Community',
  price: '149', currency: 'TND', period: '/month',
  members: '1,240', online: '38', admins: '2',
  rating: '4.9', reviews: '89', lessons: '42',
  creatorName: 'Mohamed Ismail',
  creatorRole: 'Motion Designer & Community Host',
  creatorBio: 'Professional motion designer with 8+ years working with leading brands across MENA. I built this community to help the next generation of motion artists go from zero to portfolio-ready — together.',
}

interface Design {
  accent: string; accent2: string
  bg: 'white' | 'tint' | 'gradient'
  font: 'sans' | 'rounded' | 'serif'
  radius: number
  pill: boolean
  heroStyle: 'cover' | 'minimal'
  altSections: boolean
}

const DEFAULT_DESIGN: Design = {
  accent: '#8e78fb', accent2: '#6c52f0',
  bg: 'tint', font: 'sans', radius: 16, pill: false,
  heroStyle: 'cover', altSections: true,
}

const FONT_STACK: Record<Design['font'], string> = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  rounded: '"SF Pro Rounded", ui-rounded, "Nunito", "Segoe UI", sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
}

/* editor (light) tokens */
const E = { bg: '#ffffff', card: '#f6f5fb', card2: '#efedf8', bd: '#eceaf4', t1: '#1a1730', t2: '#46426a', t3: '#9590b8' }

export default function BrandingPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const [blocks, setBlocks] = useState<BlockDef[]>(DEFAULT_BLOCKS)
  const [tab, setTab] = useState<'blocks' | 'content' | 'design'>('blocks')
  const [content, setContent] = useState<Content>(DEFAULT_CONTENT)
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN)
  const [device, setDevice] = useState<Device>('desktop')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [openSec, setOpenSec] = useState<number | null>(0)
  const dragIndex = useRef<number | null>(null)

  const accent = design.accent
  const set = <K extends keyof Content>(k: K, v: Content[K]) => setContent(c => ({ ...c, [k]: v }))
  const setD = <K extends keyof Design>(k: K, v: Design[K]) => setDesign(d => ({ ...d, [k]: v }))

  const toggleBlock = (id: BlockId) => setBlocks(bs => bs.map(b => (b.id === id ? { ...b, visible: !b.visible } : b)))
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= blocks.length) return
    setBlocks(bs => { const n = [...bs]; [n[i], n[j]] = [n[j], n[i]]; return n })
  }
  const onDrop = (i: number) => {
    const from = dragIndex.current; if (from === null || from === i) return
    setBlocks(bs => { const n = [...bs]; const [m] = n.splice(from, 1); n.splice(i, 0, m); return n })
    dragIndex.current = null
  }

  const frameWidth = device === 'mobile' ? 400 : device === 'tablet' ? 760 : 1040
  const pageBg = design.bg === 'tint' ? '#faf9ff' : design.bg === 'gradient' ? '#fbfaff' : '#ffffff'

  return (
    <>
      <style>{`
        .bld-scroll::-webkit-scrollbar{width:6px}
        .bld-scroll::-webkit-scrollbar-thumb{background:#dcd8ec;border-radius:10px}
        .prev-scroll::-webkit-scrollbar{width:6px}
        .prev-scroll::-webkit-scrollbar-thumb{background:#cdd2dc;border-radius:10px}
        input[type=range].bld-range{-webkit-appearance:none;height:4px;border-radius:4px;background:#e4e0f2;outline:none}
        input[type=range].bld-range::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${accent};cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.2)}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title={t('Branding', 'الهوية')} subtitle={t('Design your community landing page', 'صمّم صفحة هبوط مجتمعك')} />

          <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

            {/* ══════════ EDITOR (light) ══════════ */}
            <div className="w-[300px] shrink-0 flex flex-col" style={{ background: E.bg, borderInlineEnd: `1px solid ${E.bd}` }} dir={isAr ? 'rtl' : 'ltr'}>

              <div className="px-4 py-3.5 flex items-center gap-2.5 shrink-0" style={{ borderBottom: `1px solid ${E.bd}` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg,${design.accent},${design.accent2})` }}>
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[13px] font-bold" style={{ color: E.t1 }}>{t('Page Builder', 'محرّر الصفحة')}</p>
                  <p className="text-[10px]" style={{ color: E.t3 }}>{t('Community landing page', 'صفحة هبوط المجتمع')}</p>
                </div>
              </div>

              <div className="flex shrink-0 px-2 pt-2 gap-1" style={{ borderBottom: `1px solid ${E.bd}` }}>
                {([
                  { id: 'blocks', label: t('Blocks', 'الأقسام'), Icon: Blocks },
                  { id: 'content', label: t('Content', 'المحتوى'), Icon: Type },
                  { id: 'design', label: t('Design', 'التصميم'), Icon: Palette },
                ] as const).map(x => (
                  <button key={x.id} onClick={() => setTab(x.id)}
                    className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors"
                    style={{ color: tab === x.id ? '#fff' : E.t2, background: tab === x.id ? accent : 'transparent' }}>
                    <x.Icon className="w-3.5 h-3.5" />{x.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto bld-scroll">

                {/* BLOCKS */}
                {tab === 'blocks' && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 px-1" style={{ color: E.t3 }}>
                      {t('Drag to reorder · click eye to hide', 'اسحب لإعادة الترتيب')}
                    </p>
                    {blocks.map((b, i) => (
                      <div key={b.id} draggable
                        onDragStart={() => { dragIndex.current = i }}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => onDrop(i)}
                        className="flex items-center gap-2 p-2 rounded-xl mb-1.5 cursor-grab transition-all"
                        style={{ background: E.card, border: `1px solid ${E.bd}`, opacity: b.visible ? 1 : 0.5 }}>
                        <GripVertical className="w-3.5 h-3.5 shrink-0" style={{ color: '#c7c2dc' }} />
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${b.tint}1f` }}>
                          <b.Icon className="w-3.5 h-3.5" style={{ color: b.tint }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold truncate" style={{ color: E.t1 }}>{b.label[lang]}</p>
                          <p className="text-[10px] truncate" style={{ color: E.t3 }}>{b.desc[lang]}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => toggleBlock(b.id)} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors" style={{ background: E.card2, color: E.t2 }}>
                            {b.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button onClick={() => moveBlock(i, -1)} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: E.card2, color: E.t2 }}><ArrowUp className="w-3 h-3" /></button>
                          <button onClick={() => moveBlock(i, 1)} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: E.card2, color: E.t2 }}><ArrowDown className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CONTENT */}
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

                {/* DESIGN — rich customization */}
                {tab === 'design' && (
                  <div className="pb-6">
                    <EditGroup title={t('Colors', 'الألوان')}>
                      <ColorControl label={t('Primary', 'الأساسي')} value={design.accent} onChange={v => setD('accent', v)} />
                      <ColorControl label={t('Gradient end', 'نهاية التدرج')} value={design.accent2} onChange={v => setD('accent2', v)} />
                      <p className="text-[10px] mt-0.5" style={{ color: E.t3 }}>{t('Quick picks', 'اختيارات سريعة')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[['#8e78fb', '#6c52f0'], ['#f65887', '#c81e5b'], ['#47c7ea', '#2b8fc7'], ['#ff9b28', '#f5730a'], ['#52c41a', '#2f9e0e'], ['#1a1730', '#3a2f6e'], ['#0ea5e9', '#6366f1'], ['#ec4899', '#8b5cf6']].map(([a, b]) => (
                          <button key={a} onClick={() => setDesign(d => ({ ...d, accent: a, accent2: b }))}
                            className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                            style={{ background: `linear-gradient(135deg,${a},${b})`, outline: design.accent === a ? `2px solid ${a}` : 'none', outlineOffset: 2 }} />
                        ))}
                      </div>
                    </EditGroup>

                    <EditGroup title={t('Background', 'الخلفية')}>
                      <Segmented value={design.bg} onChange={v => setD('bg', v as Design['bg'])} accent={accent}
                        options={[{ v: 'white', l: t('White', 'أبيض') }, { v: 'tint', l: t('Soft', 'ناعم') }, { v: 'gradient', l: t('Vivid', 'حيوي') }]} />
                    </EditGroup>

                    <EditGroup title={t('Typeface', 'الخط')}>
                      <Segmented value={design.font} onChange={v => setD('font', v as Design['font'])} accent={accent}
                        options={[{ v: 'sans', l: t('Modern', 'حديث') }, { v: 'rounded', l: t('Rounded', 'دائري') }, { v: 'serif', l: t('Editorial', 'كلاسيكي') }]} />
                    </EditGroup>

                    <EditGroup title={`${t('Corner radius', 'انحناء الحواف')} · ${design.radius}px`}>
                      <input type="range" min={0} max={26} value={design.radius} onChange={e => setD('radius', Number(e.target.value))} className="bld-range w-full" />
                    </EditGroup>

                    <EditGroup title={t('Buttons', 'الأزرار')}>
                      <Segmented value={design.pill ? 'pill' : 'rounded'} onChange={v => setD('pill', v === 'pill')} accent={accent}
                        options={[{ v: 'rounded', l: t('Rounded', 'دائري') }, { v: 'pill', l: t('Pill', 'كبسولة') }]} />
                    </EditGroup>

                    <EditGroup title={t('Hero style', 'نمط الواجهة')}>
                      <Segmented value={design.heroStyle} onChange={v => setD('heroStyle', v as Design['heroStyle'])} accent={accent}
                        options={[{ v: 'cover', l: t('Cover', 'غلاف') }, { v: 'minimal', l: t('Minimal', 'بسيط') }]} />
                    </EditGroup>

                    <EditGroup title={t('Sections', 'الأقسام')}>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className="text-[12px]" style={{ color: E.t2 }}>{t('Alternate section shades', 'تبديل ألوان الأقسام')}</span>
                        <button onClick={() => setD('altSections', !design.altSections)} className="w-9 h-5 rounded-full relative transition-colors" style={{ background: design.altSections ? accent : '#dcd8ec' }}>
                          <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ insetInlineStart: design.altSections ? 18 : 2 }} />
                        </button>
                      </label>
                    </EditGroup>

                    <EditGroup title={t('Preview device', 'جهاز المعاينة')}>
                      <div className="flex gap-1.5">
                        {([{ id: 'desktop', Icon: Monitor, label: t('Desktop', 'حاسوب') }, { id: 'tablet', Icon: Tablet, label: t('Tablet', 'لوحي') }, { id: 'mobile', Icon: Smartphone, label: t('Mobile', 'جوال') }] as const).map(d => (
                          <button key={d.id} onClick={() => setDevice(d.id)} className="flex-1 py-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors"
                            style={{ background: device === d.id ? `${accent}18` : E.card, color: device === d.id ? accent : E.t2, border: `1px solid ${device === d.id ? accent : E.bd}` }}>
                            <d.Icon className="w-4 h-4" />{d.label}
                          </button>
                        ))}
                      </div>
                    </EditGroup>
                  </div>
                )}
              </div>

              <div className="p-3 flex gap-2 shrink-0" style={{ borderTop: `1px solid ${E.bd}` }}>
                <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5" style={{ background: E.card, color: E.t2 }}>
                  <Save className="w-3.5 h-3.5" /> {t('Save Draft', 'حفظ')}
                </button>
                <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 text-white hover:opacity-90" style={{ background: `linear-gradient(135deg,${design.accent},${design.accent2})` }}>
                  <Rocket className="w-3.5 h-3.5" /> {t('Publish', 'نشر')}
                </button>
              </div>
            </div>

            {/* ══════════ PREVIEW ══════════ */}
            <div className="flex-1 flex flex-col min-w-0" style={{ background: '#edeef2' }}>
              <div className="h-11 px-4 flex items-center justify-between shrink-0" style={{ background: '#e3e2ea', borderBottom: '1px solid #d6d5df' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <div className="px-3 py-1 rounded-md text-[11px] font-mono max-w-[340px] truncate" style={{ background: '#fff', color: '#8a86a0', border: '1px solid #d6d5df' }}>{content.url}</div>
                <div className="flex gap-1">
                  {([{ id: 'desktop', Icon: Monitor }, { id: 'tablet', Icon: Tablet }, { id: 'mobile', Icon: Smartphone }] as const).map(d => (
                    <button key={d.id} onClick={() => setDevice(d.id)} className="w-7 h-6 rounded-md flex items-center justify-center"
                      style={{ background: device === d.id ? '#fff' : 'transparent', color: device === d.id ? accent : '#9a97ad', border: device === d.id ? '1px solid #d6d5df' : '1px solid transparent' }}>
                      <d.Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto prev-scroll flex justify-center p-6">
                <div className="w-full transition-all duration-300"
                  style={{ maxWidth: frameWidth, background: pageBg, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 44px rgba(26,23,48,.12)', height: 'fit-content', border: '1px solid #e4e2ef', fontFamily: FONT_STACK[design.font] }}
                  dir={isAr ? 'rtl' : 'ltr'}>
                  {blocks.filter(b => b.visible).map((b, idx) => (
                    <Section key={b.id} id={b.id} c={content} design={design} device={device} isAr={isAr} t={t} index={idx}
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

/* ═══════════════ EDITOR SUB-COMPONENTS (light) ═══════════════ */

function EditGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${E.bd}` }}>
      <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: E.t3 }}>{title}</h4>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  const cls = "w-full px-2.5 py-2 rounded-lg text-[12px] outline-none transition-colors"
  const style = { background: '#fff', border: `1px solid ${E.bd}`, color: E.t1 } as React.CSSProperties
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: E.t2 }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className={cls + ' resize-none leading-relaxed'} style={style} />
        : <input value={value} onChange={e => onChange(e.target.value)} className={cls} style={style} />}
    </div>
  )
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0" />
      <div className="flex-1">
        <label className="block text-[10px] font-medium" style={{ color: E.t3 }}>{label}</label>
        <input value={value} onChange={e => onChange(e.target.value)} className="w-full text-[12px] font-mono outline-none bg-transparent" style={{ color: E.t1 }} />
      </div>
    </div>
  )
}

function Segmented<T extends string>({ value, onChange, options, accent }: { value: T; onChange: (v: T) => void; options: { v: T; l: string }[]; accent: string }) {
  return (
    <div className="flex gap-1 p-1 rounded-lg" style={{ background: E.card2 }}>
      {options.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)} className="flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
          style={{ background: value === o.v ? '#fff' : 'transparent', color: value === o.v ? accent : E.t2, boxShadow: value === o.v ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

/* ═══════════════ PREVIEW ═══════════════ */

const INK = '#1a1730', INK2 = '#46426a', INK3 = '#9590b8'

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} width={size} height={size} className={i <= Math.round(n) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </span>
  )
}

interface SectionProps {
  id: BlockId; c: Content; design: Design; device: Device; isAr: boolean; index: number
  t: (en: string, ar: string) => string
  openFaq: number | null; setOpenFaq: (n: number | null) => void
  openSec: number | null; setOpenSec: (n: number | null) => void
}

function Section({ id, c, design, device, t, index, openFaq, setOpenFaq, openSec, setOpenSec }: SectionProps) {
  const { accent, accent2, radius, pill } = design
  const mob = device === 'mobile'
  const stack = device !== 'desktop'
  const cols3 = mob ? 1 : device === 'tablet' ? 2 : 3
  const pad = mob ? 'px-5 py-9' : device === 'tablet' ? 'px-7 py-10' : 'px-11 py-12'
  const btnR = pill ? 999 : Math.max(8, radius - 2)
  const line = '#ece9f6'

  // section background: alternate soft/white
  const softShade = design.bg === 'tint' ? '#f4f2fc' : design.bg === 'gradient' ? '#f6f3ff' : '#f7f7fb'
  const white = design.bg === 'white' ? '#fff' : design.bg === 'tint' ? '#fbfaff' : '#fff'
  const useSoft = design.altSections && index % 2 === 1
  const secBg = useSoft ? softShade : white

  const grad = `linear-gradient(135deg,${accent},${accent2})`

  const Eyebrow = ({ text }: { text: string }) => (
    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.09em] mb-2.5" style={{ color: accent }}>
      <span className="w-4 h-0.5 rounded-full" style={{ background: accent }} />{text}
    </div>
  )
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="font-extrabold tracking-tight" style={{ color: INK, fontSize: mob ? 22 : 28, letterSpacing: '-0.02em' }}>{children}</h2>
  )
  const Btn = ({ children, ghost }: { children: React.ReactNode; ghost?: boolean }) => (
    <button className="px-6 text-[14px] font-bold transition-all hover:opacity-90 inline-flex items-center justify-center gap-2"
      style={ghost
        ? { borderRadius: btnR, height: 46, color: accent, background: '#fff', border: `1.5px solid ${accent}44` }
        : { borderRadius: btnR, height: 46, color: '#fff', background: grad, boxShadow: `0 8px 22px ${accent}3a` }}>
      {children}
    </button>
  )

  switch (id) {

    /* ── HERO ── */
    case 'hero': {
      if (design.heroStyle === 'minimal') {
        return (
          <div className={pad + ' text-center'} style={{ background: secBg }}>
            <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full mb-4" style={{ background: `${accent}14`, color: accent }}>
              <Lock className="w-3 h-3" /> {c.access} · {c.members} {t('members', 'عضو')}
            </div>
            <h1 className="font-extrabold tracking-tight mx-auto" style={{ color: INK, fontSize: mob ? 30 : 46, letterSpacing: '-0.03em', maxWidth: 720, lineHeight: 1.08 }}>{c.name}</h1>
            <p className="mt-4 mx-auto leading-relaxed" style={{ color: INK2, fontSize: mob ? 15 : 17, maxWidth: 540 }}>{c.tagline}</p>
            <div className="flex flex-wrap gap-3 justify-center mt-7">
              <Btn>{c.ctaPrimary} →</Btn>
              <Btn ghost><Play className="w-3.5 h-3.5" /> {t('Preview', 'معاينة')}</Btn>
            </div>
            <div className="flex items-center justify-center gap-2 mt-5"><Stars n={Number(c.rating)} size={15} /><span className="text-[13px] font-semibold" style={{ color: INK }}>{c.rating}</span><span className="text-[12px]" style={{ color: INK3 }}>· {c.reviews} {t('reviews', 'مراجعة')}</span></div>
          </div>
        )
      }
      // cover style
      return (
        <div style={{ background: secBg }}>
          <div className={mob ? 'px-4 pt-4' : 'px-6 pt-6'}>
            <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ aspectRatio: mob ? '16/10' : '21/7', background: grad, borderRadius: radius }}>
              <div className="absolute rounded-full" style={{ width: 260, height: 260, background: '#fff', opacity: 0.08, top: -80, insetInlineEnd: 40 }} />
              <button className="w-14 h-14 rounded-full flex items-center justify-center relative" style={{ background: 'rgba(255,255,255,.92)', boxShadow: '0 6px 20px rgba(0,0,0,.2)' }}>
                <Play className="w-5 h-5 fill-current" style={{ color: accent }} />
              </button>
              <span className="absolute top-3 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ insetInlineEnd: 12, background: 'rgba(255,255,255,.9)', color: INK }}>
                <ImageIcon className="w-3 h-3" /> {t('Cover', 'الغلاف')}
              </span>
            </div>
          </div>
          <div className={mob ? 'px-5 pb-9' : 'px-11 pb-12'}>
            <div className="flex items-end gap-4" style={{ marginTop: -32 }}>
              <div className="rounded-2xl flex items-center justify-center text-xl font-extrabold text-white shrink-0" style={{ background: grad, width: 72, height: 72, border: '4px solid #fff', boxShadow: '0 4px 14px rgba(26,23,48,.15)' }}>
                {c.name.charAt(0)}
              </div>
              {!stack && (
                <div className="flex-1 flex items-center justify-end gap-2.5 pb-1">
                  <Btn ghost><Play className="w-3.5 h-3.5" /> {t('Preview', 'معاينة')}</Btn>
                  <Btn>{c.ctaPrimary} →</Btn>
                </div>
              )}
            </div>
            <h1 className="font-extrabold tracking-tight mt-4" style={{ color: INK, fontSize: mob ? 28 : 36, letterSpacing: '-0.02em' }}>{c.name}</h1>
            <p className="mt-2 leading-relaxed" style={{ color: INK2, fontSize: mob ? 14.5 : 16, maxWidth: 620 }}>{c.tagline}</p>

            {/* meta chips */}
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { icon: <Lock className="w-3.5 h-3.5" />, text: c.access },
                { icon: <Users className="w-3.5 h-3.5" />, text: `${c.members} ${t('members', 'عضو')}` },
                { icon: <span className="text-[12px]">🏷️</span>, text: `${c.price} ${c.currency}${c.period}` },
                { icon: <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />, text: `${c.rating} (${c.reviews})` },
              ].map((chip, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#fff', color: INK2, border: `1px solid ${line}` }}>
                  <span style={{ color: INK3 }}>{chip.icon}</span>{chip.text}
                </span>
              ))}
            </div>

            {stack && (
              <div className="flex flex-col gap-2.5 mt-5">
                <Btn>{c.ctaPrimary} →</Btn>
                <Btn ghost><Play className="w-3.5 h-3.5" /> {t('Preview', 'معاينة')}</Btn>
              </div>
            )}

            {/* slim stats strip */}
            <div className="flex items-center gap-6 mt-6 pt-5" style={{ borderTop: `1px solid ${line}` }}>
              {[[c.members, t('Members', 'أعضاء')], [c.online, t('Online', 'متصل')], [c.admins, t('Admins', 'مشرفون')], [c.lessons, t('Lessons', 'دروس')]].map(([v, l], i) => (
                <div key={i}>
                  <div className="text-[18px] font-extrabold" style={{ color: INK }}>{v}</div>
                  <div className="text-[11px] font-medium" style={{ color: INK3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    /* ── HIGHLIGHTS ── */
    case 'highlights':
      return (
        <div className={pad} style={{ background: secBg }}>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(${cols3}, 1fr)` }}>
            {[
              { Icon: BookOpen, title: t('Structured courses', 'دورات منظّمة'), desc: t('One clear path from zero to pro.', 'مسار واضح من الصفر للاحتراف.') },
              { Icon: MessageSquare, title: t('Active community', 'مجتمع نشِط'), desc: t('Get feedback and stay accountable.', 'احصل على ملاحظات وابقَ ملتزماً.') },
              { Icon: Calendar, title: t('Live sessions', 'جلسات مباشرة'), desc: t('Weekly calls and challenges.', 'مكالمات وتحديات أسبوعية.') },
            ].map((h, i) => (
              <div key={i} className="p-5" style={{ background: '#fff', border: `1px solid ${line}`, borderRadius: radius }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: `${accent}15` }}>
                  <h.Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <p className="text-[15px] font-bold" style={{ color: INK }}>{h.title}</p>
                <p className="text-[13px] mt-1 leading-snug" style={{ color: INK3 }}>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )

    /* ── ABOUT ── */
    case 'about':
      return (
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('About', 'حول')} />
          <H>{t('What this community is about', 'عن ماذا يدور هذا المجتمع')}</H>
          <div className="mt-3.5 flex flex-col gap-3 leading-relaxed" style={{ color: INK2, fontSize: 14.5, maxWidth: 660 }}>
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
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('Inside', 'بالداخل')} />
          <H>{t("What's inside", 'ماذا بالداخل')}</H>
          <p className="text-[13px] mt-1.5 mb-5" style={{ color: INK3 }}>{secs.length} {t('modules', 'وحدات')} · {c.lessons} {t('lessons', 'درس')}</p>
          <div className="flex flex-col gap-2.5">
            {secs.map((s, i) => (
              <div key={i} className="overflow-hidden" style={{ background: '#fff', border: `1px solid ${line}`, borderRadius: radius }}>
                <button onClick={() => setOpenSec(openSec === i ? null : i)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: `${accent}18`, color: accent }}>{i + 1}</span>
                  <span className="flex-1 text-[13.5px] font-semibold" style={{ color: INK }}>{s.title}</span>
                  <span className="text-[11px]" style={{ color: INK3 }}>{s.chapters.length} {t('lessons', 'درس')}</span>
                  <span className="text-[11px] transition-transform" style={{ color: INK3, transform: openSec === i ? 'rotate(90deg)' : 'none' }}>▶</span>
                </button>
                {openSec === i && (
                  <div className="pb-1.5">
                    {s.chapters.map((ch, j) => (
                      <div key={j} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px]" style={{ color: INK2, borderTop: `1px solid ${line}` }}>
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
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('Your host', 'مضيفك')} />
          <div className="flex gap-5 mt-4 p-6" style={{ background: '#fff', border: `1px solid ${line}`, borderRadius: radius, flexDirection: stack ? 'column' : 'row', alignItems: stack ? 'flex-start' : 'center' }}>
            <div className="rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shrink-0" style={{ background: grad, width: 72, height: 72 }}>
              {c.creatorName.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-[17px] font-bold" style={{ color: INK }}>{c.creatorName}</p>
              <p className="text-[13px]" style={{ color: INK3 }}>{c.creatorRole}</p>
              <p className="text-[13.5px] leading-relaxed mt-2.5" style={{ color: INK2 }}>{c.creatorBio}</p>
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
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('Members', 'الأعضاء')} />
          <H>{t('Loved by members', 'محبوب من الأعضاء')}</H>
          <div className="flex items-center gap-2 mt-2.5 mb-5"><Stars n={Number(c.rating)} size={15} /><span className="text-[13px] font-semibold" style={{ color: INK }}>{c.rating}</span><span className="text-[12px]" style={{ color: INK3 }}>· {c.reviews} {t('reviews', 'مراجعة')}</span></div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(${cols3}, 1fr)` }}>
            {revs.map((r, i) => (
              <div key={i} className="p-5" style={{ background: '#fff', border: `1px solid ${line}`, borderRadius: radius }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: r.bg, color: r.tc }}>{r.av}</div>
                  <div><p className="text-[13px] font-bold" style={{ color: INK }}>{r.name}</p><Stars n={r.r} size={11} /></div>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: INK2 }}>{r.text}</p>
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
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('Membership', 'العضوية')} />
          <H>{t('Choose your access', 'اختر وصولك')}</H>
          <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: `repeat(${cols3}, 1fr)`, alignItems: 'start' }}>
            {tiers.map((tr, i) => (
              <div key={i} className="p-5 relative" style={{ background: tr.hi ? '#fff' : '#fff', border: `${tr.hi ? 2 : 1}px solid ${tr.hi ? accent : line}`, borderRadius: radius, boxShadow: tr.hi ? `0 14px 34px ${accent}22` : 'none' }}>
                {tr.hi && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: grad }}>{t('MOST POPULAR', 'الأكثر شيوعاً')}</span>}
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
                <button className="w-full text-[13px] font-bold text-white" style={tr.hi ? { background: grad, borderRadius: btnR, height: 42 } : { background: '#fff', color: INK, border: `1px solid ${line}`, borderRadius: btnR, height: 42 }}>{tr.cta}</button>
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
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('FAQ', 'الأسئلة')} />
          <H>{t('Common questions', 'الأسئلة الشائعة')}</H>
          <div className="flex flex-col gap-2.5 mt-5">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden" style={{ background: '#fff', border: `1px solid ${line}`, borderRadius: radius }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
                  <span className="text-[14px] font-semibold" style={{ color: INK }}>{f.q}</span>
                  <span className="text-[17px] transition-transform shrink-0" style={{ color: openFaq === i ? accent : INK3, transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-[13px] leading-relaxed" style={{ color: INK2, borderTop: `1px solid ${line}`, paddingTop: 12 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    /* ── JOIN CTA ── */
    case 'cta':
      return (
        <div className={pad} style={{ background: secBg }}>
          <div className="relative overflow-hidden text-center px-6 py-11" style={{ background: grad, borderRadius: radius }}>
            <div className="absolute rounded-full" style={{ width: 340, height: 240, background: '#fff', opacity: 0.08, top: -80, left: '50%', transform: 'translateX(-50%)' }} />
            <div className="relative">
              <h2 className="font-extrabold tracking-tight text-white" style={{ fontSize: mob ? 23 : 29 }}>{t('Ready to join', 'جاهز للانضمام')} {c.name}?</h2>
              <p className="mt-2 text-[14.5px]" style={{ color: 'rgba(255,255,255,.8)' }}>{t('Join', 'انضم إلى')} {c.members}+ {t('members already leveling up.', 'عضو يتطوّرون الآن.')}</p>
              <button className="mt-6 px-8 text-[14px] font-bold hover:opacity-90" style={{ background: '#fff', color: accent, borderRadius: btnR, height: 48 }}>{c.ctaPrimary} →</button>
              <p className="mt-3 text-[12px]" style={{ color: 'rgba(255,255,255,.7)' }}>🔒 {t('Cancel anytime', 'إلغاء في أي وقت')}</p>
            </div>
          </div>
        </div>
      )

    /* ── FOOTER ── */
    case 'footer':
      return (
        <div className="px-10 py-6 flex flex-wrap items-center justify-between gap-3" style={{ background: secBg, borderTop: `1px solid ${line}` }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white" style={{ background: grad }}>Ch</div>
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
