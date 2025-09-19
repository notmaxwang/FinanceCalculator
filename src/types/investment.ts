// Investment Portfolio Types

export interface WatchlistItem {
  symbol: string;
  name: string;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
  type: 'stock' | 'crypto';
  addedAt: Date;
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  purchaseDate: Date;
  type: 'stock' | 'crypto';
}

export interface Portfolio {
  totalValue: number;
  dailyGainLoss: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdings: Holding[];
  lastUpdated: Date;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  lastUpdated: Date;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  exchange?: string;
}