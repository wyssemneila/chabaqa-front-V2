'use client'

import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { useCreatorProductsPage } from '@/hooks/creator-dashboard/use-creator-dashboard-data'
import { productsApi } from '@/lib/api'
import { toast } from 'sonner'
import { useState } from 'react'
import type { CreatorProductCard } from '@/lib/creator-dashboard/fetch-adapters'
import { Plus, Package, Pencil, Trash2, ShieldCheck, FileArchive, DollarSign, Tag } from 'lucide-react'

export default function ProductsPage() {
  const router = useRouter()
  const { lang } = useDashPrefs()
  const { data: products, loading, error, refetch } = useCreatorProductsPage()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const del = async (id: string) => {
    if (!window.confirm('Delete this product?')) return
    setDeletingId(id)
    try {
      await productsApi.delete(id)
      toast.success('Product deleted')
      refetch()
    } catch (err: any) {
      toast.error(err?.message || 'Could not delete the product.')
    } finally {
      setDeletingId(null)
    }
  }

  const priceLabel = (p: CreatorProductCard) => {
    if (p.priceType === 'free') return 'Free'
    if (p.hasTiers && p.tiers?.length) {
      const min = Math.min(...p.tiers.map((t:any)=>t.price))
      return `From ${min} TND`
    }
    return `${p.price} TND`
  }

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>
      <div className="flex min-h-screen" style={{ background:'var(--bg)' }}>
        <DashSidebar />
        <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title="Products" subtitle="Sell digital files to your community" />
          <main id="main-content" className="p-7 flex-1" style={{ animation:'dashFadeUp .4s ease both' }}>

            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] font-semibold" style={{ color:'var(--t3)' }}>
                {products.length} product{products.length!==1?'s':''}
              </p>
              <button onClick={() => router.push('/creator/products/create')}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background:'var(--p)' }}>
                <Plus className="w-4 h-4" strokeWidth={1.7} /> New Product
              </button>
            </div>

            {error && !loading && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}>
                Could not load the live product list. <button onClick={refetch} className="font-bold underline">Retry</button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--p3)] border-t-[var(--p)] animate-spin" />
              </div>
            ) : error ? null : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed"
                style={{ borderColor:'var(--bd)', background:'var(--white)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background:'var(--p2)' }}>
                  <Package className="w-8 h-8" style={{ color:'var(--p)' }} strokeWidth={1.7} />
                </div>
                <p className="text-[15px] font-bold mb-1.5" style={{ color:'var(--t1)' }}>No products yet</p>
                <p className="text-[13px] mb-6" style={{ color:'var(--t3)' }}>Upload your first digital product</p>
                <button onClick={() => router.push('/creator/products/create')}
                  className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90"
                  style={{ background:'var(--p)' }}>
                  <Plus className="w-4 h-4" strokeWidth={1.7} /> New Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 max-w-4xl">
                {products.map((p, i) => (
                  <div key={p.id}
                    className="flex gap-4 rounded-2xl overflow-hidden transition-all duration-200"
                    style={{ background:'var(--white)', border:'1px solid var(--bd)', animation:`dashFadeUp .3s ${i*60}ms ease both` }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(0,0,0,.07)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow='none'}>

                    {/* cover */}
                    <div className="w-[140px] shrink-0 relative"
                      style={{ background:'linear-gradient(135deg,var(--p) 0%,#6c52f0 100%)' }}>
                      {p.thumbnail
                        ? <img src={p.thumbnail} alt="Product thumbnail" loading="lazy" className="w-full h-full object-cover" />
                        : <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-8 h-8 text-white opacity-40" strokeWidth={1.7} />
                          </div>
                      }
                    </div>

                    {/* info */}
                    <div className="flex-1 py-4 pr-4 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-[14px] font-bold truncate" style={{ color:'var(--t1)' }}>{p.title}</p>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 border"
                              style={p.isPublished
                                ? { background:'rgba(74,222,128,.12)', color:'#16a34a', borderColor:'rgba(74,222,128,.3)' }
                                : { background:'var(--bg)', color:'var(--t3)', borderColor:'var(--bd)' }}>
                              {p.isPublished ? (lang==='ar'?'منشور':'Published') : (lang==='ar'?'مسودة':'Draft')}
                            </span>
                          </div>
                          <p className="text-[12px] truncate" style={{ color:'var(--t2)' }}>{p.description}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => router.push(`/creator/products/${p.id}/manage`)}
                            aria-label="Edit product"
                            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
                            style={{ background:'var(--bg)', color:'var(--t3)' }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => del(p.id)}
                            disabled={deletingId === p.id}
                            aria-label="Delete product"
                            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
                            style={{ background:'rgba(239,68,68,.08)', color:'#ef4444' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {p.category && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background:'var(--p2)', color:'var(--p)' }}>
                            <Tag className="w-2.5 h-2.5" strokeWidth={1.7} /> {p.category}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px]" style={{ color:'var(--t3)' }}>
                          <FileArchive className="w-3 h-3" strokeWidth={1.7} />
                          {p.files?.length ?? 0} file{(p.files?.length ?? 0)!==1?'s':''}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold"
                          style={{ color: p.priceType==='free' ? 'var(--cyan)' : 'var(--orange)' }}>
                          <DollarSign className="w-3 h-3" strokeWidth={1.7} />
                          {priceLabel(p)}
                          {p.hasTiers && p.tiers?.length > 0 && ` · ${p.tiers.length} tiers`}
                        </span>
                        {p.license && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
                            style={{ background:'var(--bg)', color:'var(--t3)' }}>
                            <ShieldCheck className="w-2.5 h-2.5" strokeWidth={1.7} /> {p.license}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
