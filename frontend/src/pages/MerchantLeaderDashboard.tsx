import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatusBadge from '../components/ui/StatusBadge';
import ErrorAlert from '../components/ui/ErrorAlert';
import { formatCurrency, formatDateTime } from '../lib/utils';
import merchantLeaderService from '../services/merchantLeaderService';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react';
import type { MerchantLeaderDashboard as DashboardData } from '../types';

const MerchantLeaderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await merchantLeaderService.getDashboard();
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      setError(error.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
      paid: 'success',
      processed: 'success',
      sent: 'secondary',
      viewed: 'secondary',
      pending_submission: 'warning',
      submitted: 'warning',
      rejected: 'destructive',
      failed: 'destructive',
      cancelled: 'destructive',
    };
    return statusMap[status] || 'secondary';
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  if (!dashboardData) {
    return <div>No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Merchant Leader Dashboard</h1>
          <p className="text-muted-foreground">Overview of your merchant group performance</p>
        </div>
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Group Merchants Count */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Group Merchants</p>
                <p className="text-2xl font-bold">{dashboardData.groupMerchantsCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total Payment Requests */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Requests</p>
                <p className="text-2xl font-bold">{dashboardData.totalPaymentRequests}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        {/* Total Commission Earned */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboardData.commissionStats.totalCommission, dashboardData.currency)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Commission Balance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(dashboardData.commissionBalance, dashboardData.currency)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
            <Button
              size="sm"
              className="mt-4 w-full"
              onClick={() => navigate('/withdrawals/new')}
              disabled={dashboardData.commissionBalance <= 0}
            >
              Withdraw Commission
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/merchant-leader/group-merchants')}
        >
          <Users className="h-4 w-4 mr-2" />
          View Group Merchants
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/merchant-leader/group-payment-requests')}
        >
          <FileText className="h-4 w-4 mr-2" />
          View Group Payment Requests
        </Button>
      </div>

      {/* Payment Request Stats */}
      {dashboardData.paymentRequestStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Request Statistics</CardTitle>
            <CardDescription>Breakdown of payment requests by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.paymentRequestStats.map((stat) => (
                <div key={stat._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge 
                      status={getStatusColor(stat._id)} 
                      label={getStatusLabel(stat._id)} 
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">Count: {stat.count}</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(stat.totalAmount, dashboardData.currency)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payment Requests */}
      {dashboardData.recentPaymentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Group Payment Requests</CardTitle>
            <CardDescription>Latest payment requests from your merchant group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentPaymentRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/payment-requests/${request._id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{request.invoiceNumber}</p>
                      <StatusBadge
                        status={getStatusColor(request.status)}
                        label={getStatusLabel(request.status)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {request.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {formatDateTime(request.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {formatCurrency(request.amount, request.currency)}
                    </p>
                    {request.commissionAmount && (
                      <p className="text-xs text-green-600">
                        Commission: {formatCurrency(request.amount * 0.05, request.currency)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => navigate('/merchant-leader/group-payment-requests')}
              >
                View All Payment Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MerchantLeaderDashboard;

