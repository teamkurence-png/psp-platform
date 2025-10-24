import api from '../lib/api';

export interface DashboardStats {
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

  getDashboardData: async (startDate?: string, endDate?: string) => {
    const [statsResponse, alertsResponse] = await Promise.all([
      dashboardService.getStats(startDate, endDate),
      dashboardService.getAlerts(),
    ]);

    return {
      stats: statsResponse.data.data as DashboardStats,
      alerts: alertsResponse.data.data as Alert[],
    };
  },
};

