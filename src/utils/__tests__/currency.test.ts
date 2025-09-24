// Unit tests for currency utilities

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercentage,
  formatLargeNumber,
  parseCurrency,
  parsePercentage,
  getCurrencySymbol,
  isValidCurrencyAmount,
  isValidPercentage,
  formatNumber,
  formatCurrencyDifference,
  roundCurrency,
  convertCurrency
} from '../currency';

describe('Currency Utilities', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      const formatted = formatCurrency(1234.56, 'USD');
      expect(formatted).toBe('$1,234.56');
    });

    it('should format EUR currency correctly', () => {
      const formatted = formatCurrency(1234.56, 'EUR', 'en-US');
      expect(formatted).toBe('€1,234.56');
    });

    it('should handle zero amount', () => {
      const formatted = formatCurrency(0);
      expect(formatted).toBe('$0.00');
    });

    it('should handle negative amounts', () => {
      const formatted = formatCurrency(-1234.56);
      expect(formatted).toBe('-$1,234.56');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage correctly', () => {
      const formatted = formatPercentage(25.5, 1);
      expect(formatted).toBe('25.5%');
    });

    it('should handle zero percentage', () => {
      const formatted = formatPercentage(0);
      expect(formatted).toBe('0.00%');
    });

    it('should handle decimal places', () => {
      const formatted = formatPercentage(33.333, 2);
      expect(formatted).toBe('33.33%');
    });
  });

  describe('formatLargeNumber', () => {
    it('should format billions correctly', () => {
      const formatted = formatLargeNumber(2500000000);
      expect(formatted).toBe('$2.5B');
    });

    it('should format millions correctly', () => {
      const formatted = formatLargeNumber(1500000);
      expect(formatted).toBe('$1.5M');
    });

    it('should format thousands correctly', () => {
      const formatted = formatLargeNumber(2500);
      expect(formatted).toBe('$2.5K');
    });

    it('should format small numbers normally', () => {
      const formatted = formatLargeNumber(500);
      expect(formatted).toBe('$500.00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency string correctly', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
      expect(parseCurrency('€1,234.56')).toBe(1234.56);
      expect(parseCurrency('1234.56')).toBe(1234.56);
    });

    it('should handle strings without currency symbols', () => {
      expect(parseCurrency('1234.56')).toBe(1234.56);
    });

    it('should handle invalid strings', () => {
      expect(parseCurrency('invalid')).toBe(0);
      expect(parseCurrency('')).toBe(0);
    });

    it('should handle null/undefined', () => {
      expect(parseCurrency(null as any)).toBe(0);
      expect(parseCurrency(undefined as any)).toBe(0);
    });
  });

  describe('parsePercentage', () => {
    it('should parse percentage string correctly', () => {
      expect(parsePercentage('25.5%')).toBe(25.5);
      expect(parsePercentage('25.5')).toBe(25.5);
    });

    it('should handle invalid strings', () => {
      expect(parsePercentage('invalid')).toBe(0);
      expect(parsePercentage('')).toBe(0);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct currency symbols', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
      expect(getCurrencySymbol('CAD')).toBe('C$');
      expect(getCurrencySymbol('AUD')).toBe('A$');
    });
  });

  describe('isValidCurrencyAmount', () => {
    it('should validate correct currency formats', () => {
      expect(isValidCurrencyAmount('$1,234.56')).toBe(true);
      expect(isValidCurrencyAmount('1234.56')).toBe(true);
      expect(isValidCurrencyAmount('1,234')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidCurrencyAmount('invalid')).toBe(false);
      expect(isValidCurrencyAmount('$1,23.456')).toBe(false);
      expect(isValidCurrencyAmount('')).toBe(false);
    });
  });

  describe('isValidPercentage', () => {
    it('should validate correct percentage formats', () => {
      expect(isValidPercentage('25.5%')).toBe(true);
      expect(isValidPercentage('25.5')).toBe(true);
      expect(isValidPercentage('100')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidPercentage('invalid')).toBe(false);
      expect(isValidPercentage('')).toBe(false);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousands separators', () => {
      const formatted = formatNumber(1234567);
      expect(formatted).toBe('1,234,567');
    });

    it('should handle small numbers', () => {
      const formatted = formatNumber(123);
      expect(formatted).toBe('123');
    });
  });

  describe('formatCurrencyDifference', () => {
    it('should calculate positive difference correctly', () => {
      const result = formatCurrencyDifference(1200, 1000);
      expect(result.formatted).toBe('$200.00');
      expect(result.isPositive).toBe(true);
      expect(result.percentage).toBe(20);
    });

    it('should calculate negative difference correctly', () => {
      const result = formatCurrencyDifference(800, 1000);
      expect(result.formatted).toBe('$200.00');
      expect(result.isPositive).toBe(false);
      expect(result.percentage).toBe(-20);
    });

    it('should handle zero previous value', () => {
      const result = formatCurrencyDifference(100, 0);
      expect(result.formatted).toBe('$100.00');
      expect(result.isPositive).toBe(true);
      expect(result.percentage).toBe(0);
    });
  });

  describe('roundCurrency', () => {
    it('should round to 2 decimal places by default', () => {
      expect(roundCurrency(1.2345)).toBe(1.23);
      expect(roundCurrency(1.2367)).toBe(1.24);
    });

    it('should round to specified decimal places', () => {
      expect(roundCurrency(1.2345, 3)).toBe(1.235);
      expect(roundCurrency(1.2345, 1)).toBe(1.2);
    });
  });

  describe('convertCurrency', () => {
    it('should return same amount for same currency', () => {
      expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
    });

    it('should convert using mock exchange rates', () => {
      const converted = convertCurrency(100, 'USD', 'EUR');
      expect(converted).toBeCloseTo(85, 0); // Mock rate is 0.85
    });

    it('should use provided exchange rate', () => {
      const converted = convertCurrency(100, 'USD', 'EUR', 0.9);
      expect(converted).toBe(90);
    });
  });
});