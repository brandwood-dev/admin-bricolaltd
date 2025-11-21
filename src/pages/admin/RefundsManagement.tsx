import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types
interface Refund {
  id: string;
  refundId: string;
  transactionId: string;
  bookingId?: string;
  originalAmount: number;
  refundAmount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  reason: string;
  reasonDetails?: string;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
  failureReason?: string;
  walletBalanceUpdated: boolean;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
  transaction?: {
    id: string;
    senderId: string;
    recipientId: string;
    description: string;
  };
  booking?: {
    id: string;
    toolName: string;
    userName: string;
    startDate: string;
    endDate: string;
  };
}

interface RefundStats {
  totalRefunds: number;
  totalRefundAmount: number;
  averageRefundAmount: number;
  refundsByStatus: Record<string, number>;
  refundsByReason: Record<string, number>;
  refundsThisMonth: number;
  amountThisMonth: number;
}

interface RefundFilters {
  status?: string;
  reason?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

import { refundsService } from '@/services/refundsService';

const RefundsManagement: React.FC = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [stats, setStats] = useState<RefundStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('pending');
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const itemsPerPage = 20;

  // Load data
  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter, reasonFilter, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [refundsRes, statsRes] = await Promise.all([
        refundsService.getAllRefunds({
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          reason: reasonFilter !== 'all' ? reasonFilter : undefined,
          search: searchTerm || undefined,
        }),
        refundsService.getRefundStats(),
      ]);

