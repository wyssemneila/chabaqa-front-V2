import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { getCommunity } from '@/lib/community-data'
import { ShoppingBag, Download } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

const TYPE_CONFIG = {
  preset:   { label: 'Preset',   labelAr: 'بريسيت',  color: '#8b5cf6' },
  template: { label: 'Template', labelAr: 'قالب',     color: '#3b82f6' },
  ebook:    { label: 'E-Book',   labelAr: 'كتاب',    color: '#10b981' },
  other:    { label: 'Other',    labelAr: 'أخرى',    color: '#9ca3af' },
}

export default async function ProductsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const tabs = ['All', 'Presets', 'Templates', 'E-Books']

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? 'المنتجات' : 'Products'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isAr ? 'أدوات وموارد لتسريع عملك' : 'Tools and resources to accelerate your work'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-100">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              i === 0
                ? 'border-[#3AAFA9] text-[#3AAFA9]'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Product Rows */}
      <div className="bg-white rounded-xl divide-y divide-gray-100">
        {community.products.map((product) => {
          const typeConf = TYPE_CONFIG[product.type]
          return (
            <div key={product.id} className="flex gap-5 p-5">
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-[200px] h-[140px] rounded-xl bg-gray-50 flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-gray-300" />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  {/* Type badge */}
                  <span className="text-xs font-medium" style={{ color: typeConf.color }}>
                    {isAr ? typeConf.labelAr : typeConf.label}
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 mt-1 truncate">
                    {product.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                    <Download className="w-3.5 h-3.5" />
                    <span>{product.downloadsCount} downloads</span>
                  </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between mt-3">
                  {product.price === 'free' ? (
                    <span className="text-sm font-medium text-green-600">Free</span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">
                      {product.price} {product.currency || 'TND'}
                    </span>
                  )}
                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-[#3AAFA9] text-white">
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
