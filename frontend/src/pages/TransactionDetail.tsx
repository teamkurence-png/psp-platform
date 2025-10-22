import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { type Transaction, TransactionStatus, MerchantConfirmation, PaymentMethod } from '../types/index';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  CreditCard,
  Building2,
  FileText,
  AlertCircle,
  TrendingUp,
  Shield
} from 'lucide-react';

const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (id) {
      fetchTransaction();
    }
  }, [id]);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/transactions/${id}`);
      setTransaction(response.data);
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      alert('Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED:
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Approved</span>
          </div>
        );
      case TransactionStatus.SETTLED:
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Settled</span>
          </div>
        );
      case TransactionStatus.REJECTED:
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="font-semibold">Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Pending Review</span>
          </div>
        );
    }
  };

  const getConfirmationBadge = (confirmation: MerchantConfirmation) => {
    switch (confirmation) {
      case MerchantConfirmation.SUCCESS:
        return <span className="text-green-600 font-semibold">Success</span>;
      case MerchantConfirmation.FAILED:
        return <span className="text-red-600 font-semibold">Failed</span>;
      case MerchantConfirmation.NOT_RECEIVED:
        return <span className="text-gray-600 font-semibold">Not Received</span>;
      default:
        return <span className="text-yellow-600 font-semibold">Pending</span>;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLevel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 70) return 'Medium Risk';
    return 'High Risk';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Transaction not found</p>
        <Button asChild className="mt-4">
          <Link to="/transactions">Back to Transactions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/transactions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Transaction Details</h1>
            <p className="text-muted-foreground font-mono">{transaction.transactionId}</p>
          </div>
        </div>
        {getStatusBadge(transaction.platformStatus)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fees</p>
                  <p className="text-lg font-semibold text-red-600">
                    -{formatCurrency(transaction.fees, transaction.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Amount</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(transaction.net, transaction.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Method</p>
                  <p className="font-medium">
                    {transaction.method === PaymentMethod.CARD ? 'Card' : 'Bank Wire'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Merchant Confirmation</p>
                  {getConfirmationBadge(transaction.merchantConfirmation)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(transaction.createdAt)}</p>
                </div>
                {transaction.settledAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Settled At</p>
                    <p className="font-medium">{formatDateTime(transaction.settledAt)}</p>
                  </div>
                )}
                {transaction.refunded && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Refund Amount</p>
                      <p className="font-medium text-red-600">
                        {formatCurrency(transaction.refundAmount || 0, transaction.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Refunded At</p>
                      <p className="font-medium">{formatDateTime(transaction.refundedAt!)}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          {transaction.customerInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {transaction.customerInfo.name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{transaction.customerInfo.name}</p>
                    </div>
                  )}
                  {transaction.customerInfo.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{transaction.customerInfo.email}</p>
                    </div>
                  )}
                  {transaction.customerInfo.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{transaction.customerInfo.phone}</p>
                    </div>
                  )}
                  {transaction.customerInfo.country && (
                    <div>
                      <p className="text-sm text-muted-foreground">Country</p>
                      <p className="font-medium">{transaction.customerInfo.country}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method Details */}
          {transaction.method === PaymentMethod.CARD && transaction.cardDetails && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  <CardTitle>Card Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {transaction.cardDetails.brand && (
                    <div>
                      <p className="text-sm text-muted-foreground">Brand</p>
                      <p className="font-medium capitalize">{transaction.cardDetails.brand}</p>
                    </div>
                  )}
                  {transaction.cardDetails.last4 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Card Number</p>
                      <p className="font-mono">**** **** **** {transaction.cardDetails.last4}</p>
                    </div>
                  )}
                  {transaction.cardDetails.bin && (
                    <div>
                      <p className="text-sm text-muted-foreground">BIN</p>
                      <p className="font-mono">{transaction.cardDetails.bin}</p>
                    </div>
                  )}
                  {transaction.cardDetails.expiryMonth && transaction.cardDetails.expiryYear && (
                    <div>
                      <p className="text-sm text-muted-foreground">Expiry</p>
                      <p className="font-medium">
                        {transaction.cardDetails.expiryMonth}/{transaction.cardDetails.expiryYear}
                      </p>
                    </div>
                  )}
                  {transaction.cardDetails.cardholderName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cardholder Name</p>
                      <p className="font-medium">{transaction.cardDetails.cardholderName}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {transaction.method === PaymentMethod.BANK_WIRE && transaction.bankWireDetails && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle>Bank Wire Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {transaction.bankWireDetails.senderName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sender Name</p>
                      <p className="font-medium">{transaction.bankWireDetails.senderName}</p>
                    </div>
                  )}
                  {transaction.bankWireDetails.senderBank && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sender Bank</p>
                      <p className="font-medium">{transaction.bankWireDetails.senderBank}</p>
                    </div>
                  )}
                  {transaction.bankWireDetails.iban && (
                    <div>
                      <p className="text-sm text-muted-foreground">IBAN</p>
                      <p className="font-mono text-sm">{transaction.bankWireDetails.iban}</p>
                    </div>
                  )}
                  {transaction.bankWireDetails.referenceNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Reference Number</p>
                      <p className="font-mono">{transaction.bankWireDetails.referenceNumber}</p>
                    </div>
                  )}
                  {transaction.bankWireDetails.receivedDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Received Date</p>
                      <p className="font-medium">{formatDateTime(transaction.bankWireDetails.receivedDate)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmation Status</p>
                    {getConfirmationBadge(transaction.bankWireDetails.confirmationStatus)}
                  </div>
                </div>
                {transaction.bankWireDetails.proofFilePath && (
                  <div className="mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`${api.defaults.baseURL}/${transaction.bankWireDetails!.proofFilePath}`, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Proof
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Timeline</CardTitle>
              <CardDescription>History of events and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              {transaction.timeline && transaction.timeline.length > 0 ? (
                <div className="space-y-4">
                  {transaction.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        {index < transaction.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-semibold">{event.event}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(event.timestamp)}
                        </p>
                        {event.actor && (
                          <p className="text-sm text-muted-foreground">By: {event.actor}</p>
                        )}
                        {event.notes && (
                          <p className="text-sm mt-1">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No timeline events yet</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {transaction.notes && transaction.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transaction.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{note.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(note.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Analysis */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Risk Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Risk Score</p>
                <div className={`text-4xl font-bold ${getRiskScoreColor(transaction.riskScore)}`}>
                  {transaction.riskScore}
                </div>
                <p className={`text-sm font-semibold mt-1 ${getRiskScoreColor(transaction.riskScore)}`}>
                  {getRiskLevel(transaction.riskScore)}
                </p>
              </div>

              {transaction.riskSignals && (
                <div className="space-y-3 border-t pt-4">
                  {transaction.riskSignals.ipAddress && (
                    <div>
                      <p className="text-xs text-muted-foreground">IP Address</p>
                      <p className="text-sm font-mono">{transaction.riskSignals.ipAddress}</p>
                    </div>
                  )}
                  {transaction.riskSignals.velocityScore !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Velocity Score</p>
                      <p className="text-sm font-semibold">{transaction.riskSignals.velocityScore}</p>
                    </div>
                  )}
                  {transaction.riskSignals.deviceFingerprint && (
                    <div>
                      <p className="text-xs text-muted-foreground">Device Fingerprint</p>
                      <p className="text-sm font-mono break-all">{transaction.riskSignals.deviceFingerprint}</p>
                    </div>
                  )}
                  {transaction.riskSignals.blacklistMatches && transaction.riskSignals.blacklistMatches.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Blacklist Matches</p>
                      <div className="space-y-1 mt-1">
                        {transaction.riskSignals.blacklistMatches.map((match, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            {match}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {transaction.platformStatus === TransactionStatus.PENDING_REVIEW && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Transaction
                </Button>
                <Button className="w-full" variant="outline">
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Transaction
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {transaction.attachments && transaction.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {transaction.attachments.map((attachment, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(`${api.defaults.baseURL}/${attachment.filePath}`, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {attachment.fileName}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;

