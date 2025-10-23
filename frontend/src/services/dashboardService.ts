import api from '../lib/api';

export interface DashboardStats {
  volume: number;
  approvals: number;
  declines: number;
  pendingReviews: number;
  availableBalance: number;
  pendingBalance: number;
}

export interface Alert {
  id: string | number;
  type: 'warning' | 'info' | 'error';
  message: string;
}

export interface RecentTransaction {
  id: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

export const dashboardService = {
  getStats: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return api.get(`/dashboard/stats?${params.toString()}`);
  },

  getAlerts: () => {
    return api.get('/dashboard/alerts');
  },

  getRecentTransactions: () => {
    return api.get('/dashboard/recent-transactions');
  },

  getDashboardData: async (startDate?: string, endDate?: string) => {
    const [statsResponse, alertsResponse, transactionsResponse] = await Promise.all([
      dashboardService.getStats(startDate, endDate),
      dashboardService.getAlerts(),
      dashboardService.getRecentTransactions(),
    ]);

    return {
      stats: statsResponse.data.data as DashboardStats,
      alerts: alertsResponse.data.data as Alert[],
      recentTransactions: transactionsResponse.data.data as RecentTransaction[],
    };
  },
};

