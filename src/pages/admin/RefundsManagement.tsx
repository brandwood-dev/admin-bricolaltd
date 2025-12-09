import React, { useState, useEffect } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Filter,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Types
interface Refund {
  id: string
  refundId: string
  transactionId: string
  bookingId?: string
  originalAmount: number
  refundAmount: number
  currency: string
  status:
    | 'PENDING'
    | 'PROCESSING'
    | 'CONFIRMED'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED'
    | 'REJECTED'
  reason: string
  reasonDetails?: string
  adminNotes?: string
  processedBy?: string
  processedAt?: string
  failureReason?: string
  walletBalanceUpdated: boolean
  notificationSent: boolean
  createdAt: string
  updatedAt: string
  transaction?: {
    id: string
    senderId: string
    recipientId: string
    description: string
    sender?: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    recipient?: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }
  booking?: {
    id: string
    toolName: string
    userName: string
    startDate: string
    endDate: string
    renter?: {
      id: string
      firstName: string
      lastName: string
      email: string
      phoneNumber: string
    }
    owner?: {
      id: string
      firstName: string
      lastName: string
      email: string
      phoneNumber: string
    }
  }
}

interface RefundStats {
  totalRefunds: number
  totalRefundAmount: number
  averageRefundAmount: number
  refundsByStatus: Record<string, number>
  refundsByReason: Record<string, number>
  refundsThisMonth: number
  amountThisMonth: number
}

interface RefundFilters {
  status?: string
  reason?: string
  search?: string
  startDate?: string
  endDate?: string
}

import { refundsService } from '@/services/refundsService'

