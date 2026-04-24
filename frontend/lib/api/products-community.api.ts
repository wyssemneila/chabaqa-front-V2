import { apiClient, ApiSuccessResponse } from './client';
import { productsApi } from './products.api';
import { communitiesApi } from './communities.api';
import { getMe } from './user.api';

export interface ProductFileDetail {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: string;
  description?: string;
  order: number;
  downloadCount: number;
  isActive: boolean;
  uploadedAt: string;
}

export interface ProductCreator {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  rating?: number;
  totalProducts?: number;
  totalSales?: number;
  joinDate?: string;
}

export interface ProductCommunity {
  id: string;
  name: string;
  slug: string;
}

export interface ProductWithDetails {
  id: string;
  _id?: string; // MongoDB ObjectId for APIs that need it
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  type: 'digital' | 'physical';
  images: string[];
  files: ProductFileDetail[];
  variants?: any[];
  features: string[];
  licenseTerms?: string;
  sales: number;
  rating: number;
  ratingCount?: number;
  isPublished: boolean;
  inventory?: number;
  creator: ProductCreator;
  community: ProductCommunity;
  createdAt: string;
  updatedAt: string;
  version?: string;
}

export interface ProductPurchase {
  productId: string;
  productMongoId?: string;
  contentId?: string;
  purchasedAt: string;
  downloadCount: number;
  orderId?: string;
  amountPaid?: number;
}

export interface ProductsPageData {
  community: any;
  products: ProductWithDetails[];
  userPurchases: ProductPurchase[];
  currentUser: any;
}

function normalizeId(value: any): string {
  if (!value) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]') {
      return '';
    }
    const objectIdMatch = trimmed.match(/[a-fA-F0-9]{24}/);
    return objectIdMatch ? objectIdMatch[0] : trimmed;
  }

  if (typeof value === 'object') {
    const nestedCandidates = [value._id, value.id, value.creatorId, value.userId];
    for (const candidate of nestedCandidates) {
      const normalized = normalizeId(candidate);
      if (normalized) return normalized;
    }

    try {
      const serialized = String(value).trim();
      if (serialized && serialized !== '[object Object]') {
        return normalizeId(serialized);
      }
    } catch {
      return '';
    }
  }

  return '';
}

function extractProductsList(productsResponse: any): any[] {
  const productsList =
    productsResponse?.data?.products ||
    productsResponse?.products ||
    productsResponse?.data ||
    [];
  return Array.isArray(productsList) ? productsList : [];
}

function collectCommunityLookupKeys(community: any, slug: string): string[] {
  const keys = [
    community?.id,
    community?._id,
    community?.communityId,
    community?.slug,
    slug,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean);

  return Array.from(new Set(keys));
}

/**
 * Transform backend product data to frontend format
 */
function transformProduct(backendProduct: any): ProductWithDetails {
  const normalizedCreatorId = normalizeId(
    backendProduct?.creator?._id ||
      backendProduct?.creator?.id ||
      backendProduct?.creatorId ||
      backendProduct?.creator,
  );

  // Transform creator info - preserve _id for API calls
  const creator: ProductCreator = backendProduct.creator ? {
    id: normalizedCreatorId,
    name: backendProduct.creator.name || 'Unknown Creator',
    email: backendProduct.creator.email,
    avatar: backendProduct.creator.avatar || backendProduct.creator.profile_picture || backendProduct.creator.photo_profil,
    bio: backendProduct.creator.bio,
    rating: backendProduct.creator.rating || 0,
    totalProducts: backendProduct.creator.totalProducts || 0,
    totalSales: backendProduct.creator.totalSales || 0,
    joinDate: backendProduct.creator.joinDate || backendProduct.creator.createdAt,
  } : {
    id: normalizeId(backendProduct.creatorId),
    name: 'Unknown Creator',
    rating: 0,
    totalProducts: 0,
    totalSales: 0,
  };

  // Transform community info
  const community: ProductCommunity = backendProduct.community ? {
    id: backendProduct.community.id || backendProduct.communityId,
    name: backendProduct.community.name || 'Unknown Community',
    slug: backendProduct.community.slug || 'unknown',
  } : {
    id: backendProduct.communityId || '',
    name: 'Unknown Community',
    slug: 'unknown',
  };

  // Transform files
  const files: ProductFileDetail[] = (backendProduct.files || []).map((file: any) => ({
    id: file.id,
    name: file.name,
    url: file.url,
    type: file.type,
    size: file.size,
    description: file.description,
    order: file.order || 0,
    downloadCount: file.downloadCount || 0,
    isActive: file.isActive !== false,
    uploadedAt: file.uploadedAt || new Date().toISOString(),
  }));

  const normalizedImages =
    Array.isArray(backendProduct.images) && backendProduct.images.length > 0
      ? backendProduct.images
      : (backendProduct.thumbnail ? [backendProduct.thumbnail] : []);

  return {
    id: backendProduct.id || backendProduct._id,
    _id: backendProduct._id, // Preserve MongoDB ObjectId for feedback API
    title: backendProduct.title || '',
    description: backendProduct.description || '',
    price: backendProduct.price || 0,
    currency: backendProduct.currency || 'TND',
    category: backendProduct.category || 'General',
    type: backendProduct.type || 'digital',
    images: normalizedImages,
    files,
    variants: backendProduct.variants || [],
    features: backendProduct.features || [],
    licenseTerms: backendProduct.licenseTerms,
    sales: backendProduct.sales || 0,
    rating: backendProduct.averageRating || backendProduct.rating || 0,
    ratingCount: backendProduct.ratingCount || 0,
    isPublished: backendProduct.isPublished !== false,
    inventory: backendProduct.inventory,
    creator,
    community,
    createdAt: backendProduct.createdAt || new Date().toISOString(),
    updatedAt: backendProduct.updatedAt || new Date().toISOString(),
    version: backendProduct.version || '1.0.0',
  };
}

