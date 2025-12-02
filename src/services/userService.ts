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
    const response = await apiClient.get<any>('/users', { params });

    // L'API renvoie { data: {...}, message: '...' } où data peut contenir { data: [...], total, page, limit, totalPages }
    const payload = response?.data;

    // Normaliser le conteneur: si payload.data existe et contient des champs de pagination, l'utiliser
    const container = payload?.data && (Array.isArray(payload?.data?.data) || typeof payload?.data?.total !== 'undefined')
      ? payload.data
      : payload;

    // Extraire les utilisateurs
    const arrayData: User[] = Array.isArray(container)
      ? container as User[]
      : Array.isArray(container?.data)
        ? container.data as User[]
        : Array.isArray(payload)
          ? (payload as User[])
          : [];

    // Extraire les métadonnées de pagination
    const page = typeof container?.page === 'number' ? container.page : (params?.page ?? 1);
    const limit = typeof container?.limit === 'number' ? container.limit : (params?.limit ?? (arrayData.length || 10));
    const total = typeof container?.total === 'number' ? container.total : (Array.isArray(arrayData) ? arrayData.length : 0);
    const totalPages = typeof container?.totalPages === 'number' ? container.totalPages : Math.max(1, Math.ceil(total / limit));

    const paginated: PaginatedResponse<User> = {
      data: arrayData,
      meta: { page, limit, total, totalPages },
      total,
      page,
      limit,
      totalPages,
    };

    return {
      ...response,
      data: paginated,
      success: response?.success ?? true,
      message: response?.message ?? 'Request successful',
    };
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
    console.log(`🔄 Admin Service: Suspending user ${id} with reason: ${reason}`);
    const response = await apiClient.post<User>(`/users/${id}/suspend`, { reason });
    console.log(`🔄 Admin Service: Suspension response:`, response);
    return response;
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
    return await apiClient.get<Wallet>(`/users/${id}`);
  }

  async getUserWalletBalance(id: string): Promise<number> {
    console.log('[userService] getUserWalletBalance start', { id })
    const res = await this.getUserWallet(id)
    console.log('[userService] getUserWallet response', res)
    const payload: any = res
    const balance = payload?.data?.wallet.balance
    const parsed = Number(balance) || 0
    console.log('[userService] parsed balance', parsed)
    return parsed
  }

  async getOwnerBookingsCount(ownerId: string): Promise<number> {
    console.log('[userService] getOwnerBookingsCount start', { ownerId })
    try {
      const res = await apiClient.get<{ data: any[]; total?: number; meta?: { total: number } }>(`/admin/bookings`, {
        params: { ownerId, page: 1, limit: 1 },
      })
      console.log('[userService] getOwnerBookingsCount response', res)
      const payload: any = res
      const total = payload?.data?.data?.total
      const parsed = Number(total) || 0
      console.log('[userService] parsed owner bookings count', parsed)
      return parsed
    } catch (e) {
      console.error('[userService] /admin/bookings error', e)
    }
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

  async bulkUserAction(action: BulkUserAction): Promise<ApiResponse<{ success: number; failed: number; errors: string[] }>> {
    return await apiClient.post<{ success: number; failed: number; errors: string[] }>(`/users/bulk-action`, action);
  }

  async bulkExportUsers(params?: UserFilterParams): Promise<ApiResponse<{ downloadUrl: string }>> {
    return await apiClient.get<{ downloadUrl: string }>(`/users/export/csv`, { params });
  }

  async searchUsers(query: string, filters?: Partial<UserFilterParams>): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response = await apiClient.get<any>(`/users/search`, { params: { query, ...filters } });
    const payload = response?.data;
    const container = payload?.data && (Array.isArray(payload?.data?.data) || typeof payload?.data?.total !== 'undefined')
      ? payload.data
      : payload;
    const arrayData: User[] = Array.isArray(container?.data) ? container.data : [];
    const page = typeof container?.page === 'number' ? container.page : 1;
    const limit = typeof container?.limit === 'number' ? container.limit : (arrayData.length || 10);
    const total = typeof container?.total === 'number' ? container.total : arrayData.length;
    const totalPages = typeof container?.totalPages === 'number' ? container.totalPages : Math.max(1, Math.ceil(total / limit));
    const paginated: PaginatedResponse<User> = { data: arrayData, meta: { page, limit, total, totalPages }, total, page, limit, totalPages };
    return { ...response, data: paginated, success: response?.success ?? true, message: response?.message ?? 'Request successful' };
  }

  async getUsersByCountry(): Promise<ApiResponse<{ country: string; count: number }[]>> {
    return await apiClient.get<{ country: string; count: number }[]>(`/users/analytics/by-country`);
  }

  async getUsersByRegistrationDate(startDate: string, endDate: string): Promise<ApiResponse<{ date: string; count: number }[]>> {
    return await apiClient.get<{ date: string; count: number }[]>(`/users/analytics/by-date`, { params: { startDate, endDate } });
  }

  async exportUsersCSV(params?: UserFilterParams): Promise<ApiResponse<Blob>> {
    // Use downloadFile to ensure a consistent ApiResponse shape with success flag
    return await apiClient.downloadFile(`/users/export/csv`, { params });
  }

  async exportUsersExcel(params?: UserFilterParams): Promise<ApiResponse<Blob>> {
    return await apiClient.get<Blob>(`/users/export/excel`, { params, responseType: 'blob' });
  }

  // New: Fetch full users list JSON for custom CSV generation
  async exportUsersList(params?: UserFilterParams): Promise<ApiResponse<User[]>> {
    const mapped: Record<string, any> = {};
    if (params?.search) mapped.search = params.search;
    if (typeof params?.isActive === 'boolean') {
      mapped.status = params.isActive ? 'active' : 'inactive';
    }
    if (typeof params?.verifiedEmail === 'boolean') mapped.verified = params.verifiedEmail;
    if (typeof params?.isAdmin === 'boolean') mapped.isAdmin = params.isAdmin;
    if (params?.startDate) mapped.dateFrom = params.startDate;
    if (params?.endDate) mapped.dateTo = params.endDate;
    if (params?.city) mapped.city = params.city;
    if (params?.country) mapped.country = params.country;

    return await apiClient.get<User[]>(`/users/export`, { params: mapped });
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return await apiClient.get<UserStats>(`/users/stats`);
  }

  async getUserGrowthAnalytics(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; newUsers: number; totalUsers: number }[]>> {
    return await apiClient.get<{ date: string; newUsers: number; totalUsers: number }[]>(`/users/analytics/growth`, { params: { period } });
  }

  async getUserActivityAnalytics(userId: string, period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; activities: number }[]>> {
    return await apiClient.get<{ date: string; activities: number }[]>(`/users/${userId}/analytics/activity`, { params: { period } });
  }

  async impersonateUser(id: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return await apiClient.post<{ token: string; user: User }>(`/users/${id}/impersonate`);
  }

  async stopImpersonation(): Promise<ApiResponse<null>> {
    return await apiClient.post<null>(`/users/impersonate/stop`);
  }
}

export const userService = new UserService();
export type { User, Wallet, Transaction, Booking, Tool, Document, UserActivity, ActivityType };
