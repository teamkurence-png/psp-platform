import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { PaymentRequest } from '../types/index';
import { PaymentRequestStatus, PaymentMethod, BankRail } from '../types/index';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { 
  ArrowLeft, 
  Copy, 
  ExternalLink, 
  CreditCard, 
  Building2, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye
} from 'lucide-react';

const PaymentRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPaymentRequest();
    }
  }, [id]);

  const fetchPaymentRequest = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/payment-requests/${id}`);
      setPaymentRequest(response.data);
    } catch (error) {
      console.error('Failed to fetch payment request:', error);
      alert('Failed to load payment request');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    } finally {
      setTimeout(() => setCopying(false), 1000);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this payment request?')) {
      return;
    }

    try {
      await api.post(`/api/payment-requests/${id}/cancel`);
      alert('Payment request cancelled');
      await fetchPaymentRequest();
    } catch (error: any) {
      console.error('Failed to cancel:', error);
      alert(error.response?.data?.error || 'Failed to cancel payment request');
    }
  };

  const getStatusBadge = (status: PaymentRequestStatus) => {
    switch (status) {
      case PaymentRequestStatus.PAID:
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Paid</span>
          </div>
        );
      case PaymentRequestStatus.VIEWED:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Eye className="h-5 w-5" />
            <span className="font-semibold">Viewed</span>
          </div>
        );
      case PaymentRequestStatus.EXPIRED:
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">Expired</span>
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
        <Link to="/payment-requests">
          <Button className="mt-4">Back to Payment Requests</Button>
        </Link>
      </div>
    );
  }

  const paymentLink = paymentRequest.checkoutUrl || 
    `${window.location.origin}/pay/${paymentRequest._id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/payment-requests">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
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
                {paymentRequest.referenceCode && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                      Important: Include Reference Code
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-mono font-bold text-yellow-900">
                        {paymentRequest.referenceCode}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(paymentRequest.referenceCode!, 'Reference Code')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      Customer must include this code in the transfer reference
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Card Settings */}
          {paymentRequest.paymentMethods.includes(PaymentMethod.CARD) && paymentRequest.cardSettings && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <CardTitle>Card Payment Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">3D Secure</p>
                    <p className="font-medium">
                      {paymentRequest.cardSettings.require3DS ? 'Required' : 'Optional'}
                    </p>
                  </div>
                  {paymentRequest.cardSettings.allowedBrands && (
                    <div>
                      <p className="text-sm text-muted-foreground">Allowed Brands</p>
                      <p className="font-medium">
                        {paymentRequest.cardSettings.allowedBrands.join(', ')}
                      </p>
                    </div>
                  )}
                  {paymentRequest.cardSettings.expiryDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Link Expiry</p>
                      <p className="font-medium">{formatDateTime(paymentRequest.cardSettings.expiryDate)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Link */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Link</CardTitle>
              <CardDescription>Share this link with your customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-md break-all text-sm">
                {paymentLink}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleCopy(paymentLink, 'Payment link')}
                  disabled={copying}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(paymentLink, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Link
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
              <CardDescription>Customer can scan to pay</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentLink)}`}
                  alt="Payment QR Code"
                  className="w-48 h-48"
                />
              </div>
            </CardContent>
          </Card>

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

