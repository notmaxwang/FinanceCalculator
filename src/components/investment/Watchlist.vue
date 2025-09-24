<template>
  <div class="watchlist">
    <div class="watchlist-header">
      <h3>Watchlist</h3>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showAddModal = true">
          Add Investment
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading watchlist...</p>
    </div>

    <div v-else-if="items.length === 0" class="empty-state">
      <div class="empty-icon">📈</div>
      <h4>No Investments in Watchlist</h4>
      <p>Add stocks and cryptocurrencies to track their performance.</p>
      <button class="btn btn-primary" @click="showAddModal = true">
        Add Your First Investment
      </button>
    </div>

    <div v-else class="watchlist-content">
      <div class="watchlist-table-container">
        <table class="watchlist-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Name</th>
              <th>Price</th>
              <th>Change</th>
              <th>Change %</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in items"
              :key="item.symbol"
              class="watchlist-row"
            >
              <td class="symbol">
                <div class="symbol-info">
                  <span class="symbol-text">{{ item.symbol }}</span>
                  <span class="type-badge" :class="item.type">{{ item.type }}</span>
                </div>
              </td>
              <td class="name">{{ item.name }}</td>
              <td class="price">
                <span class="price-value">{{ formatCurrency(item.currentPrice) }}</span>
              </td>
              <td class="change" :class="getChangeClass(item.dailyChange)">
                <span class="change-value">
                  {{ formatChange(item.dailyChange) }}
                </span>
              </td>
              <td class="change-percent" :class="getChangeClass(item.dailyChange)">
                <span class="change-percent-value">
                  {{ formatPercentage(item.dailyChangePercent) }}
                </span>
              </td>
              <td class="type">
                <span class="type-label" :class="item.type">
                  {{ item.type.toUpperCase() }}
                </span>
              </td>
              <td class="actions">
                <button
                  class="btn-icon"
                  @click="$emit('addToPortfolio', item.symbol)"
                  title="Add to portfolio"
                >
                  ➕
                </button>
                <button
                  class="btn-icon"
                  @click="handleRemove(item)"
                  title="Remove from watchlist"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="watchlist-summary">
        <div class="summary-stats">
          <div class="stat-item">
            <span class="label">Total Items:</span>
            <span class="value">{{ items.length }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Stocks:</span>
            <span class="value">{{ stockCount }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Crypto:</span>
            <span class="value">{{ cryptoCount }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Gainers:</span>
            <span class="value positive">{{ gainersCount }}</span>
          </div>
          <div class="stat-item">
            <span class="label">Losers:</span>
            <span class="value negative">{{ losersCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Investment Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Add to Watchlist</h3>
          <button class="btn-close" @click="closeAddModal">×</button>
        </div>
        <div class="modal-body">
          <InvestmentSearch
            @select="handleAddInvestment"
            @cancel="closeAddModal"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatCurrency, formatPercentage } from '@/utils/currency';
import InvestmentSearch from './InvestmentSearch.vue';
import type { WatchlistProps, WatchlistItem } from '@/types';

const props = withDefaults(defineProps<WatchlistProps>(), {
  loading: false
});

const emit = defineEmits<{
  remove: [symbol: string];
  addToPortfolio: [symbol: string];
}>();

// Local state
const showAddModal = ref(false);

// Computed properties
const stockCount = computed(() => 
  props.items.filter(item => item.type === 'stock').length
);

const cryptoCount = computed(() => 
  props.items.filter(item => item.type === 'crypto').length
);

const gainersCount = computed(() => 
  props.items.filter(item => item.dailyChange > 0).length
);

const losersCount = computed(() => 
  props.items.filter(item => item.dailyChange < 0).length
);

// Helper functions
function getChangeClass(change: number): string {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
}

function formatChange(change: number): string {
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${formatCurrency(Math.abs(change))}`;
}

function handleRemove(item: WatchlistItem) {
  if (confirm(`Remove ${item.name} (${item.symbol}) from watchlist?`)) {
    emit('remove', item.symbol);
  }
}

function handleAddInvestment(result: { symbol: string; name: string; type: 'stock' | 'crypto' }) {
  // This would typically call the parent component or store to add the investment
  console.log('Adding to watchlist:', result);
  closeAddModal();
}

function closeAddModal() {
  showAddModal.value = false;
}
</script>

<style scoped lang="scss">
.watchlist {
  max-width: 1200px;
  margin: 0 auto;
}

.watchlist-header {
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

.watchlist-content {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.watchlist-table-container {
  overflow-x: auto;
}

.watchlist-table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  th {
    background: var(--background-color);
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .watchlist-row {
    transition: background-color 0.2s;

    &:hover {
      background: var(--border-color);
    }
  }

  .symbol {
    .symbol-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .symbol-text {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 1rem;
      }

      .type-badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-weight: 500;
        text-transform: uppercase;

        &.stock {
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary-color);
        }

        &.crypto {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning-color);
        }
      }
    }
  }

  .name {
    color: var(--text-secondary);
    font-size: 0.875rem;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .price {
    .price-value {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 1rem;
    }
  }

  .change, .change-percent {
    font-weight: 600;

    &.positive {
      color: var(--success-color);
    }

    &.negative {
      color: var(--danger-color);
    }

    &.neutral {
      color: var(--text-secondary);
    }
  }

  .type {
    .type-label {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;

      &.stock {
        background: var(--primary-color);
        color: white;
      }

      &.crypto {
        background: var(--warning-color);
        color: white;
      }
    }
  }

  .actions {
    .btn-icon {
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      border-radius: 4px;
      margin: 0 0.25rem;
      transition: background-color 0.2s;

      &:hover {
        background: var(--border-color);
      }
    }
  }
}

.watchlist-summary {
  padding: 1.5rem;
  background: var(--background-color);
  border-top: 1px solid var(--border-color);

  .summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;

    .stat-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;

      .label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .value {
        font-weight: 600;
        color: var(--text-primary);

        &.positive {
          color: var(--success-color);
        }

        &.negative {
          color: var(--danger-color);
        }
      }
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
  max-width: 500px;
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

// Responsive design
@media (max-width: 768px) {
  .watchlist-table {
    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.875rem;
    }

    .name {
      max-width: 150px;
    }
  }

  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>