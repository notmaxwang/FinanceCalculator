<template>
  <div class="mortgage-input-form">
    <div class="form-header">
      <h2>Mortgage Calculator</h2>
      <p>Calculate your monthly mortgage payment and see the breakdown</p>
    </div>

    <form @submit.prevent="handleSubmit" class="mortgage-form">
      <div class="form-row">
        <CurrencyInput
          v-model="localInputs.loanAmount"
          label="Home Price"
          placeholder="Enter home price"
          :error="getFieldError('loanAmount')"
          :min="1000"
          :max="10000000"
          @update:modelValue="handleInputChange"
        />
        
        <CurrencyInput
          v-model="localInputs.downPayment"
          label="Down Payment"
          placeholder="Enter down payment"
          :error="getFieldError('downPayment')"
          :min="0"
          :max="localInputs.loanAmount"
          @update:modelValue="handleInputChange"
        />
      </div>

      <div class="form-row">
        <PercentageInput
          v-model="localInputs.interestRate"
          label="Interest Rate"
          placeholder="Enter interest rate"
          :error="getFieldError('interestRate')"
          :min="0.01"
          :max="30"
          :decimals="3"
          @update:modelValue="handleInputChange"
        />
        
        <div class="form-group">
          <label for="loanTerm">Loan Term</label>
          <select
            id="loanTerm"
            v-model="localInputs.loanTermYears"
            :class="{ error: !!getFieldError('loanTermYears') }"
            @change="handleInputChange"
          >
            <option value="15">15 years</option>
            <option value="20">20 years</option>
            <option value="25">25 years</option>
            <option value="30">30 years</option>
          </select>
          <div v-if="getFieldError('loanTermYears')" class="error-message">
            {{ getFieldError('loanTermYears') }}
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Additional Costs</h3>
        <div class="form-row">
          <CurrencyInput
            v-model="localInputs.propertyTax"
            label="Annual Property Tax"
            placeholder="Enter annual property tax"
            :error="getFieldError('propertyTax')"
            :min="0"
            :max="100000"
            @update:modelValue="handleInputChange"
          />
          
          <CurrencyInput
            v-model="localInputs.homeInsurance"
            label="Annual Home Insurance"
            placeholder="Enter annual insurance"
            :error="getFieldError('homeInsurance')"
            :min="0"
            :max="50000"
            @update:modelValue="handleInputChange"
          />
        </div>

        <div class="form-row" v-if="needsPMI">
          <PercentageInput
            v-model="localInputs.pmiRate!"
            label="PMI Rate (Annual)"
            placeholder="Enter PMI rate"
            :error="getFieldError('pmiRate')"
            :min="0"
            :max="5"
            :decimals="2"
            @update:modelValue="handleInputChange"
          />
          
          <div class="pmi-info">
            <div class="info-card">
              <h4>PMI Required</h4>
              <p>Down payment is less than 20%. Private Mortgage Insurance (PMI) is required.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="form-summary">
        <div class="summary-item">
          <span class="label">Loan Amount:</span>
          <span class="value">{{ formatCurrency(actualLoanAmount) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Down Payment:</span>
          <span class="value">{{ downPaymentPercentage.toFixed(1) }}%</span>
        </div>
        <div class="summary-item">
          <span class="label">Loan-to-Value:</span>
          <span class="value">{{ loanToValueRatio.toFixed(1) }}%</span>
        </div>
      </div>

      <div class="form-actions">
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="loading || !isValid"
        >
          <span v-if="loading">Calculating...</span>
          <span v-else>Calculate Payment</span>
        </button>
        
        <button 
          type="button" 
          class="btn btn-outline"
          @click="handleReset"
        >
          Reset
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { formatCurrency } from '@/utils/currency';
import CurrencyInput from '@/components/shared/CurrencyInput.vue';
import PercentageInput from '@/components/shared/PercentageInput.vue';
import type { MortgageInputFormProps } from '@/types';

const props = withDefaults(defineProps<MortgageInputFormProps>(), {
  loading: false,
  errors: () => []
});

const emit = defineEmits<{
  'update:modelValue': [value: typeof props.modelValue];
  submit: [value: typeof props.modelValue];
  reset: [];
}>();

// Local state for form inputs
const localInputs = ref({ ...props.modelValue });

// Computed properties
const actualLoanAmount = computed(() => 
  localInputs.value.loanAmount - localInputs.value.downPayment
);

const downPaymentPercentage = computed(() => {
  if (localInputs.value.loanAmount <= 0) return 0;
  return (localInputs.value.downPayment / localInputs.value.loanAmount) * 100;
});

const loanToValueRatio = computed(() => {
  if (localInputs.value.loanAmount <= 0) return 0;
  return (actualLoanAmount.value / localInputs.value.loanAmount) * 100;
});

const needsPMI = computed(() => downPaymentPercentage.value < 20);

const isValid = computed(() => {
  return props.errors.length === 0 && 
         localInputs.value.loanAmount > 0 && 
         localInputs.value.interestRate > 0 && 
         localInputs.value.loanTermYears > 0;
});

// Helper function to get field-specific errors
function getFieldError(fieldName: string): string | undefined {
  const error = props.errors.find(err => err.field === fieldName);
  return error?.message;
}

// Event handlers
function handleInputChange() {
  emit('update:modelValue', { ...localInputs.value });
}

function handleSubmit() {
  if (isValid.value) {
    emit('submit', { ...localInputs.value });
  }
}

function handleReset() {
  localInputs.value = {
    loanAmount: 300000,
    downPayment: 60000,
    interestRate: 4.5,
    loanTermYears: 30,
    propertyTax: 6000,
    homeInsurance: 1200,
    pmiRate: 0.5
  };
  emit('reset');
  handleInputChange();
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  localInputs.value = { ...newValue };
}, { deep: true });

// Set default PMI rate when PMI is needed
watch(needsPMI, (isPMINeeded) => {
  if (isPMINeeded && localInputs.value.pmiRate === 0) {
    localInputs.value.pmiRate = 0.5;
    handleInputChange();
  }
});
</script>

<style scoped lang="scss">
.mortgage-input-form {
  max-width: 800px;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;

  h2 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 2rem;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 1.1rem;
  }
}

.mortgage-form {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 2rem;
  box-shadow: var(--shadow);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.form-section {
  margin: 2rem 0;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);

  h3 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }
}

.pmi-info {
  display: flex;
  align-items: center;

  .info-card {
    background: var(--warning-color);
    color: white;
    padding: 1rem;
    border-radius: var(--border-radius);
    font-size: 0.875rem;

    h4 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
    }

    p {
      margin: 0;
      line-height: 1.4;
    }
  }
}

.form-summary {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin: 2rem 0;

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--border-color);
    }

    .label {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .value {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 1.1rem;
    }
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }

  .btn {
    min-width: 150px;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;

    @media (max-width: 768px) {
      min-width: auto;
    }
  }
}

// Dark theme adjustments
[data-theme="dark"] {
  .info-card {
    background: var(--warning-color);
    opacity: 0.9;
  }
}
</style>