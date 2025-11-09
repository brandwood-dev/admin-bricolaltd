import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, Clock, AlertCircle, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import { getAdminSocket } from '@/services/adminSocket';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_completed' | 'booking_reminder' | 'payment_received' | 'payment_failed' | 'system' | 'user_registered' | 'dispute_created';
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
  link?: string;
  priority: 'low' | 'medium' | 'high';
}

interface AdminNotificationCenterProps {
  className?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking_created':
    case 'booking_confirmed':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'booking_cancelled':
      return <X className="h-4 w-4 text-red-500" />;
    case 'booking_reminder':
      return <Clock className="h-4 w-4 text-blue-500" />;
    case 'payment_received':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'payment_failed':
    case 'dispute_created':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'user_registered':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationColor = (type: string, priority: string) => {
  if (priority === 'high') {
    return 'bg-red-50 border-red-200';
  }
  
  switch (type) {
    case 'booking_created':
    case 'booking_confirmed':
    case 'payment_received':
      return 'bg-green-50 border-green-200';
    case 'booking_cancelled':
    case 'payment_failed':
    case 'dispute_created':
      return 'bg-red-50 border-red-200';
    case 'booking_reminder':
    case 'user_registered':
      return 'bg-blue-50 border-blue-200';
    case 'booking_completed':
      return 'bg-purple-50 border-purple-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
    case 'medium':
      return <Badge variant="secondary" className="text-xs">Moyen</Badge>;
    case 'low':
      return <Badge variant="outline" className="text-xs">Faible</Badge>;
    default:
      return null;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays}j`;
  
  return date.toLocaleDateString('fr-FR');
};

export const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [wsUnreadCount, setWsUnreadCount] = useState<number | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/notifications');
      
      // Vérifier la structure de la réponse selon le format de l'API
      // L'API retourne {"data": [...], "message": "Request successful"}
      let notificationsData = [];
      
      if (response && response.data) {
        // Vérifier si response.data.data existe (structure API standard)
        if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            notificationsData = response.data.data;
          } else if (typeof response.data.data === 'object' && response.data.data !== null) {
            // Si c'est un objet, vérifier s'il contient des notifications
            const possibleArrays = Object.values(response.data.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              notificationsData = possibleArrays[0] as AdminNotification[];
            } else {
              // Peut-être que l'objet contient directement les propriétés des notifications
              notificationsData = [response.data.data] as AdminNotification[];
            }
          }
        }
        // Sinon, vérifier si response.data est directement un tableau
        else if (Array.isArray(response.data)) {
          notificationsData = response.data;
        }
        // Sinon, utiliser un tableau vide
        else {
          notificationsData = [];
        }
      }
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      
      // Gestion d'erreur améliorée
      if (error?.response?.status === 404) {
        console.info('Endpoint notifications admin non trouvé');
      } else if (error?.response?.status >= 500) {
        toast.error('Erreur serveur lors du chargement des notifications');
      } else if (!error?.message?.includes('Network Error') && !error?.message?.includes('ERR_NETWORK')) {
        toast.error('Erreur lors du chargement des notifications');
      }
      
      // Définir un tableau vide en cas d'erreur
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    if (!id) {
      console.error('ID de notification manquant');
      return;
    }
    
    try {
      const response = await apiClient.patch(`/admin/notifications/${id}/read`);
      
      // Vérifier le succès de la réponse
      if (response && (response.status === 200 || response.status === 204)) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id 
              ? { ...notification, isRead: true }
              : notification
          )
        );
      } else {
        console.warn('Réponse inattendue lors du marquage comme lu:', response);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (error?.response?.status === 404) {
        toast.error('Notification non trouvée');
      } else if (error?.response?.status >= 500) {
        toast.error('Erreur serveur lors de la mise à jour');
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiClient.patch('/admin/notifications/mark-all-read');
      
      // Vérifier le succès de la réponse
      if (response && (response.status === 200 || response.status === 204)) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        toast.success('Toutes les notifications ont été marquées comme lues');
      } else {
        console.warn('Réponse inattendue lors du marquage global:', response);
        toast.error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (error?.response?.status === 404) {
        toast.error('Endpoint non trouvé');
      } else if (error?.response?.status >= 500) {
        toast.error('Erreur serveur lors de la mise à jour');
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    }
  };

  const deleteNotification = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!id) {
      console.error('ID de notification manquant pour la suppression');
      toast.error('Erreur: ID de notification manquant');
      return;
    }
    
    try {
      const response = await apiClient.delete(`/admin/notifications/${id}`);
      
      // Vérifier le succès de la réponse
      if (response && (response.status === 200 || response.status === 204)) {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        toast.success('Notification supprimée');
      } else {
        console.warn('Réponse inattendue lors de la suppression:', response);
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      if (error?.response?.status === 404) {
        toast.error('Notification non trouvée');
        // Supprimer quand même de l'interface si elle n'existe plus côté serveur
        setNotifications(prev => prev.filter(notification => notification.id !== id));
      } else if (error?.response?.status >= 500) {
        toast.error('Erreur serveur lors de la suppression');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleNotificationClick = (notification: AdminNotification) => {
    if (!notification || !notification.id) {
      console.error('Notification invalide:', notification);
      return;
    }
    
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Navigation logic based on notification type
    if (notification.type === 'new_ad' && notification.relatedId) {
      navigate(`/admin/ads/${notification.relatedId}`);
    } else if (notification.type === 'user_report' && notification.relatedId) {
      navigate(`/admin/reports/${notification.relatedId}`);
    }
  };

  // Setup admin websocket connection for real-time unread count and notifications
  useEffect(() => {
    const socket = getAdminSocket();
    if (!socket) {
      return;
    }

    const onUnread = (payload: { count: number }) => {
      if (typeof payload?.count === 'number') {
        setWsUnreadCount(payload.count);
      }
    };

    const onNewNotification = (notification: AdminNotification) => {
      if (notification && notification.id) {
        setNotifications(prev => [notification, ...prev]);
        setWsUnreadCount((prev) => {
          if (typeof prev === 'number') return prev + (notification.isRead ? 0 : 1);
          return prev;
        });
      }
    };

    const onNotifications = (payload: { notifications?: { data?: AdminNotification[] }; unreadCount?: number }) => {
      const list = payload?.notifications?.data || [];
      setNotifications(Array.isArray(list) ? list : []);
      if (typeof payload?.unreadCount === 'number') {
        setWsUnreadCount(payload.unreadCount);
      }
    };

    socket.on('unread_count', onUnread);
    socket.on('new_notification', onNewNotification);
    socket.on('notifications', onNotifications);

    // Ask for initial notifications via WS as soon as connected
    socket.emit('get_notifications');

    return () => {
      socket.off('unread_count', onUnread);
      socket.off('new_notification', onNewNotification);
      socket.off('notifications', onNotifications);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Prefer WS when available
      const socket = getAdminSocket();
      if (socket) {
        socket.emit('get_notifications');
      } else {
        fetchNotifications();
      }
    }
  }, [isOpen]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Initial fetch
  useEffect(() => {
    // Prefer WS when available
    const socket = getAdminSocket();
    if (socket) {
      socket.emit('get_notifications');
    } else {
      fetchNotifications();
    }
  }, []);

  const unreadCountLocal = notifications.filter(n => !n.isRead).length;
  const unreadCount = typeof wsUnreadCount === 'number' ? wsUnreadCount : unreadCountLocal;
  const highPriorityCount = notifications.filter(n => !n.isRead && n.priority === 'high').length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant={highPriorityCount > 0 ? "destructive" : "default"}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications Admin</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                const socket = getAdminSocket();
                if (socket) {
                  socket.emit('mark_all_as_read');
                }
                markAllAsRead();
              }}
              className="text-xs"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications
                .filter(notification => notification && notification.id)
                .map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 cursor-pointer hover:bg-gray-50 transition-colors relative',
                    !notification.isRead && 'bg-blue-50/50',
                    getNotificationColor(notification.type, notification.priority)
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          !notification.isRead && 'font-semibold'
                        )}>
                          {notification.title || 'Notification sans titre'}
                        </p>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(notification.priority)}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.message || 'Aucun message'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {notification.createdAt ? formatTimeAgo(notification.createdAt) : 'Date inconnue'}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100"
                          onClick={(e) => deleteNotification(notification.id, e)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  // Navigate to admin notifications page
                  window.location.href = '/admin/notifications';
                  setIsOpen(false);
                }}
              >
                Voir toutes les notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default AdminNotificationCenter;