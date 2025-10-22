import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { CryptoAsset, WithdrawalStatus } from '../types/index';
import api from '../lib/api';
import { Bitcoin, Search, Filter, CheckCircle, Clock, XCircle, ExternalLink } from 'lucide-react';

interface Withdrawal {
  _id: string;
  asset: CryptoAsset;
  network: string;
  address: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: WithdrawalStatus;
  txHash?: string;
  confirmations?: number;
  explorerUrl?: string;
  failureReason?: string;
  createdAt: string;
}

const Withdrawals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/withdrawals');
      setWithdrawals(response.data.data.withdrawals || []);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    const matchesSearch = searchTerm === '' || 
      withdrawal.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.txHash?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.PAID:
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-semibold">Paid</span>
          </div>
        );
      case WithdrawalStatus.ON_CHAIN:
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold">On Chain</span>
          </div>
        );
      case WithdrawalStatus.FAILED:
      case WithdrawalStatus.REVERSED:
        return (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-xs font-semibold">{status}</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold">Initiated</span>
          </div>
        );
    }
  };

  const getAssetLabel = (asset: CryptoAsset) => {
    switch (asset) {
      case CryptoAsset.USDT_TRC20:
        return 'USDT (TRC20)';
      case CryptoAsset.USDT_ERC20:
        return 'USDT (ERC20)';
      case CryptoAsset.BTC:
        return 'Bitcoin';
      case CryptoAsset.ETH:
        return 'Ethereum';
      default:
        return asset;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Crypto Withdrawals</h1>
          <p className="text-muted-foreground">Withdraw funds via cryptocurrency</p>
        </div>
        <Button asChild>
          <Link to="/withdrawals/new">
            <Bitcoin className="mr-2 h-4 w-4" />
            New Withdrawal
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
                  placeholder="Search by address or transaction hash..."
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
                <option value="initiated">Initiated</option>
                <option value="on_chain">On Chain</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals List */}
      <Card>
        <CardHeader>
          <CardTitle>All Withdrawals</CardTitle>
          <CardDescription>
            {filteredWithdrawals.length} {filteredWithdrawals.length === withdrawals.length ? 'total' : 'filtered'} withdrawal{filteredWithdrawals.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {withdrawals.length === 0 
                  ? "No withdrawals yet" 
                  : "No withdrawals match your filters"}
              </p>
              {withdrawals.length === 0 && (
                <Button asChild>
                  <Link to="/withdrawals/new">
                    <Bitcoin className="mr-2 h-4 w-4" />
                    Create your first withdrawal
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{getAssetLabel(withdrawal.asset)}</h3>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-mono text-xs">{withdrawal.address}</span>
                      </p>
                      {withdrawal.txHash && (
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground font-mono">
                            TX: {withdrawal.txHash.substring(0, 16)}...
                          </p>
                          {withdrawal.explorerUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(withdrawal.explorerUrl, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                      {withdrawal.confirmations !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Confirmations: {withdrawal.confirmations}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(withdrawal.createdAt)}
                      </p>
                      {withdrawal.failureReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Failed: {withdrawal.failureReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${withdrawal.amount.toFixed(2)}</p>
                    <p className="text-xs text-red-600">Fee: ${withdrawal.fee.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Net: ${withdrawal.netAmount.toFixed(2)}</p>
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

export default Withdrawals;

