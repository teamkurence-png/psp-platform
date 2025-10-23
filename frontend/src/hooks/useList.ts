import { useState, useCallback } from 'react';

interface UseListReturn<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  setItems: (items: T[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addItem: (item: T) => void;
  updateItem: (id: string | number, updates: Partial<T>) => void;
  removeItem: (id: string | number) => void;
}

/**
 * Hook for managing lists with common operations
 */
export function useList<T extends { _id?: string; id?: string | number }>(
  initialItems: T[] = []
): UseListReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = useCallback((item: T) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const updateItem = useCallback((id: string | number, updates: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) => {
        const itemId = item._id || item.id;
        return itemId === id ? { ...item, ...updates } : item;
      })
    );
  }, []);

  const removeItem = useCallback((id: string | number) => {
    setItems((prev) => {
      return prev.filter((item) => {
        const itemId = item._id || item.id;
        return itemId !== id;
      });
    });
  }, []);

  return {
    items,
    loading,
    error,
    setItems,
    setLoading,
    setError,
    addItem,
    updateItem,
    removeItem,
  };
}


