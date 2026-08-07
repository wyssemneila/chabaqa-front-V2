'use client'

import {
  Star, Play, Check, Lock, Users, ImageIcon, Ticket,
  BookOpen, Calendar, MessageSquare, ShoppingBag, Zap, Video,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════════
   Shared landing-page renderer — used by the builder preview
   and by the standalone /creator/branding/preview page.
═══════════════════════════════════════════════════════════ */

export const LANDING_DRAFT_KEY = 'chabaqa_landing_draft'

export type Device = 'desktop' | 'tablet' | 'mobile'
export type PageId = 'home' | 'products'
export type BlockType =
  | 'hero' | 'highlights' | 'about' | 'curriculum'
  | 'creator' | 'testimonials' | 'pricing' | 'faq' | 'cta' | 'footer' | 'custom'

export const FONTS = [
  { id: 'Montserrat', label: 'Montserrat' },
  { id: 'Inter', label: 'Inter' },
  { id: 'Poppins', label: 'Poppins' },
  { id: 'DM Sans', label: 'DM Sans' },
  { id: 'Space Grotesk', label: 'Space Grotesk' },
  { id: 'Nunito', label: 'Nunito' },
  { id: 'Playfair Display', label: 'Playfair' },
  { id: 'Oswald', label: 'Oswald' },
]
export const GF_URL =
  'https://fonts.googleapis.com/css2?' +
  FONTS.map(f => `family=${f.id.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&') +
  '&display=swap'
export const stack = (f: string) => `"${f}", ui-sans-serif, system-ui, sans-serif`

export interface BlockDef {
  id: string
  type: BlockType
  label: { en: string; ar: string }
  desc: { en: string; ar: string }
  tint: string
  visible: boolean
  font?: string
  code?: string
}

export interface MediaItem {
  id: string
  type: 'image' | 'video'
  label: string
  /** data-URL for uploaded images */
  src?: string
  /** YouTube / Vimeo URL for videos */
  url?: string
}

export type ProdKind = 'challenge' | 'event' | 'product' | 'session'

export interface ProductItem {
  id: string; kind: ProdKind; title: string; desc: string
  price: string; meta: string; visible: boolean
}

export interface Review {
  id: string; name: string; initials: string; text: string
  rating: number; hasImage: boolean; image?: string
}

export interface Content {
  name: string; tagline: string; slug: string; access: string
  ctaPrimary: string; price: string; origPrice: string; currency: string; period: string
  members: string; online: string; admins: string
  rating: string; reviews: string; lessons: string
  creatorName: string; creatorRole: string; creatorBio: string
  productsTitle: string
}

export interface Design {
  accent: string; accent2: string
  bg: 'white' | 'tint' | 'gradient'
  headingFont: string; bodyFont: string
  radius: number; pill: boolean
  altSections: boolean; showProducts: boolean
}

export interface LandingDraft {
  blocks: BlockDef[]
  products: ProductItem[]
  reviews: Review[]
  media: MediaItem[]
  content: Content
  design: Design
}

/* ── icon lookup (kept out of state so the draft stays JSON-safe) ── */
const BLOCK_ICON: Record<BlockType, React.ElementType> = {
  hero: Play, highlights: Star, about: MessageSquare, curriculum: BookOpen,
  creator: Users, testimonials: Star, pricing: Ticket, faq: MessageSquare,
  cta: Play, footer: BookOpen, custom: MessageSquare,
}
export const blockIcon = (t: BlockType) => BLOCK_ICON[t]

export const PROD_CONF: Record<ProdKind, { label: { en: string; ar: string }; bg: string; color: string; Icon: React.ElementType }> = {
  challenge: { label: { en: 'Challenge', ar: 'تحدي' }, bg: '#fff3e4', color: '#ff9b28', Icon: Zap },
  event: { label: { en: 'Event', ar: 'حدث' }, bg: '#ede9ff', color: '#6c52f0', Icon: Calendar },
  product: { label: { en: 'Product', ar: 'منتج' }, bg: '#e4f8fd', color: '#47c7ea', Icon: ShoppingBag },
  session: { label: { en: 'Session', ar: 'جلسة' }, bg: '#ffe4ee', color: '#f65887', Icon: Video },
}

export const INK = '#1a1730', INK2 = '#46426a', INK3 = '#9590b8', LINE = '#ece9f6'

/* ── media helpers ── */
export function ytId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/)
  return m ? m[1] : null
}
export function mediaThumb(m: MediaItem): string | null {
  if (m.type === 'image' && m.src) return m.src
  if (m.type === 'video' && m.url) {
    const id = ytId(m.url)
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  }
  return null
}

/* ═══════════════ DEFAULTS ═══════════════ */

export const DEFAULT_BLOCKS: BlockDef[] = [
  { id: 'hero', type: 'hero', label: { en: 'Hero', ar: 'الواجهة' }, desc: { en: 'Title, media & profile', ar: 'العنوان والوسائط' }, tint: '#8e78fb', visible: true },
  { id: 'highlights', type: 'highlights', label: { en: 'Highlights', ar: 'المميزات' }, desc: { en: 'What members get', ar: 'ما يحصل عليه الأعضاء' }, tint: '#47c7ea', visible: true },
  { id: 'about', type: 'about', label: { en: 'About', ar: 'حول' }, desc: { en: 'Describe the community', ar: 'وصف المجتمع' }, tint: '#52c41a', visible: true },
  { id: 'curriculum', type: 'curriculum', label: { en: "What's Inside", ar: 'المحتوى' }, desc: { en: 'Courses & modules', ar: 'الدورات والوحدات' }, tint: '#6c52f0', visible: true },
  { id: 'creator', type: 'creator', label: { en: 'Creator', ar: 'المنشئ' }, desc: { en: 'About the host', ar: 'عن المضيف' }, tint: '#ff9b28', visible: true },
  { id: 'testimonials', type: 'testimonials', label: { en: 'Testimonials', ar: 'الشهادات' }, desc: { en: 'Member reviews', ar: 'آراء الأعضاء' }, tint: '#e89000', visible: true },
  { id: 'pricing', type: 'pricing', label: { en: 'Pricing', ar: 'السعر' }, desc: { en: 'One price & discount', ar: 'سعر وخصم' }, tint: '#8e78fb', visible: true },
  { id: 'faq', type: 'faq', label: { en: 'FAQ', ar: 'الأسئلة' }, desc: { en: 'Common questions', ar: 'الأسئلة الشائعة' }, tint: '#f65887', visible: true },
  { id: 'cta', type: 'cta', label: { en: 'Join CTA', ar: 'دعوة الانضمام' }, desc: { en: 'Final invite', ar: 'الدعوة الأخيرة' }, tint: '#8e78fb', visible: true },
  { id: 'footer', type: 'footer', label: { en: 'Footer', ar: 'التذييل' }, desc: { en: 'Links & branding', ar: 'الروابط' }, tint: '#9590b8', visible: true },
]

export const DEFAULT_MEDIA: MediaItem[] = [
  { id: 'm1', type: 'video', label: 'Intro video' },
  { id: 'm2', type: 'image', label: 'Community shot' },
  { id: 'm3', type: 'image', label: 'Results' },
]

export const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'p1', kind: 'challenge', title: '7-Day Rigging Challenge', desc: 'Build a full character rig in one week with daily briefs and feedback.', price: '50', meta: '7 days · 24 joined', visible: true },
  { id: 'p2', kind: 'session', title: 'Strategy Session 1-on-1', desc: 'A private 60-minute call to plan your motion career and portfolio.', price: '200', meta: '60 minutes · Video call', visible: true },
  { id: 'p3', kind: 'product', title: 'Motion Presets Pack', desc: '120 ready-to-use After Effects presets and transitions.', price: '75', meta: '340 downloads', visible: true },
  { id: 'p4', kind: 'event', title: 'Live Portfolio Review', desc: 'Monthly live event where we review member portfolios on stage.', price: 'free', meta: 'Apr 24 · Online', visible: true },
]

export const DEFAULT_REVIEWS: Review[] = [
  { id: 'r1', name: 'Amine Benali', initials: 'AB', rating: 5, hasImage: true, text: 'Clear, real-world projects and a community that actually helps. Worth every dinar.' },
  { id: 'r2', name: 'Wyssem Neila', initials: 'WN', rating: 5, hasImage: true, text: 'From zero to my first pro animation in 3 weeks. Perfectly structured.' },
  { id: 'r3', name: 'Sara Alaoui', initials: 'SA', rating: 5, hasImage: false, text: 'The weekly challenges keep me practicing. Best community I joined.' },
]

export const DEFAULT_CONTENT: Content = {
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

export const DEFAULT_DESIGN: Design = {
  accent: '#8e78fb', accent2: '#6c52f0', bg: 'tint',
  headingFont: 'Montserrat', bodyFont: 'Inter',
  radius: 16, pill: false, altSections: true, showProducts: true,
}

export const DEFAULT_DRAFT: LandingDraft = {
  blocks: DEFAULT_BLOCKS, products: DEFAULT_PRODUCTS, reviews: DEFAULT_REVIEWS,
  media: DEFAULT_MEDIA, content: DEFAULT_CONTENT, design: DEFAULT_DESIGN,
}

/* ═══════════════ SMALL PARTS ═══════════════ */

export function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} width={size} height={size} className={i <= Math.round(n) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </span>
  )
}

function PageTabs({ page, setPage, design, t }: {
  page: PageId; setPage: (p: PageId) => void; design: Design; t: (en: string, ar: string) => string
}) {
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

/** 16:9 media frame — shows uploaded image / YouTube thumb, else a gradient placeholder */
function MediaFrame({ item, grad, radius, big }: { item: MediaItem; grad: string; radius: number; big?: boolean }) {
  const thumb = mediaThumb(item)
  return (
    <div className="relative w-full flex items-center justify-center overflow-hidden"
      style={{
        aspectRatio: '16/9', borderRadius: radius,
        background: thumb ? `#000 center/cover no-repeat url(${thumb})` : grad,
      }}>
      {!thumb && <div className="absolute rounded-full" style={{ width: 220, height: 220, background: '#fff', opacity: 0.08, top: -60, insetInlineEnd: 24 }} />}
      {item.type === 'video' ? (
        <button className="rounded-full flex items-center justify-center relative"
          style={{ width: big ? 48 : 34, height: big ? 48 : 34, background: 'rgba(255,255,255,.94)', boxShadow: '0 6px 20px rgba(0,0,0,.22)' }}>
          <Play className="fill-current" style={{ width: big ? 17 : 12, height: big ? 17 : 12, color: '#1a1730' }} />
        </button>
      ) : !thumb ? (
        <ImageIcon className="relative" style={{ width: big ? 30 : 20, height: big ? 30 : 20, color: 'rgba(255,255,255,.85)' }} />
      ) : null}
      {item.label && (
        <span className="absolute bottom-2 text-[10px] font-semibold px-2 py-0.5 rounded"
          style={{ insetInlineStart: 8, background: 'rgba(0,0,0,.5)', color: '#fff' }}>{item.label}</span>
      )}
    </div>
  )
}

