// Component prop types and interfaces

import type { 
  MortgageInputs, 
  MortgageResults,
  CreditCard,
  Expense,
  Budget,
  WatchlistItem,
  Holding,
  Portfolio,
  ValidationError,
  LoadingState,
  Currency
} from './index';

// Shared component props
export interface BaseComponentProps {
  class?: string;
  style?: string | Record<string, any>;
}

// Input component props
export interface CurrencyInputProps extends BaseComponentProps {
  modelValue: number;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: string;
  min?: number;
  max?: number;
  currency?: Currency;
}

export interface PercentageInputProps extends BaseComponentProps {
  modelValue: number;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: string;
  min?: number;
  max?: number;
  decimals?: number;
}

export interface DatePickerProps extends BaseComponentProps {
  modelValue: Date | null;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  error?: string;
  minDate?: Date;
  maxDate?: Date;
}

// Display component props
export interface MetricCardProps extends BaseComponentProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  loading?: boolean;
}

export interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export interface PriceDisplayProps extends BaseComponentProps {
  price: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  showChange?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Mortgage component props
export interface MortgageInputFormProps extends BaseComponentProps {
  modelValue: MortgageInputs;
  loading?: boolean;
  errors?: ValidationError[];
}

export interface MortgageResultsProps extends BaseComponentProps {
  results: MortgageResults | null;
  loading?: boolean;
}

// Expense component props
export interface CreditCardListProps extends BaseComponentProps {
  cards: CreditCard[];
  loading?: boolean;
  onEdit?: (card: CreditCard) => void;
  onDelete?: (cardId: string) => void;
  onMakePayment?: (cardId: string) => void;
}

export interface ExpenseFormProps extends BaseComponentProps {
  modelValue: Partial<Expense>;
  creditCards: CreditCard[];
  categories: string[];
  loading?: boolean;
  errors?: ValidationError[];
}

export interface BudgetOverviewProps extends BaseComponentProps {
  budgets: Budget[];
  loading?: boolean;
  onEditBudget?: (category: string) => void;
}

// Investment component props
export interface WatchlistProps extends BaseComponentProps {
  items: WatchlistItem[];
  loading?: boolean;
  onRemove?: (symbol: string) => void;
  onAddToPortfolio?: (symbol: string) => void;
}

export interface PortfolioSummaryProps extends BaseComponentProps {
  portfolio: Portfolio;
  loading?: boolean;
}

export interface HoldingsListProps extends BaseComponentProps {
  holdings: Holding[];
  loading?: boolean;
  onEdit?: (holding: Holding) => void;
  onRemove?: (holdingId: string) => void;
}

export interface SearchBarProps extends BaseComponentProps {
  placeholder?: string;
  loading?: boolean;
  onSearch?: (query: string) => void;
  onSelect?: (result: any) => void;
}

// Navigation component props
export interface SidebarProps extends BaseComponentProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export interface TabNavigationProps extends BaseComponentProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
  }>;
  activeTab: string;
  onTabChange?: (tabId: string) => void;
}

// Form component props
export interface FormProps extends BaseComponentProps {
  loading?: boolean;
  errors?: ValidationError[];
  onSubmit?: (data: any) => void;
  onReset?: () => void;
}

// Modal component props
export interface ModalProps extends BaseComponentProps {
  show: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  onClose?: () => void;
}

// Table component props
export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any, row: any) => string;
}

export interface TableProps extends BaseComponentProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  onRowClick?: (row: any, index: number) => void;
}

// Chart component props
export interface ChartProps extends BaseComponentProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  title?: string;
  height?: number;
  loading?: boolean;
  options?: any;
}