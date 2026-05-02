import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { ShoppingBag, Download, FileText, Layers, Wand2, Package } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

const TYPE_CONFIG = {
  ebook:    { label: 'E-Book',   labelAr: 'كتاب إلكتروني', color: '#8e78fb', bg: '#ede9ff', Icon: FileText },
  template: { label: 'Template', labelAr: 'قالب',           color: '#47c7ea', bg: '#e0f7fc', Icon: Layers },
  preset:   { label: 'Preset',   labelAr: 'إعداد مسبق',    color: '#ff9b28', bg: '#fff4e5', Icon: Wand2 },
  other:    { label: 'Product',  labelAr: 'منتج',           color: '#9ca3af', bg: '#f3f4f6', Icon: Package },
}

export default async function ProductsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const freeCount = community.products.filter(p => p.price === 'free').length
  const totalDownloads = community.products.reduce((a, p) => a + p.downloadsCount, 0)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold" style={{ color: 'var(--t1)' }}>
          {isAr ? 'المنتجات الرقمية' : 'Digital Products'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--t3)' }}>
          {isAr ? 'موارد وأدوات احترافية لتطوير مهاراتك' : 'Professional resources and tools to level up your skills'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: community.products.length, label: isAr ? 'منتج' : 'Products', color: 'var(--p)', bg: 'var(--p2)', icon: <ShoppingBag className="w-4 h-4" strokeWidth={1.7} /> },
          { value: freeCount, label: isAr ? 'مجاني' : 'Free', color: '#10b981', bg: '#d1fae5', icon: <Download className="w-4 h-4" strokeWidth={1.7} /> },
          { value: totalDownloads, label: isAr ? 'تنزيل' : 'Downloads', color: 'var(--orange, #ff9b28)', bg: '#fff4e5', icon: <Download className="w-4 h-4" strokeWidth={1.7} /> },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-extrabold leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--t3)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Products grid */}
      {community.products.length === 0 ? (
        <div className="rounded-2xl p-14 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--p2)' }}>
            <ShoppingBag className="w-8 h-8" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد منتجات بعد' : 'No products yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {community.products.map(product => {
            const tc = TYPE_CONFIG[product.type]
            const { Icon } = tc
            const isFree = product.price === 'free'
            return (
              <article key={product.id}
                className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(142,120,251,.15)]"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

                {/* Thumbnail */}
                <div className="relative flex items-center justify-center overflow-hidden" style={{ height: 136, background: tc.bg }}>
                  <Icon className="w-12 h-12 opacity-50" style={{ color: tc.color }} />

                  {/* Free badge */}
                  {isFree && (
                    <div className="absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: '#10b981', color: '#fff' }}>
                      {isAr ? 'مجاني' : 'Free'}
                    </div>
                  )}

                  {/* Type badge */}
                  <div className="absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,.9)', color: tc.color, border: `1px solid ${tc.color}33` }}>
                    {isAr ? tc.labelAr : tc.label}
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <h3 className="text-sm font-bold leading-snug group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>
                    {product.title}
                  </h3>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--t2)' }}>
                    {product.description}
                  </p>

                  {/* Price + downloads */}
                  <div className="flex items-center justify-between pt-3 mt-auto" style={{ borderTop: '1px solid var(--bd)' }}>
                    <span className="text-base font-extrabold" style={{ color: isFree ? '#10b981' : 'var(--p)' }}>
                      {isFree ? (isAr ? 'مجاني' : 'Free') : `${product.price} ${product.currency ?? ''}`}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
                      <Download className="w-3.5 h-3.5" strokeWidth={1.7} />
                      {product.downloadsCount} {isAr ? 'تنزيل' : 'downloads'}
                    </span>
                  </div>

                  <button
                    className="w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95"
                    style={isFree
                      ? { background: '#10b981', color: '#fff' }
                      : product.purchased
                        ? { background: 'var(--p2)', color: 'var(--p)' }
                        : { background: 'var(--p)', color: '#fff' }
                    }>
                    {product.purchased
                      ? (isAr ? '↓ تنزيل' : '↓ Download')
                      : isFree
                        ? (isAr ? '↓ تنزيل مجاني' : '↓ Download Free')
                        : (isAr ? 'اشتر الآن' : 'Buy Now')
                    }
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