/* ═══════════════ SECTION ═══════════════ */

export interface SectionProps {
  block: BlockDef; c: Content; design: Design; device: Device; index: number
  media: MediaItem[]; activeMedia: number; setActiveMedia: (n: number) => void
  reviews: Review[]; page: PageId; setPage: (p: PageId) => void
  t: (en: string, ar: string) => string
  openFaq: number | null; setOpenFaq: (n: number | null) => void
  openSec: number | null; setOpenSec: (n: number | null) => void
}

export function Section({
  block, c, design, device, t, index, media, activeMedia, setActiveMedia,
  reviews, page, setPage, openFaq, setOpenFaq, openSec, setOpenSec,
}: SectionProps) {
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

  /* compact media column — Nas.io / Skool scale */
  const MEDIA_W = mob ? '100%' : device === 'tablet' ? 460 : 520

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

    /* ── HERO ── */
    case 'hero': {
      const item = media[Math.min(activeMedia, Math.max(media.length - 1, 0))]
      return wrap(
        <div style={{ background: secBg }}>
          <div className={mob ? 'px-5 pt-8 pb-4 text-center' : 'px-11 pt-10 pb-4 text-center'}>
            <h1 className="font-extrabold tracking-tight mx-auto"
              style={{ color: INK, fontSize: mob ? 25 : 32, letterSpacing: '-0.025em', lineHeight: 1.12, fontFamily: stack('Montserrat'), maxWidth: 640 }}>
              {c.name}
            </h1>
            <p className="mt-2 mx-auto leading-relaxed" style={{ color: INK2, fontSize: mob ? 13.5 : 14.5, maxWidth: 480 }}>{c.tagline}</p>
          </div>

          {/* compact media gallery */}
          {media.length > 0 && (
            <div className="mx-auto px-5" style={{ maxWidth: typeof MEDIA_W === 'number' ? MEDIA_W + 40 : undefined }}>
              <div className="relative">
                <MediaFrame item={item} grad={grad} radius={radius} big />
                {media.length > 1 && (
                  <span className="absolute text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ bottom: 8, insetInlineEnd: 8, background: 'rgba(0,0,0,.5)', color: '#fff' }}>
                    {Math.min(activeMedia + 1, media.length)}/{media.length}
                  </span>
                )}
              </div>
              {media.length > 1 && (
                <div className="flex gap-1.5 mt-1.5">
                  {media.map((m, i) => {
                    const th = mediaThumb(m)
                    return (
                      <button key={m.id} onClick={() => setActiveMedia(i)} className="flex-1 relative overflow-hidden transition-all"
                        style={{
                          aspectRatio: '16/9', borderRadius: Math.max(5, radius - 9),
                          background: th ? `#000 center/cover no-repeat url(${th})` : grad,
                          opacity: i === activeMedia ? 1 : 0.5,
                          outline: i === activeMedia ? `2px solid ${accent}` : 'none', outlineOffset: 1,
                        }}>
                        {!th && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            {m.type === 'video' ? <Play className="w-3 h-3 text-white fill-white" /> : <ImageIcon className="w-3 h-3 text-white" />}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* profile, centered + overlapping */}
          <div className="flex flex-col items-center" style={{ marginTop: -26 }}>
            <div className="relative">
              <div className="rounded-2xl flex items-center justify-center text-lg font-extrabold text-white"
                style={{ background: grad, width: 56, height: 56, border: '4px solid #fff', boxShadow: '0 4px 16px rgba(26,23,48,.18)' }}>
                {c.name.charAt(0)}
              </div>
              <span className="absolute w-4.5 h-4.5 rounded-full flex items-center justify-center"
                style={{ width: 18, height: 18, bottom: -2, insetInlineEnd: -2, background: '#22b8f0', border: '2px solid #fff' }}>
                <Check className="w-2 h-2 text-white" strokeWidth={4} />
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-2.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: grad }}>
                {c.creatorName.charAt(0)}
              </span>
              <span className="text-[12.5px] font-medium" style={{ color: INK2 }}>{t('By', 'بواسطة')} {c.creatorName}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center mt-2.5 px-5">
              {[
                { icon: <Lock className="w-3 h-3" />, text: c.access },
                { icon: <Users className="w-3 h-3" />, text: `${c.members} ${t('members', 'عضو')}` },
                { icon: <Ticket className="w-3 h-3" />, text: `${c.price} ${c.currency}${c.period}` },
                { icon: <Star className="w-3 h-3 fill-amber-400 text-amber-400" />, text: `${c.rating} (${c.reviews})` },
              ].map((chip, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full"
                  style={{ background: '#fff', color: INK2, border: `1px solid ${LINE}` }}>
                  <span style={{ color: INK3 }}>{chip.icon}</span>{chip.text}
                </span>
              ))}
            </div>

            <button className="mt-4 px-7 text-[13.5px] font-bold text-white hover:opacity-90"
              style={{ background: grad, borderRadius: btnR, height: 42, boxShadow: `0 8px 22px ${accent}3a` }}>
              {c.ctaPrimary}
            </button>
          </div>

          <div className={mob ? 'px-5 pt-6' : 'px-11 pt-7'}>
            <PageTabs page={page} setPage={setPage} design={design} t={t} />
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
                  <div className="w-full flex items-center justify-center mb-3 overflow-hidden"
                    style={{
                      aspectRatio: '16/9', borderRadius: Math.max(8, radius - 6), border: `1px solid ${LINE}`,
                      background: r.image ? `#000 center/cover no-repeat url(${r.image})` : `linear-gradient(135deg,${accent}14,${accent}08)`,
                    }}>
                    {!r.image && <ImageIcon className="w-6 h-6" style={{ color: `${accent}88` }} />}
                  </div>
                )}
                <p className="text-[13px] leading-relaxed" style={{ color: INK2 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'pricing': {
      const p = Number(c.price) || 0, o = Number(c.origPrice) || 0
      const off = o > p && o > 0 ? Math.round(((o - p) / o) * 100) : 0
      return wrap(
        <div className={pad} style={{ background: secBg }}>
          <Eyebrow text={t('Membership', 'العضوية')} />
          <H>{t('One simple price', 'سعر واحد بسيط')}</H>
          <div className="mt-6 mx-auto p-6 relative overflow-hidden" style={{ maxWidth: 440, background: '#fff', border: `2px solid ${accent}`, borderRadius: radius, boxShadow: `0 16px 40px ${accent}22` }}>
            {off > 0 && (
              <span className="absolute text-[11px] font-extrabold text-white px-3 py-1"
                style={{ top: 14, insetInlineEnd: -28, background: '#f65887', transform: 'rotate(38deg)', width: 120, textAlign: 'center' }}>
                -{off}%
              </span>
            )}
            <p className="text-[13px] font-bold" style={{ color: accent }}>{t('Full membership', 'العضوية الكاملة')}</p>
            <div className="flex items-end gap-2.5 mt-2">
              <span className="font-extrabold leading-none" style={{ color: INK, fontSize: 42, fontFamily: headF }}>{c.price}</span>
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
                  <span className="rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${accent}18`, width: 18, height: 18 }}>
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

    case 'custom': {
      const safe = (block.code ?? '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/ on\w+="[^"]*"/gi, '')
      return <div style={{ background: secBg, fontFamily: bodyF }} dangerouslySetInnerHTML={{ __html: safe }} />
    }

    default:
      return null
  }
}

/* ═══════════════ PRODUCTS PAGE ═══════════════ */

export function ProductsPage({ c, design, device, products, t, page, setPage }: {
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
        <h1 className="font-extrabold tracking-tight text-center" style={{ color: INK, fontSize: mob ? 24 : 30, fontFamily: stack('Montserrat') }}>{c.name}</h1>
        <p className="text-center text-[14px] mt-2" style={{ color: INK3 }}>{c.productsTitle}</p>
        <div className="mt-6"><PageTabs page={page} setPage={setPage} design={design} t={t} /></div>
      </div>

      <div className={pad}>
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: '#d8d4ea' }} />
            <p className="text-[14px] font-semibold" style={{ color: INK2 }}>{t('No products yet', 'لا توجد منتجات')}</p>
          </div>
        ) : (
          <div className="overflow-hidden" style={{ border: `1px solid ${LINE}`, background: '#fff', borderRadius: radius }}>
            {products.map((p, i) => {
              const cf = PROD_CONF[p.kind]
              return (
                <div key={p.id} className={`flex gap-5 p-5 ${mob ? 'flex-col' : ''}`} style={{ borderTop: i === 0 ? 'none' : `1px solid ${LINE}` }}>
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
