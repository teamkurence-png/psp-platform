import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import type { Balance } from '../types/index';
import api from '../lib/api';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { DollarSign, TrendingUp, Clock, ArrowDownCircle } from 'lucide-react';

interface BalanceHistory {
  transactionId: string;
  amount: number;
  currency: string;
  fees: number;
  net: number;
  platformStatus: string;
  createdAt: string;
  settledAt?: string;
}

const Balances: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [history, setHistory] = useState<BalanceHistory[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balanceResponse, historyResponse] = await Promise.all([
        api.get('/balances'),
        api.get('/balances/history?limit=20'),
      ]);
      setBalance(balanceResponse.data.data);
      setHistory(historyResponse.data.data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch balance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading balance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Balances</h1>
          <p className="text-muted-foreground">View your balance and transaction history</p>
        </div>
        <Button asChild>
          <Link to="/settlements/new">
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Request Settlement
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

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Balance History</CardTitle>
              <CardDescription>Recent transactions affecting your balance</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settlements">View Settlements</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transaction history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((txn) => (
                <div key={txn.transactionId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-mono text-sm">{txn.transactionId}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDateTime(txn.createdAt)}
                      {txn.settledAt && ` • Settled: ${formatDateTime(txn.settledAt)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-green-600">
                      +{formatCurrency(txn.net, txn.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gross: {formatCurrency(txn.amount, txn.currency)}
                    </p>
                    <p className="text-xs text-red-600">
                      Fees: -{formatCurrency(txn.fees, txn.currency)}
                    </p>
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

