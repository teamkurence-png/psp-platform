import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Plus, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { PaymentRequestStatus, PaymentMethod } from '../types/index';
import api from '../lib/api';

interface PaymentRequest {
  _id: string;
  amount: number;
  currency: string;
  description: string;
  customerInfo: { name: string; email: string };
  paymentMethods: PaymentMethod[];
  status: PaymentRequestStatus;
  createdAt: string;
}

const PaymentRequests: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentRequests = async () => {
      try {
        setLoading(true);
        const response = await api.get('/payment-requests');
        setPaymentRequests(response.data.data.paymentRequests || []);
      } catch (error) {
        console.error('Failed to fetch payment requests:', error);
        setPaymentRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentRequests();
  }, []);

  // Filter payment requests based on search and status
  const filteredRequests = paymentRequests.filter((request) => {
    const matchesSearch = searchTerm === '' || 
      request.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: PaymentRequestStatus) => {
    switch (status) {
      case PaymentRequestStatus.PAID:
        return 'bg-green-100 text-green-800';
      case PaymentRequestStatus.VIEWED:
        return 'bg-blue-100 text-blue-800';
      case PaymentRequestStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      case PaymentRequestStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getMethodBadge = (method: PaymentMethod) => {
    return method === PaymentMethod.BANK_WIRE ? 'Bank Wire' : 'Card';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment requests...</p>
        </div>
      </div>
    );
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, invoice #, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="paid">Paid</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {paymentRequests.length === 0 
                  ? "No payment requests yet" 
                  : "No payment requests match your filters"}
              </p>
              {paymentRequests.length === 0 && (
                <Button asChild>
                  <Link to="/payment-requests/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first request
                  </Link>
                </Button>
              )}
            </div>
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
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
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

