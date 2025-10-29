import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pspPaymentService } from '../services/pspPaymentService';
import { useWebSocket } from '../hooks/useWebSocket';
import { Card, CardContent } from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import { CheckCircle, XCircle, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

const PSPPaymentStatus: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  // Fetch initial payment status
  const { data: statusData, isLoading, error, refetch } = useQuery({
    queryKey: ['psp-payment-status', token],
    queryFn: async () => {
      if (!token) throw new Error('No payment token provided');
      return pspPaymentService.getPaymentStatus(token);
    },
    enabled: !!token,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      // Poll every 5 seconds if status is submitted (waiting for review)
      return status === 'submitted' ? 5000 : false;
    },
  });

  // Get payment form data for display
  const { data: paymentData } = useQuery({
    queryKey: ['psp-payment-form', token],
    queryFn: async () => {
      if (!token) throw new Error('No payment token provided');
      return pspPaymentService.getPaymentForm(token);
    },
    enabled: !!token,
  });

  const paymentInfo = paymentData?.data;

  // Update current status when data changes
  useEffect(() => {
    if (statusData?.data?.status) {
      setCurrentStatus(statusData.data.status);
    }
  }, [statusData]);

  // WebSocket for real-time updates
  useWebSocket({
    token,
    onPspPaymentStatusUpdated: (data) => {
      console.log('Payment status updated via WebSocket:', data);
      setCurrentStatus(data.status);
      refetch();
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load payment status" />;
  if (!currentStatus) return <ErrorAlert message="Payment not found" />;

  const renderStatusContent = () => {
    switch (currentStatus) {
      case 'pending_submission':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-10 w-10 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Pending</h2>
            <p className="text-gray-600 mb-6">
              Waiting for payment details to be submitted
            </p>
          </div>
        );

      case 'submitted':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                  <CreditCard className="h-10 w-10 text-blue-600" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-300 border-t-transparent animate-spin"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Processing Payment</h2>
            <p className="text-gray-600 mb-4">
              Your payment is being reviewed by our team
            </p>
            <p className="text-sm text-gray-500">
              This usually takes a few moments. Please do not close this page.
            </p>
          </div>
        );

      case 'processed':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-3">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully
            </p>
            {paymentInfo && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(paymentInfo.amount, paymentInfo.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Number</span>
                  <span className="font-medium text-gray-900">{paymentInfo.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Merchant</span>
                  <span className="font-medium text-gray-900">{paymentInfo.merchantName}</span>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-6">
              You will receive a confirmation email shortly
            </p>
          </div>
        );

      case 'rejected':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">Payment Declined</h2>
            <p className="text-gray-600 mb-6">
              Your payment could not be processed
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <p className="text-sm text-red-800">
                <strong>Reason:</strong> The payment was declined during processing.
              </p>
              <p className="text-sm text-red-700 mt-2">
                Please contact the merchant for more information or try a different payment method.
              </p>
            </div>
          </div>
        );

      case 'insufficient_funds':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-10 w-10 text-orange-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-orange-600 mb-3">Insufficient Funds</h2>
            <p className="text-gray-600 mb-6">
              Your card has insufficient funds to complete this payment
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
              <p className="text-sm text-orange-800">
                The payment could not be completed due to insufficient funds on your card.
              </p>
              <p className="text-sm text-orange-700 mt-2">
                Please use a different payment method or contact your bank.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-gray-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Status Unknown</h2>
            <p className="text-gray-600">
              Please contact support for more information
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">HighrPay</h1>
          <p className="text-gray-600">Secure Payment Processing</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardContent className="pt-8 pb-8">
            {renderStatusContent()}
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

export default PSPPaymentStatus;

