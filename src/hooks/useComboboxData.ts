"use client";
import { useState, useEffect, useCallback } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface UseComboboxDataOptions {
  staticData?: ComboboxOption[];
  apiEndpoint?: string;
  initialLoad?: boolean;
  pageSize?: number;
  filterFn?: (item: any, query: string) => boolean;
}

export function useComboboxData(options: UseComboboxDataOptions = {}) {
  const {
    staticData = [],
    apiEndpoint,
    initialLoad = true,
    pageSize = 50,
    filterFn = (item: any, query: string) => {
      const label = typeof item.label === 'string' ? item.label : '';
      const value = typeof item.value === 'string' ? item.value : '';
      return label.toLowerCase().includes(query.toLowerCase()) ||
             value.toLowerCase().includes(query.toLowerCase());
    },
  } = options;

  const [allData, setAllData] = useState<ComboboxOption[]>(staticData);
  const [filteredData, setFilteredData] = useState<ComboboxOption[]>(staticData);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Load more from API
  const loadMore = useCallback(async () => {
    if (!apiEndpoint || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page + 1));
      params.set('limit', String(pageSize));

      const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        setHasMore(false);
        return;
      }

      const data = await response.json();
      const newItems: ComboboxOption[] = (data.results || []).filter(
        (item: any) => !allData.some(existing => existing.value === item.value)
      );

      if (newItems.length === 0) {
        setHasMore(false);
      }

      setAllData(prev => [...prev, ...newItems]);
      setPage(prev => prev + 1);
    } catch (error) {
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, isLoading, hasMore, allData, page, pageSize]);

  // Filter data based on query
  useEffect(() => {
    if (!query) {
      setFilteredData(allData.slice(0, pageSize));
      return;
    }

    const filtered = allData.filter(item => filterFn(item, query));
    setFilteredData(filtered.slice(0, pageSize));
    setHasMore(filtered.length > pageSize);
  }, [query, allData, pageSize]);

  // Initial load from API if needed
  useEffect(() => {
    if (initialLoad && apiEndpoint && allData.length === 0) {
      loadMore();
    }
  }, [initialLoad, apiEndpoint, allData.length, loadMore]);

  return {
    data: filteredData,
    allData,
    query,
    setQuery,
    isLoading,
    hasMore,
    loadMore,
    refresh: () => {
      setAllData(staticData);
      setPage(0);
      setHasMore(true);
      if (apiEndpoint) {
        loadMore();
      }
    },
  };
}