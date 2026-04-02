'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchResult {
  id: string;
  title: string;
  type: 'product' | 'store' | 'category';
  image?: string;
  price?: number;
}

export function useSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock results
    const mockResults: SearchResult[] = [
      {
        id: '1',
        title: `${searchQuery} - Product 1`,
        type: 'product',
        price: 50000,
      },
      {
        id: '2',
        title: `${searchQuery} - Product 2`,
        type: 'product',
        price: 75000,
      },
    ];
    
    setResults(mockResults);
    setIsSearching(false);
    
    // Update URL
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  }, [router]);

  const getSuggestions = useCallback(async (partialQuery: string) => {
    if (partialQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    // Mock suggestions
    const mockSuggestions = [
      `${partialQuery} phone`,
      `${partialQuery} laptop`,
      `${partialQuery} accessories`,
    ];
    
    setSuggestions(mockSuggestions);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    router.push('/search');
  }, [router]);

  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
    }
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    suggestions,
    search,
    getSuggestions,
    clearSearch,
  };
}
