import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import ErrorAlert from '../components/ui/ErrorAlert';
import { formatCurrency, formatDateTime } from '../lib/utils';
import merchantLeaderService from '../services/merchantLeaderService';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import type { PaymentRequest } from '../types';

const GroupPaymentRequests: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadPaymentRequests();
  }, [pagination.page]);

  const loadPaymentRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await merchantLeaderService.getGroupPaymentRequests({
        page: pagination.page,
        limit: pagination.limit,
      });
      setPaymentRequests(response.data.paymentRequests);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Failed to load payment requests:', error);
      setError(error.response?.data?.error || 'Failed to load payment requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
      paid: 'success',
      processed: 'success',
      sent: 'secondary',
      viewed: 'secondary',
      pending_submission: 'warning',
      submitted: 'warning',
      rejected: 'destructive',
      failed: 'destructive',
      cancelled: 'destructive',
    };
    return statusMap[status] || 'secondary';
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading && paymentRequests.length === 0) {
    return <LoadingSpinner message="Loading payment requests..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/merchant-leader-dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Group Payment Requests</h1>
            <p className="text-muted-foreground">
              {pagination.total} payment request{pagination.total !== 1 ? 's' : ''} from your merchant group
            </p>
          </div>
        </div>
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {/* Payment Requests List */}
      {paymentRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payment requests found</h3>
              <p className="text-muted-foreground">
                Your merchant group hasn't created any payment requests yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {paymentRequests.map((request) => (
            <Card
              key={request._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/payment-requests/${request._id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Invoice Number and Status */}
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{request.invoiceNumber}</h3>
                      <StatusBadge
                        status={getStatusColor(request.status)}
                        label={getStatusLabel(request.status)}
                      />
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground">{request.description}</p>

                    {/* Merchant Info */}
                    {typeof request.userId === 'object' && (
                      <p className="text-sm">
                        <span className="font-medium">Merchant:</span>{' '}
                        <span className="text-muted-foreground">{request.userId.legalName}</span>
                      </p>
                    )}

                    {/* Additional Details */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>Created: {formatDateTime(request.createdAt)}</span>
                      {request.dueDate && (
                        <span>Due: {new Date(request.dueDate).toLocaleDateString()}</span>
                      )}
                      {request.paymentMethods && request.paymentMethods.length > 0 && (
                        <span>
                          Methods: {request.paymentMethods.map((m) => m.toUpperCase()).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount and Commission */}
                  <div className="text-right ml-6">
                    <p className="text-2xl font-bold">{formatCurrency(request.amount, request.currency)}</p>
                    {request.netAmount && (
                      <p className="text-sm text-muted-foreground">
                        Net: {formatCurrency(request.netAmount, request.currency)}
                      </p>
                    )}
                    <p className="text-sm text-green-600 font-medium mt-1">
                      Your Commission: {formatCurrency(request.amount * 0.05, request.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default GroupPaymentRequests;

