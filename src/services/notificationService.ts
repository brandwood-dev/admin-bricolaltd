import api from './api'

export interface Notification {
  id: string
  userId?: string
  type: string
  title: string
  message: string
  contactId?: string
  isRead: boolean
  createdAt: string
  updatedAt?: string
  actionUrl?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  category?: string
  userName?: string
}

export interface NotificationCount {
  count: number
}

export interface NotificationStats {
  totalCount: number
  unreadCount: number
  readCount: number
  todayCount: number
  weekCount: number
  monthCount: number
}

export interface PaginatedNotificationResponse {
  success: boolean
  data: {
    items: Notification[]
    totalItems: number
    totalPages: number
    currentPage: number
    itemsPerPage: number
  }
  message: string
}

export type NotificationType = 
  | 'ACCOUNT_DELETION_REQUEST'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_REACTIVATED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_PROCESSED'
  | 'WITHDRAWAL_FAILED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'TOOL_SUBMITTED'
  | 'TOOL_APPROVED'
  | 'TOOL_REJECTED'
  | 'TOOL_ARCHIVED'
  | 'DISPUTE_CREATED'
  | 'DISPUTE_UPDATED'
  | 'DISPUTE_RESOLVED'
  | 'DISPUTE_ESCALATED'
  | 'SYSTEM_MAINTENANCE'
  | 'SYSTEM_UPDATE'
  | 'SECURITY_ALERT'
  | 'contact_new'

export interface NotificationFilters {
  page?: number
  limit?: number
  type?: NotificationType
  isRead?: boolean
  priority?: string
  search?: string
  startDate?: string
  endDate?: string
}

class NotificationService {
  async getNotifications(filters?: NotificationFilters): Promise<PaginatedNotificationResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/admin/notifications?${params.toString()}`)
      // Transform the response to match the expected format
      const { data } = response.data;
      return {
        success: true,
        data: {
          items: data.notifications,
          totalItems: data.pagination.total,
          totalPages: data.pagination.totalPages,
          currentPage: data.pagination.page,
          itemsPerPage: data.pagination.limit,
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      throw error
    }
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/admin/notifications')
      const { data } = response.data;
      return data.notifications.filter((n: Notification) => !n.isRead)
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error)
      throw error
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/admin/notifications/unread-count')
      return response.data.data.count
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
      return 0
    }
  }

  async getNotificationStats(): Promise<{ success: boolean; data: NotificationStats }> {
    try {
      const response = await api.get('/notifications/stats')
      return response.data
    } catch (error) {
      console.error('Failed to fetch notification stats:', error)
      throw error
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/admin/notifications/${notificationId}/read`)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  async markAsUnread(notificationId: string): Promise<void> {
    try {
      // Admin notifications don't have an unread endpoint, so we'll skip this
      console.warn('Mark as unread not supported for admin notifications')
    } catch (error) {
      console.error('Failed to mark notification as unread:', error)
      throw error
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/admin/notifications/mark-all-read')
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/admin/notifications/${notificationId}`)
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  async exportNotifications(filters?: NotificationFilters): Promise<{ success: boolean; data: Blob }> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/notifications/export?${params.toString()}`, {
        responseType: 'blob'
      })
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Failed to export notifications:', error)
      throw error
    }
  }
}

export default new NotificationService()