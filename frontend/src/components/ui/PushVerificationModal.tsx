import React from 'react';
import { X, Smartphone, Lock, CheckCircle } from 'lucide-react';
import Button from './Button';
import { formatCurrency } from '../../lib/utils';

interface PushVerificationModalProps {
  paymentInfo: {
    amount: number;
    currency: string;
    invoiceNumber: string;
  };
  onApprove: () => void;
  onClose: () => void;
  isLoading: boolean;
  error?: string;
}

const PushVerificationModal: React.FC<PushVerificationModalProps> = ({
  paymentInfo,
  onApprove,
  onClose,
  isLoading,
  error,
}) => {
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Payment Approval Required</h3>
          </div>
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
        <div className="p-6">
          {/* Payment Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(paymentInfo.amount, paymentInfo.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice:</span>
                <span className="font-medium text-gray-900">{paymentInfo.invoiceNumber}</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
            <Lock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-900 font-medium mb-1">
                Confirm Your Payment
              </p>
              <p className="text-sm text-green-800">
                Please review the payment details above and approve to complete your transaction.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={onApprove}
              className="w-full py-3 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Approve Payment
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full py-3"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushVerificationModal;

