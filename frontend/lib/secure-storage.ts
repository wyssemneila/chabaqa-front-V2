"use client"

/**
 * Secure Storage Utility for Authentication
 * Provides encrypted storage for sensitive auth data
 */

interface StorageOptions {
  encrypt?: boolean;
  expiry?: number; // milliseconds
}

class SecureStorage {
  private readonly prefix = 'chabaqa_';
  private readonly encryptionKey: string;

  constructor() {
    // Generate or retrieve encryption key
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  /**
   * Get or create encryption key for local storage
   */
  private getOrCreateEncryptionKey(): string {
    if (typeof window === 'undefined') return '';
    
    let key = localStorage.getItem(`${this.prefix}enc_key`);
    if (!key) {
      // Generate a simple key for basic obfuscation
      key = btoa(Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15));
      localStorage.setItem(`${this.prefix}enc_key`, key);
    }
    return key;
  }

  /**
   * Simple encryption for basic obfuscation
   */
  private encrypt(data: string): string {
    if (!this.encryptionKey) return data;
    
    try {
      // Simple XOR encryption for basic obfuscation
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      return btoa(encrypted);
    } catch {
      return data;
    }
  }

  /**
   * Simple decryption
   */
  private decrypt(encryptedData: string): string {
    if (!this.encryptionKey) return encryptedData;
    
    try {
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(
          data.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length)
        );
      }
      return decrypted;
    } catch {
      return encryptedData;
    }
  }

  /**
   * Store data securely
   */
  setItem(key: string, value: any, options: StorageOptions = {}): void {
    if (typeof window === 'undefined') return;

    const data = {
      value,
      timestamp: Date.now(),
      expiry: options.expiry ? Date.now() + options.expiry : null,
    };

    let serialized = JSON.stringify(data);
    
    if (options.encrypt !== false) {
      serialized = this.encrypt(serialized);
    }

    try {
      localStorage.setItem(`${this.prefix}${key}`, serialized);
    } catch (error) {
      console.warn('Failed to store data:', error);
    }
  }

  /**
   * Retrieve data securely
   */
  getItem<T = any>(key: string, encrypted: boolean = true): T | null {
    if (typeof window === 'undefined') return null;

    try {
      let stored = localStorage.getItem(`${this.prefix}${key}`);
      if (!stored) return null;

      if (encrypted) {
        stored = this.decrypt(stored);
      }

      const data = JSON.parse(stored);
      
      // Check expiry
      if (data.expiry && Date.now() > data.expiry) {
        this.removeItem(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.warn('Failed to retrieve data:', error);
      return null;
    }
  }

  /**
   * Remove item
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  /**
   * Clear all app data
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Store user session data
   */
  setUserSession(user: any, options?: StorageOptions): void {
    this.setItem('user_session', user, {
      encrypt: true,
      expiry: 24 * 60 * 60 * 1000, // 24 hours
      ...options,
    });
  }

  /**
   * Get user session data
   */
  getUserSession(): any {
    return this.getItem('user_session');
  }

  /**
   * Store auth preferences
   */
  setAuthPreferences(preferences: any): void {
    this.setItem('auth_preferences', preferences, {
      encrypt: false, // Preferences don't need encryption
    });
  }

  /**
   * Get auth preferences
   */
  getAuthPreferences(): any {
    return this.getItem('auth_preferences', false);
  }

  /**
   * Store temporary auth data (like verification codes)
   */
  setTempAuthData(key: string, data: any, expiryMinutes: number = 10): void {
    this.setItem(`temp_${key}`, data, {
      encrypt: true,
      expiry: expiryMinutes * 60 * 1000,
    });
  }

  /**
   * Get temporary auth data
   */
  getTempAuthData(key: string): any {
    return this.getItem(`temp_${key}`);
  }

  /**
   * Clear temporary auth data
   */
  clearTempAuthData(key: string): void {
    this.removeItem(`temp_${key}`);
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  getStorageInfo(): { used: number; available: number } {
    if (typeof window === 'undefined') {
      return { used: 0, available: 0 };
    }

    try {
      let used = 0;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          used += localStorage.getItem(key)?.length || 0;
        }
      });

      // Estimate available space (localStorage typically has 5-10MB limit)
      const estimated = 5 * 1024 * 1024; // 5MB
      return {
        used,
        available: Math.max(0, estimated - used),
      };
    } catch {
      return { used: 0, available: 0 };
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();
