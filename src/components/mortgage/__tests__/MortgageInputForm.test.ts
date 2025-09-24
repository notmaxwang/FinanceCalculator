import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MortgageInputForm from '../MortgageInputForm.vue';
import type { MortgageInputs } from '@/types';

describe('MortgageInputForm', () => {
  const defaultInputs: MortgageInputs = {
    loanAmount: 300000,
    downPayment: 60000,
    interestRate: 4.5,
    loanTermYears: 30,
    propertyTax: 6000,
    homeInsurance: 1200,
    pmiRate: 0.5
  };

  it('renders with default inputs', () => {
    const wrapper = mount(MortgageInputForm, {
      props: {
        modelValue: defaultInputs,
        errors: []
      }
    });

    expect(wrapper.find('h2').text()).toBe('Mortgage Calculator');
    expect(wrapper.find('.mortgage-form').exists()).toBe(true);
  });

  it('shows PMI section when down payment is less than 20%', async () => {
    const wrapper = mount(MortgageInputForm, {
      props: {
        modelValue: defaultInputs,
        errors: []
      }
    });

    // With 60k down payment on 300k loan (20%), PMI should not be shown initially
    expect(wrapper.find('.pmi-info').exists()).toBe(false);

    // Change down payment to less than 20%
    const lowDownPaymentInputs = { ...defaultInputs, downPayment: 30000 }; // 10%
    await wrapper.setProps({ modelValue: lowDownPaymentInputs });

    expect(wrapper.find('.pmi-info').exists()).toBe(true);
  });

  it('calculates loan summary correctly', () => {
    const wrapper = mount(MortgageInputForm, {
      props: {
        modelValue: defaultInputs,
        errors: []
      }
    });

    const summaryItems = wrapper.findAll('.summary-item');
    expect(summaryItems.length).toBeGreaterThan(0);
    
    // Check that loan amount is calculated correctly (300k - 60k = 240k)
    const loanAmountText = summaryItems[0].text();
    expect(loanAmountText).toContain('$240,000.00');
  });

  it('emits update when inputs change', async () => {
    const wrapper = mount(MortgageInputForm, {
      props: {
        modelValue: defaultInputs,
        errors: []
      }
    });

    // Simulate form submission
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('submit')).toBeTruthy();
    expect(wrapper.emitted('submit')?.[0]).toEqual([defaultInputs]);
  });

  it('shows validation errors', () => {
    const errors = [
      { field: 'loanAmount', message: 'Loan amount is required' },
      { field: 'interestRate', message: 'Interest rate must be greater than 0' }
    ];

    const wrapper = mount(MortgageInputForm, {
      props: {
        modelValue: defaultInputs,
        errors
      }
    });

    const errorMessages = wrapper.findAll('.error-message');
    expect(errorMessages.length).toBe(2);
    expect(errorMessages[0].text()).toBe('Loan amount is required');
    expect(errorMessages[1].text()).toBe('Interest rate must be greater than 0');
  });

  it('disables submit button when form is invalid', () => {
    const wrapper = mount(MortgageInputForm, {
      props: {
        modelValue: defaultInputs,
        errors: [{ field: 'loanAmount', message: 'Invalid amount' }]
      }
    });

    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.attributes('disabled')).toBeDefined();
  });

  it('shows loading state', () => {
    const wrapper = mount(MortgageInputForm, {
      props: {
        modelValue: defaultInputs,
        errors: [],
        loading: true
      }
    });

    const submitButton = wrapper.find('button[type="submit"]');
    expect(submitButton.text()).toBe('Calculating...');
    expect(submitButton.attributes('disabled')).toBeDefined();
  });
});