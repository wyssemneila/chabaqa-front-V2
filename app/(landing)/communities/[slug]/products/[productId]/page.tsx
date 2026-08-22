import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getCommunity } from '@/lib/community-data'
import type { CommunityProduct } from '@/lib/community-data'
import {
  ArrowLeft, Download, Star, ShieldCheck, FileText, FileImage,
  Video, Music, FileArchive, FileSpreadsheet, FileType2,
  Info, Users, Clock, Package, CheckCircle2,
} from 'lucide-react'

interface Props { params: Promise<{ slug: string; productId: string }> }

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

export default async function ProductDetailPage({ params }: Props) {
  const { slug, productId } = await params
  const locale = await getLocale()
  const community = getCommunity(slug)
  if (!community) notFound()
  const product = community.products.find((p) => p.id === productId)
  if (!product) notFound()
  const isAr = locale === 'ar'

  const fileType = product.fileType || 'file'
  const cfg = FILE_CONFIG[fileType]
  const FileIcon = cfg.icon
  const free = product.price === 'free' || product.price === 0

  const title = isAr && product.titleAr ? product.titleAr : product.title
  const description = isAr && product.descriptionAr ? product.descriptionAr : product.description

  return (
    <div className="w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Back */}
      <Link href={`/communities/${slug}/products`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 transition-colors hover:text-[#8e78fb]"
            style={{ color: '#46426a' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        {isAr ? 'العودة للمنتجات' : 'Back to products'}
      </Link>

      {/* Compact header */}
      <div className="rounded-2xl border p-5 mb-4" style={{ borderColor: '#e8e4ff', background: '#fff' }}>
        <div className="flex items-start gap-4 flex-wrap">
          {/* File type icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
               style={{ background: cfg.bg }}>
            <FileIcon className="w-7 h-7" style={{ color: cfg.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md text-white tracking-wider"
                    style={{ background: cfg.color }}>
                {cfg.label}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: free ? '#d1fae5' : '#ede9ff', color: free ? '#10b981' : '#8e78fb' }}>
                {free ? (isAr ? 'مجاني' : 'Free') : `${product.price} ${product.currency || 'TND'}`}
              </span>
              {product.purchased && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#d1fae5', color: '#10b981' }}>
                  ✓ {isAr ? 'مشتراة' : 'Owned'}
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-bold leading-tight" style={{ color: '#1a1730' }}>{title}</h1>
            {product.creator && (
              <p className="text-[13px] mt-1" style={{ color: '#9590b8' }}>
                {isAr ? 'بواسطة' : 'By'}{' '}
                <span className="font-semibold" style={{ color: '#46426a' }}>{product.creator}</span>
              </p>
            )}
          </div>

        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap gap-2">
          <StatChip icon={<Download className="w-3 h-3" />} value={product.downloadsCount} label={isAr ? 'تحميل' : 'Downloads'} />
          {product.rating !== undefined && (
            <StatChip icon={<Star className="w-3 h-3" />} value={product.rating.toFixed(1)} label={`(${product.ratingCount || 0})`} iconColor="#f59e0b" />
          )}
          <StatChip icon={<Package className="w-3 h-3" />} value={cfg.label} label={isAr ? 'ملف' : 'file'} />
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
        {/* LEFT — Main content */}
        <div className="space-y-4">
          {/* Description card */}
          <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: '#8e78fb' }}>
                <Info className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-[17px] font-bold" style={{ color: '#1a1730' }}>
                {isAr ? 'حول المنتج' : 'About this product'}
              </h2>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: '#6b6885' }}>
              {description}
            </p>
          </div>

          {/* Reviews section */}
          {product.rating !== undefined && (
            <div className="rounded-2xl p-5 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{ background: '#fef3c7' }}>
                  <Star className="w-4 h-4" style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold" style={{ color: '#1a1730' }}>
                    {isAr ? 'التقييمات' : 'Reviews'}
                  </h2>
                  <p className="text-[11.5px]" style={{ color: '#9590b8' }}>
                    {product.rating.toFixed(1)} · {product.ratingCount || 0} {isAr ? 'تقييم' : 'reviews'}
                  </p>
                </div>
              </div>
              {/* Star bar */}
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5"
                        style={{ color: s <= Math.round(product.rating!) ? '#f59e0b' : '#e5e1f5' }}
                        fill={s <= Math.round(product.rating!) ? '#f59e0b' : 'none'} />
                ))}
                <span className="ml-2 text-[14px] font-bold" style={{ color: '#1a1730' }}>
                  {product.rating.toFixed(1)}
                </span>
              </div>
              <p className="text-[12px]" style={{ color: '#9590b8' }}>
                {isAr ? 'تقييمات المجتمع لهذا المنتج' : 'Community ratings for this product'}
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — Sidebar */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          {/* Purchase card (prominent when not owned) */}
          {!product.purchased && (
            <div className="rounded-xl p-4 border" style={{ background: '#fff', borderColor: '#e8e4ff' }}>
              <div className="text-center mb-3">
                <p className="text-[24px] font-bold" style={{ color: free ? '#10b981' : '#8e78fb' }}>
                  {free ? (isAr ? 'مجاني' : 'Free') : `${product.price} ${product.currency || 'TND'}`}
                </p>
              </div>
              <button className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ background: '#8e78fb' }}>
                <Download className="w-4 h-4" />
                {free ? (isAr ? 'تحميل مجاني' : 'Free download') : (isAr ? 'اشترِ الآن' : 'Buy now')}
              </button>
              <div className="mt-3 flex items-center gap-2 justify-center text-[11px]" style={{ color: '#9590b8' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {isAr ? 'دفع آمن' : 'Secure checkout'}
              </div>
            </div>
          )}

          {/* File info */}
          <MutedCard title={isAr ? 'معلومات الملف' : 'File info'} icon={<FileIcon className="w-3.5 h-3.5" />}>
            <div className="space-y-2">
              <InfoRow label={isAr ? 'النوع' : 'Type'} value={cfg.label} />
              <InfoRow label={isAr ? 'التنزيلات' : 'Downloads'} value={String(product.downloadsCount)} />
              {product.creator && <InfoRow label={isAr ? 'المنشئ' : 'Creator'} value={product.creator} />}
            </div>
          </MutedCard>

          {/* Includes */}
          <MutedCard title={isAr ? 'يتضمن' : 'Includes'} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
            <ul className="space-y-1.5">
              {[
                isAr ? 'تحميل فوري' : 'Instant download',
                isAr ? 'تحديثات مجانية' : 'Free updates',
                isAr ? 'دعم المجتمع' : 'Community support',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-[12px]" style={{ color: '#6b6885' }}>
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#8e78fb' }} />
                  {item}
                </li>
              ))}
            </ul>
          </MutedCard>
        </div>
      </div>
    </div>
  )
}

function StatChip({ icon, value, label, iconColor }:
  { icon: React.ReactNode; value: string | number; label?: string; iconColor?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium"
          style={{ background: 'rgba(142,120,251,0.1)', color: '#8e78fb' }}>
      <span style={{ color: iconColor || '#8e78fb' }}>{icon}</span>
      <span className="font-bold">{value}</span>
      {label && <span className="opacity-75">{label}</span>}
    </span>
  )
}

function MutedCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3" style={{ background: '#f6f5fb' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: '#9590b8' }}>{icon}</span>
        <h3 className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: '#9590b8' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px]" style={{ color: '#9590b8' }}>{label}</span>
      <span className="text-[12px] font-semibold" style={{ color: '#46426a' }}>{value}</span>
    </div>
  )
}
