// Tests for app store

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../app';
import { defaultUserSettings } from '@/services/storage';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock the storage service
vi.mock('@/services/storage', () => ({
  storageService: {
    setItem: vi.fn(() => true),
    getItem: vi.fn(() => null),
    exportData: vi.fn(() => '{"test": "data"}'),
    importData: vi.fn(() => true),
    clear: vi.fn(() => true),
    getStorageInfo: vi.fn(() => ({ used: 1000, available: 4000000, percentage: 0.025 }))
  },
  defaultUserSettings: {
    currency: 'USD',
    theme: 'light',
    notifications: true,
    autoSave: true,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'US'
  },
  isValidUserSettings: vi.fn(() => true)
}));

describe('App Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with default settings', () => {
    const store = useAppStore();
    
    expect(store.settings).toEqual(defaultUserSettings);
    expect(store.loadingState).toBe('idle');
    expect(store.notifications).toEqual([]);
    expect(store.isInitialized).toBe(false);
  });

  it('should update settings', () => {
    const store = useAppStore();
    
    store.updateSettings({ theme: 'dark', currency: 'EUR' });
    
    expect(store.settings.theme).toBe('dark');
    expect(store.settings.currency).toBe('EUR');
    expect(store.settings.notifications).toBe(true); // Should keep other settings
  });

  it('should calculate dark mode correctly', () => {
    const store = useAppStore();
    
    // Test explicit dark theme
    store.updateSettings({ theme: 'dark' });
    expect(store.isDarkMode).toBe(true);
    
    // Test explicit light theme
    store.updateSettings({ theme: 'light' });
    expect(store.isDarkMode).toBe(false);
  });

  it('should add notifications', () => {
    const store = useAppStore();
    
    const notificationId = store.addNotification({
      type: 'payment_due',
      title: 'Payment Due',
      message: 'Your credit card payment is due tomorrow',
      scheduledFor: new Date()
    });
    
    expect(notificationId).toBeTruthy();
    expect(store.notifications).toHaveLength(1);
    expect(store.unreadNotificationCount).toBe(1);
    expect(store.notifications[0].title).toBe('Payment Due');
    expect(store.notifications[0].isRead).toBe(false);
  });

  it('should mark notifications as read', () => {
    const store = useAppStore();
    
    const notificationId = store.addNotification({
      type: 'budget_exceeded',
      title: 'Budget Exceeded',
      message: 'You have exceeded your dining budget',
      scheduledFor: new Date()
    });
    
    store.markNotificationAsRead(notificationId);
    
    expect(store.notifications[0].isRead).toBe(true);
    expect(store.unreadNotificationCount).toBe(0);
  });

  it('should mark all notifications as read', () => {
    const store = useAppStore();
    
    store.addNotification({
      type: 'payment_due',
      title: 'Payment 1',
      message: 'Message 1',
      scheduledFor: new Date()
    });
    
    store.addNotification({
      type: 'budget_exceeded',
      title: 'Payment 2',
      message: 'Message 2',
      scheduledFor: new Date()
    });
    
    expect(store.unreadNotificationCount).toBe(2);
    
    store.markAllNotificationsAsRead();
    
    expect(store.unreadNotificationCount).toBe(0);
    expect(store.notifications.every(n => n.isRead)).toBe(true);
  });

  it('should remove notifications', () => {
    const store = useAppStore();
    
    const notificationId = store.addNotification({
      type: 'portfolio_alert',
      title: 'Portfolio Alert',
      message: 'Your portfolio has gained 5%',
      scheduledFor: new Date()
    });
    
    expect(store.notifications).toHaveLength(1);
    
    store.removeNotification(notificationId);
    
    expect(store.notifications).toHaveLength(0);
  });

  it('should clear all notifications', () => {
    const store = useAppStore();
    
    store.addNotification({
      type: 'payment_due',
      title: 'Payment 1',
      message: 'Message 1',
      scheduledFor: new Date()
    });
    
    store.addNotification({
      type: 'budget_exceeded',
      title: 'Payment 2',
      message: 'Message 2',
      scheduledFor: new Date()
    });
    
    expect(store.notifications).toHaveLength(2);
    
    store.clearAllNotifications();
    
    expect(store.notifications).toHaveLength(0);
  });

  it('should limit notifications to 50', () => {
    const store = useAppStore();
    
    // Add 55 notifications
    for (let i = 0; i < 55; i++) {
      store.addNotification({
        type: 'payment_due',
        title: `Notification ${i}`,
        message: `Message ${i}`,
        scheduledFor: new Date()
      });
    }
    
    expect(store.notifications).toHaveLength(50);
    expect(store.notifications[0].title).toBe('Notification 54'); // Most recent first
  });

  it('should set loading state', () => {
    const store = useAppStore();
    
    store.setLoadingState('loading');
    expect(store.loadingState).toBe('loading');
    
    store.setLoadingState('success');
    expect(store.loadingState).toBe('success');
    
    store.setLoadingState('error');
    expect(store.loadingState).toBe('error');
  });

  it('should export and import data', () => {
    const store = useAppStore();
    
    const exportedData = store.exportAllData();
    expect(exportedData).toBe('{"test": "data"}');
    
    const imported = store.importAllData('{"imported": "data"}');
    expect(imported).toBe(true);
  });

  it('should clear all data', () => {
    const store = useAppStore();
    
    const cleared = store.clearAllData();
    expect(cleared).toBe(true);
  });

  it('should get storage info', () => {
    const store = useAppStore();
    
    const info = store.getStorageInfo();
    expect(info.used).toBe(1000);
    expect(info.available).toBe(4000000);
    expect(info.percentage).toBe(0.025);
  });
});