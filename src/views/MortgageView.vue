<template>
  <div class="mortgage-view">
    <div class="container">
      <MortgageInputForm
        v-model="mortgageStore.currentInputs"
        :loading="mortgageStore.loadingState === 'loading'"
        :errors="mortgageStore.validationErrors"
        @submit="handleCalculate"
        @reset="handleReset"
      />

      <MortgageResults
        :results="mortgageStore.currentResults"
        :loading="mortgageStore.loadingState === 'loading'"
        @save="handleSave"
        @viewAmortization="handleViewAmortization"
        @compare="handleCompare"
      />

      <!-- Saved Calculations -->
      <div v-if="mortgageStore.savedCalculations.length > 0" class="saved-calculations">
        <h3>Saved Calculations</h3>
        <div class="calculations-grid">
          <div
            v-for="calculation in mortgageStore.savedCalculations"
            :key="calculation.id"
            class="calculation-card"
            @click="handleLoadCalculation(calculation.id)"
          >
            <div class="calculation-header">
              <h4>{{ calculation.name }}</h4>
              <div class="calculation-actions">
                <button
                  class="btn-icon"
                  @click.stop="handleEditName(calculation)"
                  title="Edit name"
                >
                  ✏️
                </button>
                <button
                  class="btn-icon"
                  @click.stop="handleDeleteCalculation(calculation.id)"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
            <div class="calculation-details">
              <div class="detail">
                <span class="label">Home Price:</span>
                <span class="value">{{ formatCurrency(calculation.inputs.loanAmount) }}</span>
              </div>
              <div class="detail">
                <span class="label">Monthly Payment:</span>
                <span class="value">{{ formatCurrency(calculation.results.totalMonthlyPayment) }}</span>
              </div>
              <div class="detail">
                <span class="label">Rate:</span>
                <span class="value">{{ calculation.inputs.interestRate }}%</span>
              </div>
              <div class="detail">
                <span class="label">Term:</span>
                <span class="value">{{ calculation.inputs.loanTermYears }} years</span>
              </div>
            </div>
            <div class="calculation-date">
              {{ formatDate(calculation.createdAt) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Amortization Schedule Modal -->
      <div v-if="showAmortization" class="modal-overlay" @click="closeAmortization">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Amortization Schedule</h3>
            <button class="btn-close" @click="closeAmortization">×</button>
          </div>
          <div class="modal-body">
            <AmortizationSchedule :schedule="mortgageStore.amortizationSchedule" />
          </div>
        </div>
      </div>

      <!-- Save Calculation Modal -->
      <div v-if="showSaveModal" class="modal-overlay" @click="closeSaveModal">
        <div class="modal-content small" @click.stop>
          <div class="modal-header">
            <h3>Save Calculation</h3>
            <button class="btn-close" @click="closeSaveModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="calculationName">Calculation Name</label>
              <input
                id="calculationName"
                v-model="calculationName"
                type="text"
                placeholder="Enter a name for this calculation"
                @keyup.enter="confirmSave"
              />
            </div>
            <div class="modal-actions">
              <button class="btn btn-primary" @click="confirmSave">Save</button>
              <button class="btn btn-outline" @click="closeSaveModal">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMortgageStore } from '@/stores/mortgage';
import { useAppStore } from '@/stores/app';
import { formatCurrency } from '@/utils/currency';
import MortgageInputForm from '@/components/mortgage/MortgageInputForm.vue';
import MortgageResults from '@/components/mortgage/MortgageResults.vue';
import AmortizationSchedule from '@/components/mortgage/AmortizationSchedule.vue';

const mortgageStore = useMortgageStore();
const appStore = useAppStore();

// Modal states
const showAmortization = ref(false);
const showSaveModal = ref(false);
const calculationName = ref('');

// Event handlers
function handleCalculate() {
  mortgageStore.calculateResults();
}

function handleReset() {
  mortgageStore.resetInputs();
}

function handleSave() {
  calculationName.value = `Calculation ${mortgageStore.savedCalculations.length + 1}`;
  showSaveModal.value = true;
}

function confirmSave() {
  if (calculationName.value.trim()) {
    const id = mortgageStore.saveCalculation(calculationName.value.trim());
    if (id) {
      appStore.addNotification({
        type: 'portfolio_alert',
        title: 'Calculation Saved',
        message: `"${calculationName.value}" has been saved successfully`,
        scheduledFor: new Date()
      });
    }
  }
  closeSaveModal();
}

function closeSaveModal() {
  showSaveModal.value = false;
  calculationName.value = '';
}

function handleViewAmortization() {
  mortgageStore.generateAmortization();
  showAmortization.value = true;
}

function closeAmortization() {
  showAmortization.value = false;
}

function handleCompare() {
  // TODO: Implement comparison feature
  appStore.addNotification({
    type: 'portfolio_alert',
    title: 'Feature Coming Soon',
    message: 'Mortgage comparison feature will be available in a future update',
    scheduledFor: new Date()
  });
}

function handleLoadCalculation(id: string) {
  const success = mortgageStore.loadCalculation(id);
  if (success) {
    appStore.addNotification({
      type: 'portfolio_alert',
      title: 'Calculation Loaded',
      message: 'Previous calculation has been loaded',
      scheduledFor: new Date()
    });
  }
}

function handleEditName(calculation: any) {
  const newName = prompt('Enter new name:', calculation.name);
  if (newName && newName.trim() !== calculation.name) {
    mortgageStore.updateCalculationName(calculation.id, newName.trim());
  }
}

function handleDeleteCalculation(id: string) {
  if (confirm('Are you sure you want to delete this calculation?')) {
    mortgageStore.deleteCalculation(id);
    appStore.addNotification({
      type: 'portfolio_alert',
      title: 'Calculation Deleted',
      message: 'Calculation has been removed',
      scheduledFor: new Date()
    });
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Initialize store on mount
onMounted(() => {
  mortgageStore.initialize();
});
</script>

<style scoped lang="scss">
.mortgage-view {
  min-height: 100vh;
  background: var(--background-color);
  padding: 2rem 0;
}

.saved-calculations {
  margin-top: 3rem;

  h3 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  .calculations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .calculation-card {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .calculation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h4 {
        margin: 0;
        color: var(--text-primary);
        font-size: 1.1rem;
        font-weight: 600;
      }

      .calculation-actions {
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

    .calculation-details {
      display: grid;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .detail {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;

        .label {
          color: var(--text-secondary);
        }

        .value {
          color: var(--text-primary);
          font-weight: 500;
        }
      }
    }

    .calculation-date {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-align: right;
    }
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
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.small {
    max-width: 400px;
  }

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

  .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
}

// Responsive design
@media (max-width: 768px) {
  .mortgage-view {
    padding: 1rem 0;
  }

  .saved-calculations .calculations-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
}
</style>