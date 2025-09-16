import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  Trash2, 
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Info,
  Mail,
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: string;
  userId?: string;
  userName?: string;
  category: 'booking' | 'user' | 'system' | 'payment' | 'dispute' | 'security';
  metadata?: Record<string, any>;
}

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/notifications');
      
      let notificationsData: AdminNotification[] = [];
      
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
      }
      
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await apiClient.patch('/admin/notifications/mark-read', {
        notificationIds
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      toast.success(`${notificationIds.length} notification(s) marquée(s) comme lue(s)`);
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
      toast.error('Erreur lors du marquage comme lu');
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      await apiClient.delete('/admin/notifications', {
        data: { notificationIds }
      });
      
      setNotifications(prev => 
        prev.filter(notif => !notificationIds.includes(notif.id))
      );
      
      setSelectedNotifications([]);
      toast.success(`${notificationIds.length} notification(s) supprimée(s)`);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(notif => !notif.isRead)
      .map(notif => notif.id);
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const getNotificationIcon = (type: string, category: string) => {
    switch (category) {
      case 'booking': return Calendar;
      case 'user': return User;
      case 'system': return Settings;
      case 'payment': return CheckCircle;
      case 'dispute': return AlertTriangle;
      case 'security': return AlertTriangle;
      default:
        switch (type) {
          case 'success': return CheckCircle;
          case 'warning': return AlertTriangle;
          case 'error': return AlertTriangle;
          default: return Info;
        }
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'system': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || notif.type === filterType;
    const matchesCategory = filterCategory === 'all' || notif.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'read' && notif.isRead) ||
                         (filterStatus === 'unread' && !notif.isRead);
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  const toggleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredNotifications.map(notif => notif.id);
    setSelectedNotifications(visibleIds);
  };

  const clearSelection = () => {
    setSelectedNotifications([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications Admin</h1>
          <p className="text-muted-foreground">
            Gérez toutes les notifications système et utilisateur
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="px-3 py-1">
            {unreadCount} non lues
          </Badge>
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="system">Système</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="booking">Réservations</SelectItem>
                <SelectItem value="user">Utilisateurs</SelectItem>
                <SelectItem value="system">Système</SelectItem>
                <SelectItem value="payment">Paiements</SelectItem>
                <SelectItem value="dispute">Litiges</SelectItem>
                <SelectItem value="security">Sécurité</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedNotifications.length > 0 && (
                <>
                  <Badge variant="outline">
                    {selectedNotifications.length} sélectionnée(s)
                  </Badge>
                  <Button
                    onClick={() => markAsRead(selectedNotifications)}
                    variant="outline"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Marquer comme lues
                  </Button>
                  <Button
                    onClick={() => deleteNotifications(selectedNotifications)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                  <Button onClick={clearSelection} variant="ghost" size="sm">
                    Désélectionner
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button onClick={selectAllVisible} variant="outline" size="sm">
                Tout sélectionner
              </Button>
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <Check className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune notification</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all'
                  ? 'Aucune notification ne correspond aux filtres sélectionnés.'
                  : 'Aucune notification disponible pour le moment.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => {
            const IconComponent = getNotificationIcon(notification.type, notification.category);
            const isSelected = selectedNotifications.includes(notification.id);
            
            return (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-l-4 border-l-primary bg-primary/5' : ''
                } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => toggleSelectNotification(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-sm font-medium truncate ${
                          !notification.isRead ? 'font-semibold' : ''
                        }`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2 ml-4">
                          <div 
                            className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}
                            title={`Priorité: ${notification.priority}`}
                          />
                          <Badge variant="outline" className="text-xs">
                            {notification.category}
                          </Badge>
                          <Badge className={`text-xs ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <span>
                            {new Date(notification.createdAt).toLocaleString('fr-FR')}
                          </span>
                          {notification.userName && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {notification.userName}
                            </span>
                          )}
                        </div>
                        
                        {!notification.isRead && (
                          <Badge variant="secondary" className="text-xs">
                            Non lu
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination could be added here if needed */}
    </div>
  );
};

export default AdminNotificationsPage;