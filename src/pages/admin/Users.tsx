import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SelectField, TextareaField, FormErrorSummary } from "@/components/ui/form-field";
import { useFormValidation } from "@/hooks/useFormValidation";
import { userSuspensionSchema } from "@/utils/validation";
import { EnhancedPagination } from "@/components/ui/enhanced-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useUsersCache, useCacheManager } from "@/hooks/useCache";
import { PerformanceMonitor } from "@/components/ui/performance-monitor";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Eye, 
  Shield, 
  Ban, 
  ChevronLeft, 
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Calendar as CalendarIcon,
  CreditCard,
  Euro,
  TrendingUp,
  ArrowUpDown,
  AlertTriangle,
  UserCheck,
  UserX,
  Key,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { userService, UserStats } from "@/services/userService";
import { User, UserFilterParams, PaginatedResponse, Transaction, UserActivity } from "@/types/unified-bridge";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState<string[]>([]);
  
  // Enhanced pagination with caching
  const pagination = usePagination<User>(
    'users',
    async (page: number, pageSize: number, filters?: any) => {
      const params = {
        page,
        limit: pageSize,
        search: filters?.search,
        status: filters?.status !== 'all' ? filters?.status : undefined,
        verified: filters?.verified !== 'all' ? filters?.verified === 'verified' : undefined,
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo
      };
      const response = await userService.getUsers(params);
      return {
        data: response.data?.data || [],
        pagination: {
          page: response.data?.pagination?.page || 1,
          pageSize: response.data?.pagination?.limit || pageSize,
          total: response.data?.pagination?.total || 0,
          totalPages: response.data?.pagination?.totalPages || 1
        }
      };
    },
    {
      search: searchTerm,
      status: statusFilter,
      verified: verifiedFilter,
      dateFrom: dateRange?.from?.toISOString(),
      dateTo: dateRange?.to?.toISOString()
    },
    {
      initialPage: 1,
      initialPageSize: 10,
      prefetchNext: true
    }
  );
  
  // Cache management
  const cacheManager = useCacheManager();
  
  // Get users data from pagination
  const users = pagination.data;
  const loading = pagination.loading;
  const error = pagination.error;
  const refreshUsers = pagination.refresh;
  const totalUsers = pagination.pagination.totalItems || 0;
  const totalPages = pagination.pagination.totalPages || 1;
  
  // User stats (separate cache)
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  
  // Form validation for suspension
  const {
    errors: suspensionErrors,
    validateForm: validateSuspension,
    validateField: validateSuspensionField,
    clearErrors: clearSuspensionErrors
  } = useFormValidation(userSuspensionSchema);
  const { toast } = useToast();

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    pagination.goToPage(page);
  };
  
  const handlePageSizeChange = (pageSize: number) => {
    pagination.setPageSize(pageSize);
    pagination.goToFirstPage(); // Reset to first page
  };
  
  const handleRefresh = () => {
    refreshUsers();
    cacheManager.invalidatePattern('users');
  };

  // Load user stats
  const loadUserStats = async () => {
    try {
      const response = await userService.getUserStats();
      if (response.success && response.data) {
        setUserStats(response.data);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Load user details for modal
  const loadUserDetails = async (userId: string) => {
    try {
      console.log('Loading user details for:', userId);
      
      const [userResponse, transactionsResponse, activitiesResponse] = await Promise.all([
        userService.getUserById(userId),
        userService.getUserTransactions(userId, { limit: 10 }),
        userService.getUserActivities(userId, { limit: 10 })
      ]);

      console.log('API responses:', { userResponse, transactionsResponse, activitiesResponse });

      if (userResponse.success && userResponse.data) {
        setSelectedUser(userResponse.data);
        console.log('User details set successfully');
      } else {
        console.warn('User response failed:', userResponse);
      }
      
      if (transactionsResponse.success && transactionsResponse.data) {
        setUserTransactions(transactionsResponse.data.data || []);
        console.log('Transactions set successfully:', transactionsResponse.data.data?.length || 0);
      } else {
        console.warn('Transactions response failed:', transactionsResponse);
        setUserTransactions([]);
      }
      
      if (activitiesResponse.success && activitiesResponse.data) {
        setUserActivities(activitiesResponse.data.data || []);
        console.log('Activities set successfully:', activitiesResponse.data.data?.length || 0);
      } else {
        console.warn('Activities response failed:', activitiesResponse);
        setUserActivities([]);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
      // Don't show toast error as it might interfere with modal
      // Just log the error and set empty states
      setUserTransactions([]);
      setUserActivities([]);
    }
  };

  // User actions
  const handleActivateUser = async (userId: string) => {
    try {
      const response = await userService.activateUser(userId);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Utilisateur activé avec succès",
        });
        refreshUsers();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'activer l'utilisateur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error activating user:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'activation de l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await userService.deactivateUser(userId);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Utilisateur désactivé avec succès",
        });
        refreshUsers();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de désactiver l'utilisateur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la désactivation de l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleSuspendUser = async (userId: string, reason: string, customDetails: string) => {
    try {
      const finalReason = reason === "Autre (veuillez préciser)" ? customDetails : reason;
      const response = await userService.suspendUser(userId, finalReason);
      if (response.success) {
        toast({
          title: "Utilisateur suspendu",
          description: "L'utilisateur a été suspendu et un email de notification a été envoyé.",
        });
        setSuspensionReason("");
        setCustomReason("");
        refreshUsers();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de suspendre l'utilisateur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suspension de l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      const response = await userService.verifyUserEmail(userId);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Utilisateur vérifié avec succès",
        });
        refreshUsers();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de vérifier l'utilisateur",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la vérification de l'utilisateur",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await userService.forcePasswordChange(userId);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Réinitialisation du mot de passe envoyée par email",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de réinitialiser le mot de passe",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la réinitialisation du mot de passe",
        variant: "destructive",
      });
    }
  };

  const handleExportUsers = async () => {
    try {
      const filters: UserFilterParams = {
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter as any : undefined,
        verified: verifiedFilter !== "all" ? verifiedFilter === "verified" : undefined,
        dateFrom: dateRange?.from,
        dateTo: dateRange?.to,
      };

      const response = await userService.exportUsersCSV(filters);
      if (response.success && response.data) {
        // Create download link
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Succès",
          description: "Export des utilisateurs téléchargé",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'exporter les utilisateurs",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'export des utilisateurs",
        variant: "destructive",
      });
    }
  };

  // Load user stats on mount
  useEffect(() => {
    loadUserStats();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    pagination.goToFirstPage();
  }, [searchTerm, statusFilter, verifiedFilter, dateRange]);

  const getStatusBadge = (user: User) => {
    if (user.isSuspended) {
      return <Badge variant="destructive">Suspendu</Badge>;
    }
    if (user.isActive) {
      return <Badge className="bg-success text-success-foreground">Actif</Badge>;
    }
    return <Badge variant="secondary">Inactif</Badge>;
  };

  const suspensionReasons = [
    "Violation des conditions d'utilisation",
    "Activité suspecte détectée",
    "Non-respect des règles de la plateforme",
    "Plaintes répétées d'autres utilisateurs",
    "Documents d'identité non valides",
    "Autre (veuillez préciser)"
  ];

  const SuspensionDialog = ({ user, onSuspensionComplete }: { user: User; onSuspensionComplete?: () => void }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Ban className="h-4 w-4 mr-2" />
          Suspendre
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Suspendre l'utilisateur
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de suspendre <strong>{user.firstName} {user.lastName}</strong>. 
            Cette action désactivera temporairement son compte et lui enverra un email de notification.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <FormErrorSummary errors={suspensionErrors} />
          
          <SelectField
            label="Raison de la suspension"
            name="reason"
            value={suspensionReason}
            onChange={(value) => {
              setSuspensionReason(value);
              validateSuspensionField('reason', value);
            }}
            options={suspensionReasons.map(reason => ({ value: reason, label: reason }))}
            placeholder="Sélectionnez une raison"
            error={suspensionErrors.reason}
            required
          />
          
          {suspensionReason === "Autre (veuillez préciser)" && (
            <TextareaField
              label="Précisez la raison"
              name="customReason"
              value={customReason}
              onChange={(value) => {
                setCustomReason(value);
                validateSuspensionField('customReason', value);
              }}
              placeholder="Décrivez la raison de la suspension..."
              rows={3}
              error={suspensionErrors.customReason}
              required
            />
          )}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setSuspensionReason("");
            setCustomReason("");
            clearSuspensionErrors();
          }}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              const formData = {
                reason: suspensionReason,
                customReason: customReason
              };
              
              const isValid = validateSuspension(formData);
              if (!isValid) {
                toast({
                  title: "Erreur de validation",
                  description: "Veuillez corriger les erreurs dans le formulaire.",
                  variant: "destructive"
                });
                return;
              }
              
              await handleSuspendUser(user.id, suspensionReason, customReason);
              if (onSuspensionComplete) {
                onSuspensionComplete();
              }
              
              // Reset form after successful suspension
              setSuspensionReason("");
              setCustomReason("");
              clearSuspensionErrors();
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            Suspendre l'utilisateur
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const UserDetailsModal = ({ user }: { user: User }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<User>(user);
    const [userTransactionsLocal, setUserTransactionsLocal] = useState<Transaction[]>([]);
    const [userActivitiesLocal, setUserActivitiesLocal] = useState<UserActivity[]>([]);

    const handleOpenModal = async () => {
      setIsOpen(true);
      setIsLoading(true);
      setCurrentUser(user);
      
      try {
        console.log('Loading user details for:', user.id);
        
        const [userResponse, transactionsResponse, activitiesResponse] = await Promise.all([
          userService.getUserById(user.id),
          userService.getUserTransactions(user.id, { limit: 10 }),
          userService.getUserActivities(user.id, { limit: 10 })
        ]);

        console.log('API responses:', { userResponse, transactionsResponse, activitiesResponse });

        if (userResponse.success && userResponse.data) {
          setCurrentUser(userResponse.data);
          console.log('User details loaded successfully');
        }
        
        if (transactionsResponse.success && transactionsResponse.data) {
          setUserTransactionsLocal(transactionsResponse.data.data || []);
          console.log('Transactions loaded:', transactionsResponse.data.data?.length || 0);
        } else {
          setUserTransactionsLocal([]);
        }
        
        if (activitiesResponse.success && activitiesResponse.data) {
          setUserActivitiesLocal(activitiesResponse.data.data || []);
          console.log('Activities loaded:', activitiesResponse.data.data?.length || 0);
        } else {
          setUserActivitiesLocal([]);
        }
      } catch (error) {
        console.error('Error loading user details:', error);
        setUserTransactionsLocal([]);
        setUserActivitiesLocal([]);
      } finally {
        setIsLoading(false);
      }
    };

    const handleUserActionLocal = async (actionFn: () => Promise<void>) => {
      try {
        await actionFn();
        // Refresh user details after action without closing modal
        await handleOpenModal();
      } catch (error) {
        console.error('Error in user action:', error);
      }
    };

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleOpenModal}>
            <Eye className="h-4 w-4 mr-2" />
            Voir
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                </span>
              </div>
              <div>
                <div className="text-xl font-semibold">{currentUser.firstName} {currentUser.lastName}</div>
                <div className="text-sm text-gray-500">{currentUser.email}</div>
              </div>
              {isLoading && (
                <div className="ml-auto">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{currentUser.email}</span>
                  {currentUser.verifiedEmail && <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                {currentUser.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{currentUser.phoneNumber}</span>
                  </div>
                )}
                {currentUser.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{currentUser.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Inscrit le {new Date(currentUser.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Statut:</span>
                  {getStatusBadge(currentUser)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Vérifié:</span>
                  {currentUser.isVerified ? (
                    <Badge className="bg-success text-success-foreground">✓ Vérifié</Badge>
                  ) : (
                    <Badge variant="outline">✗ Non vérifié</Badge>
                  )}
                </div>
                {currentUser.isAdmin && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <Badge variant="default">Administrateur</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{currentUser.completedRentals || 0}</div>
                    <div className="text-xs text-blue-600">Locations</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{currentUser.ratingAsOwner || 0}/5</div>
                    <div className="text-xs text-green-600">Note propriétaire</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{currentUser.ratingAsRenter || 0}/5</div>
                    <div className="text-xs text-purple-600">Note locataire</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{currentUser.cancelledRentals || 0}</div>
                    <div className="text-xs text-orange-600">Annulations</div>
                  </div>
                </div>
                {currentUser.lastLoginAt && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Dernière connexion: {new Date(currentUser.lastLoginAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transactions récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transactions récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userTransactionsLocal.length > 0 ? (
                <div className="space-y-3">
                  {userTransactionsLocal.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'credit' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{transaction.description}</div>
                          <div className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}€{Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aucune transaction trouvée
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activités récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activités récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userActivitiesLocal.length > 0 ? (
                <div className="space-y-3">
                  {userActivitiesLocal.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{activity.action}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleDateString('fr-FR')} à {new Date(activity.createdAt).toLocaleTimeString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune activité récente</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {currentUser.isActive ? (
              <Button variant="outline" size="sm" onClick={() => handleUserActionLocal(() => handleDeactivateUser(currentUser.id))}>
                <UserX className="h-4 w-4 mr-2" />
                Désactiver
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => handleUserActionLocal(() => handleActivateUser(currentUser.id))}>
                <UserCheck className="h-4 w-4 mr-2" />
                Activer
              </Button>
            )}
            
            {!currentUser.verifiedEmail && (
              <Button variant="outline" size="sm" onClick={() => handleUserActionLocal(() => handleVerifyUser(currentUser.id))}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Vérifier
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={() => handleResetPassword(currentUser.id)}>
              <Key className="h-4 w-4 mr-2" />
              Réinitialiser mot de passe
            </Button>
            
            {!currentUser.isSuspended && (
              <SuspensionDialog 
                user={currentUser} 
                onSuspensionComplete={() => handleOpenModal()} 
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Monitor */}
      <PerformanceMonitor />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600 mt-2">Gérez les comptes et profils utilisateurs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total utilisateurs</p>
                  <p className="text-2xl font-bold">{userStats.totalUsers}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs actifs</p>
                  <p className="text-2xl font-bold">{userStats.activeUsers}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs vérifiés</p>
                  <p className="text-2xl font-bold">{userStats.verifiedUsers}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nouveaux ce mois</p>
                  <p className="text-2xl font-bold">{userStats.newUsersThisMonth}</p>
                </div>
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vérification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="verified">Vérifiés</SelectItem>
                <SelectItem value="unverified">Non vérifiés</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder="Filtrer par date d'inscription"
              fullWidth={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs ({totalUsers})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                  <TableHead className="hidden lg:table-cell">Localisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Vérifié</TableHead>
                  <TableHead className="hidden lg:table-cell">Inscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.isAdmin && (
                          <Badge variant="default" className="mt-1">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{user.phoneNumber || '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell">{user.city || '-'}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {user.verifiedEmail ? (
                        <Badge className="bg-success text-success-foreground">✓</Badge>
                      ) : (
                        <Badge variant="outline">✗</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserDetailsModal user={user} />
                        {user.isActive ? (
                          <Button variant="outline" size="sm" onClick={() => handleDeactivateUser(user.id)}>
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleActivateUser(user.id)}>
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Aucun utilisateur trouvé
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <EnhancedPagination
                 pagination={{
                   currentPage: pagination.pagination.currentPage,
                   pageSize: pagination.pagination.pageSize,
                   totalItems: totalUsers,
                   totalPages: totalPages,
                   hasNextPage: pagination.pagination.hasNextPage,
      hasPreviousPage: pagination.pagination.hasPreviousPage
                 }}
                 onPageChange={handlePageChange}
                 onPageSizeChange={handlePageSizeChange}
                 onRefresh={handleRefresh}
                 showPageSize={true}
                 showRefresh={true}
                 pageSizeOptions={[10, 25, 50, 100]}
               />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;