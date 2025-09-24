// Market data service for fetching stock and crypto prices

import type { MarketData, SearchResult, ApiResponse } from '@/types';

// Mock market data service - in a real app, this would connect to actual APIs
export class MarketDataService {
  private baseUrl = 'https://api.example.com'; // Placeholder URL
  private apiKey = import.meta.env.VITE_MARKET_API_KEY || '';
  private cache = new Map<string, { data: MarketData; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch current market data for given symbols
   */
  async fetchMarketData(symbols: string[]): Promise<MarketData[]> {
    const results: MarketData[] = [];
    
    for (const symbol of symbols) {
      try {
        // Check cache first
        const cached = this.getCachedData(symbol);
        if (cached) {
          results.push(cached);
          continue;
        }

        // In a real implementation, this would make actual API calls
        const mockData = this.generateMockData(symbol);
        
        // Cache the result
        this.setCachedData(symbol, mockData);
        results.push(mockData);
        
        // Add small delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to fetch data for ${symbol}:`, error);
        // Return stale data or default values on error
        const fallbackData = this.getFallbackData(symbol);
        results.push(fallbackData);
      }
    }

    return results;
  }

  /**
   * Search for stocks and cryptocurrencies
   */
  async searchInvestments(query: string, type?: 'stock' | 'crypto'): Promise<SearchResult[]> {
    try {
      // Mock search results - in a real app, this would query an actual search API
      const mockResults = this.getMockSearchResults(query, type);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return mockResults;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Get cached data if available and not expired
   */
  private getCachedData(symbol: string): MarketData | null {
    const cached = this.cache.get(symbol);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(symbol);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache market data with timestamp
   */
  private setCachedData(symbol: string, data: MarketData): void {
    this.cache.set(symbol, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Generate mock market data for testing
   */
  private generateMockData(symbol: string): MarketData {
    // Base prices for common symbols
    const basePrices: Record<string, number> = {
      'AAPL': 175,
      'GOOGL': 140,
      'MSFT': 380,
      'AMZN': 145,
      'TSLA': 250,
      'NVDA': 480,
      'META': 320,
      'NFLX': 450,
      'BTC': 45000,
      'ETH': 2800,
      'ADA': 0.45,
      'DOT': 6.5,
      'SOL': 95
    };

    const basePrice = basePrices[symbol] || Math.random() * 200 + 50;
    
    // Add some realistic price movement
    const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
    const currentPrice = basePrice * (1 + changePercent / 100);
    const change = currentPrice - basePrice;

    return {
      symbol,
      price: Math.round(currentPrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
      lastUpdated: new Date()
    };
  }

  /**
   * Get fallback data when API fails
   */
  private getFallbackData(symbol: string): MarketData {
    return {
      symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Generate mock search results
   */
  private getMockSearchResults(query: string, type?: 'stock' | 'crypto'): SearchResult[] {
    const allResults: SearchResult[] = [
      // Stocks
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', exchange: 'NASDAQ' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', exchange: 'NASDAQ' },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', exchange: 'NASDAQ' },
      { symbol: 'NFLX', name: 'Netflix Inc.', type: 'stock', exchange: 'NASDAQ' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock', exchange: 'NYSE' },
      { symbol: 'V', name: 'Visa Inc.', type: 'stock', exchange: 'NYSE' },
      
      // Cryptocurrencies
      { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
      { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
      { symbol: 'ADA', name: 'Cardano', type: 'crypto' },
      { symbol: 'DOT', name: 'Polkadot', type: 'crypto' },
      { symbol: 'SOL', name: 'Solana', type: 'crypto' },
      { symbol: 'MATIC', name: 'Polygon', type: 'crypto' },
      { symbol: 'AVAX', name: 'Avalanche', type: 'crypto' },
      { symbol: 'LINK', name: 'Chainlink', type: 'crypto' }
    ];

    // Filter by type if specified
    let filteredResults = type ? allResults.filter(r => r.type === type) : allResults;

    // Filter by query
    const queryLower = query.toLowerCase();
    filteredResults = filteredResults.filter(result => 
      result.symbol.toLowerCase().includes(queryLower) ||
      result.name.toLowerCase().includes(queryLower)
    );

    // Limit results
    return filteredResults.slice(0, 10);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; symbols: string[] } {
    return {
      size: this.cache.size,
      symbols: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const marketDataService = new MarketDataService();

// Helper functions for real API integration (commented out for mock implementation)

/**
 * Alpha Vantage API integration (example)
 */
/*
async function fetchFromAlphaVantage(symbol: string): Promise<MarketData> {
  const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  const quote = data['Global Quote'];
  return {
    symbol: quote['01. symbol'],
    price: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
    lastUpdated: new Date()
  };
}
*/

/**
 * Yahoo Finance API integration (example)
 */
/*
async function fetchFromYahooFinance(symbol: string): Promise<MarketData> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  const result = data.chart.result[0];
  const meta = result.meta;
  
  return {
    symbol: meta.symbol,
    price: meta.regularMarketPrice,
    change: meta.regularMarketPrice - meta.previousClose,
    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
    volume: meta.regularMarketVolume,
    lastUpdated: new Date()
  };
}
*/

/**
 * CoinGecko API integration for crypto (example)
 */
/*
async function fetchFromCoinGecko(symbol: string): Promise<MarketData> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  const coinData = data[symbol];
  return {
    symbol: symbol.toUpperCase(),
    price: coinData.usd,
    change: coinData.usd_24h_change || 0,
    changePercent: coinData.usd_24h_change || 0,
    volume: coinData.usd_24h_vol || 0,
    marketCap: coinData.usd_market_cap || 0,
    lastUpdated: new Date()
  };
}
*/