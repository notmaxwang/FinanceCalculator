<template>
  <div class="amortization-schedule">
    <div class="schedule-header">
      <h4>Payment Schedule</h4>
      <p>Detailed breakdown of each monthly payment over the life of your loan</p>
    </div>

    <div class="schedule-summary">
      <div class="summary-item">
        <span class="label">Total Payments:</span>
        <span class="value">{{ schedule.length }}</span>
      </div>
      <div class="summary-item">
        <span class="label">Total Interest:</span>
        <span class="value">{{ formatCurrency(totalInterest) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">Total Principal:</span>
        <span class="value">{{ formatCurrency(totalPrincipal) }}</span>
      </div>
    </div>

    <div class="schedule-controls">
      <div class="view-options">
        <button
          class="btn btn-outline"
          :class="{ active: viewMode === 'monthly' }"
          @click="viewMode = 'monthly'"
        >
          Monthly
        </button>
        <button
          class="btn btn-outline"
          :class="{ active: viewMode === 'yearly' }"
          @click="viewMode = 'yearly'"
        >
          Yearly
        </button>
      </div>
      
      <div class="search-box">
        <input
          v-model="searchYear"
          type="number"
          placeholder="Jump to year..."
          min="1"
          :max="Math.ceil(schedule.length / 12)"
          @input="handleYearJump"
        />
      </div>
    </div>

    <div class="schedule-table-container">
      <table class="schedule-table">
        <thead>
          <tr>
            <th>{{ viewMode === 'monthly' ? 'Payment #' : 'Year' }}</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Total Interest</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(entry, index) in displayedSchedule"
            :key="index"
            :class="{ 'highlight-row': entry.month % 12 === 0 }"
          >
            <td class="payment-number">
              {{ viewMode === 'monthly' ? entry.month : Math.ceil(entry.month / 12) }}
            </td>
            <td class="principal">{{ formatCurrency(entry.principalPayment) }}</td>
            <td class="interest">{{ formatCurrency(entry.interestPayment) }}</td>
            <td class="total-interest">{{ formatCurrency(entry.totalInterestPaid) }}</td>
            <td class="balance">{{ formatCurrency(entry.remainingBalance) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="schedule-pagination" v-if="viewMode === 'monthly' && totalPages > 1">
      <button
        class="btn btn-outline"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        Previous
      </button>
      
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      
      <button
        class="btn btn-outline"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        Next
      </button>
    </div>

    <div class="schedule-chart">
      <h4>Principal vs Interest Over Time</h4>
      <div class="chart-container">
        <canvas ref="chartCanvas" width="800" height="300"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { formatCurrency } from '@/utils/currency';
import type { AmortizationEntry } from '@/types';

interface Props {
  schedule: AmortizationEntry[];
}

const props = defineProps<Props>();

// Reactive state
const viewMode = ref<'monthly' | 'yearly'>('monthly');
const currentPage = ref(1);
const itemsPerPage = 12;
const searchYear = ref<number | null>(null);
const chartCanvas = ref<HTMLCanvasElement>();

// Computed properties
const totalInterest = computed(() => {
  if (props.schedule.length === 0) return 0;
  return props.schedule[props.schedule.length - 1].totalInterestPaid;
});

const totalPrincipal = computed(() => {
  return props.schedule.reduce((sum, entry) => sum + entry.principalPayment, 0);
});

const yearlySchedule = computed(() => {
  const yearly: AmortizationEntry[] = [];
  
  for (let year = 1; year <= Math.ceil(props.schedule.length / 12); year++) {
    const yearEntries = props.schedule.filter(entry => 
      entry.month > (year - 1) * 12 && entry.month <= year * 12
    );
    
    if (yearEntries.length > 0) {
      const lastEntry = yearEntries[yearEntries.length - 1];
      const yearPrincipal = yearEntries.reduce((sum, entry) => sum + entry.principalPayment, 0);
      const yearInterest = yearEntries.reduce((sum, entry) => sum + entry.interestPayment, 0);
      
      yearly.push({
        month: year * 12,
        principalPayment: yearPrincipal,
        interestPayment: yearInterest,
        remainingBalance: lastEntry.remainingBalance,
        totalInterestPaid: lastEntry.totalInterestPaid
      });
    }
  }
  
  return yearly;
});

const displayedSchedule = computed(() => {
  const schedule = viewMode.value === 'monthly' ? props.schedule : yearlySchedule.value;
  
  if (viewMode.value === 'monthly') {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return schedule.slice(start, end);
  }
  
  return schedule;
});

const totalPages = computed(() => {
  if (viewMode.value === 'yearly') return 1;
  return Math.ceil(props.schedule.length / itemsPerPage);
});

// Methods
function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function handleYearJump() {
  if (searchYear.value && searchYear.value >= 1) {
    const targetPage = Math.ceil((searchYear.value * 12) / itemsPerPage);
    goToPage(Math.min(targetPage, totalPages.value));
  }
}

function drawChart() {
  if (!chartCanvas.value || props.schedule.length === 0) return;
  
  const canvas = chartCanvas.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Chart dimensions
  const padding = 60;
  const chartWidth = canvas.width - 2 * padding;
  const chartHeight = canvas.height - 2 * padding;
  
  // Get data points (sample every 12 months for readability)
  const dataPoints = props.schedule.filter((_, index) => index % 12 === 11 || index === props.schedule.length - 1);
  const maxPayment = Math.max(...dataPoints.map(entry => entry.principalPayment + entry.interestPayment));
  
  // Draw axes
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  
  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.stroke();
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding, padding + chartHeight);
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.stroke();
  
  // Draw principal area
  ctx.fillStyle = 'rgba(37, 99, 235, 0.3)';
  ctx.beginPath();
  ctx.moveTo(padding, padding + chartHeight);
  
  dataPoints.forEach((entry, index) => {
    const x = padding + (index / (dataPoints.length - 1)) * chartWidth;
    const y = padding + chartHeight - (entry.principalPayment / maxPayment) * chartHeight;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.lineTo(padding, padding + chartHeight);
  ctx.fill();
  
  // Draw interest area
  ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
  ctx.beginPath();
  
  dataPoints.forEach((entry, index) => {
    const x = padding + (index / (dataPoints.length - 1)) * chartWidth;
    const principalY = padding + chartHeight - (entry.principalPayment / maxPayment) * chartHeight;
    const totalY = padding + chartHeight - ((entry.principalPayment + entry.interestPayment) / maxPayment) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, principalY);
    } else {
      ctx.lineTo(x, principalY);
    }
  });
  
  // Complete the interest area
  for (let i = dataPoints.length - 1; i >= 0; i--) {
    const entry = dataPoints[i];
    const x = padding + (i / (dataPoints.length - 1)) * chartWidth;
    const totalY = padding + chartHeight - ((entry.principalPayment + entry.interestPayment) / maxPayment) * chartHeight;
    ctx.lineTo(x, totalY);
  }
  
  ctx.fill();
  
  // Add labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  
  // X-axis labels (years)
  for (let i = 0; i < dataPoints.length; i += Math.ceil(dataPoints.length / 6)) {
    const x = padding + (i / (dataPoints.length - 1)) * chartWidth;
    const year = Math.ceil(dataPoints[i].month / 12);
    ctx.fillText(`Year ${year}`, x, padding + chartHeight + 20);
  }
  
  // Legend
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(37, 99, 235, 0.8)';
  ctx.fillRect(padding + chartWidth - 120, padding + 10, 15, 15);
  ctx.fillStyle = '#374151';
  ctx.fillText('Principal', padding + chartWidth - 100, padding + 22);
  
  ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
  ctx.fillRect(padding + chartWidth - 120, padding + 30, 15, 15);
  ctx.fillStyle = '#374151';
  ctx.fillText('Interest', padding + chartWidth - 100, padding + 42);
}

// Watch for changes and redraw chart
watch(() => props.schedule, drawChart, { deep: true });
watch(viewMode, () => {
  currentPage.value = 1;
});

onMounted(() => {
  drawChart();
});
</script>

<style scoped lang="scss">
.amortization-schedule {
  max-width: 100%;
}

.schedule-header {
  text-align: center;
  margin-bottom: 2rem;

  h4 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
    font-size: 1.5rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--text-secondary);
  }
}

.schedule-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .label {
      font-weight: 500;
      color: var(--text-secondary);
    }

    .value {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 1.1rem;
    }
  }
}

