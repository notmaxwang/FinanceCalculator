// Currency formatting and validation utilities

import type { Currency } from '@/types';

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'USD',
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = {}
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  };

  try {
    return new Intl.NumberFormat(locale, defaultOptions).format(amount);
  } catch (error) {
    // Fallback formatting if Intl fails
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 2,
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  } catch (error) {
    return `${value.toFixed(decimals)}%`;
  }
}

/**
 * Format a large number with appropriate suffixes (K, M, B)
 */
export function formatLargeNumber(
  amount: number,
  currency: Currency = 'USD',
  locale: string = 'en-US'
): string {
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1e9) {
    return formatCurrency(amount / 1e9, currency, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'B';
  } else if (absAmount >= 1e6) {
    return formatCurrency(amount / 1e6, currency, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'M';
  } else if (absAmount >= 1e3) {
    return formatCurrency(amount / 1e3, currency, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'K';
  }
  
  return formatCurrency(amount, currency, locale);
}

/**
 * Parse a currency string to a number
 */
export function parseCurrency(currencyString: string): number {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbols, spaces, and commas
  const cleanString = currencyString
    .replace(/[$€£¥₹₽¢]/g, '') // Common currency symbols
    .replace(/[,\s]/g, '') // Commas and spaces
    .trim();

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse a percentage string to a number
 */
export function parsePercentage(percentageString: string): number {
  if (!percentageString || typeof percentageString !== 'string') {
    return 0;
  }

  const cleanString = percentageString.replace(/%/g, '').trim();
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$'
  };
  
  return symbols[currency] || '$';
}

/**
 * Validate if a string represents a valid currency amount
 */
export function isValidCurrencyAmount(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Allow currency symbols, numbers, commas, and decimal points
  const currencyRegex = /^[$€£¥₹₽¢]?\s*\d{1,3}(,\d{3})*(\.\d{1,2})?$/;
  const cleanValue = value.trim();
  
  return currencyRegex.test(cleanValue) || /^\d+(\.\d{1,2})?$/.test(cleanValue);
}

/**
 * Validate if a string represents a valid percentage
 */
export function isValidPercentage(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const percentageRegex = /^\d+(\.\d{1,4})?%?$/;
  return percentageRegex.test(value.trim());
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(
  value: number,
  locale: string = 'en-US',
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch (error) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

/**
 * Calculate the difference between two amounts and format as currency
 */
export function formatCurrencyDifference(
  current: number,
  previous: number,
  currency: Currency = 'USD',
  locale: string = 'en-US'
): { formatted: string; isPositive: boolean; percentage: number } {
  const difference = current - previous;
  const isPositive = difference >= 0;
  const percentage = previous !== 0 ? (difference / Math.abs(previous)) * 100 : 0;

  return {
    formatted: formatCurrency(Math.abs(difference), currency, locale),
    isPositive,
    percentage: Math.round(percentage * 100) / 100
  };
}

/**
 * Round currency amount to appropriate decimal places
 */
export function roundCurrency(amount: number, decimals: number = 2): number {
  return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Convert between currencies (placeholder - would need real exchange rates)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate?: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // This is a placeholder - in a real app, you'd fetch current exchange rates
  const mockExchangeRates: Record<string, number> = {
    'USD-EUR': 0.85,
    'USD-GBP': 0.73,
    'USD-CAD': 1.25,
    'USD-AUD': 1.35,
    'EUR-USD': 1.18,
    'GBP-USD': 1.37,
    'CAD-USD': 0.80,
    'AUD-USD': 0.74
  };

  const rateKey = `${fromCurrency}-${toCurrency}`;
  const rate = exchangeRate || mockExchangeRates[rateKey] || 1;

  return roundCurrency(amount * rate);
}