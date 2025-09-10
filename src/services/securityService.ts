import { apiClient, ApiResponse } from './api';
import { PaginatedResponse } from '../types/unified-bridge';

export interface SecurityLog {
  id: string;
  event: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface BlockedIp {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  expiresAt?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface AdminActivity {
  id: string;
  adminId: string;
  action: string;
  description: string;
  targetType?: string;
  targetId?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  admin?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface FailedLogin {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  reason: string;
  attemptedAt: string;
}

export interface SecurityOverview {
  totalSecurityLogs: number;
  criticalEvents: number;
  blockedIps: number;
  activeSessions: number;
  failedLogins: number;
  recentEvents: SecurityLog[];
}

export interface SecurityFilterParams {
  page?: number;
  limit?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  event?: string;
  userId?: string;
  ipAddress?: string;
  startDate?: string;
  endDate?: string;
}

class SecurityService {
  // Security Logs
  async getSecurityLogs(params?: SecurityFilterParams): Promise<ApiResponse<PaginatedResponse<SecurityLog>>> {
    return await apiClient.get<PaginatedResponse<SecurityLog>>('/admin/security/logs', { params });
  }

  async getSecurityLogById(id: string): Promise<ApiResponse<SecurityLog>> {
    return await apiClient.get<SecurityLog>(`/admin/security/logs/${id}`);
  }

  async createSecurityLog(data: {
    event: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
  }): Promise<ApiResponse<SecurityLog>> {
    return await apiClient.post<SecurityLog>('/admin/security/logs', data);
  }

  // Blocked IPs
  async getBlockedIps(params?: { page?: number; limit?: number; isActive?: boolean }): Promise<ApiResponse<PaginatedResponse<BlockedIp>>> {
    return await apiClient.get<PaginatedResponse<BlockedIp>>('/admin/security/blocked-ips', { params });
  }

  async blockIp(data: {
    ipAddress: string;
    reason: string;
    expiresAt?: string;
  }): Promise<ApiResponse<BlockedIp>> {
    return await apiClient.post<BlockedIp>('/admin/security/blocked-ips', data);
  }

  async unblockIp(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return await apiClient.delete<{ success: boolean }>(`/admin/security/blocked-ips/${id}`);
  }

  async updateBlockedIp(id: string, data: {
    reason?: string;
    expiresAt?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<BlockedIp>> {
    return await apiClient.patch<BlockedIp>(`/admin/security/blocked-ips/${id}`, data);
  }

  // User Sessions
  async getUserSessions(params?: { page?: number; limit?: number; isActive?: boolean; userId?: string }): Promise<ApiResponse<PaginatedResponse<UserSession>>> {
    return await apiClient.get<PaginatedResponse<UserSession>>('/admin/security/sessions', { params });
  }

  async terminateSession(sessionId: string): Promise<ApiResponse<{ success: boolean }>> {
    return await apiClient.delete<{ success: boolean }>(`/admin/security/sessions/${sessionId}`);
  }

  async terminateUserSessions(userId: string): Promise<ApiResponse<{ terminated: number }>> {
    return await apiClient.delete<{ terminated: number }>(`/admin/security/sessions/user/${userId}`);
  }

  // Admin Activities
  async getAdminActivities(params?: { page?: number; limit?: number; adminId?: string; action?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<PaginatedResponse<AdminActivity>>> {
    return await apiClient.get<PaginatedResponse<AdminActivity>>('/admin/security/admin-activities', { params });
  }

  async logAdminActivity(data: {
    action: string;
    description: string;
    targetType?: string;
    targetId?: string;
  }): Promise<ApiResponse<AdminActivity>> {
    return await apiClient.post<AdminActivity>('/admin/security/admin-activities', data);
  }

  // Failed Logins
  async getFailedLogins(params?: { page?: number; limit?: number; email?: string; ipAddress?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<PaginatedResponse<FailedLogin>>> {
    return await apiClient.get<PaginatedResponse<FailedLogin>>('/admin/security/failed-logins', { params });
  }

  async clearFailedLogins(criteria?: { email?: string; ipAddress?: string; olderThan?: string }): Promise<ApiResponse<{ cleared: number }>> {
    return await apiClient.delete<{ cleared: number }>('/admin/security/failed-logins', { data: criteria });
  }

  // Security Overview
  async getSecurityOverview(): Promise<ApiResponse<SecurityOverview>> {
    return await apiClient.get<SecurityOverview>('/admin/security/overview');
  }

  // Security Analytics
  async getSecurityAnalytics(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{
    date: string;
    events: number;
    criticalEvents: number;
    blockedIps: number;
    failedLogins: number;
  }[]>> {
    return await apiClient.get<{
      date: string;
      events: number;
      criticalEvents: number;
      blockedIps: number;
      failedLogins: number;
    }[]>('/admin/security/analytics', { params: { period } });
  }

  // Export functionality
  async exportSecurityLogs(params?: SecurityFilterParams & { format: 'csv' | 'excel' }): Promise<ApiResponse<Blob>> {
    return await apiClient.get<Blob>('/admin/security/logs/export', {
      params,
      responseType: 'blob'
    } as any);
  }

  async exportBlockedIps(format: 'csv' | 'excel'): Promise<ApiResponse<Blob>> {
    return await apiClient.get<Blob>('/admin/security/blocked-ips/export', {
      params: { format },
      responseType: 'blob'
    } as any);
  }
}

export const securityService = new SecurityService();