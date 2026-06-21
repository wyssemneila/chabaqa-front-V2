import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { ShoppingBag, Download, FileText, Layers, Wand2, Package } from 'lucide-react'
import { getCommunity } from '@/lib/community-data'

interface Props { params: Promise<{ slug: string }> }

export default async function ProductsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const typeIcon = (type: string) => {
    switch (type) {
      case 'ebook': return <FileText className="w-5 h-5 text-gray-400" />
      case 'template': return <Layers className="w-5 h-5 text-gray-400" />
      case 'preset': return <Wand2 className="w-5 h-5 text-gray-400" />
      default: return <Package className="w-5 h-5 text-gray-400" />
    }
  }

  const typeLabel = (type: string) => {
    if (isAr) {
      return type === 'ebook' ? 'كتاب' : type === 'template' ? 'قالب' : type === 'preset' ? 'إعداد مسبق' : 'أخرى'
    }
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          {isAr ? 'المنتجات' : 'Products'}
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {isAr ? `منتجات ${community.nameAr}` : `${community.name} products`}
        </p>
      </div>

      {/* Products grid */}
      {community.products.length === 0 ? (
        <div className="rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {isAr ? 'لا توجد منتجات بعد' : 'No products yet'}
          </p>
          <p className="text-[13px] text-gray-500">
            {isAr ? 'ترقبوا قريباً' : 'Check back soon'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {community.products.map((product) => (
            <div key={product.id} className="rounded-xl border border-gray-100 overflow-hidden">
              {/* Thumbnail */}
              <div className="relative h-[140px] bg-gray-50 flex items-center justify-center">
                {product.thumbnail ? (
                  <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  typeIcon(product.type)
                )}
                <span className="absolute top-3 left-3 text-[11px] font-medium bg-white/90 text-gray-700 px-2 py-0.5 rounded">
                  {typeLabel(product.type)}
                </span>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-2">
                <h3 className="text-[14px] font-semibold text-gray-900 line-clamp-1">
                  {product.title}
                </h3>
                <p className="text-[12px] text-gray-500 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center gap-2 text-[12px] text-gray-400">
                  <Download className="w-3.5 h-3.5" />
                  <span>{product.downloadsCount} {isAr ? 'تحميل' : 'downloads'}</span>
                </div>

                {/* Price + CTA */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[13px] font-semibold text-gray-900">
                    {product.price === 'free'
                      ? (isAr ? 'مجاني' : 'Free')
                      : `${product.price} ${product.currency || 'TND'}`}
                  </span>
                  <button
                    className={`text-[12px] font-medium px-3 py-1.5 rounded-lg ${
                      product.purchased
                        ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        : 'bg-[#3AAFA9] text-white'
                    }`}
                  >
                    {product.purchased
                      ? (isAr ? 'تحميل' : 'Download')
                      : (isAr ? 'اشتري الآن' : 'Buy Now')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
