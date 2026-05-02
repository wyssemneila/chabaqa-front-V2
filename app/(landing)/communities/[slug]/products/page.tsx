import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { ShoppingBag, Download, FileText, Layers, Wand2, Package } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

const TYPE_ICON: Record<string, React.ReactNode> = {
  ebook:    <FileText className="w-8 h-8" strokeWidth={1.3} />,
  template: <Layers className="w-8 h-8" strokeWidth={1.3} />,
  preset:   <Wand2 className="w-8 h-8" strokeWidth={1.3} />,
  other:    <Package className="w-8 h-8" strokeWidth={1.3} />,
}

const TYPE_CONFIG = {
  ebook:    { label: 'E-Book',   labelAr: 'كتاب',  color: '#8e78fb', bg: '#ede9ff' },
  template: { label: 'Template', labelAr: 'قالب',  color: '#47c7ea', bg: '#e0f7fc' },
  preset:   { label: 'Preset',   labelAr: 'إعداد', color: '#ff9b28', bg: '#fff4e5' },
  other:    { label: 'Product',  labelAr: 'منتج',  color: '#9ca3af', bg: '#f3f4f6' },
}

export default async function ProductsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--t1)' }}>{isAr ? 'المنتجات الرقمية' : 'Digital Products'}</h2>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>{isAr ? 'موارد وأدوات لتطوير مهاراتك' : 'Resources and tools to level up your skills'}</p>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {[
          { value: community.products.length, label: isAr ? 'منتج' : 'Products', color: 'var(--p)' },
          { value: community.products.filter(p => p.price === 'free').length, label: isAr ? 'مجاني' : 'Free', color: '#10b981' },
          { value: community.products.reduce((a, p) => a + p.downloadsCount, 0), label: isAr ? 'تنزيل' : 'Downloads', color: 'var(--orange)' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl flex-shrink-0" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <span className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[10px]" style={{ color: 'var(--t3)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {community.products.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <ShoppingBag className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--p3)' }} strokeWidth={1.5} />
          <p className="text-sm font-semibold" style={{ color: 'var(--t2)' }}>{isAr ? 'لا توجد منتجات بعد' : 'No products yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {community.products.map(product => {
            const typeConf = TYPE_CONFIG[product.type]
            return (
              <article key={product.id} className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_48px_rgba(142,120,251,.18)] cursor-pointer" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
                <div className="h-36 flex items-center justify-center flex-shrink-0" style={{ background: typeConf.bg, color: typeConf.color }}>{TYPE_ICON[product.type]}</div>
                <div className="flex flex-col flex-1 p-4 gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full self-start" style={{ background: typeConf.bg, color: typeConf.color }}>{isAr ? typeConf.labelAr : typeConf.label}</span>
                  <h3 className="text-sm font-bold leading-snug group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>{product.title}</h3>
                  <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--t2)' }}>{product.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid var(--bd)' }}>
                    <span className="text-sm font-extrabold" style={{ color: product.price === 'free' ? '#10b981' : 'var(--p)' }}>
                      {product.price === 'free' ? (isAr ? 'مجاني' : 'Free') : `${product.price} ${product.currency}`}
                    </span>
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--t3)' }}>
                      <Download className="w-3 h-3" strokeWidth={1.7} />{product.downloadsCount}
                    </span>
                  </div>
                  <button className="w-full py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80" style={{ background: 'var(--p)', color: '#fff' }}>
                    {product.price === 'free' ? (isAr ? 'تنزيل مجاني' : 'Download Free') : (isAr ? 'اشتر الآن' : 'Get Now')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}