const RefundsManagement: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [stats, setStats] = useState<RefundStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [reasonFilter, setReasonFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showProcessDialog, setShowProcessDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [statusReason, setStatusReason] = useState('')

  const itemsPerPage = 20

  // Load data
  useEffect(() => {
    loadData()
  }, [currentPage, statusFilter, reasonFilter, searchQuery])

  const loadData = async () => {
    setLoading(true)
    try {
      const refundsRes = await refundsService.getAllRefunds({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        reason: reasonFilter !== 'all' ? reasonFilter : undefined,
        search: searchQuery || undefined,
      })

      const top: any = refundsRes?.data || {}
      const payload: any = top?.data ?? top
      const refundsList = Array.isArray(payload?.refunds)
        ? payload.refunds
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
        ? payload
        : Array.isArray(top?.data)
        ? top.data
        : []
      const totalPagesVal =
        typeof payload?.totalPages === 'number'
          ? payload.totalPages
          : typeof payload?.meta?.totalPages === 'number'
          ? payload.meta.totalPages
          : typeof top?.totalPages === 'number'
          ? top.totalPages
          : typeof top?.meta?.totalPages === 'number'
          ? top.meta.totalPages
          : 1
      setRefunds(refundsList)
      setTotalPages(totalPagesVal)

      try {
        const statsRes = await refundsService.getRefundStats()
        const sTop: any = (statsRes as any)?.data || null
        setStats(sTop?.data ?? sTop)
      } catch {
        setStats(null)
      }
    } catch (error) {
      console.error('Failed to load refund data:', error)
      setRefunds([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  // Status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant='secondary' className='flex items-center gap-1'>
            <Clock className='h-3 w-3' /> En attente
          </Badge>
        )
      case 'CONFIRMED':
        return (
          <Badge className='bg-blue-600 hover:bg-blue-700 flex items-center gap-1'>
            <CheckCircle className='h-3 w-3' /> Confirmé
          </Badge>
        )
      case 'PROCESSING':
        return (
          <Badge variant='outline' className='flex items-center gap-1'>
            <RefreshCw className='h-3 w-3' /> En cours
          </Badge>
        )
      case 'COMPLETED':
        return (
          <Badge variant='success' className='flex items-center gap-1'>
            <CheckCircle className='h-3 w-3' /> Terminé
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant='destructive' className='flex items-center gap-1'>
            <XCircle className='h-3 w-3' /> Échoué
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant='secondary' className='flex items-center gap-1'>
            <XCircle className='h-3 w-3' /> Annulé
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant='destructive' className='flex items-center gap-1'>
            <XCircle className='h-3 w-3' /> Refusée
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  // Reason badge
  const getReasonBadge = (reason: string) => {
    const reasonLabels: Record<string, string> = {
      CUSTOMER_REQUEST: 'Demande client',
      BOOKING_CANCELLATION: 'Annulation réservation',
      TOOL_UNAVAILABLE: 'Outil indisponible',
      SERVICE_ISSUE: 'Problème service',
      FRAUD: 'Fraude',
      DUPLICATE_PAYMENT: 'Paiement en double',
      ADMIN_DECISION: 'Décision admin',
      OTHER: 'Autre',
    }

    return <Badge variant='outline'>{reasonLabels[reason] || reason}</Badge>
  }

  // Process refund
  const handleProcessRefund = async (refund: Refund) => {
    setSelectedRefund(refund)
    setShowProcessDialog(true)
  }

  const confirmProcessRefund = async () => {
    if (!selectedRefund) return

    setProcessing(true)
    try {
      const result = await refundsService.processRefund(
        selectedRefund.id,
        selectedRefund.refundAmount,
        adminNotes
      )
      if ((result as any)?.success) {
        // Reload data
        await loadData()
        setShowProcessDialog(false)
        setSelectedRefund(null)
        setAdminNotes('')
      }
    } catch (error) {
      console.error('Failed to process refund:', error)
    } finally {
      setProcessing(false)
    }
  }

  const [showAcceptDialog, setShowAcceptDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  // Accept refund
  const handleAcceptRefund = (refund: Refund) => {
    setSelectedRefund(refund)
    setShowAcceptDialog(true)
  }

  const confirmAcceptRefund = async () => {
    if (!selectedRefund) return

    setProcessing(true)
    try {
      // First set to CONFIRMED
      await refundsService.updateRefundStatus(
        selectedRefund.id,
        'CONFIRMED',
        'Demande acceptée par administrateur'
      )

      // Then trigger processing
      const result = await refundsService.processRefund(
        selectedRefund.id,
        selectedRefund.refundAmount,
        'Traitement automatique après acceptation'
      )

      if ((result as any)?.success) {
        await loadData()
        setShowAcceptDialog(false)
        setSelectedRefund(null)
      }
    } catch (error) {
      console.error('Failed to accept refund:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Reject refund
  const handleRejectRefund = (refund: Refund) => {
    setSelectedRefund(refund)
    setShowRejectDialog(true)
  }

  const confirmRejectRefund = async () => {
    if (!selectedRefund) return

    setProcessing(true)
    try {
      await refundsService.updateRefundStatus(
        selectedRefund.id,
        'REJECTED',
        'Demande refusée par administrateur'
      )
      await loadData()
      setShowRejectDialog(false)
      setSelectedRefund(null)
    } catch (error) {
      console.error('Failed to reject refund:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Retry refund
  const handleRetryRefund = async (refund: Refund) => {
    setSelectedRefund(refund)
    setProcessing(true)
    try {
      // Retry processing
      const result = await refundsService.processRefund(
        refund.id,
        refund.refundAmount,
        'Tentative de relance après échec'
      )

      if ((result as any)?.success) {
        await loadData()
        setSelectedRefund(null)
      }
    } catch (error) {
      console.error('Failed to retry refund:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Update status
  const handleUpdateStatus = async (refund: Refund) => {
    setSelectedRefund(refund)
    setShowStatusDialog(true)
  }

  const confirmUpdateStatus = async (newStatus: string) => {
    if (!selectedRefund) return

    setProcessing(true)
    try {
      await refundsService.updateRefundStatus(
        selectedRefund.id,
        newStatus as any,
        statusReason
      )
      await loadData()
      setShowStatusDialog(false)
      setSelectedRefund(null)
      setStatusReason('')
    } catch (error) {
      console.error('Failed to update refund status:', error)
    } finally {
      setProcessing(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr })
  }

  if (loading && !refunds.length) {
    return (
      <div className='p-6'>
        <Card>
          <CardContent className='flex items-center justify-center h-64'>
            <div className='flex items-center gap-2'>
              <RefreshCw className='h-4 w-4 animate-spin' />
              <span>Chargement des remboursements...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Gestion des Remboursements</h1>
          <p className='text-muted-foreground'>
            Gérez les demandes de remboursement et suivez leur traitement
          </p>
        </div>
        <Button variant='outline' onClick={loadData} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Remboursements
              </CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.totalRefunds}</div>
              <p className='text-xs text-muted-foreground'>
                {formatCurrency(stats.totalRefundAmount)} au total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Montant Moyen
              </CardTitle>
              <DollarSign className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatCurrency(stats.averageRefundAmount)}
              </div>
              <p className='text-xs text-muted-foreground'>Par remboursement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Ce Mois</CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.refundsThisMonth}</div>
              <p className='text-xs text-muted-foreground'>
                {formatCurrency(stats.amountThisMonth)} remboursés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>En Attente</CardTitle>
              <AlertCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats.refundsByStatus.PENDING || 0}
              </div>
              <p className='text-xs text-muted-foreground'>À traiter</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className='p-6'>
          <div className='flex flex-wrap gap-4'>
            <div className='flex-1 min-w-[200px]'>
              <Input
                placeholder='Rechercher...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchTerm)
                    setCurrentPage(1)
                  }
                }}
                className='pl-8'
              />
              <Search
                className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer'
                onClick={() => {
                  setSearchQuery(searchTerm)
                  setCurrentPage(1)
                }}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les statuts</SelectItem>
                <SelectItem value='PENDING'>En attente</SelectItem>
                <SelectItem value='CONFIRMED'>Confirmé</SelectItem>
                <SelectItem value='PROCESSING'>En cours</SelectItem>
                <SelectItem value='COMPLETED'>Terminé</SelectItem>
                <SelectItem value='FAILED'>Échoué</SelectItem>
                <SelectItem value='REJECTED'>Refusée</SelectItem>
                <SelectItem value='CANCELLED'>Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={reasonFilter}
              onValueChange={(val) => {
                setReasonFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Raison' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Toutes les raisons</SelectItem>
                <SelectItem value='CUSTOMER_REQUEST'>Demande client</SelectItem>
                <SelectItem value='BOOKING_CANCELLATION'>Annulation</SelectItem>
                <SelectItem value='TOOL_UNAVAILABLE'>
                  Outil indisponible
                </SelectItem>
                <SelectItem value='SERVICE_ISSUE'>Problème service</SelectItem>
                <SelectItem value='OTHER'>Autre</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              onClick={() => {
                setStatusFilter('all')
                setReasonFilter('all')
                setSearchTerm('')
                setSearchQuery('')
                setCurrentPage(1)
              }}
            >
              <Filter className='h-4 w-4 mr-2' />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remboursements</CardTitle>
          <CardDescription>
            Gérez les demandes de remboursement et leur traitement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center h-32'>
              <RefreshCw className='h-4 w-4 animate-spin mr-2' />
              Chargement...
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Refunds Table */}
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell className='font-mono text-xs'>
                          {refund.id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className='space-y-1'>
                            <div className='font-medium'>
                              {refund.booking?.renter ? (
                                `${refund.booking.renter.firstName} ${refund.booking.renter.lastName}`
                              ) : refund.booking?.userName ? (
                                refund.booking.userName
                              ) : (
                                <span className='text-muted-foreground'>-</span>
                              )}
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              {refund.booking?.toolName || '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='space-y-1'>
                            <div className='font-bold'>
                              {formatCurrency(refund.refundAmount)}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              (Frais inclus)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(refund.status)}</TableCell>
                        <TableCell>
                          <div className='space-y-1'>
                            <div className='text-sm'>
                              {formatDate(refund.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex gap-2'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => setSelectedRefund(refund)}
                              title='Voir les détails'
                            >
                              <Eye className='h-4 w-4' />
                            </Button>

                            {refund.status === 'PENDING' && (
                              <>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='text-green-600 hover:text-green-700 hover:bg-green-50'
                                  onClick={() => handleAcceptRefund(refund)}
                                  title='Accepter la demande'
                                >
                                  <CheckCircle className='h-4 w-4' />
                                </Button>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='text-red-600 hover:text-red-700 hover:bg-red-50'
                                  onClick={() => handleRejectRefund(refund)}
                                  title='Refuser la demande'
                                >
                                  <XCircle className='h-4 w-4' />
                                </Button>
                              </>
                            )}

                            {refund.status === 'FAILED' && (
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => handleRetryRefund(refund)}
                              >
                                Relancer
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {refunds.length === 0 && (
                <div className='text-center py-8 text-muted-foreground'>
                  Aucun remboursement trouvé
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept Refund Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirmation d'acceptation</DialogTitle>
          </DialogHeader>

          <div className='py-4'>
            <p>
              Êtes-vous sûr de vouloir accepter cette demande de remboursement
              de{' '}
              <span className='font-bold'>
                {selectedRefund && formatCurrency(selectedRefund.refundAmount)}
              </span>
              ? Une fois validée, la demande passera au statut « Confirmé » et
              le processus de remboursement sera lancé.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowAcceptDialog(false)
                setSelectedRefund(null)
              }}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button onClick={confirmAcceptRefund} disabled={processing}>
              {processing ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Traitement...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Refund Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Confirmation de refus</DialogTitle>
          </DialogHeader>

          <div className='py-4 space-y-4'>
            <p>
              Êtes-vous sûr de vouloir refuser cette demande de remboursement de{' '}
              <span className='font-bold'>
                {selectedRefund && formatCurrency(selectedRefund.refundAmount)}
              </span>
              ? La demande sera placée au statut « Refusée » et un email sera
              automatiquement envoyé à l'utilisateur pour l'en informer.
            </p>

            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription>
                Cette action est irréversible. L'utilisateur devra faire une
                nouvelle demande si nécessaire.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowRejectDialog(false)
                setSelectedRefund(null)
              }}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button
              variant='destructive'
              onClick={confirmRejectRefund}
              disabled={processing}
            >
              {processing ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Traitement...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Refund Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Traiter le remboursement</DialogTitle>
            <DialogDescription>
              Confirmez le traitement du remboursement pour{' '}
              {selectedRefund?.refundAmount} €
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>
                Notes administrateur
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder='Ajoutez des notes sur ce remboursement...'
                rows={3}
              />
            </div>

            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Confirmation requise</AlertTitle>
              <AlertDescription>
                Ce traitement créera un remboursement réel et mettra à jour le
                solde du portefeuille.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowProcessDialog(false)
                setSelectedRefund(null)
                setAdminNotes('')
              }}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button onClick={confirmProcessRefund} disabled={processing}>
              {processing ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Traitement...
                </>
              ) : (
                'Confirmer le traitement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Modifier le statut</DialogTitle>
            <DialogDescription>
              Changez le statut du remboursement
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div>
              <label className='text-sm font-medium'>Nouveau statut</label>
              <Select value={statusReason} onValueChange={setStatusReason}>
                <SelectTrigger>
                  <SelectValue placeholder='Sélectionner un statut' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PENDING'>En attente</SelectItem>
                  <SelectItem value='PROCESSING'>En cours</SelectItem>
                  <SelectItem value='COMPLETED'>Terminé</SelectItem>
                  <SelectItem value='FAILED'>Échoué</SelectItem>
                  <SelectItem value='CANCELLED'>Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='text-sm font-medium'>
                Raison du changement
              </label>
              <Textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder='Expliquez la raison du changement de statut...'
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setShowStatusDialog(false)
                setSelectedRefund(null)
                setStatusReason('')
              }}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button
              onClick={() => confirmUpdateStatus(statusReason)}
              disabled={processing || !statusReason}
            >
              {processing ? (
                <>
                  <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                  Mise à jour...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Details Dialog */}
      {selectedRefund && (
        <Dialog
          open={!!selectedRefund}
          onOpenChange={() => setSelectedRefund(null)}
        >
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Détails du remboursement</DialogTitle>
              <DialogDescription>
                Informations complètes sur le remboursement
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Locataire
                  </label>
                  <p className='font-medium'>
                    {selectedRefund.booking?.renter ? (
                      <>
                        {selectedRefund.booking.renter.firstName}{' '}
                        {selectedRefund.booking.renter.lastName}
                        <br />
                        <span className='text-xs text-muted-foreground font-normal'>
                          {selectedRefund.booking.renter.email}
                        </span>
                        {selectedRefund.booking.renter.phoneNumber && (
                          <span className='text-xs text-muted-foreground font-normal block'>
                            {selectedRefund.booking.renter.phoneNumber}
                          </span>
                        )}
                      </>
                    ) : selectedRefund.booking?.userName ? (
                      selectedRefund.booking.userName
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Propriétaire
                  </label>
                  <p className='font-medium'>
                    {selectedRefund.booking?.owner ? (
                      <>
                        {selectedRefund.booking.owner.firstName}{' '}
                        {selectedRefund.booking.owner.lastName}
                      </>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    ID Remboursement
                  </label>
                  <p className='font-mono text-sm'>{selectedRefund.refundId}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    ID Transaction
                  </label>
                  <p className='font-mono text-sm'>
                    {selectedRefund.transactionId}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Montant Original
                  </label>
                  <p className='font-semibold'>
                    {formatCurrency(selectedRefund.originalAmount)}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Montant Remboursé
                  </label>
                  <p className='font-semibold text-green-600'>
                    {formatCurrency(selectedRefund.refundAmount)}
                  </p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Statut
                  </label>
                  <div>{getStatusBadge(selectedRefund.status)}</div>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Raison
                  </label>
                  <div>{getReasonBadge(selectedRefund.reason)}</div>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Date de création
                  </label>
                  <p>{formatDate(selectedRefund.createdAt)}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Date de traitement
                  </label>
                  <p>
                    {selectedRefund.processedAt
                      ? formatDate(selectedRefund.processedAt)
                      : 'Non traité'}
                  </p>
                </div>
              </div>

              {selectedRefund.reasonDetails && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Détails de la raison
                  </label>
                  <p className='text-sm bg-muted p-3 rounded-md'>
                    {selectedRefund.reasonDetails}
                  </p>
                </div>
              )}

              {selectedRefund.adminNotes && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Notes administrateur
                  </label>
                  <p className='text-sm bg-muted p-3 rounded-md'>
                    {selectedRefund.adminNotes}
                  </p>
                </div>
              )}

              {selectedRefund.failureReason && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertTitle>Raison de l'échec</AlertTitle>
                  <AlertDescription>
                    {selectedRefund.failureReason}
                  </AlertDescription>
                </Alert>
              )}

              {selectedRefund.booking && (
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Informations de réservation
                  </label>
                  <div className='bg-muted p-3 rounded-md space-y-2'>
                    <div className='flex justify-between'>
                      <span>Outil:</span>
                      <span className='font-medium'>
                        {selectedRefund.booking.toolName}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Utilisateur:</span>
                      <span className='font-medium'>
                        {selectedRefund.booking.userName}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Période:</span>
                      <span className='font-medium'>
                        {new Date(
                          selectedRefund.booking.startDate
                        ).toLocaleDateString('fr-FR')}{' '}
                        -
                        {new Date(
                          selectedRefund.booking.endDate
                        ).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Solde portefeuille mis à jour
                  </label>
                  <p>{selectedRefund.walletBalanceUpdated ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <label className='text-sm font-medium text-muted-foreground'>
                    Notification envoyée
                  </label>
                  <p>{selectedRefund.notificationSent ? 'Oui' : 'Non'}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <div className='flex gap-2 justify-end w-full'>
                <Button
                  variant='outline'
                  onClick={() => setSelectedRefund(null)}
                >
                  Fermer
                </Button>

                {selectedRefund.status === 'PENDING' && (
                  <>
                    <Button
                      className='bg-red-600 hover:bg-red-700'
                      onClick={() => {
                        setSelectedRefund(selectedRefund)
                        setShowRejectDialog(true)
                      }}
                    >
                      Refuser la demande
                    </Button>
                    <Button
                      className='bg-green-600 hover:bg-green-700'
                      onClick={() => {
                        setSelectedRefund(selectedRefund)
                        setShowAcceptDialog(true)
                      }}
                    >
                      Accepter la demande
                    </Button>
                  </>
                )}

                {selectedRefund.status === 'FAILED' && (
                  <Button
                    onClick={() => {
                      setSelectedRefund(selectedRefund)
                      handleRetryRefund(selectedRefund)
                    }}
                  >
                    Relancer le remboursement
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default RefundsManagement
