import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { PaymentRequest, Card as CardType } from '../types/index';
import { PaymentRequestStatus, PaymentMethod, BankRail } from '../types/index';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { 
  ArrowLeft, 
  Copy, 
  CreditCard, 
  Building2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  ExternalLink,
  Link as LinkIcon,
  AlertCircle
} from 'lucide-react';

const PaymentRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [assignedCard, setAssignedCard] = useState<CardType | null>(null);

  // WebSocket for real-time status updates
  useWebSocket({
    userId: user?.id,
    onPaymentRequestStatusUpdated: (data) => {
      if (data.paymentRequestId === id) {
        console.log('Payment request status updated:', data);
        fetchPaymentRequest();
      }
    },
  });

  useEffect(() => {
    if (id) {
      fetchPaymentRequest();
    }
  }, [id]);

  const fetchPaymentRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/payment-requests/${id}`);
      const data = response.data.data;
      setPaymentRequest(data);
      
      // Fetch assigned card if cardId is present
      if (data.cardId) {
        try {
          const cardResponse = await api.get(`/cards/${data.cardId}`);
          setAssignedCard(cardResponse.data.data);
        } catch (error) {
          console.error('Failed to fetch assigned card:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment request:', error);
      alert('Failed to load payment request');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this payment request?')) {
      return;
    }

    try {
      await api.post(`/payment-requests/${id}/cancel`);
      alert('Payment request cancelled');
      await fetchPaymentRequest();
    } catch (error: any) {
      console.error('Failed to cancel:', error);
      alert(error.response?.data?.error || 'Failed to cancel payment request');
    }
  };

  const getStatusBadge = (status: PaymentRequestStatus) => {
    switch (status) {
      case PaymentRequestStatus.PROCESSED:
      case PaymentRequestStatus.PAID:
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold capitalize">{status.replace(/_/g, ' ')}</span>
          </div>
        );
      case PaymentRequestStatus.SUBMITTED:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Submitted (Under Review)</span>
          </div>
        );
      case PaymentRequestStatus.PENDING_SUBMISSION:
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Awaiting Customer Submission</span>
          </div>
        );
      case PaymentRequestStatus.AWAITING_3D_SMS:
        return (
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Awaiting SMS Verification</span>
          </div>
        );
      case PaymentRequestStatus.AWAITING_3D_PUSH:
        return (
          <div className="flex items-center gap-2 text-purple-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Awaiting Push Approval</span>
          </div>
        );
      case PaymentRequestStatus.VERIFICATION_COMPLETED:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Verification Complete (Review Pending)</span>
          </div>
        );
      case PaymentRequestStatus.PROCESSED_AWAITING_EXCHANGE:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Processed - Awaiting Crypto Exchange</span>
          </div>
        );
      case PaymentRequestStatus.VIEWED:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Eye className="h-5 w-5" />
            <span className="font-semibold">Viewed</span>
          </div>
        );
      case PaymentRequestStatus.REJECTED:
      case PaymentRequestStatus.EXPIRED:
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold capitalize">{status.replace(/_/g, ' ')}</span>
          </div>
        );
      case PaymentRequestStatus.INSUFFICIENT_FUNDS:
        return (
          <div className="flex items-center gap-2 text-orange-600">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">Insufficient Funds</span>
          </div>
        );
      case PaymentRequestStatus.CANCELLED:
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">Cancelled</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Sent</span>
          </div>
        );
    }
  };

  const getRailLabel = (rail: BankRail) => {
    switch (rail) {
      case BankRail.SEPA:
        return 'SEPA';
      case BankRail.SWIFT:
        return 'SWIFT';
      case BankRail.LOCAL:
        return 'Local Transfer';
      default:
        return rail;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment request...</p>
        </div>
      </div>
    );
  }

  if (!paymentRequest) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Payment request not found</p>
        <Link to="/confirmations">
          <Button className="mt-4">Back to Confirmations</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/confirmations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Confirmations
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Payment Request Details</h1>
            <p className="text-muted-foreground">ID: {paymentRequest._id}</p>
          </div>
        </div>
        {getStatusBadge(paymentRequest.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(paymentRequest.amount, paymentRequest.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold capitalize">{paymentRequest.status}</p>
                </div>
                {paymentRequest.invoiceNumber && (
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-medium">{paymentRequest.invoiceNumber}</p>
                  </div>
                )}
                {paymentRequest.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDateTime(paymentRequest.dueDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(paymentRequest.createdAt)}</p>
                </div>
                {paymentRequest.viewedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Viewed At</p>
                    <p className="font-medium">{formatDateTime(paymentRequest.viewedAt)}</p>
                  </div>
                )}
              </div>
              {paymentRequest.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{paymentRequest.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Information */}
          {paymentRequest.customerInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {paymentRequest.customerInfo.name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{paymentRequest.customerInfo.name}</p>
                    </div>
                  )}
                  {paymentRequest.customerInfo.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{paymentRequest.customerInfo.email}</p>
                    </div>
                  )}
                  {paymentRequest.customerInfo.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{paymentRequest.customerInfo.phone}</p>
                    </div>
                  )}
                  {paymentRequest.customerInfo.billingCountry && (
                    <div>
                      <p className="text-sm text-muted-foreground">Country</p>
                      <p className="font-medium">{paymentRequest.customerInfo.billingCountry}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Wire Details */}
          {paymentRequest.paymentMethods.includes(PaymentMethod.BANK_WIRE) && paymentRequest.bankDetails && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle>Bank Wire Details</CardTitle>
                </div>
                <CardDescription>Bank transfer information for this payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentRequest.bankDetails.rails && (
                    <div>
                      <p className="text-sm text-muted-foreground">Available Rails</p>
                      <p className="font-medium">
                        {paymentRequest.bankDetails.rails.map(rail => getRailLabel(rail)).join(', ')}
                      </p>
                    </div>
                  )}
                  {paymentRequest.bankDetails.beneficiaryName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Beneficiary Name</p>
                      <p className="font-medium">{paymentRequest.bankDetails.beneficiaryName}</p>
                    </div>
                  )}
                  {paymentRequest.bankDetails.iban && (
                    <div>
                      <p className="text-sm text-muted-foreground">IBAN</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{paymentRequest.bankDetails.iban}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(paymentRequest.bankDetails!.iban!, 'IBAN')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {paymentRequest.bankDetails.accountNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm">{paymentRequest.bankDetails.accountNumber}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(paymentRequest.bankDetails!.accountNumber!, 'Account Number')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {paymentRequest.bankDetails.routingNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Routing Number</p>
                      <p className="font-mono text-sm">{paymentRequest.bankDetails.routingNumber}</p>
                    </div>
                  )}
                  {paymentRequest.bankDetails.swiftCode && (
                    <div>
                      <p className="text-sm text-muted-foreground">SWIFT/BIC Code</p>
                      <p className="font-mono text-sm">{paymentRequest.bankDetails.swiftCode}</p>
                    </div>
                  )}
                  {paymentRequest.bankDetails.bankName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{paymentRequest.bankDetails.bankName}</p>
                    </div>
                  )}
                  {paymentRequest.bankDetails.bankAddress && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Bank Address</p>
                      <p className="font-medium">{paymentRequest.bankDetails.bankAddress}</p>
                    </div>
                  )}
                </div>
                {paymentRequest.reason && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                      Important: Include Reason
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-mono font-bold text-yellow-900">
                        {paymentRequest.reason}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(paymentRequest.reason!, 'Reason')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Customer must include this reason in the transfer reference
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Commission Breakdown */}
          {(paymentRequest.bankAccountId || paymentRequest.cardId) && paymentRequest.commissionPercent !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Commission Breakdown</CardTitle>
                <CardDescription>Fee structure for this transaction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Original Amount</p>
                    <p className="font-medium">{formatCurrency(paymentRequest.amount, paymentRequest.currency)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Commission</p>
                    <p className="font-medium text-orange-600">
                      {paymentRequest.commissionPercent}% - {formatCurrency(paymentRequest.commissionAmount || 0, paymentRequest.currency)}
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold">Net Amount (Merchant Receives)</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(paymentRequest.netAmount || paymentRequest.amount, paymentRequest.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card Payment Details */}
          {paymentRequest.paymentMethods.includes(PaymentMethod.CARD) && paymentRequest.pspPaymentLink && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <CardTitle>Card Payment Link</CardTitle>
                </div>
                <CardDescription>Share this unique payment link with your customer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">PSP Payment Link</p>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 border rounded-lg">
                    <LinkIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <code className="text-sm font-mono break-all flex-1">
                      {paymentRequest.pspPaymentLink}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(paymentRequest.pspPaymentLink!, 'Payment Link')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(paymentRequest.pspPaymentLink, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Link
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCopy(paymentRequest.pspPaymentLink!, 'Payment Link')}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">
                    📧 Next Steps
                  </p>
                  <p className="text-xs text-blue-800">
                    1. Copy the payment link above<br />
                    2. Send it to your customer via email or messenger<br />
                    3. Customer fills the payment form with their card details<br />
                    4. You'll be notified when the payment is processed
                  </p>
                </div>

                {paymentRequest.status === PaymentRequestStatus.PENDING_SUBMISSION && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⏳ Waiting for customer to submit payment details
                    </p>
                  </div>
                )}

                {paymentRequest.status === PaymentRequestStatus.SUBMITTED && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      🔄 Payment submitted and under review by admin
                    </p>
                  </div>
                )}

                {paymentRequest.status === PaymentRequestStatus.AWAITING_3D_SMS && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      📱 Waiting for customer to enter SMS verification code
                    </p>
                  </div>
                )}

                {paymentRequest.status === PaymentRequestStatus.AWAITING_3D_PUSH && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-800">
                      🔔 Waiting for customer to approve push notification
                    </p>
                  </div>
                )}

                {paymentRequest.status === PaymentRequestStatus.VERIFICATION_COMPLETED && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      ✓ Customer completed verification - Under final review by admin
                    </p>
                  </div>
                )}

                {paymentRequest.status === PaymentRequestStatus.PROCESSED_AWAITING_EXCHANGE && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      🔄 Payment processed - Awaiting crypto exchange completion
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {paymentRequest.status === PaymentRequestStatus.SENT && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full text-red-600 hover:text-red-700"
                >
                  Cancel Request
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestDetail;

