"use client"

import { syncAccessTokenCookie } from '@/lib/cookie-sync'
import { refreshBrowserAccessToken } from '@/lib/auth-refresh'

/**
 * Enhanced Token Management Utility
 * Handles automatic token refresh, storage, and cleanup
 */

interface TokenInfo {
  token: string;
  expiresAt: number;
}

class TokenManager {
  private accessToken: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiration
  private readonly API_BASE =
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

  /**
   * Initialize token manager and set up automatic refresh
   */
  initialize() {
    if (typeof window === 'undefined') return;
    
    // Set up automatic token refresh check
    this.setupRefreshTimer();
    
    // Listen for storage events (for multi-tab sync)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Clean up on page unload
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  /**
   * Set up timer to check for token refresh needs
   */
  private setupRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Check every minute
    this.refreshTimer = setInterval(() => {
      this.checkTokenExpiration();
    }, 60 * 1000);
  }

  /**
   * Check if token needs refresh and trigger it
   */
  private async checkTokenExpiration() {
    if (!this.accessToken) return;
    
    try {
      const payload = this.parseJWT(this.accessToken);
      if (!payload || !payload.exp) return;
      
      const expiresAt = payload.exp * 1000;
      const now = Date.now();
      
      // If token expires within threshold, refresh it
      if (expiresAt - now <= this.REFRESH_THRESHOLD) {
        await this.refreshToken();
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
  }

  /**
   * Parse JWT token to get payload
   */
  private parseJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const accessToken = await refreshBrowserAccessToken(this.API_BASE)
      if (accessToken) {
        this.accessToken = accessToken
        return true
      }

      // If refresh fails, redirect to login
      this.handleAuthFailure();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleAuthFailure();
      return false;
    }
  }

  /**
   * Handle authentication failure
   */
  private handleAuthFailure() {
    this.clearTokens()
    if (typeof window !== 'undefined') {
      // Preserve the locale prefix (en/ar) from the current URL
      const locale = window.location.pathname.startsWith('/ar') ? 'ar' : 'en'
      window.location.href = `/${locale}/signin`
    }
  }

  /**
   * Set access token, update storage, and sync middleware cookie
   */
  setAccessToken(token: string) {
    this.accessToken = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
      syncAccessTokenCookie(token)
    }
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('accessToken');
      if (stored !== this.accessToken) {
        this.accessToken = stored;
      }
    }
    return this.accessToken;
  }

  /**
   * Clear all tokens and sync cookie
   */
  clearTokens() {
    this.accessToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      syncAccessTokenCookie(null)
    }
  }

  /**
   * Handle storage changes (for multi-tab sync)
   */
  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'accessToken') {
      this.accessToken = event.newValue;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    
    const payload = this.parseJWT(token);
    if (!payload || !payload.exp) return false;
    
    // Check if token is expired
    return payload.exp * 1000 > Date.now();
  }

  /**
   * Get user info from token
   */
  getUserInfo(): any {
    const token = this.getAccessToken();
    if (!token) return null;
    
    return this.parseJWT(token);
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this));
      window.removeEventListener('beforeunload', this.cleanup.bind(this));
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  tokenManager.initialize();
}
