<template>
  <div class="payoff-calculator">
    <div class="calculator-header">
      <h4>Debt Payoff Calculator</h4>
      <p>See how different payment amounts affect your payoff time and total interest</p>
    </div>

    <div class="current-info">
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Current Balance:</span>
          <span class="value">{{ formatCurrency(card.balance) }}</span>
        </div>
        <div class="info-item">
          <span class="label">APR:</span>
          <span class="value">{{ card.interestRate.toFixed(2) }}%</span>
        </div>
        <div class="info-item">
          <span class="label">Minimum Payment:</span>
          <span class="value">{{ formatCurrency(card.minimumPayment) }}</span>
        </div>
      </div>
    </div>

    <div class="payment-input">
      <CurrencyInput
        v-model="monthlyPayment"
        label="Monthly Payment Amount"
        placeholder="Enter payment amount"
        :min="card.minimumPayment"
        :max="card.balance"
      />
      
      <div class="payment-presets">
        <button
          v-for="preset in paymentPresets"
          :key="preset.label"
          class="btn btn-outline btn-sm"
          @click="monthlyPayment = preset.amount"
          :class="{ active: monthlyPayment === preset.amount }"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <div class="results-section">
      <div class="results-grid">
        <div class="result-card">
          <div class="result-header">
            <h5>Minimum Payment</h5>
            <div class="result-amount">{{ formatCurrency(card.minimumPayment) }}</div>
          </div>
          <div class="result-details">
            <div class="detail">
              <span class="label">Payoff Time:</span>
              <span class="value">{{ formatPayoffTime(minimumPayoffInfo.months) }}</span>
            </div>
            <div class="detail">
              <span class="label">Total Interest:</span>
              <span class="value interest">{{ formatCurrency(minimumPayoffInfo.totalInterest) }}</span>
            </div>
            <div class="detail">
              <span class="label">Total Paid:</span>
              <span class="value">{{ formatCurrency(minimumPayoffInfo.totalPaid) }}</span>
            </div>
          </div>
        </div>

        <div class="result-card primary" v-if="monthlyPayment > card.minimumPayment">
          <div class="result-header">
            <h5>Your Payment</h5>
            <div class="result-amount">{{ formatCurrency(monthlyPayment) }}</div>
          </div>
          <div class="result-details">
            <div class="detail">
              <span class="label">Payoff Time:</span>
              <span class="value">{{ formatPayoffTime(customPayoffInfo.months) }}</span>
            </div>
            <div class="detail">
              <span class="label">Total Interest:</span>
              <span class="value interest">{{ formatCurrency(customPayoffInfo.totalInterest) }}</span>
            </div>
            <div class="detail">
              <span class="label">Total Paid:</span>
              <span class="value">{{ formatCurrency(customPayoffInfo.totalPaid) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="monthlyPayment > card.minimumPayment" class="savings-summary">
        <h5>Savings Summary</h5>
        <div class="savings-grid">
          <div class="savings-item">
            <span class="label">Interest Saved:</span>
            <span class="value savings">{{ formatCurrency(interestSaved) }}</span>
          </div>
          <div class="savings-item">
            <span class="label">Time Saved:</span>
            <span class="value savings">{{ formatPayoffTime(timeSaved) }}</span>
          </div>
          <div class="savings-item">
            <span class="label">Extra Payment:</span>
            <span class="value">{{ formatCurrency(monthlyPayment - card.minimumPayment) }}/month</span>
          </div>
        </div>
      </div>
    </div>

    <div class="payment-schedule" v-if="showSchedule">
      <h5>Payment Schedule Preview</h5>
      <div class="schedule-table-container">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Payment #</th>
              <th>Payment</th>
              <th>Interest</th>
              <th>Principal</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(payment, index) in paymentSchedulePreview"
              :key="index"
            >
              <td>{{ payment.month }}</td>
              <td>{{ formatCurrency(payment.amount) }}</td>
              <td class="interest">{{ formatCurrency(payment.interestCharged) }}</td>
              <td class="principal">{{ formatCurrency(payment.principalPaid) }}</td>
              <td>{{ formatCurrency(payment.remainingBalance) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="calculator-actions">
      <button
        class="btn btn-outline"
        @click="showSchedule = !showSchedule"
      >
        {{ showSchedule ? 'Hide' : 'Show' }} Payment Schedule
      </button>
      
      <button
        class="btn btn-primary"
        @click="$emit('close')"
      >
        Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatCurrency } from '@/utils/currency';
import { calculatePayoffTime, generatePaymentSchedule } from '@/utils/credit-calculations';
import CurrencyInput from '@/components/shared/CurrencyInput.vue';
import type { CreditCard } from '@/types';

interface Props {
  card: CreditCard;
}

const props = defineProps<Props>();

defineEmits<{
  close: [];
}>();

// Local state
const monthlyPayment = ref(props.card.minimumPayment);
const showSchedule = ref(false);

// Computed properties
const paymentPresets = computed(() => [
  { label: 'Minimum', amount: props.card.minimumPayment },
  { label: 'Minimum + $50', amount: props.card.minimumPayment + 50 },
  { label: 'Minimum + $100', amount: props.card.minimumPayment + 100 },
  { label: 'Minimum + $200', amount: props.card.minimumPayment + 200 }
]);

const minimumPayoffInfo = computed(() => 
  calculatePayoffTime(props.card.balance, props.card.interestRate, props.card.minimumPayment)
);

const customPayoffInfo = computed(() => 
  calculatePayoffTime(props.card.balance, props.card.interestRate, monthlyPayment.value)
);

const interestSaved = computed(() => 
  minimumPayoffInfo.value.totalInterest - customPayoffInfo.value.totalInterest
);

const timeSaved = computed(() => 
  minimumPayoffInfo.value.months - customPayoffInfo.value.months
);

const paymentSchedulePreview = computed(() => {
  if (monthlyPayment.value <= 0) return [];
  
  const schedule = generatePaymentSchedule(
    props.card.balance,
    props.card.interestRate,
    monthlyPayment.value,
    12 // Show first 12 payments
  );
  
  return schedule.map((payment, index) => ({
    month: index + 1,
    ...payment
  }));
});

// Helper functions
function formatPayoffTime(months: number): string {
  if (months === 0 || months === Infinity) return 'Never';
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years === 0) return `${months} months`;
  if (remainingMonths === 0) return `${years} years`;
  return `${years}y ${remainingMonths}m`;
}
</script>

<style scoped lang="scss">
.payoff-calculator {
  max-width: 100%;
}

.calculator-header {
  text-align: center;
  margin-bottom: 2rem;

  h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
}

.current-info {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 2rem;

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .value {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 1.1rem;
    }
  }
}

.payment-input {
  margin-bottom: 2rem;

  .payment-presets {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    flex-wrap: wrap;

    .btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;

      &.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
    }
  }
}

