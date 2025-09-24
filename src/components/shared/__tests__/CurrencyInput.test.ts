import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CurrencyInput from '../CurrencyInput.vue';

describe('CurrencyInput', () => {
  it('renders with default props', () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 0
      }
    });

    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('.currency-symbol').text()).toBe('$');
  });

  it('displays formatted currency when not focused', async () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 1234.56
      }
    });

    const input = wrapper.find('input');
    expect(input.element.value).toBe('$1,234.56');
  });

  it('displays raw number when focused', async () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 1234.56
      }
    });

    const input = wrapper.find('input');
    await input.trigger('focus');
    
    expect(input.element.value).toBe('1234.56');
  });

  it('emits update:modelValue when input changes', async () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 0
      }
    });

    const input = wrapper.find('input');
    await input.setValue('1000');
    await input.trigger('input');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1000]);
  });

  it('shows label when provided', () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 0,
        label: 'Amount'
      }
    });

    expect(wrapper.find('label').text()).toBe('Amount');
  });

  it('shows error message when error prop is provided', () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 0,
        error: 'Invalid amount'
      }
    });

    expect(wrapper.find('.error-message').text()).toBe('Invalid amount');
    expect(wrapper.find('.form-group').classes()).toContain('error');
  });

  it('respects min and max constraints', async () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 50,
        min: 10,
        max: 100
      }
    });

    const input = wrapper.find('input');
    
    // Try to set value below minimum
    await input.setValue('5');
    await input.trigger('input');
    
    // Should not emit update since it's below minimum
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('handles different currency types', () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 1000,
        currency: 'EUR'
      }
    });

    expect(wrapper.find('.currency-symbol').text()).toBe('€');
  });

  it('handles disabled state', () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 0,
        disabled: true
      }
    });

    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
  });

  it('handles readonly state', () => {
    const wrapper = mount(CurrencyInput, {
      props: {
        modelValue: 0,
        readonly: true
      }
    });

    const input = wrapper.find('input');
    expect(input.attributes('readonly')).toBeDefined();
  });
});