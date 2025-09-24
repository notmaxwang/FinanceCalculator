<template>
  <div class="portfolio-summary">
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading portfolio...</p>
    </div>

    <div v-else class="summary-content">
      <div class="summary-header">
        <h3>Portfolio Summary</h3>
        <div class="last-updated">
          Last updated: {{ formatLastUpdated(portfolio.lastUpdated) }}
        </div>
      </div>

      <div class="main-metrics">
        <div class="total-value-card">
          <div class="value-header">
            <h4>Total Portfolio Value</h4>
            <div class="total-value">{{ formatCurrency(portfolio.totalValue) }}</div>
          </div>
          
          <div class="value-changes">
            <div class="daily-change" :class="getDailyChangeClass()">
              <span class="change-label">Today:</span>
              <span class="change-value">
                {{ formatChange(portfolio.dailyGainLoss) }}
                ({{ formatPercentage(getDailyChangePercent()) }})
              </span>
            </div>
            
            <div class="total-change" :class="getTotalChangeClass()">
              <span class="change-label">Total:</span>
              <span class="change-value">
                {{ formatChange(portfolio.totalGainLoss) }}
                ({{ formatPercentage(portfolio.totalGainLossPercent) }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="metrics-grid">
        <MetricCard
          title="Holdings Count"
          :value="portfolio.holdings.length"
          icon="📊"
          subtitle="Total investments"
        />
        
        <MetricCard
          title="Best Performer"
          :value="bestPerformer?.symbol || 'N/A'"
          :subtitle="bestPerformer ? `+${bestPerformer.gainLossPercent.toFixed(2)}%` : 'No data'"
          icon="🚀"
          trend="up"
        />
        
        <MetricCard
          title="Worst Performer"
          :value="worstPerformer?.symbol || 'N/A'"
          :subtitle="worstPerformer ? `${worstPerformer.gainLossPercent.toFixed(2)}%` : 'No data'"
          icon="📉"
          trend="down"
        />
        
        <MetricCard
          title="Diversification"
          :value="`${stockCount} / ${cryptoCount}`"
          subtitle="Stocks / Crypto"
          icon="🎯"
        />
      </div>

      <div class="allocation-section" v-if="portfolio.holdings.length > 0">
        <h4>Portfolio Allocation</h4>
        <div class="allocation-chart">
          <div class="allocation-bars">
            <div
              v-for="holding in topHoldings"
              :key="holding.id"
              class="allocation-bar"
              :style="{ width: `${getHoldingPercentage(holding)}%` }"
              :title="`${holding.symbol}: ${getHoldingPercentage(holding).toFixed(1)}%`"
            >
              <span class="bar-label" v-if="getHoldingPercentage(holding) > 5">
                {{ holding.symbol }}
              </span>
            </div>
          </div>
          
          <div class="allocation-legend">
            <div
              v-for="holding in topHoldings"
              :key="holding.id"
              class="legend-item"
            >
              <div class="legend-color" :style="{ backgroundColor: getHoldingColor(holding) }"></div>
              <span class="legend-symbol">{{ holding.symbol }}</span>
              <span class="legend-percentage">{{ getHoldingPercentage(holding).toFixed(1) }}%</span>
              <span class="legend-value">{{ formatCurrency(holding.currentValue) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="performance-section" v-if="portfolio.holdings.length > 0">
        <h4>Performance Breakdown</h4>
        <div class="performance-grid">
          <div class="performance-category">
            <h5>Gainers ({{ gainers.length }})</h5>
            <div class="performance-list">
              <div
                v-for="holding in gainers.slice(0, 3)"
                :key="holding.id"
                class="performance-item positive"
              >
                <span class="symbol">{{ holding.symbol }}</span>
                <span class="change">+{{ formatPercentage(holding.gainLossPercent) }}</span>
              </div>
            </div>
          </div>
          
          <div class="performance-category">
            <h5>Losers ({{ losers.length }})</h5>
            <div class="performance-list">
              <div
                v-for="holding in losers.slice(0, 3)"
                :key="holding.id"
                class="performance-item negative"
              >
                <span class="symbol">{{ holding.symbol }}</span>
                <span class="change">{{ formatPercentage(holding.gainLossPercent) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency, formatPercentage } from '@/utils/currency';
import MetricCard from '@/components/shared/MetricCard.vue';
import type { PortfolioSummaryProps, Holding } from '@/types';

const props = withDefaults(defineProps<PortfolioSummaryProps>(), {
  loading: false
});

// Computed properties
const bestPerformer = computed(() => {
  if (props.portfolio.holdings.length === 0) return null;
  return props.portfolio.holdings.reduce((best, holding) => 
    holding.gainLossPercent > best.gainLossPercent ? holding : best
  );
});

const worstPerformer = computed(() => {
  if (props.portfolio.holdings.length === 0) return null;
  return props.portfolio.holdings.reduce((worst, holding) => 
    holding.gainLossPercent < worst.gainLossPercent ? holding : worst
  );
});

const stockCount = computed(() => 
  props.portfolio.holdings.filter(h => h.type === 'stock').length
);

const cryptoCount = computed(() => 
  props.portfolio.holdings.filter(h => h.type === 'crypto').length
);

const topHoldings = computed(() => 
  [...props.portfolio.holdings]
    .sort((a, b) => b.currentValue - a.currentValue)
    .slice(0, 5)
);

const gainers = computed(() => 
  props.portfolio.holdings.filter(h => h.gainLoss > 0)
    .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
);

const losers = computed(() => 
  props.portfolio.holdings.filter(h => h.gainLoss < 0)
    .sort((a, b) => a.gainLossPercent - b.gainLossPercent)
);

// Helper functions
function getDailyChangeClass(): string {
  if (props.portfolio.dailyGainLoss > 0) return 'positive';
  if (props.portfolio.dailyGainLoss < 0) return 'negative';
  return 'neutral';
}

function getTotalChangeClass(): string {
  if (props.portfolio.totalGainLoss > 0) return 'positive';
  if (props.portfolio.totalGainLoss < 0) return 'negative';
  return 'neutral';
}

function getDailyChangePercent(): number {
  if (props.portfolio.totalValue === 0) return 0;
  const previousValue = props.portfolio.totalValue - props.portfolio.dailyGainLoss;
  if (previousValue === 0) return 0;
  return (props.portfolio.dailyGainLoss / previousValue) * 100;
}

function formatChange(change: number): string {
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${formatCurrency(Math.abs(change))}`;
}

function getHoldingPercentage(holding: Holding): number {
  if (props.portfolio.totalValue === 0) return 0;
  return (holding.currentValue / props.portfolio.totalValue) * 100;
}

function getHoldingColor(holding: Holding): string {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];
  const index = props.portfolio.holdings.findIndex(h => h.id === holding.id);
  return colors[index % colors.length];
}

function formatLastUpdated(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  return date.toLocaleDateString();
}
</script>

<style scoped lang="scss">
.portfolio-summary {
  max-width: 1200px;
  margin: 0 auto;
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

.summary-header {
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

  .last-updated {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

.main-metrics {
  margin-bottom: 2rem;

  .total-value-card {
    background: linear-gradient(135deg, var(--primary-color), #1e40af);
    color: white;
    border-radius: var(--border-radius);
    padding: 2rem;
    box-shadow: var(--shadow-lg);

    .value-header {
      text-align: center;
      margin-bottom: 1.5rem;

      h4 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        font-weight: 600;
        opacity: 0.9;
      }

      .total-value {
        font-size: 3rem;
        font-weight: 700;
        line-height: 1;

        @media (max-width: 768px) {
          font-size: 2.5rem;
        }
      }
    }

    .value-changes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      .daily-change, .total-change {
        text-align: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: var(--border-radius);

        .change-label {
          display: block;
          font-size: 0.875rem;
          opacity: 0.8;
          margin-bottom: 0.5rem;
        }

        .change-value {
          font-size: 1.1rem;
          font-weight: 600;
        }

        &.positive .change-value {
          color: #10b981;
        }

        &.negative .change-value {
          color: #ef4444;
        }

        &.neutral .change-value {
          color: #d1d5db;
        }
      }
    }
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.allocation-section, .performance-section {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  margin-bottom: 2rem;

  h4 {
    margin: 0 0 1.5rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }
}

.allocation-chart {
  .allocation-bars {
    display: flex;
    height: 40px;
    background: var(--border-color);
    border-radius: var(--border-radius);
    overflow: hidden;
    margin-bottom: 1rem;

    .allocation-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-color);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      transition: all 0.3s;

      &:nth-child(1) { background: #3b82f6; }
      &:nth-child(2) { background: #ef4444; }
      &:nth-child(3) { background: #10b981; }
      &:nth-child(4) { background: #f59e0b; }
      &:nth-child(5) { background: #8b5cf6; }

      .bar-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  .allocation-legend {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: var(--background-color);
      border-radius: var(--border-radius);
      font-size: 0.875rem;

      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }

      .legend-symbol {
        font-weight: 600;
        color: var(--text-primary);
        min-width: 50px;
      }

      .legend-percentage {
        color: var(--text-secondary);
        min-width: 40px;
      }

      .legend-value {
        color: var(--text-primary);
        margin-left: auto;
      }
    }
  }
}

.performance-section {
  .performance-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .performance-category {
      h5 {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
        font-size: 1rem;
        font-weight: 600;
      }

      .performance-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .performance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--background-color);
          border-radius: var(--border-radius);
          font-size: 0.875rem;

          .symbol {
            font-weight: 600;
            color: var(--text-primary);
          }

          .change {
            font-weight: 600;
          }

          &.positive .change {
            color: var(--success-color);
          }

          &.negative .change {
            color: var(--danger-color);
          }
        }
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Dark theme adjustments
[data-theme="dark"] {
  .main-metrics .total-value-card {
    background: linear-gradient(135deg, var(--primary-color), #1e3a8a);
  }
}
</style>