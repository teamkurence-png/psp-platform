import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { type PaymentRequest, PaymentRequestStatus, PaymentMethod, BankRail } from '../types/index';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { 
  CheckCircle, 
  Copy, 
  Building2, 
  CreditCard,
  AlertCircle 
} from 'lucide-react';

const PublicPayment: React.FC = () => {
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
      const response = await api.get(`/api/payment-requests/${id}/public`);
      setPaymentRequest(response.data);
    } catch (error) {
      console.error('Failed to fetch payment request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    } finally {
      setTimeout(() => setCopying(false), 1000);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment request...</p>
        </div>
      </div>
    );
  }

  if (!paymentRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Request Not Found</h2>
            <p className="text-muted-foreground">
              This payment request may have expired or been cancelled.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentRequest.status === PaymentRequestStatus.PAID) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Completed</h2>
            <p className="text-muted-foreground mb-4">
              This payment request has already been paid.
            </p>
            <p className="text-sm text-muted-foreground">
              Thank you for your payment!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentRequest.status === PaymentRequestStatus.EXPIRED || 
      paymentRequest.status === PaymentRequestStatus.CANCELLED) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Request {paymentRequest.status}</h2>
            <p className="text-muted-foreground">
              This payment request is no longer active.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Payment Request</CardTitle>
            <CardDescription>Please review the details and complete your payment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(paymentRequest.amount, paymentRequest.currency)}
              </p>
              {paymentRequest.description && (
                <p className="text-muted-foreground mt-2">{paymentRequest.description}</p>
              )}
              {paymentRequest.invoiceNumber && (
                <p className="text-sm text-muted-foreground mt-1">
                  Invoice: {paymentRequest.invoiceNumber}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        {paymentRequest.paymentMethods.includes(PaymentMethod.BANK_WIRE) && paymentRequest.bankDetails && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle>Bank Transfer Payment</CardTitle>
              </div>
              <CardDescription>Transfer funds to the following bank account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentRequest.bankDetails.rails && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Available Rails</p>
                    <p className="font-semibold text-gray-900">
                      {paymentRequest.bankDetails.rails.map(rail => getRailLabel(rail)).join(', ')}
                    </p>
                  </div>
                )}
                {paymentRequest.bankDetails.beneficiaryName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Beneficiary Name</p>
                    <p className="font-semibold text-gray-900">{paymentRequest.bankDetails.beneficiaryName}</p>
                  </div>
                )}
                {paymentRequest.bankDetails.iban && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IBAN</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-gray-900">{paymentRequest.bankDetails.iban}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(paymentRequest.bankDetails!.iban!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {paymentRequest.bankDetails.accountNumber && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Number</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-gray-900">{paymentRequest.bankDetails.accountNumber}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(paymentRequest.bankDetails!.accountNumber!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {paymentRequest.bankDetails.swiftCode && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">SWIFT/BIC</p>
                    <p className="font-mono text-sm text-gray-900">{paymentRequest.bankDetails.swiftCode}</p>
                  </div>
                )}
                {paymentRequest.bankDetails.bankName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Bank Name</p>
                    <p className="font-semibold text-gray-900">{paymentRequest.bankDetails.bankName}</p>
                  </div>
                )}
              </div>

              {paymentRequest.referenceCode && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">
                    ⚠️ IMPORTANT: Include this reference code in your transfer
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-mono font-bold text-yellow-900">
                      {paymentRequest.referenceCode}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(paymentRequest.referenceCode!)}
                      disabled={copying}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {paymentRequest.paymentMethods.includes(PaymentMethod.CARD) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle>Card Payment</CardTitle>
              </div>
              <CardDescription>Pay securely with your credit or debit card</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => window.open(paymentRequest.checkoutUrl, '_self')}
              >
                Pay with Card
              </Button>
              {paymentRequest.cardSettings?.require3DS && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  3D Secure authentication required
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Info */}
        {paymentRequest.dueDate && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900 text-center">
                <strong>Due Date:</strong> {formatDateTime(paymentRequest.dueDate)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Customer Info */}
        {paymentRequest.customerInfo && (
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {paymentRequest.customerInfo.name && (
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium text-gray-900">{paymentRequest.customerInfo.name}</p>
                  </div>
                )}
                {paymentRequest.customerInfo.email && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium text-gray-900">{paymentRequest.customerInfo.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Secure payment powered by PSP Platform</p>
          <p className="mt-1">Payment ID: {paymentRequest._id}</p>
        </div>
      </div>
    </div>
  );
};

export default PublicPayment;

