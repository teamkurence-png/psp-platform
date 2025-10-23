import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import Button from './Button';
import { type DateRange } from '../../lib/utils';

export type { DateRange };

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatInputDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const parseInputDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    return new Date(dateString + 'T00:00:00');
  };

  const handleApply = () => {
    onChange(tempRange);
    setIsOpen(false);
  };

  const handleReset = () => {
    const newRange = { startDate: null, endDate: null };
    setTempRange(newRange);
    onChange(newRange);
  };

  const handleQuickSelect = (days: number) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const newRange = { startDate, endDate };
    setTempRange(newRange);
    onChange(newRange);
    setIsOpen(false);
  };

  const displayText = () => {
    if (value.startDate && value.endDate) {
      return `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`;
    } else if (value.startDate) {
      return `From ${formatDate(value.startDate)}`;
    } else if (value.endDate) {
      return `Until ${formatDate(value.endDate)}`;
    }
    return 'Select date range';
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{displayText()}</span>
        {(value.startDate || value.endDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="ml-1 p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="h-3 w-3 text-gray-500" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[320px]">
          <div className="space-y-4">
            {/* Quick Select Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickSelect(0)}
                className="flex-1 text-xs"
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickSelect(6)}
                className="flex-1 text-xs"
              >
                7 Days
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickSelect(29)}
                className="flex-1 text-xs"
              >
                30 Days
              </Button>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formatInputDate(tempRange.startDate)}
                    onChange={(e) => setTempRange({ ...tempRange, startDate: parseInputDate(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    max={tempRange.endDate ? formatInputDate(tempRange.endDate) : undefined}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formatInputDate(tempRange.endDate)}
                    onChange={(e) => setTempRange({ ...tempRange, endDate: parseInputDate(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min={tempRange.startDate ? formatInputDate(tempRange.startDate) : undefined}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTempRange(value);
                  setIsOpen(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;

