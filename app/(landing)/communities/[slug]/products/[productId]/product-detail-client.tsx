'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CommunityProduct } from '@/lib/community-data'
import {
  ArrowLeft, Download, ShieldCheck, FileDown,
  CheckCircle2, Zap, RefreshCw, MessageCircle,
  Minus, Plus,
} from 'lucide-react'

interface Props {
  slug: string
  product: CommunityProduct
  communityCreator: string
}

export default function ProductDetailClient({ slug, product, communityCreator }: Props) {
  const free = product.price === 'free' || product.price === 0
  const hasVariants = product.variants && product.variants.length > 0

  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants ? product.variants![0].id : null
  )
  const [quantity, setQuantity] = useState(1)

  const activeVariant = hasVariants
    ? product.variants!.find((v) => v.id === selectedVariant) || product.variants![0]
    : null

  const unitPrice = activeVariant
    ? (activeVariant.price === 'free' ? 0 : activeVariant.price)
    : (free ? 0 : (product.price as number))

  const totalPrice = unitPrice * quantity
  const isFree = unitPrice === 0

  return (
    <div className="w-full">
      {/* Back */}
      <Link href={`/communities/${slug}/products`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-5 transition-colors hover:text-[#8e78fb]"
            style={{ color: '#9590b8' }}>
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

        {/* LEFT — Main content */}
        <div>
          {/* Title */}
          <div className="mb-6">
            {product.purchased && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
                    style={{ background: '#d1fae5', color: '#059669' }}>
                <CheckCircle2 className="w-3 h-3" />
                Owned
              </span>
            )}
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em]" style={{ color: '#1a1730' }}>
              {product.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[13px]" style={{ color: '#9590b8' }}>
                <Download className="w-3.5 h-3.5 inline mr-1" />
                {product.downloadsCount} downloads
              </span>
            </div>
          </div>

          <div className="h-px mb-6" style={{ background: '#ede9ff' }} />

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
              Description
            </h2>
            <p className="text-[14px] leading-[1.7]" style={{ color: '#6b6885' }}>
              {product.description}
            </p>
          </div>

          {/* What you get */}
          <div>
            <h2 className="text-[15px] font-semibold mb-3" style={{ color: '#1a1730' }}>
              What you get
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: FileDown, text: 'Instant file download', color: '#8e78fb' },
                { icon: RefreshCw, text: 'Free future updates', color: '#47c7ea' },
                { icon: MessageCircle, text: 'Community support', color: '#f65887' },
                { icon: Zap, text: 'Lifetime access', color: '#ff9b28' },
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

            {/* Variant selector */}
            {hasVariants && (
              <div className="p-5 pb-0">
                <p className="text-[12px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#9590b8' }}>
                  Choose option
                </p>
                <div className="space-y-2">
                  {product.variants!.map((v) => {
                    const selected = v.id === selectedVariant
                    const vFree = v.price === 'free' || v.price === 0
                    return (
                      <button key={v.id}
                        onClick={() => setSelectedVariant(v.id)}
                        className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer"
                        style={{
                          border: selected ? '2px solid #8e78fb' : '1px solid #e8e4ff',
                          background: selected ? '#f9f7ff' : '#fff',
                          padding: selected ? '11px' : '12px',
                        }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                               style={{ borderColor: selected ? '#8e78fb' : '#d8d5e8' }}>
                            {selected && (
                              <div className="w-2 h-2 rounded-full" style={{ background: '#8e78fb' }} />
                            )}
                          </div>
                          <span className="text-[13px] font-medium" style={{ color: '#1a1730' }}>
                            {v.label}
                          </span>
                        </div>
                        <span className="text-[13px] font-bold" style={{ color: vFree ? '#059669' : '#8e78fb' }}>
                          {vFree ? 'Free' : `${v.price} ${product.currency || 'TND'}`}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Price + Quantity */}
            <div className="p-5 pb-4">
              {/* Quantity picker — only for paid */}
              {!isFree && !product.purchased && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: '#9590b8' }}>
                    Quantity
                  </span>
                  <div className="flex items-center gap-0 rounded-lg overflow-hidden" style={{ border: '1px solid #e8e4ff' }}>
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-[#f9f7ff] cursor-pointer"
                      style={{ color: quantity <= 1 ? '#d8d5e8' : '#46426a' }}
                      disabled={quantity <= 1}>
                      <Minus className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                    <span className="w-10 h-9 flex items-center justify-center text-[14px] font-bold"
                          style={{ color: '#1a1730', borderLeft: '1px solid #e8e4ff', borderRight: '1px solid #e8e4ff' }}>
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(99, quantity + 1))}
                      className="w-9 h-9 flex items-center justify-center transition-colors hover:bg-[#f9f7ff] cursor-pointer"
                      style={{ color: '#46426a' }}>
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[32px] font-bold tracking-tight" style={{ color: '#1a1730' }}>
                  {isFree ? 'Free' : totalPrice}
                </span>
                {!isFree && (
                  <span className="text-[14px] font-medium" style={{ color: '#9590b8' }}>
                    {product.currency || 'TND'}
                  </span>
                )}
                {!isFree && quantity > 1 && (
                  <span className="text-[12px]" style={{ color: '#b5b0d0' }}>
                    ({unitPrice} × {quantity})
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 pb-4">
              {product.purchased ? (
                <button className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
                        style={{ background: '#10b981' }}>
                  <Download className="w-[18px] h-[18px]" strokeWidth={2} />
                  Download file
                </button>
              ) : (
                <button className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
                        style={{ background: '#8e78fb', boxShadow: '0 4px 14px rgba(142,120,251,.35)' }}>
                  <Download className="w-[18px] h-[18px]" strokeWidth={2} />
                  {isFree ? 'Get it free' : 'Buy now'}
                </button>
              )}
              {!product.purchased && (
                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px]" style={{ color: '#b5b0d0' }}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure & encrypted
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="mx-5 h-px" style={{ background: '#f0edf8' }} />

            {/* Details */}
            <div className="p-5 space-y-3">
              <DetailRow label="Creator" value={product.creator || communityCreator} />
              <DetailRow label="Downloads" value={String(product.downloadsCount)} />
              <DetailRow label="Type" value="Digital file" />
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
