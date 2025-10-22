import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatCurrency, formatDateTime } from '../lib/utils';
import api from '../lib/api';
import { ArrowDownCircle, Search, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Settlement {
  _id: string;
  settlementId: string;
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'crypto';
  destination: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  failureReason?: string;
  settledAt?: string;
  createdAt: string;
}

const Settlements: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settlements');
      setSettlements(response.data.data.settlements || []);
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSettlements = settlements.filter((settlement) => {
    const matchesSearch = searchTerm === '' || 
      settlement.settlementId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || settlement.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-semibold">Completed</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1 text-blue-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold">Processing</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-xs font-semibold">Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold">Pending</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settlements...</p>
        </div>
      </div>
    );
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by settlement ID or destination..."
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
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <Button variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {settlements.length === 0 
                  ? "No settlements yet" 
                  : "No settlements match your filters"}
              </p>
              {settlements.length === 0 && (
                <Button asChild>
                  <Link to="/settlements/new">
                    <ArrowDownCircle className="mr-2 h-4 w-4" />
                    Create your first settlement
                  </Link>
                </Button>
              )}
            </div>
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
                        {getStatusBadge(settlement.status)}
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

