import { apiClient, ApiResponse } from './api';
import { PaginatedResponse } from '../types/unified-bridge';

// Notification interfaces
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  isSystem: boolean;
  relatedId?: string;
  relatedType?: string;
  link?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AdminNotification extends Notification {
  type: 'user' | 'withdrawal' | 'listing' | 'dispute' | 'contact' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  timestamp: string;
}

export enum NotificationType {
  // Account Management
  ACCOUNT_DELETION_REQUEST = 'account_deletion_request',
  ACCOUNT_DELETION_REQUEST_PENDING = 'account_deletion_request_pending',
  ACCOUNT_DELETION_REQUEST_APPROVED = 'account_deletion_request_approved',
  ACCOUNT_DELETION_REQUEST_REJECTED = 'account_deletion_request_rejected',
  ACCOUNT_DELETION_REQUEST_CANCELLED = 'account_deletion_request_cancelled',
  ACCOUNT_CREATED = 'account_created',
  ACCOUNT_SUSPENDED = 'account_suspended',
  ACCOUNT_REACTIVATED = 'account_reactivated',
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_CHANGED = 'email_changed',

  // User Verification
  EMAIL_VERIFICATION = 'email_verification',
  PHONE_VERIFICATION = 'phone_verification',
  IDENTITY_VERIFICATION_REQUIRED = 'identity_verification_required',
  IDENTITY_VERIFICATION_APPROVED = 'identity_verification_approved',
  IDENTITY_VERIFICATION_REJECTED = 'identity_verification_rejected',

  // Booking Lifecycle
  BOOKING_CREATED = 'booking_created',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_COMPLETED = 'booking_completed',
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_OVERDUE = 'booking_overdue',
  BOOKING_EXTENDED = 'booking_extended',

  // Tool Management
  TOOL_SUBMITTED = 'tool_submitted',
  TOOL_APPROVED = 'tool_approved',
  TOOL_REJECTED = 'tool_rejected',
  TOOL_ARCHIVED = 'tool_archived',
  TOOL_UNAVAILABLE = 'tool_unavailable',

  // Dispute Management
  DISPUTE_CREATED = 'dispute_created',
  DISPUTE_UPDATED = 'dispute_updated',
  DISPUTE_RESOLVED = 'dispute_resolved',
  DISPUTE_ESCALATED = 'dispute_escalated',

  // Payment & Financial
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  WITHDRAWAL_REQUESTED = 'withdrawal_requested',
  WITHDRAWAL_PROCESSED = 'withdrawal_processed',
  WITHDRAWAL_FAILED = 'withdrawal_failed',

  // System
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_UPDATE = 'system_update',
  SECURITY_ALERT = 'security_alert'
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isSystem?: boolean;
  relatedId?: string;
  relatedType?: string;
  link?: string;
}

export interface UpdateNotificationData {
  title?: string;
  message?: string;
  isRead?: boolean;
  link?: string;
}

export interface NotificationFilterParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface BulkNotificationAction {
  action: 'mark_read' | 'mark_unread' | 'delete';
  notificationIds: string[];
}

class NotificationService {
  // Get all notifications with filters and pagination (Admin)
  async getNotifications(params?: NotificationFilterParams): Promise<ApiResponse<PaginatedResponse<Notification>>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return await apiClient.get<PaginatedResponse<Notification>>(`/notifications?${queryParams.toString()}`);
  }

  // Get notification by ID
  async getNotificationById(id: string): Promise<ApiResponse<Notification>> {
    return await apiClient.get<Notification>(`/notifications/${id}`);
  }

  // Create new notification (Admin)
  async createNotification(data: CreateNotificationData): Promise<ApiResponse<Notification>> {
    return await apiClient.post<Notification>('/notifications', data);
  }

  // Update notification (Admin)
  async updateNotification(id: string, data: UpdateNotificationData): Promise<ApiResponse<Notification>> {
    return await apiClient.patch<Notification>(`/notifications/${id}`, data);
  }

  // Delete notification
  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/notifications/${id}`);
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    return await apiClient.patch<Notification>(`/notifications/${id}/mark-read`);
  }

  // Mark notification as unread
  async markAsUnread(id: string): Promise<ApiResponse<Notification>> {
    return await apiClient.patch<Notification>(`/notifications/${id}/mark-unread`);
  }

  // Bulk delete notifications (Admin)
  async bulkDeleteNotifications(ids: string[]): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>('/notifications/bulk/delete', { data: { ids } });
  }

  // Delete all notifications for a user (Admin)
  async deleteUserNotifications(userId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/notifications/user/${userId}`);
  }

  // Get notification statistics
  async getNotificationStats(): Promise<ApiResponse<NotificationStats>> {
    return await apiClient.get<NotificationStats>('/admin/notifications/stats');
  }

  // Send bulk notifications (Admin)
  async sendBulkNotifications(data: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }): Promise<ApiResponse<{ sent: number; failed: number }>> {
    return await apiClient.post<{ sent: number; failed: number }>('/admin/notifications/bulk-send', data);
  }

  // Get notification templates
  async getNotificationTemplates(): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>('/admin/notification-templates');
  }

  // Create notification template
  async createNotificationTemplate(data: {
    name: string;
    type: NotificationType;
    title: string;
    message: string;
    isActive: boolean;
  }): Promise<ApiResponse<any>> {
    return await apiClient.post<any>('/admin/notification-templates', data);
  }

  // Update notification template
  async updateNotificationTemplate(id: string, data: {
    name?: string;
    title?: string;
    message?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    return await apiClient.patch<any>(`/admin/notification-templates/${id}`, data);
  }

  // Delete notification template
  async deleteNotificationTemplate(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/admin/notification-templates/${id}`);
  }

  // Export notifications
  async exportNotifications(params?: NotificationFilterParams): Promise<ApiResponse<Blob>> {
    const queryParams = new URLSearchParams();
    
    if (params?.type) queryParams.append('type', params.type);
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return await apiClient.get<Blob>(`/admin/notifications/export?${queryParams.toString()}`, {
      responseType: 'blob'
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;