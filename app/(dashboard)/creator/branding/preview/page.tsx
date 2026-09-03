'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Monitor, Tablet, Smartphone } from 'lucide-react'
import {
  Section, ProductsList, PageTabs, GF_URL, LANDING_DRAFT_KEY, DEFAULT_DRAFT,
  type LandingDraft, type PageId, type Device,
} from '@/components/creator-dashboard/landing-renderer'

/* Standalone full-page preview of the built landing page.
   Reads the draft the builder saves to localStorage. */
export default function LandingPreviewPage() {
  const [draft, setDraft] = useState<LandingDraft | null>(null)
  const [page, setPage] = useState<PageId>('home')
  const [device, setDevice] = useState<Device>('desktop')
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [openSec, setOpenSec] = useState<number | null>(0)
  const [activeMedia, setActiveMedia] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LANDING_DRAFT_KEY)
      setDraft(raw ? { ...DEFAULT_DRAFT, ...JSON.parse(raw) } : DEFAULT_DRAFT)
    } catch { setDraft(DEFAULT_DRAFT) }
  }, [])

  if (!draft) {
    return null // no full-screen loader; the top progress bar signals loading
  }

  const t = (en: string) => en
  const { design, content } = draft
  const maxW = device === 'mobile' ? 400 : device === 'tablet' ? 760 : 1040

  return (
    <>
      <link rel="stylesheet" href={GF_URL} />
      <div className="min-h-screen" style={{ background: '#edeef2' }}>

        {/* floating toolbar */}
        <div className="sticky top-0 z-50 h-12 px-4 flex items-center justify-between"
          style={{ background: '#fff', borderBottom: '1px solid #e4e2ef' }}>
          <Link href="/creator/branding" className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: '#f6f5fb', color: '#46426a' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to builder
          </Link>
          <span className="text-[11.5px] font-mono px-3 py-1 rounded-md truncate max-w-[320px]"
            style={{ background: '#f6f5fb', color: '#8a86a0', border: '1px solid #e4e2ef' }}>
            chabaqa.io/{content.slug}{page === 'products' ? '/products' : ''}
          </span>
          <div className="flex gap-1">
            {([{ id: 'desktop', Icon: Monitor }, { id: 'tablet', Icon: Tablet }, { id: 'mobile', Icon: Smartphone }] as const).map(d => (
              <button key={d.id} onClick={() => setDevice(d.id)} className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: device === d.id ? `${design.accent}18` : 'transparent', color: device === d.id ? design.accent : '#9a97ad' }}>
                <d.Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center p-6">
          <div className="w-full transition-all duration-300"
            style={{
              maxWidth: maxW, background: design.bg === 'tint' ? '#faf9ff' : design.bg === 'gradient' ? '#fbfaff' : '#fff',
              borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 44px rgba(26,23,48,.12)',
              height: 'fit-content', border: '1px solid #e4e2ef',
            }}>
            {(() => {
              const vis = draft.blocks.filter(b => b.visible)
              const hero = vis.find(b => b.type === 'hero')
              const rest = vis.filter(b => b.type !== 'hero')
              const render = (b: typeof vis[number], idx: number) => (
                <Section key={b.id} block={b} c={content} design={design} device={device} index={idx}
                  media={draft.media} activeMedia={activeMedia} setActiveMedia={setActiveMedia}
                  reviews={draft.reviews} page={page} setPage={setPage} t={t}
                  openFaq={openFaq} setOpenFaq={setOpenFaq} openSec={openSec} setOpenSec={setOpenSec} />
              )
              return (
                <>
                  {/* hero stays mounted across both pages */}
                  {hero && render(hero, 0)}
                  {!hero && design.showProducts && (
                    <div className="px-11 pt-8" style={{ background: '#fff' }}>
                      <PageTabs page={page} setPage={setPage} design={design} t={t} />
                    </div>
                  )}
                  {page === 'home'
                    ? rest.map((b, i) => render(b, i + 1))
                    : <ProductsList c={content} design={design} device={device}
                        products={draft.products.filter(p => p.visible)} t={t} />}
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </>
  )
}
