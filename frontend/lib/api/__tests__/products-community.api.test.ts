import { productsCommunityApi } from "@/lib/api/commerce/products-community.api"
import { communitiesApi } from "@/lib/api/community/communities.api"
import { productsApi } from "@/lib/api/commerce/products.api"
import { getMe } from "@/lib/api/user/user.api"

jest.mock("@/lib/api/community/communities.api", () => ({
  communitiesApi: {
    getBySlug: jest.fn(),
  },
}))

jest.mock("@/lib/api/commerce/products.api", () => ({
  productsApi: {
    getByCommunity: jest.fn(),
    getMyPurchases: jest.fn(),
  },
}))

jest.mock("@/lib/api/user/user.api", () => ({
  getMe: jest.fn(),
}))

describe("productsCommunityApi lookup fallback", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(communitiesApi.getBySlug as jest.Mock).mockResolvedValue({
      data: { id: "community-id", _id: "community-mongo-id", slug: "community-slug", name: "Community" },
    })
    ;(productsApi.getMyPurchases as jest.Mock).mockResolvedValue({ data: { products: [] } })
    ;(getMe as jest.Mock).mockResolvedValue(null)
  })

  it("fetches community products using resolved community id (not only slug)", async () => {
    ;(productsApi.getByCommunity as jest.Mock).mockImplementation(async (key: string) => {
      if (key === "community-id") {
        return {
          data: {
            products: [
              {
                id: "product-1",
                title: "Product One",
                description: "Desc",
                price: 10,
                currency: "TND",
                category: "Templates",
                type: "digital",
                isPublished: true,
                communityId: "community-id",
                creator: { id: "creator-1", name: "Creator" },
              },
            ],
          },
        }
      }
      return { data: { products: [] } }
    })

    const result = await productsCommunityApi.getProductsPageData("community-slug")

    expect(productsApi.getByCommunity).toHaveBeenCalledWith("community-id")
    expect(result.products).toHaveLength(1)
    expect(result.products[0].id).toBe("product-1")
  })

  it("falls back to alternate keys when first community identifier returns empty", async () => {
    ;(productsApi.getByCommunity as jest.Mock)
      .mockResolvedValueOnce({ data: { products: [] } }) // community-id
      .mockResolvedValueOnce({
        data: {
          products: [
            {
              id: "product-2",
              title: "Product Two",
              description: "Desc",
              price: 0,
              currency: "TND",
              category: "Assets",
              type: "digital",
              isPublished: true,
              communityId: "community-mongo-id",
              creator: { id: "creator-1", name: "Creator" },
            },
          ],
        },
      }) // community-mongo-id

    const result = await productsCommunityApi.getProductsPageData("community-slug")

    expect(productsApi.getByCommunity).toHaveBeenNthCalledWith(1, "community-id")
    expect(productsApi.getByCommunity).toHaveBeenNthCalledWith(2, "community-mongo-id")
    expect(result.products).toHaveLength(1)
    expect(result.products[0].id).toBe("product-2")
  })
})