.schedule-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }

  .view-options {
    display: flex;
    gap: 0.5rem;

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

  .search-box input {
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    width: 150px;

    @media (max-width: 768px) {
      width: 100%;
    }
  }
}

.schedule-table-container {
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
}

.schedule-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface-color);

  th, td {
    padding: 0.75rem;
    text-align: right;
    border-bottom: 1px solid var(--border-color);

    &:first-child {
      text-align: left;
    }
  }

  th {
    background: var(--background-color);
    font-weight: 600;
    color: var(--text-primary);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  td {
    color: var(--text-secondary);

    &.payment-number {
      font-weight: 600;
      color: var(--text-primary);
    }

    &.principal {
      color: var(--primary-color);
      font-weight: 500;
    }

    &.interest {
      color: var(--danger-color);
      font-weight: 500;
    }

    &.balance {
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .highlight-row {
    background: var(--border-color);
    font-weight: 600;
  }
}

.schedule-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;

  .page-info {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}

.schedule-chart {
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);

  h4 {
    margin: 0 0 1rem 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
  }

  .chart-container {
    overflow-x: auto;
    
    canvas {
      max-width: 100%;
      height: auto;
    }
  }
}

// Dark theme adjustments
[data-theme="dark"] {
  .schedule-table th {
    background: var(--surface-color);
  }
}
</style>