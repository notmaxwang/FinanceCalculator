// Credit card calculation utilities

import type { CreditCard, PaymentRecord } from '@/types';

/**
 * Calculate monthly interest charge for a credit card
 */
export function calculateMonthlyInterest(balance: number, annualInterestRate: number): number {
  const monthlyRate = annualInterestRate / 100 / 12;
  return Math.round(balance * monthlyRate * 100) / 100;
}

/**
 * Calculate minimum payment based on balance and card terms
 * Typically 1-3% of balance or $25 minimum, whichever is higher
 */
export function calculateMinimumPayment(
  balance: number, 
  minimumPercent: number = 2,
  minimumAmount: number = 25
): number {
  const percentagePayment = balance * (minimumPercent / 100);
  return Math.round(Math.max(percentagePayment, minimumAmount) * 100) / 100;
}

/**
 * Calculate how long it will take to pay off a credit card with minimum payments
 */
export function calculatePayoffTime(
  balance: number,
  annualInterestRate: number,
  monthlyPayment: number
): { months: number; totalInterest: number; totalPaid: number } {
  if (monthlyPayment <= 0 || balance <= 0) {
    return { months: 0, totalInterest: 0, totalPaid: 0 };
  }

  const monthlyRate = annualInterestRate / 100 / 12;
  let currentBalance = balance;
  let months = 0;
  let totalInterest = 0;

  // Prevent infinite loop if payment is too small
  const minimumInterest = calculateMonthlyInterest(balance, annualInterestRate);
  if (monthlyPayment <= minimumInterest) {
    return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
  }

  while (currentBalance > 0.01 && months < 600) { // Cap at 50 years
    const interestCharge = currentBalance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestCharge, currentBalance);
    
    currentBalance -= principalPayment;
    totalInterest += interestCharge;
    months++;

    if (principalPayment <= 0) break; // Safety check
  }

  return {
    months,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round((balance + totalInterest) * 100) / 100
  };
}

/**
 * Generate payment schedule for credit card payoff
 */
export function generatePaymentSchedule(
  balance: number,
  annualInterestRate: number,
  monthlyPayment: number,
  maxMonths: number = 120
): PaymentRecord[] {
  const schedule: PaymentRecord[] = [];
  const monthlyRate = annualInterestRate / 100 / 12;
  let currentBalance = balance;
  let currentDate = new Date();

  for (let month = 0; month < maxMonths && currentBalance > 0.01; month++) {
    const interestCharged = currentBalance * monthlyRate;
    const principalPaid = Math.min(monthlyPayment - interestCharged, currentBalance);
    
    if (principalPaid <= 0) break;

    currentBalance -= principalPaid;
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());

    schedule.push({
      date: new Date(currentDate),
      amount: monthlyPayment,
      interestCharged: Math.round(interestCharged * 100) / 100,
      principalPaid: Math.round(principalPaid * 100) / 100,
      remainingBalance: Math.round(currentBalance * 100) / 100
    });
  }

  return schedule;
}

/**
 * Calculate credit utilization ratio
 */
export function calculateCreditUtilization(balance: number, creditLimit: number): number {
  if (creditLimit <= 0) return 0;
  return Math.round((balance / creditLimit) * 100 * 100) / 100;
}

/**
 * Calculate total credit utilization across multiple cards
 */
export function calculateTotalCreditUtilization(cards: CreditCard[]): number {
  const totalBalance = cards.reduce((sum, card) => sum + card.balance, 0);
  const totalLimit = cards.reduce((sum, card) => sum + card.creditLimit, 0);
  
  return calculateCreditUtilization(totalBalance, totalLimit);
}

/**
 * Calculate interest savings by paying more than minimum
 */
export function calculateInterestSavings(
  balance: number,
  annualInterestRate: number,
  minimumPayment: number,
  proposedPayment: number
): {
  minimumPayoffTime: number;
  proposedPayoffTime: number;
  interestSaved: number;
  timeSaved: number;
} {
  const minimumScenario = calculatePayoffTime(balance, annualInterestRate, minimumPayment);
  const proposedScenario = calculatePayoffTime(balance, annualInterestRate, proposedPayment);

  return {
    minimumPayoffTime: minimumScenario.months,
    proposedPayoffTime: proposedScenario.months,
    interestSaved: minimumScenario.totalInterest - proposedScenario.totalInterest,
    timeSaved: minimumScenario.months - proposedScenario.months
  };
}

/**
 * Calculate debt avalanche order (highest interest rate first)
 */
export function calculateDebtAvalanche(cards: CreditCard[]): CreditCard[] {
  return [...cards].sort((a, b) => b.interestRate - a.interestRate);
}

/**
 * Calculate debt snowball order (lowest balance first)
 */
export function calculateDebtSnowball(cards: CreditCard[]): CreditCard[] {
  return [...cards].sort((a, b) => a.balance - b.balance);
}

/**
 * Calculate optimal payment distribution for debt payoff
 */
export function calculateOptimalPaymentDistribution(
  cards: CreditCard[],
  totalPaymentBudget: number,
  strategy: 'avalanche' | 'snowball' = 'avalanche'
): Array<{ cardId: string; payment: number }> {
  const sortedCards = strategy === 'avalanche' 
    ? calculateDebtAvalanche(cards)
    : calculateDebtSnowball(cards);

  const payments: Array<{ cardId: string; payment: number }> = [];
  let remainingBudget = totalPaymentBudget;

  // First, allocate minimum payments
  for (const card of sortedCards) {
    const minPayment = Math.min(card.minimumPayment, remainingBudget, card.balance);
    payments.push({ cardId: card.id, payment: minPayment });
    remainingBudget -= minPayment;
  }

  // Then, allocate extra payment to the priority card
  if (remainingBudget > 0 && sortedCards.length > 0) {
    const priorityCard = sortedCards[0];
    const priorityPayment = payments.find(p => p.cardId === priorityCard.id);
    if (priorityPayment) {
      const maxExtraPayment = Math.min(remainingBudget, priorityCard.balance - priorityPayment.payment);
      priorityPayment.payment += maxExtraPayment;
    }
  }

  return payments;
}