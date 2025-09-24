import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ProgressBar from '../ProgressBar.vue';

describe('ProgressBar', () => {
  it('renders with basic props', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 50,
        max: 100
      }
    });

    const progressFill = wrapper.find('.progress-fill');
    expect(progressFill.attributes('style')).toContain('width: 50%');
  });

  it('calculates percentage correctly', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 75,
        max: 150
      }
    });

    const progressFill = wrapper.find('.progress-fill');
    expect(progressFill.attributes('style')).toContain('width: 50%'); // 75/150 = 50%
  });

  it('handles zero max value', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 50,
        max: 0
      }
    });

    const progressFill = wrapper.find('.progress-fill');
    expect(progressFill.attributes('style')).toContain('width: 0%');
  });

  it('caps percentage at 100%', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 150,
        max: 100
      }
    });

    const progressFill = wrapper.find('.progress-fill');
    expect(progressFill.attributes('style')).toContain('width: 100%');
  });

  it('shows label when provided', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 50,
        max: 100,
        label: 'Progress'
      }
    });

    expect(wrapper.find('.label-text').text()).toBe('Progress');
  });

  it('shows percentage when showPercentage is true', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 75,
        max: 100,
        showPercentage: true
      }
    });

    expect(wrapper.find('.progress-percentage').text()).toBe('75%');
  });

  it('shows percentage in label when both label and showPercentage are provided', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 60,
        max: 100,
        label: 'Budget Used',
        showPercentage: true
      }
    });

    expect(wrapper.find('.label-text').text()).toBe('Budget Used');
    expect(wrapper.find('.label-percentage').text()).toBe('60%');
    expect(wrapper.find('.progress-percentage').exists()).toBe(false);
  });

  it('applies correct color class', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 50,
        max: 100,
        color: 'success'
      }
    });

    expect(wrapper.find('.progress-bar').classes()).toContain('progress-success');
  });

  it('applies correct size class', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 50,
        max: 100,
        size: 'lg'
      }
    });

    expect(wrapper.find('.progress-bar-container').classes()).toContain('progress-lg');
  });

  it('has proper accessibility attributes', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 75,
        max: 100
      }
    });

    const progressFill = wrapper.find('.progress-fill');
    expect(progressFill.attributes('role')).toBe('progressbar');
    expect(progressFill.attributes('aria-valuenow')).toBe('75');
    expect(progressFill.attributes('aria-valuemin')).toBe('0');
    expect(progressFill.attributes('aria-valuemax')).toBe('100');
  });

  it('handles different color variants', () => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'danger'];
    
    colors.forEach(color => {
      const wrapper = mount(ProgressBar, {
        props: {
          value: 50,
          max: 100,
          color: color as any
        }
      });

      expect(wrapper.find('.progress-bar').classes()).toContain(`progress-${color}`);
    });
  });

  it('handles different size variants', () => {
    const sizes = ['sm', 'md', 'lg'];
    
    sizes.forEach(size => {
      const wrapper = mount(ProgressBar, {
        props: {
          value: 50,
          max: 100,
          size: size as any
        }
      });

      expect(wrapper.find('.progress-bar-container').classes()).toContain(`progress-${size}`);
    });
  });

  it('rounds percentage to nearest integer', () => {
    const wrapper = mount(ProgressBar, {
      props: {
        value: 33.7,
        max: 100,
        showPercentage: true
      }
    });

    expect(wrapper.find('.progress-percentage').text()).toBe('34%');
  });
});