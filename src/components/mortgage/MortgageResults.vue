<template>
  <div class="mortgage-results">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Calculating your mortgage...</p>
    </div>

    <div v-else-if="results" class="results-content">
      <div class="results-header">
        <h3>Your Monthly Payment</h3>
        <div class="main-payment">
          {{ formatCurrency(results.totalMonthlyPayment) }}
          <span class="payment-label">per month</span>
        </div>
      </div>

      <div class="payment-breakdown">
        <h4>Payment Breakdown</h4>
        <div class="breakdown-grid">
          <div class="breakdown-item">
            <div class="breakdown-label">Principal & Interest</div>
            <div class="breakdown-value">{{ formatCurrency(results.monthlyPayment) }}</div>
            <div class="breakdown-bar">
              <div 
                class="breakdown-fill principal-interest" 
                :style="{ width: `${getPrincipalInterestPercentage()}%` }"
              ></div>
            </div>
          </div>

          <div class="breakdown-item" v-if="results.monthlyTax > 0">
            <div class="breakdown-label">Property Tax</div>
            <div class="breakdown-value">{{ formatCurrency(results.monthlyTax) }}</div>
            <div class="breakdown-bar">
              <div 
                class="breakdown-fill property-tax" 
                :style="{ width: `${getPropertyTaxPercentage()}%` }"
              ></div>
            </div>
          </div>

          <div class="breakdown-item" v-if="results.monthlyInsurance > 0">
            <div class="breakdown-label">Home Insurance</div>
            <div class="breakdown-value">{{ formatCurrency(results.monthlyInsurance) }}</div>
            <div class="breakdown-bar">
              <div 
                class="breakdown-fill insurance" 
                :style="{ width: `${getInsurancePercentage()}%` }"
              ></div>
            </div>
          </div>

          <div class="breakdown-item" v-if="results.monthlyPMI > 0">
            <div class="breakdown-label">PMI</div>
            <div class="breakdown-value">{{ formatCurrency(results.monthlyPMI) }}</div>
            <div class="breakdown-bar">
              <div 
                class="breakdown-fill pmi" 
                :style="{ width: `${getPMIPercentage()}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-cards">
        <MetricCard
          title="Total Interest"
          :value="results.totalInterest"
          subtitle="Over the life of the loan"
          icon="💰"
        />
        
        <MetricCard
          title="Total Cost"
          :value="results.totalCost"
          subtitle="Principal + Interest + Taxes + Insurance"
          icon="🏠"
        />
        
        <MetricCard
          title="Principal Amount"
          :value="results.principal"
          subtitle="Amount financed"
          icon="📊"
        />
      </div>

      <div class="loan-details">
        <h4>Loan Details</h4>
        <div class="details-grid">
          <div class="detail-item">
            <span class="detail-label">Monthly Principal & Interest:</span>
            <span class="detail-value">{{ formatCurrency(results.monthlyPayment) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total of Payments:</span>
            <span class="detail-value">{{ formatCurrency(results.principal + results.totalInterest) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Interest as % of Payments:</span>
            <span class="detail-value">{{ getInterestPercentage().toFixed(1) }}%</span>
          </div>
          <div class="detail-item" v-if="results.monthlyPMI > 0">
            <span class="detail-label">PMI Removal:</span>
            <span class="detail-value">When loan balance reaches 80% LTV</span>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn btn-primary" @click="$emit('save')">
          Save Calculation
        </button>
        <button class="btn btn-outline" @click="$emit('viewAmortization')">
          View Amortization Schedule
        </button>
        <button class="btn btn-outline" @click="$emit('compare')">
          Compare Scenarios
        </button>
      </div>
    </div>

    <div v-else class="no-results">
      <div class="no-results-icon">🏠</div>
      <h3>Ready to Calculate</h3>
      <p>Enter your mortgage details in the form above to see your monthly payment breakdown.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency } from '@/utils/currency';
import MetricCard from '@/components/shared/MetricCard.vue';
import type { MortgageResultsProps } from '@/types';

const props = withDefaults(defineProps<MortgageResultsProps>(), {
  loading: false
});

defineEmits<{
  save: [];
  viewAmortization: [];
  compare: [];
}>();

// Computed properties for breakdown percentages
const getPrincipalInterestPercentage = () => {
  if (!props.results) return 0;
  return (props.results.monthlyPayment / props.results.totalMonthlyPayment) * 100;
};

const getPropertyTaxPercentage = () => {
  if (!props.results) return 0;
  return (props.results.monthlyTax / props.results.totalMonthlyPayment) * 100;
};

const getInsurancePercentage = () => {
  if (!props.results) return 0;
  return (props.results.monthlyInsurance / props.results.totalMonthlyPayment) * 100;
};

const getPMIPercentage = () => {
  if (!props.results) return 0;
  return (props.results.monthlyPMI / props.results.totalMonthlyPayment) * 100;
};

const getInterestPercentage = () => {
  if (!props.results) return 0;
  const totalPayments = props.results.principal + props.results.totalInterest;
  return totalPayments > 0 ? (props.results.totalInterest / totalPayments) * 100 : 0;
};
</script>

<style scoped lang="scss">
.mortgage-results {
  max-width: 800px;
  margin: 2rem auto 0;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-color);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  p {
    margin: 0;
    font-size: 1.1rem;
  }
}

.results-content {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.results-header {
  background: linear-gradient(135deg, var(--primary-color), #1e40af);
  color: white;
  padding: 2rem;
  text-align: center;

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    opacity: 0.9;
  }

  .main-payment {
    font-size: 3rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 0.5rem;

    @media (max-width: 768px) {
      font-size: 2.5rem;
    }

    .payment-label {
      display: block;
      font-size: 1rem;
      font-weight: 400;
      opacity: 0.8;
      margin-top: 0.5rem;
    }
  }
}

.payment-breakdown {
  padding: 2rem;
  border-bottom: 1px solid var(--border-color);

  h4 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .breakdown-grid {
    display: grid;
    gap: 1rem;
  }

  .breakdown-item {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 0.5rem 1rem;
    align-items: center;

    .breakdown-label {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .breakdown-value {
      font-weight: 600;
      color: var(--text-primary);
      text-align: right;
    }

    .breakdown-bar {
      grid-column: 1 / -1;
      height: 8px;
      background: var(--border-color);
      border-radius: 4px;
      overflow: hidden;

      .breakdown-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;

        &.principal-interest {
          background: var(--primary-color);
        }

        &.property-tax {
          background: var(--warning-color);
        }

        &.insurance {
          background: var(--secondary-color);
        }

        &.pmi {
          background: var(--danger-color);
        }
      }
    }
  }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  padding: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.loan-details {
  padding: 2rem;
  border-bottom: 1px solid var(--border-color);

  h4 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .details-grid {
    display: grid;
    gap: 1rem;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .detail-value {
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  padding: 2rem;
  justify-content: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
  }

  .btn {
    min-width: 160px;
    padding: 0.75rem 1.5rem;

    @media (max-width: 768px) {
      min-width: auto;
    }
  }
}

.no-results {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);

  .no-results-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h3 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1.5rem;
  }

  p {
    margin: 0;
    font-size: 1.1rem;
    max-width: 400px;
    margin: 0 auto;
    line-height: 1.5;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Dark theme adjustments
[data-theme="dark"] {
  .results-header {
    background: linear-gradient(135deg, var(--primary-color), #1e3a8a);
  }
}
</style>