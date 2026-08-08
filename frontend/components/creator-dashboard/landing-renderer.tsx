'use client';

import type { ComponentType } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Facebook,
  Globe2,
  Image as ImageIcon,
  Instagram,
  Layers3,
  Linkedin,
  LockKeyhole,
  MessageCircle,
  Package,
  Play,
  Quote,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  Twitter,
  Users,
  Video,
  Zap,
} from 'lucide-react';

export type BlockType = 'hero' | 'highlights' | 'about' | 'curriculum' | 'creator' | 'testimonials' | 'pricing' | 'faq' | 'cta' | 'footer' | 'custom';
export type Localized = { en: string; ar: string };
export type BlockDef = { id: string; type: BlockType; label: Localized; desc: Localized; tint: string; visible: boolean; font?: string; code?: string };
export type MediaItem = { id: string; type: 'video' | 'image'; label: string; url?: string; src?: string };
export type Review = { id: string; name: string; initials: string; rating: number; hasImage: boolean; text: string; image?: string };
export type ProdKind = 'challenge' | 'session' | 'product' | 'event';
export type ProductItem = { id: string; kind: ProdKind; visible: boolean; title: string; desc: string; price: string; meta: string };
export type Device = 'desktop' | 'tablet' | 'mobile';
export type PageId = 'home' | 'products';

export type LandingContent = {
  name: string; tagline: string; slug: string; logo: string; access: string; ctaPrimary: string;
  price: string; origPrice: string; currency: string; period: string; members: string;
  online: string; admins: string; rating: string; reviews: string; lessons: string;
  creatorName: string; creatorRole: string; creatorBio: string; creatorImage: string; creatorInstagram: string; creatorLinkedin: string; creatorTwitter: string; creatorWebsite: string;
  heroEyebrow: string; heroTitle: string; heroDescription: string; heroMembersLabel: string; heroLessonsLabel: string; heroRatingLabel: string;
  highlightsTitle: string; highlightsDescription: string; highlights: string[];
  aboutEyebrow: string; aboutTitle: string; aboutDescription: string; aboutCardTitle: string; aboutCardDescription: string; aboutMembersLabel: string; aboutOnlineLabel: string; aboutHostsLabel: string;
  curriculumTitle: string; curriculumDescription: string; curriculumItemDescription: string; curriculum: string[];
  testimonialsTitle: string; pricingTitle: string; pricingDescription: string; pricingBadge: string; pricingFeatures: string[]; pricingSecurityNote: string;
  faqTitle: string; faqs: Array<{ question: string; answer: string }>;
  ctaTitle: string; ctaDescription: string; ctaSecondary: string;
  footerDescription: string; footerLegalText: string;
};

export type LandingDesign = {
  accent: string; accent2: string; headingFont: string; bodyFont: string;
  bg: 'white' | 'tint' | 'gradient'; radius: number; pill: boolean;
  showProducts: boolean; altSections: boolean;
};

export const GF_URL = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=Noto+Kufi+Arabic:wght@400;500;600;700&display=swap';
export const FONTS = ['Manrope', 'DM Sans', 'Noto Kufi Arabic', 'Inter', 'Georgia'] as const;
export const LANDING_DRAFT_KEY = 'chabaqa-landing-draft-v1';

const labels: Record<BlockType, Localized> = {
  hero: { en: 'Hero', ar: 'الواجهة' }, highlights: { en: 'Highlights', ar: 'المميزات' },
  about: { en: 'About', ar: 'حول' }, curriculum: { en: 'Curriculum', ar: 'المنهج' },
  creator: { en: 'Creator', ar: 'المنشئ' }, testimonials: { en: 'Testimonials', ar: 'الآراء' },
  pricing: { en: 'Pricing', ar: 'الأسعار' }, faq: { en: 'FAQ', ar: 'الأسئلة' },
  cta: { en: 'Call to action', ar: 'دعوة للعمل' }, footer: { en: 'Footer', ar: 'التذييل' },
  custom: { en: 'Custom HTML', ar: 'محتوى مخصص' },
};

const block = (type: BlockType, tint = 'transparent'): BlockDef => ({
  id: type, type, label: labels[type], desc: labels[type], tint, visible: true,
});

