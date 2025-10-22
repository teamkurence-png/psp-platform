import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Search, Filter, Download } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { TransactionStatus, PaymentMethod, MerchantConfirmation } from '../types/index';

const Transactions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Mock data - will be replaced with real API calls
  const transactions = [
    {
      _id: '1',
      transactionId: 'TXN20251022001',
      customerInfo: { name: 'John Doe', email: 'john@example.com' },
      method: PaymentMethod.CARD,
      amount: 1250.00,
      currency: 'USD',
      merchantConfirmation: MerchantConfirmation.SUCCESS,
      platformStatus: TransactionStatus.APPROVED,
      riskScore: 15,
      createdAt: '2025-10-22T10:00:00Z',
      updatedAt: '2025-10-22T10:30:00Z',
    },
    {
      _id: '2',
      transactionId: 'TXN20251022002',
      customerInfo: { name: 'Jane Smith', email: 'jane@example.com' },
      method: PaymentMethod.BANK_WIRE,
      amount: 3400.50,
      currency: 'USD',
      merchantConfirmation: MerchantConfirmation.PENDING,
      platformStatus: TransactionStatus.PENDING_REVIEW,
      riskScore: 25,
      createdAt: '2025-10-22T11:00:00Z',
      updatedAt: '2025-10-22T11:00:00Z',
    },
    {
      _id: '3',
      transactionId: 'TXN20251021003',
      customerInfo: { name: 'Acme Corp', email: 'billing@acme.com' },
      method: PaymentMethod.CARD,
      amount: 5600.00,
      currency: 'USD',
      merchantConfirmation: MerchantConfirmation.SUCCESS,
      platformStatus: TransactionStatus.SETTLED,
      riskScore: 10,
      createdAt: '2025-10-21T09:15:00Z',
      updatedAt: '2025-10-21T15:00:00Z',
    },
  ];

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case TransactionStatus.SETTLED:
        return 'bg-blue-100 text-blue-800';
      case TransactionStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getConfirmationColor = (confirmation: MerchantConfirmation) => {
    switch (confirmation) {
      case MerchantConfirmation.SUCCESS:
        return 'text-green-600';
      case MerchantConfirmation.FAILED:
        return 'text-red-600';
      case MerchantConfirmation.NOT_RECEIVED:
        return 'text-gray-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage all payment transactions</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
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
                  placeholder="Search by transaction ID, customer email, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Methods</option>
                <option value="card">Card</option>
                <option value="bank_wire">Bank Wire</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="settled">Settled</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>{transactions.length} total transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Transaction ID</th>
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 font-medium">Method</th>
                  <th className="text-left py-3 px-4 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 font-medium">Confirmation</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Risk Score</th>
                  <th className="text-left py-3 px-4 font-medium">Created</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn._id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4">
                      <Link 
                        to={`/transactions/${txn._id}`}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        {txn.transactionId}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{txn.customerInfo?.name}</p>
                        <p className="text-sm text-muted-foreground">{txn.customerInfo?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {txn.method === PaymentMethod.CARD ? 'Card' : 'Bank Wire'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{formatCurrency(txn.amount, txn.currency)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${getConfirmationColor(txn.merchantConfirmation)}`}>
                        {txn.merchantConfirmation.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(txn.platformStatus)}`}>
                        {txn.platformStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${getRiskScoreColor(txn.riskScore)}`}>
                        {txn.riskScore}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">
                        {formatDateTime(txn.createdAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/transactions/${txn._id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;

