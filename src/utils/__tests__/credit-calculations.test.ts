// Unit tests for credit card calculations

import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyInterest,
  calculateMinimumPayment,
  calculatePayoffTime,
  calculateCreditUtilization,
  calculateTotalCreditUtilization,
  calculateInterestSavings,
  calculateDebtAvalanche,
  calculateDebtSnowball,
  calculateOptimalPaymentDistribution
} from '../credit-calculations';
import type { CreditCard } from '@/types';

describe('Credit Card Calculations', () => {
  describe('calculateMonthlyInterest', () => {
    it('should calculate monthly interest correctly', () => {
      const interest = calculateMonthlyInterest(1000, 18);
      expect(interest).toBeCloseTo(15, 2);
    });

    it('should handle zero balance', () => {
      const interest = calculateMonthlyInterest(0, 18);
      expect(interest).toBe(0);
    });

    it('should handle zero interest rate', () => {
      const interest = calculateMonthlyInterest(1000, 0);
      expect(interest).toBe(0);
    });
  });

  describe('calculateMinimumPayment', () => {
    it('should calculate minimum payment as percentage of balance', () => {
      const payment = calculateMinimumPayment(1000, 2, 15); // Use lower minimum so percentage wins
      expect(payment).toBe(20);
    });

    it('should use minimum amount when percentage is lower', () => {
      const payment = calculateMinimumPayment(500, 2, 25);
      expect(payment).toBe(25);
    });
  });

  describe('calculatePayoffTime', () => {
    it('should calculate payoff time correctly', () => {
      const result = calculatePayoffTime(5000, 18, 200);
      expect(result.months).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalPaid).toBe(5000 + result.totalInterest);
    });

    it('should return infinity for payments too small', () => {
      const result = calculatePayoffTime(5000, 18, 50);
      expect(result.months).toBe(Infinity);
    });

    it('should handle zero balance', () => {
      const result = calculatePayoffTime(0, 18, 200);
      expect(result.months).toBe(0);
      expect(result.totalInterest).toBe(0);
    });
  });

  describe('calculateCreditUtilization', () => {
    it('should calculate utilization ratio correctly', () => {
      const utilization = calculateCreditUtilization(3000, 10000);
      expect(utilization).toBe(30);
    });

    it('should handle zero credit limit', () => {
      const utilization = calculateCreditUtilization(1000, 0);
      expect(utilization).toBe(0);
    });

    it('should handle full utilization', () => {
      const utilization = calculateCreditUtilization(5000, 5000);
      expect(utilization).toBe(100);
    });
  });

  describe('calculateTotalCreditUtilization', () => {
    it('should calculate total utilization across multiple cards', () => {
      const cards: CreditCard[] = [
        {
          id: '1',
          name: 'Card 1',
          balance: 2000,
          creditLimit: 5000,
          minimumPayment: 50,
          dueDate: new Date(),
          interestRate: 18,
          paymentHistory: []
        },
        {
          id: '2',
          name: 'Card 2',
          balance: 1000,
          creditLimit: 3000,
          minimumPayment: 30,
          dueDate: new Date(),
          interestRate: 15,
          paymentHistory: []
        }
      ];

      const utilization = calculateTotalCreditUtilization(cards);
      expect(utilization).toBeCloseTo(37.5, 1); // 3000 / 8000 = 37.5%
    });
  });

  describe('calculateInterestSavings', () => {
    it('should calculate interest savings from higher payments', () => {
      const savings = calculateInterestSavings(5000, 18, 100, 200);
      
      expect(savings.minimumPayoffTime).toBeGreaterThan(savings.proposedPayoffTime);
      expect(savings.interestSaved).toBeGreaterThan(0);
      expect(savings.timeSaved).toBeGreaterThan(0);
    });
  });

  describe('calculateDebtAvalanche', () => {
    it('should sort cards by highest interest rate first', () => {
      const cards: CreditCard[] = [
        {
          id: '1',
          name: 'Low Rate',
          balance: 1000,
          creditLimit: 5000,
          minimumPayment: 25,
          dueDate: new Date(),
          interestRate: 12,
          paymentHistory: []
        },
        {
          id: '2',
          name: 'High Rate',
          balance: 2000,
          creditLimit: 3000,
          minimumPayment: 50,
          dueDate: new Date(),
          interestRate: 24,
          paymentHistory: []
        }
      ];

      const sorted = calculateDebtAvalanche(cards);
      expect(sorted[0].interestRate).toBe(24);
      expect(sorted[1].interestRate).toBe(12);
    });
  });

  describe('calculateDebtSnowball', () => {
    it('should sort cards by lowest balance first', () => {
      const cards: CreditCard[] = [
        {
          id: '1',
          name: 'High Balance',
          balance: 5000,
          creditLimit: 10000,
          minimumPayment: 100,
          dueDate: new Date(),
          interestRate: 15,
          paymentHistory: []
        },
        {
          id: '2',
          name: 'Low Balance',
          balance: 1000,
          creditLimit: 3000,
          minimumPayment: 25,
          dueDate: new Date(),
          interestRate: 18,
          paymentHistory: []
        }
      ];

      const sorted = calculateDebtSnowball(cards);
      expect(sorted[0].balance).toBe(1000);
      expect(sorted[1].balance).toBe(5000);
    });
  });

  describe('calculateOptimalPaymentDistribution', () => {
    it('should distribute payments correctly using avalanche method', () => {
      const cards: CreditCard[] = [
        {
          id: '1',
          name: 'Low Rate',
          balance: 2000,
          creditLimit: 5000,
          minimumPayment: 50,
          dueDate: new Date(),
          interestRate: 12,
          paymentHistory: []
        },
        {
          id: '2',
          name: 'High Rate',
          balance: 3000,
          creditLimit: 8000,
          minimumPayment: 75,
          dueDate: new Date(),
          interestRate: 20,
          paymentHistory: []
        }
      ];

      const distribution = calculateOptimalPaymentDistribution(cards, 300, 'avalanche');
      
      expect(distribution).toHaveLength(2);
      expect(distribution.find(p => p.cardId === '1')?.payment).toBe(50); // Minimum only
      expect(distribution.find(p => p.cardId === '2')?.payment).toBe(250); // Minimum + extra
    });

    it('should handle insufficient budget for all minimums', () => {
      const cards: CreditCard[] = [
        {
          id: '1',
          name: 'Card 1',
          balance: 1000,
          creditLimit: 2000,
          minimumPayment: 100,
          dueDate: new Date(),
          interestRate: 15,
          paymentHistory: []
        }
      ];

      const distribution = calculateOptimalPaymentDistribution(cards, 50, 'avalanche');
      expect(distribution[0].payment).toBe(50);
    });
  });
});