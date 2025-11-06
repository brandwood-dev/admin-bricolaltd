import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  SelectField,
  TextareaField,
  FormErrorSummary,
} from '@/components/ui/form-field'
import { useFormValidation } from '@/hooks/useFormValidation'
import { userSuspensionSchema } from '@/utils/validation'
import { EnhancedPagination } from '@/components/ui/enhanced-pagination'
import { usePagination } from '@/hooks/usePagination'
import { useUsersCache, useCacheManager } from '@/hooks/useCache'
import { PerformanceMonitor } from '@/components/ui/performance-monitor'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  TrendingDown,
  ArrowUpDown,
  AlertTriangle,
  AlertCircle,
  UserCheck,
  UserX,
  Key,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Wrench,
  MessageCircle,
  Heart,
  Star,
  Package,
  Home,
  DollarSign,
  Wallet,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DateRange } from 'react-day-picker'
import { userService, UserStats } from '@/services/userService'
import {
  userStatsService,
  UserDetailedStats,
  UserTransaction,
  UserDetailedActivity,
} from '@/services/userStatsService'
import {
  User,
  UserFilterParams,
  PaginatedResponse,
  Transaction,
  UserActivity,
} from '@/types/unified-bridge'

// Mapping des codes pays vers noms complets
const COUNTRY_MAP = {
  SA: 'Arabie Saoudite',
  BH: 'Bahreïn',
  KW: 'Koweït',
  OM: 'Oman',
  QA: 'Qatar',
  AE: 'Émirats Arabes Unis',
} as const