export const DEFAULT_BLOCKS: BlockDef[] = [
  block('hero'), block('highlights', '#f7f3ff'), block('about'), block('curriculum', '#faf8ff'),
  block('creator'), block('testimonials', '#f7f3ff'), block('pricing'), block('faq', '#faf8ff'),
  block('cta'), block('footer'),
];

export const DEFAULT_MEDIA: MediaItem[] = [
  { id: 'welcome', type: 'video', label: 'Welcome video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { id: 'community', type: 'image', label: 'Community preview', src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=85' },
];

export const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'p1', kind: 'challenge', visible: true, title: '30-Day Creator Challenge', desc: 'Build momentum with daily prompts, practical lessons, and community support.', price: '$49', meta: '30 days' },
  { id: 'p2', kind: 'session', visible: true, title: 'Private Strategy Session', desc: 'A focused one-to-one session to unblock your next stage of growth.', price: '$120', meta: '60 minutes' },
  { id: 'p3', kind: 'product', visible: true, title: 'Creator Toolkit', desc: 'Templates, systems, and resources for a more productive creator business.', price: '$29', meta: 'Instant access' },
  { id: 'p4', kind: 'event', visible: true, title: 'Live Growth Workshop', desc: 'A practical live workshop with Q&A and an actionable growth plan.', price: '$35', meta: 'Live event' },
];

export const DEFAULT_REVIEWS: Review[] = [
  { id: 'r1', name: 'Maya Hassan', initials: 'MH', rating: 5, hasImage: false, text: 'The clarity and support helped me move from ideas to consistent action.' },
  { id: 'r2', name: 'Omar Ali', initials: 'OA', rating: 5, hasImage: false, text: 'A warm, practical community with resources I use every week.' },
  { id: 'r3', name: 'Sara Ben', initials: 'SB', rating: 5, hasImage: false, text: 'The lessons are concise, thoughtful, and immediately useful.' },
];

export const DEFAULT_CONTENT: LandingContent = {
  name: 'The Creator Circle', tagline: 'Learn, build, and grow together', slug: 'creator-circle', logo: '', access: 'Lifetime access',
  ctaPrimary: 'Join the community', price: '49', origPrice: '79', currency: '$', period: 'one time', members: '2.4k',
  online: '128', admins: '6', rating: '4.9', reviews: '320', lessons: '42', creatorName: 'Lina Mansour',
  creatorRole: 'Creator educator & community builder', creatorBio: 'Lina has helped thousands of independent creators turn their knowledge into meaningful products and thriving communities.', creatorImage: '', creatorInstagram: '', creatorLinkedin: '', creatorTwitter: '', creatorWebsite: '',
  heroEyebrow: 'A community built for your next chapter', heroTitle: 'Turn your creative ambition into real momentum', heroMembersLabel: 'members', heroLessonsLabel: 'lessons', heroRatingLabel: 'rating',
  heroDescription: 'Join ambitious creators for practical lessons, honest conversations, and the accountability to keep moving.',
  highlightsTitle: 'Everything you need to grow', highlightsDescription: 'A focused space designed to help you make progress without the noise.',
  highlights: ['Weekly expert workshops', 'Actionable templates and playbooks', 'Supportive peer community', 'Direct feedback and accountability'],
  aboutEyebrow: 'Why join', aboutTitle: 'Build alongside people who understand', aboutDescription: 'No more figuring it all out alone. Learn proven systems, share your wins and challenges, and create work you are proud to put into the world.', aboutCardTitle: 'Learn. Apply. Grow.', aboutCardDescription: 'A community experience built around meaningful action—not endless information.', aboutMembersLabel: 'Members', aboutOnlineLabel: 'Online', aboutHostsLabel: 'Hosts',
  curriculumTitle: 'A clear path from idea to impact', curriculumDescription: 'Short, practical modules that meet you where you are and help you take the next useful step.', curriculumItemDescription: 'Practical guidance, examples, and an action step to turn this lesson into progress.',
  curriculum: ['Find your valuable niche', 'Shape an irresistible offer', 'Build your audience system', 'Launch with confidence', 'Grow with sustainable habits'],
  testimonialsTitle: 'Loved by ambitious creators', pricingTitle: 'One membership. Endless momentum.',
  pricingDescription: 'Get every lesson, resource, workshop, and community conversation in one simple membership.', pricingBadge: 'Most popular', pricingFeatures: ['All workshops and recordings', 'Private community access', 'New resources every month'], pricingSecurityNote: 'Secure checkout · Instant access',
  faqTitle: 'Questions, answered', faqs: [
    { question: 'Who is this community for?', answer: 'It is for curious, action-oriented creators at any stage who want practical support and meaningful connection.' },
    { question: 'How soon can I access the content?', answer: 'Immediately. Your lessons, resources, and community access unlock as soon as you join.' },
    { question: 'Can I learn at my own pace?', answer: 'Yes. All core lessons are self-paced, and live sessions are recorded for members.' },
    { question: 'Is there ongoing support?', answer: 'Yes. Ask questions in the community, join live sessions, and get regular feedback from peers and hosts.' },
  ],
  ctaTitle: 'Your next chapter starts here', ctaDescription: 'Join a community that turns intention into consistent, meaningful progress.',
  ctaSecondary: 'Explore products', footerDescription: 'A thoughtful home for creators ready to learn, build, and grow together.', footerLegalText: 'Privacy · Terms',
};

