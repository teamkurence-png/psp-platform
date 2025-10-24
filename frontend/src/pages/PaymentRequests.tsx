import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import FilterBar from '../components/ui/FilterBar';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { PaymentMethod } from '../types/index';
import { useList, useSearch, useFilter } from '../hooks';
import { paymentRequestService, type PaymentRequest } from '../services';
import { PAYMENT_REQUEST_STATUS_OPTIONS } from '../constants';

const PaymentRequests: React.FC = () => {
  const { items: paymentRequests, loading, setItems, setLoading } = useList<PaymentRequest>();

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const response = await paymentRequestService.getAll();
      setItems(response.data.data.paymentRequests || []);
    } catch (error) {
      console.error('Failed to fetch payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const { searchTerm, setSearchTerm, filteredItems: searchedRequests } = useSearch(
    paymentRequests,
    (request, term) => {
      const lowerTerm = term.toLowerCase();
      return (
        request.customerInfo?.name?.toLowerCase().includes(lowerTerm) ||
        request.customerInfo?.email?.toLowerCase().includes(lowerTerm) ||
        request.description?.toLowerCase().includes(lowerTerm) ||
        request.invoiceNumber?.toLowerCase().includes(lowerTerm) ||
        false
      );
    }
  );

  const { filterValue: statusFilter, setFilterValue: setStatusFilter, filteredItems: filteredRequests } = useFilter(
    searchedRequests,
    (request, status) => request.status === status,
    'all'
  );

  const getMethodBadge = (method: PaymentMethod) => {
    return method === PaymentMethod.BANK_WIRE ? 'Bank Wire' : 'Card';
  };

  if (loading) {
    return <LoadingSpinner message="Loading payment requests..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Requests</h1>
          <p className="text-muted-foreground">Create and manage payment requests</p>
        </div>
        <Button asChild>
          <Link to="/payment-requests/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Request
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by customer, invoice #, or reason..."
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={PAYMENT_REQUEST_STATUS_OPTIONS}
          />
        </CardContent>
      </Card>

      {/* Payment Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>All Payment Requests</CardTitle>
          <CardDescription>
            {filteredRequests.length} {filteredRequests.length === paymentRequests.length ? 'total' : 'filtered'} request{filteredRequests.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <EmptyState
              message={
                paymentRequests.length === 0 
                  ? "No payment requests yet" 
                  : "No payment requests match your filters"
              }
            >
              {paymentRequests.length === 0 && (
                <Button asChild>
                  <Link to="/payment-requests/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first request
                  </Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Link
                  key={request._id}
                  to={`/payment-requests/${request._id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{request.customerInfo?.name || 'Unknown'}</h3>
                        <StatusBadge status={request.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {request.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{request.customerInfo?.email}</span>
                        <span>·</span>
                        <span>
                          {request.paymentMethods.map((m) => getMethodBadge(m)).join(', ')}
                        </span>
                        <span>·</span>
                        <span>{formatDateTime(request.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(request.amount, request.currency)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentRequests;
