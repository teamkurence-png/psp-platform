import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import FilterBar from '../components/ui/FilterBar';
import { formatDateTime } from '../lib/utils';
import { useList, useSearch, useFilter } from '../hooks';
import { withdrawalService, type Withdrawal } from '../services';
import { WITHDRAWAL_STATUS_OPTIONS, getAssetLabel } from '../constants';
import { Bitcoin, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';

const Withdrawals: React.FC = () => {
  const { merchantId } = useAuth();
  const { items: withdrawals, loading, setItems, setLoading } = useList<Withdrawal>();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await withdrawalService.getAll();
      setItems(response.data.data.withdrawals || []);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const { searchTerm, setSearchTerm, filteredItems: searchedWithdrawals } = useSearch(
    withdrawals,
    (withdrawal, term) => {
      const lowerTerm = term.toLowerCase();
      return (
        withdrawal.address?.toLowerCase().includes(lowerTerm) ||
        withdrawal.txHash?.toLowerCase().includes(lowerTerm) ||
        withdrawal.iban?.toLowerCase().includes(lowerTerm) ||
        withdrawal.accountNumber?.toLowerCase().includes(lowerTerm) ||
        withdrawal.bankName?.toLowerCase().includes(lowerTerm) ||
        false
      );
    }
  );

  const { filterValue: statusFilter, setFilterValue: setStatusFilter, filteredItems: filteredWithdrawals } = useFilter(
    searchedWithdrawals,
    (withdrawal, status) => withdrawal.status === status,
    'all'
  );

  if (loading) {
    return <LoadingSpinner message="Loading withdrawals..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Withdrawals</h1>
          <p className="text-muted-foreground">Withdraw funds to bank accounts or crypto wallets</p>
        </div>
        {merchantId && (
          <Button asChild>
            <Link to="/withdrawals/new">
              <Bitcoin className="mr-2 h-4 w-4" />
              New Withdrawal
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by address, transaction hash, IBAN, or bank name..."
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={WITHDRAWAL_STATUS_OPTIONS}
          />
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
            <EmptyState
              message={
                withdrawals.length === 0 
                  ? "No withdrawals yet" 
                  : "No withdrawals match your filters"
              }
            >
              {withdrawals.length === 0 && merchantId && (
                <Button asChild>
                  <Link to="/withdrawals/new">
                    <Bitcoin className="mr-2 h-4 w-4" />
                    Create your first withdrawal
                  </Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {filteredWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold capitalize">
                        {withdrawal.method === 'crypto' 
                          ? getAssetLabel(withdrawal.asset!) 
                          : 'Bank Transfer'
                        }
                      </h3>
                      <StatusBadge status={withdrawal.status} />
                    </div>
                    <div className="space-y-1">
                      {withdrawal.method === 'crypto' ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          {withdrawal.iban && (
                            <p className="text-sm text-muted-foreground font-mono">
                              IBAN: {withdrawal.iban}
                            </p>
                          )}
                          {withdrawal.accountNumber && (
                            <p className="text-sm text-muted-foreground">
                              Account: {withdrawal.accountNumber}
                            </p>
                          )}
                          {withdrawal.bankName && (
                            <p className="text-sm text-muted-foreground">
                              {withdrawal.bankName}
                            </p>
                          )}
                          {withdrawal.beneficiaryName && (
                            <p className="text-sm text-muted-foreground">
                              To: {withdrawal.beneficiaryName}
                            </p>
                          )}
                        </>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(withdrawal.createdAt)}
                      </p>
                      {withdrawal.completedAt && (
                        <p className="text-xs text-green-600">
                          Completed: {formatDateTime(withdrawal.completedAt)}
                        </p>
                      )}
                      {withdrawal.failureReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Failed: {withdrawal.failureReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${withdrawal.amount.toFixed(2)}</p>
                    {withdrawal.fee > 0 && (
                      <p className="text-xs text-red-600">Fee: ${withdrawal.fee.toFixed(2)}</p>
                    )}
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
