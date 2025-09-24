// Mortgage calculation utilities

import type { MortgageInputs, MortgageResults, AmortizationEntry } from '@/types';

/**
 * Calculate monthly mortgage payment using the standard mortgage formula
 * M = P * [r(1+r)^n] / [(1+r)^n - 1]
 * Where: M = Monthly payment, P = Principal, r = Monthly interest rate, n = Number of payments
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  loanTermYears: number
): number {
  if (annualInterestRate === 0) {
    return Math.round((principal / (loanTermYears * 12)) * 100) / 100;
  }

  const monthlyRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  const monthlyPayment = principal * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return Math.round(monthlyPayment * 100) / 100;
}

/**
 * Calculate PMI (Private Mortgage Insurance) monthly payment
 * PMI is typically 0.5% to 1% of the loan amount annually
 */
export function calculatePMI(loanAmount: number, pmiRate: number): number {
  return Math.round((loanAmount * (pmiRate / 100) / 12) * 100) / 100;
}

/**
 * Calculate monthly property tax
 */
export function calculateMonthlyPropertyTax(annualPropertyTax: number): number {
  return Math.round((annualPropertyTax / 12) * 100) / 100;
}

/**
 * Calculate monthly home insurance
 */
export function calculateMonthlyInsurance(annualInsurance: number): number {
  return Math.round((annualInsurance / 12) * 100) / 100;
}

/**
 * Calculate total interest paid over the life of the loan
 */
export function calculateTotalInterest(
  monthlyPayment: number,
  loanTermYears: number,
  principal: number
): number {
  const totalPayments = monthlyPayment * loanTermYears * 12;
  return Math.round((totalPayments - principal) * 100) / 100;
}

/**
 * Main mortgage calculation function that returns all results
 */
export function calculateMortgage(inputs: MortgageInputs): MortgageResults {
  const {
    loanAmount,
    downPayment,
    interestRate,
    loanTermYears,
    propertyTax,
    homeInsurance,
    pmiRate = 0
  } = inputs;

  // Calculate actual loan amount after down payment
  const actualLoanAmount = loanAmount - downPayment;
  
  // Calculate monthly principal and interest payment
  const monthlyPayment = calculateMonthlyPayment(actualLoanAmount, interestRate, loanTermYears);
  
  // Calculate other monthly costs
  const monthlyTax = calculateMonthlyPropertyTax(propertyTax);
  const monthlyInsurance = calculateMonthlyInsurance(homeInsurance);
  
  // Calculate PMI if down payment is less than 20%
  const downPaymentPercent = (downPayment / loanAmount) * 100;
  const monthlyPMI = downPaymentPercent < 20 ? calculatePMI(actualLoanAmount, pmiRate) : 0;
  
  // Calculate totals
  const totalMonthlyPayment = monthlyPayment + monthlyTax + monthlyInsurance + monthlyPMI;
  const totalInterest = calculateTotalInterest(monthlyPayment, loanTermYears, actualLoanAmount);
  const totalCost = actualLoanAmount + totalInterest + (monthlyTax + monthlyInsurance) * loanTermYears * 12;

  return {
    monthlyPayment,
    principal: actualLoanAmount,
    interest: totalInterest,
    monthlyTax,
    monthlyInsurance,
    monthlyPMI,
    totalMonthlyPayment,
    totalInterest,
    totalCost
  };
}

/**
 * Generate amortization schedule
 */
export function generateAmortizationSchedule(
  principal: number,
  annualInterestRate: number,
  loanTermYears: number
): AmortizationEntry[] {
  const monthlyRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualInterestRate, loanTermYears);
  
  const schedule: AmortizationEntry[] = [];
  let remainingBalance = principal;
  let totalInterestPaid = 0;

  for (let month = 1; month <= numberOfPayments; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = monthlyPayment - interestPayment;
    
    remainingBalance -= principalPayment;
    totalInterestPaid += interestPayment;

    // Ensure remaining balance doesn't go negative due to rounding
    if (remainingBalance < 0) {
      remainingBalance = 0;
    }

    schedule.push({
      month,
      principalPayment: Math.round(principalPayment * 100) / 100,
      interestPayment: Math.round(interestPayment * 100) / 100,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
      totalInterestPaid: Math.round(totalInterestPaid * 100) / 100
    });
  }

  return schedule;
}

/**
 * Calculate how much house you can afford based on monthly payment budget
 */
export function calculateAffordableHousePrice(
  monthlyBudget: number,
  downPaymentPercent: number,
  interestRate: number,
  loanTermYears: number,
  monthlyTaxInsurance: number = 0
): number {
  const availableForPrincipalInterest = monthlyBudget - monthlyTaxInsurance;
  
  if (availableForPrincipalInterest <= 0) {
    return 0;
  }

  const monthlyRate = interestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  if (monthlyRate === 0) {
    const maxLoanAmount = availableForPrincipalInterest * numberOfPayments;
    return maxLoanAmount / (1 - downPaymentPercent / 100);
  }

  // Reverse mortgage calculation to find principal
  const maxLoanAmount = availableForPrincipalInterest * 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1) /
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments));

  // Calculate total house price including down payment
  const maxHousePrice = maxLoanAmount / (1 - downPaymentPercent / 100);
  
  return Math.round(maxHousePrice * 100) / 100;
}