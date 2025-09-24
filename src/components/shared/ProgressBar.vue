<template>
  <div class="progress-bar-container" :class="sizeClass">
    <div v-if="label" class="progress-label">
      <span class="label-text">{{ label }}</span>
      <span v-if="showPercentage" class="label-percentage">{{ percentageText }}</span>
    </div>
    
    <div class="progress-bar" :class="colorClass">
      <div 
        class="progress-fill" 
        :style="{ width: `${percentage}%` }"
        :aria-valuenow="value"
        :aria-valuemin="0"
        :aria-valuemax="max"
        role="progressbar"
      >
        <div class="progress-shine"></div>
      </div>
    </div>
    
    <div v-if="!label && showPercentage" class="progress-percentage">
      {{ percentageText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ProgressBarProps } from '@/types';

const props = withDefaults(defineProps<ProgressBarProps>(), {
  showPercentage: false,
  color: 'primary',
  size: 'md'
});

const percentage = computed(() => {
  if (props.max === 0) return 0;
  const percent = (props.value / props.max) * 100;
  return Math.min(Math.max(percent, 0), 100);
});

const percentageText = computed(() => {
  return `${Math.round(percentage.value)}%`;
});

const colorClass = computed(() => {
  return `progress-${props.color}`;
});

const sizeClass = computed(() => {
  return `progress-${props.size}`;
});
</script>

<style scoped lang="scss">
.progress-bar-container {
  width: 100%;

  &.progress-sm {
    .progress-bar {
      height: 0.5rem;
    }
    
    .progress-label,
    .progress-percentage {
      font-size: 0.75rem;
    }
  }

  &.progress-md {
    .progress-bar {
      height: 0.75rem;
    }
    
    .progress-label,
    .progress-percentage {
      font-size: 0.875rem;
    }
  }

  &.progress-lg {
    .progress-bar {
      height: 1rem;
    }
    
    .progress-label,
    .progress-percentage {
      font-size: 1rem;
    }
  }
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  .label-text {
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .label-percentage {
    font-weight: 600;
    color: var(--text-secondary);
  }
}

.progress-bar {
  background-color: var(--border-color);
  border-radius: 9999px;
  overflow: hidden;
  position: relative;

  &.progress-primary .progress-fill {
    background-color: var(--primary-color);
  }

  &.progress-secondary .progress-fill {
    background-color: var(--secondary-color);
  }

  &.progress-success .progress-fill {
    background-color: var(--success-color);
  }

  &.progress-warning .progress-fill {
    background-color: var(--warning-color);
  }

  &.progress-danger .progress-fill {
    background-color: var(--danger-color);
  }
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease-in-out;
  position: relative;
  overflow: hidden;

  .progress-shine {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: shine 2s infinite;
  }
}

.progress-percentage {
  text-align: center;
  margin-top: 0.5rem;
  font-weight: 600;
  color: var(--text-secondary);
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

// Dark theme adjustments
[data-theme="dark"] {
  .progress-bar {
    background-color: var(--border-color);
  }
}

// Responsive design
@media (max-width: 768px) {
  .progress-label {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>