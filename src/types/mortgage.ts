// Mortgage Calculator Types

export interface MortgageInputs {
  loanAmount: number;
  downPayment: number;
  interestRate: number;
  loanTermYears: number;
  propertyTax: number;
  homeInsurance: number;
  pmiRate?: number;
}

export interface MortgageResults {
  monthlyPayment: number;
  principal: number;
  interest: number;
  monthlyTax: number;
  monthlyInsurance: number;
  monthlyPMI: number;
  totalMonthlyPayment: number;
  totalInterest: number;
  totalCost: number;
}

export interface AmortizationEntry {
  month: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
  totalInterestPaid: number;
}

export interface MortgageCalculation {
  id: string;
  inputs: MortgageInputs;
  results: MortgageResults;
  createdAt: Date;
  name?: string;
}