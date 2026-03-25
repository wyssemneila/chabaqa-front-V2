/**
 * API Client for Chabaqa Frontend
 * Provides a typed HTTP client with automatic token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
                    (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api` : "http://localhost:3000/api")

interface RequestConfig extends RequestInit {
  params?: Record<string, any>
}

interface ApiResponse<T = any> {
  data: T
  message?: string
  statusCode?: number
  success?: boolean
}

interface ApiClientError extends Error {
  status?: number
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private getToken(isAdmin: boolean = false): string | null {
    if (typeof window === 'undefined') return null
    
    const tokenKey = isAdmin ? 'admin_access_token' : 'accessToken'
    return localStorage.getItem(tokenKey)
  }

  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) return

        if (typeof value === 'string' && value.trim() === '') return

        if (typeof value === 'number' && Number.isNaN(value)) return

        if (Array.isArray(value)) {
          const sanitized = value.filter((item) => item !== undefined && item !== null && String(item).trim() !== '')
          if (sanitized.length === 0) return
          sanitized.forEach((item) => {
            url.searchParams.append(key, String(item))
          })
          return
        }

        url.searchParams.append(key, String(value))
      })
    }
    
    return url.toString()
  }

  private async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { params, headers, ...restConfig } = config
    
    // Determine if this is an admin request
    const isAdminRequest =
      endpoint.startsWith('/admin') ||
      endpoint.startsWith('/live-support/admin')
    // Logout needs the token to blacklist it, so we don't treat it as an auth endpoint (which are public)
    const isAuthEndpoint = endpoint.startsWith('/admin/login') || endpoint.startsWith('/admin/verify-2fa') || endpoint.startsWith('/admin/refresh') || endpoint.startsWith('/admin/forgot-password') || endpoint.startsWith('/admin/reset-password')
    
    // Get appropriate token
    const token = !isAuthEndpoint ? this.getToken(isAdminRequest) : null
    
    const url = this.buildURL(endpoint, params)
    
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    }
    
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
    
    try {
      const response = await fetch(url, {
        ...restConfig,
        headers: requestHeaders,
        credentials: 'include',
      })
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as ApiClientError
          error.status = response.status
          throw error
        }
        return { data: null as T }
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        // Handle unauthorized or forbidden errors for admin routes
        if ((response.status === 401 || response.status === 403) && isAdminRequest && !isAuthEndpoint) {
          if (typeof window !== 'undefined') {
            // Clear admin tokens and redirect to login
            localStorage.removeItem('admin_access_token');
            localStorage.removeItem('admin_refresh_token');
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_session');
            
            // Avoid redirect loops if already on login page
            const pathname = window.location.pathname;
            if (!pathname.includes('/admin/login') && !pathname.includes('/admin/verify-2fa')) {
              window.location.href = '/en/admin/login?reason=expired';
            }
          }
        }

        const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`) as ApiClientError
        error.status = response.status
        throw error
      }
      
      return data
    } catch (error) {
      const status = (error as ApiClientError)?.status
      const isExpectedAdminAuthFailure =
        status === 401 &&
        (endpoint.startsWith('/admin/me') || endpoint.startsWith('/admin/refresh'))

      if (!isExpectedAdminAuthFailure) {
        console.error(`[API Client] Error:`, error)
      }
      throw error
    }
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  async post<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  }

  async put<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  }

  async patch<T = any>(endpoint: string, body?: any, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      params,
    })
  }

  async delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', params })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient
