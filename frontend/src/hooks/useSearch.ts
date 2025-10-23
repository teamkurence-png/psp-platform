import { useState, useMemo } from 'react';

type SearchMatcher<T> = (item: T, searchTerm: string) => boolean;

interface UseSearchReturn<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredItems: T[];
}

/**
 * Hook for searching/filtering items
 */
export function useSearch<T>(
  items: T[],
  matcher: SearchMatcher<T>
): UseSearchReturn<T> {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) => matcher(item, searchTerm));
  }, [items, searchTerm, matcher]);

  return {
    searchTerm,
    setSearchTerm,
    filteredItems,
  };
}


