import { apiClient, ApiResponse } from './api';

export interface AnalyticsKPI {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
  color: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  averageTransactionValue: number;
  revenueByMonth: {
    month: string;
    revenue: number;
    transactions: number;
  }[];
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userGrowth: number;
  usersByCountry: {
    country: string;
    users: number;
    percentage: number;
  }[];
  userGrowthByMonth: {
    month: string;
    newUsers: number;
    totalUsers: number;
  }[];
}

export interface ToolAnalytics {
  totalTools: number;
  activeTools: number;
  toolsByCategory: {
    category: string;
    count: number;
    percentage: number;
  }[];
  topPerformingTools: {
    id: string;
    title: string;
    bookings: number;
    revenue: number;
  }[];
}

export interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  bookingsByMonth: {
    month: string;
    bookings: number;
    revenue: number;
  }[];
  averageBookingValue: number;
}

export interface GeographicAnalytics {
  usersByRegion: {
    region: string;
    users: number;
    bookings: number;
    revenue: number;
  }[];
  topCities: {
    city: string;
    users: number;
    tools: number;
  }[];
}

// Add the missing AnalyticsData interface that the Analytics page expects
export interface AnalyticsData {
  kpis: {
    total_revenue: number;
    revenue_growth: number;
    active_users: number;
    user_growth: number;
    total_bookings: number;
    booking_growth: number;
    active_tools: number;
    tool_growth: number;
  };
  charts: {
    revenue: { date: string; revenue: number; transactions: number }[];
    categories: { category: string; count: number; percentage: number }[];
    user_growth: { date: string; newUsers: number; totalUsers: number }[];
    top_tools: { id: string; title: string; bookings: number; revenue: number }[];
  };
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

class AnalyticsService {
  // Revenue Analytics
  async getRevenueAnalytics(dateRange?: DateRange): Promise<ApiResponse<RevenueAnalytics>> {
    const params = dateRange ? {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    } : {};
    
    return await apiClient.get<RevenueAnalytics>('/admin/analytics/revenue', { params });
  }

  async getRevenueByPeriod(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; revenue: number; transactions: number }[]>> {
    return await apiClient.get<{ date: string; revenue: number; transactions: number }[]>('/admin/analytics/revenue/by-period', {
      params: { period }
    });
  }

  // User Analytics
  async getUserAnalytics(dateRange?: DateRange): Promise<ApiResponse<UserAnalytics>> {
    const params = dateRange ? {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    } : {};
    
    return await apiClient.get<UserAnalytics>('/admin/analytics/users', { params });
  }

  async getUserGrowth(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; newUsers: number; totalUsers: number }[]>> {
    return await apiClient.get<{ date: string; newUsers: number; totalUsers: number }[]>('/admin/analytics/users/growth', {
      params: { period }
    });
  }

  // Tool Analytics
  async getToolAnalytics(dateRange?: DateRange): Promise<ApiResponse<ToolAnalytics>> {
    const params = dateRange ? {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    } : {};
    
    return await apiClient.get<ToolAnalytics>('/admin/analytics/tools', { params });
  }

  async getToolsByCategory(): Promise<ApiResponse<{ category: string; count: number; percentage: number }[]>> {
    return await apiClient.get<{ category: string; count: number; percentage: number }[]>('/admin/analytics/tools/by-category');
  }

  // Booking Analytics
  async getBookingAnalytics(dateRange?: DateRange): Promise<ApiResponse<BookingAnalytics>> {
    const params = dateRange ? {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    } : {};
    
    return await apiClient.get<BookingAnalytics>('/admin/analytics/bookings', { params });
  }

  async getBookingsByPeriod(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; bookings: number; revenue: number }[]>> {
    return await apiClient.get<{ date: string; bookings: number; revenue: number }[]>('/admin/analytics/bookings/by-period', {
      params: { period }
    });
  }

  // Geographic Analytics
  async getGeographicAnalytics(): Promise<ApiResponse<GeographicAnalytics>> {
    return await apiClient.get<GeographicAnalytics>('/admin/analytics/geographic');
  }

  async getUsersByCountry(): Promise<ApiResponse<{ country: string; users: number; percentage: number }[]>> {
    return await apiClient.get<{ country: string; users: number; percentage: number }[]>('/admin/analytics/geographic/users-by-country');
  }

  // Combined Analytics
  async getAnalyticsOverview(dateRange?: DateRange): Promise<ApiResponse<{
    revenue: RevenueAnalytics;
    users: UserAnalytics;
    tools: ToolAnalytics;
    bookings: BookingAnalytics;
  }>> {
    const params = dateRange ? {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    } : {};
    
    return await apiClient.get<{
      revenue: RevenueAnalytics;
      users: UserAnalytics;
      tools: ToolAnalytics;
      bookings: BookingAnalytics;
    }>('/admin/analytics/overview', { params });
  }

  // Export functionality
  async exportAnalyticsReport(type: 'revenue' | 'users' | 'tools' | 'bookings', format: 'csv' | 'excel', dateRange?: DateRange): Promise<ApiResponse<Blob>> {
    const params = {
      type,
      format,
      ...(dateRange && {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      })
    };
    
    return await apiClient.get<Blob>('/admin/analytics/export', { 
      params,
      responseType: 'blob'
    } as any);
  }

  // Update the getAnalyticsData method to use the new formatted endpoint
  async getAnalyticsData(params: {
    start_date?: string;
    end_date?: string;
    period?: string;
  }): Promise<ApiResponse<AnalyticsData>> {
    try {
      const period = params.period || '30d';
      console.log('🔍 Fetching analytics data with period:', period);
      
      // Use the new formatted endpoint that returns data in the exact format we need
      const response = await apiClient.get('/admin/analytics/formatted', { 
        params: { period } 
      });

      console.log('📊 Formatted Analytics Response:', response.data);

      return {
        success: true,
        data: response.data,
        message: 'Analytics data retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Error fetching analytics data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Provide more detailed error information
      let errorMessage = 'Failed to fetch analytics data';
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Insufficient permissions.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Analytics endpoints not found.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return {
        success: false,
        data: null as any,
        message: errorMessage,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper method to calculate growth percentage from time series data
  private calculateGrowthFromChart(data: any[]): number {
    if (!data || data.length < 2) {
      console.log('⚠️ Insufficient data for growth calculation:', data);
      return 0;
    }
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const latestValue = parseFloat(latest?.revenue || latest?.users || latest?.bookings || '0');
    const previousValue = parseFloat(previous?.revenue || previous?.users || previous?.bookings || '0');
    
    console.log('📊 Growth calculation:', { latest: latestValue, previous: previousValue });
    
    if (previousValue === 0) return latestValue > 0 ? 100 : 0;
    
    const growth = ((latestValue - previousValue) / previousValue) * 100;
    console.log('📈 Calculated growth:', growth + '%');
    
    return growth;
  }
}

export const analyticsService = new AnalyticsService();