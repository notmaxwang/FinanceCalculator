// Mortgage calculator store

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storageService } from '@/services/storage';
import { calculateMortgage, generateAmortizationSchedule } from '@/utils/mortgage-calculations';
import { validateMortgageInputs } from '@/utils/validation';
import type { 
  MortgageInputs, 
  MortgageResults, 
  MortgageCalculation, 
  AmortizationEntry,
  ValidationError,
  LoadingState 
} from '@/types';

export const useMortgageStore = defineStore('mortgage', () => {
  // State
  const currentInputs = ref<MortgageInputs>({
    loanAmount: 300000,
    downPayment: 60000,
    interestRate: 4.5,
    loanTermYears: 30,
    propertyTax: 6000,
    homeInsurance: 1200,
    pmiRate: 0.5
  });

  const currentResults = ref<MortgageResults | null>(null);
  const savedCalculations = ref<MortgageCalculation[]>([]);
  const amortizationSchedule = ref<AmortizationEntry[]>([]);
  const validationErrors = ref<ValidationError[]>([]);
  const loadingState = ref<LoadingState>('idle');

  // Getters
  const isValidInputs = computed(() => {
    const validation = validateMortgageInputs(currentInputs.value);
    validationErrors.value = validation.errors;
    return validation.isValid;
  });

  const hasResults = computed(() => currentResults.value !== null);

  const totalMonthlyPayment = computed(() => 
    currentResults.value?.totalMonthlyPayment || 0
  );

  const loanToValueRatio = computed(() => {
    const { loanAmount, downPayment } = currentInputs.value;
    if (loanAmount <= 0) return 0;
    return ((loanAmount - downPayment) / loanAmount) * 100;
  });

  const downPaymentPercentage = computed(() => {
    const { loanAmount, downPayment } = currentInputs.value;
    if (loanAmount <= 0) return 0;
    return (downPayment / loanAmount) * 100;
  });

  const needsPMI = computed(() => downPaymentPercentage.value < 20);

  // Actions
  function updateInputs(inputs: Partial<MortgageInputs>) {
    currentInputs.value = { ...currentInputs.value, ...inputs };
    
    // Auto-calculate if inputs are valid
    if (isValidInputs.value) {
      calculateResults();
    }
  }

  function calculateResults() {
    if (!isValidInputs.value) {
      currentResults.value = null;
      return false;
    }

    try {
      setLoadingState('loading');
      currentResults.value = calculateMortgage(currentInputs.value);
      setLoadingState('success');
      return true;
    } catch (error) {
      console.error('Failed to calculate mortgage:', error);
      currentResults.value = null;
      setLoadingState('error');
      return false;
    }
  }

  function generateAmortization() {
    if (!currentResults.value) return false;

    try {
      setLoadingState('loading');
      const { loanAmount, downPayment, interestRate, loanTermYears } = currentInputs.value;
      const principal = loanAmount - downPayment;
      
      amortizationSchedule.value = generateAmortizationSchedule(
        principal,
        interestRate,
        loanTermYears
      );
      
      setLoadingState('success');
      return true;
    } catch (error) {
      console.error('Failed to generate amortization schedule:', error);
      setLoadingState('error');
      return false;
    }
  }

  function saveCalculation(name?: string): string | null {
    if (!currentResults.value || !isValidInputs.value) {
      return null;
    }

    const calculation: MortgageCalculation = {
      id: `mortgage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      inputs: { ...currentInputs.value },
      results: { ...currentResults.value },
      createdAt: new Date(),
      name: name || `Calculation ${savedCalculations.value.length + 1}`
    };

    savedCalculations.value.unshift(calculation);
    saveMortgageData();
    
    return calculation.id;
  }

  function loadCalculation(id: string): boolean {
    const calculation = savedCalculations.value.find(c => c.id === id);
    if (!calculation) return false;

    currentInputs.value = { ...calculation.inputs };
    currentResults.value = { ...calculation.results };
    
    return true;
  }

  function deleteCalculation(id: string): boolean {
    const index = savedCalculations.value.findIndex(c => c.id === id);
    if (index === -1) return false;

    savedCalculations.value.splice(index, 1);
    saveMortgageData();
    
    return true;
  }

  function updateCalculationName(id: string, name: string): boolean {
    const calculation = savedCalculations.value.find(c => c.id === id);
    if (!calculation) return false;

    calculation.name = name;
    saveMortgageData();
    
    return true;
  }

  function clearCurrentCalculation() {
    currentResults.value = null;
    amortizationSchedule.value = [];
    validationErrors.value = [];
  }

  function resetInputs() {
    currentInputs.value = {
      loanAmount: 300000,
      downPayment: 60000,
      interestRate: 4.5,
      loanTermYears: 30,
      propertyTax: 6000,
      homeInsurance: 1200,
      pmiRate: 0.5
    };
    clearCurrentCalculation();
  }

  function setLoadingState(state: LoadingState) {
    loadingState.value = state;
  }

  function saveMortgageData(): boolean {
    return storageService.setItem('mortgageCalculations', savedCalculations.value, true);
  }

  function loadMortgageData(): boolean {
    try {
      const stored = storageService.getItem<MortgageCalculation[]>('mortgageCalculations', [], true);
      
      if (Array.isArray(stored)) {
        // Validate and convert dates
        savedCalculations.value = stored.map(calc => ({
          ...calc,
          createdAt: new Date(calc.createdAt)
        }));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to load mortgage data:', error);
      return false;
    }
  }

  function exportMortgageData(): string | null {
    try {
      return JSON.stringify({
        version: '1.0',
        timestamp: new Date().toISOString(),
        calculations: savedCalculations.value,
        currentInputs: currentInputs.value,
        currentResults: currentResults.value
      });
    } catch (error) {
      console.error('Failed to export mortgage data:', error);
      return null;
    }
  }

  function importMortgageData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.calculations && Array.isArray(parsed.calculations)) {
        savedCalculations.value = parsed.calculations.map((calc: any) => ({
          ...calc,
          createdAt: new Date(calc.createdAt)
        }));
      }
      
      if (parsed.currentInputs) {
        currentInputs.value = parsed.currentInputs;
      }
      
      if (parsed.currentResults) {
        currentResults.value = parsed.currentResults;
      }
      
      saveMortgageData();
      return true;
    } catch (error) {
      console.error('Failed to import mortgage data:', error);
      return false;
    }
  }

  // Initialize store
  function initialize() {
    loadMortgageData();
    
    // Calculate initial results if inputs are valid
    if (isValidInputs.value) {
      calculateResults();
    }
  }

  return {
    // State
    currentInputs,
    currentResults,
    savedCalculations,
    amortizationSchedule,
    validationErrors,
    loadingState,
    
    // Getters
    isValidInputs,
    hasResults,
    totalMonthlyPayment,
    loanToValueRatio,
    downPaymentPercentage,
    needsPMI,
    
    // Actions
    updateInputs,
    calculateResults,
    generateAmortization,
    saveCalculation,
    loadCalculation,
    deleteCalculation,
    updateCalculationName,
    clearCurrentCalculation,
    resetInputs,
    setLoadingState,
    saveMortgageData,
    loadMortgageData,
    exportMortgageData,
    importMortgageData,
    initialize
  };
});