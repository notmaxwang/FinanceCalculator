// Investment portfolio store

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { storageService } from '@/services/storage';
import { validateHolding } from '@/utils/validation';
import type { 
  WatchlistItem, 
  Holding, 
  Portfolio, 
  MarketData,
  SearchResult,
  LoadingState 
} from '@/types';

export const useInvestmentStore = defineStore('investment', () => {
  // State
  const watchlist = ref<WatchlistItem[]>([]);
  const holdings = ref<Holding[]>([]);
  const marketData = ref<Map<string, MarketData>>(new Map());
  const loadingState = ref<LoadingState>('idle');
  const lastUpdated = ref<Date | null>(null);

  // Getters
  const portfolio = computed((): Portfolio => {
    const totalValue = holdings.value.reduce((sum, holding) => sum + holding.currentValue, 0);
    const totalCost = holdings.value.reduce((sum, holding) => sum + (holding.quantity * holding.purchasePrice), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // Calculate daily gain/loss (simplified - would need previous day's data in real app)
    const dailyGainLoss = holdings.value.reduce((sum, holding) => {
      const dailyChange = holding.currentPrice * (holding.quantity * 0.01); // Placeholder calculation
      return sum + dailyChange;
    }, 0);

    return {
      totalValue,
      dailyGainLoss,
      totalGainLoss,
      totalGainLossPercent,
      holdings: holdings.value,
      lastUpdated: lastUpdated.value || new Date()
    };
  });

  const watchlistWithCurrentPrices = computed(() => {
    return watchlist.value.map(item => {
      const currentMarketData = marketData.value.get(item.symbol);
      if (currentMarketData) {
        return {
          ...item,
          currentPrice: currentMarketData.price,
          dailyChange: currentMarketData.change,
          dailyChangePercent: currentMarketData.changePercent
        };
      }
      return item;
    });
  });

  const topPerformers = computed(() => {
    return holdings.value
      .filter(holding => holding.gainLossPercent > 0)
      .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
      .slice(0, 5);
  });

  const topLosers = computed(() => {
    return holdings.value
      .filter(holding => holding.gainLossPercent < 0)
      .sort((a, b) => a.gainLossPercent - b.gainLossPercent)
      .slice(0, 5);
  });

  const portfolioAllocation = computed(() => {
    const totalValue = portfolio.value.totalValue;
    if (totalValue === 0) return [];

    return holdings.value.map(holding => ({
      symbol: holding.symbol,
      value: holding.currentValue,
      percentage: (holding.currentValue / totalValue) * 100
    }));
  });

  // Actions
  function addToWatchlist(symbol: string, name: string, type: 'stock' | 'crypto'): boolean {
    // Check if already in watchlist
    if (watchlist.value.some(item => item.symbol === symbol)) {
      return false;
    }

    const newItem: WatchlistItem = {
      symbol: symbol.toUpperCase(),
      name,
      currentPrice: 0, // Will be updated by market data
      dailyChange: 0,
      dailyChangePercent: 0,
      type,
      addedAt: new Date()
    };

    watchlist.value.push(newItem);
    saveInvestmentData();
    
    // Fetch current price
    fetchMarketData([symbol]);
    
    return true;
  }

  function removeFromWatchlist(symbol: string): boolean {
    const index = watchlist.value.findIndex(item => item.symbol === symbol);
    if (index === -1) return false;

    watchlist.value.splice(index, 1);
    saveInvestmentData();
    
    return true;
  }

  function addHolding(holdingData: Omit<Holding, 'id' | 'currentValue' | 'gainLoss' | 'gainLossPercent'>): string | null {
    const validation = validateHolding(holdingData);
    if (!validation.isValid) {
      console.error('Invalid holding data:', validation.errors);
      return null;
    }

    const newHolding: Holding = {
      ...holdingData,
      id: `holding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentValue: holdingData.quantity * holdingData.currentPrice,
      gainLoss: (holdingData.currentPrice - holdingData.purchasePrice) * holdingData.quantity,
      gainLossPercent: holdingData.purchasePrice > 0 
        ? ((holdingData.currentPrice - holdingData.purchasePrice) / holdingData.purchasePrice) * 100 
        : 0
    };

    holdings.value.push(newHolding);
    saveInvestmentData();
    
    // Fetch current price
    fetchMarketData([holdingData.symbol]);
    
    return newHolding.id;
  }

  function updateHolding(id: string, updates: Partial<Holding>): boolean {
    const holdingIndex = holdings.value.findIndex(holding => holding.id === id);
    if (holdingIndex === -1) return false;

    const updatedHolding = { ...holdings.value[holdingIndex], ...updates };
    
    // Recalculate derived values
    updatedHolding.currentValue = updatedHolding.quantity * updatedHolding.currentPrice;
    updatedHolding.gainLoss = (updatedHolding.currentPrice - updatedHolding.purchasePrice) * updatedHolding.quantity;
    updatedHolding.gainLossPercent = updatedHolding.purchasePrice > 0 
      ? ((updatedHolding.currentPrice - updatedHolding.purchasePrice) / updatedHolding.purchasePrice) * 100 
      : 0;

    const validation = validateHolding(updatedHolding);
    if (!validation.isValid) {
      console.error('Invalid holding updates:', validation.errors);
      return false;
    }

    holdings.value[holdingIndex] = updatedHolding;
    saveInvestmentData();
    
    return true;
  }

  function removeHolding(id: string): boolean {
    const index = holdings.value.findIndex(holding => holding.id === id);
    if (index === -1) return false;

    holdings.value.splice(index, 1);
    saveInvestmentData();
    
    return true;
  }

  function updateMarketData(symbol: string, data: MarketData) {
    marketData.value.set(symbol, data);
    
    // Update watchlist items
    const watchlistItem = watchlist.value.find(item => item.symbol === symbol);
    if (watchlistItem) {
      watchlistItem.currentPrice = data.price;
      watchlistItem.dailyChange = data.change;
      watchlistItem.dailyChangePercent = data.changePercent;
    }

    // Update holdings
    const holding = holdings.value.find(h => h.symbol === symbol);
    if (holding) {
      holding.currentPrice = data.price;
      holding.currentValue = holding.quantity * data.price;
      holding.gainLoss = (data.price - holding.purchasePrice) * holding.quantity;
      holding.gainLossPercent = holding.purchasePrice > 0 
        ? ((data.price - holding.purchasePrice) / holding.purchasePrice) * 100 
        : 0;
    }

    lastUpdated.value = new Date();
    saveInvestmentData();
  }

  async function fetchMarketData(symbols: string[]): Promise<boolean> {
    if (symbols.length === 0) return true;

    try {
      setLoadingState('loading');
      
      // This is a mock implementation - in a real app, you'd call an actual API
      // For now, we'll simulate market data
      const mockData = symbols.map(symbol => ({
        symbol,
        price: Math.random() * 1000 + 10, // Random price between $10-$1010
        change: (Math.random() - 0.5) * 20, // Random change between -$10 and +$10
        changePercent: (Math.random() - 0.5) * 10, // Random change between -5% and +5%
        volume: Math.floor(Math.random() * 1000000),
        marketCap: Math.floor(Math.random() * 1000000000),
        lastUpdated: new Date()
      }));

      mockData.forEach(data => {
        updateMarketData(data.symbol, data);
      });

      setLoadingState('success');
      return true;
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      setLoadingState('error');
      return false;
    }
  }

  async function refreshAllMarketData(): Promise<boolean> {
    const allSymbols = [
      ...watchlist.value.map(item => item.symbol),
      ...holdings.value.map(holding => holding.symbol)
    ];

    const uniqueSymbols = [...new Set(allSymbols)];
    return await fetchMarketData(uniqueSymbols);
  }

  async function searchInvestments(query: string): Promise<SearchResult[]> {
    try {
      setLoadingState('loading');
      
      // Mock search results - in a real app, you'd call an actual search API
      const mockResults: SearchResult[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' as const, exchange: 'NASDAQ' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' as const, exchange: 'NASDAQ' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock' as const, exchange: 'NASDAQ' },
        { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' as const },
        { symbol: 'ETH', name: 'Ethereum', type: 'crypto' as const }
      ].filter(result => 
        result.symbol.toLowerCase().includes(query.toLowerCase()) ||
        result.name.toLowerCase().includes(query.toLowerCase())
      );

      setLoadingState('success');
      return mockResults;
    } catch (error) {
      console.error('Failed to search investments:', error);
      setLoadingState('error');
      return [];
    }
  }

  function setLoadingState(state: LoadingState) {
    loadingState.value = state;
  }

  function saveInvestmentData(): boolean {
    const success = storageService.setItem('watchlist', watchlist.value, true) &&
                   storageService.setItem('holdings', holdings.value, true);
    
    return success;
  }

  function loadInvestmentData(): boolean {
    try {
      const storedWatchlist = storageService.getItem<WatchlistItem[]>('watchlist', [], true);
      const storedHoldings = storageService.getItem<Holding[]>('holdings', [], true);

      if (Array.isArray(storedWatchlist)) {
        watchlist.value = storedWatchlist.map(item => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));
      }

      if (Array.isArray(storedHoldings)) {
        holdings.value = storedHoldings.map(holding => ({
          ...holding,
          purchaseDate: new Date(holding.purchaseDate)
        }));
      }

      return true;
    } catch (error) {
      console.error('Failed to load investment data:', error);
      return false;
    }
  }

  // Initialize store
  function initialize() {
    loadInvestmentData();
    
    // Refresh market data on initialization
    refreshAllMarketData();
  }

  return {
    // State
    watchlist,
    holdings,
    marketData,
    loadingState,
    lastUpdated,
    
    // Getters
    portfolio,
    watchlistWithCurrentPrices,
    topPerformers,
    topLosers,
    portfolioAllocation,
    
    // Actions
    addToWatchlist,
    removeFromWatchlist,
    addHolding,
    updateHolding,
    removeHolding,
    updateMarketData,
    fetchMarketData,
    refreshAllMarketData,
    searchInvestments,
    setLoadingState,
    saveInvestmentData,
    loadInvestmentData,
    initialize
  };
});