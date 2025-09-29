import { apiClient, ApiResponse } from './api';
import {
  User,
  UserFilterParams,
  PaginatedResponse,
  UserActivity,
  Transaction,
  Booking,
  Tool,
  Wallet,
  Document,
  ActivityType
} from './types';

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isAdmin?: boolean;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  verifiedEmail?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
}

export interface BulkUserAction {
  userIds: string[];
  action: 'activate' | 'deactivate' | 'verify_email' | 'unverify_email' | 'delete';
  reason?: string;
}

export interface UserNotificationData {
  userIds: string[];
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  sendEmail?: boolean;
}

class UserService {
  // CRUD Operations
  async getUsers(params?: UserFilterParams): Promise<ApiResponse<PaginatedResponse<User>>> {
    return await apiClient.get<PaginatedResponse<User>>('/users', { params });
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return await apiClient.get<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserData): Promise<ApiResponse<User>> {
    return await apiClient.post<User>('/users', data);
  }

  async updateUser(id: string, data: UpdateUserData): Promise<ApiResponse<User>> {
    return await apiClient.put<User>(`/users/${id}`, data);
  }

  async deleteUser(id: string, reason?: string): Promise<ApiResponse<null>> {
    return await apiClient.delete<null>(`/users/${id}`, { data: { reason } });
  }

  // User Status Management
  async activateUser(id: string, reason?: string): Promise<ApiResponse<User>> {
    return await apiClient.patch<User>(`/users/${id}/activate`, { reason });
  }

  async deactivateUser(id: string, reason?: string): Promise<ApiResponse<User>> {
    return await apiClient.patch<User>(`/users/${id}/deactivate`, { reason });
  }

  async suspendUser(id: string, reason: string): Promise<ApiResponse<User>> {
    return await apiClient.post<User>(`/users/${id}/suspend`, { reason });
  }

  async banUser(id: string, reason: string, permanent?: boolean): Promise<ApiResponse<User>> {
    return await apiClient.patch<User>(`/users/${id}/ban`, { reason, permanent });
  }

  async unbanUser(id: string, reason?: string): Promise<ApiResponse<User>> {
    return await apiClient.patch<User>(`/users/${id}/unban`, { reason });
  }

  // Email Verification
  async verifyUserEmail(id: string): Promise<ApiResponse<User>> {
    return await apiClient.patch<User>(`/users/${id}/verify-email`);
  }

  async unverifyUserEmail(id: string): Promise<ApiResponse<User>> {
    return await apiClient.patch<User>(`/users/${id}/unverify-email`);
  }

  async requestEmailVerification(id: string): Promise<ApiResponse<null>> {
    return await apiClient.post<null>(`/users/${id}/request-verification`);
  }

  // Wallet Management
  async getUserWallet(id: string): Promise<ApiResponse<Wallet>> {
    return await apiClient.get<Wallet>(`/users/${id}/wallet`);
  }

  async adjustUserBalance(id: string, amount: number, reason: string): Promise<ApiResponse<Wallet>> {
    return await apiClient.patch<Wallet>(`/users/${id}/wallet/adjust`, { amount, reason });
  }

  async freezeUserWallet(id: string, reason: string): Promise<ApiResponse<Wallet>> {
    return await apiClient.patch<Wallet>(`/users/${id}/wallet/freeze`, { reason });
  }

  async unfreezeUserWallet(id: string): Promise<ApiResponse<Wallet>> {
    return await apiClient.patch<Wallet>(`/users/${id}/wallet/unfreeze`);
  }

  // Bulk Operations
  async bulkUserAction(action: BulkUserAction): Promise<ApiResponse<{ success: number; failed: number; errors: string[] }>> {
    return await apiClient.post<{ success: number; failed: number; errors: string[] }>('/users/bulk-action', action);
  }

  async bulkExportUsers(params?: UserFilterParams): Promise<ApiResponse<{ downloadUrl: string }>> {
    return await apiClient.post<{ downloadUrl: string }>('/users/export', { params });
  }

