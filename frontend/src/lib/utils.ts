import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

// Date range utilities
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Formats a date for API requests (YYYY-MM-DD)
 */
export function formatDateForAPI(date: Date | null): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split('T')[0];
}

/**
 * Creates a date range starting from X days ago to today
 */
export function createDateRange(daysAgo: number): DateRange {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);
  startDate.setHours(0, 0, 0, 0);
  
  return { startDate, endDate };
}

/**
 * Gets the default date range (last 7 days)
 */
export function getDefaultDateRange(): DateRange {
  return createDateRange(6); // Last 7 days (today + 6 previous days)
}

/**
 * Creates a date range for today only
 */
export function getTodayDateRange(): DateRange {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

