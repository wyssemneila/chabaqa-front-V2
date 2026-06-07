'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { Loader2, AlertCircle } from 'lucide-react'
import { productsApi } from '@/lib/api/products.api'
import { ProductFormProvider } from './components/product-form-context'
import { ProductHeader } from './components/product-header'
import { ProductTabs } from './components/product-tabs'

function unwrapProduct(response: any) {
  const payload = response?.data?.product ?? response?.data?.data ?? response?.data ?? response
  return payload?.product ?? payload
}

export default function ManageProductPage() {
  const params = useParams<{ productId?: string; id?: string }>()
  const router = useRouter()
  const productId = String(params?.productId || params?.id || '')
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadProduct = async () => {
      if (!productId) {
        setError('Product ID is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await productsApi.getById(productId)
        const nextProduct = unwrapProduct(response)
        if (!nextProduct?.id && !nextProduct?._id) {
          throw new Error('Product was not found.')
        }
        if (!cancelled) setProduct(nextProduct)
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load product.')
          if (err?.statusCode === 404 || err?.status === 404) router.replace('/creator/products')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProduct()
    return () => {
      cancelled = true
    }
  }, [productId, router])

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <DashSidebar />
      <div className="md:ml-[220px] flex-1 flex flex-col min-h-screen">
        <DashTopbar title="Manage Product" subtitle="Edit product details, files, pricing and preview" />
        <main id="main-content" className="flex-1 p-7">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--p)' }} />
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : (
            <ProductFormProvider product={product}>
              <div className="space-y-8">
                <ProductHeader />
                <ProductTabs />
              </div>
            </ProductFormProvider>
          )}
        </main>
      </div>
    </div>
  )
}
