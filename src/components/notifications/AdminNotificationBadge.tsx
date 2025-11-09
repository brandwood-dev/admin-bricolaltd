import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getAdminSocket } from '@/services/adminSocket';
import { apiClient } from '@/services/api';

interface AdminNotificationBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const AdminNotificationBadge: React.FC<AdminNotificationBadgeProps> = ({ className, size = 'sm' }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // 1) Initial fetch via REST as a fallback to ensure badge shows count
    const fetchInitialUnread = async () => {
      try {
        const response = await apiClient.get('/admin/notifications/unread-count');
        // API returns { data: { count }, message: 'Request successful' }
        const apiCount = response?.data?.data?.count;
        if (typeof apiCount === 'number') {
          setUnreadCount(apiCount);
        }
      } catch {
        // silently ignore; WS should update
      }
    };
    fetchInitialUnread();

    // 2) Setup WS listeners
    const socket = getAdminSocket();
    if (!socket) return;

    const onUnread = (payload: { count: number }) => {
      if (typeof payload?.count === 'number') {
        setUnreadCount(payload.count);
      }
    };

    const onNewNotification = (notification: { id: string; isRead?: boolean; priority?: 'low' | 'medium' | 'high' }) => {
      // increment only if not read
      setUnreadCount((prev) => prev + (notification?.isRead ? 0 : 1));
    };

    const onNotifications = (payload: { notifications?: { data?: Array<{ isRead: boolean }> }; unreadCount?: number }) => {
      if (typeof payload?.unreadCount === 'number') {
        setUnreadCount(payload.unreadCount);
      } else if (Array.isArray(payload?.notifications?.data)) {
        const localUnread = payload.notifications.data.filter(n => !n.isRead).length;
        setUnreadCount(localUnread);
      }
    };

    socket.on('unread_count', onUnread);
    socket.on('new_notification', onNewNotification);
    socket.on('notifications', onNotifications);

    // Emit initial fetch after successful connection to avoid race conditions
    const onConnect = () => {
      socket.emit('get_notifications');
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off('unread_count', onUnread);
      socket.off('new_notification', onNewNotification);
      socket.off('notifications', onNotifications);
      socket.off('connect', onConnect);
    };
  }, []);

  const handleClick = () => {
    navigate('/admin/notifications');
  };

  return (
    <Button
      variant="ghost"
      size={size}
      className={cn('relative h-8 w-8 p-0', className)}
      onClick={handleClick}
      title="Notifications"
    >
      <Bell className={cn(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5')} />
      {unreadCount > 0 && (
        <Badge
          variant={unreadCount > 0 ? 'default' : 'secondary'}
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default AdminNotificationBadge;