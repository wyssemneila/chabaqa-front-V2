import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity } from '@/lib/community-data'
import type { CommunityProduct } from '@/lib/community-data'
import { Package, Star, Download, Search, FileText, FileImage, Video, Music, FileArchive, FileSpreadsheet, FileType2 } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

const FILE_CONFIG: Record<NonNullable<CommunityProduct['fileType']>, { label: string; icon: any; color: string; bg: string }> = {
  pdf:   { label: 'PDF',   icon: FileText,        color: '#ef4444', bg: '#fee2e2' },
  video: { label: 'VIDEO', icon: Video,           color: '#8b5cf6', bg: '#ede9fe' },
  audio: { label: 'AUDIO', icon: Music,           color: '#f59e0b', bg: '#fef3c7' },
  zip:   { label: 'ZIP',   icon: FileArchive,     color: '#6b7280', bg: '#f3f4f6' },
  image: { label: 'IMG',   icon: FileImage,       color: '#10b981', bg: '#d1fae5' },
  doc:   { label: 'DOC',   icon: FileType2,       color: '#3b82f6', bg: '#dbeafe' },
  xls:   { label: 'XLS',   icon: FileSpreadsheet, color: '#16a34a', bg: '#dcfce7' },
  ppt:   { label: 'PPT',   icon: FileType2,       color: '#f97316', bg: '#ffedd5' },
  file:  { label: 'FILE',  icon: FileType2,       color: '#8e78fb', bg: '#ede9ff' },
}

export default async function ProductsPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const isAr = locale === 'ar'

  const products = community.products

  const tabs = [
    { label: 'All',       labelAr: 'الكل',     count: products.length },
    { label: 'Free',      labelAr: 'مجاني',    count: products.filter((p) => p.price === 'free').length },
    { label: 'Paid',      labelAr: 'مدفوع',    count: products.filter((p) => p.price !== 'free').length },
    { label: 'Purchased', labelAr: 'مشتراة',   count: products.filter((p) => p.purchased).length },
  ]

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Tabs + Search */}
      <div className="flex items-center gap-6 mb-6 border-b" style={{ borderColor: '#e8e4ff' }}>
        {tabs.map((tab, i) => (
          <button key={tab.label}
                  className="pb-3 text-sm font-medium border-b-2 transition-colors"
                  style={{
                    borderColor: i === 0 ? '#8e78fb' : 'transparent',
                    color: i === 0 ? '#1a1730' : '#9590b8',
                  }}>
            {isAr ? tab.labelAr : tab.label} ({tab.count})
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9590b8' }} />
            <input type="text"
                   placeholder={isAr ? 'بحث في المنتجات...' : 'Search products...'}
                   className="pl-9 pr-4 py-2 text-sm rounded-lg bg-white focus:outline-none"
                   style={{ border: '1px solid #e8e4ff' }} />
          </div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border p-12 flex flex-col items-center gap-3"
             style={{ borderColor: '#e8e4ff', background: '#fff' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
               style={{ background: '#ede9ff' }}>
            <Package className="w-7 h-7" style={{ color: '#8e78fb' }} />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold" style={{ color: '#1a1730' }}>
              {isAr ? 'لا توجد منتجات بعد' : 'No products yet'}
            </p>
            <p className="text-[13px] mt-1" style={{ color: '#9590b8' }}>
              {isAr ? 'ستظهر القوالب والملفات والتنزيلات هنا' : 'Templates, presets, files and downloads will appear here'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const fileType = product.fileType || 'file'
            const cfg = FILE_CONFIG[fileType]
            const FileIcon = cfg.icon
            const free = product.price === 'free' || product.price === 0
            const title = isAr && product.titleAr ? product.titleAr : product.title
            const description = isAr && product.descriptionAr ? product.descriptionAr : product.description

            return (
              <Link key={product.id}
                    href={`/communities/${slug}/products/${product.id}`}
                    className="group rounded-2xl overflow-hidden border bg-white flex flex-col transition-all hover:shadow-xl hover:scale-[1.015]"
                    style={{ borderColor: '#e8e4ff' }}>
                {/* Banner 16:9 */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                  {product.banner ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={product.banner} alt={product.title}
                         className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"
                         style={{ background: cfg.bg }}>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                           style={{ background: '#fff', color: cfg.color }}>
                        <FileIcon className="w-7 h-7" />
                      </div>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 pointer-events-none"
                       style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.25) 0%, transparent 30%, transparent 70%, rgba(0,0,0,.3) 100%)' }} />

                  {/* File type badge top-right */}
                  <span className="absolute top-3 right-3 text-[11px] font-black px-2 py-1 rounded-md text-white shadow-md tracking-wider"
                        style={{ background: cfg.color }}>
                    {cfg.label}
                  </span>

                  {/* Purchased ribbon top-left */}
                  {product.purchased && (
                    <span className="absolute top-3 left-3 text-[11px] font-semibold px-2 py-1 rounded-md text-white shadow-md"
                          style={{ background: 'rgba(0,0,0,.55)' }}>
                      ✓ {isAr ? 'مشتراة' : 'Owned'}
                    </span>
                  )}

                  {/* Price pill bottom-left */}
                  <span className="absolute bottom-3 left-3 text-[12px] font-bold px-2.5 py-1 rounded-full shadow-md"
                        style={{
                          background: free ? '#10b981' : 'rgba(255,255,255,.95)',
                          color: free ? '#fff' : '#8e78fb',
                        }}>
                    {free
                      ? (isAr ? 'مجاني' : 'Free')
                      : `${product.price} ${product.currency || 'TND'}`}
                  </span>
                </div>

                {/* Body */}
                <div className="p-3.5 flex-1 flex flex-col gap-2">
                  <h3 className="text-[14px] font-bold line-clamp-2 leading-snug group-hover:text-[#8e78fb] transition-colors"
                      style={{ color: '#1a1730' }}>
                    {title}
                  </h3>
                  {description && (
                    <p className="text-[11.5px] line-clamp-2 leading-snug" style={{ color: '#9590b8' }}>
                      {description}
                    </p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: '#9590b8' }}>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {product.downloadsCount}
                    </span>
                    {product.rating !== undefined && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-semibold" style={{ color: '#46426a' }}>{product.rating.toFixed(1)}</span>
                        {product.ratingCount !== undefined && (
                          <span>({product.ratingCount})</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Creator row */}
                  {product.creator && (
                    <p className="text-[11px] truncate mt-auto" style={{ color: '#9590b8' }}>
                      {isAr ? 'بواسطة' : 'by'}{' '}
                      <span className="font-semibold" style={{ color: '#46426a' }}>{product.creator}</span>
                    </p>
                  )}

                  {/* CTA */}
                  <div className="w-full mt-1 py-2 text-[12px] font-semibold rounded-lg text-white text-center flex items-center justify-center gap-1.5 transition-opacity group-hover:opacity-90"
                       style={{ background: product.purchased ? '#10b981' : (free ? '#8e78fb' : '#8e78fb') }}>
                    <Download className="w-3 h-3" />
                    {product.purchased
                      ? (isAr ? 'تحميل' : 'Download')
                      : free
                        ? (isAr ? 'تحميل مجاني' : 'Free download')
                        : (isAr ? 'اشترِ الآن' : 'Buy now')}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
