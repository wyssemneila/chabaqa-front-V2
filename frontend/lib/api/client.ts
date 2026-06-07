// API Response types
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiGetOptions {
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

// API Client Configuration
// IMPORTANT:
// - `NEXT_PUBLIC_*` env vars are inlined at build-time by Next.js.
// - For server-side (SSR / RSC) requests in Docker, we need a runtime env var
//   (e.g. `API_INTERNAL_URL`) so the frontend container can reach `backend:3000`.
const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  }

  return process.env.NEXT_PUBLIC_API_URL || '/api';
};

class ApiClient {
  private baseURL: string;
  // Single-flight refresh: all concurrent 401 requests share this promise.
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseURL = getApiBaseUrl();
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
        statusCode: response.status,
      }));
      const extractErrorMessage = (value: any): string => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.map((v) => extractErrorMessage(v)).filter(Boolean).join(', ');
        if (typeof value === 'object') {
          if (typeof value.message === 'string') return value.message;
          if (value.error) return extractErrorMessage(value.error);
          if (typeof value.code === 'string') return value.code;
        }
        return '';
      };
      const rawMessage =
        extractErrorMessage(error?.message) ||
        extractErrorMessage(error?.error) ||
        extractErrorMessage(error?.data?.message) ||
        extractErrorMessage(error?.data?.error) ||
        'An error occurred';
      error.message = rawMessage;
      error.statusCode = response.status;

      // Transform error using error message mapping
      try {
        const { mapErrorMessage } = await import('../utils/error-messages');
        const mapped = mapErrorMessage(error);
        error.message = mapped.message;
        error.guidance = mapped.guidance;
      } catch (importError) {
        // If error-messages module fails to load, use original error
        console.warn('Failed to load error message mapping:', importError);
      }

      // For 401 errors on /auth/me, don't redirect - allow graceful handling
      // Only redirect for other 401 errors on protected resources
      if (response.status === 401 && typeof window !== 'undefined') {
        // Check if this is a protected route that requires login
        const protectedRoutes = ['/creator', '/dashboard', '/settings', '/profile', '/admin'];
        const currentPath = window.location.pathname;
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));

        // Only redirect if on a protected route
        if (isProtectedRoute) {
          // Clear auth state before redirecting to avoid stale state issues
          try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            // Clear cookies
            document.cookie = 'accessToken=; Path=/; Max-Age=0; SameSite=Lax';
            document.cookie = 'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
          } catch (clearError) {
            console.warn('Failed to clear auth state on 401:', clearError);
          }
          window.location.href = '/signin';
        }
      }

      throw error;
    }
    
    // Handle empty responses (e.g., 204 No Content for DELETE operations)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    
    return JSON.parse(text);
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }
    return url.toString();
  }

  private getCookie(name: string): string {
    if (typeof document === 'undefined') return '';
    const encodedName = `${encodeURIComponent(name)}=`;
    const cookie = document.cookie
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(encodedName));
    return cookie ? decodeURIComponent(cookie.slice(encodedName.length)) : '';
  }

  private getHeaders(isFormData: boolean = false, includeCsrf: boolean = false): HeadersInit {
    const headers: HeadersInit = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (includeCsrf && typeof window !== 'undefined') {
      const csrfToken = this.getCookie('chabaqa_csrf');
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Add Authorization header if we have an access token
    // Only add on client side to avoid SSR issues
    if (typeof window !== 'undefined') {
      try {
        const { tokenStorage } = require('@/lib/token-storage');
        const accessToken = tokenStorage.getAccessToken();
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
      } catch (error) {
        // Silently fail - user might not be authenticated
      }
    }

    return headers;
  }

  // Generic HTTP methods
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: ApiGetOptions,
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    const doRequest = async () => fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
      // Server requests default to no-store for correctness unless the caller opts in.
      ...(typeof window === 'undefined'
        ? { cache: (options?.cache || 'no-store') as RequestCache }
        : {}),
    });
    let response = await doRequest();
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        response = await doRequest();
      }
    }
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const doRequest = async () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(false, true),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });
    let response = await doRequest();
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        response = await doRequest();
      }
    }
    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const doRequest = async () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(false, true),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });
    let response = await doRequest();
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        response = await doRequest();
      }
    }
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const doRequest = async () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(false, true),
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });
    let response = await doRequest();
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        response = await doRequest();
      }
    }
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const doRequest = async () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(false, true),
      credentials: 'include',
    });
    let response = await doRequest();
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        response = await doRequest();
      }
    }
    return this.handleResponse<T>(response);
  }

  // File upload
  async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    extraFields?: Record<string, string | number | boolean | undefined | null>,
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    if (extraFields) {
      Object.entries(extraFields).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        formData.append(key, String(value));
      });
    }

    const doRequest = async () => fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
      body: formData,
    });
    let response = await doRequest();
    if (response.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        response = await doRequest();
      }
    }
    return this.handleResponse<T>(response);
  }

  // Multiple file upload
  async uploadFiles<T>(endpoint: string, files: File[]): Promise<T> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(true, true),
      credentials: 'include',
      body: formData,
    });
    return this.handleResponse<T>(response);
  }

  // Token refresh: single-flight so all concurrent 401 requests share one refresh.
  private async tryRefreshToken(): Promise<boolean> {
    // If a refresh is already in progress, piggyback on it — don't start a second one.
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      try {
        if (typeof window === 'undefined') return false

        const res = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: this.getHeaders(false, true),
          credentials: 'include', // sends httpOnly refreshToken cookie
          body: '{}',
        })

        if (!res.ok) return false

        const payload = await res.json().catch(() => ({}))
        const data = payload?.data || payload || {}
        const newToken = (data.access_token || data.accessToken || '').trim()

        if (newToken) {
          localStorage.setItem('accessToken', newToken)
          localStorage.removeItem('access_token')
          // Sync the JS-accessible cookie so middleware sees the refreshed token.
          try {
            const { syncAccessTokenCookie } = await import('@/lib/cookie-sync')
            syncAccessTokenCookie(newToken)
          } catch { /* non-critical */ }
        }

        return true
      } catch (error) {
        console.error('[ApiClient] Token refresh failed:', error)
        return false
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }
}

export const apiClient = new ApiClient();
