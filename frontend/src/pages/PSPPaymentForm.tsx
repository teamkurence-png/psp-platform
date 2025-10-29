import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { pspPaymentService } from '../services/pspPaymentService';
import { useCardForm } from '../hooks/useCardForm';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

const PSPPaymentForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Use custom card form hook
  const {
    formData,
    errors,
    handleInputChange,
    validateForm,
    getSubmissionData,
  } = useCardForm();

  // Fetch payment form details
  const { data: paymentData, isLoading, error } = useQuery({
    queryKey: ['psp-payment-form', token],
    queryFn: async () => {
      if (!token) throw new Error('No payment token provided');
      return pspPaymentService.getPaymentForm(token);
    },
    enabled: !!token,
  });

  const paymentInfo = paymentData?.data;

  // Redirect if already submitted
  useEffect(() => {
    if (paymentInfo?.isAlreadySubmitted) {
      navigate(`/pay/${token}/status`);
    }
  }, [paymentInfo, token, navigate]);

  // Submit card payment mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No payment token');
      return pspPaymentService.submitCardPayment(token, getSubmissionData());
    },
    onSuccess: () => {
      navigate(`/pay/${token}/status`);
    },
    onError: (error: any) => {
      console.error('Payment submission error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    submitMutation.mutate();
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Payment form not found" />;
  if (!paymentInfo) return <ErrorAlert message="Invalid payment link" />;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Payment</h1>
          <p className="text-gray-600">Complete your payment securely</p>
        </div>

        {/* Payment Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-gray-600">Amount Due</span>
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(paymentInfo.amount, paymentInfo.currency)}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Number</span>
                  <span className="font-medium">{paymentInfo.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Description</span>
                  <span className="font-medium">{paymentInfo.description}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-800 font-medium">Secure Payment</p>
                  <p className="text-xs text-green-700 mt-1">
                    Your card information is encrypted and securely processed
                  </p>
                </div>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={formData.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.cardholderName ? 'border-red-500' : 'border-input'
                  }`}
                />
                {errors.cardholderName && (
                  <p className="mt-1 text-sm text-red-600">{errors.cardholderName}</p>
                )}
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring font-mono ${
                    errors.cardNumber ? 'border-red-500' : 'border-input'
                  }`}
                />
                {errors.cardNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
                )}
              </div>

              {/* Expiry Date and CVC */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.expiryDate ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  {errors.expiryDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    value={formData.cvc}
                    onChange={(e) => handleInputChange('cvc', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.cvc ? 'border-red-500' : 'border-input'
                    }`}
                  />
                  {errors.cvc && (
                    <p className="mt-1 text-sm text-red-600">{errors.cvc}</p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {submitMutation.isError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">Payment Error</p>
                    <p className="text-xs text-red-700 mt-1">
                      {(submitMutation.error as any)?.response?.data?.error || 'Failed to submit payment'}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-4 text-lg"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  `Pay ${formatCurrency(paymentInfo.amount, paymentInfo.currency)}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Powered by HighrPay • Secure Payment Processing
        </p>
      </div>
    </div>
  );
};

export default PSPPaymentForm;

