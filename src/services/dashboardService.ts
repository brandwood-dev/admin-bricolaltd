import { apiClient, ApiResponse } from './api';

export interface DashboardStats {
  active_users: number;
  online_listings: number;
  active_reservations: number;
  pending_disputes: number;
  monthly_revenue: number;
  growth_percentage: number;
}

export interface ChartData {
  month: string;
  reservations: number;
  revenue: number;
  users: number;
  listings: number;
}

export interface CountryData {
  country: string;
  users: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'user_registration' | 'new_listing' | 'booking_completed' | 'dispute_resolved' | 'withdrawal_processed';
  description: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DashboardData {
  stats: DashboardStats;
  chart_data: ChartData[];
  country_data: CountryData[];
  recent_activities: RecentActivity[];
}

export interface DateRange {
  start_date: string;
  end_date: string;
}

class DashboardService {
  async getDashboardData(dateRange?: DateRange): Promise<ApiResponse<DashboardData>> {
    const params = dateRange ? { 
      start_date: dateRange.start_date, 
      end_date: dateRange.end_date 
    } : {};
    
    // Utiliser l'endpoint racine maintenant que le contrôleur est corrigé
    return await apiClient.get<DashboardData>('/admin/dashboard', { params });
  }

  async getStats(dateRange?: DateRange): Promise<ApiResponse<DashboardStats>> {
    const params = dateRange ? { 
      start_date: dateRange.start_date, 
      end_date: dateRange.end_date 
    } : {};
    
    return await apiClient.get<DashboardStats>('/admin/dashboard/stats', { params });
  }

  async getChartData(dateRange?: DateRange): Promise<ApiResponse<ChartData[]>> {
    const params = dateRange ? { 
      start_date: dateRange.start_date, 
      end_date: dateRange.end_date 
    } : {};
    
    return await apiClient.get<ChartData[]>('/admin/dashboard/chart-data', { params });
  }

  async getCountryData(): Promise<ApiResponse<CountryData[]>> {
    return await apiClient.get<CountryData[]>('/admin/dashboard/country-data');
  }

  async getRecentActivities(limit: number = 10): Promise<ApiResponse<RecentActivity[]>> {
    return await apiClient.get<RecentActivity[]>('/admin/dashboard/recent-activities', {
      params: { limit }
    });
  }

  async exportDashboardData(dateRange?: DateRange, format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    const params = {
      format,
      ...(dateRange && { 
        start_date: dateRange.start_date, 
        end_date: dateRange.end_date 
      })
    };
    
    const response = await apiClient.get('/admin/dashboard/export', {
      params,
      responseType: 'blob'
    });
    
    return new Blob([response.data]);
  }
}

export const dashboardService = new DashboardService();