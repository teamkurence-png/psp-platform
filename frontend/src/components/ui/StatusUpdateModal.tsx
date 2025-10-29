import React, { useState } from 'react';
import Button from './Button';
import { X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export interface StatusOption {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

interface StatusUpdateModalProps {
  title: string;
  request: {
    _id?: string;
    reason?: string;
    amount: number;
    currency: string;
    customerInfo?: {
      name?: string;
    };
  };
  statusOptions: StatusOption[];
  defaultStatus: string;
  onClose: () => void;
  onSubmit: (status: string) => void;
  isLoading?: boolean;
}

/**
 * Generic reusable modal for updating payment status
 * Can be used for bank wire confirmations, PSP reviews, etc.
 */
const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  title,
  request,
  statusOptions,
  defaultStatus,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(defaultStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedStatus);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Request Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Payment Request</div>
              <div className="font-mono text-sm text-gray-900">
                {request.reason || request._id}
              </div>
              <div className="text-lg font-semibold text-gray-900 mt-2">
                {formatCurrency(request.amount, request.currency)}
              </div>
              <div className="text-sm text-gray-600">
                {request.customerInfo?.name || 'N/A'}
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Select New Status
              </label>
              <div className="space-y-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-${option.description ? 'start' : 'center'} p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStatus === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={selectedStatus === option.value}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="sr-only"
                        disabled={isLoading}
                      />
                      <Icon className={`h-5 w-5 mr-3 ${option.description ? 'mt-0.5' : ''} ${option.color}`} />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        {option.description && (
                          <p className="text-xs text-gray-600 mt-0.5">{option.description}</p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Update Status'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                className="px-6"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;

