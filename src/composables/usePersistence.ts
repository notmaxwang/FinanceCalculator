// Composable for state persistence

import { watch, ref } from 'vue';
import { storageService } from '@/services/storage';
import { useAppStore } from '@/stores/app';

export function usePersistence() {
  const appStore = useAppStore();
  const isAutoSaveEnabled = ref(true);

  // Auto-save functionality
  function enableAutoSave() {
    isAutoSaveEnabled.value = true;
  }

  function disableAutoSave() {
    isAutoSaveEnabled.value = false;
  }

  // Watch for settings changes and auto-save if enabled
  watch(
    () => appStore.settings,
    (newSettings) => {
      if (isAutoSaveEnabled.value && newSettings.autoSave) {
        appStore.saveSettings();
      }
    },
    { deep: true }
  );

  // Watch for notifications changes and save periodically
  watch(
    () => appStore.notifications,
    () => {
      if (isAutoSaveEnabled.value && appStore.settings.autoSave) {
        // Debounce notification saves to avoid too frequent writes
        debounce(() => {
          appStore.saveNotifications();
        }, 1000);
      }
    },
    { deep: true }
  );

  // Debounce utility
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Manual save functions
  function saveAllData(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const settingsSuccess = appStore.saveSettings();
        const notificationsSuccess = appStore.saveNotifications();
        resolve(settingsSuccess && notificationsSuccess);
      } catch (error) {
        console.error('Failed to save all data:', error);
        resolve(false);
      }
    });
  }

  // Backup and restore functions
  function createBackup(): string | null {
    try {
      return appStore.exportAllData();
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  function restoreFromBackup(backupData: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const success = appStore.importAllData(backupData);
        if (success) {
          // Reload all stores after import
          window.location.reload();
        }
        resolve(success);
      } catch (error) {
        console.error('Failed to restore from backup:', error);
        resolve(false);
      }
    });
  }

  // Storage management
  function getStorageUsage() {
    return appStore.getStorageInfo();
  }

  function clearAllData(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const success = appStore.clearAllData();
        if (success) {
          // Reload the page to reset all stores
          window.location.reload();
        }
        resolve(success);
      } catch (error) {
        console.error('Failed to clear all data:', error);
        resolve(false);
      }
    });
  }

  // Data validation
  function validateStoredData(): boolean {
    try {
      // Check if critical data structures are intact
      const settings = storageService.getItem('settings', null, true);
      const mortgageCalculations = storageService.getItem('mortgageCalculations', null, true);
      const creditCards = storageService.getItem('creditCards', null, true);
      const expenses = storageService.getItem('expenses', null, true);
      const watchlist = storageService.getItem('watchlist', null, true);
      const holdings = storageService.getItem('holdings', null, true);

      // Basic validation - check if data can be parsed
      return (
        (settings === null || typeof settings === 'object') &&
        (mortgageCalculations === null || Array.isArray(mortgageCalculations)) &&
        (creditCards === null || Array.isArray(creditCards)) &&
        (expenses === null || Array.isArray(expenses)) &&
        (watchlist === null || Array.isArray(watchlist)) &&
        (holdings === null || Array.isArray(holdings))
      );
    } catch (error) {
      console.error('Data validation failed:', error);
      return false;
    }
  }

  // Migration utilities (for future use)
  function migrateData(fromVersion: string, toVersion: string): boolean {
    try {
      // Placeholder for data migration logic
      console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
      return true;
    } catch (error) {
      console.error('Data migration failed:', error);
      return false;
    }
  }

  return {
    // State
    isAutoSaveEnabled,
    
    // Auto-save controls
    enableAutoSave,
    disableAutoSave,
    
    // Manual operations
    saveAllData,
    createBackup,
    restoreFromBackup,
    
    // Storage management
    getStorageUsage,
    clearAllData,
    
    // Validation and migration
    validateStoredData,
    migrateData,
    
    // Utilities
    debounce
  };
}