export const DEFAULT_DESIGN: LandingDesign = {
  accent: '#7c3aed', accent2: '#a855f7', headingFont: 'Manrope', bodyFont: 'DM Sans',
  bg: 'gradient', radius: 24, pill: true, showProducts: true, altSections: true,
};

type ProductConfig = { bg: string; color: string; label: Localized; Icon: ComponentType<{ size?: number; className?: string }> };
export const PROD_CONF: Record<ProdKind, ProductConfig> = {
  challenge: { bg: '#ede9fe', color: '#6d28d9', label: { en: 'Challenge', ar: 'تحدي' }, Icon: Trophy },
  session: { bg: '#f3e8ff', color: '#9333ea', label: { en: 'Session', ar: 'جلسة' }, Icon: Video },
  product: { bg: '#fae8ff', color: '#a21caf', label: { en: 'Product', ar: 'منتج' }, Icon: Package },
  event: { bg: '#e0e7ff', color: '#4338ca', label: { en: 'Event', ar: 'فعالية' }, Icon: CalendarDays },
};

export function stack(font: string): string {
  const families: Record<string, string> = {
    Manrope: "Manrope, Inter, ui-sans-serif, system-ui, sans-serif",
    "DM Sans": "'DM Sans', Inter, ui-sans-serif, system-ui, sans-serif",
    "Noto Kufi Arabic": "'Noto Kufi Arabic', ui-sans-serif, system-ui, sans-serif",
    Inter: "Inter, ui-sans-serif, system-ui, sans-serif",
    Georgia: "Georgia, 'Times New Roman', serif",
  };
  return families[font] || font || families.Manrope;
}
const isMobile = (device: Device): boolean => device === 'mobile';
export function ytId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i);
  return match?.[1] ?? null;
}
export function mediaThumb(item?: MediaItem): string {
  if (!item) return '';
  const id = ytId(item.url);
  return item.src || (id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : item.url) || '';
}

type Translate = ((value: Localized) => string) | ((en: string, ar: string) => string);
const tr = (t: Translate, value: Localized) => t.length >= 2 ? (t as (en: string, ar: string) => string)(value.en, value.ar) : (t as (value: Localized) => string)(value);
const safeText = (value: unknown) => String(value ?? '');
const sectionWidth = (device: Device) => device === 'mobile' ? '100%' : device === 'tablet' ? '92%' : 'min(1120px, 92%)';

function sanitizeHtml(input: string): string {
  if (typeof window === 'undefined') {
    return input.replace(/<(script|style|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '').replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '$1#$1');
  }
  const doc = new DOMParser().parseFromString(input, 'text/html');
  doc.querySelectorAll('script,style,iframe').forEach((node) => node.remove());
  doc.querySelectorAll('*').forEach((node) => Array.from(node.attributes).forEach((attr) => {
    if (/^on/i.test(attr.name) || ((attr.name === 'href' || attr.name === 'src') && /^\s*javascript:/i.test(attr.value))) node.removeAttribute(attr.name);
  }));
  return doc.body.innerHTML;
}

