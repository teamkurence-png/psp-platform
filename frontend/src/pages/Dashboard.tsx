import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  FileText, 
  Bitcoin,
  AlertCircle 
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useFetch } from '../hooks';
import { dashboardService, type DashboardStats, type Alert, type RecentTransaction } from '../services';
import { DATE_RANGE_OPTIONS, type DateRange } from '../constants';

const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('7d');

  const { data, loading } = useFetch<{
    stats: DashboardStats;
    alerts: Alert[];
    recentTransactions: RecentTransaction[];
  }>(
    () => dashboardService.getDashboardData(dateRange),
    [dateRange]
  );

  const stats = data?.stats || {
    volume: 0,
    approvals: 0,
    declines: 0,
    pendingReviews: 0,
    availableBalance: 0,
    pendingBalance: 0,
  };
  const alerts = data?.alerts || [];
  const recentTransactions = data?.recentTransactions || [];

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex items-center space-x-2">
          {DATE_RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={dateRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center p-4 rounded-lg border ${
                alert.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : alert.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <AlertCircle className="h-5 w-5 mr-3" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Volume"
          value={formatCurrency(stats.volume)}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5%"
        />
        <StatCard
          title="Approvals"
          value={stats.approvals}
          icon={TrendingUp}
          trend="up"
          trendValue="+8.2%"
        />
        <StatCard
          title="Declines"
          value={stats.declines}
          icon={TrendingDown}
          trend="down"
          trendValue="-3.1%"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={Clock}
        />
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
            <CardDescription>Ready for withdrawal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(stats.availableBalance)}
            </div>
            <div className="mt-4 flex space-x-2">
              <Button size="sm" asChild>
                <Link to="/withdrawals">Withdraw via Crypto</Link>
              </Button>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Balance</CardTitle>
            <CardDescription>Awaiting settlement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(stats.pendingBalance)}
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Expected settlement: T+2 days
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild>
              <Link to="/payment-requests/new">
                <FileText className="mr-2 h-4 w-4" />
                Create Payment Request
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/settings/bank">Add Bank Details</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/withdrawals">
                <Bitcoin className="mr-2 h-4 w-4" />
                Withdraw via Crypto
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payment activities</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/transactions">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <EmptyState message="No recent transactions yet">
              <Button asChild className="mt-4" size="sm">
                <Link to="/payment-requests/new">Create your first payment request</Link>
              </Button>
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{txn.customer}</p>
                    <p className="text-sm text-muted-foreground">{txn.id} · {txn.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(txn.amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      txn.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {txn.status}
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

export default Dashboard;
