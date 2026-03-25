import { apiClient, ApiSuccessResponse, PaginatedResponse, PaginationParams } from './client';
import type { ApiGetOptions } from './client';
import type { Product, ProductVariant, ProductFile } from './types';

export interface CreateProductVariantData {
  name: string;
  price: number;
  description?: string;
  inventory?: number;
}

export interface CreateProductFileData {
  name: string;
  url: string;
  type: string;
  size?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  currency?: 'USD' | 'EUR' | 'TND';
  communityId: string;
  category: string;
  type?: 'digital' | 'physical';
  isPublished?: boolean;
  inventory?: number;
  images?: string[];
  variants?: CreateProductVariantData[];
  files?: CreateProductFileData[];
  licenseTerms?: string;
  features?: string[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  isPublished?: boolean;
}

export interface CreateVariantData {
  name: string;
  price: number;
  stock?: number;
}

export interface ProductListParams extends PaginationParams {
  communityId?: string;
  creatorId?: string;
  category?: string;
  type?: 'digital' | 'physical';
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

// Products API
export const productsApi = {
  // Get all products
  getAll: async (
    params?: ProductListParams,
    options?: ApiGetOptions,
  ): Promise<PaginatedResponse<Product>> => {
    return apiClient.get<PaginatedResponse<Product>>('/products', params, options);
  },

  // Create product
  create: async (data: CreateProductData): Promise<ApiSuccessResponse<Product>> => {
    return apiClient.post<ApiSuccessResponse<Product>>('/products', data);
  },

  // Get product by ID
  getById: async (id: string): Promise<ApiSuccessResponse<Product>> => {
    return apiClient.get<ApiSuccessResponse<Product>>(`/products/${id}`);
  },

  // Update product
  update: async (id: string, data: UpdateProductData): Promise<ApiSuccessResponse<Product>> => {
    return apiClient.patch<ApiSuccessResponse<Product>>(`/products/${id}`, data);
  },

  // Delete product
  delete: async (id: string): Promise<ApiSuccessResponse<void>> => {
    return apiClient.delete<ApiSuccessResponse<void>>(`/products/${id}`);
  },

  // Get products by community (using community ID)
  getByCommunity: async (communityId: string): Promise<any> => {
    return apiClient.get(`/products/community/${communityId}`, { page: 1, limit: 100 });
  },

  // Create variant
  createVariant: async (id: string, data: CreateVariantData): Promise<ApiSuccessResponse<ProductVariant>> => {
    return apiClient.post<ApiSuccessResponse<ProductVariant>>(`/products/${id}/variants`, data);
  },

  // Upload product file
  uploadFile: async (id: string, file: File): Promise<ApiSuccessResponse<ProductFile>> => {
    return apiClient.uploadFile<ApiSuccessResponse<ProductFile>>(`/products/${id}/files`, file);
  },

  // Purchase product
  purchase: async (id: string, variantId?: string): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/products/${id}/purchase`, { variantId });
  },

  // Download product file (legacy alias kept for compatibility)
  download: async (id: string, fileId: string): Promise<{ success: boolean; downloadUrl: string; message: string }> => {
    return apiClient.post<{ success: boolean; downloadUrl: string; message: string }>(
      `/products/${id}/files/${fileId}/download`,
    );
  },

  // Get products by creator
  getByCreator: async (creatorId: string, params?: PaginationParams & { communityId?: string }): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/products/creator/${creatorId}`, params);
  },

  // Get user's purchased products
  getMyPurchases: async (): Promise<ApiSuccessResponse<any>> => {
    return apiClient.get<ApiSuccessResponse<any>>('/products/my-purchases');
  },

  // Check if user has purchased a product
  checkPurchase: async (productId: string): Promise<ApiSuccessResponse<{ purchased: boolean; purchase?: any }>> => {
    return apiClient.get<ApiSuccessResponse<any>>(`/products/${productId}/check-purchase`);
  },

  // Download specific file from product
  downloadFile: async (
    productId: string,
    fileId: string,
  ): Promise<{ success: boolean; downloadUrl: string; message: string }> => {
    return apiClient.post<{ success: boolean; downloadUrl: string; message: string }>(
      `/products/${productId}/files/${fileId}/download`,
    );
  },

  // Get product reviews
  getReviews: async (productId: string, params?: PaginationParams): Promise<any> => {
    return apiClient.get(`/products/${productId}/reviews`, params);
  },

  // Submit product review
  submitReview: async (productId: string, data: { rating: number; comment?: string }): Promise<ApiSuccessResponse<any>> => {
    return apiClient.post<ApiSuccessResponse<any>>(`/products/${productId}/reviews`, data);
  },

  // Initiate Stripe Link payment for product
  initStripePayment: async (productId: string, promoCode?: string): Promise<any> => {
    const endpoint = promoCode
      ? `/payment/stripe-link/init/product?promoCode=${encodeURIComponent(promoCode)}`
      : `/payment/stripe-link/init/product`;
    return apiClient.post(endpoint, { productId });
  },
};
