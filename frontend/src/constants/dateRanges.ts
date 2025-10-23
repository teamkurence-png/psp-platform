export type DateRange = 'today' | '7d' | '30d';

export const DATE_RANGE_OPTIONS: Array<{ value: DateRange; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
];


