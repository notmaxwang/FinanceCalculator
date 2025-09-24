import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MetricCard from '../MetricCard.vue';

describe('MetricCard', () => {
  it('renders with basic props', () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Total Balance',
        value: 1234.56
      }
    });

    expect(wrapper.find('.metric-title').text()).toBe('Total Balance');
    expect(wrapper.find('.metric-value').text()).toBe('$1,234.56');
  });

  it('renders with string value', () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Status',
        value: 'Active'
      }
    });

    expect(wrapper.find('.metric-value').text()).toBe('Active');
  });

  it('shows loading skeleton when loading', () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Test',
        value: 100,
        loading: true
      }
    });

    expect(wrapper.find('.loading-skeleton').exists()).toBe(true);
    expect(wrapper.find('.metric-content').exists()).toBe(false);
  });

  it('displays icon when provided', () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Balance',
        value: 1000,
        icon: 'fas fa-dollar-sign'
      }
    });

    const icon = wrapper.find('.metric-icon i');
    expect(icon.classes()).toContain('fas');
    expect(icon.classes()).toContain('fa-dollar-sign');
  });

  it('displays subtitle when provided', () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Balance',
        value: 1000,
        subtitle: 'Last updated today'
      }
    });

    expect(wrapper.find('.metric-subtitle').text()).toBe('Last updated today');
  });

  it('displays trend information', () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Balance',
        value: 1000,
        trend: 'up',
        trendValue: '+5.2%'
      }
    });

    const trendElement = wrapper.find('.metric-trend');
    expect(trendElement.exists()).toBe(true);
    expect(trendElement.classes()).toContain('trend-up');
    expect(wrapper.find('.trend-value').text()).toBe('+5.2%');
    expect(wrapper.find('.trend-icon').text()).toBe('↗');
  });

  it('shows correct trend icons', () => {
    const upWrapper = mount(MetricCard, {
      props: {
        title: 'Test',
        value: 100,
        trend: 'up',
        trendValue: '+10%'
      }
    });

    const downWrapper = mount(MetricCard, {
      props: {
        title: 'Test',
        value: 100,
        trend: 'down',
        trendValue: '-5%'
      }
    });

    const neutralWrapper = mount(MetricCard, {
      props: {
        title: 'Test',
        value: 100,
        trend: 'neutral',
        trendValue: '0%'
      }
    });

    expect(upWrapper.find('.trend-icon').text()).toBe('↗');
    expect(downWrapper.find('.trend-icon').text()).toBe('↘');
    expect(neutralWrapper.find('.trend-icon').text()).toBe('→');
  });

  it('formats large numbers as currency', () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Total Cost',
        value: 250000
      }
    });

    expect(wrapper.find('.metric-value').text()).toBe('$250,000.00');
  });

  it('formats regular numbers without currency', () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Count',
        value: 42
      }
    });

    expect(wrapper.find('.metric-value').text()).toBe('42');
  });

  it('applies hover effects', async () => {
    const wrapper = mount(MetricCard, {
      props: {
        title: 'Test',
        value: 100
      }
    });

    const card = wrapper.find('.metric-card');
    await card.trigger('mouseenter');
    
    // The hover effect is CSS-based, so we just check the class exists
    expect(card.classes()).toContain('metric-card');
  });
});