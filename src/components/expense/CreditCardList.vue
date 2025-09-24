<template>
  <div class="credit-card-list">
    <div class="list-header">
      <h3>Credit Cards</h3>
      <div class="header-actions">
        <button class="btn btn-primary" @click="$emit('addCard')">
          Add Credit Card
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading credit cards...</p>
    </div>

    <div v-else-if="cards.length === 0" class="empty-state">
      <div class="empty-icon">💳</div>
      <h4>No Credit Cards</h4>
      <p>Add your first credit card to start tracking payments and managing debt.</p>
      <button class="btn btn-primary" @click="$emit('addCard')">
        Add Your First Card
      </button>
    </div>

    <div v-else class="cards-grid">
      <div
        v-for="card in cards"
        :key="card.id"
        class="credit-card"
        :class="{ 'payment-due': isPaymentDue(card) }"
      >
        <div class="card-header">
          <div class="card-info">
            <h4 class="card-name">{{ card.name }}</h4>
            <div class="card-balance">
              <span class="balance-amount">{{ formatCurrency(card.balance) }}</span>
              <span class="balance-label">of {{ formatCurrency(card.creditLimit) }}</span>
            </div>
          </div>
          <div class="card-actions">
            <button
              class="btn-icon"
              @click="$emit('edit', card)"
              title="Edit card"
            >
              ✏️
            </button>
            <button
              class="btn-icon"
              @click="handleDelete(card)"
              title="Delete card"
            >
              🗑️
            </button>
          </div>
        </div>

        <div class="card-utilization">
          <div class="utilization-info">
            <span class="label">Utilization:</span>
            <span class="value" :class="getUtilizationClass(card)">
              {{ getUtilizationPercentage(card).toFixed(1) }}%
            </span>
          </div>
          <ProgressBar
            :value="card.balance"
            :max="card.creditLimit"
            :color="getUtilizationColor(card)"
            size="sm"
          />
        </div>

        <div class="card-details">
          <div class="detail-row">
            <span class="label">APR:</span>
            <span class="value">{{ card.interestRate.toFixed(2) }}%</span>
          </div>
          <div class="detail-row">
            <span class="label">Min Payment:</span>
            <span class="value">{{ formatCurrency(card.minimumPayment) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Due Date:</span>
            <span class="value" :class="{ 'due-soon': isPaymentDue(card) }">
              {{ formatDate(card.dueDate) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Monthly Interest:</span>
            <span class="value interest-cost">
              {{ formatCurrency(calculateMonthlyInterest(card.balance, card.interestRate)) }}
            </span>
          </div>
        </div>

        <div class="card-actions-bottom">
          <button
            class="btn btn-primary btn-sm"
            @click="$emit('makePayment', card.id)"
            :disabled="card.balance === 0"
          >
            Make Payment
          </button>
          <button
            class="btn btn-outline btn-sm"
            @click="showPayoffCalculator(card)"
          >
            Payoff Calculator
          </button>
        </div>

        <div v-if="isPaymentDue(card)" class="payment-alert">
          <span class="alert-icon">⚠️</span>
          <span class="alert-text">Payment due {{ getDaysUntilDue(card) }}</span>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div v-if="cards.length > 0" class="summary-section">
      <h4>Credit Summary</h4>
      <div class="summary-cards">
        <MetricCard
          title="Total Balance"
          :value="totalBalance"
          icon="💳"
        />
        <MetricCard
          title="Total Credit Limit"
          :value="totalCreditLimit"
          icon="🏦"
        />
        <MetricCard
          title="Overall Utilization"
          :value="`${overallUtilization.toFixed(1)}%`"
          :trend="overallUtilization > 30 ? 'down' : 'up'"
          icon="📊"
        />
        <MetricCard
          title="Monthly Interest"
          :value="totalMonthlyInterest"
          subtitle="If only minimum payments"
          icon="💰"
        />
      </div>
    </div>

    <!-- Payoff Calculator Modal -->
    <div v-if="showPayoffModal" class="modal-overlay" @click="closePayoffModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Payoff Calculator - {{ selectedCard?.name }}</h3>
          <button class="btn-close" @click="closePayoffModal">×</button>
        </div>
        <div class="modal-body">
          <PayoffCalculator
            v-if="selectedCard"
            :card="selectedCard"
            @close="closePayoffModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatCurrency } from '@/utils/currency';
import { calculateMonthlyInterest } from '@/utils/credit-calculations';
import ProgressBar from '@/components/shared/ProgressBar.vue';
import MetricCard from '@/components/shared/MetricCard.vue';
import PayoffCalculator from './PayoffCalculator.vue';
import type { CreditCardListProps, CreditCard } from '@/types';

const props = withDefaults(defineProps<CreditCardListProps>(), {
  loading: false
});

const emit = defineEmits<{
  addCard: [];
  edit: [card: CreditCard];
  delete: [cardId: string];
  makePayment: [cardId: string];
}>();

// Local state
const showPayoffModal = ref(false);
const selectedCard = ref<CreditCard | null>(null);

// Computed properties
const totalBalance = computed(() => 
  props.cards.reduce((sum, card) => sum + card.balance, 0)
);

const totalCreditLimit = computed(() => 
  props.cards.reduce((sum, card) => sum + card.creditLimit, 0)
);

const overallUtilization = computed(() => {
  if (totalCreditLimit.value === 0) return 0;
  return (totalBalance.value / totalCreditLimit.value) * 100;
});

const totalMonthlyInterest = computed(() => 
  props.cards.reduce((sum, card) => 
    sum + calculateMonthlyInterest(card.balance, card.interestRate), 0
  )
);

// Helper functions
function getUtilizationPercentage(card: CreditCard): number {
  if (card.creditLimit === 0) return 0;
  return (card.balance / card.creditLimit) * 100;
}

function getUtilizationClass(card: CreditCard): string {
  const percentage = getUtilizationPercentage(card);
  if (percentage > 90) return 'danger';
  if (percentage > 70) return 'warning';
  if (percentage > 30) return 'caution';
  return 'good';
}

function getUtilizationColor(card: CreditCard): 'success' | 'secondary' | 'warning' | 'danger' {
  const percentage = getUtilizationPercentage(card);
  if (percentage > 90) return 'danger';
  if (percentage > 70) return 'warning';
  if (percentage > 30) return 'secondary';
  return 'success';
}

function isPaymentDue(card: CreditCard): boolean {
  const today = new Date();
  const dueDate = new Date(card.dueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilDue <= 7 && daysUntilDue >= 0;
}

function getDaysUntilDue(card: CreditCard): string {
  const today = new Date();
  const dueDate = new Date(card.dueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDue === 0) return 'today';
  if (daysUntilDue === 1) return 'tomorrow';
  if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`;
  return `in ${daysUntilDue} days`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
}

function handleDelete(card: CreditCard) {
  if (confirm(`Are you sure you want to delete "${card.name}"? This action cannot be undone.`)) {
    emit('delete', card.id);
  }
}

function showPayoffCalculator(card: CreditCard) {
  selectedCard.value = card;
  showPayoffModal.value = true;
}

function closePayoffModal() {
  showPayoffModal.value = false;
  selectedCard.value = null;
}
</script>

<style scoped lang="scss">
.credit-card-list {
  max-width: 1200px;
  margin: 0 auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
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
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h4 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1.5rem;
  }

  p {
    margin: 0 0 2rem 0;
    font-size: 1.1rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.credit-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: all 0.2s;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &.payment-due {
    border-color: var(--warning-color);
    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.1);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;

  .card-info {
    flex: 1;

    .card-name {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
      font-size: 1.1rem;
      font-weight: 600;
    }

    .card-balance {
      .balance-amount {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .balance-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-left: 0.5rem;
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;

    .btn-icon {
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover {
        background: var(--border-color);
      }
    }
  }
}

.card-utilization {
  margin-bottom: 1rem;

  .utilization-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;

    .label {
      color: var(--text-secondary);
    }

    .value {
      font-weight: 600;

      &.good { color: var(--success-color); }
      &.caution { color: var(--secondary-color); }
      &.warning { color: var(--warning-color); }
      &.danger { color: var(--danger-color); }
    }
  }
}

.card-details {
  margin-bottom: 1.5rem;

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
    font-size: 0.875rem;

    .label {
      color: var(--text-secondary);
    }

    .value {
      color: var(--text-primary);
      font-weight: 500;

      &.due-soon {
        color: var(--warning-color);
        font-weight: 600;
      }

      &.interest-cost {
        color: var(--danger-color);
      }
    }
  }
}

.card-actions-bottom {
  display: flex;
  gap: 0.75rem;

  .btn {
    flex: 1;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}

.payment-alert {
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  background: var(--warning-color);
  color: white;
  padding: 0.5rem;
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-section {
  margin-top: 3rem;

  h4 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
}

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--surface-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);

    h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.25rem;
      color: var(--text-secondary);
      border-radius: 4px;

      &:hover {
        background: var(--border-color);
      }
    }
  }

  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>