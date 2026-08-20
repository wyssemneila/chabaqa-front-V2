'use client';

/**
 * Secure token storage using localStorage
 * Handles access and refresh tokens for cookie-less auth
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

class TokenStorage {
  private readonly ACCESS_KEY = 'accessToken';
  private readonly REFRESH_KEY = 'refreshToken';

  /**
   * Store both tokens
   */
  setTokens(tokens: TokenPair): void {
    try {
      localStorage.setItem(this.ACCESS_KEY, tokens.accessToken);
      localStorage.setItem(this.REFRESH_KEY, tokens.refreshToken);
      
      // Sync to other tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: this.ACCESS_KEY,
          newValue: tokens.accessToken,
        }));
        window.dispatchEvent(new StorageEvent('storage', {
          key: this.REFRESH_KEY,
          newValue: tokens.refreshToken,
        }));
      }
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_KEY);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_KEY);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
      
      // Sync to other tabs
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new StorageEvent('storage', {
          key: this.ACCESS_KEY,
          oldValue: this.getAccessToken(),
        }));
        window.dispatchEvent(new StorageEvent('storage', {
          key: this.REFRESH_KEY,
          oldValue: this.getRefreshToken(),
        }));
      }
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  /**
   * Check if tokens exist
   */
  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  }

  /**
   * Parse JWT payload (without verification)
   */
  parseJwt(token: string): any | null {
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
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * Check if access token is expired
   */
  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) return true;

    // Expired if now >= exp (with 10s buffer)
    return Date.now() >= (payload.exp * 1000 - 10000);
  }

  /**
   * Check if refresh token is expired
   */
  isRefreshTokenExpired(): boolean {
    const token = this.getRefreshToken();
    if (!token) return true;

    const payload = this.parseJwt(token);
    if (!payload || !payload.exp) return true;

    // Expired if now >= exp (with 10s buffer)
    return Date.now() >= (payload.exp * 1000 - 10000);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.hasTokens() && !this.isAccessTokenExpired();
  }

  /**
   * Get user info from access token
   */
  getUserInfo(): { id: string; email: string; role: string } | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const payload = this.parseJwt(token);
    if (!payload) return null;

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}

// Export singleton instance
export const tokenStorage = new TokenStorage();

// Auto-cleanup on storage events (multi-tab sync)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === null) {
      // Clear event - likely from another tab clearing all storage
      if (!tokenStorage.hasTokens()) {
        // Tokens are already cleared
        return;
      }
    }
  });
}