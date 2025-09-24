<template>
  <div class="form-group" :class="{ error: !!error }">
    <label v-if="label" :for="inputId">{{ label }}</label>
    <div class="percentage-input-wrapper">
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
      <span class="percentage-symbol">%</span>
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { formatPercentage, parsePercentage, isValidPercentage } from '@/utils/currency';
import type { PercentageInputProps } from '@/types';

const props = withDefaults(defineProps<PercentageInputProps>(), {
  placeholder: '0.00',
  disabled: false,
  readonly: false,
  min: 0,
  max: 100,
  decimals: 2
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const inputRef = ref<HTMLInputElement>();
const isFocused = ref(false);
const inputId = `percentage-input-${Math.random().toString(36).substr(2, 9)}`;

const displayValue = computed(() => {
  if (isFocused.value) {
    // Show raw number when focused for easier editing
    return props.modelValue === 0 ? '' : props.modelValue.toFixed(props.decimals);
  }
  // Show formatted percentage when not focused
  return props.modelValue === 0 ? '' : props.modelValue.toFixed(props.decimals);
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
  const numericValue = parsePercentage(value);
  
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
  if (!isValidPercentage(target.value) && target.value !== '') {
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
.percentage-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .percentage-symbol {
    position: absolute;
    right: 0.75rem;
    color: var(--text-secondary);
    font-weight: 500;
    z-index: 1;
    pointer-events: none;
  }

  input {
    padding-right: 2rem;
    
    &:focus + .percentage-symbol {
      color: var(--primary-color);
    }
  }
}

.form-group.error {
  .percentage-input-wrapper input {
    border-color: var(--danger-color);
  }
  
  .percentage-symbol {
    color: var(--danger-color);
  }
}
</style>