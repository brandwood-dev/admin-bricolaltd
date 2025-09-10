import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  User,
  CreditCard,
  Package,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Clock,
  X,
  Settings,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: 'user' | 'withdrawal' | 'listing' | 'dispute' | 'contact' | 'system';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
}

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'withdrawal',
      title: 'Nouvelle demande de retrait',
      message: 'Marie Dubois a demandé un retrait de 850€',
      timestamp: '2024-03-20T10:30:00Z',
      isRead: false,
      priority: 'high',
      actionUrl: '/admin/withdrawals'
    },
    {
      id: '2',
      type: 'listing',
      title: 'Annonce en attente de modération',
      message: 'Nouvelle annonce "Perceuse électrique Bosch" à valider',
      timestamp: '2024-03-20T09:15:00Z',
      isRead: false,
      priority: 'medium',
      actionUrl: '/admin/listings'
    },
    {
      id: '3',
      type: 'dispute',
      title: 'Nouveau litige',
      message: 'Conflit entre Jean Martin et Sophie Bernard',
      timestamp: '2024-03-20T08:45:00Z',
      isRead: false,
      priority: 'urgent',
      actionUrl: '/admin/disputes'
    },
    {
      id: '4',
      type: 'user',
      title: 'Utilisateur signalé',
      message: 'Thomas Blanc a été signalé plusieurs fois',
      timestamp: '2024-03-19T16:20:00Z',
      isRead: false,
      priority: 'high',
      actionUrl: '/admin/users'
    },
    {
      id: '5',
      type: 'contact',
      title: 'Nouveau message de support',
      message: 'Question sur les conditions d\'utilisation',
      timestamp: '2024-03-19T14:10:00Z',
      isRead: true,
      priority: 'medium',
      actionUrl: '/admin/contacts'
    },
    {
      id: '6',
      type: 'system',
      title: 'Maintenance programmée',
      message: 'Maintenance serveur prévue ce weekend',
      timestamp: '2024-03-19T12:00:00Z',
      isRead: true,
      priority: 'low'
    }
  ]);

  const { toast } = useToast();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'withdrawal':
        return <CreditCard className="h-4 w-4" />;
      case 'listing':
        return <Package className="h-4 w-4" />;
      case 'dispute':
        return <AlertTriangle className="h-4 w-4" />;
      case 'contact':
        return <MessageSquare className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type: Notification['type']) => {
    switch (type) {
      case 'user':
        return 'Utilisateurs';
      case 'withdrawal':
        return 'Retraits';
      case 'listing':
        return 'Annonces';
      case 'dispute':
        return 'Litiges';
      case 'contact':
        return 'Support';
      case 'system':
        return 'Système';
      default:
        return 'Général';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    toast({
      title: "Notifications marquées comme lues",
      description: "Toutes les notifications ont été marquées comme lues.",
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[400px] max-w-[95vw] p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(notification.type)}
                              </Badge>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <h4 className={`text-sm font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="my-1" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t bg-gray-50">
          <Button 
            variant="ghost" 
            className="w-full text-sm"
            onClick={() => window.location.href = '/admin/notifications'}
          >
            Voir toutes les notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationPanel;