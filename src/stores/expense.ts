// Expense tracking store

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storageService } from '@/services/storage';
import { 
  calculateMonthlyInterest,
  calculatePayoffTime,
  calculateCreditUtilization,
  calculateTotalCreditUtilization,
  calculateOptimalPaymentDistribution
} from '@/utils/credit-calculations';
import { validateCreditCard, validateExpense, validateBudget } from '@/utils/validation';
import type { 
  CreditCard, 
  Expense, 
  Budget, 
  SpendingPattern,
  CreditCardRecommendation,
  ExpenseCategory,
  PaymentMethod,
  ValidationError,
  LoadingState 
} from '@/types';

export const useExpenseStore = defineStore('expense', () => {
  // State
  const creditCards = ref<CreditCard[]>([]);
  const expenses = ref<Expense[]>([]);
  const budgets = ref<Budget[]>([]);
  const spendingAnalysis = ref<SpendingPattern[]>([]);
  const creditCardRecommendations = ref<CreditCardRecommendation[]>([]);
  const loadingState = ref<LoadingState>('idle');

  // Getters
  const totalCreditCardBalance = computed(() => 
    creditCards.value.reduce((sum, card) => sum + card.balance, 0)
  );

  const totalCreditLimit = computed(() => 
    creditCards.value.reduce((sum, card) => sum + card.creditLimit, 0)
  );

  const totalCreditUtilization = computed(() => 
    calculateTotalCreditUtilization(creditCards.value)
  );

  const totalMinimumPayments = computed(() => 
    creditCards.value.reduce((sum, card) => sum + card.minimumPayment, 0)
  );

  const totalMonthlyInterest = computed(() => 
    creditCards.value.reduce((sum, card) => 
      sum + calculateMonthlyInterest(card.balance, card.interestRate), 0
    )
  );

  const upcomingPayments = computed(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return creditCards.value
      .filter(card => card.dueDate <= nextWeek && card.balance > 0)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  });

  const monthlyExpensesByCategory = computed(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.value.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });

    const categoryTotals: Record<string, number> = {};
    monthlyExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return categoryTotals;
  });

  const budgetStatus = computed(() => {
    const categorySpending = monthlyExpensesByCategory.value;
    
    return budgets.value.map(budget => ({
      ...budget,
      spentAmount: categorySpending[budget.category] || 0,
      remaining: budget.budgetAmount - (categorySpending[budget.category] || 0),
      percentageUsed: budget.budgetAmount > 0 
        ? ((categorySpending[budget.category] || 0) / budget.budgetAmount) * 100 
        : 0,
      isOverBudget: (categorySpending[budget.category] || 0) > budget.budgetAmount
    }));
  });

  const totalBudgetAmount = computed(() => 
    budgets.value.reduce((sum, budget) => sum + budget.budgetAmount, 0)
  );

  const totalSpentAmount = computed(() => 
    Object.values(monthlyExpensesByCategory.value).reduce((sum, amount) => sum + amount, 0)
  );

  // Actions
  function addCreditCard(cardData: Omit<CreditCard, 'id' | 'paymentHistory'>): string | null {
    const validation = validateCreditCard(cardData);
    if (!validation.isValid) {
      console.error('Invalid credit card data:', validation.errors);
      return null;
    }

    const newCard: CreditCard = {
      ...cardData,
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentHistory: []
    };

    creditCards.value.push(newCard);
    saveExpenseData();
    
    return newCard.id;
  }

  function updateCreditCard(id: string, updates: Partial<CreditCard>): boolean {
    const cardIndex = creditCards.value.findIndex(card => card.id === id);
    if (cardIndex === -1) return false;

    const updatedCard = { ...creditCards.value[cardIndex], ...updates };
    const validation = validateCreditCard(updatedCard);
    
    if (!validation.isValid) {
      console.error('Invalid credit card updates:', validation.errors);
      return false;
    }

    creditCards.value[cardIndex] = updatedCard;
    saveExpenseData();
    
    return true;
  }

  function deleteCreditCard(id: string): boolean {
    const cardIndex = creditCards.value.findIndex(card => card.id === id);
    if (cardIndex === -1) return false;

    creditCards.value.splice(cardIndex, 1);
    saveExpenseData();
    
    return true;
  }

  function makePayment(cardId: string, amount: number): boolean {
    const card = creditCards.value.find(c => c.id === cardId);
    if (!card || amount <= 0) return false;

    const interestCharged = calculateMonthlyInterest(card.balance, card.interestRate);
    const principalPaid = Math.min(amount - interestCharged, card.balance);
    
    if (principalPaid <= 0) return false;

    // Update card balance
    card.balance = Math.max(0, card.balance - principalPaid);
    
    // Add to payment history
    card.paymentHistory.unshift({
      date: new Date(),
      amount,
      interestCharged,
      principalPaid,
      remainingBalance: card.balance
    });

    // Update total interest paid
    card.totalInterestPaid = (card.totalInterestPaid || 0) + interestCharged;

    // Update due date (next month)
    const nextDueDate = new Date(card.dueDate);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    card.dueDate = nextDueDate;

    saveExpenseData();
    return true;
  }

  function addExpense(expenseData: Omit<Expense, 'id'>): string | null {
    const validation = validateExpense(expenseData);
    if (!validation.isValid) {
      console.error('Invalid expense data:', validation.errors);
      return null;
    }

    const newExpense: Expense = {
      ...expenseData,
      id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    expenses.value.unshift(newExpense);
    updateSpendingAnalysis();
    saveExpenseData();
    
    return newExpense.id;
  }

  function updateExpense(id: string, updates: Partial<Expense>): boolean {
    const expenseIndex = expenses.value.findIndex(expense => expense.id === id);
    if (expenseIndex === -1) return false;

    const updatedExpense = { ...expenses.value[expenseIndex], ...updates };
    const validation = validateExpense(updatedExpense);
    
    if (!validation.isValid) {
      console.error('Invalid expense updates:', validation.errors);
      return false;
    }

    expenses.value[expenseIndex] = updatedExpense;
    updateSpendingAnalysis();
    saveExpenseData();
    
    return true;
  }

  function deleteExpense(id: string): boolean {
    const expenseIndex = expenses.value.findIndex(expense => expense.id === id);
    if (expenseIndex === -1) return false;

    expenses.value.splice(expenseIndex, 1);
    updateSpendingAnalysis();
    saveExpenseData();
    
    return true;
  }

  function setBudget(category: string, amount: number): boolean {
    const budgetData = { category, budgetAmount: amount };
    const validation = validateBudget(budgetData);
    
    if (!validation.isValid) {
      console.error('Invalid budget data:', validation.errors);
      return false;
    }

    const existingBudgetIndex = budgets.value.findIndex(b => b.category === category);
    
    if (existingBudgetIndex > -1) {
      budgets.value[existingBudgetIndex].budgetAmount = amount;
    } else {
      budgets.value.push({
        category,
        budgetAmount: amount,
        spentAmount: monthlyExpensesByCategory.value[category] || 0,
        remaining: amount - (monthlyExpensesByCategory.value[category] || 0)
      });
    }

    saveExpenseData();
    return true;
  }

  function deleteBudget(category: string): boolean {
    const budgetIndex = budgets.value.findIndex(b => b.category === category);
    if (budgetIndex === -1) return false;

    budgets.value.splice(budgetIndex, 1);
    saveExpenseData();
    
    return true;
  }

  function updateSpendingAnalysis() {
    const categoryTotals: Record<string, { total: number; count: number; months: Set<string> }> = {};
    
    expenses.value.forEach(expense => {
      const monthKey = `${expense.date.getFullYear()}-${expense.date.getMonth()}`;
      
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = { total: 0, count: 0, months: new Set() };
      }
      
      categoryTotals[expense.category].total += expense.amount;
      categoryTotals[expense.category].count += 1;
      categoryTotals[expense.category].months.add(monthKey);
    });

    const totalSpending = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);

    spendingAnalysis.value = Object.entries(categoryTotals).map(([category, data]) => {
      const monthCount = Math.max(data.months.size, 1);
      return {
        category,
        monthlyAverage: data.total / monthCount,
        percentage: totalSpending > 0 ? (data.total / totalSpending) * 100 : 0,
        trend: 'stable' as const // TODO: Implement trend calculation
      };
    });
  }

  function calculateOptimalPayments(totalBudget: number, strategy: 'avalanche' | 'snowball' = 'avalanche') {
    return calculateOptimalPaymentDistribution(creditCards.value, totalBudget, strategy);
  }

  function getPayoffProjection(cardId: string, monthlyPayment: number) {
    const card = creditCards.value.find(c => c.id === cardId);
    if (!card) return null;

    return calculatePayoffTime(card.balance, card.interestRate, monthlyPayment);
  }

  function setLoadingState(state: LoadingState) {
    loadingState.value = state;
  }

  function saveExpenseData(): boolean {
    const success = storageService.setItem('creditCards', creditCards.value, true) &&
                   storageService.setItem('expenses', expenses.value, true) &&
                   storageService.setItem('budgets', budgets.value, true) &&
                   storageService.setItem('spendingAnalysis', spendingAnalysis.value, true);
    
    return success;
  }

  function loadExpenseData(): boolean {
    try {
      const storedCards = storageService.getItem<CreditCard[]>('creditCards', [], true);
      const storedExpenses = storageService.getItem<Expense[]>('expenses', [], true);
      const storedBudgets = storageService.getItem<Budget[]>('budgets', [], true);
      const storedAnalysis = storageService.getItem<SpendingPattern[]>('spendingAnalysis', [], true);

      if (Array.isArray(storedCards)) {
        creditCards.value = storedCards.map(card => ({
          ...card,
          dueDate: new Date(card.dueDate),
          paymentHistory: card.paymentHistory.map(payment => ({
            ...payment,
            date: new Date(payment.date)
          }))
        }));
      }

      if (Array.isArray(storedExpenses)) {
        expenses.value = storedExpenses.map(expense => ({
          ...expense,
          date: new Date(expense.date)
        }));
      }

      if (Array.isArray(storedBudgets)) {
        budgets.value = storedBudgets;
      }

      if (Array.isArray(storedAnalysis)) {
        spendingAnalysis.value = storedAnalysis;
      }

      return true;
    } catch (error) {
      console.error('Failed to load expense data:', error);
      return false;
    }
  }

  // Initialize store
  function initialize() {
    loadExpenseData();
    updateSpendingAnalysis();
  }

  return {
    // State
    creditCards,
    expenses,
    budgets,
    spendingAnalysis,
    creditCardRecommendations,
    loadingState,
    
    // Getters
    totalCreditCardBalance,
    totalCreditLimit,
    totalCreditUtilization,
    totalMinimumPayments,
    totalMonthlyInterest,
    upcomingPayments,
    monthlyExpensesByCategory,
    budgetStatus,
    totalBudgetAmount,
    totalSpentAmount,
    
    // Actions
    addCreditCard,
    updateCreditCard,
    deleteCreditCard,
    makePayment,
    addExpense,
    updateExpense,
    deleteExpense,
    setBudget,
    deleteBudget,
    updateSpendingAnalysis,
    calculateOptimalPayments,
    getPayoffProjection,
    setLoadingState,
    saveExpenseData,
    loadExpenseData,
    initialize
  };
});