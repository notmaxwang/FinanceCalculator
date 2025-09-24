// Main application store

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storageService, defaultUserSettings, isValidUserSettings } from '@/services/storage';
import type { UserSettings, LoadingState, NotificationConfig } from '@/types';

export const useAppStore = defineStore('app', () => {
  // State
  const settings = ref<UserSettings>({ ...defaultUserSettings });
  const loadingState = ref<LoadingState>('idle');
  const notifications = ref<NotificationConfig[]>([]);
  const isInitialized = ref(false);

  // Getters
  const isDarkMode = computed(() => {
    if (settings.value.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return settings.value.theme === 'dark';
  });

  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.isRead)
  );

  const unreadNotificationCount = computed(() => unreadNotifications.value.length);

  // Actions
  function updateSettings(newSettings: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...newSettings };
    
    if (settings.value.autoSave) {
      saveSettings();
    }
  }

  function saveSettings(): boolean {
    return storageService.setItem('settings', settings.value, true);
  }

  function loadSettings(): boolean {
    try {
      const stored = storageService.getItem('settings', null, true);
      
      if (stored && isValidUserSettings(stored)) {
        settings.value = { ...defaultUserSettings, ...stored as UserSettings };
        return true;
      }
      
      // If no valid settings found, save defaults
      saveSettings();
      return false;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return false;
    }
  }

  function addNotification(notification: Omit<NotificationConfig, 'id' | 'createdAt' | 'isRead'>) {
    const newNotification: NotificationConfig = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isRead: false
    };

    notifications.value.unshift(newNotification);

    // Limit to 50 notifications
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50);
    }

    return newNotification.id;
  }

  function markNotificationAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.isRead = true;
    }
  }

  function markAllNotificationsAsRead() {
    notifications.value.forEach(n => {
      n.isRead = true;
    });
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  }

  function clearAllNotifications() {
    notifications.value = [];
  }

  function setLoadingState(state: LoadingState) {
    loadingState.value = state;
  }

  function applyTheme() {
    const root = document.documentElement;
    
    if (isDarkMode.value) {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }

  function initialize(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        setLoadingState('loading');
        
        // Load settings
        loadSettings();
        
        // Apply theme
        applyTheme();
        
        // Load notifications from storage
        const storedNotifications = storageService.getItem<NotificationConfig[]>('notifications', [], true);
        if (Array.isArray(storedNotifications)) {
          notifications.value = storedNotifications;
        }

        isInitialized.value = true;
        setLoadingState('success');
        resolve(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setLoadingState('error');
        resolve(false);
      }
    });
  }

  function saveNotifications(): boolean {
    return storageService.setItem('notifications', notifications.value, true);
  }

  function exportAllData(): string | null {
    return storageService.exportData();
  }

  function importAllData(data: string): boolean {
    const success = storageService.importData(data);
    if (success) {
      // Reload settings and notifications
      loadSettings();
      const storedNotifications = storageService.getItem<NotificationConfig[]>('notifications', [], true);
      if (Array.isArray(storedNotifications)) {
        notifications.value = storedNotifications;
      }
    }
    return success;
  }

  function clearAllData(): boolean {
    const success = storageService.clear();
    if (success) {
      // Reset to defaults
      settings.value = { ...defaultUserSettings };
      notifications.value = [];
      isInitialized.value = false;
    }
    return success;
  }

  function getStorageInfo() {
    return storageService.getStorageInfo();
  }

  // Watch for theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (settings.value.theme === 'system') {
        applyTheme();
      }
    });
  }

  return {
    // State
    settings,
    loadingState,
    notifications,
    isInitialized,
    
    // Getters
    isDarkMode,
    unreadNotifications,
    unreadNotificationCount,
    
    // Actions
    updateSettings,
    saveSettings,
    loadSettings,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications,
    setLoadingState,
    applyTheme,
    initialize,
    saveNotifications,
    exportAllData,
    importAllData,
    clearAllData,
    getStorageInfo
  };
});