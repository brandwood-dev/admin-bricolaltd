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
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  User,
  Package,
  Euro,
  Calculator,
  Send,
  FileText,
  Star,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  X,
  RefreshCw,
  Download,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DateRange } from 'react-day-picker'
import { disputesService, DisputeStats } from '@/services/disputesService'
import {
  Dispute,
  DisputeFilterParams,
  PaginatedResponse,
  DisputeStatus,
} from '@/types/unified-bridge'

const Disputes = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [disputeStats, setDisputeStats] = useState<DisputeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [selectedDisputes, setSelectedDisputes] = useState<string[]>([])
  const [damageAssessment, setDamageAssessment] = useState({
    cosmetic: 0,
    functional: 0,
    missing: 0,
    totalDamage: 0,
  })
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [resolutionAmount, setResolutionAmount] = useState(0)
  const itemsPerPage = 10
  const { toast } = useToast()

  // Load disputes data
  const loadDisputes = async () => {
    try {
      setLoading(true)
      const filters: DisputeFilterParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status:
          statusFilter !== 'all' ? (statusFilter as DisputeStatus) : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        priority:
          priorityFilter !== 'all'
            ? (priorityFilter as 'low' | 'medium' | 'high')
            : undefined,
        dateRange: dateRange
          ? {
              startDate: dateRange.from?.toISOString().split('T')[0] || '',
              endDate: dateRange.to?.toISOString().split('T')[0] || '',
            }
          : undefined,
      }

      const response = await disputesService.getDisputes(filters)
      if (response.success && response.data) {
        setDisputes(response.data.items)
        setTotalPages(response.data.meta.totalPages)
        setTotalItems(response.data.meta.totalItems)
      }
    } catch (error) {
      console.error('Error loading disputes:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les litiges',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load dispute statistics
  const loadDisputeStats = async () => {
    try {
      const response = await disputesService.getDisputeStats(
        dateRange
          ? {
              startDate: dateRange.from?.toISOString().split('T')[0] || '',
              endDate: dateRange.to?.toISOString().split('T')[0] || '',
            }
          : undefined
      )
      if (response.success && response.data) {
        setDisputeStats(response.data)
      }
    } catch (error) {
      console.error('Error loading dispute stats:', error)
    }
  }

  // Load dispute details
  const loadDisputeDetails = async (disputeId: string) => {
    try {
      const response = await disputesService.getDisputeById(disputeId)
      if (response.success && response.data) {
        setSelectedDispute(response.data)
      }
    } catch (error) {
      console.error('Error loading dispute details:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails du litige',
        variant: 'destructive',
      })
    }
  }

  // Handle dispute status updates
  const handleStatusUpdate = async (
    disputeId: string,
    status: DisputeStatus
  ) => {
    try {
      let response
      switch (status) {
        case 'PENDING':
          response = await disputesService.markAsInProgress(disputeId)
          break
        case 'RESOLVED':
          response = await disputesService.markAsResolved(disputeId)
          break
        case 'CLOSED':
          response = await disputesService.markAsClosed(disputeId)
          break
        default:
          response = await disputesService.updateDispute(disputeId, { status })
      }

      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Statut du litige mis à jour',
        })
        loadDisputes()
      }
    } catch (error) {
      console.error('Error updating dispute status:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      })
    }
  }

  // Handle dispute resolution
  const handleResolveDispute = async (disputeId: string, notes: string) => {
    try {
      const response = await disputesService.resolveDispute({
        disputeId,
        resolution: 'refund_partial',
        amount: resolutionAmount,
        reason: notes,
        adminNotes: notes,
        notifyParties: true,
      })

      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Litige résolu avec succès',
        })
        setSelectedDispute(null)
        setResolutionNotes('')
        setResolutionAmount(0)
        loadDisputes()
      }
    } catch (error) {
      console.error('Error resolving dispute:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de résoudre le litige',
        variant: 'destructive',
      })
    }
  }

  // Handle status change action
  const handleStatusChangeAction = async (
    disputeId: string,
    newStatus: DisputeStatus
  ) => {
    await handleStatusUpdate(disputeId, newStatus)
  }

  // Effects
  useEffect(() => {
    loadDisputes()
    loadDisputeStats()
  }, [
    currentPage,
    searchTerm,
    statusFilter,
    categoryFilter,
    priorityFilter,
    dateRange,
  ])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant='destructive'>En attente</Badge>
      case 'RESOLVED':
        return (
          <Badge className='bg-success text-success-foreground'>Résolu</Badge>
        )
      case 'CLOSED':
        return <Badge variant='secondary'>Fermé</Badge>
      case 'REJECTED':
        return <Badge variant='outline'>Rejeté</Badge>
      default:
        return <Badge variant='outline'>Inconnu</Badge>
    }
  }

  const calculateDamageDistribution = (deposit: number, assessment: any) => {
    const totalDamagePercentage =
      assessment.cosmetic + assessment.functional + assessment.missing
    const damageAmount = Math.round((deposit * totalDamagePercentage) / 100)
    const refundAmount = deposit - damageAmount

    return {
      damageAmount,
      refundAmount,
      ownerCompensation: damageAmount,
      adminFee: 0,
    }
  }

  const DisputeDetailsModal = ({ dispute }: { dispute: any }) => {
    const [localAssessment, setLocalAssessment] = useState({
      cosmetic: 0,
      functional: 0,
      missing: 0,
    })

    const [resolution, setResolution] = useState(dispute.resolutionNotes || '')
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
      null
    )

    // Update resolution when dispute changes
    useEffect(() => {
      setResolution(dispute.resolutionNotes || '')
    }, [dispute.resolutionNotes])

    const distribution = calculateDamageDistribution(
      dispute.tool?.depositAmount || 0,
      localAssessment
    )

    const openLightbox = (index: number) => {
      setSelectedImageIndex(index)
    }

    const closeLightbox = () => {
      setSelectedImageIndex(null)
    }

    const nextImage = () => {
      if (
        selectedImageIndex !== null &&
        dispute.evidence &&
        selectedImageIndex < dispute.evidence.length - 1
      ) {
        setSelectedImageIndex(selectedImageIndex + 1)
      }
    }

    const prevImage = () => {
      if (selectedImageIndex !== null && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1)
      }
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant='ghost' size='sm'>
            <Eye className='h-4 w-4' />
          </Button>
        </DialogTrigger>
        <DialogContent className='max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg sm:text-xl'>
              Litige {dispute.id}
            </DialogTitle>
            <DialogDescription>
              Gestion complète du litige et évaluation des dommages
            </DialogDescription>
          </DialogHeader>

          <div className='grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6'>
            {/* Informations principales */}
            <div className='lg:col-span-2 space-y-6'>
              {/* Détails du litige */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <AlertTriangle className='h-5 w-5' />
                    Détails du litige
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Statut
                      </Label>
                      <div className='mt-1'>
                        {getStatusBadge(dispute.status)}
                      </div>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Caution
                      </Label>
                      <p className='font-semibold'>
                        {dispute.tool?.depositAmount ?? 0}€
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Statut réservation
                      </Label>
                      <p className='font-semibold'>
                        {dispute.booking?.status || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Motif du litige
                      </Label>
                      <p className='text-gray-700 mt-1'>
                        {dispute.reason || 'Non spécifié'}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Signalé par
                      </Label>
                      <p className='text-gray-700 mt-1'>
                        {dispute.initiator?.firstName &&
                        dispute.initiator?.lastName
                          ? `${dispute.initiator.firstName} ${dispute.initiator.lastName}`
                          : dispute.initiator?.displayName || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-gray-600'>
                      Description
                    </Label>
                    <p className='text-gray-700 mt-1'>{dispute.description}</p>
                  </div>

                  {/* Preuves jointes */}
                  {dispute.evidence && dispute.evidence.length > 0 && (
                    <div>
                      <Label className='text-sm font-medium text-gray-600 mb-3 block'>
                        Preuves jointes
                      </Label>
                      <div className='flex gap-2 overflow-x-auto pb-2'>
                        {dispute.evidence?.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Preuve ${index + 1}`}
                            className='w-24 h-24 object-cover rounded-lg border flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity'
                            onClick={() => openLightbox(index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informations des parties */}
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t'>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Initiateur
                      </Label>
                      <div className='mt-2 space-y-1 text-sm'>
                        <p className='font-medium'>
                          {dispute.initiator?.firstName &&
                          dispute.initiator?.lastName
                            ? `${dispute.initiator.firstName} ${dispute.initiator.lastName}`
                            : dispute.initiator?.displayName || 'N/A'}
                        </p>
                        <p className='text-gray-600'>
                          {dispute.initiator?.email}
                        </p>
                        <p className='text-gray-600'>
                          {dispute.initiator?.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Répondant
                      </Label>
                      <div className='mt-2 space-y-1 text-sm'>
                        <p className='font-medium'>
                          {dispute.respondent?.firstName &&
                          dispute.respondent?.lastName
                            ? `${dispute.respondent.firstName} ${dispute.respondent.lastName}`
                            : dispute.respondent?.displayName || 'N/A'}
                        </p>
                        <p className='text-gray-600'>
                          {dispute.respondent?.email}
                        </p>
                        <p className='text-gray-600'>
                          {dispute.respondent?.phoneNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Outil concerné */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Package className='h-5 w-5' />
                    Outil concerné
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex gap-4'>
                    <img
                      src={dispute.tool?.imageUrl || '/placeholder.svg'}
                      alt={dispute.tool?.title || 'Outil'}
                      className='w-24 h-24 object-cover rounded-lg'
                    />
                    <div className='flex-1'>
                      <h3 className='font-semibold text-lg'>
                        {dispute.tool?.title || 'N/A'}
                      </h3>
                      <div className='space-y-2 mt-2'>
                        <div className='flex items-center gap-2 text-gray-600'>
                          <MapPin className='h-4 w-4' />
                          <span>{dispute.tool?.pickupAddress || 'N/A'}</span>
                        </div>
                        <div className='mt-3'>
                          <Label className='text-sm font-medium text-gray-600'>
                            Détails de la réservation
                          </Label>
                          <div className='grid grid-cols-2 gap-2 mt-2 text-sm'>
                            <div>
                              <span className='text-gray-500'>
                                Date de début:
                              </span>
                              <p className='font-medium'>
                                {dispute.booking?.startDate || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className='text-gray-500'>
                                Date de fin:
                              </span>
                              <p className='font-medium'>
                                {dispute.booking?.endDate || 'N/A'}
                              </p>
                            </div>
                            <div className='col-span-2'>
                              <span className='text-gray-500'>
                                Durée totale:
                              </span>
                              <p className='font-medium'>
                                {/* calculer la durée en jours date fin - date debut*/}
                                {dispute.booking?.endDate &&
                                dispute.booking?.startDate
                                  ? `${
                                      (new Date(
                                        dispute.booking.endDate
                                      ).getTime() -
                                        new Date(
                                          dispute.booking.startDate
                                        ).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                    } jours`
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Évaluation et résolution */}
            <div className='space-y-6'>
              {/* Grille d'évaluation des dégâts */}
              {dispute.category === 'damage' && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg flex items-center gap-2'>
                      <Calculator className='h-5 w-5' />
                      Évaluation des dommages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <div className='space-y-4'>
                      <div>
                        <Label className='text-sm font-medium'>
                          Dommages esthétiques (0-30%)
                        </Label>
                        <div className='mt-2'>
                          <Slider
                            value={[localAssessment.cosmetic]}
                            onValueChange={(value) =>
                              setLocalAssessment((prev) => ({
                                ...prev,
                                cosmetic: value[0],
                              }))
                            }
                            max={30}
                            step={1}
                            className='w-full'
                          />
                          <div className='flex justify-between text-sm text-gray-500 mt-1'>
                            <span>0%</span>
                            <span className='font-medium'>
                              {localAssessment.cosmetic}%
                            </span>
                            <span>30%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className='text-sm font-medium'>
                          Problèmes fonctionnels (0-50%)
                        </Label>
                        <div className='mt-2'>
                          <Slider
                            value={[localAssessment.functional]}
                            onValueChange={(value) =>
                              setLocalAssessment((prev) => ({
                                ...prev,
                                functional: value[0],
                              }))
                            }
                            max={50}
                            step={1}
                            className='w-full'
                          />
                          <div className='flex justify-between text-sm text-gray-500 mt-1'>
                            <span>0%</span>
                            <span className='font-medium'>
                              {localAssessment.functional}%
                            </span>
                            <span>50%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className='text-sm font-medium'>
                          Pièces manquantes (0-100%)
                        </Label>
                        <div className='mt-2'>
                          <Slider
                            value={[localAssessment.missing]}
                            onValueChange={(value) =>
                              setLocalAssessment((prev) => ({
                                ...prev,
                                missing: value[0],
                              }))
                            }
                            max={100}
                            step={1}
                            className='w-full'
                          />
                          <div className='flex justify-between text-sm text-gray-500 mt-1'>
                            <span>0%</span>
                            <span className='font-medium'>
                              {localAssessment.missing}%
                            </span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calcul automatique */}
                    <div className='border-t pt-4'>
                      <h4 className='font-semibold mb-3'>
                        Répartition automatique de la caution
                      </h4>
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div className='p-3 bg-red-50 rounded-lg'>
                          <div className='font-medium'>
                            Compensation propriétaire
                          </div>
                          <div className='text-xl font-bold text-red-600'>
                            {distribution.damageAmount}€
                          </div>
                          <div className='text-xs text-gray-600'>
                            {localAssessment.cosmetic +
                              localAssessment.functional +
                              localAssessment.missing}
                            % de {dispute.tool?.depositAmount || 0}€
                          </div>
                        </div>
                        <div className='p-3 bg-green-50 rounded-lg'>
                          <div className='font-medium'>
                            Remboursement locataire
                          </div>
                          <div className='text-xl font-bold text-green-600'>
                            {distribution.refundAmount}€
                          </div>
                          <div className='text-xs text-gray-600'>
                            Caution restante
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions administrateur */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Send className='h-5 w-5' />
                    Actions administrateur
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div>
                    <Label htmlFor='resolution'>Notes de résolution</Label>
                    <Textarea
                      id='resolution'
                      placeholder='Décrivez la résolution du litige...'
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className='mt-2'
                      rows={4}
                    />
                  </div>
                  <div className='flex flex-col gap-2'>
                    <Button
                      variant='outline'
                      onClick={async () => {
                        try {
                          const res = await disputesService.updateDispute(
                            dispute.id,
                            {
                              resolutionNotes: resolution,
                            }
                          )
                          if (res.success) {
                            toast({
                              title: 'Succès',
                              description: 'Note enregistrée',
                            })
                            loadDisputes()
                          }
                        } catch (e) {
                          toast({
                            title: 'Erreur',
                            description: "Impossible d'enregistrer la note",
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      Enregistrer la note
                    </Button>
                    {(dispute.bookingStatus === 'ACCEPTED' ||
                      dispute.booking?.status === 'ACCEPTED') && (
                      <Button
                        variant='outline'
                        onClick={async () => {
                          try {
                            const { transactionsService } = await import(
                              '@/services/transactionsService'
                            )
                            const { refundsService } = await import(
                              '@/services/refundsService'
                            )

                            if (!dispute.booking?.id) {
                              toast({
                                title: 'Erreur',
                                description:
                                  'Réservation introuvable pour ce litige',
                                variant: 'destructive',
                              })
                              return
                            }
                            const txRes =
                              await transactionsService.getByBookingId(
                                dispute.booking.id
                              )
                            const transactions = txRes.data || []
                            const paymentTx = transactions.find(
                              (t: any) =>
                                (t.type === 'PAYMENT' ||
                                  t.type === 'payment') &&
                                t.externalReference
                            )
                            if (!paymentTx) {
                              toast({
                                title: 'Erreur',
                                description:
                                  'Aucune transaction de paiement trouvée pour cette réservation',
                                variant: 'destructive',
                              })
                              return
                            }

                            const amount =
                              resolutionAmount > 0
                                ? resolutionAmount
                                : Math.max(
                                    0,
                                    calculateDamageDistribution(
                                      dispute.tool?.depositAmount || 0,
                                      localAssessment
                                    ).refundAmount
                                  )
                            const createRes =
                              await refundsService.createRefundRequest(
                                paymentTx.id,
                                amount,
                                'DISPUTE_RESOLUTION',
                                resolution,
                                resolution
                              )
                            if (
                              !createRes.success ||
                              !createRes.data?.refundId
                            ) {
                              toast({
                                title: 'Erreur',
                                description:
                                  'Création de la demande de remboursement échouée',
                                variant: 'destructive',
                              })
                              return
                            }
                            const processRes =
                              await refundsService.processRefund(
                                createRes.data.refundId,
                                amount,
                                resolution
                              )
                            if (processRes.success) {
                              toast({
                                title: 'Succès',
                                description: 'Remboursement effectué',
                              })
                              loadDisputes()
                            } else {
                              toast({
                                title: 'Erreur',
                                description:
                                  processRes.message ||
                                  'Échec du remboursement',
                                variant: 'destructive',
                              })
                            }
                          } catch (err) {
                            toast({
                              title: 'Erreur',
                              description:
                                'Impossible de traiter le remboursement',
                              variant: 'destructive',
                            })
                          }
                        }}
                      >
                        Rembourser le locataire
                      </Button>
                    )}
                    {(dispute.bookingStatus === 'ACCEPTED' ||
                      dispute.booking?.status === 'ACCEPTED') && (
                      <Button
                        variant='outline'
                        onClick={async () => {
                          try {
                            const { bookingsService } = await import(
                              '@/services/bookingsService'
                            )
                            if (!dispute.booking?.id) {
                              toast({
                                title: 'Erreur',
                                description:
                                  'Réservation introuvable pour ce litige',
                                variant: 'destructive',
                              })
                              return
                            }
                            const res = await bookingsService.payoutBooking(
                              dispute.booking.id
                            )
                            if (res.success) {
                              toast({
                                title: 'Succès',
                                description:
                                  'Paiement au propriétaire effectué',
                              })
                              loadDisputes()
                            } else {
                              toast({
                                title: 'Erreur',
                                description:
                                  'Échec du paiement au propriétaire',
                                variant: 'destructive',
                              })
                            }
                          } catch (e) {
                            toast({
                              title: 'Erreur',
                              description: "Impossible d'effectuer le paiement",
                              variant: 'destructive',
                            })
                          }
                        }}
                      >
                        Payer le propriétaire
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className='bg-green-600 hover:bg-green-700'
                          disabled={!resolution.trim()}
                        >
                          <CheckCircle className='h-4 w-4 mr-2' />
                          Résoudre le litige
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Résoudre le litige
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir marquer ce litige comme
                            résolu ? Cette action ne peut pas être annulée.
                          </AlertDialogDescription>
                          {resolution && (
                            <div className='mt-2 p-2 bg-gray-50 rounded text-sm'>
                              <strong>Notes de résolution :</strong>{' '}
                              {resolution}
                            </div>
                          )}
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleResolveDispute(dispute.id, resolution)
                            }
                            className='bg-green-600 hover:bg-green-700'
                          >
                            Résoudre
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant='outline'
                          className='text-red-600 border-red-600 hover:bg-red-50'
                        >
                          <X className='h-4 w-4 mr-2' />
                          Rejeter le litige
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Rejeter le litige</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir rejeter ce litige ? Cette
                            action ne peut pas être annulée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleStatusChangeAction(dispute.id, 'REJECTED')
                            }
                            className='bg-red-600 hover:bg-red-700'
                          >
                            Rejeter
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant='outline'>Terminer la réservation</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lightbox pour les preuves */}
          {selectedImageIndex !== null && (
            <div className='fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center'>
              <div className='relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4'>
                <button
                  onClick={closeLightbox}
                  className='absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10'
                >
                  <X className='h-8 w-8' />
                </button>

                {dispute.evidence &&
                  dispute.evidence.length > 1 &&
                  selectedImageIndex > 0 && (
                    <button
                      onClick={prevImage}
                      className='absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10'
                    >
                      <ChevronLeft className='h-12 w-12' />
                    </button>
                  )}

                {dispute.evidence &&
                  dispute.evidence.length > 1 &&
                  selectedImageIndex < dispute.evidence.length - 1 && (
                    <button
                      onClick={nextImage}
                      className='absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10'
                    >
                      <ChevronRight className='h-12 w-12' />
                    </button>
                  )}

                <img
                  src={dispute.evidence[selectedImageIndex]}
                  alt={`Preuve ${selectedImageIndex + 1}`}
                  className='max-w-full max-h-full object-contain'
                />

                <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm'>
                  {selectedImageIndex + 1} / {dispute.evidence?.length || 0}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    )
  }

  // Use API-driven pagination and data only
  const displayDisputes = disputes
  const displayTotalPages = totalPages > 0 ? totalPages : 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDisputes = displayDisputes

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Gestion des litiges
          </h1>
          <p className='text-gray-600 mt-2'>
            Résolvez les conflits et gérez les dommages
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder='Filtrer par date de création'
          />
        </div>
      </div>

      {/* Stats cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Ouverts</p>
                <p className='text-2xl font-bold text-destructive'>
                  {disputeStats?.openDisputes || 0}
                </p>
              </div>
              <AlertTriangle className='h-8 w-8 text-destructive' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Résolus</p>
                <p className='text-2xl font-bold text-success'>
                  {disputeStats?.resolvedDisputes || 0}
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
                <p className='text-sm text-gray-600'>Fermés</p>
                <p className='text-2xl font-bold text-gray-600'>
                  {disputeStats?.closedDisputes || 0}
                </p>
              </div>
              <XCircle className='h-8 w-8 text-gray-600' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Total</p>
                <p className='text-2xl font-bold text-primary'>
                  {disputeStats?.totalDisputes || 0}
                </p>
              </div>
              <FileText className='h-8 w-8 text-primary' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Rechercher par ID, outil ou partie...'
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
                <SelectItem value='PENDING'>En attente</SelectItem>
                <SelectItem value='RESOLVED'>Résolu</SelectItem>
                <SelectItem value='REJECTED'>Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Litiges ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Litige</TableHead>
                  <TableHead className='hidden md:table-cell'>
                    Parties
                  </TableHead>
                  <TableHead className='hidden lg:table-cell'>
                    Extrait
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div className='flex items-start gap-3'>
                        <img
                          src={dispute.tool?.imageUrl || '/placeholder.svg'}
                          alt={dispute.tool?.title || 'Tool'}
                          className='w-16 h-12 object-cover rounded hidden sm:block'
                        />
                        <div>
                          <div className='font-medium text-primary'>
                            {dispute.id}
                          </div>
                          <div className='text-sm text-gray-600 line-clamp-1'>
                            {dispute.tool?.title || 'N/A'}
                          </div>
                          <div className='text-sm text-gray-500 flex items-center gap-1 mt-1'>
                            <Calendar className='h-3 w-3' />
                            {new Date(dispute.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='hidden md:table-cell'>
                      <div className='text-sm'>
                        <div>
                          Init:{' '}
                          {dispute.initiator?.firstName &&
                          dispute.initiator?.lastName
                            ? `${dispute.initiator.firstName} ${dispute.initiator.lastName}`
                            : dispute.initiator?.displayName || 'N/A'}
                        </div>
                        <div>
                          Resp:{' '}
                          {dispute.respondent?.firstName &&
                          dispute.respondent?.lastName
                            ? `${dispute.respondent.firstName} ${dispute.respondent.lastName}`
                            : dispute.respondent?.displayName || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='hidden lg:table-cell'>
                      <div className='text-sm text-gray-600 max-w-xs'>
                        {dispute.description.length > 40
                          ? `${dispute.description.substring(0, 40)}...`
                          : dispute.description}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <DisputeDetailsModal dispute={dispute} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between mt-6'>
            <div className='text-sm text-gray-500'>
              {`Affichage de ${
                (currentPage - 1) * itemsPerPage + 1
              } à ${Math.min(
                currentPage * itemsPerPage,
                totalItems
              )} sur ${totalItems} litiges`}
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
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
                disabled={currentPage === displayTotalPages || loading}
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

export default Disputes
