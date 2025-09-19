// Validation utilities and schemas

import type { 
  MortgageInputs, 
  CreditCard, 
  Expense, 
  Budget,
  Holding,
  ValidationError,
  FormValidation 
} from '@/types';

// Validation rules
export const ValidationRules = {
  mortgage: {
    loanAmount: { min: 1000, max: 10000000 },
    downPayment: { min: 0, max: 5000000 },
    interestRate: { min: 0.01, max: 30 },
    loanTermYears: { min: 1, max: 50 },
    propertyTax: { min: 0, max: 100000 },
    homeInsurance: { min: 0, max: 50000 },
    pmiRate: { min: 0, max: 5 }
  },
  creditCard: {
    balance: { min: 0, max: 1000000 },
    creditLimit: { min: 100, max: 1000000 },
    minimumPayment: { min: 0, max: 100000 },
    interestRate: { min: 0, max: 50 }
  },
  expense: {
    amount: { min: 0.01, max: 100000 }
  },
  budget: {
    budgetAmount: { min: 0, max: 1000000 }
  },
  holding: {
    quantity: { min: 0.000001, max: 1000000 },
    purchasePrice: { min: 0.01, max: 1000000 }
  }
};

// Validation functions
export function validateMortgageInputs(inputs: Partial<MortgageInputs>): FormValidation {
  const errors: ValidationError[] = [];
  const rules = ValidationRules.mortgage;

  if (!inputs.loanAmount || inputs.loanAmount < rules.loanAmount.min || inputs.loanAmount > rules.loanAmount.max) {
    errors.push({
      field: 'loanAmount',
      message: `Loan amount must be between $${rules.loanAmount.min.toLocaleString()} and $${rules.loanAmount.max.toLocaleString()}`
    });
  }

  if (inputs.downPayment !== undefined && (inputs.downPayment < rules.downPayment.min || inputs.downPayment > rules.downPayment.max)) {
    errors.push({
      field: 'downPayment',
      message: `Down payment must be between $${rules.downPayment.min.toLocaleString()} and $${rules.downPayment.max.toLocaleString()}`
    });
  }

  if (!inputs.interestRate || inputs.interestRate < rules.interestRate.min || inputs.interestRate > rules.interestRate.max) {
    errors.push({
      field: 'interestRate',
      message: `Interest rate must be between ${rules.interestRate.min}% and ${rules.interestRate.max}%`
    });
  }

  if (!inputs.loanTermYears || inputs.loanTermYears < rules.loanTermYears.min || inputs.loanTermYears > rules.loanTermYears.max) {
    errors.push({
      field: 'loanTermYears',
      message: `Loan term must be between ${rules.loanTermYears.min} and ${rules.loanTermYears.max} years`
    });
  }

  if (inputs.propertyTax !== undefined && (inputs.propertyTax < rules.propertyTax.min || inputs.propertyTax > rules.propertyTax.max)) {
    errors.push({
      field: 'propertyTax',
      message: `Property tax must be between $${rules.propertyTax.min.toLocaleString()} and $${rules.propertyTax.max.toLocaleString()}`
    });
  }

  if (inputs.homeInsurance !== undefined && (inputs.homeInsurance < rules.homeInsurance.min || inputs.homeInsurance > rules.homeInsurance.max)) {
    errors.push({
      field: 'homeInsurance',
      message: `Home insurance must be between $${rules.homeInsurance.min.toLocaleString()} and $${rules.homeInsurance.max.toLocaleString()}`
    });
  }

  if (inputs.pmiRate !== undefined && (inputs.pmiRate < rules.pmiRate.min || inputs.pmiRate > rules.pmiRate.max)) {
    errors.push({
      field: 'pmiRate',
      message: `PMI rate must be between ${rules.pmiRate.min}% and ${rules.pmiRate.max}%`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateCreditCard(card: Partial<CreditCard>): FormValidation {
  const errors: ValidationError[] = [];
  const rules = ValidationRules.creditCard;

  if (!card.name || card.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Card name is required'
    });
  }

  if (card.balance !== undefined && (card.balance < rules.balance.min || card.balance > rules.balance.max)) {
    errors.push({
      field: 'balance',
      message: `Balance must be between $${rules.balance.min.toLocaleString()} and $${rules.balance.max.toLocaleString()}`
    });
  }

  if (!card.creditLimit || card.creditLimit < rules.creditLimit.min || card.creditLimit > rules.creditLimit.max) {
    errors.push({
      field: 'creditLimit',
      message: `Credit limit must be between $${rules.creditLimit.min.toLocaleString()} and $${rules.creditLimit.max.toLocaleString()}`
    });
  }

  if (card.minimumPayment !== undefined && (card.minimumPayment < rules.minimumPayment.min || card.minimumPayment > rules.minimumPayment.max)) {
    errors.push({
      field: 'minimumPayment',
      message: `Minimum payment must be between $${rules.minimumPayment.min.toLocaleString()} and $${rules.minimumPayment.max.toLocaleString()}`
    });
  }

  if (!card.interestRate || card.interestRate < rules.interestRate.min || card.interestRate > rules.interestRate.max) {
    errors.push({
      field: 'interestRate',
      message: `Interest rate must be between ${rules.interestRate.min}% and ${rules.interestRate.max}%`
    });
  }

  if (!card.dueDate) {
    errors.push({
      field: 'dueDate',
      message: 'Due date is required'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateExpense(expense: Partial<Expense>): FormValidation {
  const errors: ValidationError[] = [];
  const rules = ValidationRules.expense;

  if (!expense.amount || expense.amount < rules.amount.min || expense.amount > rules.amount.max) {
    errors.push({
      field: 'amount',
      message: `Amount must be between $${rules.amount.min} and $${rules.amount.max.toLocaleString()}`
    });
  }

  if (!expense.category || expense.category.trim().length === 0) {
    errors.push({
      field: 'category',
      message: 'Category is required'
    });
  }

  if (!expense.description || expense.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: 'Description is required'
    });
  }

  if (!expense.date) {
    errors.push({
      field: 'date',
      message: 'Date is required'
    });
  }

  if (!expense.paymentMethod || expense.paymentMethod.trim().length === 0) {
    errors.push({
      field: 'paymentMethod',
      message: 'Payment method is required'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateBudget(budget: Partial<Budget>): FormValidation {
  const errors: ValidationError[] = [];
  const rules = ValidationRules.budget;

  if (!budget.category || budget.category.trim().length === 0) {
    errors.push({
      field: 'category',
      message: 'Category is required'
    });
  }

  if (!budget.budgetAmount || budget.budgetAmount < rules.budgetAmount.min || budget.budgetAmount > rules.budgetAmount.max) {
    errors.push({
      field: 'budgetAmount',
      message: `Budget amount must be between $${rules.budgetAmount.min} and $${rules.budgetAmount.max.toLocaleString()}`
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateHolding(holding: Partial<Holding>): FormValidation {
  const errors: ValidationError[] = [];
  const rules = ValidationRules.holding;

  if (!holding.symbol || holding.symbol.trim().length === 0) {
    errors.push({
      field: 'symbol',
      message: 'Symbol is required'
    });
  }

  if (!holding.quantity || holding.quantity < rules.quantity.min || holding.quantity > rules.quantity.max) {
    errors.push({
      field: 'quantity',
      message: `Quantity must be between ${rules.quantity.min} and ${rules.quantity.max.toLocaleString()}`
    });
  }

  if (!holding.purchasePrice || holding.purchasePrice < rules.purchasePrice.min || holding.purchasePrice > rules.purchasePrice.max) {
    errors.push({
      field: 'purchasePrice',
      message: `Purchase price must be between $${rules.purchasePrice.min} and $${rules.purchasePrice.max.toLocaleString()}`
    });
  }

  if (!holding.purchaseDate) {
    errors.push({
      field: 'purchaseDate',
      message: 'Purchase date is required'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generic validation helper
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}