import { Suspense } from "react"
import { notFound } from "next/navigation"
import ProductsPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/components/products-page-content"
import { productsCommunityApi } from "@/lib/api/products-community.api"

function ProductsGridSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="h-36 animate-pulse rounded-lg bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

async function ProductsContent({
  creatorSlug,
  slug,
}: {
  creatorSlug: string
  slug: string
}) {
  try {
    const data = await productsCommunityApi.getProductsPageData(slug)
    
    if (!data.community) {
      notFound()
    }

    return (
      <ProductsPageContent 
        creatorSlug={creatorSlug} 
        slug={slug}
        community={data.community}
        allProducts={data.products}
        userPurchases={data.userPurchases}
      />
    )
  } catch (error) {
    console.error('Error loading products page:', error)
    notFound()
  }
}

type Props = {
  params: Promise<{ creator: string; feature: string }>
}

export default async function ProductsPage({ params }: Props) {
  const { creator, feature } = await params
  
  return (
    <Suspense fallback={<ProductsGridSkeleton />}>
      <ProductsContent creatorSlug={creator} slug={feature} />
    </Suspense>
  )
}