'use client'

import { useRef, useState, useEffect } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import {
  GripVertical, Eye, EyeOff, ArrowUp, ArrowDown, ArrowLeft,
  Blocks, Type, Palette, Star, Play, Monitor, Pencil,
  Tablet, Smartphone, Save, Rocket, Users, Trash2,
  Sparkles, MessageSquare, BookOpen, Calendar, ImageIcon,
  Plus, Code, ExternalLink, Video, ShoppingBag, Upload, Link2,
} from 'lucide-react'
import {
  Section, ProductsPage, GF_URL, FONTS, stack, LANDING_DRAFT_KEY,
  DEFAULT_BLOCKS, DEFAULT_MEDIA, DEFAULT_PRODUCTS, DEFAULT_REVIEWS,
  DEFAULT_CONTENT, DEFAULT_DESIGN, PROD_CONF, ytId, mediaThumb,
  type BlockDef, type BlockType, type MediaItem, type ProductItem, type Review,
  type Content, type Design, type Device, type PageId, type ProdKind,
} from '@/components/creator-dashboard/landing-renderer'

const E = { bg: '#ffffff', card: '#f6f5fb', card2: '#efedf8', bd: '#eceaf4', t1: '#1a1730', t2: '#46426a', t3: '#9590b8' }

const BLOCK_ICONS: Record<BlockType, React.ElementType> = {
  hero: Rocket, highlights: Sparkles, about: Type, curriculum: BookOpen,
  creator: Users, testimonials: Star, pricing: Blocks, faq: MessageSquare,
  cta: Rocket, footer: Blocks, custom: Code,
}

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
  const [selected, setSelected] = useState<string | null>(null)   // highlight only
  const [editing, setEditing] = useState<string | null>(null)     // opens the editor
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [openSec, setOpenSec] = useState<number | null>(0)
  const [activeMedia, setActiveMedia] = useState(0)

  const dragFrom = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const secRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const accent = design.accent
  const set = <K extends keyof Content>(k: K, v: Content[K]) => setContent(c => ({ ...c, [k]: v }))
  const setD = <K extends keyof Design>(k: K, v: Design[K]) => setDesign(d => ({ ...d, [k]: v }))

  /* persist draft so the standalone preview can read it */
  useEffect(() => {
    try {
      localStorage.setItem(LANDING_DRAFT_KEY, JSON.stringify({ blocks, products, reviews, media, content, design }))
    } catch { /* quota — ignore */ }
  }, [blocks, products, reviews, media, content, design])

  /* scroll highlighted block into view inside the preview pane only */
  useEffect(() => {
    if (!selected) return
    const el = secRefs.current[selected]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selected])

  const patchBlock = (id: string, p: Partial<BlockDef>) => setBlocks(bs => bs.map(b => (b.id === id ? { ...b, ...p } : b)))
  const toggleBlock = (id: string) => setBlocks(bs => bs.map(b => (b.id === id ? { ...b, visible: !b.visible } : b)))
  const removeBlock = (id: string) => {
    setBlocks(bs => bs.filter(b => b.id !== id))
    if (selected === id) setSelected(null)
    if (editing === id) setEditing(null)
  }
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= blocks.length) return
    setBlocks(bs => { const n = [...bs]; [n[i], n[j]] = [n[j], n[i]]; return n })
  }
  const addCustom = () => {
    const id = `custom-${Date.now()}`
    setBlocks(bs => [...bs, {
      id, type: 'custom' as BlockType,
      label: { en: 'Custom Block', ar: 'قسم مخصص' },
      desc: { en: 'Your own HTML', ar: 'HTML خاص بك' },
      tint: '#14b8a6', visible: true,
      code: '<div style="padding:40px;text-align:center">\n  <h2 style="font-size:26px;font-weight:800">Your custom block</h2>\n  <p style="margin-top:8px;color:#666">Paste any HTML here.</p>\n</div>',
    }])
    setSelected(id); setEditing(id); setTab('content')
  }

  /* drag & drop */
  const dragStart = (e: React.DragEvent, i: number) => {
    dragFrom.current = i
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', String(i)) } catch { }
  }
  const dragOverItem = (e: React.DragEvent, i: number) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'
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

  const openPreview = () => window.open('/creator/branding/preview', '_blank')

  const frameWidth = device === 'mobile' ? 400 : device === 'tablet' ? 760 : 1040
  const pageBg = design.bg === 'tint' ? '#faf9ff' : design.bg === 'gradient' ? '#fbfaff' : '#ffffff'
  const editBlock = blocks.find(b => b.id === editing) || null

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

      {/* h-screen + overflow-hidden keeps the editor panel fixed while only the preview scrolls */}
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col h-screen overflow-hidden">
          <DashTopbar title={t('Branding', 'الهوية')} subtitle={t('Design your community landing page', 'صمّم صفحة هبوط مجتمعك')} />

          <div className="flex-1 flex overflow-hidden min-h-0">

            {/* ══════ EDITOR — fixed, never scrolls as a whole ══════ */}
            <div className="w-[310px] shrink-0 flex flex-col h-full overflow-hidden" style={{ background: E.bg, borderInlineEnd: `1px solid ${E.bd}` }} dir={isAr ? 'rtl' : 'ltr'}>

              <div className="px-4 py-3 flex items-center gap-2.5 shrink-0" style={{ borderBottom: `1px solid ${E.bd}` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: `linear-gradient(135deg,${design.accent},${design.accent2})` }}>
                  <Palette className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold" style={{ color: E.t1 }}>{t('Page Builder', 'محرّر الصفحة')}</p>
                  <p className="text-[10px] truncate" style={{ color: E.t3 }}>chabaqa.io/{content.slug}</p>
                </div>
              </div>

              {/* PREVIEW — at the top */}
              <div className="px-3 pt-3 shrink-0">
                <button onClick={openPreview} className="w-full py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                  style={{ background: `${accent}12`, color: accent, border: `1.5px solid ${accent}55` }}>
                  <ExternalLink className="w-3.5 h-3.5" /> {t('Preview live page', 'معاينة الصفحة')}
                </button>
              </div>

              <div className="px-3 py-2.5 shrink-0">
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

              <div className="flex shrink-0 px-2 gap-1" style={{ borderBottom: `1px solid ${E.bd}`, paddingBottom: 8 }}>
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

              {/* only this inner list scrolls */}
              <div className="flex-1 overflow-y-auto bld-scroll min-h-0">

                {tab === 'blocks' && page === 'home' && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 px-1" style={{ color: E.t3 }}>
                      {t('Click to highlight · pencil to edit · drag to reorder', 'انقر للتحديد · القلم للتحرير · اسحب للترتيب')}
                    </p>
                    {blocks.map((b, i) => {
                      const Icon = BLOCK_ICONS[b.type]
                      const isSel = selected === b.id
                      return (
                        <div key={b.id} draggable
                          onDragStart={e => dragStart(e, i)}
                          onDragOver={e => dragOverItem(e, i)}
                          onDragLeave={() => setDragOver(null)}
                          onDrop={e => dropItem(e, i)}
                          onDragEnd={() => { setDragOver(null); dragFrom.current = null }}
                          onClick={() => setSelected(isSel ? null : b.id)}
                          className="flex items-center gap-2 p-2 rounded-xl mb-1.5 cursor-pointer transition-all"
                          style={{
                            background: isSel ? `${accent}12` : E.card,
                            border: `1.5px solid ${isSel ? accent : dragOver === i ? accent : E.bd}`,
                            opacity: b.visible ? 1 : 0.5,
                          }}>
                          <GripVertical className="w-3.5 h-3.5 shrink-0 cursor-grab" style={{ color: '#c7c2dc' }} />
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${b.tint}1f` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: b.tint }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold truncate" style={{ color: isSel ? accent : E.t1 }}>{b.label[lang]}</p>
                            <p className="text-[10px] truncate" style={{ color: E.t3 }}>{b.desc[lang]}</p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button onClick={e => { e.stopPropagation(); setSelected(b.id); setEditing(b.id); setTab('content') }}
                              title={t('Edit', 'تحرير')} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${accent}1a`, color: accent }}>
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); toggleBlock(b.id) }} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: E.card2, color: E.t2 }}>
                              {b.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            </button>
                            <button onClick={e => { e.stopPropagation(); moveBlock(i, -1) }} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: E.card2, color: E.t2 }}><ArrowUp className="w-3 h-3" /></button>
                            <button onClick={e => { e.stopPropagation(); moveBlock(i, 1) }} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: E.card2, color: E.t2 }}><ArrowDown className="w-3 h-3" /></button>
                          </div>
                        </div>
                      )
                    })}
                    <button onClick={addCustom} className="w-full mt-2 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: `${accent}12`, color: accent, border: `1.5px dashed ${accent}55` }}>
                      <Plus className="w-3.5 h-3.5" /> {t('Add custom block', 'إضافة قسم مخصص')}
                    </button>
                  </div>
                )}

                {tab === 'blocks' && page === 'products' && (
                  <div className="p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 px-1" style={{ color: E.t3 }}>
                      {t('Drag cards to reorder · eye to hide', 'اسحب لإعادة الترتيب')}
                    </p>
                    {products.map((p, i) => {
                      const cf = PROD_CONF[p.kind]
                      return (
                        <div key={p.id} draggable
                          onDragStart={e => { pDragFrom.current = i; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(i)) } catch { } }}
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
                            title: `New ${PROD_CONF[k].label.en}`, desc: 'Describe this offer for your members.', price: '0', meta: '—',
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

                {tab === 'content' && (
                  editBlock ? (
                    <BlockEditor block={editBlock} onBack={() => setEditing(null)} patch={patchBlock} remove={removeBlock}
                      content={content} set={set} media={media} setMedia={setMedia}
                      reviews={reviews} setReviews={setReviews} t={t} accent={accent} lang={lang} />
                  ) : (
                    <div className="pb-6">
                      <div className="px-4 pt-3">
                        <p className="text-[11px] leading-relaxed p-2.5 rounded-lg" style={{ background: `${accent}0e`, color: E.t2 }}>
                          {t('Tip: hit the pencil on any block to edit just that section.', 'اضغط القلم على أي قسم لتحريره وحده.')}
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

              <div className="p-3 shrink-0 flex gap-2" style={{ borderTop: `1px solid ${E.bd}` }}>
                <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5" style={{ background: E.card, color: E.t2 }}>
                  <Save className="w-3.5 h-3.5" /> {t('Save', 'حفظ')}
                </button>
                <button className="flex-1 py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 text-white hover:opacity-90" style={{ background: `linear-gradient(135deg,${design.accent},${design.accent2})` }}>
                  <Rocket className="w-3.5 h-3.5" /> {t('Publish', 'نشر')}
                </button>
              </div>
            </div>

            {/* ══════ PREVIEW ══════ */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden" style={{ background: '#edeef2' }}>
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

              <div className="flex-1 overflow-y-auto prev-scroll flex justify-center p-6 min-h-0">
                <div className="w-full transition-all duration-300"
                  style={{ maxWidth: frameWidth, background: pageBg, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 44px rgba(26,23,48,.12)', height: 'fit-content', border: '1px solid #e4e2ef' }}
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
                        <Section block={b} c={content} design={design} device={device} index={idx}
                          media={media} activeMedia={activeMedia} setActiveMedia={setActiveMedia} reviews={reviews}
                          page={page} setPage={setPage} t={t}
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
        <button key={f.id} onClick={() => onChange(f.id)} className="py-2 px-2 rounded-lg text-[12px] font-semibold truncate"
          style={{ fontFamily: stack(f.id), background: value === f.id ? `${accent}15` : '#fff', color: value === f.id ? accent : E.t1, border: `1px solid ${value === f.id ? accent : E.bd}` }}>
          {f.label}
        </button>
      ))}
    </div>
  )
}

/* file → data URL */
function readFile(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function BlockEditor({ block, onBack, patch, remove, content, set, media, setMedia, reviews, setReviews, t, accent, lang }: {
  block: BlockDef; onBack: () => void
  patch: (id: string, p: Partial<BlockDef>) => void
  remove: (id: string) => void
  content: Content; set: <K extends keyof Content>(k: K, v: Content[K]) => void
  media: MediaItem[]; setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>
  reviews: Review[]; setReviews: React.Dispatch<React.SetStateAction<Review[]>>
  t: (en: string, ar: string) => string; accent: string; lang: 'en' | 'ar'
}) {
  const uploadImage = async (file: File | undefined, id: string) => {
    if (!file) return
    const src = await readFile(file)
    setMedia(ms => ms.map(x => x.id === id ? { ...x, src, type: 'image' } : x))
  }
  const uploadReview = async (file: File | undefined, id: string) => {
    if (!file) return
    const image = await readFile(file)
    setReviews(rs => rs.map(x => x.id === id ? { ...x, image, hasImage: true } : x))
  }

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
            {t('Inline HTML + styles supported. Scripts are stripped for safety.', 'يدعم HTML والتنسيقات. تُزال السكربتات للأمان.')}
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
            {media.map(m => {
              const thumb = mediaThumb(m)
              const badYt = m.type === 'video' && !!m.url && !ytId(m.url)
              return (
                <div key={m.id} className="p-2.5 rounded-xl flex flex-col gap-2" style={{ background: E.card, border: `1px solid ${E.bd}` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-8 rounded-md shrink-0 overflow-hidden flex items-center justify-center"
                      style={{ background: thumb ? `#000 center/cover no-repeat url(${thumb})` : `${accent}18` }}>
                      {!thumb && (m.type === 'video' ? <Video className="w-3.5 h-3.5" style={{ color: accent }} /> : <ImageIcon className="w-3.5 h-3.5" style={{ color: accent }} />)}
                    </div>
                    <input value={m.label} onChange={e => setMedia(ms => ms.map(x => x.id === m.id ? { ...x, label: e.target.value } : x))}
                      placeholder={t('Caption', 'التسمية')}
                      className="flex-1 min-w-0 text-[12px] outline-none bg-transparent" style={{ color: E.t1 }} />
                    <button onClick={() => setMedia(ms => ms.filter(x => x.id !== m.id))} className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: '#fee2e2', color: '#dc2626' }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {m.type === 'image' ? (
                    <label className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold cursor-pointer"
                      style={{ background: '#fff', color: accent, border: `1px dashed ${accent}66` }}>
                      <Upload className="w-3 h-3" /> {m.src ? t('Replace image', 'استبدال الصورة') : t('Upload image', 'رفع صورة')}
                      <input type="file" accept="image/*" hidden onChange={e => uploadImage(e.target.files?.[0], m.id)} />
                    </label>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: '#fff', border: `1px solid ${badYt ? '#f87171' : E.bd}` }}>
                      <Link2 className="w-3 h-3 shrink-0" style={{ color: E.t3 }} />
                      <input value={m.url ?? ''} onChange={e => setMedia(ms => ms.map(x => x.id === m.id ? { ...x, url: e.target.value } : x))}
                        placeholder={t('Paste YouTube link', 'الصق رابط يوتيوب')}
                        className="flex-1 min-w-0 text-[11.5px] outline-none bg-transparent" style={{ color: E.t1 }} />
                    </div>
                  )}
                  {badYt && <p className="text-[10px]" style={{ color: '#dc2626' }}>{t('Not a valid YouTube link', 'رابط يوتيوب غير صالح')}</p>}
                </div>
              )
            })}
            <div className="flex gap-1.5">
              <button onClick={() => setMedia(ms => [...ms, { id: `m${Date.now()}`, type: 'video', label: '' }])}
                className="flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1" style={{ background: `${accent}12`, color: accent, border: `1px dashed ${accent}55` }}>
                <Video className="w-3 h-3" /> {t('Add video', 'فيديو')}
              </button>
              <button onClick={() => setMedia(ms => [...ms, { id: `m${Date.now()}`, type: 'image', label: '' }])}
                className="flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1" style={{ background: `${accent}12`, color: accent, border: `1px dashed ${accent}55` }}>
                <ImageIcon className="w-3 h-3" /> {t('Add image', 'صورة')}
              </button>
            </div>
            <p className="text-[10px]" style={{ color: E.t3 }}>{t('All media renders 16:9. One item hides the thumbnail strip.', 'كل الوسائط 16:9. عنصر واحد يخفي الشريط.')}</p>
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
            <div key={r.id} className="p-2.5 rounded-xl flex flex-col gap-2" style={{ background: E.card, border: `1px solid ${E.bd}` }}>
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
              <div className="flex items-center gap-1.5">
                <label className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
                  style={{ background: '#fff', color: accent, border: `1px dashed ${accent}66` }}>
                  <Upload className="w-3 h-3" /> {r.image ? t('Replace image', 'استبدال') : t('Upload image', 'رفع صورة')}
                  <input type="file" accept="image/*" hidden onChange={e => uploadReview(e.target.files?.[0], r.id)} />
                </label>
                {r.image && (
                  <button onClick={() => setReviews(rs => rs.map(x => x.id === r.id ? { ...x, image: undefined, hasImage: false } : x))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#fee2e2', color: '#dc2626' }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button onClick={() => setReviews(rs => [...rs, { id: `r${Date.now()}`, name: 'New member', initials: 'NM', rating: 5, hasImage: false, text: 'What this member says about your community.' }])}
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