const buttonStyle = (design: LandingDesign, outline = false): React.CSSProperties => ({
  border: outline ? `1px solid ${design.accent}40` : 0, background: outline ? '#fff' : `linear-gradient(135deg, ${design.accent}, ${design.accent2})`,
  color: outline ? design.accent : '#fff', borderRadius: design.pill ? 999 : Math.min(design.radius, 16), padding: '13px 22px', fontWeight: 750,
  cursor: 'pointer', boxShadow: outline ? 'none' : `0 12px 28px ${design.accent}30`, display: 'inline-flex', alignItems: 'center', gap: 8,
});

export type ProductsListProps = { c: LandingContent; design: LandingDesign; device: Device; products: ProductItem[]; t: Translate };
export function ProductsList({ design, device, products, t }: ProductsListProps) {
  const visible = products.filter((product) => product.visible);
  return <div style={{ width: sectionWidth(device), margin: '0 auto', padding: device === 'mobile' ? '52px 18px' : '80px 0', fontFamily: design.bodyFont }}>
    <div style={{ textAlign: 'center', marginBottom: 34 }}><div style={{ color: design.accent, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 12 }}>Explore</div><h2 style={{ fontFamily: design.headingFont, fontSize: isMobile(device) ? 30 : 43, margin: '8px 0', color: '#21152f' }}>Programs made for progress</h2></div>
    <div style={{ display: 'grid', gridTemplateColumns: isMobile(device) ? '1fr' : device === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 18 }}>
      {visible.map((product) => { const conf = PROD_CONF[product.kind]; return <article key={product.id} style={{ padding: 22, border: '1px solid #ede9f4', borderRadius: design.radius, background: '#fff', boxShadow: '0 16px 45px rgba(65,35,90,.08)', display: 'flex', flexDirection: 'column', minHeight: 250 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ background: conf.bg, color: conf.color, borderRadius: 999, padding: '7px 10px', fontWeight: 750, fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}><conf.Icon size={14} />{tr(t, conf.label)}</span><span style={{ color: '#81758c', fontSize: 12 }}>{product.meta}</span></div>
        <h3 style={{ fontFamily: design.headingFont, fontSize: 20, margin: '22px 0 9px', color: '#281b34' }}>{product.title}</h3><p style={{ color: '#73677d', lineHeight: 1.65, margin: 0, flex: 1 }}>{product.desc}</p>
        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><strong style={{ fontSize: 21, color: design.accent }}>{product.price}</strong><ArrowRight size={18} color={design.accent} /></div>
      </article>; })}
    </div>
  </div>;
}

export type PageTabsProps = { page: PageId; setPage: (page: PageId) => void; design: LandingDesign; t: Translate };
export function PageTabs({ page, setPage, design, t }: PageTabsProps) {
  const tabs: Array<[PageId, Localized]> = [['home', { en: 'Home', ar: 'الرئيسية' }], ['products', { en: 'Products', ar: 'المنتجات' }]];
  return <nav aria-label="Page navigation" style={{ display: 'inline-flex', padding: 5, gap: 4, background: '#f4f0f8', borderRadius: 999 }}>
    {tabs.map(([id, label]) => <button key={id} type="button" onClick={() => setPage(id)} style={{ border: 0, padding: '9px 18px', borderRadius: 999, cursor: 'pointer', fontWeight: 750, background: page === id ? '#fff' : 'transparent', color: page === id ? design.accent : '#766a80', boxShadow: page === id ? '0 4px 14px rgba(65,35,90,.12)' : 'none' }}>{tr(t, label)}</button>)}
  </nav>;
}

export type SectionProps = { block: BlockDef; c: LandingContent; design: LandingDesign; device: Device; index: number; media: MediaItem[]; activeMedia: string; setActiveMedia: (id: string) => void; reviews: Review[]; page: PageId; setPage: (page: PageId) => void; t: Translate; openFaq: number | null; setOpenFaq: (index: number | null) => void; openSec: number | string | null; setOpenSec: (index: number | string | null) => void };
export function Section({ block, c, design, device, index, media, activeMedia, setActiveMedia, reviews, page, setPage, t, openFaq, setOpenFaq, openSec, setOpenSec }: SectionProps) {
  if (!block.visible) return null;
  const mobile = isMobile(device); const width = sectionWidth(device); const radius = design.radius; const accent = design.accent;
  const pad = mobile ? '58px 20px' : '88px 0';
  const background = block.tint !== 'transparent' ? block.tint : design.altSections && index % 2 ? '#faf8ff' : '#fff';
  const wrap = (children: React.ReactNode, extra?: React.CSSProperties) => <section style={{ background, fontFamily: stack(block.font || design.bodyFont), color: '#2b2034', ...extra }}><div style={{ width, margin: '0 auto', padding: pad }}>{children}</div></section>; 
  const brandLockup = <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 20 }}><span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, overflow: 'hidden', background: '#1d1630', padding: 5 }}><img src="/logo-icon.png" alt="Chabaqa" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span><span style={{ color: '#a7a0af', fontWeight: 700 }}>×</span><span style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 10, overflow: 'hidden', background: `linear-gradient(135deg, ${design.accent}, ${design.accent2})`, color: '#fff', fontSize: 12, fontWeight: 900 }}>{c.logo ? <img src={c.logo} alt={`${c.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.name.slice(0, 1).toUpperCase()}</span><strong style={{ fontSize: 13, color: '#51465a' }}>{c.name}</strong></div>; 
    const title = (text: string, sub?: string) => <div style={{ maxWidth: 720, margin: '0 auto 38px', textAlign: 'center' }}><h2 style={{ fontFamily: design.headingFont, fontSize: mobile ? 30 : 44, lineHeight: 1.12, margin: 0 }}>{text}</h2>{sub && <p style={{ fontSize: mobile ? 16 : 18, color: '#74687e', lineHeight: 1.7 }}>{sub}</p>}</div>;

  switch (block.type) {
    case 'hero': {
      const selected = media.find((item) => item.id === activeMedia) || media[0]; const thumb = mediaThumb(selected);
      return <section style={{ overflow: 'hidden', fontFamily: stack(block.font || design.bodyFont), background: design.bg === 'white' ? '#fff' : design.bg === 'tint' ? '#f8f4ff' : `radial-gradient(circle at 85% 15%, ${design.accent2}28, transparent 33%), linear-gradient(145deg,#fff 15%,#f6efff 100%)` }}><div style={{ width, margin: '0 auto', padding: mobile ? '64px 20px 55px' : '90px 0 78px', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1.04fr .96fr', gap: mobile ? 42 : 65, alignItems: 'center' }}>
        <div>{brandLockup}<span style={{ display: 'inline-flex', gap: 7, alignItems: 'center', color: accent, fontWeight: 800, background: `${accent}12`, padding: '8px 13px', borderRadius: 999, fontSize: 13 }}><Sparkles size={15} />{c.heroEyebrow}</span><h1 style={{ fontFamily: design.headingFont, fontSize: mobile ? 40 : device === 'tablet' ? 52 : 66, lineHeight: 1.02, letterSpacing: '-.045em', margin: '22px 0', color: '#25162f' }}>{c.heroTitle}</h1><p style={{ fontSize: mobile ? 17 : 19, lineHeight: 1.7, color: '#71647a', maxWidth: 610 }}>{c.heroDescription}</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '30px 0 25px' }}><a href={`/community/${encodeURIComponent(c.slug)}/checkout`} style={{ ...buttonStyle(design), textDecoration: 'none' }}>{c.ctaPrimary}<ArrowRight size={18} /></a></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, color: '#6f6478', fontSize: 14 }}><span><Users size={15} style={{ verticalAlign: -3 }} /> {c.members} {c.heroMembersLabel}</span><span><Star size={15} fill="#f59e0b" color="#f59e0b" style={{ verticalAlign: -3 }} /> {c.rating} {c.heroRatingLabel} ({c.reviews})</span><span><BookOpen size={15} style={{ verticalAlign: -3 }} /> {c.lessons} {c.heroLessonsLabel}</span></div></div>
        <div><div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: radius + 8, overflow: 'hidden', background: `linear-gradient(135deg,${accent},${design.accent2})`, boxShadow: `0 28px 70px ${accent}35` }}>{thumb ? <img src={thumb} alt={selected?.label || c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}><ImageIcon color="#fff" size={56} /></div>}{selected?.type === 'video' && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(28,12,40,.18)' }}><span style={{ width: 68, height: 68, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 12px 35px rgba(0,0,0,.2)' }}><Play fill={accent} color={accent} /></span></div>}</div>{media.length > 1 && <div style={{ display: 'flex', gap: 9, marginTop: 13, justifyContent: 'center' }}>{media.map((item) => <button aria-label={item.label} key={item.id} onClick={() => setActiveMedia(item.id)} style={{ width: item.id === selected?.id ? 28 : 8, height: 8, padding: 0, border: 0, borderRadius: 99, background: item.id === selected?.id ? accent : '#d7cfdd', cursor: 'pointer' }} />)}</div>}</div>
      </div></section>;
    }
    case 'highlights': return wrap(<>{title(c.highlightsTitle, c.highlightsDescription)}<div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2,1fr)', gap: 16 }}>{c.highlights.map((item, i) => { const icons = [Zap, Layers3, Users, ShieldCheck]; const Icon = icons[i % icons.length]; return <div key={item} style={{ padding: 24, borderRadius: radius, background: '#fff', border: '1px solid #eee8f3', display: 'flex', gap: 17, alignItems: 'center' }}><span style={{ width: 46, height: 46, flex: '0 0 auto', borderRadius: 14, display: 'grid', placeItems: 'center', color: accent, background: `${accent}12` }}><Icon size={22} /></span><strong style={{ fontFamily: design.headingFont, fontSize: 18 }}>{item}</strong></div>; })}</div></>);
    case 'about': return wrap(<div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1fr 1fr', gap: 55, alignItems: 'center' }}><div><span style={{ color: accent, fontWeight: 800 }}>{c.aboutEyebrow}</span><h2 style={{ fontFamily: design.headingFont, fontSize: mobile ? 32 : 46, lineHeight: 1.12 }}>{c.aboutTitle}</h2><p style={{ color: '#74687e', fontSize: 18, lineHeight: 1.8 }}>{c.aboutDescription}</p></div><div style={{ padding: mobile ? 25 : 38, borderRadius: radius + 8, color: '#fff', background: `linear-gradient(145deg,${accent},${design.accent2})`, boxShadow: `0 22px 55px ${accent}35` }}><Rocket size={35} /><h3 style={{ fontFamily: design.headingFont, fontSize: 27 }}>{c.aboutCardTitle}</h3><p style={{ opacity: .88, lineHeight: 1.7 }}>{c.aboutCardDescription}</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 28 }}>{[[c.members,c.aboutMembersLabel],[c.online,c.aboutOnlineLabel],[c.admins,c.aboutHostsLabel]].map(([n,l]) => <div key={l}><strong style={{ display: 'block', fontSize: 23 }}>{n}</strong><small style={{ opacity: .75 }}>{l}</small></div>)}</div></div></div>);
    case 'curriculum': return wrap(<>{title(c.curriculumTitle, c.curriculumDescription)}<div style={{ maxWidth: 780, margin: '0 auto' }}>{c.curriculum.map((item, i) => { const opened = openSec === i; return <button type="button" key={item} onClick={() => setOpenSec(opened ? null : i)} style={{ width: '100%', textAlign: 'left', border: '1px solid #e9e2ef', borderRadius: radius, background: '#fff', marginBottom: 12, padding: 20, cursor: 'pointer', color: '#30243a' }}><span style={{ display: 'flex', alignItems: 'center', gap: 15 }}><span style={{ color: accent, fontWeight: 800, background: `${accent}12`, width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center' }}>{i + 1}</span><strong style={{ flex: 1, fontSize: 17 }}>{item}</strong><ChevronDown size={19} style={{ transform: opened ? 'rotate(180deg)' : 'none', transition: '.2s' }} /></span>{opened && <span style={{ display: 'block', color: '#75697e', lineHeight: 1.65, padding: '14px 10px 0 51px' }}>{c.curriculumItemDescription}</span>}</button>; })}</div></>);
    case 'creator': { const socialLinks = [[c.creatorInstagram, Instagram, 'Instagram'], [c.creatorLinkedin, Linkedin, 'LinkedIn'], [c.creatorTwitter, Twitter, 'X'], [c.creatorWebsite, Globe2, 'Website']].filter(([url]) => Boolean(url)) as Array<[string, typeof Instagram, string]>; return wrap(<div style={{ maxWidth: 850, margin: '0 auto', display: 'grid', gridTemplateColumns: mobile ? '1fr' : '220px 1fr', gap: 38, alignItems: 'center' }}><div style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: radius + 12, background: `linear-gradient(145deg,${accent},${design.accent2})`, color: '#fff', display: 'grid', placeItems: 'center', font: `800 60px ${design.headingFont}` }}>{c.creatorImage ? <img src={c.creatorImage} alt={c.creatorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.creatorName.split(' ').map((x) => x[0]).slice(0,2).join('')}</div><div><span style={{ color: accent, fontWeight: 800 }}>MEET YOUR HOST</span><h2 style={{ font: `800 ${mobile ? 30 : 40}px ${design.headingFont}`, margin: '10px 0 5px' }}>{c.creatorName}</h2><p style={{ color: accent, fontWeight: 700 }}>{c.creatorRole}</p><p style={{ color: '#74687e', lineHeight: 1.8, fontSize: 17 }}>{c.creatorBio}</p>{socialLinks.length > 0 && <div style={{ display: 'flex', gap: 10 }}>{socialLinks.map(([url, Icon, label]) => <a key={label} href={url} target="_blank" rel="noreferrer" aria-label={label} style={{ width: 36, height: 36, borderRadius: 99, background: `${accent}12`, color: accent, display: 'grid', placeItems: 'center' }}><Icon size={17} /></a>)}</div>}</div></div>); }
    case 'testimonials': return wrap(<>{title(c.testimonialsTitle)}<div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : device === 'tablet' ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 17 }}>{reviews.map((review) => <article key={review.id} style={{ padding: 25, borderRadius: radius, background: '#fff', border: '1px solid #eee8f3', boxShadow: '0 12px 35px rgba(65,35,90,.06)' }}><Quote size={26} color={accent} /><div style={{ display: 'flex', margin: '17px 0 10px' }}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={15} color="#f59e0b" fill={i < review.rating ? '#f59e0b' : 'none'} />)}</div><p style={{ color: '#675b70', lineHeight: 1.7, minHeight: 72 }}>“{review.text}”</p><div style={{ display: 'flex', gap: 11, alignItems: 'center', marginTop: 18 }}>{review.hasImage && review.image ? <img src={review.image} alt={review.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ width: 42, height: 42, borderRadius: '50%', display: 'grid', placeItems: 'center', background: `${accent}15`, color: accent, fontWeight: 800 }}>{review.initials}</span>}<strong>{review.name}</strong></div></article>)}</div></>);
    case 'pricing': return wrap(<>{title(c.pricingTitle, c.pricingDescription)}<div style={{ maxWidth: 480, margin: '0 auto', padding: mobile ? 27 : 40, borderRadius: radius + 8, background: '#fff', border: `2px solid ${accent}35`, boxShadow: `0 24px 65px ${accent}18`, position: 'relative' }}><span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: accent, color: '#fff', borderRadius: 99, padding: '7px 15px', fontWeight: 800, fontSize: 12 }}>{c.pricingBadge}</span><div style={{ textAlign: 'center', margin: '16px 0 25px' }}><span style={{ textDecoration: 'line-through', color: '#a49aa9' }}>{c.currency}{c.origPrice}</span><div><strong style={{ font: `800 54px ${design.headingFont}`, color: '#271a31' }}>{c.currency}{c.price}</strong> <span style={{ color: '#7a6f82' }}>/ {c.period}</span></div></div>{[c.access, `${c.lessons} ${c.heroLessonsLabel}`, ...c.pricingFeatures].map((x) => <div key={x} style={{ display: 'flex', gap: 10, padding: '10px 0', color: '#62566b' }}><Check size={19} color={accent} /><span>{x}</span></div>)}<a href={`/community/${encodeURIComponent(c.slug)}/checkout`} style={{ ...buttonStyle(design), width: '100%', justifyContent: 'center', marginTop: 23, textDecoration: 'none' }}>{c.ctaPrimary}<ArrowRight size={18} /></a><p style={{ textAlign: 'center', color: '#928798', fontSize: 12 }}><LockKeyhole size={12} style={{ verticalAlign: -2 }} /> {c.pricingSecurityNote}</p></div></>);
    case 'faq': return wrap(<>{title(c.faqTitle)}<div style={{ maxWidth: 780, margin: '0 auto' }}>{c.faqs.map((faq, i) => <div key={faq.question} style={{ borderBottom: '1px solid #e6dfeb' }}><button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', border: 0, background: 'transparent', padding: '21px 0', display: 'flex', textAlign: 'left', gap: 14, fontSize: 17, fontWeight: 750, cursor: 'pointer', color: '#30243a' }}><span style={{ flex: 1 }}>{faq.question}</span><ChevronDown size={20} color={accent} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }} /></button>{openFaq === i && <p style={{ margin: '-5px 40px 22px 0', color: '#74687e', lineHeight: 1.7 }}>{faq.answer}</p>}</div>)}</div></>);
    case 'cta': return wrap(<div style={{ textAlign: 'center', padding: mobile ? '45px 22px' : '62px', borderRadius: radius + 12, color: '#fff', background: `radial-gradient(circle at 20% 0%,rgba(255,255,255,.2),transparent 30%),linear-gradient(135deg,${accent},${design.accent2})`, boxShadow: `0 25px 65px ${accent}35` }}><Award size={38} /><h2 style={{ font: `800 ${mobile ? 34 : 49}px ${design.headingFont}`, margin: '17px auto 12px', maxWidth: 700 }}>{c.ctaTitle}</h2><p style={{ maxWidth: 620, margin: '0 auto 28px', lineHeight: 1.7, opacity: .85, fontSize: 18 }}>{c.ctaDescription}</p><a href={`/community/${encodeURIComponent(c.slug)}/checkout`} style={{ ...buttonStyle(design), color: accent, background: '#fff', boxShadow: '0 12px 30px rgba(35,10,50,.2)', textDecoration: 'none' }}>{c.ctaPrimary}<ArrowRight size={18} /></a></div>, { background: '#fff' });
    case 'footer': return <footer style={{ background: '#21152d', color: '#fff', fontFamily: stack(block.font || design.bodyFont) }}><div style={{ width, margin: '0 auto', padding: mobile ? '48px 20px' : '62px 0 28px' }}><div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : '1.5fr 1fr', gap: 35 }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ display: 'grid', placeItems: 'center', overflow: 'hidden', width: 31, height: 31, borderRadius: 9, background: '#fff', padding: 4 }}><img src="/logo-icon.png" alt="Chabaqa" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></span><span style={{ opacity: .55 }}>×</span><span style={{ display: 'grid', placeItems: 'center', overflow: 'hidden', width: 31, height: 31, borderRadius: 9, background: `linear-gradient(135deg,${accent},${design.accent2})`, fontSize: 12, fontWeight: 900 }}>{c.logo ? <img src={c.logo} alt={`${c.name} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.name.slice(0, 1).toUpperCase()}</span><strong style={{ font: `800 20px ${design.headingFont}` }}>{c.name}</strong></div><p style={{ opacity: .65, maxWidth: 430, lineHeight: 1.7 }}>{c.footerDescription}</p></div><div style={{ display: 'flex', gap: 12, justifyContent: mobile ? 'flex-start' : 'flex-end' }}>{[Globe2, Instagram, Facebook, MessageCircle].map((Icon, i) => <span key={i} style={{ width: 39, height: 39, borderRadius: 99, background: 'rgba(255,255,255,.1)', display: 'grid', placeItems: 'center' }}><Icon size={17} /></span>)}</div></div><div style={{ borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 38, paddingTop: 20, opacity: .55, fontSize: 13, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}><span>© {new Date().getFullYear()} {c.name}</span><span>{c.footerLegalText}</span></div></div></footer>;
    case 'custom': return wrap(<div className="landing-custom-html" dangerouslySetInnerHTML={{ __html: sanitizeHtml(safeText(block.code)) }} />);
    default: return null;
  }
}