  // Search and Filtering
  async searchUsers(query: string, filters?: Partial<UserFilterParams>): Promise<ApiResponse<PaginatedResponse<User>>> {
    return await apiClient.get<PaginatedResponse<User>>('/users/search', {
      params: { search: query, ...filters }
    });
  }

  async getUsersByCountry(): Promise<ApiResponse<{ country: string; count: number }[]>> {
    return await apiClient.get<{ country: string; count: number }[]>('/users/by-country');
  }

  async getUsersByRegistrationDate(startDate: string, endDate: string): Promise<ApiResponse<{ date: string; count: number }[]>> {
    return await apiClient.get<{ date: string; count: number }[]>('/users/by-registration-date', {
      params: { startDate, endDate }
    });
  }

  // Data Export
  async exportUsersCSV(params?: UserFilterParams): Promise<ApiResponse<Blob>> {
    return await apiClient.downloadFile('/users/export/csv', { params });
  }

  async exportUsersExcel(params?: UserFilterParams): Promise<ApiResponse<Blob>> {
    return await apiClient.downloadFile('/users/export/excel', { params });
  }

  // User Analytics
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return await apiClient.get<UserStats>('/users/stats');
  }

  async getUserGrowthAnalytics(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; newUsers: number; totalUsers: number }[]>> {
    return await apiClient.get<{ date: string; newUsers: number; totalUsers: number }[]>('/users/analytics/growth', {
      params: { period }
    });
  }

  async getUserActivityAnalytics(userId: string, period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; activities: number }[]>> {
    return await apiClient.get<{ date: string; activities: number }[]>(`/users/analytics/activity`, {
      params: { period }
    });
  }

  // User Impersonation
  async impersonateUser(id: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return await apiClient.post<{ token: string; user: User }>(`/users/${id}/impersonate`);
  }

  async stopImpersonation(): Promise<ApiResponse<null>> {
    return await apiClient.post<null>('/users/stop-impersonation');
  }

  // User Notifications
  async sendNotificationToUsers(data: UserNotificationData): Promise<ApiResponse<{ sent: number; failed: number }>> {
    return await apiClient.post<{ sent: number; failed: number }>('/users/send-notification', data);
  }

  async sendNotificationToUser(id: string, title: string, message: string, type: 'info' | 'warning' | 'success' | 'error'): Promise<ApiResponse<null>> {
    return await apiClient.post<null>(`/users/${id}/send-notification`, { title, message, type });
  }

  // Related Data Access
  async getUserTransactions(id: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    return await apiClient.get<PaginatedResponse<Transaction>>(`/users/${id}/transactions`, { params });
  }

  async getUserBookings(id: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Booking>>> {
    return await apiClient.get<PaginatedResponse<Booking>>(`/users/${id}/bookings`, { params });
  }

  async getUserTools(id: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Tool>>> {
    return await apiClient.get<PaginatedResponse<Tool>>(`/users/${id}/tools`, { params });
  }

  async getUserActivities(id: string, params?: { page?: number; limit?: number; type?: ActivityType }): Promise<ApiResponse<PaginatedResponse<UserActivity>>> {
    return await apiClient.get<PaginatedResponse<UserActivity>>(`/users/${id}/activities`, { params });
  }

  async getUserDocuments(id: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Document>>> {
    return await apiClient.get<PaginatedResponse<Document>>(`/users/${id}/documents`, { params });
  }

  // Password Management
  async resetUserPassword(id: string, newPassword: string, sendEmail?: boolean): Promise<ApiResponse<null>> {
    return await apiClient.post<null>(`/users/${id}/reset-password`, { newPassword, sendEmail });
  }

  async forcePasswordChange(id: string): Promise<ApiResponse<null>> {
    return await apiClient.post<null>(`/users/${id}/force-password-change`);
  }
}

export const userService = new UserService();