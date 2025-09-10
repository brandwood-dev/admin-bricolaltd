import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Search, 
  Filter, 
  Bell, 
  User, 
  CreditCard, 
  Package, 
  AlertTriangle, 
  MessageSquare, 
  Settings,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreVertical,
  RefreshCw,
  Download,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { notificationService, Notification, NotificationType, NotificationStats } from '@/services/notificationService';
import { PaginatedResponse } from '@/types/api';



const Notifications = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // API states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        type: typeFilter !== 'all' ? typeFilter as NotificationType : undefined,
        isRead: statusFilter !== 'all' ? statusFilter === 'read' : undefined,
        search: searchTerm || undefined
      };

      const response = await notificationService.getNotifications(params);
      if (response.success && response.data) {
        setNotifications(response.data.items);
        setTotalItems(response.data.totalItems);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les notifications.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load notification statistics
  const loadNotificationStats = async () => {
    try {
      const response = await notificationService.getNotificationStats();
      if (response.success && response.data) {
        setNotificationStats(response.data);
      }
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadNotifications();
  }, [currentPage, typeFilter, statusFilter, searchTerm]);

  useEffect(() => {
    loadNotificationStats();
  }, []);

  // Refresh data
  const handleRefresh = () => {
    loadNotifications();
    loadNotificationStats();
  };

  // Export notifications
  const handleExport = async () => {
    try {
      const params = {
        type: typeFilter !== 'all' ? typeFilter as NotificationType : undefined,
        isRead: statusFilter !== 'all' ? statusFilter === 'read' : undefined,
        search: searchTerm || undefined
      };

      const response = await notificationService.exportNotifications(params);
      if (response.success && response.data) {
        const url = window.URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `notifications_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Export réussi",
          description: "Les notifications ont été exportées avec succès."
        });
      }
    } catch (error) {
      console.error('Error exporting notifications:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les notifications.",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ACCOUNT_DELETION_REQUEST':
      case 'ACCOUNT_CREATED':
      case 'ACCOUNT_SUSPENDED':
      case 'ACCOUNT_REACTIVATED':
        return <User className="h-4 w-4" />;
      case 'WITHDRAWAL_REQUESTED':
      case 'WITHDRAWAL_PROCESSED':
      case 'WITHDRAWAL_FAILED':
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_FAILED':
        return <CreditCard className="h-4 w-4" />;
      case 'TOOL_SUBMITTED':
      case 'TOOL_APPROVED':
      case 'TOOL_REJECTED':
      case 'TOOL_ARCHIVED':
        return <Package className="h-4 w-4" />;
      case 'DISPUTE_CREATED':
      case 'DISPUTE_UPDATED':
      case 'DISPUTE_RESOLVED':
      case 'DISPUTE_ESCALATED':
        return <AlertTriangle className="h-4 w-4" />;
      case 'SYSTEM_MAINTENANCE':
      case 'SYSTEM_UPDATE':
      case 'SECURITY_ALERT':
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (type: string) => {
    // Determine priority based on notification type
    const urgentTypes = ['DISPUTE_ESCALATED', 'SECURITY_ALERT', 'ACCOUNT_SUSPENDED'];
    const highTypes = ['DISPUTE_CREATED', 'WITHDRAWAL_REQUESTED', 'TOOL_REJECTED'];
    const mediumTypes = ['BOOKING_CREATED', 'TOOL_SUBMITTED', 'PAYMENT_FAILED'];
    
    if (urgentTypes.includes(type)) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Urgent</Badge>;
    } else if (highTypes.includes(type)) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Élevée</Badge>;
    } else if (mediumTypes.includes(type)) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Moyenne</Badge>;
    } else {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Faible</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    if (type.includes('ACCOUNT') || type.includes('USER')) {
      return 'Utilisateurs';
    } else if (type.includes('WITHDRAWAL') || type.includes('PAYMENT')) {
      return 'Paiements';
    } else if (type.includes('TOOL')) {
      return 'Outils';
    } else if (type.includes('BOOKING')) {
      return 'Réservations';
    } else if (type.includes('DISPUTE')) {
      return 'Litiges';
    } else if (type.includes('SYSTEM') || type.includes('SECURITY')) {
      return 'Système';
    } else {
      return 'Général';
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const markAsRead = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await notificationService.markAsRead(id);
      }
      setNotifications(prev => 
        prev.map(notif => 
          ids.includes(notif.id) ? { ...notif, isRead: true } : notif
        )
      );
      setSelectedNotifications([]);
      await loadNotificationStats();
      toast({
        title: "Notifications marquées comme lues",
        description: `${ids.length} notification(s) marquée(s) comme lue(s).`,
      });
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer les notifications comme lues.",
        variant: "destructive"
      });
    }
  };

  const markAsUnread = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await notificationService.markAsUnread(id);
      }
      setNotifications(prev => 
        prev.map(notif => 
          ids.includes(notif.id) ? { ...notif, isRead: false } : notif
        )
      );
      setSelectedNotifications([]);
      await loadNotificationStats();
      toast({
        title: "Notifications marquées comme non lues",
        description: `${ids.length} notification(s) marquée(s) comme non lue(s).`,
      });
    } catch (error) {
      console.error('Erreur lors du marquage comme non lu:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer les notifications comme non lues.",
        variant: "destructive"
      });
    }
  };

  const deleteNotifications = async (ids: string[]) => {
    try {
      for (const id of ids) {
        await notificationService.deleteNotification(id);
      }
      setNotifications(prev => prev.filter(notif => !ids.includes(notif.id)));
      setSelectedNotifications([]);
      await loadNotificationStats();
      toast({
        title: "Notifications supprimées",
        description: `${ids.length} notification(s) supprimée(s).`,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les notifications.",
        variant: "destructive"
      });
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(notifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleSelectNotification = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, id]);
    } else {
      setSelectedNotifications(prev => prev.filter(notifId => notifId !== id));
    }
  };

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Statistiques
  const unreadCount = notificationStats?.unreadCount || 0;
  const totalCount = totalItems;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Gérez toutes les notifications de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {unreadCount} non lue{unreadCount !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {notifications.length} total
          </Badge>
        </div>
      </div>

      {/* Actions en lot */}
      {selectedNotifications.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="text-sm font-medium">
                {selectedNotifications.length} notification(s) sélectionnée(s)
              </span>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  onClick={() => markAsRead(selectedNotifications)}
                  className="bg-success hover:bg-success/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer comme lues
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => markAsUnread(selectedNotifications)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Marquer comme non lues
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer {selectedNotifications.length} notification(s) ? 
                        Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteNotifications(selectedNotifications)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="ACCOUNT">Comptes</SelectItem>
                <SelectItem value="PAYMENT">Paiements</SelectItem>
                <SelectItem value="TOOL">Outils</SelectItem>
                <SelectItem value="BOOKING">Réservations</SelectItem>
                <SelectItem value="DISPUTE">Litiges</SelectItem>
                <SelectItem value="SYSTEM">Système</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des notifications */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Priorité</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow 
                    key={notification.id}
                    className={`cursor-pointer hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedNotifications.includes(notification.id)}
                        onCheckedChange={(checked) => handleSelectNotification(notification.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`font-medium text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(notification.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getPriorityBadge(notification.type)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                      {formatDateTime(notification.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        <span className="text-sm">
                          {notification.isRead ? 'Lue' : 'Non lue'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {notification.actionUrl && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => window.location.href = notification.actionUrl!}
                          >
                            Voir
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => notification.isRead ? markAsUnread([notification.id]) : markAsRead([notification.id])}
                        >
                          {notification.isRead ? (
                            <Clock className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-700">
            Affichage de {startIndex + 1}-{endIndex} sur {totalCount} notifications
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <span className="text-sm px-3 py-1 bg-gray-100 rounded">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;