import { useState, useMemo } from 'react';

type FilterMatcher<T> = (item: T, filterValue: string) => boolean;

interface UseFilterReturn<T> {
  filterValue: string;
  setFilterValue: (value: string) => void;
  filteredItems: T[];
}

/**
 * Hook for filtering items by a single criteria
 */
export function useFilter<T>(
  items: T[],
  matcher: FilterMatcher<T>,
  defaultValue: string = 'all'
): UseFilterReturn<T> {
  const [filterValue, setFilterValue] = useState(defaultValue);

  const filteredItems = useMemo(() => {
    if (filterValue === 'all') return items;
    return items.filter((item) => matcher(item, filterValue));
  }, [items, filterValue, matcher]);

  return {
    filterValue,
    setFilterValue,
    filteredItems,
  };
}