      const payload: any = refundsRes?.data || {};
      setRefunds(Array.isArray(payload.refunds) ? payload.refunds : []);
      setTotalPages(typeof payload.totalPages === 'number' ? payload.totalPages : 1);
      setStats((statsRes as any)?.data || null);
    } catch (error) {
      console.error('Failed to load refund data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter refunds by tab
  const getFilteredRefunds = () => {
    switch (activeTab) {
      case 'pending':
        return refunds.filter(r => r.status === 'PENDING');
      case 'processing':
        return refunds.filter(r => r.status === 'PROCESSING');
      case 'completed':
        return refunds.filter(r => r.status === 'COMPLETED');
      case 'failed':
        return refunds.filter(r => r.status === 'FAILED');
      default:
        return refunds;
    }
  };

  // Status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> En attente</Badge>;
      case 'PROCESSING':
        return <Badge variant="outline" className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> En cours</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Terminé</Badge>;
      case 'FAILED':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Échoué</Badge>;
      case 'CANCELLED':
        return <Badge variant="secondary" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Annulé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
    };

    return <Badge variant="outline">{reasonLabels[reason] || reason}</Badge>;
  };

  // Process refund
  const handleProcessRefund = async (refund: Refund) => {
    setSelectedRefund(refund);
    setShowProcessDialog(true);
  };

  const confirmProcessRefund = async () => {
    if (!selectedRefund) return;

    setProcessing(true);
    try {
      const result = await refundsService.processRefund(
        selectedRefund.id,
        selectedRefund.refundAmount,
        adminNotes
      );
      if ((result as any)?.success) {
        // Reload data
        await loadData();
        setShowProcessDialog(false);
        setSelectedRefund(null);
        setAdminNotes('');
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (refund: Refund) => {
    setSelectedRefund(refund);
    setShowStatusDialog(true);
  };

  const confirmUpdateStatus = async (newStatus: string) => {
    if (!selectedRefund) return;

    setProcessing(true);
    try {
      await refundsService.updateRefundStatus(selectedRefund.id, newStatus as any, statusReason);
      await loadData();
      setShowStatusDialog(false);
      setSelectedRefund(null);
      setStatusReason('');
    } catch (error) {
      console.error('Failed to update refund status:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
  };

  if (loading && !refunds.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Chargement des remboursements...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Remboursements</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de remboursement et suivez leur traitement
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Remboursements</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRefunds}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalRefundAmount)} au total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Montant Moyen</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageRefundAmount)}</div>
              <p className="text-xs text-muted-foreground">Par remboursement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.refundsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.amountThisMonth)} remboursés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.refundsByStatus.PENDING || 0}</div>
              <p className="text-xs text-muted-foreground">À traiter</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="PROCESSING">En cours</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
                <SelectItem value="FAILED">Échoué</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Raison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les raisons</SelectItem>
                <SelectItem value="CUSTOMER_REQUEST">Demande client</SelectItem>
                <SelectItem value="BOOKING_CANCELLATION">Annulation</SelectItem>
                <SelectItem value="TOOL_UNAVAILABLE">Outil indisponible</SelectItem>
                <SelectItem value="SERVICE_ISSUE">Problème service</SelectItem>
                <SelectItem value="OTHER">Autre</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setStatusFilter('all');
              setReasonFilter('all');
              setSearchTerm('');
            }}>
              <Filter className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="processing">En cours</TabsTrigger>
          <TabsTrigger value="completed">Terminés</TabsTrigger>
          <TabsTrigger value="failed">Échoués</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Remboursements</CardTitle>
              <CardDescription>
                Gérez les demandes de remboursement et leur traitement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Chargement...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Refunds Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Transaction</TableHead>
                          <TableHead>Réservation</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Raison</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredRefunds().map((refund) => (
                          <TableRow key={refund.id}>
                            <TableCell className="font-mono text-xs">
                              {refund.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{refund.transactionId.substring(0, 8)}...</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatCurrency(refund.originalAmount)} → {formatCurrency(refund.refundAmount)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {refund.booking ? (
                                <div className="space-y-1">
                                  <div className="font-medium">{refund.booking.toolName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {refund.booking.userName}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div>{formatCurrency(refund.refundAmount)}</div>
                                <div className="text-sm text-muted-foreground">
                                  sur {formatCurrency(refund.originalAmount)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(refund.status)}</TableCell>
                            <TableCell>{getReasonBadge(refund.reason)}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">
                                  {formatDate(refund.createdAt)}
                                </div>
                                {refund.processedAt && (
                                  <div className="text-xs text-muted-foreground">
                                    Traité: {formatDate(refund.processedAt)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRefund(refund)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {refund.status === 'PENDING' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleProcessRefund(refund)}
                                  >
                                    Traiter
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(refund)}
                                >
                                    Modifier statut
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {getFilteredRefunds().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun remboursement trouvé
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Process Refund Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Traiter le remboursement</DialogTitle>
            <DialogDescription>
              Confirmez le traitement du remboursement pour {selectedRefund?.refundAmount} €
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notes administrateur</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Ajoutez des notes sur ce remboursement..."
                rows={3}
              />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Confirmation requise</AlertTitle>
              <AlertDescription>
                Ce traitement créera un remboursement réel et mettra à jour le solde du portefeuille.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProcessDialog(false);
                setSelectedRefund(null);
                setAdminNotes('');
              }}
              disabled={processing}
            >
              Annuler
            </Button>
            <Button
              onClick={confirmProcessRefund}
              disabled={processing}
            >
              {processing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le statut</DialogTitle>
            <DialogDescription>
              Changez le statut du remboursement
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nouveau statut</label>
              <Select value={statusReason} onValueChange={setStatusReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="PROCESSING">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Terminé</SelectItem>
                  <SelectItem value="FAILED">Échoué</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Raison du changement</label>
              <Textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Expliquez la raison du changement de statut..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusDialog(false);
                setSelectedRefund(null);
                setStatusReason('');
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
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
        <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du remboursement</DialogTitle>
              <DialogDescription>
                Informations complètes sur le remboursement
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID Remboursement</label>
                  <p className="font-mono text-sm">{selectedRefund.refundId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID Transaction</label>
                  <p className="font-mono text-sm">{selectedRefund.transactionId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Montant Original</label>
                  <p className="font-semibold">{formatCurrency(selectedRefund.originalAmount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Montant Remboursé</label>
                  <p className="font-semibold text-green-600">{formatCurrency(selectedRefund.refundAmount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <div>{getStatusBadge(selectedRefund.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Raison</label>
                  <div>{getReasonBadge(selectedRefund.reason)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                  <p>{formatDate(selectedRefund.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de traitement</label>
                  <p>{selectedRefund.processedAt ? formatDate(selectedRefund.processedAt) : 'Non traité'}</p>
                </div>
              </div>

              {selectedRefund.reasonDetails && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Détails de la raison</label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedRefund.reasonDetails}</p>
                </div>
              )}

              {selectedRefund.adminNotes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes administrateur</label>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedRefund.adminNotes}</p>
                </div>
              )}

              {selectedRefund.failureReason && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Raison de l'échec</AlertTitle>
                  <AlertDescription>{selectedRefund.failureReason}</AlertDescription>
                </Alert>
              )}

              {selectedRefund.booking && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Informations de réservation</label>
                  <div className="bg-muted p-3 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Outil:</span>
                      <span className="font-medium">{selectedRefund.booking.toolName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Utilisateur:</span>
                      <span className="font-medium">{selectedRefund.booking.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Période:</span>
                      <span className="font-medium">
                        {new Date(selectedRefund.booking.startDate).toLocaleDateString('fr-FR')} - 
                        {new Date(selectedRefund.booking.endDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Solde portefeuille mis à jour</label>
                  <p>{selectedRefund.walletBalanceUpdated ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notification envoyée</label>
                  <p>{selectedRefund.notificationSent ? 'Oui' : 'Non'}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRefund(null)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RefundsManagement;