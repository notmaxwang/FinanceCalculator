<template>
  <div class="form-group" :class="{ error: !!error }">
    <label v-if="label" :for="inputId">{{ label }}</label>
    <div class="currency-input-wrapper">
      <span class="currency-symbol">{{ currencySymbol }}</span>
      <input
        :id="inputId"
        ref="inputRef"
        type="text"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :class="{ error: !!error }"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { formatCurrency, parseCurrency, getCurrencySymbol, isValidCurrencyAmount } from '@/utils/currency';
import type { CurrencyInputProps } from '@/types';

const props = withDefaults(defineProps<CurrencyInputProps>(), {
  currency: 'USD',
  placeholder: '0.00',
  disabled: false,
  readonly: false,
  min: 0,
  max: Number.MAX_SAFE_INTEGER
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const inputRef = ref<HTMLInputElement>();
const isFocused = ref(false);
const inputId = `currency-input-${Math.random().toString(36).substr(2, 9)}`;

const currencySymbol = computed(() => getCurrencySymbol(props.currency));

const displayValue = computed(() => {
  if (isFocused.value) {
    // Show raw number when focused for easier editing
    return props.modelValue === 0 ? '' : props.modelValue.toString();
  }
  // Show formatted currency when not focused
  return props.modelValue === 0 ? '' : formatCurrency(props.modelValue, props.currency);
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  
  // Allow empty input
  if (value === '') {
    emit('update:modelValue', 0);
    return;
  }

  // Parse the input value
  const numericValue = parseCurrency(value);
  
  // Validate range
  if (numericValue < props.min || numericValue > props.max) {
    return; // Don't update if out of range
  }

  emit('update:modelValue', numericValue);
};

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true;
  emit('focus', event);
};

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false;
  
  // Validate the final value
  const target = event.target as HTMLInputElement;
  if (!isValidCurrencyAmount(target.value) && target.value !== '') {
    // Reset to previous valid value
    target.value = displayValue.value;
  }
  
  emit('blur', event);
};

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (inputRef.value && !isFocused.value) {
    inputRef.value.value = displayValue.value;
  }
});
</script>

<style scoped lang="scss">
.currency-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .currency-symbol {
    position: absolute;
    left: 0.75rem;
    color: var(--text-secondary);
    font-weight: 500;
    z-index: 1;
    pointer-events: none;
  }

  input {
    padding-left: 2rem;
    
    &:focus {
      .currency-symbol {
        color: var(--primary-color);
      }
    }
  }
}

.form-group.error {
  .currency-input-wrapper input {
    border-color: var(--danger-color);
  }
  
  .currency-symbol {
    color: var(--danger-color);
  }
}
</style>