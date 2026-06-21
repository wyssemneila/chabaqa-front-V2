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

  return (
    <div className="flex flex-col gap-5">

      {/* Products grid */}
      {community.products.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--p2)' }}>
            <ShoppingBag className="w-7 h-7" style={{ color: 'var(--p)' }} strokeWidth={1.3} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: 'var(--t1)' }}>
            {isAr ? 'لا توجد منتجات بعد' : 'No products yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--t3)' }}>
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {community.products.map(product => {
            const tc = TYPE_CONFIG[product.type]
            const { Icon } = tc
            const isFree = product.price === 'free'
            return (
              <article key={product.id}
                className="group flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-md"
                style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>

                {/* Thumbnail */}
                <div className="relative flex items-center justify-center overflow-hidden" style={{ height: 140, background: tc.bg }}>
                  <Icon className="w-10 h-10 opacity-50" style={{ color: tc.color }} />

                  {/* Type badge */}
                  <div className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,.9)', color: tc.color, border: `1px solid ${tc.color}33` }}>
                    {isAr ? tc.labelAr : tc.label}
                  </div>

                  {/* Price badge */}
                  <span className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={isFree
                      ? { background: '#10b981', color: '#fff' }
                      : { background: 'var(--white)', color: 'var(--t1)', border: '1px solid var(--bd)' }
                    }>
                    {isFree ? (isAr ? 'مجاني' : 'Free') : `${product.price} ${product.currency ?? ''}`}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <h3 className="text-sm font-bold leading-snug group-hover:text-[var(--p)] transition-colors" style={{ color: 'var(--t1)' }}>
                    {product.title}
                  </h3>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--t2)' }}>
                    {product.description}
                  </p>

                  {/* Download count */}
                  <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--t3)' }}>
                    <Download className="w-3.5 h-3.5" strokeWidth={1.7} />
                    {product.downloadsCount} {isAr ? 'تنزيل' : 'downloads'}
                  </span>

                  {/* CTA */}
                  <button
                    className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
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
