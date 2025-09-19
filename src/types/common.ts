// Common Types and Interfaces

export interface UserSettings {
  currency: string;
  theme: 'light' | 'dark';
  notifications: boolean;
  autoSave: boolean;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  numberFormat: 'US' | 'EU';
}

export interface AppData {
  mortgageCalculations: import('./mortgage').MortgageCalculation[];
  creditCards: import('./expense').CreditCard[];
  expenses: import('./expense').Expense[];
  budgets: import('./expense').Budget[];
  watchlist: import('./investment').WatchlistItem[];
  portfolio: import('./investment').Holding[];
  creditCardRecommendations: import('./expense').CreditCardRecommendation[];
  spendingAnalysis: import('./expense').SpendingPattern[];
  settings: UserSettings;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface NotificationConfig {
  id: string;
  type: 'payment_due' | 'budget_exceeded' | 'portfolio_alert';
  title: string;
  message: string;
  scheduledFor: Date;
  isRead: boolean;
  createdAt: Date;
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';

export type Theme = 'light' | 'dark' | 'system';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}