.results-section {
  margin-bottom: 2rem;

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .result-card {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 1.5rem;

    &.primary {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    }

    .result-header {
      text-align: center;
      margin-bottom: 1rem;

      h5 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
        font-size: 1rem;
        font-weight: 600;
      }

      .result-amount {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-color);
      }
    }

    .result-details {
      .detail {
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

          &.interest {
            color: var(--danger-color);
          }
        }
      }
    }
  }
}

.savings-summary {
  background: linear-gradient(135deg, var(--success-color), #059669);
  color: white;
  border-radius: var(--border-radius);
  padding: 1.5rem;

  h5 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .savings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .savings-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .value {
      font-weight: 600;
      font-size: 1.1rem;

      &.savings {
        color: #fef3c7;
      }
    }
  }
}

.payment-schedule {
  margin-bottom: 2rem;

  h5 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .schedule-table-container {
    overflow-x: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
  }

  .schedule-table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface-color);

    th, td {
      padding: 0.75rem;
      text-align: right;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.875rem;

      &:first-child {
        text-align: left;
      }
    }

    th {
      background: var(--background-color);
      font-weight: 600;
      color: var(--text-primary);
    }

    td {
      color: var(--text-secondary);

      &.interest {
        color: var(--danger-color);
      }

      &.principal {
        color: var(--primary-color);
      }
    }
  }
}

.calculator-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
  }

  .btn {
    min-width: 120px;

    @media (max-width: 768px) {
      min-width: auto;
    }
  }
}

// Dark theme adjustments
[data-theme="dark"] {
  .current-info {
    background: var(--surface-color);
  }

  .schedule-table th {
    background: var(--surface-color);
  }
}
</style>