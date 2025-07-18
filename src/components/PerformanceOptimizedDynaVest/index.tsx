"use client";

import React, { useState, useMemo, useCallback, useEffect, memo, lazy, Suspense } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { ContractInteractionForm } from '../ContractInteraction/ContractInteractionForm';

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Memoized strategy card to prevent unnecessary re-renders
const MemoizedStrategyCard = memo(({ strategy, index }: { strategy: any, index: number }) => (
  <div 
    data-testid={`strategy-card-virtualized-${index}`}
    className="p-4 border rounded mb-2"
  >
    <h3>{strategy.name}</h3>
    <p>Risk Level: {strategy.risk_level}</p>
    <img 
      data-testid="lazy-image"
      src={`/strategy-${strategy.id}.jpg`}
      loading="lazy"
      alt={strategy.name}
      className="w-full h-32 object-cover"
    />
  </div>
));

// Debounced hook for API calls
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Simple cache implementation
const apiCache = new Map<string, any>();

interface PerformanceOptimizedDynaVestProps {
  strategies?: any[];
  onApiCall?: (query: string) => Promise<any>;
}

export const PerformanceOptimizedDynaVest = memo(({ 
  strategies = [], 
  onApiCall 
}: PerformanceOptimizedDynaVestProps) => {
  const { sendMessage } = useChat();
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeavyComponent, setShowHeavyComponent] = useState(false);
  const [cacheStatus, setCacheStatus] = useState('miss');

  // Debounce search input
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Memoized filtered strategies to prevent expensive recalculations
  const filteredStrategies = useMemo(() => {
    if (!debouncedSearchQuery) return strategies.slice(0, 20); // Virtualize by limiting items
    
    return strategies
      .filter(strategy => 
        strategy.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      .slice(0, 20); // Limit to 20 items for performance
  }, [strategies, debouncedSearchQuery]);

  // Memoized API call with caching
  const handleApiCall = useCallback(async (query: string) => {
    if (apiCache.has(query)) {
      setCacheStatus('hit');
      return apiCache.get(query);
    }

    setCacheStatus('miss');
    if (onApiCall) {
      const result = await onApiCall(query);
      apiCache.set(query, result);
      return result;
    }
  }, [onApiCall]);

  // Effect with proper cleanup
  useEffect(() => {
    const handleResize = () => {
      // Performance monitoring
      performance.mark('resize-start');
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Memoized chat handler
  const handleChatSubmit = useCallback(async () => {
    try {
      await sendMessage.mutateAsync(chatInput);
    } catch (error) {
      console.error('Chat error:', error);
    }
  }, [chatInput, sendMessage]);

  // Memoized search handler
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (value) {
      handleApiCall(value);
    }
  }, [handleApiCall]);

  const handleLoadStrategies = useCallback(() => {
    handleApiCall('strategies');
  }, [handleApiCall]);

  const handleLoadHeavyComponent = useCallback(() => {
    setShowHeavyComponent(true);
  }, []);

  return (
    <div data-testid="dynavest-app">
      <div data-testid="chat-section" className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-bold mb-3">AI Strategy Advisor</h2>
        <input
          data-testid="chat-input"
          type="text"
          placeholder="Describe your investment goals..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button
          data-testid="get-ai-recommendation"
          onClick={handleChatSubmit}
          disabled={sendMessage.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {sendMessage.isPending ? 'Getting Recommendation...' : 'Get AI Recommendation'}
        </button>
      </div>

      {/* Performance-optimized strategy search */}
      <div className="mb-6">
        <input
          data-testid="strategy-search-input"
          type="text"
          placeholder="Search strategies..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        
        <button
          data-testid="load-strategies-button"
          onClick={handleLoadStrategies}
          className="px-4 py-2 bg-green-500 text-white rounded mr-2"
        >
          Load Strategies
        </button>

        <button
          data-testid="load-heavy-component-button"
          onClick={handleLoadHeavyComponent}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Load Heavy Component
        </button>

        <div data-testid="cache-status" className="mt-2 text-sm">
          Cache: {cacheStatus}
        </div>
      </div>

      {/* Virtualized strategy list */}
      <div data-testid="strategy-list-optimized" className="mb-6">
        <h3 className="text-lg font-bold mb-3">Strategies ({filteredStrategies.length})</h3>
        {filteredStrategies.map((strategy, index) => (
          <MemoizedStrategyCard 
            key={strategy.id} 
            strategy={strategy} 
            index={index}
          />
        ))}
      </div>

      {/* Lazy loaded heavy component */}
      {showHeavyComponent && (
        <Suspense fallback={<div>Loading heavy component...</div>}>
          <HeavyComponent />
        </Suspense>
      )}

      <ContractInteractionForm />
    </div>
  );
});

PerformanceOptimizedDynaVest.displayName = 'PerformanceOptimizedDynaVest';