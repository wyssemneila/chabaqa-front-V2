import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity } from '@/lib/community-data'
import { ShoppingBag, Download, Star } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

const TYPE_CONFIG = {
  preset:   { label: 'Preset',   labelAr: 'بريسيت',  bg: '#ede9ff', color: '#8e78fb' },
  template: { label: 'Template', labelAr: 'قالب',     bg: '#e4f8fd', color: '#47c7ea' },
  ebook:    { label: 'E-Book',   labelAr: 'كتاب',    bg: '#ede9ff', color: '#6c52f0' },
  other:    { label: 'Other',    labelAr: 'أخرى',    bg: '#f3f4f6', color: '#9590b8' },
}

export default async function ProductsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const tabs = [
    { label: 'All', labelAr: 'الكل' },
    { label: 'Presets', labelAr: 'بريسيت' },
    { label: 'Templates', labelAr: 'قوالب' },
    { label: 'E-Books', labelAr: 'كتب' },
  ]

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1a1730' }}>
          {isAr ? 'المنتجات' : 'Products'}
        </h1>
        <p className="mt-1" style={{ color: '#9590b8' }}>
          {isAr ? 'أدوات وموارد لتسريع عملك' : 'Tools and resources to accelerate your work'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b" style={{ borderColor: '#e8e4ff' }}>
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            className="pb-3 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: i === 0 ? '#8e78fb' : 'transparent',
              color: i === 0 ? '#1a1730' : '#9590b8',
            }}
          >
            {isAr ? tab.labelAr : tab.label}
          </button>
        ))}
      </div>

      {/* Product Rows */}
      <div className="rounded-xl overflow-hidden divide-y" style={{ border: '1px solid #e8e4ff', background: '#fff' }}>
        {community.products.map((product) => {
          const typeConf = TYPE_CONFIG[product.type]
          return (
            <div key={product.id} className="flex gap-5 p-5">
              {/* Thumbnail — 16:9 */}
              <div className="flex-shrink-0 w-[240px] aspect-video rounded-xl flex items-center justify-center" style={{ background: '#f7f7fe' }}>
                <ShoppingBag className="w-10 h-10" style={{ color: '#c4b8fd' }} />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: typeConf.bg, color: typeConf.color }}>
                    {isAr ? typeConf.labelAr : typeConf.label}
                  </span>
                  <h3 className="text-base font-bold mt-2 truncate" style={{ color: '#1a1730' }}>
                    {product.title}
                  </h3>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: '#9590b8' }}>
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm" style={{ color: '#9590b8' }}>
                    <Download className="w-3.5 h-3.5" />
                    <span>{product.downloadsCount} {isAr ? 'تحميل' : 'downloads'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  {product.price === 'free' ? (
                    <span className="text-lg font-bold" style={{ color: '#8e78fb' }}>{isAr ? 'مجاني' : 'Free'}</span>
                  ) : (
                    <span className="text-lg font-bold" style={{ color: '#8e78fb' }}>
                      {product.price} <span className="text-sm font-medium">{product.currency || 'TND'}</span>
                    </span>
                  )}
                  <button className="px-5 py-2.5 text-sm font-semibold rounded-lg text-white" style={{ background: '#8e78fb' }}>
                    {product.purchased
                      ? (isAr ? 'تحميل' : 'Download')
                      : product.price === 'free'
                        ? (isAr ? 'تحميل' : 'Download')
                        : (isAr ? 'اشتري الآن' : 'Buy Now')}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
