import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { DateRangePicker } from '@/components/ui/date-range-picker'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Label } from '@/components/ui/label'
import {
  Search,
  Filter,
  Eye,
  Check,
  X,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Euro,
  User,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  PlayCircle,
  MessageSquare,
  Phone,
  RefreshCw,
  Download,
  DollarSign,
  TrendingUp,
  Mail,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

import { DateRange } from 'react-day-picker'
import { Stepper } from '@/components/ui/stepper'
import { bookingsService, BookingActionData } from '@/services/bookingsService'
import {
  Booking,
  BookingFilterParams,
  BookingStats,
  PaginatedResponse,
  BookingStatus,
} from '@/types/unified-bridge'

// Composant BookingDetailsModal
const BookingDetailsModal = ({
  booking,
  getStatusBadge,
  generateBookingSteps,
}: {
  booking: any
  getStatusBadge: (status: string) => JSX.Element
  generateBookingSteps: (booking: any) => any[]
}) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant='ghost' size='sm'>
        <Eye className='h-4 w-4' />
      </Button>
    </DialogTrigger>
    <DialogContent className='max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto'>
      <DialogHeader>
        <DialogTitle className='text-lg sm:text-xl'>
          Réservation {booking.id}
        </DialogTitle>
        <DialogDescription>
          Détails complets de la réservation et informations des parties
        </DialogDescription>
      </DialogHeader>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6'>
        {/* Informations principales */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Outil loué */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Package className='h-5 w-5' />
                Outil loué
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex gap-4'>
                {/* Affichage de la photo principale ou première photo */}
                <img
                  src={
                    booking.tool?.photos?.[0]?.url ||
                    booking.tool?.image ||
                    '/placeholder.jpg'
                  }
                  alt={booking.tool?.title || 'Outil'}
                  className='w-24 h-24 object-cover rounded-lg'
                />
                <div className='flex-1'>
                  <h3 className='font-semibold text-lg'>
                    {booking.tool?.title || 'Titre non disponible'}
                  </h3>
                  <div className='flex items-center gap-2 text-gray-600 mt-2'>
                    <User className='h-4 w-4' />
                    <span>
                      Propriétaire:{' '}
                      {booking.tool?.owner?.firstName ||
                        booking.owner?.firstName ||
                        'Non spécifié'}{' '}
                      {booking.tool?.owner?.lastName ||
                        booking.owner?.lastName ||
                        ''}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-gray-600 mt-1'>
                    <Phone className='h-4 w-4' />
                    <span>
                      {booking.tool?.owner?.phoneNumber ||
                        booking.owner?.phoneNumber ||
                        'Non spécifié'}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-gray-600 mt-1'>
                    <MapPin className='h-4 w-4' />
                    <span>
                      {booking.tool?.pickupAddress ||
                        booking.location ||
                        'Non spécifié'}
                    </span>
                  </div>
                  {/* Affichage des photos supplémentaires */}
                  {booking.tool?.photos && booking.tool.photos.length > 1 && (
                    <div className='flex gap-2 mt-3'>
                      {booking.tool.photos
                        .slice(1, 4)
                        .map((photo: any, index: number) => (
                          <img
                            key={index}
                            src={photo.url}
                            alt={`Photo ${index + 2}`}
                            className='w-12 h-12 object-cover rounded border'
                          />
                        ))}
                      {booking.tool.photos.length > 4 && (
                        <div className='w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-600'>
                          +{booking.tool.photos.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails de la réservation */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Calendar className='h-5 w-5' />
                Détails de la réservation
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium text-gray-600'>
                    Date de début
                  </Label>
                  <p className='font-semibold'>
                    {booking.startDate || 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-600'>
                    Date de fin
                  </Label>
                  <p className='font-semibold'>
                    {booking.endDate || 'Non spécifié'}
                  </p>
                </div>
              </div>
              <div>
                <Label className='text-sm font-medium text-gray-600'>
                  Durée totale
                </Label>
                <p className='font-semibold'>
                  {Math.ceil(
                    (new Date(booking.endDate).getTime() -
                      new Date(booking.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) || 0}
                  j
                </p>
              </div>
              <div>
                <Label className='text-sm font-medium text-gray-600'>
                  Statut actuel
                </Label>
                <div className='mt-1'>{getStatusBadge(booking.status)}</div>
              </div>
              {booking.notes && (
                <div>
                  <Label className='text-sm font-medium text-gray-600'>
                    Notes
                  </Label>
                  <p className='text-gray-700 mt-1'>{booking.notes}</p>
                </div>
              )}
              {booking.cancellationReason && (
                <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                  <Label className='text-sm font-medium text-red-800'>
                    Motif d'annulation
                  </Label>
                  <p className='text-red-700 mt-1'>
                    {booking.cancellationReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations financières */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Euro className='h-5 w-5' />
                Informations financières
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Tarif journalier:</span>
                <span className='font-semibold'>{booking.tool.basePrice}£</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Durée:</span>
                <span>
                  {Math.ceil(
                    (new Date(booking.endDate).getTime() -
                      new Date(booking.startDate).getTime()) /
                      (1000 * 60 * 60 * 24) +
                      1
                  ) || 0}
                  j
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Sous-total:</span>
                <span className='font-semibold'>
                  {(
                    Math.ceil(
                      (new Date(booking.endDate).getTime() -
                        new Date(booking.startDate).getTime()) /
                        (1000 * 60 * 60 * 24) +
                        1
                    ) * Number(booking.tool?.basePrice || 0)
                  ).toFixed(2)}
                  £
                </span>
              </div>
              <div className='border-t pt-2'>
                <div className='flex justify-between'>
                  <span className='font-semibold'>Total facturé:</span>
                  <span className='font-bold text-lg'>
                    {booking.totalPrice}£
                  </span>
                </div>
              </div>
              <div className='text-sm text-gray-600'>
                Méthode de paiement: {booking.paymentMethod || 'Non spécifié'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Informations des parties */}
        <div className='space-y-6'>
          {/* Locataire */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <User className='h-5 w-5' />
                Locataire
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label className='text-sm font-medium text-gray-600'>Nom</Label>
                <p className='font-semibold'>
                  {booking.renter?.firstName || 'Non spécifié'}{' '}
                  {booking.renter?.lastName || ''}
                </p>
              </div>
              <div>
                <Label className='text-sm font-medium text-gray-600'>
                  Email
                </Label>
                <p className='text-sm text-blue-600'>
                  {booking.renter?.email || 'Non spécifié'}
                </p>
              </div>
              <div>
                <Label className='text-sm font-medium text-gray-600'>
                  Téléphone
                </Label>
                <p className='text-sm'>
                  {booking.renter?.phoneNumber || 'Non spécifié'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Propriétaire */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <User className='h-5 w-5' />
                Propriétaire
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <Label className='text-sm font-medium text-gray-600'>Nom</Label>
                <p className='font-semibold'>
                  {booking.owner?.firstName ||
                    booking.tool?.owner?.firstName ||
                    'Non spécifié'}{' '}
                  {booking.owner?.lastName ||
                    booking.tool?.owner?.lastName ||
                    ''}
                </p>
              </div>
              <div>
                <Label className='text-sm font-medium text-gray-600'>
                  Email
                </Label>
                <p className='text-sm text-blue-600'>
                  {booking.owner?.email ||
                    booking.tool?.owner?.email ||
                    'Non spécifié'}
                </p>
              </div>
              <div>
                <Label className='text-sm font-medium text-gray-600'>
                  Téléphone
                </Label>
                <p className='text-sm'>
                  {booking.owner?.phoneNumber ||
                    booking.tool?.owner?.phoneNumber ||
                    'Non spécifié'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Suivi chronologique */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                Suivi chronologique
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Stepper steps={generateBookingSteps(booking)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

// Composant CancelDialog
const CancelDialog = ({
  booking,
  onCancel,
}: {
  booking: any
  onCancel: (id: string, reason: string) => void
}) => {
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)

  const handleCancel = () => {
    if (reason.trim()) {
      onCancel(booking.id, reason)
      setReason('')
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='text-red-600 hover:text-red-700'
        >
          <X className='h-4 w-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler la réservation</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir annuler cette réservation ? Cette action
            est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='space-y-4'>
          <div>
            <Label htmlFor='reason'>Motif d'annulation *</Label>
            <Textarea
              id='reason'
              placeholder="Veuillez préciser le motif de l'annulation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className='mt-1'
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={!reason.trim()}
            className='bg-red-600 hover:bg-red-700'
          >
            Confirmer l'annulation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBookings, setTotalBookings] = useState(0)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [bulkSelectedBookings, setBulkSelectedBookings] = useState<string[]>([])
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  // Load bookings data with pagination
  const loadBookings = async (page: number = currentPage) => {
    try {
      setLoading(true)

      // Debug: Check token
      const token = localStorage.getItem('admin_token')

      const filters: BookingFilterParams = {
        page,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status:
          statusFilter !== 'all' ? (statusFilter as BookingStatus) : undefined,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
      }

      const response = await bookingsService.getAdminBookings(filters)
      console.log(
        '*******************************************************************'
      )
      console.log(
        '*******************************************************************'
      )
      console.log(
        '*******************************************************************'
      )
      console.log(
        '*******************************************************************',
        response
      )

      if (response.success && response.data) {
        // L'API retourne un objet avec structure {data: PaginatedResponse, message: string}
        const paginatedData = response.data.data
        setBookings(paginatedData.data || [])
        setTotalPages(paginatedData.totalPages || 1)
        setTotalBookings(paginatedData.total || 0)
        setCurrentPage(page)
      } else {
        // If response is not successful, set empty array
        setBookings([])
        setTotalPages(1)
        setTotalBookings(0)
      }
    } catch (error: any) {
      console.error('Error loading bookings:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      })
      toast({
        title: 'Erreur',
        description: `Impossible de charger les réservations: ${
          error.response?.data?.message || error.message
        }`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load booking stats
  const loadBookingStats = async () => {
    try {
      console.log('🔍 Loading booking stats...')
      const response = await bookingsService.getBookingStats()
      console.log('📊 Booking stats response:', response)

      if (response.success && response.data) {
        // L'API retourne un objet avec structure {data: BookingStats, message: string}
        console.log('✅ Setting booking stats:', response.data)
        setBookingStats(response.data.data)
      } else {
        console.log('❌ Response not successful or no data:', response)
        // Set null when response is not successful
        setBookingStats(null)
      }
    } catch (error) {
      console.error('❌ Error loading booking stats:', error)
      // Set null on error
      setBookingStats(null)
    }
  }

  // Load booking details for modal
  const loadBookingDetails = async (bookingId: string) => {
    try {
      const response = await bookingsService.getBookingById(bookingId)
      if (response.success && response.data) {
        // L'API retourne un objet avec structure {data: Booking, message: string}
        setSelectedBooking(response.data.data)
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les détails de la réservation',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error loading booking details:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des détails',
        variant: 'destructive',
      })
    }
  }

  // Booking actions
  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const data: BookingActionData = {
        adminNotes: adminNotes || undefined,
      }
      const response = await bookingsService.acceptBooking(bookingId, data)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Réservation acceptée avec succès',
        })
        loadBookings()
        loadBookingStats()
      } else {
        toast({
          title: 'Erreur',
          description: "Impossible d'accepter la réservation",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'acceptation",
        variant: 'destructive',
      })
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!cancellationReason.trim()) {
      toast({
        title: 'Erreur',
        description: "Veuillez fournir une raison pour l'annulation",
        variant: 'destructive',
      })
      return
    }

    try {
      const data: BookingActionData = {
        reason: cancellationReason,
        adminNotes: adminNotes || undefined,
      }
      const response = await bookingsService.cancelBooking(bookingId, data)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Réservation annulée avec succès',
        })
        loadBookings()
        loadBookingStats()
        setCancellationReason('')
        setAdminNotes('')
      } else {
        toast({
          title: 'Erreur',
          description: "Impossible d'annuler la réservation",
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'annulation",
        variant: 'destructive',
      })
    }
  }

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const data: BookingActionData = {
        adminNotes: adminNotes || undefined,
      }
      const response = await bookingsService.completeBooking(bookingId, data)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Réservation marquée comme terminée',
        })
        loadBookings()
        loadBookingStats()
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de terminer la réservation',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error completing booking:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la finalisation',
        variant: 'destructive',
      })
    }
  }

  // Bulk actions
  const handleBulkAction = async (action: 'accept' | 'cancel' | 'complete') => {
    if (bulkSelectedBookings.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner au moins une réservation',
        variant: 'destructive',
      })
      return
    }

    if (action === 'cancel' && !cancellationReason.trim()) {
      toast({
        title: 'Erreur',
        description: "Veuillez fournir une raison pour l'annulation",
        variant: 'destructive',
      })
      return
    }

    try {
      const data: BookingActionData = {
        reason: action === 'cancel' ? cancellationReason : undefined,
        adminNotes: adminNotes || undefined,
      }
      const response = await bookingsService.bulkUpdateBookings(
        bulkSelectedBookings,
        action,
        data
      )
      if (response.success && response.data) {
        toast({
          title: 'Succès',
          description: `${response.data.success} réservation(s) mise(s) à jour avec succès`,
        })
        if (response.data.failed > 0) {
          toast({
            title: 'Attention',
            description: `${response.data.failed} réservation(s) n'ont pas pu être mises à jour`,
            variant: 'destructive',
          })
        }
        loadBookings()
        loadBookingStats()
        setBulkSelectedBookings([])
        setCancellationReason('')
        setAdminNotes('')
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'action groupée",
        variant: 'destructive',
      })
    }
  }

  // Export bookings
  const handleExportBookings = async () => {
    try {
      const filters: BookingFilterParams = {
        search: searchTerm || undefined,
        status:
          statusFilter !== 'all' ? (statusFilter as BookingStatus) : undefined,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString(),
      }
      const response = await bookingsService.exportBookings(filters)
      if (response.success && response.data) {
        // Open download URL
        window.open(response.data.downloadUrl, '_blank')
        toast({
          title: 'Succès',
          description: 'Export des réservations lancé',
        })
      }
    } catch (error) {
      console.error('Error exporting bookings:', error)
      toast({
        title: 'Erreur',
        description: "Erreur lors de l'export",
        variant: 'destructive',
      })
    }
  }

  // Load bookings on component mount and when filters change
  useEffect(() => {
    loadBookings(1) // Reset to first page when filters change
    loadBookingStats()
  }, [searchTerm, statusFilter, dateRange, itemsPerPage])

  // Load bookings when page changes
  useEffect(() => {
    if (currentPage > 1) {
      loadBookings(currentPage)
    }
  }, [currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, dateRange, itemsPerPage])

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.ACCEPTED:
        return (
          <Badge className='bg-success text-success-foreground'>
            Confirmée
          </Badge>
        )
      case BookingStatus.PENDING:
        return (
          <Badge className='bg-warning text-warning-foreground'>
            En attente
          </Badge>
        )
      case BookingStatus.ONGOING:
        return <Badge className='bg-blue-500 text-white'>En cours</Badge>
      case BookingStatus.COMPLETED:
        return <Badge className='bg-green-600 text-white'>Terminée</Badge>
      case BookingStatus.CANCELLED:
        return <Badge variant='destructive'>Annulée</Badge>
      case BookingStatus.REJECTED:
        return <Badge className='bg-red-600 text-white'>Rejetée</Badge>
      default:
        return <Badge variant='outline'>Inconnu</Badge>
    }
  }

  const handleConfirm = (bookingId: string) => {
    toast({
      title: 'Réservation confirmée',
      description:
        'La réservation a été confirmée. Les deux parties ont été notifiées.',
    })
  }

  const handleCancel = (bookingId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: 'Erreur',
        description: "Veuillez spécifier un motif d'annulation.",
        variant: 'destructive',
      })
      return
    }
    toast({
      title: 'Réservation annulée',
      description:
        'La réservation a été annulée et les utilisateurs ont été notifiés.',
    })
    setCancellationReason('')
  }

  const handleComplete = (bookingId: string) => {
    toast({
      title: 'Réservation terminée',
      description: 'La réservation a été marquée comme terminée.',
    })
  }

  const handleUnlock = (bookingId: string) => {
    toast({
      title: 'Réservation débloquée',
      description: 'La caution a été débloquée et restituée au locataire.',
    })
  }

  const generateBookingSteps = (booking: any) => {
    const steps = []

    // En attente
    steps.push({
      id: 'pending',
      label: 'En attente',
      status: 'completed' as const,
      date: booking.createdAt,
      description: 'Demande de réservation créée',
    })

    // Acceptée
    if (
      booking.status === BookingStatus.ACCEPTED ||
      booking.status === BookingStatus.ONGOING ||
      booking.status === BookingStatus.COMPLETED
    ) {
      steps.push({
        id: 'accepted',
        label: 'Acceptée',
        status:
          booking.status === BookingStatus.ACCEPTED
            ? ('current' as const)
            : ('completed' as const),
        date: booking.acceptedAt || booking.updatedAt || booking.createdAt,
        description: 'Demande acceptée par le propriétaire',
      })
    }

    // En cours
    if (
      booking.status === BookingStatus.ONGOING ||
      booking.status === BookingStatus.COMPLETED
    ) {
      steps.push({
        id: 'ongoing',
        label: 'En cours',
        status:
          booking.status === BookingStatus.ONGOING
            ? ('current' as const)
            : ('completed' as const),
        date: booking.startDate || booking.dates?.start,
        description: 'Location en cours',
      })
    }

    // Terminée
    if (booking.status === BookingStatus.COMPLETED) {
      steps.push({
        id: 'completed',
        label: 'Terminée',
        status: 'completed' as const,
        date: booking.endDate || booking.dates?.end,
        description: 'Location terminée avec succès',
      })
    }

    // Annulée
    if (booking.status === BookingStatus.CANCELLED) {
      steps.push({
        id: 'cancelled',
        label: 'Annulée',
        status: 'cancelled' as const,
        date: booking.cancelledAt || booking.updatedAt,
        description: booking.cancellationReason || 'Réservation annulée',
      })
    }

    return steps
  }

  // Debug logs pour les statistiques
  console.log('📈 bookingStats:', bookingStats)
  console.log('📊 totalBookings:', totalBookings)

  // Statistiques du serveur avec fallback local si nécessaire
  const safeBookings = bookings || []
  const displayStats = bookingStats || {
    totalBookings: totalBookings || 0,
    acceptedBookings: 0,
    ongoingBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    rejectedBookings: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    popularTools: [],
    statusBreakdown: [],
  }

  console.log('🎯 displayStats:', displayStats)

  // Les données sont déjà filtrées et paginées par le serveur
  const paginatedBookings = safeBookings // Use the bookings from server (already paginated)
  const displayTotalPages = totalPages
  const startIndex = (currentPage - 1) * itemsPerPage

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Gestion des réservations
          </h1>
          <p className='text-gray-600 mt-2'>
            Suivez et gérez toutes les réservations d'outils
          </p>
        </div>
        <div className='flex gap-2'>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder='Filtrer par période de réservation'
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardContent className='p-4'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <Label htmlFor='search'>Recherche</Label>
                <Input
                  id='search'
                  placeholder='ID, outil, utilisateur...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor='status-filter'>Statut</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder='Tous les statuts' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tous les statuts</SelectItem>
                    <SelectItem value='pending'>En attente</SelectItem>
                    <SelectItem value='accepted'>Confirmées</SelectItem>
                    <SelectItem value='completed'>Terminées</SelectItem>
                    <SelectItem value='cancelled'>Annulées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='items-per-page'>Éléments par page</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='10'>10</SelectItem>
                    <SelectItem value='25'>25</SelectItem>
                    <SelectItem value='50'>50</SelectItem>
                    <SelectItem value='100'>100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-end'>
                <Button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                    setDateRange(undefined)
                  }}
                  variant='outline'
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {bulkSelectedBookings.length > 0 && (
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>
                  {bulkSelectedBookings.length} réservation(s) sélectionnée(s)
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setBulkSelectedBookings([])}
                >
                  Désélectionner tout
                </Button>
              </div>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  onClick={() => handleBulkAction('accept')}
                  className='bg-green-600 hover:bg-green-700'
                >
                  Confirmer
                </Button>
                <Button
                  size='sm'
                  onClick={() => handleBulkAction('complete')}
                  className='bg-blue-600 hover:bg-blue-700'
                >
                  Terminer
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={() => handleBulkAction('cancel')}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {displayStats.totalBookings}
                </p>
              </div>
              <Package className='h-8 w-8 text-gray-600' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>En attente</p>
                <p className='text-2xl font-bold text-warning'>
                  {displayStats.pendingBookings}
                </p>
              </div>
              <Timer className='h-8 w-8 text-warning' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Acceptées</p>
                <p className='text-2xl font-bold text-success'>
                  {displayStats.acceptedBookings}
                </p>
              </div>
              <CheckCircle className='h-8 w-8 text-success' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>En cours</p>
                <p className='text-2xl font-bold text-blue-600'>
                  {displayStats.ongoingBookings || 0}
                </p>
              </div>
              <PlayCircle className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Terminées</p>
                <p className='text-2xl font-bold text-green-600'>
                  {displayStats.completedBookings}
                </p>
              </div>
              <Check className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Annulées</p>
                <p className='text-2xl font-bold text-destructive'>
                  {displayStats.cancelledBookings}
                </p>
              </div>
              <XCircle className='h-8 w-8 text-destructive' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Rejetées</p>
                <p className='text-2xl font-bold text-red-600'>
                  {displayStats.rejectedBookings}
                </p>
              </div>
              <XCircle className='h-8 w-8 text-red-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Rechercher par ID, outil ou locataire...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue placeholder='Statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les statuts</SelectItem>
                <SelectItem value={BookingStatus.PENDING}>
                  En attente
                </SelectItem>
                <SelectItem value={BookingStatus.ACCEPTED}>
                  Acceptées
                </SelectItem>
                <SelectItem value={BookingStatus.ONGOING}>En cours</SelectItem>
                <SelectItem value={BookingStatus.COMPLETED}>
                  Terminée
                </SelectItem>
                <SelectItem value={BookingStatus.CANCELLED}>Annulée</SelectItem>
                <SelectItem value={BookingStatus.REJECTED}>Rejetée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Réservations ({totalBookings})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <RefreshCw className='h-6 w-6 animate-spin mr-2' />
              <span>Chargement des réservations...</span>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              {bulkSelectedBookings.length > 0 && (
                <div className='flex items-center gap-2 p-4 bg-muted rounded-lg mb-4'>
                  <span className='text-sm font-medium'>
                    {bulkSelectedBookings.length} réservation(s) sélectionnée(s)
                  </span>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleBulkAction('accept')}
                  >
                    Confirmer
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size='sm' variant='outline'>
                        Annuler
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Annuler les réservations sélectionnées
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Veuillez indiquer la raison de l'annulation :
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className='py-4 space-y-4'>
                        <Textarea
                          placeholder="Raison de l'annulation..."
                          value={cancellationReason}
                          onChange={(e) =>
                            setCancellationReason(e.target.value)
                          }
                        />
                        <Textarea
                          placeholder='Notes administratives (optionnel)...'
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleBulkAction('cancel')}
                        >
                          Confirmer l'annulation
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleBulkAction('complete')}
                  >
                    Terminer
                  </Button>
                </div>
              )}

              {paginatedBookings.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center'>
                  <div className='text-gray-400 mb-4'>
                    <svg
                      className='w-16 h-16 mx-auto'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1}
                        d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                      />
                    </svg>
                  </div>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    Aucune réservation trouvée
                  </h3>
                  <p className='text-gray-500 mb-4'>
                    Il n'y a actuellement aucune réservation correspondant à vos
                    critères.
                  </p>
                  <Button onClick={loadBookings} variant='outline'>
                    <RefreshCw className='h-4 w-4 mr-2' />
                    Actualiser
                  </Button>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-12'>
                          <input
                            type='checkbox'
                            checked={
                              bulkSelectedBookings.length ===
                                paginatedBookings.length &&
                              paginatedBookings.length > 0
                            }
                            className='rounded border-gray-300'
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkSelectedBookings(
                                  paginatedBookings.map((b) => b.id)
                                )
                              } else {
                                setBulkSelectedBookings([])
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Réservation</TableHead>
                        <TableHead className='hidden md:table-cell'>
                          Locataire
                        </TableHead>
                        <TableHead className='hidden lg:table-cell'>
                          Dates
                        </TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <input
                              type='checkbox'
                              checked={bulkSelectedBookings.includes(
                                booking.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkSelectedBookings([
                                    ...bulkSelectedBookings,
                                    booking.id,
                                  ])
                                } else {
                                  setBulkSelectedBookings(
                                    bulkSelectedBookings.filter(
                                      (id) => id !== booking.id
                                    )
                                  )
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className='flex items-start gap-3'>
                              <img
                                src={
                                  booking.tool?.photos?.[0]?.url ||
                                  '/placeholder.svg'
                                }
                                alt={booking.tool.title}
                                className='w-16 h-12 object-cover rounded hidden sm:block'
                              />
                              <div>
                                <div className='font-medium text-primary'>
                                  {booking.id}
                                </div>
                                <div className='text-sm text-gray-600 line-clamp-1'>
                                  {booking.tool.title}
                                </div>
                                <div className='text-sm text-gray-500 flex items-center gap-1 mt-1'>
                                  <MapPin className='h-3 w-3' />
                                  {booking.tool?.pickupAddress ||
                                    'Non spécifié'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='hidden md:table-cell'>
                            <div>
                              <div className='font-medium'>
                                {booking.renter.firstName +
                                  ' ' +
                                  booking.renter.lastName}
                              </div>
                              <div className='text-sm text-gray-500'>
                                {booking.renter.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className='hidden lg:table-cell'>
                            <div className='text-sm'>
                              <div>{booking.startDate}</div>
                              <div className='text-gray-500'>
                                au {booking.endDate}
                              </div>
                              <div className='text-xs text-gray-400'>
                                (
                                {Math.ceil(
                                  (new Date(booking.endDate).getTime() -
                                    new Date(booking.startDate).getTime()) /
                                    (1000 * 60 * 60 * 24)
                                ) || 0}
                                j)
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='text-sm'>
                              <div className='font-medium'>
                                {booking.totalPrice}£
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <BookingDetailsModal
                                booking={booking}
                                getStatusBadge={getStatusBadge}
                                generateBookingSteps={generateBookingSteps}
                              />
                              {booking.status === BookingStatus.PENDING && (
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => handleConfirm(booking.id)}
                                >
                                  <Check className='h-4 w-4 text-success' />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          <div className='flex items-center justify-between mt-6'>
            <div className='text-sm text-gray-500'>
              Affichage de {startIndex + 1} à{' '}
              {Math.min(startIndex + itemsPerPage, totalBookings)} sur{' '}
              {totalBookings} réservations
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <span className='text-sm'>
                Page {currentPage} sur {displayTotalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, displayTotalPages)
                  )
                }
                disabled={currentPage === displayTotalPages}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Bookings
