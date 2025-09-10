import { apiClient, ApiResponse } from './api';
import {
  Booking,
  PaginatedResponse,
  BookingFilterParams,
  BookingStats
} from './types';

export interface CreateBookingData {
  toolId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  depositAmount: number;
  notes?: string;
}

export interface UpdateBookingData {
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  depositAmount?: number;
  notes?: string;
  status?: string;
}

export interface BookingActionData {
  reason?: string;
  adminNotes?: string;
}

class BookingsService {
  // CRUD Operations
  async getBookings(params?: BookingFilterParams): Promise<ApiResponse<PaginatedResponse<Booking>>> {
    return await apiClient.get<PaginatedResponse<Booking>>('/bookings', { params });
  }

  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    return await apiClient.get<Booking>(`/bookings/${id}`);
  }

  async createBooking(data: CreateBookingData): Promise<ApiResponse<Booking>> {
    return await apiClient.post<Booking>('/bookings', data);
  }

  async updateBooking(id: string, data: UpdateBookingData): Promise<ApiResponse<Booking>> {
    return await apiClient.patch<Booking>(`/bookings/${id}`, data);
  }

  async deleteBooking(id: string): Promise<ApiResponse<null>> {
    return await apiClient.delete<null>(`/bookings/${id}`);
  }

  // Booking Status Management
  async confirmBooking(id: string, data?: BookingActionData): Promise<ApiResponse<Booking>> {
    return await apiClient.patch<Booking>(`/bookings/${id}/confirm`, data);
  }

  async cancelBooking(id: string, data: BookingActionData): Promise<ApiResponse<Booking>> {
    return await apiClient.patch<Booking>(`/bookings/${id}/cancel`, data);
  }

  async completeBooking(id: string, data?: BookingActionData): Promise<ApiResponse<Booking>> {
    return await apiClient.patch<Booking>(`/bookings/${id}/complete`, data);
  }

  async approveBooking(id: string, data?: BookingActionData): Promise<ApiResponse<Booking>> {
    return await apiClient.patch<Booking>(`/bookings/${id}/approve`, data);
  }

  async rejectBooking(id: string, data: BookingActionData): Promise<ApiResponse<Booking>> {
    return await apiClient.patch<Booking>(`/bookings/${id}/reject`, data);
  }

  // User-specific bookings
  async getUserBookings(userId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Booking>>> {
    return await apiClient.get<PaginatedResponse<Booking>>(`/bookings/user/${userId}`, { params });
  }

  async getToolBookings(toolId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Booking>>> {
    return await apiClient.get<PaginatedResponse<Booking>>(`/bookings/tool/${toolId}`, { params });
  }

  // Analytics and Stats
  async getBookingStats(): Promise<ApiResponse<BookingStats>> {
    return await apiClient.get<BookingStats>('/admin/bookings/stats');
  }

  async getBookingAnalytics(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; bookings: number; revenue: number }[]>> {
    return await apiClient.get<{ date: string; bookings: number; revenue: number }[]>(`/admin/bookings/analytics?period=${period}`);
  }

  // Export functionality
  async exportBookings(params?: BookingFilterParams): Promise<ApiResponse<{ downloadUrl: string }>> {
    return await apiClient.get<{ downloadUrl: string }>('/admin/bookings/export', { params });
  }

  // Bulk operations
  async bulkUpdateBookings(bookingIds: string[], action: 'confirm' | 'cancel' | 'complete', data?: BookingActionData): Promise<ApiResponse<{ success: number; failed: number; errors: string[] }>> {
    return await apiClient.post<{ success: number; failed: number; errors: string[] }>('/admin/bookings/bulk-action', {
      bookingIds,
      action,
      ...data
    });
  }

  // Search functionality
  async searchBookings(query: string, filters?: Partial<BookingFilterParams>): Promise<ApiResponse<PaginatedResponse<Booking>>> {
    const params = {
      search: query,
      ...filters
    };
    return await apiClient.get<PaginatedResponse<Booking>>('/bookings/search', { params });
  }

  // Booking timeline and history
  async getBookingHistory(id: string): Promise<ApiResponse<{ action: string; timestamp: string; user: string; notes?: string }[]>> {
    return await apiClient.get<{ action: string; timestamp: string; user: string; notes?: string }[]>(`/bookings/${id}/history`);
  }

  // Communication
  async sendBookingNotification(id: string, type: 'reminder' | 'update' | 'confirmation', message?: string): Promise<ApiResponse<null>> {
    return await apiClient.post<null>(`/bookings/${id}/notify`, { type, message });
  }
}

export const bookingsService = new BookingsService();
export default bookingsService;