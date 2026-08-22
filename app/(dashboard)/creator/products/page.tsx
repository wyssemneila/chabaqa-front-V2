'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { Plus, Package, Pencil, Trash2, ShieldCheck, FileArchive, DollarSign, Tag, Layers, Zap, ShoppingBag } from 'lucide-react'
import { PageStatsBar, PageFilterTabs } from '@/components/creator-dashboard/PageStatsBar'

interface Product {
  id: string; title: string; description: string; category: string
  thumbnail: string; license: string; priceType: 'free' | 'paid'
  price: number; hasTiers: boolean; tiers: any[]
  isPublished: boolean; files: any[]; whatIncluded: string[]
}

type ProdTab = 'all' | 'active' | 'inactive'

export default function ProductsPage() {
  const router = useRouter()
  const { lang } = useDashPrefs()
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab, setTab] = useState<ProdTab>('all')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chabaqa_products')
      setProducts(raw ? JSON.parse(raw) : [])
    } catch { setProducts([]) }
    finally   { setLoading(false) }
  }, [])

  const del = (id: string) => {
    const next = products.filter(p => p.id !== id)
    setProducts(next)
    localStorage.setItem('chabaqa_products', JSON.stringify(next))
  }

  const priceLabel = (p: Product) => {
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
          <main id="main-content" className="p-7 flex-1 space-y-6" style={{ animation:'dashFadeUp .4s ease both' }}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-semibold" style={{ color:'var(--t1)' }}>
                  {lang==='ar' ? 'منتجاتك' : 'Your Products'}
                </h2>
                <p className="text-[13px] mt-0.5" style={{ color:'var(--t3)' }}>
                  {products.length} {lang==='ar' ? 'منتجات مُنشأة' : 'products created'}
                </p>
              </div>
              <button onClick={() => router.push('/creator/products/create')}
                className="flex items-center gap-2 h-10 px-4 rounded-xl text-[13px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background:'var(--p)', boxShadow: '0 4px 14px rgba(142,120,251,.4)' }}>
                <Plus className="w-4 h-4" strokeWidth={1.7} /> {lang==='ar' ? 'إنشاء منتج' : 'Create Product'}
              </button>
            </div>

            {/* Stats */}
            <PageStatsBar stats={[
              { label: lang==='ar' ? 'إجمالي المنتجات' : 'Total Products',
                value: products.length, icon: ShoppingBag,
                color: 'var(--p)', bg: 'var(--p2)' },
              { label: lang==='ar' ? 'نشط' : 'Active',
                value: products.filter(p => p.isPublished).length, icon: Zap,
                color: 'var(--pink)', bg: 'rgba(236,72,153,.1)' },
              { label: lang==='ar' ? 'إجمالي الملفات' : 'Total Files',
                value: products.reduce((n, p) => n + (p.files?.length ?? 0), 0), icon: FileArchive,
                color: 'var(--cyan)', bg: 'rgba(34,211,238,.12)' },
            ]} />

            {/* Section header + filter tabs */}
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold" style={{ color:'var(--t1)' }}>
                {lang==='ar' ? 'كل المنتجات' : 'All Products'}
              </h3>
              <PageFilterTabs<ProdTab>
                active={tab}
                onChange={setTab}
                tabs={[
                  { key:'all',      label: lang==='ar' ? 'الكل' : 'All' },
                  { key:'active',   label: lang==='ar' ? 'نشط' : 'Active' },
                  { key:'inactive', label: lang==='ar' ? 'غير نشط' : 'Inactive' },
                ]}
                counts={{
                  all:      products.length,
                  active:   products.filter(p => p.isPublished).length,
                  inactive: products.filter(p => !p.isPublished).length,
                }} />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--p3)] border-t-[var(--p)] animate-spin" />
              </div>
            ) : products.length === 0 ? (
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
                {products
                  .filter((p) => tab === 'all' ? true : tab === 'active' ? p.isPublished : !p.isPublished)
                  .map((p, i) => (
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
                          <button onClick={() => router.push(`/creator/products/${p.id}/edit`)}
                            aria-label="Edit product"
                            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-70"
                            style={{ background:'var(--bg)', color:'var(--t3)' }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => del(p.id)}
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