/**
 * Transform backend purchase data to frontend format
 */
function transformPurchase(backendPurchase: any): ProductPurchase {
  const normalizedProductId =
    backendPurchase.productId ||
    backendPurchase.id ||
    backendPurchase.product?.id ||
    backendPurchase.contentId ||
    backendPurchase.product?._id ||
    backendPurchase._id

  const normalizedContentId =
    backendPurchase.contentId ||
    backendPurchase.product?._id ||
    backendPurchase.productMongoId

  return {
    productId: String(normalizedProductId || ""),
    productMongoId: normalizedContentId ? String(normalizedContentId) : undefined,
    contentId: normalizedContentId ? String(normalizedContentId) : undefined,
    purchasedAt: backendPurchase.purchasedAt || backendPurchase.createdAt || new Date().toISOString(),
    downloadCount: backendPurchase.downloadCount || 0,
    orderId: backendPurchase.orderId || backendPurchase._id,
    amountPaid: backendPurchase.amountPaid || backendPurchase.amountDT,
  };
}

export function isProductOwnedByUser(
  product: Pick<ProductWithDetails, "id" | "_id">,
  purchases: ProductPurchase[] = [],
): boolean {
  const productCustomId = String(product?.id || "").trim()
  const productMongoId = String(product?._id || "").trim()

  if (!productCustomId && !productMongoId) return false

  return purchases.some((purchase) => {
    const candidateIds = [
      purchase.productId,
      purchase.productMongoId,
      purchase.contentId,
    ]
      .map((value) => String(value || "").trim())
      .filter(Boolean)

    if (productCustomId && candidateIds.includes(productCustomId)) return true
    if (productMongoId && candidateIds.includes(productMongoId)) return true
    return false
  })
}

/**
 * Products Community API Service
 */
export const productsCommunityApi = {
  /**
   * Fetch all data needed for products listing page
   */
  async getProductsPageData(slug: string): Promise<ProductsPageData> {
    try {
      // Fetch community + user context first.
      const [communityResponse, purchasesResponse, currentUser] = await Promise.allSettled([
        communitiesApi.getBySlug(slug),
        productsApi.getMyPurchases().catch(() => ({ data: { products: [] } })),
        getMe().catch(() => null),
      ]);

      // Handle community
      if (communityResponse.status === 'rejected') {
        throw new Error(`Failed to fetch community: ${communityResponse.reason}`);
      }
      const community = communityResponse.value.data;

      // Fetch products using resolved community identifiers (id/_id/slug fallback).
      let products: ProductWithDetails[] = [];
      const lookupKeys = collectCommunityLookupKeys(community, slug);
      let firstSuccessfulProducts: ProductWithDetails[] | null = null;

      for (const key of lookupKeys) {
        try {
          const productsResponse = await productsApi.getByCommunity(key);
          const mappedProducts = extractProductsList(productsResponse).map(transformProduct);

          if (firstSuccessfulProducts === null) {
            firstSuccessfulProducts = mappedProducts;
          }

          if (mappedProducts.length > 0) {
            products = mappedProducts;
            break;
          }
        } catch {
          // Try next identifier.
        }
      }

      if (products.length === 0 && firstSuccessfulProducts) {
        products = firstSuccessfulProducts;
      }

      // Handle user purchases
      let userPurchases: ProductPurchase[] = [];
      if (purchasesResponse.status === 'fulfilled') {
        const purchasesData = purchasesResponse.value as any;
        const purchasesList = purchasesData?.data?.products || purchasesData?.products || purchasesData?.data || [];
        userPurchases = Array.isArray(purchasesList)
          ? purchasesList.map(transformPurchase)
          : [];
      }

      // Transform current user
      const user = currentUser.status === 'fulfilled' && currentUser.value
        ? {
          id: String(currentUser.value._id || currentUser.value.id || ''),
          email: currentUser.value.email || '',
          username: currentUser.value.username || currentUser.value.name || '',
          avatar: currentUser.value.avatar || currentUser.value.profile_picture,
        }
        : null;

      return {
        community,
        products,
        userPurchases,
        currentUser: user,
      };
    } catch (error) {
      console.error('Error fetching products page data:', error);
      throw error;
    }
  },

  /**
   * Fetch single product with all details
   */
  async getProductDetail(productId: string): Promise<ProductWithDetails | null> {
    try {
      const response = await productsApi.getById(productId);
      const productData = (response as any)?.data?.data ?? (response as any)?.data ?? response;
      
      if (!productData) {
        return null;
      }

      return transformProduct(productData);
    } catch (error) {
      console.error('Error fetching product detail:', error);
      return null;
    }
  },

  /**
   * Check if user has purchased a product
   */
  async getUserPurchaseStatus(productId: string): Promise<ProductPurchase | null> {
    try {
      const response = await productsApi.checkPurchase(productId);
      const data = (response as any)?.data ?? response;
      
      if (data?.purchased && data?.purchase) {
        return transformPurchase(data.purchase);
      }
      
      return null;
    } catch (error) {
      console.error('Error checking purchase status:', error);
      return null;
    }
  },

  /**
   * Get user's all purchased products
   */
  async getUserPurchases(): Promise<ProductPurchase[]> {
    try {
      const response = await productsApi.getMyPurchases();
      const data = (response as any)?.data ?? response;
      const purchasesList = data?.products || data || [];
      
      return Array.isArray(purchasesList)
        ? purchasesList.map(transformPurchase)
        : [];
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }
  },
};
