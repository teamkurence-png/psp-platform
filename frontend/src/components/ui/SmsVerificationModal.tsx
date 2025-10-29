import React, { useState } from 'react';
import { X, MessageSquare, Lock, RefreshCw } from 'lucide-react';
import Button from './Button';
import { formatCurrency } from '../../lib/utils';

interface SmsVerificationModalProps {
  paymentInfo: {
    amount: number;
    currency: string;
    invoiceNumber: string;
  };
  onSubmit: (code: string) => void;
  onResend?: () => void;
  onClose: () => void;
  isLoading: boolean;
  isResending?: boolean;
  error?: string;
  resendSuccess?: boolean;
}

const SmsVerificationModal: React.FC<SmsVerificationModalProps> = ({
  paymentInfo,
  onSubmit,
  onResend,
  onClose,
  isLoading,
  isResending,
  error,
  resendSuccess,
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onSubmit(code.trim());
    }
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">SMS Verification Required</h3>
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
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-900">
                Please enter the verification code provided by the merchant to complete your payment.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-center text-lg font-mono tracking-wider"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Resend Success Message */}
            {resendSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Your request for a new SMS code has been sent to the administrator. 
                  Please wait for them to send you a new code.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-3"
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </Button>
          </form>

          {/* Resend SMS Button */}
          {onResend && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3 text-center">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onResend}
                disabled={isLoading || isResending}
              >
                {isResending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Requesting...
                  </span>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Request New SMS Code
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmsVerificationModal;

