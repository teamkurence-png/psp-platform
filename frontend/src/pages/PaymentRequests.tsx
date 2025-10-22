import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Plus, Search, Filter } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { PaymentRequestStatus, PaymentMethod } from '../types/index';

const PaymentRequests: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - will be replaced with real API calls
  const paymentRequests = [
    {
      _id: '1',
      amount: 1250.00,
      currency: 'USD',
      description: 'Invoice #INV-001',
      customerInfo: { name: 'John Doe', email: 'john@example.com' },
      paymentMethods: [PaymentMethod.BANK_WIRE, PaymentMethod.CARD],
      status: PaymentRequestStatus.SENT,
      createdAt: '2025-10-22T10:00:00Z',
    },
    {
      _id: '2',
      amount: 3400.50,
      currency: 'USD',
      description: 'Invoice #INV-002',
      customerInfo: { name: 'Jane Smith', email: 'jane@example.com' },
      paymentMethods: [PaymentMethod.CARD],
      status: PaymentRequestStatus.VIEWED,
      createdAt: '2025-10-21T14:30:00Z',
    },
    {
      _id: '3',
      amount: 5600.00,
      currency: 'USD',
      description: 'Invoice #INV-003',
      customerInfo: { name: 'Acme Corp', email: 'billing@acme.com' },
      paymentMethods: [PaymentMethod.BANK_WIRE],
      status: PaymentRequestStatus.PAID,
      createdAt: '2025-10-20T09:15:00Z',
    },
  ];

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
          <CardDescription>{paymentRequests.length} total requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentRequests.map((request) => (
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
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentRequests;

