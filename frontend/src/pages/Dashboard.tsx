import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
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

const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d'>('7d');

  // Mock data - will be replaced with real API calls
  const stats = {
    volume: 125430.50,
    approvals: 89,
    declines: 12,
    pendingReviews: 5,
    availableBalance: 45230.75,
    pendingBalance: 12450.00,
  };

  const alerts = [
    { id: 1, type: 'warning', message: '5 transactions awaiting confirmation' },
    { id: 2, type: 'info', message: 'Documents expiring in 30 days' },
  ];

  const recentTransactions = [
    { id: 'TXN001', customer: 'John Doe', amount: 1250.00, status: 'approved', date: '2025-10-22' },
    { id: 'TXN002', customer: 'Jane Smith', amount: 3400.50, status: 'pending', date: '2025-10-22' },
    { id: 'TXN003', customer: 'Acme Corp', amount: 5600.00, status: 'approved', date: '2025-10-21' },
  ];

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: 'up' | 'down'; 
    trendValue?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {trendValue}
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={dateRange === 'today' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setDateRange('today')}
          >
            Today
          </Button>
          <Button 
            variant={dateRange === '7d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setDateRange('7d')}
          >
            7 Days
          </Button>
          <Button 
            variant={dateRange === '30d' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setDateRange('30d')}
          >
            30 Days
          </Button>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

