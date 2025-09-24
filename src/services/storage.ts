// Secure local storage service with encryption

import type { AppData, UserSettings } from '@/types';

// Simple encryption/decryption using base64 and basic obfuscation
// Note: This is not cryptographically secure, but provides basic data obfuscation
class SimpleEncryption {
  private key: string;

  constructor(key: string = 'finance-calculator-key') {
    this.key = key;
  }

  encrypt(data: string): string {
    try {
      // Simple XOR encryption with base64 encoding
      const encrypted = data
        .split('')
        .map((char, index) => 
          String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(index % this.key.length))
        )
        .join('');
      
      return btoa(encrypted);
    } catch (error) {
      console.warn('Encryption failed, storing data unencrypted:', error);
      return btoa(data);
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const decoded = atob(encryptedData);
      
      // Reverse XOR encryption
      return decoded
        .split('')
        .map((char, index) => 
          String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(index % this.key.length))
        )
        .join('');
    } catch (error) {
      console.warn('Decryption failed, attempting to read as plain text:', error);
      try {
        return atob(encryptedData);
      } catch {
        return encryptedData;
      }
    }
  }
}

export class StorageService {
  private encryption: SimpleEncryption;
  private storagePrefix: string = 'finance_calc_';

  constructor() {
    this.encryption = new SimpleEncryption();
  }

  /**
   * Check if localStorage is available
   */
  private isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage key with prefix
   */
  private getKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  /**
   * Store data securely in localStorage
   */
  setItem<T>(key: string, data: T, encrypt: boolean = true): boolean {
    if (!this.isStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const serialized = JSON.stringify(data);
      const finalData = encrypt ? this.encryption.encrypt(serialized) : serialized;
      
      localStorage.setItem(this.getKey(key), finalData);
      return true;
    } catch (error) {
      console.error('Failed to store data:', error);
      return false;
    }
  }

  /**
   * Retrieve data from localStorage
   */
  getItem<T>(key: string, defaultValue: T | null = null, encrypted: boolean = true): T | null {
    if (!this.isStorageAvailable()) {
      return defaultValue;
    }

    try {
      const stored = localStorage.getItem(this.getKey(key));
      if (stored === null) {
        return defaultValue;
      }

      const decrypted = encrypted ? this.encryption.decrypt(stored) : stored;
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return defaultValue;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Failed to remove data:', error);
      return false;
    }
  }

  /**
   * Clear all app data from localStorage
   */
  clear(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          keys.push(key);
        }
      }
      
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    if (!this.isStorageAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    try {
      let used = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          used += localStorage.getItem(key)?.length || 0;
        }
      }

      // Estimate available storage (5MB is typical localStorage limit)
      const estimated = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (used / estimated) * 100;

      return {
        used,
        available: estimated - used,
        percentage: Math.min(percentage, 100)
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Validate stored data integrity
   */
  validateData<T>(key: string, validator: (data: any) => data is T): boolean {
    try {
      const data = this.getItem(key);
      return data !== null && validator(data);
    } catch {
      return false;
    }
  }

  /**
   * Export all app data for backup
   */
  exportData(): string | null {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const exportData: Record<string, any> = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          const cleanKey = key.replace(this.storagePrefix, '');
          const value = localStorage.getItem(key);
          if (value) {
            try {
              // Try to decrypt and re-encrypt for export
              const decrypted = this.encryption.decrypt(value);
              exportData[cleanKey] = JSON.parse(decrypted);
            } catch {
              // If decryption fails, store as is
              exportData[cleanKey] = value;
            }
          }
        }
      }

      return JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: exportData
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  /**
   * Import data from backup
   */
  importData(backupData: string): boolean {
    try {
      const parsed = JSON.parse(backupData);
      
      if (!parsed.data || typeof parsed.data !== 'object') {
        throw new Error('Invalid backup format');
      }

      // Clear existing data
      this.clear();

      // Import new data
      Object.entries(parsed.data).forEach(([key, value]) => {
        this.setItem(key, value, true);
      });

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// Data validation functions
export function isValidAppData(data: any): data is AppData {
  return !!(
    data &&
    typeof data === 'object' &&
    Array.isArray(data.mortgageCalculations) &&
    Array.isArray(data.creditCards) &&
    Array.isArray(data.expenses) &&
    Array.isArray(data.budgets) &&
    Array.isArray(data.watchlist) &&
    Array.isArray(data.portfolio) &&
    Array.isArray(data.creditCardRecommendations) &&
    Array.isArray(data.spendingAnalysis) &&
    data.settings &&
    typeof data.settings === 'object'
  );
}

export function isValidUserSettings(data: any): data is UserSettings {
  return !!(
    data &&
    typeof data === 'object' &&
    typeof data.currency === 'string' &&
    typeof data.theme === 'string' &&
    typeof data.notifications === 'boolean' &&
    typeof data.autoSave === 'boolean'
  );
}

// Default data
export const defaultUserSettings: UserSettings = {
  currency: 'USD' as const,
  theme: 'light' as const,
  notifications: true,
  autoSave: true,
  dateFormat: 'MM/DD/YYYY' as const,
  numberFormat: 'US' as const
};

export const defaultAppData: AppData = {
  mortgageCalculations: [],
  creditCards: [],
  expenses: [],
  budgets: [],
  watchlist: [],
  portfolio: [],
  creditCardRecommendations: [],
  spendingAnalysis: [],
  settings: defaultUserSettings
};

// Create singleton instance
export const storageService = new StorageService();