import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import DateRangePicker from '../components/ui/DateRangePicker';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  FileText, 
  Bitcoin,
  AlertCircle,
  Wallet
} from 'lucide-react';
import { formatCurrency, formatDateForAPI, getDefaultDateRange, type DateRange } from '../lib/utils';
import { useFetch } from '../hooks';
import { dashboardService, type DashboardStats, type Alert } from '../services';

const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  const { data, loading } = useFetch<{
    stats: DashboardStats;
    alerts: Alert[];
  }>(
    () => dashboardService.getDashboardData(
      formatDateForAPI(dateRange.startDate),
      formatDateForAPI(dateRange.endDate)
    ),
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

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
        </div>
        <DateRangePicker 
          value={dateRange} 
          onChange={setDateRange}
        />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-center p-4 rounded-lg border shadow-sm ${
                alert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : alert.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className={`p-2 rounded-full mr-3 ${
                alert.type === 'warning'
                  ? 'bg-amber-100'
                  : alert.type === 'error'
                  ? 'bg-red-100'
                  : 'bg-blue-100'
              }`}>
                <AlertCircle className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{alert.message}</span>
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
          iconColor="blue"
        />
        <StatCard
          title="Approvals"
          value={stats.approvals}
          icon={TrendingUp}
          iconColor="green"
        />
        <StatCard
          title="Declines"
          value={stats.declines}
          icon={TrendingDown}
          iconColor="red"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingReviews}
          icon={Clock}
          iconColor="amber"
        />
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Available Balance</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">Ready for withdrawal</p>
                <div className="text-4xl font-bold text-green-700 mb-4">
                  {formatCurrency(stats.availableBalance)}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                    <Link to="/withdrawals">
                      <Bitcoin className="mr-1 h-3.5 w-3.5" />
                      Withdraw
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white" asChild>
                    <Link to="/balances">View Details</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">Pending Balance</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">Awaiting settlement</p>
                <div className="text-4xl font-bold text-orange-700 mb-4">
                  {formatCurrency(stats.pendingBalance)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Expected settlement: T+2 days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              to="/payment-requests/new"
              className="flex items-center justify-center gap-2 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium text-blue-900">Create Payment Request</span>
            </Link>
            <Link 
              to="/withdrawals"
              className="flex items-center justify-center gap-2 p-4 border-2 border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-all group"
            >
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Bitcoin className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium text-purple-900">Withdraw via Crypto</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
