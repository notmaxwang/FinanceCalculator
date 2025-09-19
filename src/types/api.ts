// API-related types and interfaces

import type { MarketData, SearchResult } from './investment';

// External API response types
export interface AlphaVantageResponse {
  'Global Quote': {
    '01. symbol': string;
    '05. price': string;
    '09. change': string;
    '10. change percent': string;
  };
}

export interface YahooFinanceResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
      };
    }>;
  };
}

export interface CryptoApiResponse {
  data: {
    [symbol: string]: {
      quote: {
        USD: {
          price: number;
          percent_change_24h: number;
          market_cap: number;
          volume_24h: number;
        };
      };
    };
  };
}

// Internal API types
export interface MarketDataRequest {
  symbols: string[];
  type: 'stock' | 'crypto';
}

export interface SearchRequest {
  query: string;
  type?: 'stock' | 'crypto' | 'all';
  limit?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Service response types
export type MarketDataResponse = MarketData[];
export type SearchResponse = SearchResult[];

// API configuration
export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  retryAttempts: number;
}