const getCountryName = (countryId?: string) => {
  if (!countryId) return undefined
  const code = countryId.trim().toUpperCase()
  return (COUNTRY_MAP as Record<string, string>)[code]
}

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [userStats, setUserStats] = useState<UserDetailedStats | null>(null)
  const [userTransactions, setUserTransactions] = useState<UserTransaction[]>(
    []
  )
  const [userActivities, setUserActivities] = useState<UserDetailedActivity[]>(
    []
  )
  const [loadingStats, setLoadingStats] = useState(false)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState<string[]>([])

  // Enhanced pagination with caching - Fixed to 10 users per page
  const pagination = usePagination<User>(
    'users',
    async (page: number, pageSize: number, filters?: any) => {
      console.log('🔍 [SEARCH DEBUG] Pagination function called with:', { page, pageSize, filters })
      console.log('🔍 [SEARCH DEBUG] Current searchTerm state:', searchTerm)
      
      // Map frontend filters to API parameters according to UserFilterParams interface
      const params: UserFilterParams = {
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        // Map status filter to isActive boolean
        isActive:
          filters?.status === 'all'
            ? undefined
            : filters?.status === 'active'
            ? true
            : filters?.status === 'suspended'
            ? false
            : undefined,
        // Map country filter to country name
        country:
          filters?.country === 'all'
            ? undefined
            : filters?.country,
        // Map date range to startDate/endDate
        startDate: filters?.dateFrom,
        endDate: filters?.dateTo,
        // Default sorting
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      }

      console.log('🔍 [SEARCH DEBUG] Final API params being sent:', params)
      console.log('🔍 [SEARCH DEBUG] Search parameter specifically:', params.search)
      try {
        const response = await userService.getUsers(params)
        console.log('🔍 [SEARCH DEBUG] API Response received:', response.data)
        
        // Extract pagination data from PaginatedResponse structure
        const responseData = response.data
        const usersData = responseData?.data || []
        const total = responseData.total
        const currentPage = responseData.page
        const totalPages = responseData.totalPages

        console.log('Extracted pagination data:', {
          total,
          currentPage,
          totalPages,
          usersDataLength: usersData.length,
          responseStructure: {
            hasMeta: !!responseData?.meta,
            hasTotal: !!responseData?.total,
            hasPagination: !!responseData?.pagination,
            hasData: !!responseData?.data,
          },
        })

        return {
          data: usersData,
          pagination: {
            page: currentPage,
            pageSize: pageSize,
            total: total,
            totalPages: totalPages,
          },
        }
      } catch (error) {
        console.error('❌ API Error:', error)
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        })
        throw error
      }
    },
    {
      search: searchTerm,
      status: statusFilter,
      country: countryFilter,
      dateFrom: dateRange?.from?.toISOString(),
      dateTo: dateRange?.to?.toISOString(),
    },
    {
      initialPage: 1,
      initialPageSize: 50,
      prefetchNext: true,
    }
  )

  // Cache management
  const cacheManager = useCacheManager()

  // Get users data from pagination
  const users = pagination.data
  const loading = pagination.loading
  const error = pagination.error
  const refreshUsers = pagination.refresh

  // Ensure proper fallback values for pagination data
  const totalUsers = pagination.pagination?.totalItems ?? pagination.pagination?.total ?? 0
  const totalPages = pagination.pagination?.totalPages ?? Math.max(1, Math.ceil(totalUsers / (pagination.pagination?.pageSize ?? pagination.pageSize ?? 10)))
  const currentPage = pagination.pagination?.currentPage ?? pagination.pagination?.page ?? pagination.currentPage ?? 1

  // Debug logs for pagination data
  console.log('Pagination debug:', {
    totalUsers,
    totalPages,
    currentPage,
    paginationData: pagination.pagination,
    usersLength: users.length,
    loading,
    error,
  })

  // Load user stats (separate cache)
  const [globalUserStats, setGlobalUserStats] = useState<UserStats | null>(null)

  const handleViewUser = async (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
    await loadUserDetailedData(user.id)
  }

  const loadUserDetailedData = async (userId: string) => {
    setLoadingStats(true)
    try {
      // Charger les statistiques détaillées
      const statsResponse = await userStatsService.getUserDetailedStats(userId)
      if (statsResponse.data) {
        setUserStats(statsResponse.data)
      }

      // Charger les transactions récentes
      const transactionsResponse =
        await userStatsService.getUserDetailedTransactions(userId, {
          limit: 10,
        })
      if (transactionsResponse.data) {
        setUserTransactions(transactionsResponse.data.data || [])
      }

      // Charger les activités récentes
      const activitiesResponse =
        await userStatsService.getUserDetailedActivities(userId, { limit: 10 })
      if (activitiesResponse.data) {
        setUserActivities(activitiesResponse.data.data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error)
      // En cas d'erreur, utiliser les données de base de l'utilisateur
      setUserStats({
        toolsCount: 0,
        reservationsCount: 0,
        rentalsCount: 0,
        averageRating: 0,
        totalEarnings: 0,
        availableBalance: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        totalReviews: 0,
      })
      setUserTransactions([])
      setUserActivities([])
    } finally {
      setLoadingStats(false)
    }
  }

  // Form validation for suspension
  const {
    errors: suspensionErrors,
    validateForm: validateSuspension,
    validateField: validateSuspensionField,
    clearErrors: clearSuspensionErrors,
  } = useFormValidation(userSuspensionSchema)
  const { toast } = useToast()

  // Auto-refresh when filters change with debounce
  useEffect(() => {
    console.log('🔍 [SEARCH DEBUG] Search filters changed:', {
      searchTerm,
      statusFilter,
      countryFilter,
      dateRange: {
        from: dateRange?.from?.toISOString(),
        to: dateRange?.to?.toISOString()
      }
    })
    
    const timeoutId = setTimeout(() => {
      console.log('🔍 [SEARCH DEBUG] ⏰ Debounce timeout triggered, refreshing data...')
      console.log('🔍 [SEARCH DEBUG] Current filters being applied:', {
        searchTerm,
        statusFilter,
        countryFilter,
        dateRange,
      })
      console.log('🔍 [SEARCH DEBUG] About to call pagination.refresh()')
      pagination.refresh()
    }, 500) // 500ms debounce for search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, countryFilter, dateRange])

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    pagination.goToPage(page)
  }

  const handlePageSizeChange = (pageSize: number) => {
    pagination.setPageSize(pageSize)
    pagination.goToFirstPage() // Reset to first page
  }

  const handleRefresh = () => {
    pagination.refresh()
    cacheManager.invalidatePattern('users')
  }

  // Load user stats
  const loadUserStats = async () => {
    try {
      const response = await userService.getUserStats()
      if (response.success && response.data) {
        setGlobalUserStats(response.data)
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  // Load user details for modal
  const loadUserDetails = async (userId: string) => {
    try {
      console.log('Loading user details for:', userId)

      const [userResponse, transactionsResponse, activitiesResponse] =
        await Promise.all([
          userService.getUserById(userId),
          userService.getUserTransactions(userId, { limit: 10 }),
          userService.getUserActivities(userId, { limit: 10 }),
        ])

      console.log('API responses:', {
        userResponse,
        transactionsResponse,
        activitiesResponse,
      })

      if (userResponse.success && userResponse.data) {
        setSelectedUser(userResponse.data)
        console.log('User details set successfully')
      } else {
        console.warn('User response failed:', userResponse)
      }

      if (transactionsResponse.success && transactionsResponse.data) {
        setUserTransactions(transactionsResponse.data.data || [])
        console.log(
          'Transactions set successfully:',
          transactionsResponse.data.data?.length || 0
        )
      } else {
        console.warn('Transactions response failed:', transactionsResponse)
        setUserTransactions([])
      }

      if (activitiesResponse.success && activitiesResponse.data) {
        setUserActivities(activitiesResponse.data.data || [])
        console.log(
          'Activities set successfully:',
          activitiesResponse.data.data?.length || 0
        )
      } else {
        console.warn('Activities response failed:', activitiesResponse)
        setUserActivities([])
      }
    } catch (error) {
      console.error('Error loading user details:', error)
      // Don't show toast error as it might interfere with modal
      // Just log the error and set empty states
      setUserTransactions([])
      setUserActivities([])
    }
  }

  // User actions
  const handleActivateUser = async (userId: string) => {
    try {
      const response = await userService.activateUser(userId)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Utilisateur activé avec succès',
        })
        pagination.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: "Impossible d'activer l'utilisateur",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error activating user:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'activation de l'utilisateur",
        variant: 'destructive',
      })
    }
  }

  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await userService.deactivateUser(userId)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Utilisateur désactivé avec succès',
        })
        pagination.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: "Impossible de désactiver l'utilisateur",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deactivating user:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de la désactivation de l'utilisateur",
        variant: 'destructive',
      })
    }
  }

  const handleSuspendUser = async (
    userId: string,
    reason: string
  ) => {
    try {
      const response = await userService.suspendUser(userId, reason)
      if (response.success) {
        toast({
          title: 'Utilisateur suspendu',
          description:
            "L'utilisateur a été suspendu et un email de notification a été envoyé.",
        })
        setSuspensionReason('')
        pagination.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: "Impossible de suspendre l'utilisateur",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error suspending user:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de la suspension de l'utilisateur",
        variant: 'destructive',
      })
    }
  }

  const handleVerifyUser = async (userId: string) => {
    try {
      const response = await userService.verifyUserEmail(userId)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Utilisateur vérifié avec succès',
        })
        pagination.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: "Impossible de vérifier l'utilisateur",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error verifying user:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de la vérification de l'utilisateur",
        variant: 'destructive',
      })
    }
  }

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await userService.forcePasswordChange(userId)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Réinitialisation du mot de passe envoyée par email',
        })
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de réinitialiser le mot de passe',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la réinitialisation du mot de passe',
        variant: 'destructive',
      })
    }
  }

  const handleExportCSV = async () => {
    try {
      const filters: UserFilterParams = {
        search: searchTerm || undefined,
        isActive:
          statusFilter === 'all'
            ? undefined
            : statusFilter === 'active'
            ? true
            : statusFilter === 'suspended'
            ? false
            : undefined,
        country:
          countryFilter === 'all' ? undefined : countryFilter,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
      }

      const response = await userService.exportUsersCSV(filters)
      if (response.success && response.data) {
        // Create download link
        const url = window.URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = `users-export-${
          new Date().toISOString().split('T')[0]
        }.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Succès',
          description: 'Export CSV des utilisateurs téléchargé',
        })
      } else {
        toast({
          title: 'Erreur',
          description: "Impossible d'exporter les utilisateurs en CSV",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error exporting users CSV:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'export CSV des utilisateurs",
        variant: 'destructive',
      })
    }
  }

  // Load user stats on mount
  useEffect(() => {
    loadUserStats()
  }, [])

  const getStatusBadge = (user: User) => {
    if (user.isSuspended) {
      return <Badge variant='destructive'>Suspendu</Badge>
    }
    if (user.isActive) {
      return <Badge className='bg-success text-success-foreground'>Actif</Badge>
    }
    return <Badge variant='secondary'>Inactif</Badge>
  }

  const suspensionReasons = [
    'Fraud or Attempted Fraud',
    'Violation of Terms of Use',
    'Inappropriate Behavior',
    'Non-Compliant or Dangerous Tool',
    'Multiple Accounts Prohibited',
    'Suspicion of Fraudulent Activity',
    "User's Voluntary Request",
    'Abusive Reviews or Comments',
  ]



  const UserDetailsModal = ({ user }: { user: User }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [currentUser, setCurrentUser] = useState<User>(user)
    const [userTransactionsLocal, setUserTransactionsLocal] = useState<
      Transaction[]
    >([])
    const [userActivitiesLocal, setUserActivitiesLocal] = useState<
      UserActivity[]
    >([])
    const [suspensionReason, setSuspensionReason] = useState('')

    const handleOpenModal = async () => {
      setIsOpen(true)
      setIsLoading(true)
      setCurrentUser(user)

      try {
        console.log('Loading user details for:', user.id)

        const [userResponse, transactionsResponse, activitiesResponse] =
          await Promise.all([
            userService.getUserById(user.id),
            userService.getUserTransactions(user.id, { limit: 10 }),
            userService.getUserActivities(user.id, { limit: 10 }),
          ])

        console.log('API responses:', {
          userResponse,
          transactionsResponse,
          activitiesResponse,
        })

        if (userResponse.success && userResponse.data) {
          console.log('🔍 Données utilisateur reçues:', {
            id: userResponse.data.id,
            firstName: userResponse.data.firstName,
            lastName: userResponse.data.lastName,
            email: userResponse.data.email,
            profilePicture: userResponse.data.profilePicture,
            profilePictureLength: userResponse.data.profilePicture?.length,
            profilePictureTrimmed: userResponse.data.profilePicture?.trim(),
          })
          setCurrentUser(userResponse.data)
          console.log('User details loaded successfully')
        }

        if (transactionsResponse.success && transactionsResponse.data) {
          setUserTransactionsLocal(transactionsResponse.data.data || [])
          console.log(
            'Transactions loaded:',
            transactionsResponse.data.data?.length || 0
          )
        } else {
          setUserTransactionsLocal([])
        }

        if (activitiesResponse.success && activitiesResponse.data) {
          setUserActivitiesLocal(activitiesResponse.data.data || [])
          console.log(
            'Activities loaded:',
            activitiesResponse.data.data?.length || 0
          )
        } else {
          setUserActivitiesLocal([])
        }
      } catch (error) {
        console.error('Error loading user details:', error)
        setUserTransactionsLocal([])
        setUserActivitiesLocal([])
      } finally {
        setIsLoading(false)
      }
    }

    const handleUserActionLocal = async (actionFn: () => Promise<void>) => {
      try {
        await actionFn()
        // Refresh user details after action without closing modal
        await handleOpenModal()
      } catch (error) {
        console.error('Error in user action:', error)
      }
    }

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant='outline' size='sm' onClick={handleOpenModal}>
            <Eye className='h-4 w-4 mr-2' />
            Voir
          </Button>
        </DialogTrigger>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-3'>
              <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden'>
                {currentUser.profilePicture ? (
                  <img
                    src={currentUser.profilePicture.trim()}
                    alt={`${currentUser.firstName} ${currentUser.lastName}`}
                    className='w-full h-full object-cover'
                    onLoad={() => {
                      console.log('✅ Photo de profil chargée avec succès:', currentUser.profilePicture.trim())
                    }}
                    onError={(e) => {
                      console.error('❌ Erreur de chargement de la photo de profil:', currentUser.profilePicture.trim())
                      console.error('Détails de l\'erreur:', e)
                      e.currentTarget.style.display = 'none'
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                      if (nextElement) {
                        nextElement.style.display = 'flex'
                      }
                    }}
                  />
                ) : null}
                <span 
                  className={`text-lg font-semibold text-primary ${
                    currentUser.profilePicture ? 'hidden' : 'flex'
                  } items-center justify-center w-full h-full`}
                >
                  {currentUser.firstName?.[0]}
                  {currentUser.lastName?.[0]}
                </span>
              </div>
              <div>
                <div className='text-xl font-semibold'>
                  {currentUser.firstName} {currentUser.lastName}
                </div>
                <div className='text-sm text-gray-500'>{currentUser.email}</div>
              </div>
              {isLoading && (
                <div className='ml-auto'>
                  <RefreshCw className='h-5 w-5 animate-spin text-primary' />
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center gap-2'>
                  <Mail className='h-4 w-4 text-gray-500' />
                  <span className='text-sm'>{currentUser.email}</span>
                </div>
                {currentUser.phoneNumber && (
                  <div className='flex items-center gap-2'>
                    <Phone className='h-4 w-4 text-gray-500' />
                    <span className='text-sm'>{currentUser.phoneNumber}</span>
                  </div>
                )}
                {currentUser.country?.name && (
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4 text-gray-500' />
                    <span className='text-sm'>{currentUser.country?.name}</span>
                  </div>
                )}
                <div className='flex items-center gap-2'>
                  <CalendarIcon className='h-4 w-4 text-gray-500' />
                  <span className='text-sm'>
                    Inscrit le{' '}
                    {new Date(currentUser.createdAt).toLocaleDateString(
                      'fr-FR'
                    )}
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-sm'>Statut:</span>
                  {getStatusBadge(currentUser)}
                </div>
                {currentUser.isSuspended && (
                  <div className='space-y-3'>
                    <div className='flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
                      <AlertTriangle className='h-4 w-4 text-red-500 mt-0.5 flex-shrink-0' />
                      <div>
                        <div className='text-sm font-medium text-red-800'>Raison de la suspension:</div>
                        <div className='text-sm text-red-700 mt-1'>{currentUser.isSuspended}</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUserActionLocal(() => handleActivateUser(currentUser.id))}
                      className='w-full bg-green-600 hover:bg-green-700 text-white'
                      size='sm'
                    >
                      <CheckCircle className='h-4 w-4 mr-2' />
                      Réactiver l'utilisateur
                    </Button>
                  </div>
                )}
                {/* Removed email verification display */}
                {currentUser.isAdmin && (
                  <div className='flex items-center gap-2'>
                    <Shield className='h-4 w-4 text-blue-500' />
                    <Badge variant='default'>Administrateur</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='grid grid-cols-2 lg:grid-cols-3 gap-4'>
                  <div className='text-center p-3 bg-blue-50 rounded-lg'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {currentUser.toolsCount || 0}
                    </div>
                    <div className='text-xs text-blue-600'>Annonces</div>
                  </div>
                  <div className='text-center p-3 bg-green-50 rounded-lg'>
                    <div className='text-2xl font-bold text-green-600'>
                      {currentUser.reservationsCount || 0}
                    </div>
                    <div className='text-xs text-green-600'>Réservations</div>
                  </div>
                  <div className='text-center p-3 bg-purple-50 rounded-lg'>
                    <div className='text-2xl font-bold text-purple-600'>
                      {currentUser.rentalsCount || 0}
                    </div>
                    <div className='text-xs text-purple-600'>Locations</div>
                  </div>
                  <div className='text-center p-3 bg-yellow-50 rounded-lg'>
                    <div className='text-2xl font-bold text-yellow-600'>
                      {currentUser.averageRating
                        ? `${currentUser.averageRating.toFixed(1)}/5`
                        : '0/5'}
                    </div>
                    <div className='text-xs text-yellow-600'>Note moyenne</div>
                  </div>
                  <div className='text-center p-3 bg-emerald-50 rounded-lg'>
                    <div className='text-2xl font-bold text-emerald-600'>
                      €
                      {currentUser.totalEarnings
                        ? currentUser.totalEarnings.toFixed(2)
                        : '0.00'}
                    </div>
                    <div className='text-xs text-emerald-600'>Solde cumulé</div>
                  </div>
                  <div className='text-center p-3 bg-teal-50 rounded-lg'>
                    <div className='text-2xl font-bold text-teal-600'>
                      €
                      {currentUser.availableBalance
                        ? currentUser.availableBalance.toFixed(2)
                        : '0.00'}
                    </div>
                    <div className='text-xs text-teal-600'>
                      Solde disponible
                    </div>
                  </div>
                </div>
                {currentUser.lastLoginAt && (
                  <div className='flex items-center gap-2 pt-2 border-t'>
                    <Clock className='h-4 w-4 text-gray-500' />
                    <span className='text-sm'>
                      Dernière connexion:{' '}
                      {new Date(currentUser.lastLoginAt).toLocaleDateString(
                        'fr-FR'
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transactions récentes */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <CreditCard className='h-5 w-5' />
                Transactions récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <RefreshCw className='h-6 w-6 animate-spin text-primary' />
                  <span className='ml-2 text-sm text-gray-500'>
                    Chargement des transactions...
                  </span>
                </div>
              ) : userTransactionsLocal.length > 0 ? (
                <div className='space-y-3'>
                  {userTransactionsLocal.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className='p-4 bg-gray-50 rounded-lg border-l-4 border-l-gray-300'
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <div className='flex items-center gap-3'>
                          <div
                            className={`p-2 rounded-full ${
                              transaction.type === 'credit'
                                ? 'bg-green-100 text-green-600'
                                : transaction.type === 'debit'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            {transaction.type === 'credit' ? (
                              <TrendingUp className='h-4 w-4' />
                            ) : transaction.type === 'debit' ? (
                              <TrendingDown className='h-4 w-4' />
                            ) : (
                              <ArrowUpDown className='h-4 w-4' />
                            )}
                          </div>
                          <div>
                            <div className='font-medium text-sm'>
                              {transaction.type === 'credit'
                                ? 'Réception'
                                : transaction.type === 'debit'
                                ? 'Retrait'
                                : 'Transaction'}
                            </div>
                            <div className='text-xs text-gray-600'>
                              {transaction.description}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`font-bold text-lg ${
                            transaction.type === 'credit'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {transaction.type === 'credit' ? '+' : '-'}€
                          {Math.abs(transaction.amount).toFixed(2)}
                        </div>
                      </div>
                      <div className='flex items-center justify-between text-xs text-gray-500'>
                        <span>ID: {transaction.id}</span>
                        <span>
                          {new Date(transaction.createdAt).toLocaleDateString(
                            'fr-FR'
                          )}{' '}
                          à{' '}
                          {new Date(transaction.createdAt).toLocaleTimeString(
                            'fr-FR'
                          )}
                        </span>
                      </div>
                      {transaction.status && (
                        <div className='mt-2'>
                          <Badge
                            variant={
                              transaction.status === 'completed'
                                ? 'default'
                                : 'outline'
                            }
                            className='text-xs'
                          >
                            {transaction.status === 'completed'
                              ? 'Terminée'
                              : transaction.status === 'pending'
                              ? 'En attente'
                              : transaction.status === 'failed'
                              ? 'Échouée'
                              : transaction.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <CreditCard className='h-12 w-12 mx-auto mb-4 opacity-50' />
                  <p>Aucune transaction trouvée</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activités récentes */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Activity className='h-5 w-5' />
                Activités récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <RefreshCw className='h-6 w-6 animate-spin text-primary' />
                  <span className='ml-2 text-sm text-gray-500'>
                    Chargement des activités...
                  </span>
                </div>
              ) : userActivitiesLocal.length > 0 ? (
                <div className='space-y-4'>
                  {userActivitiesLocal.slice(0, 5).map((activity) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case 'tool_created':
                          return <Wrench className='h-4 w-4' />
                        case 'comment_posted':
                          return <MessageCircle className='h-4 w-4' />
                        case 'reservation_request':
                          return <Calendar className='h-4 w-4' />
                        case 'favorite_added':
                          return <Heart className='h-4 w-4' />
                        default:
                          return <Activity className='h-4 w-4' />
                      }
                    }

                    const getActivityColor = (type: string) => {
                      switch (type) {
                        case 'tool_created':
                          return 'bg-green-100 text-green-600'
                        case 'comment_posted':
                          return 'bg-blue-100 text-blue-600'
                        case 'reservation_request':
                          return 'bg-orange-100 text-orange-600'
                        case 'favorite_added':
                          return 'bg-pink-100 text-pink-600'
                        default:
                          return 'bg-gray-100 text-gray-600'
                      }
                    }

                    return (
                      <div
                        key={activity.id}
                        className='p-4 bg-gray-50 rounded-lg border-l-4 border-l-blue-300'
                      >
                        <div className='flex items-start gap-3'>
                          <div
                            className={`p-2 rounded-full ${getActivityColor(
                              activity.type
                            )}`}
                          >
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className='flex-1'>
                            <div className='font-medium text-sm mb-1'>
                              {activity.type === 'tool_created' &&
                                "Création d'outil"}
                              {activity.type === 'comment_posted' &&
                                'Commentaire publié'}
                              {activity.type === 'reservation_request' &&
                                'Demande de réservation'}
                              {activity.type === 'favorite_added' &&
                                'Ajout aux favoris'}
                              {![
                                'tool_created',
                                'comment_posted',
                                'reservation_request',
                                'favorite_added',
                              ].includes(activity.type) && activity.action}
                            </div>

                            {/* Détails spécifiques selon le type d'activité */}
                            {activity.type === 'tool_created' &&
                              activity.details && (
                                <div className='text-xs text-gray-600 space-y-1'>
                                  <div>
                                    <strong>Titre:</strong>{' '}
                                    {activity.details.title}
                                  </div>
                                  <div>
                                    <strong>Catégorie:</strong>{' '}
                                    {activity.details.category}
                                  </div>
                                  <div>
                                    <strong>Prix:</strong> €
                                    {activity.details.price}/jour
                                  </div>
                                  <div className='flex gap-2'>
                                    <Badge
                                      variant={
                                        activity.details.moderationStatus ===
                                        'approved'
                                          ? 'default'
                                          : 'outline'
                                      }
                                      className='text-xs'
                                    >
                                      {activity.details.moderationStatus ===
                                      'approved'
                                        ? 'Approuvé'
                                        : activity.details.moderationStatus ===
                                          'pending'
                                        ? 'En attente'
                                        : activity.details.moderationStatus ===
                                          'rejected'
                                        ? 'Rejeté'
                                        : activity.details.moderationStatus}
                                    </Badge>
                                    <Badge
                                      variant={
                                        activity.details.isPublished
                                          ? 'default'
                                          : 'outline'
                                      }
                                      className='text-xs'
                                    >
                                      {activity.details.isPublished
                                        ? 'Publié'
                                        : 'Non publié'}
                                    </Badge>
                                  </div>
                                </div>
                              )}

                            {activity.type === 'comment_posted' &&
                              activity.details && (
                                <div className='text-xs text-gray-600 space-y-1'>
                                  <div>
                                    <strong>Contenu:</strong>{' '}
                                    {activity.details.content}
                                  </div>
                                  <div>
                                    <strong>Note:</strong>
                                    <div className='inline-flex items-center ml-1'>
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3 w-3 ${
                                            i < activity.details.rating
                                              ? 'text-yellow-400 fill-current'
                                              : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <strong>Annonce:</strong>{' '}
                                    {activity.details.toolTitle}
                                  </div>
                                </div>
                              )}

                            {activity.type === 'reservation_request' &&
                              activity.details && (
                                <div className='text-xs text-gray-600 space-y-1'>
                                  <div>
                                    <strong>Période:</strong>{' '}
                                    {new Date(
                                      activity.details.startDate
                                    ).toLocaleDateString('fr-FR')}{' '}
                                    -{' '}
                                    {new Date(
                                      activity.details.endDate
                                    ).toLocaleDateString('fr-FR')}
                                  </div>
                                  <div>
                                    <strong>Outil:</strong>{' '}
                                    {activity.details.toolTitle}
                                  </div>
                                  <div>
                                    <strong>Propriétaire:</strong>{' '}
                                    {activity.details.ownerName}
                                  </div>
                                  <div>
                                    <strong>Prix (hors caution):</strong> €
                                    {activity.details.priceWithoutDeposit}
                                  </div>
                                </div>
                              )}

                            {activity.type === 'favorite_added' &&
                              activity.details && (
                                <div className='text-xs text-gray-600 space-y-1'>
                                  <div>
                                    <strong>Annonce:</strong>{' '}
                                    {activity.details.toolTitle}
                                  </div>
                                  <div>
                                    <strong>Catégorie:</strong>{' '}
                                    {activity.details.category}
                                  </div>
                                </div>
                              )}

                            <div className='text-xs text-gray-500 mt-2'>
                              {new Date(activity.createdAt).toLocaleDateString(
                                'fr-FR'
                              )}{' '}
                              à{' '}
                              {new Date(activity.createdAt).toLocaleTimeString(
                                'fr-FR'
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <Activity className='h-12 w-12 mx-auto mb-4 opacity-50' />
                  <p>Aucune activité récente</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className='flex flex-wrap gap-2 pt-4 border-t'>
            {/* Removed verify button */}

            {!currentUser.isSuspended && (
              <div className='flex flex-col md:flex-row gap-3 items-end md:items-center'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Raison de la suspension
                  </label>
                  <Select value={suspensionReason} onValueChange={setSuspensionReason}>
                    <SelectTrigger className='w-full md:w-64'>
                      <SelectValue placeholder='Sélectionnez une raison' />
                    </SelectTrigger>
                    <SelectContent>
                      {suspensionReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className='md:self-end'
                  variant='destructive'
                  size='sm'
                  disabled={!suspensionReason}
                  onClick={async () => {
                    if (!suspensionReason) return
                    try {
                      await handleSuspendUser(currentUser.id, suspensionReason)
                      setSuspensionReason('')
                      await handleOpenModal()
                    } catch (error) {
                      console.error('Error suspending user:', error)
                    }
                  }}
                >
                  <UserX className='h-4 w-4 mr-2' />
                  Suspendre l'utilisateur
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (loading && users.length === 0) {
    return (
      <div className='flex items-center justify-center h-64'>
        <RefreshCw className='h-8 w-8 animate-spin' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Performance Monitor */}
      <PerformanceMonitor />

      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Gestion des utilisateurs
          </h1>
          <p className='text-gray-600 mt-2'>
            Gérez les comptes et profils utilisateurs
          </p>
        </div>

        {/* Stats Cards */}
        {globalUserStats && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      Total utilisateurs
                    </p>
                    <p className='text-2xl font-bold'>
                      {globalUserStats.totalUsers}
                    </p>
                  </div>
                  <div className='h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center'>
                    <UserCheck className='h-4 w-4 text-blue-600' />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      Utilisateurs actifs
                    </p>
                    <p className='text-2xl font-bold'>
                      {globalUserStats.activeUsers}
                    </p>
                  </div>
                  <div className='h-8 w-8 bg-green-100 rounded-full flex items-center justify-center'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      Utilisateurs vérifiés
                    </p>
                    <p className='text-2xl font-bold'>
                      {globalUserStats.verifiedUsers}
                    </p>
                  </div>
                  <div className='h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center'>
                    <Shield className='h-4 w-4 text-purple-600' />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>
                      Nouveaux ce mois
                    </p>
                    <p className='text-2xl font-bold'>
                      {globalUserStats.newUsersThisMonth}
                    </p>
                  </div>
                  <div className='h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center'>
                    <TrendingUp className='h-4 w-4 text-orange-600' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      {/* Filters */}
      <Card>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Rechercher par nom ou email...'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                }}
                className='pl-10'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue placeholder='Statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les comptes</SelectItem>
                <SelectItem value='active'>Actif</SelectItem>
                <SelectItem value='suspended'>Suspendu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Pays' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les pays</SelectItem>
                <SelectItem value='Koweït'>Koweït</SelectItem>
                <SelectItem value='Arabie Saoudite'>Arabie Saoudite</SelectItem>
                <SelectItem value='Bahreïn'>Bahreïn</SelectItem>
                <SelectItem value='Oman'>Oman</SelectItem>
                <SelectItem value='Qatar'>Qatar</SelectItem>
                <SelectItem value='Émirats Arabes Unis'>Émirats Arabes Unis</SelectItem>
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
          <div className='flex items-center justify-between'>
            <CardTitle>Utilisateurs ({loading ? '...' : totalUsers})</CardTitle>
            <div className='flex items-center gap-2'>
              <Button
                onClick={handleExportCSV}
                variant='outline'
                size='sm'
                disabled={loading}
              >
                <Download className='h-4 w-4 mr-2' />
                Exporter CSV
              </Button>
              <Button
                onClick={handleRefresh}
                variant='outline'
                size='sm'
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>Utilisateur</TableHead>
                   <TableHead className='hidden md:table-cell'>
                     Téléphone
                   </TableHead>
                   <TableHead className='hidden lg:table-cell'>
                     Pays
                   </TableHead>
                   <TableHead>Statut</TableHead>
                   <TableHead className='hidden lg:table-cell'>
                     Inscription
                   </TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {/** debug log removed */}
                {users
                  .filter((user) => user.email !== 'admin@bricola.fr' && user.displayName !== 'Admin Bricola')
                  .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center'>
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={`${user.firstName} ${user.lastName}`}
                              className='w-full h-full object-cover'
                            />
                          ) : (
                            <span className='text-sm font-medium text-gray-600'>
                              {user.firstName?.[0]}
                              {user.lastName?.[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className='font-medium'>
                            {user.firstName} {user.lastName}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {user.email}
                          </div>
                          {user.isAdmin && (
                            <Badge variant='default' className='mt-1'>
                              <Shield className='h-3 w-3 mr-1' />
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='hidden md:table-cell'>
                      {(user as any).phoneNumber ?? (user as any).phone ?? '-'}
                    </TableCell>
                    <TableCell className='hidden lg:table-cell'>
                      {getCountryName((user as any).countryId) ?? ((user as any).country && (user as any).country.name) ?? (user as any).countryName ?? '-'}
                    </TableCell>
                     <TableCell>{getStatusBadge(user)}</TableCell>
                     <TableCell className='hidden lg:table-cell'>
                       {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                     </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <UserDetailsModal user={user} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users.length === 0 && !loading && (
            <div className='text-center py-8 text-gray-500'>
              Aucun utilisateur trouvé
            </div>
          )}

          {/* Pagination */}
          {totalUsers > 0 && (
            <div className='flex items-center justify-between mt-6'>
              <EnhancedPagination
                pagination={{
                  currentPage: currentPage,
                  pageSize: pagination.pageSize ?? 50,
                  totalItems: totalUsers,
                  totalPages: totalPages,
                  hasNextPage: currentPage < totalPages,
                  hasPreviousPage: currentPage > 1,
                }}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onRefresh={handleRefresh}
                showPageSize={true}
                showRefresh={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Users
