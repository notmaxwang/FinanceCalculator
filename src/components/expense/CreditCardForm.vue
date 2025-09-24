<template>
  <div class="credit-card-form">
    <div class="form-header">
      <h3>{{ isEditing ? 'Edit Credit Card' : 'Add Credit Card' }}</h3>
      <p>{{ isEditing ? 'Update your credit card information' : 'Add a new credit card to track payments and interest' }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="card-form">
      <div class="form-row">
        <div class="form-group">
          <label for="cardName">Card Name *</label>
          <input
            id="cardName"
            v-model="localCard.name"
            type="text"
            placeholder="e.g., Chase Freedom, Capital One Venture"
            :class="{ error: !!getFieldError('name') }"
            required
          />
          <div v-if="getFieldError('name')" class="error-message">
            {{ getFieldError('name') }}
          </div>
        </div>
      </div>

      <div class="form-row">
        <CurrencyInput
          v-model="localCard.balance!"
          label="Current Balance"
          placeholder="Enter current balance"
          :error="getFieldError('balance')"
          :min="0"
          :max="1000000"
        />
        
        <CurrencyInput
          v-model="localCard.creditLimit!"
          label="Credit Limit *"
          placeholder="Enter credit limit"
          :error="getFieldError('creditLimit')"
          :min="100"
          :max="1000000"
        />
      </div>

      <div class="form-row">
        <PercentageInput
          v-model="localCard.interestRate!"
          label="Annual Interest Rate (APR) *"
          placeholder="Enter APR"
          :error="getFieldError('interestRate')"
          :min="0"
          :max="50"
          :decimals="2"
        />
        
        <CurrencyInput
          v-model="localCard.minimumPayment!"
          label="Minimum Payment"
          placeholder="Enter minimum payment"
          :error="getFieldError('minimumPayment')"
          :min="0"
          :max="100000"
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="dueDate">Payment Due Date *</label>
          <input
            id="dueDate"
            v-model="dueDateString"
            type="date"
            :class="{ error: !!getFieldError('dueDate') }"
            required
          />
          <div v-if="getFieldError('dueDate')" class="error-message">
            {{ getFieldError('dueDate') }}
          </div>
        </div>
        
        <div class="utilization-display">
          <div class="utilization-info">
            <span class="label">Credit Utilization:</span>
            <span class="value" :class="utilizationClass">{{ utilizationPercentage.toFixed(1) }}%</span>
          </div>
          <ProgressBar
            :value="localCard.balance || 0"
            :max="localCard.creditLimit || 1"
            :color="utilizationColor"
            size="sm"
          />
          <div class="utilization-tip">
            <small>{{ utilizationTip }}</small>
          </div>
        </div>
      </div>

      <div class="interest-preview" v-if="(localCard.balance || 0) > 0 && (localCard.interestRate || 0) > 0">
        <h4>Interest Preview</h4>
        <div class="preview-grid">
          <div class="preview-item">
            <span class="label">Monthly Interest:</span>
            <span class="value">{{ formatCurrency(monthlyInterest) }}</span>
          </div>
          <div class="preview-item">
            <span class="label">Payoff Time (Min. Payment):</span>
            <span class="value">{{ payoffTimeText }}</span>
          </div>
          <div class="preview-item">
            <span class="label">Total Interest (Min. Payment):</span>
            <span class="value">{{ formatCurrency(totalInterestMinPayment) }}</span>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="loading || !isFormValid"
        >
          <span v-if="loading">{{ isEditing ? 'Updating...' : 'Adding...' }}</span>
          <span v-else>{{ isEditing ? 'Update Card' : 'Add Card' }}</span>
        </button>
        
        <button 
          type="button" 
          class="btn btn-outline"
          @click="handleCancel"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { formatCurrency } from '@/utils/currency';
import { calculateMonthlyInterest, calculatePayoffTime } from '@/utils/credit-calculations';
import CurrencyInput from '@/components/shared/CurrencyInput.vue';
import PercentageInput from '@/components/shared/PercentageInput.vue';
import ProgressBar from '@/components/shared/ProgressBar.vue';
import type { CreditCard, ValidationError } from '@/types';

interface Props {
  modelValue?: Partial<CreditCard>;
  loading?: boolean;
  errors?: ValidationError[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  errors: () => []
});

const emit = defineEmits<{
  submit: [card: Omit<CreditCard, 'id' | 'paymentHistory'>];
  cancel: [];
}>();

// Local state
const localCard = ref<Partial<CreditCard>>({
  name: '',
  balance: 0,
  creditLimit: 0,
  interestRate: 0,
  minimumPayment: 0,
  dueDate: new Date(),
  ...props.modelValue
});

const dueDateString = ref('');

// Computed properties
const isEditing = computed(() => !!props.modelValue?.id);

const utilizationPercentage = computed(() => {
  const balance = localCard.value.balance || 0;
  const creditLimit = localCard.value.creditLimit || 0;
  if (creditLimit === 0) return 0;
  return (balance / creditLimit) * 100;
});

const utilizationClass = computed(() => {
  const percentage = utilizationPercentage.value;
  if (percentage > 90) return 'danger';
  if (percentage > 70) return 'warning';
  if (percentage > 30) return 'caution';
  return 'good';
});

const utilizationColor = computed(() => {
  const percentage = utilizationPercentage.value;
  if (percentage > 90) return 'danger';
  if (percentage > 70) return 'warning';
  if (percentage > 30) return 'secondary';
  return 'success';
});

const utilizationTip = computed(() => {
  const percentage = utilizationPercentage.value;
  if (percentage > 90) return 'Very high utilization may hurt your credit score';
  if (percentage > 70) return 'High utilization - consider paying down balance';
  if (percentage > 30) return 'Moderate utilization - aim for under 30%';
  return 'Good utilization - keep it under 30%';
});

const monthlyInterest = computed(() => {
  const balance = localCard.value.balance || 0;
  const interestRate = localCard.value.interestRate || 0;
  if (balance === 0 || interestRate === 0) return 0;
  return calculateMonthlyInterest(balance, interestRate);
});

const payoffInfo = computed(() => {
  const balance = localCard.value.balance || 0;
  const interestRate = localCard.value.interestRate || 0;
  const minimumPayment = localCard.value.minimumPayment || 0;
  
  if (balance === 0 || interestRate === 0 || minimumPayment === 0) {
    return { months: 0, totalInterest: 0, totalPaid: 0 };
  }
  return calculatePayoffTime(balance, interestRate, minimumPayment);
});

const payoffTimeText = computed(() => {
  const months = payoffInfo.value.months;
  if (months === 0 || months === Infinity) return 'Never (payment too low)';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) return `${months} months`;
  if (remainingMonths === 0) return `${years} years`;
  return `${years} years, ${remainingMonths} months`;
});

