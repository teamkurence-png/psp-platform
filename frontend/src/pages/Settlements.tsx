import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import FilterBar from '../components/ui/FilterBar';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { useList, useSearch, useFilter } from '../hooks';
import { settlementService, type Settlement } from '../services';
import { SETTLEMENT_STATUS_OPTIONS } from '../constants';
import { ArrowDownCircle } from 'lucide-react';

const Settlements: React.FC = () => {
  const { items: settlements, loading, setItems, setLoading } = useList<Settlement>();

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const response = await settlementService.getAll();
      setItems(response.data.data.settlements || []);
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const { searchTerm, setSearchTerm, filteredItems: searchedSettlements } = useSearch(
    settlements,
    (settlement, term) => {
      const lowerTerm = term.toLowerCase();
      return (
        settlement.settlementId.toLowerCase().includes(lowerTerm) ||
        settlement.destination.toLowerCase().includes(lowerTerm)
      );
    }
  );

  const { filterValue: statusFilter, setFilterValue: setStatusFilter, filteredItems: filteredSettlements } = useFilter(
    searchedSettlements,
    (settlement, status) => settlement.status === status,
    'all'
  );

  if (loading) {
    return <LoadingSpinner message="Loading settlements..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settlements</h1>
          <p className="text-muted-foreground">Manage your settlement requests</p>
        </div>
        <Button asChild>
          <Link to="/settlements/new">
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            New Settlement
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by settlement ID or destination..."
            filterValue={statusFilter}
            onFilterChange={setStatusFilter}
            filterOptions={SETTLEMENT_STATUS_OPTIONS}
          />
        </CardContent>
      </Card>

      {/* Settlements List */}
      <Card>
        <CardHeader>
          <CardTitle>All Settlements</CardTitle>
          <CardDescription>
            {filteredSettlements.length} {filteredSettlements.length === settlements.length ? 'total' : 'filtered'} settlement{filteredSettlements.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSettlements.length === 0 ? (
            <EmptyState
              message={
                settlements.length === 0 
                  ? "No settlements yet" 
                  : "No settlements match your filters"
              }
            >
              {settlements.length === 0 && (
                <Button asChild>
                  <Link to="/settlements/new">
                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                    Create your first settlement
                  </Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {filteredSettlements.map((settlement) => (
                <Link
                  key={settlement._id}
                  to={`/settlements/${settlement._id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-mono font-semibold">{settlement.settlementId}</h3>
                        <StatusBadge status={settlement.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">{settlement.method.replace('_', ' ')}</span>
                        <span>·</span>
                        <span className="font-mono text-xs">{settlement.destination.substring(0, 20)}...</span>
                        <span>·</span>
                        <span>{formatDateTime(settlement.createdAt)}</span>
                      </div>
                      {settlement.failureReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Failed: {settlement.failureReason}
                        </p>
                      )}
                      {settlement.settledAt && (
                        <p className="text-sm text-green-600 mt-1">
                          Completed: {formatDateTime(settlement.settledAt)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(settlement.amount, settlement.currency)}</p>
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

export default Settlements;
