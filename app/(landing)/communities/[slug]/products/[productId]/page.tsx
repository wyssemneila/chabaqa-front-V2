import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity } from '@/lib/community-data'
import type { CommunityProduct } from '@/lib/community-data'
import {
  ArrowLeft, Download, Star, ShieldCheck, FileDown,
  CheckCircle2, User, Zap, RefreshCw, MessageCircle,
} from 'lucide-react'

interface Props { params: Promise<{ slug: string; productId: string }> }

export default async function ProductDetailPage({ params }: Props) {
  const { slug, productId } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const product = community.products.find((p) => p.id === productId)
  if (!product) notFound()
  const isAr = locale === 'ar'

  const free = product.price === 'free' || product.price === 0
  const title = isAr && product.titleAr ? product.titleAr : product.title
  const description = isAr && product.descriptionAr ? product.descriptionAr : product.description

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back */}
      <Link href={`/communities/${slug}/products`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-5 transition-colors hover:text-[#8e78fb]"
            style={{ color: '#9590b8' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        {isAr ? 'المنتجات' : 'Products'}
      </Link>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

        {/* LEFT — Main content */}
        <div>
          {/* Title + meta */}
          <div className="mb-6">
            {product.purchased && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
                    style={{ background: '#d1fae5', color: '#059669' }}>
                <CheckCircle2 className="w-3 h-3" />
                {isAr ? 'مشتراة' : 'Owned'}
              </span>
            )}
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em]" style={{ color: '#1a1730' }}>
              {title}
            </h1>
            {product.creator && (
              <div className="flex items-center gap-2 mt-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                     style={{ background: '#ede9ff' }}>
                  <User className="w-3 h-3" style={{ color: '#8e78fb' }} />
                </div>
                <span className="text-[13px]" style={{ color: '#9590b8' }}>
                  {product.creator}
                </span>
                {product.rating !== undefined && (
                  <>
                    <span style={{ color: '#d8d5e8' }}>·</span>
                    <span className="flex items-center gap-1 text-[13px]">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold" style={{ color: '#46426a' }}>{product.rating.toFixed(1)}</span>
                      <span style={{ color: '#9590b8' }}>({product.ratingCount || 0})</span>
                    </span>
                  </>
                )}
                <span style={{ color: '#d8d5e8' }}>·</span>
                <span className="flex items-center gap-1 text-[13px]" style={{ color: '#9590b8' }}>
                  <Download className="w-3.5 h-3.5" />
                  {product.downloadsCount}
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-px mb-6" style={{ background: '#ede9ff' }} />

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
              {isAr ? 'الوصف' : 'Description'}
            </h2>
            <p className="text-[14px] leading-[1.7]" style={{ color: '#6b6885' }}>
              {description}
            </p>
          </div>

          {/* What you get */}
          <div>
            <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
              {isAr ? 'ماذا تحصل عليه' : 'What you get'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: FileDown, text: isAr ? 'تحميل فوري للملف' : 'Instant file download', color: '#8e78fb' },
                { icon: RefreshCw, text: isAr ? 'تحديثات مستقبلية مجانية' : 'Free future updates', color: '#47c7ea' },
                { icon: MessageCircle, text: isAr ? 'دعم عبر المجتمع' : 'Community support', color: '#f65887' },
                { icon: Zap, text: isAr ? 'وصول مدى الحياة' : 'Lifetime access', color: '#ff9b28' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                       style={{ background: '#f9f8fd' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                         style={{ background: `${item.color}12` }}>
                      <Icon className="w-4 h-4" style={{ color: item.color }} strokeWidth={1.7} />
                    </div>
                    <span className="text-[13px] font-medium" style={{ color: '#46426a' }}>{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT — Sticky sidebar */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #e8e4ff', background: '#fff' }}>

            {/* Price section */}
            <div className="p-5 pb-4">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[32px] font-bold tracking-tight" style={{ color: '#1a1730' }}>
                  {free ? (isAr ? 'مجاني' : 'Free') : `${product.price}`}
                </span>
                {!free && (
                  <span className="text-[14px] font-medium" style={{ color: '#9590b8' }}>
                    {product.currency || 'TND'}
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-4">
              {product.purchased ? (
                <button className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
                        style={{ background: '#10b981' }}>
                  <Download className="w-4.5 h-4.5" strokeWidth={2} />
                  {isAr ? 'تحميل الملف' : 'Download file'}
                </button>
              ) : (
                <button className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
                        style={{ background: '#8e78fb', boxShadow: '0 4px 14px rgba(142,120,251,.35)' }}>
                  <Download className="w-4.5 h-4.5" strokeWidth={2} />
                  {free
                    ? (isAr ? 'تحميل مجاني' : 'Get it free')
                    : (isAr ? 'اشترِ الآن' : 'Buy now')}
                </button>
              )}
              {!product.purchased && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px]" style={{ color: '#b5b0d0' }}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isAr ? 'دفع آمن ومشفّر' : 'Secure & encrypted'}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-5 h-px" style={{ background: '#f0edf8' }} />

            {/* Details list */}
            <div className="p-5 space-y-3">
              <DetailRow label={isAr ? 'المنشئ' : 'Creator'} value={product.creator || community.creatorName} />
              <DetailRow label={isAr ? 'التنزيلات' : 'Downloads'} value={String(product.downloadsCount)} />
              {product.rating !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: '#9590b8' }}>{isAr ? 'التقييم' : 'Rating'}</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[12px] font-semibold" style={{ color: '#46426a' }}>
                      {product.rating.toFixed(1)}
                    </span>
                    <span className="text-[11px]" style={{ color: '#9590b8' }}>({product.ratingCount})</span>
                  </span>
                </div>
              )}
              <DetailRow label={isAr ? 'النوع' : 'Type'} value={isAr ? 'ملف رقمي' : 'Digital file'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px]" style={{ color: '#9590b8' }}>{label}</span>
      <span className="text-[12px] font-semibold" style={{ color: '#46426a' }}>{value}</span>
    </div>
  )
}
