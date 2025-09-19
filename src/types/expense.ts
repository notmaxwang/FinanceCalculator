// Expense Tracking Types

export interface PaymentRecord {
  date: Date;
  amount: number;
  interestCharged: number;
  principalPaid: number;
  remainingBalance: number;
}

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  creditLimit: number;
  minimumPayment: number;
  dueDate: Date;
  interestRate: number;
  monthlyInterest?: number;
  totalInterestPaid?: number;
  paymentHistory: PaymentRecord[];
}

export interface RewardCategory {
  category: string;
  rewardRate: number;
  cap?: number;
}

export interface CreditCardRecommendation {
  cardName: string;
  issuer: string;
  rewardStructure: RewardCategory[];
  annualFee: number;
  introAPR?: string;
  estimatedAnnualRewards: number;
  matchScore: number; // Based on spending habits
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod: string;
  creditCardId?: string;
}

export interface Budget {
  category: string;
  budgetAmount: number;
  spentAmount: number;
  remaining: number;
}

export interface SpendingPattern {
  category: string;
  monthlyAverage: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export type ExpenseCategory = 
  | 'dining'
  | 'groceries'
  | 'gas'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'healthcare'
  | 'travel'
  | 'other';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer';