// Unit tests for mortgage calculations

import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  calculatePMI,
  calculateMonthlyPropertyTax,
  calculateMonthlyInsurance,
  calculateTotalInterest,
  calculateMortgage,
  generateAmortizationSchedule,
  calculateAffordableHousePrice
} from '../mortgage-calculations';
import type { MortgageInputs } from '@/types';

describe('Mortgage Calculations', () => {
  describe('calculateMonthlyPayment', () => {
    it('should calculate correct monthly payment for standard mortgage', () => {
      const payment = calculateMonthlyPayment(300000, 4.5, 30);
      expect(payment).toBeCloseTo(1520.06, 2);
    });

    it('should handle zero interest rate', () => {
      const payment = calculateMonthlyPayment(300000, 0, 30);
      expect(payment).toBe(833.33);
    });

    it('should handle short-term loan', () => {
      const payment = calculateMonthlyPayment(100000, 5, 5);
      expect(payment).toBeCloseTo(1887.12, 2);
    });
  });

  describe('calculatePMI', () => {
    it('should calculate PMI correctly', () => {
      const pmi = calculatePMI(250000, 0.5);
      expect(pmi).toBeCloseTo(104.17, 2);
    });

    it('should handle zero PMI rate', () => {
      const pmi = calculatePMI(250000, 0);
      expect(pmi).toBe(0);
    });
  });

  describe('calculateMonthlyPropertyTax', () => {
    it('should calculate monthly property tax', () => {
      const tax = calculateMonthlyPropertyTax(6000);
      expect(tax).toBe(500);
    });
  });

  describe('calculateMonthlyInsurance', () => {
    it('should calculate monthly insurance', () => {
      const insurance = calculateMonthlyInsurance(1200);
      expect(insurance).toBe(100);
    });
  });

  describe('calculateTotalInterest', () => {
    it('should calculate total interest over loan term', () => {
      const totalInterest = calculateTotalInterest(1520.06, 30, 300000);
      expect(totalInterest).toBeCloseTo(247221.6, 1);
    });
  });

  describe('calculateMortgage', () => {
    it('should calculate complete mortgage scenario', () => {
      const inputs: MortgageInputs = {
        loanAmount: 400000,
        downPayment: 60000, // 15% down payment to trigger PMI
        interestRate: 4.5,
        loanTermYears: 30,
        propertyTax: 6000,
        homeInsurance: 1200,
        pmiRate: 0.5
      };

      const results = calculateMortgage(inputs);

      expect(results.principal).toBe(340000);
      expect(results.monthlyPayment).toBeCloseTo(1722.73, 2);
      expect(results.monthlyTax).toBe(500);
      expect(results.monthlyInsurance).toBe(100);
      expect(results.monthlyPMI).toBeCloseTo(141.67, 2);
      expect(results.totalMonthlyPayment).toBeCloseTo(2464.40, 2);
    });

    it('should not calculate PMI when down payment is 20% or more', () => {
      const inputs: MortgageInputs = {
        loanAmount: 400000,
        downPayment: 80000, // 20%
        interestRate: 4.5,
        loanTermYears: 30,
        propertyTax: 6000,
        homeInsurance: 1200,
        pmiRate: 0.5
      };

      const results = calculateMortgage(inputs);
      expect(results.monthlyPMI).toBe(0);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate correct amortization schedule', () => {
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      
      expect(schedule).toHaveLength(120); // 10 years * 12 months
      expect(schedule[0].month).toBe(1);
      expect(schedule[0].remainingBalance).toBeLessThan(100000);
      expect(schedule[119].remainingBalance).toBeCloseTo(0, 2);
    });

    it('should have decreasing balance over time', () => {
      const schedule = generateAmortizationSchedule(100000, 5, 10);
      
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].remainingBalance).toBeLessThanOrEqual(schedule[i - 1].remainingBalance);
      }
    });
  });

  describe('calculateAffordableHousePrice', () => {
    it('should calculate affordable house price', () => {
      const affordablePrice = calculateAffordableHousePrice(2000, 20, 4.5, 30, 600);
      expect(affordablePrice).toBeGreaterThan(0);
      expect(affordablePrice).toBeCloseTo(350000, -4); // Rough estimate
    });

    it('should return 0 if monthly budget is too low', () => {
      const affordablePrice = calculateAffordableHousePrice(500, 20, 4.5, 30, 600);
      expect(affordablePrice).toBe(0);
    });

    it('should handle zero interest rate', () => {
      const affordablePrice = calculateAffordableHousePrice(2000, 20, 0, 30, 600);
      expect(affordablePrice).toBeGreaterThan(0);
    });
  });
});