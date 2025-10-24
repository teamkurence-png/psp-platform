import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import type { Balance } from '../types/index';
import api from '../lib/api';
import { useFetch } from '../hooks';
import { useAuth } from '../lib/auth';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { DollarSign, TrendingUp, Clock, ArrowDownCircle } from 'lucide-react';

interface BalanceHistory {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  customerInfo?: {
    name?: string;
    email?: string;
  };
  invoiceNumber?: string;
}

interface BalanceData {
  balance: Balance;
  history: BalanceHistory[];
}

const Balances: React.FC = () => {
  const { merchantId } = useAuth();
  
  const { data, loading } = useFetch<BalanceData>(
    async () => {
      if (!merchantId) {
        return { balance: null, history: [] };
      }
      const [balanceResponse, historyResponse] = await Promise.all([
        api.get('/balances'),
        api.get('/balances/history?limit=20'),
      ]);
      return {
        balance: balanceResponse.data.data,
        history: historyResponse.data.data.paymentRequests || [],
      };
    },
    [merchantId]
  );

  const balance = data?.balance || null;
  const history = data?.history || [];

  if (loading) {
    return <LoadingSpinner message="Loading balance..." />;
  }

  // Show message if no merchant context (admin/ops users)
  if (!merchantId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Balances</h1>
          <p className="text-muted-foreground">View your balance details</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EmptyState message="This page is only available for merchant accounts. Admins can view merchant balances from the Merchants page." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Balances</h1>
          <p className="text-muted-foreground">View your balance details</p>
        </div>
        <Button asChild>
          <Link to="/withdrawals/new">
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Withdraw Funds
          </Link>
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                <h3 className="text-3xl font-bold mt-2 text-green-600">
                  {formatCurrency(balance?.available || 0, balance?.currency || 'USD')}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Ready for withdrawal
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Balance</p>
                <h3 className="text-3xl font-bold mt-2 text-orange-600">
                  {formatCurrency(balance?.pending || 0, balance?.currency || 'USD')}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Awaiting settlement
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reserve Balance</p>
                <h3 className="text-3xl font-bold mt-2 text-blue-600">
                  {formatCurrency(balance?.reserve || 0, balance?.currency || 'USD')}
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Risk reserve
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Breakdown */}
      {balance && balance.pendingBreakdown && balance.pendingBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Settlement Breakdown</CardTitle>
            <CardDescription>Expected settlement dates for pending funds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {balance.pendingBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-semibold">{formatCurrency(item.amount, item.currency)}</p>
                    <p className="text-sm text-muted-foreground">
                      Expected: {formatDateTime(item.settleDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Request History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Balance History</CardTitle>
              <CardDescription>Recent paid payment requests affecting your balance</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/withdrawals">View Withdrawals</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState message="No payment history yet" />
          ) : (
            <div className="space-y-4">
              {history.map((pr) => (
                <div key={pr._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">
                      {pr.customerInfo?.name || pr.customerInfo?.email || 'Unknown Customer'}
                    </p>
                    {pr.invoiceNumber && (
                      <p className="text-xs text-muted-foreground">Invoice: {pr.invoiceNumber}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {formatDateTime(pr.createdAt)}
                      {pr.paidAt && ` • Paid: ${formatDateTime(pr.paidAt)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-600">
                      {formatCurrency(pr.amount, pr.currency)}
                    </p>
                    <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                      {pr.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Balances;
