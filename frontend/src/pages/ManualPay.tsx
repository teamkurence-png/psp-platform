import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { pspPaymentService } from '../services/pspPaymentService';
import { paymentRequestService } from '../services/paymentRequestService';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';
import { usePspPaymentActions } from '../hooks/usePspPaymentActions';
import { usePaymentStatusUpdate } from '../hooks/usePaymentStatusUpdate';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import StatusUpdateModal from '../components/ui/StatusUpdateModal';
import type { StatusOption } from '../components/ui/StatusUpdateModal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import Pagination from '../components/ui/Pagination';
import { Eye, Search, FileText, CheckCircle, XCircle, AlertCircle, CreditCard, X, Building2, Clock, Bell } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { PaymentRequestStatus } from '../types';

interface PSPPaymentReviewModalProps {
  payment: any;
  onClose: () => void;
  onReview: (submissionId: string, decision: 'processed' | 'processed_awaiting_exchange' | 'rejected' | 'insufficient_funds' | 'awaiting_3d_sms' | 'awaiting_3d_push') => void;
  isLoading: boolean;
}

const PSPPaymentReviewModal: React.FC<PSPPaymentReviewModalProps> = ({ 
  payment, 
  onClose, 
  onReview,
  isLoading 
}) => {
  const [selectedDecision, setSelectedDecision] = useState<'processed' | 'processed_awaiting_exchange' | 'rejected' | 'insufficient_funds' | 'awaiting_3d_sms' | 'awaiting_3d_push'>('processed_awaiting_exchange');
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch card details when modal opens
  React.useEffect(() => {
    const fetchDetails = async () => {
      if (!payment.cardSubmission?._id) return;
      
      try {
        setLoadingDetails(true);
        const response = await pspPaymentService.getPspPaymentDetails(payment.cardSubmission._id);
        setCardDetails(response.data.cardSubmission);
      } catch (error) {
        console.error('Failed to fetch card details:', error);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [payment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payment.cardSubmission?._id) {
      onReview(payment.cardSubmission._id, selectedDecision);
    }
  };

  const decisionOptions = [
    { 
      value: 'processed_awaiting_exchange' as const, 
      label: 'Processed - Awaiting Crypto Exchange', 
      icon: Clock, 
      color: 'text-blue-600',
      description: 'Payment approved, waiting for crypto exchange (money stays in pending)'
    },
    { 
      value: 'processed' as const, 
      label: 'Approve Payment (Final)', 
      icon: CheckCircle, 
      color: 'text-green-600',
      description: 'Final approval - credit merchant available balance with 30% commission'
    },
    { 
      value: 'awaiting_3d_sms' as const, 
      label: 'Request 3D Approval - SMS Code', 
      icon: AlertCircle, 
      color: 'text-blue-600',
      description: 'Request SMS verification code from customer'
    },
    { 
      value: 'awaiting_3d_push' as const, 
      label: 'Request 3D Approval - Push Notification', 
      icon: AlertCircle, 
      color: 'text-purple-600',
      description: 'Request push notification approval from customer'
    },
    { 
      value: 'rejected' as const, 
      label: 'Reject Payment', 
      icon: XCircle, 
      color: 'text-red-600',
      description: 'Decline the payment'
    },
    { 
      value: 'insufficient_funds' as const, 
      label: 'Insufficient Funds', 
      icon: AlertCircle, 
      color: 'text-orange-600',
      description: 'Card has insufficient funds'
    },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-xl font-semibold text-gray-900">Review PSP Payment</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Payment Request Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Payment Request Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Amount:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatCurrency(payment.paymentRequest.amount, payment.paymentRequest.currency)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Invoice:</span>
                  <span className="ml-2 font-medium text-gray-900">{payment.paymentRequest.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Merchant:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {payment.paymentRequest.userId?.legalName || payment.paymentRequest.userId?.email}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <span className="ml-2 font-medium text-gray-900">{payment.paymentRequest.customerInfo?.name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Description:</span>
                  <span className="ml-2 font-medium text-gray-900">{payment.paymentRequest.description}</span>
                </div>
              </div>
            </div>

            {/* Card Details */}
            {loadingDetails ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading card details...</p>
              </div>
            ) : cardDetails ? (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Card Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-blue-700">Cardholder Name:</span>
                      <span className="ml-2 font-medium text-blue-900">{cardDetails.cardholderName}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Card Number:</span>
                      <span className="ml-2 font-mono font-medium text-blue-900">{cardDetails.cardNumber}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-blue-700">Expiry:</span>
                        <span className="ml-2 font-mono font-medium text-blue-900">{cardDetails.expiryDate}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">CVC:</span>
                        <span className="ml-2 font-mono font-medium text-blue-900">{cardDetails.cvc}</span>
                      </div>
                    </div>
                    {cardDetails.ipAddress && (
                      <div>
                        <span className="text-blue-700">IP Address:</span>
                        <span className="ml-2 font-mono text-xs text-blue-900">{cardDetails.ipAddress}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-blue-700">Submitted:</span>
                      <span className="ml-2 font-medium text-blue-900">{formatDate(cardDetails.submittedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Details */}
                {cardDetails.verificationType && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Verification Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-green-700">Verification Type:</span>
                        <span className="ml-2 font-medium text-green-900">
                          {cardDetails.verificationType === '3d_sms' ? 'SMS Code' : 'Push Notification'}
                        </span>
                      </div>
                      {cardDetails.verificationCode && (
                        <div>
                          <span className="text-green-700">SMS Code Entered:</span>
                          <span className="ml-2 font-mono font-bold text-lg text-green-900">{cardDetails.verificationCode}</span>
                        </div>
                      )}
                      {cardDetails.verificationApproved !== undefined && (
                        <div>
                          <span className="text-green-700">Push Approval:</span>
                          <span className="ml-2 font-medium text-green-900">
                            {cardDetails.verificationApproved ? '✓ Approved' : '✗ Rejected'}
                          </span>
                        </div>
                      )}
                      {cardDetails.verificationCompletedAt && (
                        <div>
                          <span className="text-green-700">Completed At:</span>
                          <span className="ml-2 font-medium text-green-900">{formatDate(cardDetails.verificationCompletedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SMS Resend Requests */}
                {cardDetails.smsResendRequestedAt && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Customer Requested New SMS Code
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-yellow-700">Last Requested:</span>
                        <span className="ml-2 font-medium text-yellow-900">{formatDate(cardDetails.smsResendRequestedAt)}</span>
                      </div>
                      {cardDetails.smsResendCount && cardDetails.smsResendCount > 0 && (
                        <div>
                          <span className="text-yellow-700">Total Requests:</span>
                          <span className="ml-2 font-medium text-yellow-900">{cardDetails.smsResendCount}</span>
                        </div>
                      )}
                      <div className="mt-3 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                        💡 The customer is waiting for a new SMS verification code. You may want to send them a new code.
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Card details could not be loaded
              </div>
            )}

            {/* Decision Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Select Decision</label>
              <div className="space-y-2">
                {decisionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDecision === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={selectedDecision === option.value}
                        onChange={(e) => setSelectedDecision(e.target.value as any)}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 mr-3 mt-0.5 ${option.color}`} />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{option.label}</span>
                        <p className="text-xs text-gray-600 mt-0.5">{option.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isLoading || loadingDetails}
              >
                {isLoading ? 'Processing...' : 'Submit Decision'}
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

// Bank Wire status options (reusable)
const BANK_WIRE_STATUS_OPTIONS: StatusOption[] = [
  { value: PaymentRequestStatus.PAID, label: 'Mark as Paid', icon: CheckCircle, color: 'text-green-600' },
  { value: PaymentRequestStatus.EXPIRED, label: 'Mark as Expired', icon: Clock, color: 'text-red-600' },
  { value: PaymentRequestStatus.CANCELLED, label: 'Mark as Cancelled', icon: XCircle, color: 'text-gray-600' },
];

const ManualPay: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'card' | 'bank'>('card');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [selectedBankRequest, setSelectedBankRequest] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Custom hooks for payment actions
  const { reviewPayment, isReviewing } = usePspPaymentActions();
  const { updateStatus, isUpdating } = usePaymentStatusUpdate();

  // WebSocket for real-time updates
  useWebSocket({
    userId: user?.id,
    isAdmin: user?.role === 'admin' || user?.role === 'ops' || user?.role === 'finance',
    onPspPaymentSubmitted: (data) => {
      console.log('New PSP payment submitted:', data);
      queryClient.invalidateQueries({ queryKey: ['psp-payments'] });
    },
    onPaymentRequestCreated: (data) => {
      console.log('New payment request created:', data);
      // Refresh the appropriate list based on payment method
      if (data.paymentMethods?.includes('card')) {
        queryClient.invalidateQueries({ queryKey: ['psp-payments'] });
      }
      if (data.paymentMethods?.includes('bank_wire')) {
        queryClient.invalidateQueries({ queryKey: ['bank-payment-requests'] });
      }
    },
    onPspVerificationCompleted: (data) => {
      console.log('Customer completed verification:', data);
      queryClient.invalidateQueries({ queryKey: ['psp-payments'] });
    },
    onPspSmsResendRequested: (data) => {
      console.log('Customer requested new SMS code:', data);
      // Refresh the payments list to show the badge
      queryClient.invalidateQueries({ queryKey: ['psp-payments'] });
    },
  });

  // Fetch PSP payments (card payments only)
  const { data: paymentData, isLoading: isLoadingCard, error: errorCard } = useQuery({
    queryKey: ['psp-payments', statusFilter, currentPage],
    queryFn: async () => {
      try {
        const response = await pspPaymentService.listPspPayments({
          status: statusFilter === 'all' ? undefined : statusFilter,
          page: currentPage,
          limit: itemsPerPage,
        });
        
        return response.data;
      } catch (error) {
        console.error('Failed to fetch PSP payments:', error);
        return { payments: [], pagination: null };
      }
    },
    enabled: activeTab === 'card',
  });

  // Fetch Bank Wire payments
  const { data: bankData, isLoading: isLoadingBank, error: errorBank } = useQuery({
    queryKey: ['bank-payment-requests', statusFilter, currentPage],
    queryFn: async () => {
      try {
        const response = await paymentRequestService.getAll({
          page: currentPage,
          limit: itemsPerPage,
        });
        
        const requests = response.data.data.paymentRequests || [];
        const pagination = response.data.data.pagination;
        
        // Filter for bank wire payments only
        let filtered = requests.filter((req: any) => 
          req.paymentMethods?.includes('bank_wire')
        );
        
        // Apply status filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'pending') {
            filtered = filtered.filter((req: any) => 
              req.status === 'sent' || req.status === 'viewed'
            );
          } else {
            filtered = filtered.filter((req: any) => req.status === statusFilter);
          }
        }
        
        return { requests: filtered, pagination };
      } catch (error) {
        console.error('Failed to fetch bank wire payments:', error);
        return { requests: [], pagination: null };
      }
    },
    enabled: activeTab === 'bank',
  });

  const payments = paymentData?.payments || [];
  const bankRequests = bankData?.requests || [];
  const pagination = activeTab === 'card' ? paymentData?.pagination : bankData?.pagination;
  
  const isLoading = activeTab === 'card' ? isLoadingCard : isLoadingBank;
  const error = activeTab === 'card' ? errorCard : errorBank;

  // Handler for reviewing PSP payments
  const handleReview = async (submissionId: string, decision: 'processed' | 'processed_awaiting_exchange' | 'rejected' | 'insufficient_funds' | 'awaiting_3d_sms' | 'awaiting_3d_push') => {
    try {
      await reviewPayment(submissionId, decision);
      setSelectedPayment(null);
      // Don't reset to page 1 - keep admin on current page to see the updated status
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to review payment');
    }
  };

  // Handler for updating bank wire payment status
  const handleBankStatusUpdate = async (status: string) => {
    if (!selectedBankRequest) return;
    
    try {
      await updateStatus(selectedBankRequest._id, status as PaymentRequestStatus);
      setSelectedBankRequest(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  // Handler for rejecting pending PSP payments
  const handleRejectPendingPayment = async (paymentRequestId: string) => {
    try {
      await updateStatus(paymentRequestId, PaymentRequestStatus.REJECTED);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reject payment');
    }
  };

  const filteredPayments = payments?.filter((payment: any) =>
    payment.paymentRequest.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    payment.paymentRequest.customerInfo?.email?.toLowerCase().includes(search.toLowerCase()) ||
    payment.paymentRequest.customerInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
    payment.paymentRequest.userId?.legalName?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBankRequests = bankRequests?.filter((req: any) =>
    req.reason?.toLowerCase().includes(search.toLowerCase()) ||
    req.customerInfo?.email?.toLowerCase().includes(search.toLowerCase()) ||
    req.customerInfo?.name?.toLowerCase().includes(search.toLowerCase()) ||
    req.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={`Failed to load ${activeTab === 'card' ? 'PSP' : 'bank wire'} payments`} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual Payment Processing</h1>
        <p className="text-gray-600">Review and process card PSP payments and bank wire confirmations</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('card');
              setCurrentPage(1);
              setStatusFilter('all');
            }}
            className={`${
              activeTab === 'card'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <CreditCard className="h-5 w-5" />
            Card PSP Payments
            {activeTab === 'card' && payments.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                {payments.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('bank');
              setCurrentPage(1);
              setStatusFilter('all');
            }}
            className={`${
              activeTab === 'bank'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
          >
            <Building2 className="h-5 w-5" />
            Bank Wire Confirmations
            {activeTab === 'bank' && bankRequests.length > 0 && (
              <span className="ml-2 bg-primary text-white text-xs rounded-full px-2 py-0.5">
                {bankRequests.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice, customer, or merchant..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="all">All Payments</option>
              {activeTab === 'card' ? (
                <>
                  <option value="submitted">⏳ Awaiting Review</option>
                  <option value="pending_submission">📝 Pending Customer Submission</option>
                  <option value="awaiting_3d_sms">📱 Awaiting SMS Verification</option>
                  <option value="awaiting_3d_push">🔔 Awaiting Push Approval</option>
                  <option value="verification_completed">✓ Verification Completed</option>
                  <option value="processed_awaiting_exchange">🔄 Awaiting Crypto Exchange</option>
                  <option value="processed">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="insufficient_funds">⚠️ Insufficient Funds</option>
                </>
              ) : (
                <>
                  <option value="pending">⏳ Pending (Sent/Viewed)</option>
                  <option value="sent">📤 Sent</option>
                  <option value="viewed">👁️ Viewed</option>
                  <option value="paid">✅ Paid</option>
                  <option value="expired">⏰ Expired</option>
                  <option value="cancelled">❌ Cancelled</option>
                </>
              )}
            </select>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      {activeTab === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {statusFilter === 'all' ? 'Total Payments' : 'Filtered Count'}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">{payments?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">Pending Value</p>
                  <p className="text-2xl font-bold text-yellow-600 truncate">
                    {formatCurrency(
                      payments?.filter((p: any) => 
                        ['submitted', 'pending_submission', 'awaiting_3d_sms', 'awaiting_3d_push', 'verification_completed', 'processed_awaiting_exchange'].includes(p.paymentRequest.status)
                      ).reduce((sum: number, payment: any) => sum + payment.paymentRequest.amount, 0) || 0,
                      'USD'
                    )}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">Processed Value</p>
                  <p className="text-2xl font-bold text-green-600 truncate">
                    {formatCurrency(
                      payments?.filter((p: any) => p.paymentRequest.status === 'processed').reduce((sum: number, payment: any) => sum + payment.paymentRequest.amount, 0) || 0,
                      'USD'
                    )}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Awaiting Review</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {payments?.filter((p: any) => p.paymentRequest.status === 'submitted').length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'bank' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                  <p className="text-3xl font-bold text-gray-900">{bankRequests?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 mb-1">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900 truncate">
                    {formatCurrency(
                      bankRequests?.reduce((sum: number, req: any) => sum + req.amount, 0) || 0,
                      'USD'
                    )}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 ml-4">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {bankRequests?.filter((r: any) => r.status === 'sent' || r.status === 'viewed').length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Paid</p>
                  <p className="text-3xl font-bold text-green-600">
                    {bankRequests?.filter((r: any) => r.status === 'paid').length || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments List - Card PSP */}
      {activeTab === 'card' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Merchant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-gray-500">No PSP payments found</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments?.map((payment: any) => (
                  <tr key={payment.paymentRequest._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.paymentRequest.invoiceNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">{payment.paymentRequest.customerInfo?.name || 'N/A'}</div>
                        {payment.paymentRequest.customerInfo?.email && (
                          <div className="text-sm text-gray-500">{payment.paymentRequest.customerInfo.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payment.paymentRequest.userId?.legalName || payment.paymentRequest.userId?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {formatCurrency(payment.paymentRequest.amount, payment.paymentRequest.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={payment.paymentRequest.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-1">
                        {payment.cardSubmission?.submittedAt ? (
                          <span className="text-gray-900">{formatDate(payment.cardSubmission.submittedAt)}</span>
                        ) : payment.paymentRequest.status === 'pending_submission' ? (
                          <span className="text-yellow-600 font-medium">Pending</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                        {payment.cardSubmission?.smsResendRequestedAt && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-300 animate-pulse">
                            <Bell className="h-3 w-3" />
                            Customer wants new SMS
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/payment-requests/${payment.paymentRequest._id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {payment.paymentRequest.status === 'submitted' ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                            disabled={isReviewing}
                          >
                            Review
                          </Button>
                        ) : payment.paymentRequest.status === 'verification_completed' || payment.paymentRequest.status === 'processed_awaiting_exchange' ? (
                          <Button
                            size="sm"
                            onClick={() => setSelectedPayment(payment)}
                            disabled={isReviewing}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {payment.paymentRequest.status === 'processed_awaiting_exchange' ? 'Complete Exchange' : 'Final Review'}
                          </Button>
                        ) : (payment.paymentRequest.status === 'awaiting_3d_sms' || payment.paymentRequest.status === 'awaiting_3d_push') ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-orange-600 font-medium px-2 py-1 bg-orange-50 rounded border border-orange-200">
                              Awaiting Verification
                            </span>
                          </div>
                        ) : payment.paymentRequest.status === 'pending_submission' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Are you sure you want to reject this pending payment? The customer has not yet submitted their card details.')) {
                                handleRejectPendingPayment(payment.paymentRequest._id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        ) : payment.cardSubmission?.reviewedAt ? (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            Reviewed {formatDate(payment.cardSubmission.reviewedAt)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {/* Bank Wire Payments List */}
      {activeTab === 'bank' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reason / Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Merchant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBankRequests?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-gray-500">No bank wire payment requests found</p>
                    </td>
                  </tr>
                ) : (
                  filteredBankRequests?.map((request: any) => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {request.reason && (
                            <div className="font-mono text-sm text-gray-900">{request.reason}</div>
                          )}
                          {request.invoiceNumber && (
                            <div className="text-sm text-gray-500">Invoice: {request.invoiceNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{request.customerInfo?.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{request.customerInfo?.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.userId?.legalName || request.userId?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {formatCurrency(request.amount, request.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/payment-requests/${request._id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {(request.status === 'sent' || request.status === 'viewed') && (
                            <Button
                              size="sm"
                              onClick={() => setSelectedBankRequest(request)}
                              disabled={isUpdating}
                            >
                              Update Status
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination && (
        <Card>
          <CardContent className="pt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      )}

      {/* PSP Payment Review Modal */}
      {selectedPayment && (
        <PSPPaymentReviewModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onReview={handleReview}
          isLoading={isReviewing}
        />
      )}

      {/* Bank Wire Status Update Modal */}
      {selectedBankRequest && (
        <StatusUpdateModal
          title="Update Bank Wire Status"
          request={selectedBankRequest}
          statusOptions={BANK_WIRE_STATUS_OPTIONS}
          defaultStatus={PaymentRequestStatus.PAID}
          onClose={() => setSelectedBankRequest(null)}
          onSubmit={handleBankStatusUpdate}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};

export default ManualPay;