const totalInterestMinPayment = computed(() => payoffInfo.value.totalInterest);

const isFormValid = computed(() => {
  return props.errors.length === 0 && 
         localCard.value.name && 
         (localCard.value.creditLimit || 0) > 0 && 
         (localCard.value.interestRate || 0) >= 0 && 
         localCard.value.dueDate;
});

// Helper functions
function getFieldError(fieldName: string): string | undefined {
  const error = props.errors.find(err => err.field === fieldName);
  return error?.message;
}

function handleSubmit() {
  if (isFormValid.value) {
    emit('submit', {
      name: localCard.value.name!,
      balance: localCard.value.balance || 0,
      creditLimit: localCard.value.creditLimit!,
      interestRate: localCard.value.interestRate!,
      minimumPayment: localCard.value.minimumPayment || 0,
      dueDate: localCard.value.dueDate!
    });
  }
}

function handleCancel() {
  emit('cancel');
}

// Watch for changes to update due date string
watch(() => localCard.value.dueDate, (newDate) => {
  if (newDate) {
    dueDateString.value = newDate.toISOString().split('T')[0];
  }
}, { immediate: true });

watch(dueDateString, (newDateString) => {
  if (newDateString) {
    localCard.value.dueDate = new Date(newDateString);
  }
});

// Auto-calculate minimum payment if not provided
watch([() => localCard.value.balance, () => localCard.value.creditLimit], () => {
  const balance = localCard.value.balance || 0;
  const minimumPayment = localCard.value.minimumPayment || 0;
  
  if (minimumPayment === 0 && balance > 0) {
    // Typical minimum payment is 2% of balance or $25, whichever is higher
    const calculatedMin = Math.max(balance * 0.02, 25);
    localCard.value.minimumPayment = Math.round(calculatedMin);
  }
});

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    localCard.value = { ...newValue };
  }
}, { deep: true });
</script>

<style scoped lang="scss">
.credit-card-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;

  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 1rem;
  }
}

.card-form {
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

  &:last-of-type {
    margin-bottom: 2rem;
  }
}

.utilization-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .utilization-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;

    .label {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .value {
      font-weight: 600;

      &.good {
        color: var(--success-color);
      }

      &.caution {
        color: var(--secondary-color);
      }

      &.warning {
        color: var(--warning-color);
      }

      &.danger {
        color: var(--danger-color);
      }
    }
  }

  .utilization-tip {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-align: center;
  }
}

.interest-preview {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin: 2rem 0;

  h4 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .preview-grid {
    display: grid;
    gap: 0.75rem;
  }

  .preview-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .value {
      font-weight: 600;
      color: var(--text-primary);
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
    min-width: 120px;
    padding: 0.75rem 1.5rem;

    @media (max-width: 768px) {
      min-width: auto;
    }
  }
}

// Dark theme adjustments
[data-theme="dark"] {
  .interest-preview {
    background: var(--surface-color);
  }
}
</style>