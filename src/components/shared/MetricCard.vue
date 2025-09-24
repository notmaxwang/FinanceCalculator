<template>
  <div class="metric-card card" :class="{ loading }">
    <div v-if="loading" class="loading-skeleton">
      <div class="skeleton-title"></div>
      <div class="skeleton-value"></div>
      <div class="skeleton-subtitle"></div>
    </div>
    
    <div v-else class="metric-content">
      <div class="metric-header">
        <div class="metric-icon" v-if="icon">
          <i :class="icon"></i>
        </div>
        <h3 class="metric-title">{{ title }}</h3>
      </div>
      
      <div class="metric-value">
        {{ formattedValue }}
      </div>
      
      <div v-if="subtitle || (trend && trendValue)" class="metric-footer">
        <div v-if="subtitle" class="metric-subtitle">
          {{ subtitle }}
        </div>
        
        <div v-if="trend && trendValue" class="metric-trend" :class="trendClass">
          <span class="trend-icon">{{ trendIcon }}</span>
          <span class="trend-value">{{ trendValue }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency, formatNumber } from '@/utils/currency';
import type { MetricCardProps } from '@/types';

const props = withDefaults(defineProps<MetricCardProps>(), {
  loading: false,
  trend: 'neutral'
});

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    // Try to format as currency if it looks like a monetary value
    if (props.value > 1000 || props.title.toLowerCase().includes('$') || 
        props.title.toLowerCase().includes('cost') || 
        props.title.toLowerCase().includes('payment')) {
      return formatCurrency(props.value);
    }
    return formatNumber(props.value);
  }
  return props.value.toString();
});

const trendClass = computed(() => {
  return {
    'trend-up': props.trend === 'up',
    'trend-down': props.trend === 'down',
    'trend-neutral': props.trend === 'neutral'
  };
});

const trendIcon = computed(() => {
  switch (props.trend) {
    case 'up':
      return '↗';
    case 'down':
      return '↘';
    default:
      return '→';
  }
});
</script>

<style scoped lang="scss">
.metric-card {
  min-height: 120px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  &.loading {
    .metric-content {
      display: none;
    }
  }
}

.metric-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;

  .metric-icon {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--primary-color);
    color: white;
    border-radius: 50%;
    font-size: 0.875rem;
  }

  .metric-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: auto;
  line-height: 1.2;
}

.metric-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  gap: 1rem;

  .metric-subtitle {
    font-size: 0.75rem;
    color: var(--text-secondary);
    flex: 1;
  }

  .metric-trend {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;

    &.trend-up {
      color: var(--success-color);
    }

    &.trend-down {
      color: var(--danger-color);
    }

    &.trend-neutral {
      color: var(--text-secondary);
    }

    .trend-icon {
      font-size: 1rem;
    }
  }
}

// Loading skeleton styles
.loading-skeleton {
  .skeleton-title,
  .skeleton-value,
  .skeleton-subtitle {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
  }

  .skeleton-title {
    height: 1rem;
    width: 60%;
    margin-bottom: 1rem;
  }

  .skeleton-value {
    height: 2rem;
    width: 80%;
    margin-bottom: 1rem;
  }

  .skeleton-subtitle {
    height: 0.75rem;
    width: 40%;
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// Dark theme adjustments
[data-theme="dark"] {
  .loading-skeleton {
    .skeleton-title,
    .skeleton-value,
    .skeleton-subtitle {
      background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
      background-size: 200% 100%;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .metric-value {
    font-size: 1.5rem;
  }

  .metric-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>