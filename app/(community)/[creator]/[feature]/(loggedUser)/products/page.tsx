import { notFound } from "next/navigation"
import ProductsPageContent from "@/app/(community)/[creator]/[feature]/(loggedUser)/products/components/products-page-content"
import { productsCommunityApi } from "@/lib/api/products-community.api"

type Props = {
  params: { creator: string; feature: string }
}

export default async function ProductsPage({ params }: Props) {
  const { creator, feature } = params
  
  try {
    const data = await productsCommunityApi.getProductsPageData(feature)
    
    if (!data.community) {
      notFound()
    }

    return (
      <ProductsPageContent 
        creatorSlug={creator} 
        slug={feature}
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