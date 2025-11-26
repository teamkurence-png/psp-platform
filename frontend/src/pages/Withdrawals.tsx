import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import FilterBar from '../components/ui/FilterBar';
import Pagination from '../components/ui/Pagination';
import { formatDateTime } from '../lib/utils';
import { useList, useSearch, useFilter } from '../hooks';
import { withdrawalService, type Withdrawal } from '../services';
import { WITHDRAWAL_STATUS_OPTIONS, getAssetLabel } from '../constants';
import { Bitcoin, ExternalLink, Wallet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../lib/utils';
import type { Balance } from '../types/index';
import api from '../lib/api';

const Withdrawals: React.FC = () => {
  const { merchantId } = useAuth();
  const navigate = useNavigate();
  const { items: withdrawals, loading, setItems, setLoading } = useList<Withdrawal>();
  const [balance, setBalance] = React.useState<Balance | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchWithdrawals();
    if (merchantId) {
      fetchBalance();
    }
  }, [merchantId, currentPage]);

  const fetchBalance = async () => {
    try {
      const response = await api.get('/balances');
      setBalance(response.data.data);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await withdrawalService.getAll({
        page: currentPage,
        limit: itemsPerPage,
      });
      setItems(response.data.data.withdrawals || []);
      
      // Extract pagination data
      const pagination = response.data.data.pagination;
      if (pagination) {
        setTotalPages(pagination.pages);
        setTotalItems(pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  // Reset to page 1 when filters change
  useEffect(() => {
    if (searchTerm || statusFilter !== 'all') {
      setCurrentPage(1);
    }
  }, [searchTerm, statusFilter]);

  if (loading) {
    return <LoadingSpinner message="Loading withdrawals..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Withdrawals</h1>
        <p className="text-muted-foreground">Withdraw funds to bank accounts or crypto wallets</p>
      </div>

      {/* Available Balance Card */}
      {merchantId && balance && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-900 font-medium">Available to Withdraw</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {formatCurrency(balance.available, balance.currency)}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Total Balance: {formatCurrency(balance.available + balance.pending, balance.currency)} 
                    {balance.pending > 0 && ` • Pending: ${formatCurrency(balance.pending, balance.currency)}`}
                  </p>
                </div>
              </div>
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <Link to="/withdrawals/new">
                  <Bitcoin className="mr-2 h-4 w-4" />
                  Withdraw Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Notice */}
      {!merchantId && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Admin View</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Withdrawals can only be created by merchant accounts. You are viewing all withdrawals in the system.
                  To create a withdrawal, please log in as a merchant account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  onClick={() => navigate(`/withdrawals/${withdrawal._id}`)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer"
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
                    {/* Merchant Info - visible for admins */}
                    {withdrawal.userId && typeof withdrawal.userId === 'object' && (
                      <p className="text-sm font-medium text-primary mb-2">
                        Merchant: {withdrawal.userId.legalName}
                      </p>
                    )}
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

          {/* Pagination - only show when no client-side filters are active */}
          {totalPages > 1 && !searchTerm && statusFilter === 'all' && (
            <div className="mt-6 pt-6 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Withdrawals;
