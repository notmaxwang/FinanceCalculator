<template>
  <div class="investment-search">
    <div class="search-header">
      <h4>Search Investments</h4>
      <p>Search for stocks and cryptocurrencies to add to your watchlist</p>
    </div>

    <div class="search-form">
      <div class="search-input-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by symbol or name (e.g., AAPL, Bitcoin)"
          class="search-input"
          @input="handleSearch"
          @keyup.enter="performSearch"
        />
        <button
          class="search-button"
          @click="performSearch"
          :disabled="loading || !searchQuery.trim()"
        >
          🔍
        </button>
      </div>

      <div class="search-filters">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="filter-btn"
          :class="{ active: selectedFilter === filter.value }"
          @click="selectedFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="search-loading">
      <div class="loading-spinner"></div>
      <p>Searching...</p>
    </div>

    <div v-else-if="searchResults.length > 0" class="search-results">
      <div class="results-header">
        <h5>Search Results ({{ searchResults.length }})</h5>
      </div>
      
      <div class="results-list">
        <div
          v-for="result in searchResults"
          :key="result.symbol"
          class="result-item"
          @click="selectResult(result)"
        >
          <div class="result-info">
            <div class="result-symbol">
              <span class="symbol-text">{{ result.symbol }}</span>
              <span class="type-badge" :class="result.type">{{ result.type }}</span>
            </div>
            <div class="result-name">{{ result.name }}</div>
            <div v-if="result.exchange" class="result-exchange">{{ result.exchange }}</div>
          </div>
          <div class="result-action">
            <button class="btn btn-outline btn-sm">Add</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="hasSearched && !loading" class="no-results">
      <div class="no-results-icon">🔍</div>
      <h5>No Results Found</h5>
      <p>Try searching with a different symbol or company name.</p>
    </div>

    <div v-else class="search-suggestions">
      <h5>Popular Investments</h5>
      <div class="suggestions-grid">
        <div
          v-for="suggestion in popularSuggestions"
          :key="suggestion.symbol"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          <div class="suggestion-info">
            <span class="suggestion-symbol">{{ suggestion.symbol }}</span>
            <span class="suggestion-name">{{ suggestion.name }}</span>
          </div>
          <span class="type-badge" :class="suggestion.type">{{ suggestion.type }}</span>
        </div>
      </div>
    </div>

    <div class="search-actions">
      <button class="btn btn-outline" @click="$emit('cancel')">
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { marketDataService } from '@/services/marketData';
import type { SearchResult } from '@/types';

const emit = defineEmits<{
  select: [result: { symbol: string; name: string; type: 'stock' | 'crypto' }];
  cancel: [];
}>();

// Local state
const searchQuery = ref('');
const searchResults = ref<SearchResult[]>([]);
const loading = ref(false);
const hasSearched = ref(false);
const selectedFilter = ref<'all' | 'stock' | 'crypto'>('all');

// Search filters
const filters = [
  { label: 'All', value: 'all' as const },
  { label: 'Stocks', value: 'stock' as const },
  { label: 'Crypto', value: 'crypto' as const }
];

// Popular suggestions
const popularSuggestions = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' as const },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' as const },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' as const },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' as const },
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' as const },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto' as const },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto' as const },
  { symbol: 'SOL', name: 'Solana', type: 'crypto' as const }
];

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>;

function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim().length >= 2) {
      performSearch();
    }
  }, 300);
}

async function performSearch() {
  if (!searchQuery.value.trim()) return;

  loading.value = true;
  hasSearched.value = true;

  try {
    const filterType = selectedFilter.value === 'all' ? undefined : selectedFilter.value;
    const results = await marketDataService.searchInvestments(searchQuery.value, filterType);
    searchResults.value = results;
  } catch (error) {
    console.error('Search failed:', error);
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
}

function selectResult(result: SearchResult) {
  emit('select', {
    symbol: result.symbol,
    name: result.name,
    type: result.type
  });
}

function selectSuggestion(suggestion: typeof popularSuggestions[0]) {
  emit('select', {
    symbol: suggestion.symbol,
    name: suggestion.name,
    type: suggestion.type
  });
}

// Watch for filter changes and re-search if needed
watch(selectedFilter, () => {
  if (hasSearched.value && searchQuery.value.trim()) {
    performSearch();
  }
});
</script>

<style scoped lang="scss">
.investment-search {
  max-width: 100%;
}

.search-header {
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

.search-form {
  margin-bottom: 2rem;

  .search-input-group {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;

    .search-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: 1rem;
      background: var(--background-color);
      color: var(--text-primary);

      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
      }

      &::placeholder {
        color: var(--text-secondary);
      }
    }

    .search-button {
      padding: 0.75rem 1rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.2s;

      &:hover:not(:disabled) {
        background: #1d4ed8;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .search-filters {
    display: flex;
    gap: 0.5rem;
    justify-content: center;

    .filter-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      background: var(--background-color);
      color: var(--text-secondary);
      border-radius: var(--border-radius);
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;

      &:hover {
        background: var(--surface-color);
      }

      &.active {
        background: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }
    }
  }
}

.search-loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);

  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 2px solid var(--border-color);
    border-top: 2px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
}

.search-results {
  margin-bottom: 2rem;

  .results-header {
    margin-bottom: 1rem;

    h5 {
      margin: 0;
      color: var(--text-primary);
      font-size: 1rem;
      font-weight: 600;
    }
  }

  .results-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
  }

  .result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background-color 0.2s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--surface-color);
    }

    .result-info {
      flex: 1;

      .result-symbol {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;

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

      .result-name {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      .result-exchange {
        color: var(--text-secondary);
        font-size: 0.75rem;
        opacity: 0.8;
      }
    }

    .result-action {
      .btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
    }
  }
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);

  .no-results-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  h5 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1.1rem;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
  }
}

.search-suggestions {
  margin-bottom: 2rem;

  h5 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
  }

  .suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
  }

  .suggestion-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--surface-color);
      border-color: var(--primary-color);
    }

    .suggestion-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .suggestion-symbol {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.875rem;
      }

      .suggestion-name {
        color: var(--text-secondary);
        font-size: 0.75rem;
      }
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

.search-actions {
  display: flex;
  justify-content: center;
  margin-top: 2rem;

  .btn {
    min-width: 100px;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Responsive design
@media (max-width: 768px) {
  .search-filters {
    flex-wrap: wrap;
  }

  .suggestions-grid {
    grid-template-columns: 1fr;
  }

  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;

    .result-action {
      align-self: stretch;

      .btn {
        width: 100%;
      }
    }
  }
}
</style>