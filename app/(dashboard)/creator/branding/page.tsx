'use client'

import { useRef, useState, useEffect } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, ArrowLeft,
  Blocks, Type, Palette, Star, Play, Check, Monitor,
  Tablet, Smartphone, Save, Rocket, Lock, Users, Trash2,
  Sparkles, MessageSquare, BookOpen, Calendar, ImageIcon,
  Plus, Code, ExternalLink, Video, ShoppingBag, Zap, Ticket,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   Community Landing Page Builder
   Nas.io-style hero · media gallery · Home + Products pages
═══════════════════════════════════════════════════════════ */

type Device = 'desktop' | 'tablet' | 'mobile'
type PageId = 'home' | 'products'
type BlockType =
  | 'hero' | 'highlights' | 'about' | 'curriculum'
  | 'creator' | 'testimonials' | 'pricing' | 'faq' | 'cta' | 'footer' | 'custom'

const FONTS = [
  { id: 'Montserrat',      label: 'Montserrat' },
  { id: 'Inter',           label: 'Inter' },
  { id: 'Poppins',         label: 'Poppins' },
  { id: 'DM Sans',         label: 'DM Sans' },
  { id: 'Space Grotesk',   label: 'Space Grotesk' },
  { id: 'Nunito',          label: 'Nunito' },
  { id: 'Playfair Display',label: 'Playfair' },
  { id: 'Oswald',          label: 'Oswald' },
]
const GF_URL = 'https://fonts.googleapis.com/css2?' + FONTS.map(f => `family=${f.id.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&') + '&display=swap'
const stack = (f: string) => `"${f}", ui-sans-serif, system-ui, sans-serif`

interface BlockDef {
  id: string
  type: BlockType
  label: { en: string; ar: string }
  desc: { en: string; ar: string }
  Icon: React.ElementType
  tint: string
  visible: boolean
  font?: string
  code?: string
}

const DEFAULT_BLOCKS: BlockDef[] = [
  { id: 'hero',        type: 'hero',        label: { en: 'Hero',          ar: 'الواجهة' },  desc: { en: 'Title, media & profile',  ar: 'العنوان والوسائط' },   Icon: Rocket,        tint: '#8e78fb', visible: true },
  { id: 'highlights',  type: 'highlights',  label: { en: 'Highlights',    ar: 'المميزات' }, desc: { en: 'What members get',       ar: 'ما يحصل عليه الأعضاء' }, Icon: Sparkles,      tint: '#47c7ea', visible: true },
  { id: 'about',       type: 'about',       label: { en: 'About',         ar: 'حول' },      desc: { en: 'Describe the community', ar: 'وصف المجتمع' },        Icon: Type,          tint: '#52c41a', visible: true },
  { id: 'curriculum',  type: 'curriculum',  label: { en: "What's Inside", ar: 'المحتوى' },  desc: { en: 'Courses & modules',      ar: 'الدورات والوحدات' },   Icon: BookOpen,      tint: '#6c52f0', visible: true },
  { id: 'creator',     type: 'creator',     label: { en: 'Creator',       ar: 'المنشئ' },   desc: { en: 'About the host',         ar: 'عن المضيف' },          Icon: Users,         tint: '#ff9b28', visible: true },
  { id: 'testimonials',type: 'testimonials',label: { en: 'Testimonials',  ar: 'الشهادات' }, desc: { en: 'Member reviews',         ar: 'آراء الأعضاء' },       Icon: Star,          tint: '#e89000', visible: true },
  { id: 'pricing',     type: 'pricing',     label: { en: 'Pricing',       ar: 'السعر' },    desc: { en: 'One price & discount',   ar: 'سعر وخصم' },           Icon: Blocks,        tint: '#8e78fb', visible: true },
  { id: 'faq',         type: 'faq',         label: { en: 'FAQ',           ar: 'الأسئلة' },  desc: { en: 'Common questions',       ar: 'الأسئلة الشائعة' },    Icon: MessageSquare, tint: '#f65887', visible: true },
  { id: 'cta',         type: 'cta',         label: { en: 'Join CTA',      ar: 'دعوة الانضمام' }, desc: { en: 'Final invite',      ar: 'الدعوة الأخيرة' },     Icon: Rocket,        tint: '#8e78fb', visible: true },
  { id: 'footer',      type: 'footer',      label: { en: 'Footer',        ar: 'التذييل' },  desc: { en: 'Links & branding',       ar: 'الروابط' },            Icon: Blocks,        tint: '#9590b8', visible: true },
]

interface MediaItem { id: string; type: 'image' | 'video'; label: string }
const DEFAULT_MEDIA: MediaItem[] = [
  { id: 'm1', type: 'video', label: 'Intro video' },
  { id: 'm2', type: 'image', label: 'Community shot' },
  { id: 'm3', type: 'image', label: 'Results' },
]

type ProdKind = 'challenge' | 'event' | 'product' | 'session'
interface ProductItem {
  id: string; kind: ProdKind; title: string; desc: string
  price: string; meta: string; visible: boolean
}
const PROD_CONF: Record<ProdKind, { label: { en: string; ar: string }; bg: string; color: string; Icon: React.ElementType }> = {
  challenge: { label: { en: 'Challenge', ar: 'تحدي' },  bg: '#fff3e4', color: '#ff9b28', Icon: Zap },
  event:     { label: { en: 'Event',     ar: 'حدث' },   bg: '#ede9ff', color: '#6c52f0', Icon: Calendar },
  product:   { label: { en: 'Product',   ar: 'منتج' },  bg: '#e4f8fd', color: '#47c7ea', Icon: ShoppingBag },
  session:   { label: { en: 'Session',   ar: 'جلسة' },  bg: '#ffe4ee', color: '#f65887', Icon: Video },
}
const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'p1', kind: 'challenge', title: '7-Day Rigging Challenge', desc: 'Build a full character rig in one week with daily briefs and feedback.', price: '50', meta: '7 days · 24 joined', visible: true },
  { id: 'p2', kind: 'session',   title: 'Strategy Session 1-on-1', desc: 'A private 60-minute call to plan your motion career and portfolio.', price: '200', meta: '60 minutes · Video call', visible: true },
  { id: 'p3', kind: 'product',   title: 'Motion Presets Pack',      desc: '120 ready-to-use After Effects presets and transitions.', price: '75', meta: '340 downloads', visible: true },
  { id: 'p4', kind: 'event',     title: 'Live Portfolio Review',    desc: 'Monthly live event where we review member portfolios on stage.', price: 'free', meta: 'Apr 24 · Online', visible: true },
]

interface Review { id: string; name: string; initials: string; text: string; rating: number; hasImage: boolean }
const DEFAULT_REVIEWS: Review[] = [
  { id: 'r1', name: 'Amine Benali', initials: 'AB', rating: 5, hasImage: true,  text: 'Clear, real-world projects and a community that actually helps. Worth every dinar.' },
  { id: 'r2', name: 'Wyssem Neila', initials: 'WN', rating: 5, hasImage: true,  text: 'From zero to my first pro animation in 3 weeks. Perfectly structured.' },
  { id: 'r3', name: 'Sara Alaoui',  initials: 'SA', rating: 5, hasImage: false, text: 'The weekly challenges keep me practicing. Best community I joined.' },
]

interface Content {
  name: string; tagline: string; slug: string; access: string
  ctaPrimary: string; price: string; origPrice: string; currency: string; period: string
  members: string; online: string; admins: string
  rating: string; reviews: string; lessons: string
  creatorName: string; creatorRole: string; creatorBio: string
  productsTitle: string
}
const DEFAULT_CONTENT: Content = {
  name: 'Motion Masters',
  tagline: 'Master motion graphics & animation — from zero to pro, with a community that keeps you moving.',
  slug: 'motion-masters', access: 'Private',
  ctaPrimary: 'Join Community',
  price: '149', origPrice: '299', currency: 'TND', period: '/month',
  members: '1,240', online: '38', admins: '2',
  rating: '4.9', reviews: '89', lessons: '42',
  creatorName: 'Mohamed Ismail',
  creatorRole: 'Motion Designer & Community Host',
  creatorBio: 'Professional motion designer with 8+ years working with leading brands across MENA. I built this community to help the next generation of motion artists go from zero to portfolio-ready — together.',
  productsTitle: 'Everything available to members',
}

interface Design {
  accent: string; accent2: string
  bg: 'white' | 'tint' | 'gradient'
  headingFont: string; bodyFont: string
  radius: number; pill: boolean
  altSections: boolean; showProducts: boolean
}
const DEFAULT_DESIGN: Design = {
  accent: '#8e78fb', accent2: '#6c52f0', bg: 'tint',
  headingFont: 'Montserrat', bodyFont: 'Inter',
  radius: 16, pill: false, altSections: true, showProducts: true,
}

const E = { bg: '#ffffff', card: '#f6f5fb', card2: '#efedf8', bd: '#eceaf4', t1: '#1a1730', t2: '#46426a', t3: '#9590b8' }
const INK = '#1a1730', INK2 = '#46426a', INK3 = '#9590b8', LINE = '#ece9f6'

export default function BrandingPage() {
  const { lang } = useDashPrefs()
  const isAr = lang === 'ar'
  const t = (en: string, ar: string) => (isAr ? ar : en)

  const [blocks, setBlocks] = useState<BlockDef[]>(DEFAULT_BLOCKS)
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS)
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS)
  const [media, setMedia] = useState<MediaItem[]>(DEFAULT_MEDIA)
  const [tab, setTab] = useState<'blocks' | 'content' | 'design'>('blocks')
  const [content, setContent] = useState<Content>(DEFAULT_CONTENT)
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN)
  const [device, setDevice] = useState<Device>('desktop')
  const [page, setPage] = useState<PageId>('home')
  const [selected, setSelected] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [openSec, setOpenSec] = useState<number | null>(0)
  const [activeMedia, setActiveMedia] = useState(0)

  const dragFrom = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const secRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const accent = design.accent
  const set = <K extends keyof Content>(k: K, v: Content[K]) => setContent(c => ({ ...c, [k]: v }))
  const setD = <K extends keyof Design>(k: K, v: Design[K]) => setDesign(d => ({ ...d, [k]: v }))

  /* scroll selected block into view */
  useEffect(() => {
    if (!selected) return
    const el = secRefs.current[selected]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selected])

  /* ── block ops ── */
  const patchBlock = (id: string, p: Partial<BlockDef>) =>
    setBlocks(bs => bs.map(b => (b.id === id ? { ...b, ...p } : b)))
  const toggleBlock = (id: string) =>
    setBlocks(bs => bs.map(b => (b.id === id ? { ...b, visible: !b.visible } : b)))
  const removeBlock = (id: string) => {
    setBlocks(bs => bs.filter(b => b.id !== id))
    if (selected === id) setSelected(null)
  }
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= blocks.length) return
    setBlocks(bs => { const n = [...bs]; [n[i], n[j]] = [n[j], n[i]]; return n })
  }
  const addCustom = () => {
    const id = `custom-${Date.now()}`
    setBlocks(bs => [...bs, {
      id, type: 'custom',
      label: { en: 'Custom Block', ar: 'قسم مخصص' },
      desc: { en: 'Your own HTML', ar: 'HTML خاص بك' },
      Icon: Code, tint: '#14b8a6', visible: true,
      code: '<div style="padding:40px;text-align:center">\n  <h2 style="font-size:26px;font-weight:800">Your custom block</h2>\n  <p style="margin-top:8px;color:#666">Paste any HTML here.</p>\n</div>',
    }])
    setSelected(id); setTab('content')
  }

  /* ── robust HTML5 drag ── */
  const dragStart = (e: React.DragEvent, i: number) => {
    dragFrom.current = i
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', String(i)) } catch {}
  }
  const dragOverItem = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOver !== i) setDragOver(i)
  }
  const dropItem = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    let from = dragFrom.current
    if (from === null) { const d = e.dataTransfer.getData('text/plain'); from = d ? Number(d) : null }
    setDragOver(null); dragFrom.current = null
    if (from === null || Number.isNaN(from) || from === i) return
    setBlocks(bs => { const n = [...bs]; const [m] = n.splice(from!, 1); n.splice(i, 0, m); return n })
  }

  /* products drag */
  const pDragFrom = useRef<number | null>(null)
  const [pDragOver, setPDragOver] = useState<number | null>(null)
  const pDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    let from = pDragFrom.current
    if (from === null) { const d = e.dataTransfer.getData('text/plain'); from = d ? Number(d) : null }
    setPDragOver(null); pDragFrom.current = null
    if (from === null || Number.isNaN(from) || from === i) return
    setProducts(ps => { const n = [...ps]; const [m] = n.splice(from!, 1); n.splice(i, 0, m); return n })
  }

  const openPreview = () => window.open(`/communities/${content.slug}`, '_blank')

  const frameWidth = device === 'mobile' ? 400 : device === 'tablet' ? 760 : 1040
  const pageBg = design.bg === 'tint' ? '#faf9ff' : design.bg === 'gradient' ? '#fbfaff' : '#ffffff'
  const selBlock = blocks.find(b => b.id === selected) || null

  return (
    <>
      <link rel="stylesheet" href={GF_URL} />
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

            {/* ══════ EDITOR ══════ */}
            <div className="w-[310px] shrink-0 flex flex-col" style={{ background: E.bg, borderInlineEnd: `1px solid ${E.bd}` }} dir={isAr ? 'rtl' : 'ltr'}>

              <div className="px-4 py-3.5 flex items-center gap-2.5 shrink-0" style={{ borderBottom: `1px solid ${E.bd}` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg,${design.accent},${design.accent2})` }}>
                  <Palette className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold" style={{ color: E.t1 }}>{t('Page Builder', 'محرّر الصفحة')}</p>
                  <p className="text-[10px]" style={{ color: E.t3 }}>chabaqa.io/{content.slug}</p>
                </div>
              </div>

              {/* page switch */}
              <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${E.bd}` }}>
                <div className="flex gap-1 p-1 rounded-lg" style={{ background: E.card2 }}>
                  {([{ v: 'home', l: t('Home page', 'الرئيسية') }, { v: 'products', l: t('Products page', 'المنتجات') }] as const).map(o => (
                    <button key={o.v} onClick={() => setPage(o.v)} disabled={o.v === 'products' && !design.showProducts}
                      className="flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-40"
                      style={{ background: page === o.v ? '#fff' : 'transparent', color: page === o.v ? accent : E.t2, boxShadow: page === o.v ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
                      {o.l}
                    </button>
                  ))}
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

                {/* ── BLOCKS ── */}
                {tab === 'blocks' && page === 'home' && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 px-1" style={{ color: E.t3 }}>
                      {t('Click a block to edit · drag to reorder', 'انقر للتحرير · اسحب للترتيب')}
                    </p>
                    {blocks.map((b, i) => {
                      const isSel = selected === b.id
                      return (
                        <div key={b.id} draggable
                          onDragStart={e => dragStart(e, i)}
                          onDragOver={e => dragOverItem(e, i)}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={e => dropItem(e, i)}
                          onDragEnd={() => { setDragOver(null); dragFrom.current = null }}
                          onClick={() => { setSelected(b.id); setTab('content') }}
                          className="flex items-center gap-2 p-2 rounded-xl mb-1.5 cursor-pointer transition-all"
                          style={{
                            background: isSel ? `${accent}12` : E.card,
                            border: `1.5px solid ${isSel ? accent : dragOver === i ? accent : E.bd}`,
                            opacity: b.visible ? 1 : 0.5,
                            transform: dragOver === i ? 'scale(1.02)' : 'none',
                          }}>
                          <span onMouseDown={e => e.stopPropagation()} className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-3.5 h-3.5 shrink-0" style={{ color: '#c7c2dc' }} />
                          </span>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${b.tint}1f` }}>
                            <b.Icon className="w-3.5 h-3.5" style={{ color: b.tint }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold truncate" style={{ color: isSel ? accent : E.t1 }}>{b.label[lang]}</p>
                            <p className="text-[10px] truncate" style={{ color: E.t3 }}>{b.desc[lang]}</p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={e => { e.stopPropagation(); toggleBlock(b.id) }} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: E.card2, color: E.t2 }}>
                              {b.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                            <button onClick={e => { e.stopPropagation(); moveBlock(i, -1) }} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: E.card2, color: E.t2 }}><ArrowUp className="w-3 h-3" /></button>
                            <button onClick={e => { e.stopPropagation(); moveBlock(i, 1) }} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: E.card2, color: E.t2 }}><ArrowDown className="w-3 h-3" /></button>
                          </div>
                        </div>
                      )
                    })}
                    <button onClick={addCustom} className="w-full mt-2 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      style={{ background: `${accent}12`, color: accent, border: `1.5px dashed ${accent}55` }}>
                      <Plus className="w-3.5 h-3.5" /> {t('Add custom block', 'إضافة قسم مخصص')}
                    </button>
                  </div>
                )}

                {/* ── PRODUCTS page blocks ── */}
                {tab === 'blocks' && page === 'products' && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 px-1" style={{ color: E.t3 }}>
                      {t('Drag cards to reorder · eye to hide', 'اسحب لإعادة الترتيب')}
                    </p>
                    {products.map((p, i) => {
                      const cf = PROD_CONF[p.kind]
                      return (
                        <div key={p.id} draggable
                          onDragStart={e => { pDragFrom.current = i; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)) } catch {} }}
                          onDragOver={e => { e.preventDefault(); if (pDragOver !== i) setPDragOver(i) }}
                          onDragLeave={() => setPDragOver(null)}
                          onDrop={e => pDrop(e, i)}
                          onDragEnd={() => { setPDragOver(null); pDragFrom.current = null }}
                          className="flex items-center gap-2 p-2 rounded-xl mb-1.5 cursor-grab transition-all"
                          style={{ background: E.card, border: `1.5px solid ${pDragOver === i ? accent : E.bd}`, opacity: p.visible ? 1 : 0.5 }}>
                          <GripVertical className="w-3.5 h-3.5 shrink-0" style={{ color: '#c7c2dc' }} />
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cf.bg }}>
                            <cf.Icon className="w-3.5 h-3.5" style={{ color: cf.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold truncate" style={{ color: E.t1 }}>{p.title}</p>
                            <p className="text-[10px] truncate" style={{ color: E.t3 }}>{cf.label[lang]} · {p.price === 'free' ? t('Free', 'مجاني') : `${p.price} ${content.currency}`}</p>
                          </div>
                          <button onClick={() => setProducts(ps => ps.map(x => x.id === p.id ? { ...x, visible: !x.visible } : x))}
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: E.card2, color: E.t2 }}>
                            {p.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                          <button onClick={() => setProducts(ps => ps.filter(x => x.id !== p.id))}
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: '#fee2e2', color: '#dc2626' }}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    })}
                    <div className="mt-3 p-3 rounded-xl" style={{ background: E.card, border: `1px solid ${E.bd}` }}>
                      <p className="text-[11px] font-semibold mb-2" style={{ color: E.t2 }}>{t('Add a card', 'إضافة بطاقة')}</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['challenge', 'session', 'product', 'event'] as ProdKind[]).map(k => (
                          <button key={k} onClick={() => setProducts(ps => [...ps, {
                            id: `p${Date.now()}`, kind: k, visible: true,
                            title: `New ${PROD_CONF[k].label.en}`, desc: 'Describe this offer for your members.',
                            price: '0', meta: '—',
                          }])}
                            className="py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1"
                            style={{ background: PROD_CONF[k].bg, color: PROD_CONF[k].color }}>
                            <Plus className="w-3 h-3" /> {PROD_CONF[k].label[lang]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CONTENT ── */}
                {tab === 'content' && (
                  selBlock ? (
                    <BlockEditor block={selBlock} onBack={() => setSelected(null)} patch={patchBlock} remove={removeBlock}
                      content={content} set={set} media={media} setMedia={setMedia}
                      reviews={reviews} setReviews={setReviews} t={t} accent={accent} lang={lang} />
                  ) : (
                    <div className="pb-6">
                      <div className="px-4 pt-3">
                        <p className="text-[11px] leading-relaxed p-2.5 rounded-lg" style={{ background: `${accent}0e`, color: E.t2 }}>
                          {t('Tip: click any block in the Blocks tab to edit just that section.', 'انقر أي قسم في تبويب الأقسام لتحريره وحده.')}
                        </p>
                      </div>
                      <EditGroup title={t('Community', 'المجتمع')}>
                        <Field label={t('Name', 'الاسم')} value={content.name} onChange={v => set('name', v)} />
                        <Field label={t('Tagline', 'الوصف المختصر')} value={content.tagline} onChange={v => set('tagline', v)} textarea />
                        <Field label={t('URL slug', 'الرابط')} value={content.slug} onChange={v => set('slug', v)} prefix="chabaqa.io/" />
                        <div className="grid grid-cols-2 gap-2">
                          <Field label={t('Access', 'الوصول')} value={content.access} onChange={v => set('access', v)} />
                          <Field label={t('Join button', 'زر الانضمام')} value={content.ctaPrimary} onChange={v => set('ctaPrimary', v)} />
                        </div>
                      </EditGroup>
                      <EditGroup title={t('Price', 'السعر')}>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label={t('Price', 'السعر')} value={content.price} onChange={v => set('price', v)} />
                          <Field label={t('Was', 'قبل الخصم')} value={content.origPrice} onChange={v => set('origPrice', v)} />
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
                  )
                )}

                {/* ── DESIGN ── */}
                {tab === 'design' && (
                  <div className="pb-6">
                    <EditGroup title={t('Colors', 'الألوان')}>
                      <ColorControl label={t('Primary', 'الأساسي')} value={design.accent} onChange={v => setD('accent', v)} />
                      <ColorControl label={t('Gradient end', 'نهاية التدرج')} value={design.accent2} onChange={v => setD('accent2', v)} />
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {[['#8e78fb', '#6c52f0'], ['#f65887', '#c81e5b'], ['#47c7ea', '#2b8fc7'], ['#ff9b28', '#f5730a'], ['#52c41a', '#2f9e0e'], ['#1a1730', '#3a2f6e'], ['#0ea5e9', '#6366f1'], ['#ec4899', '#8b5cf6']].map(([a, b]) => (
                          <button key={a} onClick={() => setDesign(d => ({ ...d, accent: a, accent2: b }))}
                            className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                            style={{ background: `linear-gradient(135deg,${a},${b})`, outline: design.accent === a ? `2px solid ${a}` : 'none', outlineOffset: 2 }} />
                        ))}
                      </div>
                    </EditGroup>

                    <EditGroup title={t('Heading font', 'خط العناوين')}>
                      <FontPicker value={design.headingFont} onChange={v => setD('headingFont', v)} accent={accent} />
                    </EditGroup>
                    <EditGroup title={t('Body font', 'خط النصوص')}>
                      <FontPicker value={design.bodyFont} onChange={v => setD('bodyFont', v)} accent={accent} />
                    </EditGroup>

                    <EditGroup title={t('Background', 'الخلفية')}>
                      <Segmented value={design.bg} onChange={v => setD('bg', v as Design['bg'])} accent={accent}
                        options={[{ v: 'white', l: t('White', 'أبيض') }, { v: 'tint', l: t('Soft', 'ناعم') }, { v: 'gradient', l: t('Vivid', 'حيوي') }]} />
                    </EditGroup>

                    <EditGroup title={`${t('Corner radius', 'انحناء الحواف')} · ${design.radius}px`}>
                      <input type="range" min={0} max={26} value={design.radius} onChange={e => setD('radius', Number(e.target.value))} className="bld-range w-full" />
                    </EditGroup>

                    <EditGroup title={t('Buttons', 'الأزرار')}>
                      <Segmented value={design.pill ? 'pill' : 'rounded'} onChange={v => setD('pill', v === 'pill')} accent={accent}
                        options={[{ v: 'rounded', l: t('Rounded', 'دائري') }, { v: 'pill', l: t('Pill', 'كبسولة') }]} />
                    </EditGroup>

                    <EditGroup title={t('Pages & sections', 'الصفحات والأقسام')}>
                      <Toggle label={t('Show Products page', 'إظهار صفحة المنتجات')} on={design.showProducts} accent={accent}
                        onChange={v => { setD('showProducts', v); if (!v) setPage('home') }} />
                      <Toggle label={t('Alternate section shades', 'تبديل ألوان الأقسام')} on={design.altSections} accent={accent} onChange={v => setD('altSections', v)} />
                    </EditGroup>

                    <EditGroup title={t('Preview device', 'جهاز المعاينة')}>
                      <div className="flex gap-1.5">
                        {([{ id: 'desktop', Icon: Monitor, label: t('Desktop', 'حاسوب') }, { id: 'tablet', Icon: Tablet, label: t('Tablet', 'لوحي') }, { id: 'mobile', Icon: Smartphone, label: t('Mobile', 'جوال') }] as const).map(d => (
                          <button key={d.id} onClick={() => setDevice(d.id)} className="flex-1 py-2 rounded-lg flex flex-col items-center gap-1 text-[10px] font-semibold"
                            style={{ background: device === d.id ? `${accent}18` : E.card, color: device === d.id ? accent : E.t2, border: `1px solid ${device === d.id ? accent : E.bd}` }}>
                            <d.Icon className="w-4 h-4" />{d.label}
                          </button>
                        ))}
                      </div>
                    </EditGroup>
                  </div>
                )}
              </div>

              {/* actions */}
              <div className="p-3 shrink-0 flex flex-col gap-2" style={{ borderTop: `1px solid ${E.bd}` }}>
                <button onClick={openPreview} className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
                  style={{ background: '#fff', color: accent, border: `1.5px solid ${accent}55` }}>
                  <ExternalLink className="w-3.5 h-3.5" /> {t('Preview live page', 'معاينة الصفحة')}
                </button>
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5" style={{ background: E.card, color: E.t2 }}>
                    <Save className="w-3.5 h-3.5" /> {t('Save', 'حفظ')}
                  </button>
                  <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 text-white hover:opacity-90" style={{ background: `linear-gradient(135deg,${design.accent},${design.accent2})` }}>
                    <Rocket className="w-3.5 h-3.5" /> {t('Publish', 'نشر')}
                  </button>
                </div>
              </div>
            </div>

            {/* ══════ PREVIEW ══════ */}
            <div className="flex-1 flex flex-col min-w-0" style={{ background: '#edeef2' }}>
              <div className="h-11 px-4 flex items-center justify-between shrink-0" style={{ background: '#e3e2ea', borderBottom: '1px solid #d6d5df' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <div className="px-3 py-1 rounded-md text-[11px] font-mono max-w-[340px] truncate" style={{ background: '#fff', color: '#8a86a0', border: '1px solid #d6d5df' }}>
                  chabaqa.io/{content.slug}{page === 'products' ? '/products' : ''}
                </div>
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
                  style={{ maxWidth: frameWidth, background: pageBg, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 44px rgba(26,23,48,.12)', height: 'fit-content', border: '1px solid #e4e2ef', fontFamily: stack(design.bodyFont) }}
                  dir={isAr ? 'rtl' : 'ltr'}>

                  {page === 'home' ? (
                    blocks.filter(b => b.visible).map((b, idx) => (
                      <div key={b.id} ref={el => { secRefs.current[b.id] = el }}
                        style={selected === b.id ? { outline: `2px solid ${accent}`, outlineOffset: -2, position: 'relative' } : undefined}>
                        {selected === b.id && (
                          <span className="absolute z-10 text-[10px] font-bold text-white px-2 py-0.5 rounded" style={{ background: accent, top: 0, insetInlineStart: 0 }}>
                            {b.label[lang]}
                          </span>
                        )}
                        <Section id={b.id} block={b} c={content} design={design} device={device} isAr={isAr} t={t} index={idx}
                          media={media} activeMedia={activeMedia} setActiveMedia={setActiveMedia} reviews={reviews}
                          page={page} setPage={setPage}
                          openFaq={openFaq} setOpenFaq={setOpenFaq} openSec={openSec} setOpenSec={setOpenSec} />
                      </div>
                    ))
                  ) : (
                    <ProductsPage c={content} design={design} device={device} products={products.filter(p => p.visible)} t={t} page={page} setPage={setPage} />
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════ EDITOR PARTS ═══════════ */

function EditGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${E.bd}` }}>
      <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: E.t3 }}>{title}</h4>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, textarea, prefix, mono, rows }: {
  label: string; value: string; onChange: (v: string) => void
  textarea?: boolean; prefix?: string; mono?: boolean; rows?: number
}) {
  const cls = `w-full px-2.5 py-2 rounded-lg text-[12px] outline-none ${mono ? 'font-mono' : ''}`
  const style = { background: '#fff', border: `1px solid ${E.bd}`, color: E.t1 } as React.CSSProperties
  return (
    <div>
      <label className="block text-[11px] font-medium mb-1" style={{ color: E.t2 }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows ?? 3} className={cls + ' resize-none leading-relaxed'} style={style} />
        : prefix
          ? <div className="flex items-center rounded-lg overflow-hidden" style={style}>
              <span className="text-[11px] pl-2.5 shrink-0" style={{ color: E.t3 }}>{prefix}</span>
              <input value={value} onChange={e => onChange(e.target.value)} className="flex-1 px-1 py-2 text-[12px] outline-none bg-transparent" style={{ color: E.t1 }} />
            </div>
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

function Toggle({ label, on, onChange, accent }: { label: string; on: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[12px]" style={{ color: E.t2 }}>{label}</span>
      <button onClick={() => onChange(!on)} className="w-9 h-5 rounded-full relative transition-colors shrink-0" style={{ background: on ? accent : '#dcd8ec' }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ insetInlineStart: on ? 18 : 2 }} />
      </button>
    </label>
  )
}

function FontPicker({ value, onChange, accent }: { value: string; onChange: (v: string) => void; accent: string }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {FONTS.map(f => (
        <button key={f.id} onClick={() => onChange(f.id)} className="py-2 px-2 rounded-lg text-[12px] font-semibold truncate transition-colors"
          style={{ fontFamily: stack(f.id), background: value === f.id ? `${accent}15` : '#fff', color: value === f.id ? accent : E.t1, border: `1px solid ${value === f.id ? accent : E.bd}` }}>
          {f.label}
        </button>
      ))}
    </div>
  )
}

/* per-block editor */
function BlockEditor({ block, onBack, patch, remove, content, set, media, setMedia, reviews, setReviews, t, accent, lang }: {
  block: BlockDef; onBack: () => void
  patch: (id: string, p: Partial<BlockDef>) => void
  remove: (id: string) => void
  content: Content; set: <K extends keyof Content>(k: K, v: Content[K]) => void
  media: MediaItem[]; setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>
  reviews: Review[]; setReviews: React.Dispatch<React.SetStateAction<Review[]>>
  t: (en: string, ar: string) => string; accent: string; lang: 'en' | 'ar'
}) {
  return (
    <div className="pb-6">
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${E.bd}` }}>
        <button onClick={onBack} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: E.card, color: E.t2 }}>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-bold truncate" style={{ color: E.t1 }}>{block.label[lang]}</p>
          <p className="text-[10px]" style={{ color: E.t3 }}>{t('Editing this block', 'تحرير هذا القسم')}</p>
        </div>
        {block.type === 'custom' && (
          <button onClick={() => remove(block.id)} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <EditGroup title={t('Block font', 'خط القسم')}>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => patch(block.id, { font: undefined })} className="py-2 rounded-lg text-[11px] font-semibold"
            style={{ background: !block.font ? `${accent}15` : '#fff', color: !block.font ? accent : E.t1, border: `1px solid ${!block.font ? accent : E.bd}` }}>
            {t('Inherit', 'افتراضي')}
          </button>
          {FONTS.map(f => (
            <button key={f.id} onClick={() => patch(block.id, { font: f.id })} className="py-2 px-2 rounded-lg text-[11.5px] font-semibold truncate"
              style={{ fontFamily: stack(f.id), background: block.font === f.id ? `${accent}15` : '#fff', color: block.font === f.id ? accent : E.t1, border: `1px solid ${block.font === f.id ? accent : E.bd}` }}>
              {f.label}
            </button>
          ))}
        </div>
      </EditGroup>

      {block.type === 'custom' && (
        <EditGroup title={t('Custom HTML', 'كود HTML')}>
          <Field label={t('Paste your code', 'الصق الكود')} value={block.code ?? ''} onChange={v => patch(block.id, { code: v })} textarea rows={12} mono />
          <p className="text-[10px] leading-relaxed" style={{ color: E.t3 }}>
            {t('Inline HTML + styles are supported. Scripts are stripped for safety.', 'يدعم HTML والتنسيقات. تُزال السكربتات للأمان.')}
          </p>
        </EditGroup>
      )}

      {block.type === 'hero' && (
        <>
          <EditGroup title={t('Headline & profile', 'العنوان والملف')}>
            <Field label={t('Community name', 'اسم المجتمع')} value={content.name} onChange={v => set('name', v)} />
            <Field label={t('Tagline', 'الوصف')} value={content.tagline} onChange={v => set('tagline', v)} textarea />
            <Field label={t('Host name', 'اسم المضيف')} value={content.creatorName} onChange={v => set('creatorName', v)} />
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('Access', 'الوصول')} value={content.access} onChange={v => set('access', v)} />
              <Field label={t('Join button', 'زر الانضمام')} value={content.ctaPrimary} onChange={v => set('ctaPrimary', v)} />
            </div>
          </EditGroup>

          <EditGroup title={`${t('Media gallery', 'معرض الوسائط')} · ${media.length}`}>
            {media.map((m, i) => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: E.card, border: `1px solid ${E.bd}` }}>
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${accent}18`, color: accent }}>
                  {m.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                </div>
                <input value={m.label} onChange={e => setMedia(ms => ms.map(x => x.id === m.id ? { ...x, label: e.target.value } : x))}
                  className="flex-1 min-w-0 text-[12px] outline-none bg-transparent" style={{ color: E.t1 }} />
                <button onClick={() => setMedia(ms => ms.map(x => x.id === m.id ? { ...x, type: x.type === 'video' ? 'image' : 'video' } : x))}
                  className="text-[10px] font-semibold px-1.5 py-1 rounded shrink-0" style={{ background: E.card2, color: E.t2 }}>
                  {m.type === 'video' ? t('Video', 'فيديو') : t('Image', 'صورة')}
                </button>
                <button onClick={() => setMedia(ms => ms.filter(x => x.id !== m.id))} className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            <div className="flex gap-1.5">
              <button onClick={() => setMedia(ms => [...ms, { id: `m${Date.now()}`, type: 'video', label: 'New video' }])}
                className="flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1" style={{ background: `${accent}12`, color: accent, border: `1px dashed ${accent}55` }}>
                <Video className="w-3 h-3" /> {t('Add video', 'فيديو')}
              </button>
              <button onClick={() => setMedia(ms => [...ms, { id: `m${Date.now()}`, type: 'image', label: 'New image' }])}
                className="flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1" style={{ background: `${accent}12`, color: accent, border: `1px dashed ${accent}55` }}>
                <ImageIcon className="w-3 h-3" /> {t('Add image', 'صورة')}
              </button>
            </div>
            <p className="text-[10px]" style={{ color: E.t3 }}>{t('All media is 16:9 (1920×1080). One item hides the strip.', 'كل الوسائط 16:9. عنصر واحد يخفي الشريط.')}</p>
          </EditGroup>
        </>
      )}

      {block.type === 'pricing' && (
        <EditGroup title={t('Price & discount', 'السعر والخصم')}>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('Price', 'السعر')} value={content.price} onChange={v => set('price', v)} />
            <Field label={t('Was', 'قبل الخصم')} value={content.origPrice} onChange={v => set('origPrice', v)} />
            <Field label={t('Currency', 'العملة')} value={content.currency} onChange={v => set('currency', v)} />
            <Field label={t('Period', 'المدة')} value={content.period} onChange={v => set('period', v)} />
          </div>
        </EditGroup>
      )}

      {block.type === 'testimonials' && (
        <EditGroup title={`${t('Reviews', 'المراجعات')} · ${reviews.length}`}>
          {reviews.map(r => (
            <div key={r.id} className="p-2.5 rounded-lg flex flex-col gap-2" style={{ background: E.card, border: `1px solid ${E.bd}` }}>
              <div className="flex items-center gap-2">
                <input value={r.name} onChange={e => setReviews(rs => rs.map(x => x.id === r.id ? { ...x, name: e.target.value, initials: e.target.value.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() } : x))}
                  className="flex-1 min-w-0 text-[12px] font-semibold outline-none bg-transparent" style={{ color: E.t1 }} />
                <select value={r.rating} onChange={e => setReviews(rs => rs.map(x => x.id === r.id ? { ...x, rating: Number(e.target.value) } : x))}
                  className="text-[11px] rounded px-1 py-0.5 outline-none" style={{ background: '#fff', border: `1px solid ${E.bd}`, color: E.t2 }}>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}★</option>)}
                </select>
                <button onClick={() => setReviews(rs => rs.filter(x => x.id !== r.id))} className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <textarea value={r.text} rows={2} onChange={e => setReviews(rs => rs.map(x => x.id === r.id ? { ...x, text: e.target.value } : x))}
                className="w-full text-[11.5px] rounded-lg px-2 py-1.5 outline-none resize-none leading-relaxed" style={{ background: '#fff', border: `1px solid ${E.bd}`, color: E.t2 }} />
              <Toggle label={t('Show image', 'إظهار صورة')} on={r.hasImage} accent={accent}
                onChange={v => setReviews(rs => rs.map(x => x.id === r.id ? { ...x, hasImage: v } : x))} />
            </div>
          ))}
          <button onClick={() => setReviews(rs => [...rs, { id: `r${Date.now()}`, name: 'New member', initials: 'NM', rating: 5, hasImage: true, text: 'What this member says about your community.' }])}
            className="w-full py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1" style={{ background: `${accent}12`, color: accent, border: `1px dashed ${accent}55` }}>
            <Plus className="w-3 h-3" /> {t('Add review', 'إضافة مراجعة')}
          </button>
        </EditGroup>
      )}

      {block.type === 'creator' && (
        <EditGroup title={t('Creator', 'المنشئ')}>
          <Field label={t('Name', 'الاسم')} value={content.creatorName} onChange={v => set('creatorName', v)} />
          <Field label={t('Role', 'المسمّى')} value={content.creatorRole} onChange={v => set('creatorRole', v)} />
          <Field label={t('Bio', 'السيرة')} value={content.creatorBio} onChange={v => set('creatorBio', v)} textarea rows={5} />
        </EditGroup>
      )}

      {block.type === 'about' && (
        <EditGroup title={t('About', 'حول')}>
          <Field label={t('Tagline', 'الوصف')} value={content.tagline} onChange={v => set('tagline', v)} textarea rows={4} />
        </EditGroup>
      )}
    </div>
  )
}

/* ═══════════ PREVIEW ═══════════ */

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} width={size} height={size} className={i <= Math.round(n) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </span>
  )
}

function PageTabs({ page, setPage, design, accent, t }: { page: PageId; setPage: (p: PageId) => void; design: Design; accent: string; t: (en: string, ar: string) => string }) {
  const tabs: { id: PageId; l: string }[] = [{ id: 'home', l: t('Home', 'الرئيسية') }]
  if (design.showProducts) tabs.push({ id: 'products', l: t('Products', 'المنتجات') })
  return (
    <div className="flex justify-center gap-7" style={{ borderBottom: `1px solid ${LINE}` }}>
      {tabs.map(tb => (
        <button key={tb.id} onClick={() => setPage(tb.id)} className="pb-2.5 text-[14px] font-semibold transition-colors"
          style={{ color: page === tb.id ? INK : INK3, borderBottom: `2px solid ${page === tb.id ? INK : 'transparent'}`, marginBottom: -1 }}>
          {tb.l}
        </button>
      ))}
    </div>
  )
}

/* shared media frame — 16:9 */
function MediaFrame({ item, grad, radius, big }: { item: MediaItem; grad: string; radius: number; big?: boolean }) {
  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden" style={{ aspectRatio: '16/9', background: grad, borderRadius: radius }}>
      <div className="absolute rounded-full" style={{ width: 260, height: 260, background: '#fff', opacity: 0.08, top: -70, insetInlineEnd: 30 }} />
      {item.type === 'video' ? (
        <button className="rounded-full flex items-center justify-center relative" style={{ width: big ? 60 : 44, height: big ? 60 : 44, background: 'rgba(255,255,255,.94)', boxShadow: '0 6px 20px rgba(0,0,0,.22)' }}>
          <Play className="fill-current" style={{ width: big ? 22 : 16, height: big ? 22 : 16, color: '#1a1730' }} />
        </button>
      ) : (
        <ImageIcon className="relative" style={{ width: big ? 40 : 26, height: big ? 40 : 26, color: 'rgba(255,255,255,.85)' }} />
      )}
      <span className="absolute bottom-2 text-[10px] font-semibold px-2 py-0.5 rounded" style={{ insetInlineStart: 8, background: 'rgba(0,0,0,.45)', color: '#fff' }}>{item.label}</span>
    </div>
  )
}

interface SectionProps {
  id: string; block: BlockDef; c: Content; design: Design; device: Device; isAr: boolean; index: number
  media: MediaItem[]; activeMedia: number; setActiveMedia: (n: number) => void; reviews: Review[]
  page: PageId; setPage: (p: PageId) => void
  t: (en: string, ar: string) => string
  openFaq: number | null; setOpenFaq: (n: number | null) => void
  openSec: number | null; setOpenSec: (n: number | null) => void
}

function Section({ block, c, design, device, t, index, media, activeMedia, setActiveMedia, reviews, page, setPage, openFaq, setOpenFaq, openSec, setOpenSec }: SectionProps) {
  const { accent, accent2, radius, pill } = design
  const mob = device === 'mobile'
  const stackCol = device !== 'desktop'
  const cols3 = mob ? 1 : device === 'tablet' ? 2 : 3
  const pad = mob ? 'px-5 py-9' : device === 'tablet' ? 'px-7 py-10' : 'px-11 py-12'
  const btnR = pill ? 999 : Math.max(8, radius - 2)
  const grad = `linear-gradient(135deg,${accent},${accent2})`

  const softShade = design.bg === 'tint' ? '#f4f2fc' : design.bg === 'gradient' ? '#f6f3ff' : '#f7f7fb'
  const white = design.bg === 'white' ? '#fff' : design.bg === 'tint' ? '#fbfaff' : '#fff'
  const secBg = design.altSections && index % 2 === 1 ? softShade : white

  const bodyF = block.font ? stack(block.font) : stack(design.bodyFont)
  const headF = block.font ? stack(block.font) : stack(design.headingFont)

  const Eyebrow = ({ text }: { text: string }) => (
    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.09em] mb-2.5" style={{ color: accent }}>
      <span className="w-4 h-0.5 rounded-full" style={{ background: accent }} />{text}
    </div>
  )
  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="font-extrabold tracking-tight" style={{ color: INK, fontSize: mob ? 22 : 28, letterSpacing: '-0.02em', fontFamily: headF }}>{children}</h2>
  )

  const wrap = (node: React.ReactNode) => <div style={{ fontFamily: bodyF }}>{node}</div>

  switch (block.type) {

    /* ── HERO — Nas.io style ── */
    case 'hero': {
      const item = media[Math.min(activeMedia, Math.max(media.length - 1, 0))]
      return wrap(
        <div style={{ background: secBg }}>
          {/* headline ABOVE media */}
          <div className={mob ? 'px-5 pt-8 pb-4 text-center' : 'px-11 pt-11 pb-5 text-center'}>
            <h1 className="font-extrabold tracking-tight mx-auto" style={{ color: INK, fontSize: mob ? 27 : 38, letterSpacing: '-0.025em', lineHeight: 1.1, fontFamily: stack('Montserrat'), maxWidth: 760 }}>
              {c.name}
            </h1>
            <p className="mt-2.5 mx-auto leading-relaxed" style={{ color: INK2, fontSize: mob ? 14 : 15.5, maxWidth: 560 }}>{c.tagline}</p>
          </div>

          {/* media gallery 16:9 */}
          <div className={mob ? 'px-4' : 'px-8'}>
            {media.length > 0 && (
              <div className="relative">
                <MediaFrame item={item} grad={grad} radius={radius} big />
                {media.length > 1 && (
                  <span className="absolute text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ bottom: 8, insetInlineEnd: 8, background: 'rgba(0,0,0,.5)', color: '#fff' }}>
                    {Math.min(activeMedia + 1, media.length)}/{media.length}
                  </span>
                )}
              </div>
            )}
            {/* thumbnail strip only when >1 */}
            {media.length > 1 && (
              <div className="flex gap-2 mt-2.5">
                {media.map((m, i) => (
                  <button key={m.id} onClick={() => setActiveMedia(i)} className="flex-1 relative overflow-hidden transition-all"
                    style={{ aspectRatio: '16/9', borderRadius: Math.max(6, radius - 8), background: grad, opacity: i === activeMedia ? 1 : 0.45, outline: i === activeMedia ? `2px solid ${accent}` : 'none', outlineOffset: 1 }}>
                    <span className="absolute inset-0 flex items-center justify-center">
                      {m.type === 'video' ? <Play className="w-3.5 h-3.5 text-white fill-white" /> : <ImageIcon className="w-3.5 h-3.5 text-white" />}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* profile picture centered, overlapping */}
          <div className="flex flex-col items-center" style={{ marginTop: -30 }}>
            <div className="relative">
              <div className="rounded-2xl flex items-center justify-center text-xl font-extrabold text-white" style={{ background: grad, width: 64, height: 64, border: '4px solid #fff', boxShadow: '0 4px 16px rgba(26,23,48,.18)' }}>
                {c.name.charAt(0)}
              </div>
              <span className="absolute w-5 h-5 rounded-full flex items-center justify-center" style={{ bottom: -2, insetInlineEnd: -2, background: '#22b8f0', border: '2px solid #fff' }}>
                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
              </span>
            </div>

            {/* By + host avatar (small) */}
            <div className="flex items-center gap-1.5 mt-3">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: grad }}>
                {c.creatorName.charAt(0)}
              </span>
              <span className="text-[13px] font-medium" style={{ color: INK2 }}>{t('By', 'بواسطة')} {c.creatorName}</span>
            </div>

            {/* meta chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-3 px-5">
              {[
                { icon: <Lock className="w-3.5 h-3.5" />, text: c.access },
                { icon: <Users className="w-3.5 h-3.5" />, text: `${c.members} ${t('members', 'عضو')}` },
                { icon: <Ticket className="w-3.5 h-3.5" />, text: `${c.price} ${c.currency}${c.period}` },
                { icon: <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />, text: `${c.rating} (${c.reviews})` },
              ].map((chip, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#fff', color: INK2, border: `1px solid ${LINE}` }}>
                  <span style={{ color: INK3 }}>{chip.icon}</span>{chip.text}
                </span>
              ))}
            </div>

            <button className="mt-5 px-8 text-[14px] font-bold text-white hover:opacity-90" style={{ background: grad, borderRadius: btnR, height: 46, boxShadow: `0 8px 22px ${accent}3a` }}>
              {c.ctaPrimary}
            </button>
          </div>

          <div className={mob ? 'px-5 pt-7' : 'px-11 pt-8'}>
            <PageTabs page={page} setPage={setPage} design={design} accent={accent} t={t} />
          </div>
        </div>
      )
    }

    case 'highlights':
      return wrap(
        <div className={pad} style={{ background: secBg }}>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(${cols3}, 1fr)` }}>
            {[
              { Icon: BookOpen, title: t('Structured courses', 'دورات منظّمة'), desc: t('One clear path from zero to pro.', 'مسار واضح من الصفر للاحتراف.') },
              { Icon: MessageSquare, title: t('Active community', 'مجتمع نشِط'), desc: t('Get feedback and stay accountable.', 'احصل على ملاحظات وابقَ ملتزماً.') },
              { Icon: Calendar, title: t('Live sessions', 'جلسات مباشرة'), desc: t('Weekly calls and challenges.', 'مكالمات وتحديات أسبوعية.') },
            ].map((h, i) => (
              <div key={i} className="p-5 h-full" style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: radius }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: `${accent}15` }}>
                  <h.Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <p className="text-[15px] font-bold" style={{ color: INK, fontFamily: headF }}>{h.title}</p>
                <p className="text-[13px] mt-1 leading-snug" style={{ color: INK3 }}>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'about':
      return wrap(
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('About', 'حول')} />
          <H>{t('What this community is about', 'عن ماذا يدور هذا المجتمع')}</H>
          <div className="mt-3.5 flex flex-col gap-3 leading-relaxed" style={{ color: INK2, fontSize: 14.5, maxWidth: 660 }}>
            <p>{c.tagline}</p>
            <p>{t('Everything is beginner-friendly, in Arabic, and built around real projects you can show clients.', 'كل شيء مناسب للمبتدئين وبالعربية ومبني على مشاريع حقيقية تعرضها على العملاء.')}</p>
          </div>
        </div>
      )

    case 'curriculum': {
      const secs = [
        { title: t('Foundations — Motion & Timing', 'الأساسيات — الحركة والتوقيت'), chapters: [t('Intro to Motion Design', 'مقدمة'), t('The 12 Principles', 'المبادئ الـ12'), t('Keyframes & Timeline', 'الإطارات'), t('Easing & Graph Editor', 'التنعيم')] },
        { title: t('After Effects Essentials', 'أساسيات After Effects'), chapters: [t('Workspace Setup', 'الإعداد'), t('Layers, Masks & Shapes', 'الطبقات'), t('Text Animation', 'تحريك النص'), t('Effects & Presets', 'المؤثرات')] },
        { title: t('Intermediate Animation', 'التحريك المتوسط'), chapters: [t('Character Rigging', 'الريغينغ'), t('Walk Cycles', 'دورات المشي'), t('Portfolio Project', 'مشروع المعرض')] },
      ]
      return wrap(
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('Inside', 'بالداخل')} />
          <H>{t("What's inside", 'ماذا بالداخل')}</H>
          <p className="text-[13px] mt-1.5 mb-5" style={{ color: INK3 }}>{secs.length} {t('modules', 'وحدات')} · {c.lessons} {t('lessons', 'درس')}</p>
          <div className="flex flex-col gap-2.5">
            {secs.map((s, i) => (
              <div key={i} className="overflow-hidden" style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: radius }}>
                <button onClick={() => setOpenSec(openSec === i ? null : i)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: `${accent}18`, color: accent }}>{i + 1}</span>
                  <span className="flex-1 text-[13.5px] font-semibold" style={{ color: INK }}>{s.title}</span>
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

    case 'creator':
      return wrap(
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('Your host', 'مضيفك')} />
          <div className="flex gap-5 mt-4 p-6" style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: radius, flexDirection: stackCol ? 'column' : 'row', alignItems: stackCol ? 'flex-start' : 'center' }}>
            <div className="rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white shrink-0" style={{ background: grad, width: 72, height: 72 }}>
              {c.creatorName.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-[17px] font-bold" style={{ color: INK, fontFamily: headF }}>{c.creatorName}</p>
              <p className="text-[13px]" style={{ color: INK3 }}>{c.creatorRole}</p>
              <p className="text-[13.5px] leading-relaxed mt-2.5" style={{ color: INK2 }}>{c.creatorBio}</p>
            </div>
          </div>
        </div>
      )

    /* ── TESTIMONIALS — equal card size + images ── */
    case 'testimonials':
      return wrap(
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('Members', 'الأعضاء')} />
          <H>{t('Loved by members', 'محبوب من الأعضاء')}</H>
          <div className="flex items-center gap-2 mt-2.5 mb-5">
            <Stars n={Number(c.rating)} size={15} />
            <span className="text-[13px] font-semibold" style={{ color: INK }}>{c.rating}</span>
            <span className="text-[12px]" style={{ color: INK3 }}>· {c.reviews} {t('reviews', 'مراجعة')}</span>
          </div>
          <div className="grid gap-3.5 items-stretch" style={{ gridTemplateColumns: `repeat(${cols3}, 1fr)` }}>
            {reviews.map(r => (
              <div key={r.id} className="p-5 flex flex-col h-full" style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: radius }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: `${accent}18`, color: accent }}>{r.initials}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: INK }}>{r.name}</p>
                    <Stars n={r.rating} size={11} />
                  </div>
                </div>
                {r.hasImage && (
                  <div className="w-full flex items-center justify-center mb-3" style={{ aspectRatio: '16/9', background: `linear-gradient(135deg,${accent}14,${accent}08)`, borderRadius: Math.max(8, radius - 6), border: `1px solid ${LINE}` }}>
                    <ImageIcon className="w-6 h-6" style={{ color: `${accent}88` }} />
                  </div>
                )}
                <p className="text-[13px] leading-relaxed" style={{ color: INK2 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )

    /* ── PRICING — one price + discount ── */
    case 'pricing': {
      const p = Number(c.price) || 0, o = Number(c.origPrice) || 0
      const off = o > p && o > 0 ? Math.round(((o - p) / o) * 100) : 0
      return wrap(
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('Membership', 'العضوية')} />
          <H>{t('One simple price', 'سعر واحد بسيط')}</H>
          <div className="mt-6 mx-auto p-6 relative overflow-hidden" style={{ maxWidth: 460, background: '#fff', border: `2px solid ${accent}`, borderRadius: radius, boxShadow: `0 16px 40px ${accent}22` }}>
            {off > 0 && (
              <span className="absolute text-[11px] font-extrabold text-white px-3 py-1" style={{ top: 14, insetInlineEnd: -28, background: '#f65887', transform: 'rotate(38deg)', width: 120, textAlign: 'center' }}>
                -{off}%
              </span>
            )}
            <p className="text-[13px] font-bold" style={{ color: accent }}>{t('Full membership', 'العضوية الكاملة')}</p>
            <div className="flex items-end gap-2.5 mt-2">
              <span className="font-extrabold leading-none" style={{ color: INK, fontSize: 44, fontFamily: headF }}>{c.price}</span>
              <div className="pb-1.5">
                <span className="text-[13px] font-semibold" style={{ color: INK2 }}>{c.currency}{c.period}</span>
                {off > 0 && <span className="text-[13px] line-through ms-2" style={{ color: INK3 }}>{c.origPrice}</span>}
              </div>
            </div>
            {off > 0 && (
              <p className="text-[12px] font-semibold mt-1.5" style={{ color: '#16a34a' }}>
                {t('You save', 'توفّر')} {o - p} {c.currency} — {t('limited offer', 'عرض محدود')}
              </p>
            )}
            <div className="flex flex-col gap-2.5 my-5 pt-4" style={{ borderTop: `1px solid ${LINE}` }}>
              {[
                `${t('All', 'كل')} ${c.lessons} ${t('lessons', 'درس')}`,
                t('Live sessions & challenges', 'جلسات وتحديات'),
                t('Feedback on your work', 'ملاحظات على عملك'),
                t('Certificate of completion', 'شهادة إتمام'),
                t('Cancel anytime', 'إلغاء في أي وقت'),
              ].map((f, j) => (
                <div key={j} className="flex items-start gap-2.5 text-[13px]" style={{ color: INK2 }}>
                  <span className="w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${accent}18`, width: 18, height: 18 }}>
                    <Check className="w-2.5 h-2.5" style={{ color: accent }} strokeWidth={3} />
                  </span>{f}
                </div>
              ))}
            </div>
            <button className="w-full text-[14px] font-bold text-white hover:opacity-90" style={{ background: grad, borderRadius: btnR, height: 48 }}>{c.ctaPrimary}</button>
          </div>
        </div>
      )
    }

    case 'faq': {
      const faqs = [
        { q: t('How long do I have access?', 'كم مدة الوصول؟'), a: t('As long as your membership is active, everything is yours — including updates.', 'طالما عضويتك فعّالة، كل شيء لك — مع التحديثات.') },
        { q: t('Do I need experience?', 'هل أحتاج خبرة؟'), a: t('No. We start from zero and guide you through setup in the first lessons.', 'لا. نبدأ من الصفر ونرشدك في الدروس الأولى.') },
        { q: t('What language is it in?', 'ما اللغة؟'), a: t('Arabic, with resources in both Arabic and French.', 'العربية، مع مصادر بالعربية والفرنسية.') },
        { q: t('Can I cancel anytime?', 'هل يمكنني الإلغاء؟'), a: t('Yes — cancel in one click, no questions asked.', 'نعم — إلغاء بنقرة واحدة دون أسئلة.') },
      ]
      return wrap(
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('FAQ', 'الأسئلة')} />
          <H>{t('Common questions', 'الأسئلة الشائعة')}</H>
          <div className="flex flex-col gap-2.5 mt-5">
            {faqs.map((f, i) => (
              <div key={i} className="overflow-hidden" style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: radius }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left">
                  <span className="text-[14px] font-semibold" style={{ color: INK }}>{f.q}</span>
                  <span className="text-[17px] transition-transform shrink-0" style={{ color: openFaq === i ? accent : INK3, transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && <div className="px-4 pb-4 text-[13px] leading-relaxed" style={{ color: INK2, borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'cta':
      return wrap(
        <div className={pad} style={{ background: secBg }}>
          <div className="relative overflow-hidden text-center px-6 py-11" style={{ background: grad, borderRadius: radius }}>
            <div className="absolute rounded-full" style={{ width: 340, height: 240, background: '#fff', opacity: 0.08, top: -80, left: '50%', transform: 'translateX(-50%)' }} />
            <div className="relative">
              <h2 className="font-extrabold tracking-tight text-white" style={{ fontSize: mob ? 23 : 29, fontFamily: headF }}>{t('Ready to join', 'جاهز للانضمام')} {c.name}?</h2>
              <p className="mt-2 text-[14.5px]" style={{ color: 'rgba(255,255,255,.85)' }}>{t('Join', 'انضم إلى')} {c.members}+ {t('members already leveling up.', 'عضو يتطوّرون الآن.')}</p>
              <button className="mt-6 px-8 text-[14px] font-bold hover:opacity-90" style={{ background: '#fff', color: accent, borderRadius: btnR, height: 48 }}>{c.ctaPrimary}</button>
            </div>
          </div>
        </div>
      )

    case 'footer':
      return wrap(
        <div className="px-10 py-6 flex flex-wrap items-center justify-between gap-3" style={{ background: secBg, borderTop: `1px solid ${LINE}` }}>
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

    /* ── CUSTOM ── */
    case 'custom': {
      const safe = (block.code ?? '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/ on\w+="[^"]*"/gi, '')
      return (
        <div style={{ background: secBg, fontFamily: bodyF }} dangerouslySetInnerHTML={{ __html: safe }} />
      )
    }

    default:
      return null
  }
}

/* ═══════════ PRODUCTS PAGE ═══════════ */

function ProductsPage({ c, design, device, products, t, page, setPage }: {
  c: Content; design: Design; device: Device; products: ProductItem[]
  t: (en: string, ar: string) => string; page: PageId; setPage: (p: PageId) => void
}) {
  const { accent, accent2, radius, pill } = design
  const mob = device === 'mobile'
  const btnR = pill ? 999 : Math.max(8, radius - 2)
  const grad = `linear-gradient(135deg,${accent},${accent2})`
  const pad = mob ? 'px-5 py-8' : 'px-11 py-10'

  return (
    <div style={{ fontFamily: stack(design.bodyFont), background: design.bg === 'white' ? '#fff' : '#fbfaff' }}>
      <div className={mob ? 'px-5 pt-8' : 'px-11 pt-10'}>
        <h1 className="font-extrabold tracking-tight text-center" style={{ color: INK, fontSize: mob ? 25 : 32, fontFamily: stack('Montserrat') }}>{c.name}</h1>
        <p className="text-center text-[14px] mt-2" style={{ color: INK3 }}>{c.productsTitle}</p>
        <div className="mt-6">
          <PageTabs page={page} setPage={setPage} design={design} accent={accent} t={t} />
        </div>
      </div>

      <div className={pad}>
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: '#d8d4ea' }} />
            <p className="text-[14px] font-semibold" style={{ color: INK2 }}>{t('No products yet', 'لا توجد منتجات')}</p>
            <p className="text-[12.5px] mt-1" style={{ color: INK3 }}>{t('Add cards from the builder.', 'أضف بطاقات من المحرّر.')}</p>
          </div>
        ) : (
          <div className="overflow-hidden" style={{ border: `1px solid ${LINE}`, background: '#fff', borderRadius: radius }}>
            {products.map((p, i) => {
              const cf = PROD_CONF[p.kind]
              return (
                <div key={p.id} className={`flex gap-5 p-5 ${mob ? 'flex-col' : ''}`} style={{ borderTop: i === 0 ? 'none' : `1px solid ${LINE}` }}>
                  {/* thumbnail — same size as community cards */}
                  <div className="shrink-0 flex items-center justify-center" style={{ width: mob ? '100%' : 220, height: mob ? 150 : 124, background: '#f7f7fe', borderRadius: Math.max(8, radius - 4) }}>
                    <cf.Icon className="w-9 h-9" style={{ color: '#c4b8fd' }} />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: cf.bg, color: cf.color }}>{cf.label.en}</span>
                      <h3 className="text-base font-bold mt-2 truncate" style={{ color: INK }}>{p.title}</h3>
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: INK3 }}>{p.desc}</p>
                      <p className="text-sm mt-2" style={{ color: INK3 }}>{p.meta}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3 gap-3">
                      <span className="text-lg font-bold" style={{ color: accent }}>
                        {p.price === 'free' || p.price === '0'
                          ? t('Free', 'مجاني')
                          : <>{p.price} <span className="text-sm font-medium">{c.currency}</span></>}
                      </span>
                      <button className="px-5 text-sm font-semibold text-white shrink-0" style={{ background: grad, borderRadius: btnR, height: 40 }}>
                        {p.kind === 'session' ? t('Book', 'احجز') : p.kind === 'event' ? t('RSVP', 'سجّل') : p.kind === 'challenge' ? t('Join', 'انضم') : t('Buy', 'اشترِ')}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
