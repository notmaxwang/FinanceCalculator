// Tests for storage service

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, isValidAppData, isValidUserSettings, defaultAppData, defaultUserSettings } from '../storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock btoa and atob for Node.js environment
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { name: 'test', value: 123 };
      
      const stored = storageService.setItem('test', testData);
      expect(stored).toBe(true);

      const retrieved = storageService.getItem('test', null);
      expect(retrieved).toEqual(testData);
    });

    it('should return default value when key does not exist', () => {
      const defaultValue = { default: true };
      const result = storageService.getItem('nonexistent', defaultValue);
      expect(result).toEqual(defaultValue);
    });

    it('should remove items', () => {
      storageService.setItem('test', { data: 'test' });
      expect(storageService.getItem('test')).not.toBeNull();

      const removed = storageService.removeItem('test');
      expect(removed).toBe(true);
      expect(storageService.getItem('test')).toBeNull();
    });

    it('should clear all app data', () => {
      storageService.setItem('test1', { data: 'test1' });
      storageService.setItem('test2', { data: 'test2' });
      
      // Add some non-app data
      localStorage.setItem('other_app_data', 'should not be cleared');

      const cleared = storageService.clear();
      expect(cleared).toBe(true);
      
      expect(storageService.getItem('test1')).toBeNull();
      expect(storageService.getItem('test2')).toBeNull();
      expect(localStorage.getItem('other_app_data')).toBe('should not be cleared');
    });
  });

  describe('Encryption', () => {
    it('should encrypt data by default', () => {
      const testData = { sensitive: 'data' };
      storageService.setItem('encrypted', testData);

      // Check that raw localStorage data is encrypted (not plain JSON)
      const rawData = localStorage.getItem('finance_calc_encrypted');
      expect(rawData).not.toContain('sensitive');
      expect(rawData).not.toContain('data');
    });

    it('should store unencrypted data when specified', () => {
      const testData = { public: 'data' };
      storageService.setItem('unencrypted', testData, false);

      const rawData = localStorage.getItem('finance_calc_unencrypted');
      expect(rawData).toContain('public');
      expect(rawData).toContain('data');
    });

    it('should decrypt encrypted data correctly', () => {
      const testData = { encrypted: 'secret', number: 42, array: [1, 2, 3] };
      
      storageService.setItem('test', testData, true);
      const retrieved = storageService.getItem('test', null, true);
      
      expect(retrieved).toEqual(testData);
    });
  });

  describe('Storage Information', () => {
    it('should provide storage usage information', () => {
      storageService.setItem('test', { data: 'test data' });
      
      const info = storageService.getStorageInfo();
      expect(info.used).toBeGreaterThan(0);
      expect(info.available).toBeGreaterThan(0);
      expect(info.percentage).toBeGreaterThanOrEqual(0);
      expect(info.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('Data Validation', () => {
    it('should validate data with custom validator', () => {
      const validData = { name: 'test', age: 25 };
      const invalidData = { name: 'test' }; // missing age

      const validator = (data: any): data is { name: string; age: number } => {
        return data && typeof data.name === 'string' && typeof data.age === 'number';
      };

      storageService.setItem('valid', validData);
      storageService.setItem('invalid', invalidData);

      expect(storageService.validateData('valid', validator)).toBe(true);
      expect(storageService.validateData('invalid', validator)).toBe(false);
      expect(storageService.validateData('nonexistent', validator)).toBe(false);
    });
  });

  describe('Import/Export', () => {
    it('should export data', () => {
      const testData1 = { test: 'data1' };
      const testData2 = { test: 'data2' };

      storageService.setItem('export1', testData1);
      storageService.setItem('export2', testData2);

      const exported = storageService.exportData();
      expect(exported).not.toBeNull();

      const parsed = JSON.parse(exported!);
      expect(parsed.version).toBe('1.0');
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.data.export1).toEqual(testData1);
      expect(parsed.data.export2).toEqual(testData2);
    });

    it('should import data', () => {
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          import1: { test: 'imported1' },
          import2: { test: 'imported2' }
        }
      };

      const imported = storageService.importData(JSON.stringify(backupData));
      expect(imported).toBe(true);

      expect(storageService.getItem('import1')).toEqual({ test: 'imported1' });
      expect(storageService.getItem('import2')).toEqual({ test: 'imported2' });
    });

    it('should handle invalid import data', () => {
      const invalidData = '{ "invalid": true }';
      const imported = storageService.importData(invalidData);
      expect(imported).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage unavailability gracefully', () => {
      // Mock localStorage to throw errors
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage unavailable');
      });

      const stored = storageService.setItem('test', { data: 'test' });
      expect(stored).toBe(false);

      // Restore original method
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted data gracefully', () => {
      // Manually set corrupted data
      localStorage.setItem('finance_calc_corrupted', 'invalid-base64-data');

      const result = storageService.getItem('corrupted', { default: true });
      expect(result).toEqual({ default: true });
    });
  });
});

describe('Data Validators', () => {
  describe('isValidAppData', () => {
    it('should validate correct AppData structure', () => {
      expect(isValidAppData(defaultAppData)).toBe(true);
    });

    it('should reject invalid AppData structure', () => {
      expect(isValidAppData(null)).toBe(false);
      expect(isValidAppData({})).toBe(false);
      expect(isValidAppData({ mortgageCalculations: 'not an array' })).toBe(false);
    });
  });

  describe('isValidUserSettings', () => {
    it('should validate correct UserSettings structure', () => {
      expect(isValidUserSettings(defaultUserSettings)).toBe(true);
    });

    it('should reject invalid UserSettings structure', () => {
      expect(isValidUserSettings(null)).toBe(false);
      expect(isValidUserSettings({})).toBe(false);
      expect(isValidUserSettings({ currency: 123 })).toBe(false);
    });
  });
});

describe('Default Data', () => {
  it('should have valid default user settings', () => {
    expect(isValidUserSettings(defaultUserSettings)).toBe(true);
    expect(defaultUserSettings.currency).toBe('USD');
    expect(defaultUserSettings.theme).toBe('light');
    expect(defaultUserSettings.notifications).toBe(true);
    expect(defaultUserSettings.autoSave).toBe(true);
  });

  it('should have valid default app data', () => {
    expect(isValidAppData(defaultAppData)).toBe(true);
    expect(Array.isArray(defaultAppData.mortgageCalculations)).toBe(true);
    expect(Array.isArray(defaultAppData.creditCards)).toBe(true);
    expect(Array.isArray(defaultAppData.expenses)).toBe(true);
    expect(defaultAppData.settings).toEqual(defaultUserSettings);
  });
});