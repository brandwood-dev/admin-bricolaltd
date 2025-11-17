import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Filter, 
  Eye, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Euro,
  User,
  CreditCard,
  Building,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  DollarSign,
  Wallet,
  TrendingUp,
  PoundSterling
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { withdrawalsService, WithdrawalStats } from "@/services/withdrawalsService";
import { WithdrawalRequest, WithdrawalFilterParams } from "@/types/unified-bridge";

const Withdrawals = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectionReason, setRejectionReason] = useState("");
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Load withdrawals from API
  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const filters: WithdrawalFilterParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter as any : undefined,
        type: typeFilter !== "all" ? typeFilter as any : undefined,
        startDate: dateRange?.from?.toISOString(),
        endDate: dateRange?.to?.toISOString()
      };
      console.log('Admin Withdrawals: filters', filters);
      const response = await withdrawalsService.getWithdrawals(filters);
      console.log('Admin Withdrawals: raw response', response);
      const payload: any = response?.data;
      console.log('Admin Withdrawals: payload', payload);
      const list: any[] = Array.isArray(payload?.data)
        ? payload.data
        : (Array.isArray(payload) ? payload : []);
      const total: number = typeof payload?.total === 'number' ? payload.total : (Array.isArray(list) ? list.length : 0);
      console.log('Admin Withdrawals: list length', list.length);
      console.log('Admin Withdrawals: total', total);
      setWithdrawals(list);
      setTotalWithdrawals(total);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les retraits.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load withdrawal statistics
  const loadStats = async () => {
    try {
      const statsData = await withdrawalsService.getWithdrawalStats();
      console.log('Admin Withdrawals: raw stats response', statsData);
      setStats((statsData as any)?.data || null);
      console.log('Admin Withdrawals: bound stats', (statsData as any)?.data || null);
    } catch (error) {
      console.error('Error loading withdrawal stats:', error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadWithdrawals();
  }, [currentPage, searchTerm, statusFilter, typeFilter, dateRange]);

  useEffect(() => {
    loadStats();
  }, []);

  // Remove mock data - using real API data now

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-warning text-warning-foreground">En attente</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-500 text-white">Confirmé</Badge>;
      case "completed":
        return <Badge className="bg-success text-success-foreground">Terminé</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return <Badge variant="outline">Virement bancaire</Badge>;
      case "paypal":
        return <Badge className="bg-blue-600 text-white">PayPal</Badge>;
      case "check":
        return <Badge variant="secondary">Chèque</Badge>;
      default:
        return <Badge variant="outline">Autre</Badge>;
    }
  };

  const handleConfirm = async (withdrawalId: string) => {
    try {
      await withdrawalsService.confirmWithdrawal(withdrawalId);
      toast({
        title: "Demande confirmée",
        description: "Le retrait a été marqué comme confirmé.",
      });
      loadWithdrawals();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer le retrait.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (withdrawalId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier un motif d'annulation.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await withdrawalsService.cancelWithdrawal(withdrawalId, reason);
      toast({
        title: "Retrait annulé",
        description: "La demande a été annulée et l'utilisateur a été notifié.",
      });
      setRejectionReason("");
      loadWithdrawals(); // Refresh data
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le retrait.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (withdrawalId: string) => {
    try {
      await withdrawalsService.processWithdrawal(withdrawalId, { status: 'completed' });
      toast({
        title: "Retrait terminé",
        description: "Le retrait a été marqué comme terminé.",
      });
      loadWithdrawals(); // Refresh data
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer le retrait comme terminé.",
        variant: "destructive",
      });
    }
  };

  const WithdrawalDetailsModal = ({ withdrawal }: { withdrawal: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Demande de retrait {withdrawal.id}</DialogTitle>
            <DialogDescription>
              Détails complets de la demande de retrait et informations bancaires
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Informations principales */}
          <div className="space-y-6">
            {/* Utilisateur */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Nom</Label>
                  <p className="font-semibold">{withdrawal.user?.firstName && withdrawal.user?.lastName ? `${withdrawal.user.firstName} ${withdrawal.user.lastName}` : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-blue-600">{withdrawal.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
                  <p>{withdrawal.user?.phoneNumber || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-2">
                  <div className="text-center p-2 sm:p-3 bg-primary-light rounded-lg">
                    <div className="text-sm sm:text-lg font-bold text-primary">{withdrawal.user?.completedRentals || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Locations</div>
                  </div>
                    <div className="text-center p-2 sm:p-3 bg-green-100 rounded-lg">
                    <div className="text-sm sm:text-lg font-bold text-green-600">£{withdrawal.user?.earnings || 0}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Gains totaux</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Détails financiers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PoundSterling className="h-5 w-5" />
                  Détails financiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Montant demandé:</span>
                  <span className="font-semibold">£{withdrawal.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Commission plateforme (5%):</span>
                  <span className="text-red-600">-£{withdrawal.fees}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Montant net à verser:</span>
                  <span className="font-bold text-lg text-primary">£{withdrawal.netAmount}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Méthode: {getMethodBadge(withdrawal.method)}
                </div>
              </CardContent>
            </Card>

            {/* Statut et dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Suivi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  {getStatusBadge(withdrawal.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Demande créée:</span>
                  <span>{withdrawal.requestDate}</span>
                </div>
                {withdrawal.processedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Traitée le:</span>
                    <span>{withdrawal.processedDate}</span>
                  </div>
                )}
                {withdrawal.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Notes</Label>
                    <p className="text-gray-700 mt-1">{withdrawal.notes}</p>
                  </div>
                )}
                {withdrawal.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Label className="text-sm font-medium text-red-800">Motif de rejet</Label>
                    <p className="text-red-700 mt-1">{withdrawal.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Informations bancaires */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations bancaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {withdrawal.method === "bank_transfer" && withdrawal.bankDetails ? (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Titulaire du compte</Label>
                      <p className="font-semibold">{withdrawal.bankDetails.accountHolder}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">IBAN</Label>
                      <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                        {withdrawal.bankDetails.iban}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">BIC/SWIFT</Label>
                      <p className="font-mono text-sm">{withdrawal.bankDetails.bic}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Banque</Label>
                      <p>{withdrawal.bankDetails.bankName}</p>
                    </div>
                  </>
                ) : withdrawal.method === "paypal" ? (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email PayPal</Label>
                    <p className="font-semibold text-blue-600">{withdrawal.paypalEmail}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Informations de paiement non disponibles</p>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {withdrawal.status === "pending" && (
                  <>
                    <Button 
                      onClick={() => handleConfirm(withdrawal.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirmer la demande
                    </Button>
                    
                    <RejectDialog 
                      withdrawalId={withdrawal.id}
                      onReject={handleCancel}
                      reason={rejectionReason}
                      setReason={setRejectionReason}
                    />
                  </>
                )}
                
                {withdrawal.status === "confirmed" && (
                  <Button 
                    onClick={() => handleComplete(withdrawal.id)}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer comme terminé
                  </Button>
                )}

                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Voir historique paiements
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const RejectDialog = ({ withdrawalId, onReject, reason, setReason }: any) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <X className="h-4 w-4 mr-2" />
          Rejeter
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler cette demande</AlertDialogTitle>
          <AlertDialogDescription>
            Veuillez spécifier le motif d'annulation. L'utilisateur sera notifié.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="rejection-reason">Motif d'annulation</Label>
          <Textarea
            id="rejection-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Expliquez pourquoi cette demande est annulée..."
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onReject(withdrawalId, reason)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Annuler la demande
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  console.log('Admin Withdrawals: state withdrawals length', Array.isArray(withdrawals) ? withdrawals.length : 'not array');
  const filteredWithdrawals = (Array.isArray(withdrawals) ? withdrawals : []).filter(withdrawal => {
    const matchesSearch = searchTerm === "" || 
      withdrawal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (withdrawal.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || withdrawal.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      withdrawal.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || withdrawal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  console.log('Admin Withdrawals: filtered length', filteredWithdrawals.length);

  const totalPages = Math.ceil(totalWithdrawals / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWithdrawals = filteredWithdrawals;

  // Calculate platform wallet metrics using stats from API
  const exchangeRateEURtoGBP = 0.85; // Approximate EUR to GBP exchange rate
  
  const grossCumulativeBalance = (stats?.totalAmount || 0) * exchangeRateEURtoGBP;
  const totalCommission = (stats?.totalFees || 0) * exchangeRateEURtoGBP;
  const completedWithdrawalsAmount = (stats?.completedAmount || 0) * exchangeRateEURtoGBP;
  const netCumulativeBalance = grossCumulativeBalance - completedWithdrawalsAmount;
  const netCommission = totalCommission * 0.8; // Net commission after fees
  const availableBalance = netCumulativeBalance + netCommission;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des retraits</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Gérez les demandes de retrait des utilisateurs</p>
        </div>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
          placeholder="Filtrer par date de demande"
        />
      </div>

      {((stats?.pendingCount || 0) > 0) && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm text-amber-800">
                {stats?.pendingCount} demandes de retrait en attente d’approbation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portefeuille de la plateforme */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Portefeuille de la plateforme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <PoundSterling className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Solde brut cumulé</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">£{grossCumulativeBalance.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Total des montants reçus</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <PoundSterling className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Solde net cumulé</span>
              </div>
              <div className="text-2xl font-bold text-green-600">£{netCumulativeBalance.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Après déduction des retraits</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <PoundSterling className="h-5 w-5 text-primary mr-2" />
                <span className="text-sm font-medium text-gray-600">Total commission</span>
              </div>
              <div className="text-2xl font-bold text-primary">£{totalCommission.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Commission totale (5%)</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <PoundSterling className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Commission nette</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">£{netCommission.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Après frais de traitement</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-center mb-2">
                <PoundSterling className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-sm font-medium text-gray-600">Total retraits</span>
              </div>
              <div className="text-2xl font-bold text-red-600">£{totalWithdrawals.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Montants versés aux utilisateurs</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg shadow-sm border-2 border-green-200">
              <div className="flex items-center justify-center mb-2">
                <PoundSterling className="h-5 w-5 text-green-700 mr-2" />
                <span className="text-sm font-medium text-gray-600">Solde disponible</span>
              </div>
              <div className="text-2xl font-bold text-green-700">£{availableBalance.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Fonds disponibles actuellement</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-warning">
                  {stats?.pendingCount || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmés</p>
                <p className="text-2xl font-bold text-blue-500">
                  {stats?.approvedCount || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Terminés</p>
                <p className="text-2xl font-bold text-success">
                  {stats?.completedCount || 0}
                </p>
              </div>
              <Check className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total retraits</p>
                <p className="text-2xl font-bold text-primary">
                  £{(stats?.totalAmount || 0).toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par ID, nom ou email..."
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
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
              </SelectContent>
            </Select>
            {/* Filtre par type supprimé */}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de retrait ({totalWithdrawals})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demande</TableHead>
                  <TableHead className="hidden md:table-cell">Utilisateur</TableHead>
                  
                  <TableHead>Montant</TableHead>
                  <TableHead className="hidden lg:table-cell">Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedWithdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-primary">{withdrawal.id}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <div className="font-medium">{withdrawal.user?.firstName && withdrawal.user?.lastName ? `${withdrawal.user.firstName} ${withdrawal.user.lastName}` : 'N/A'}</div>
                        <div className="text-sm text-gray-500">{withdrawal.user?.email || 'N/A'}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-semibold">£{withdrawal.amount}</div>
                        <div className="text-sm text-gray-500">Frais: £{withdrawal.fees}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {getMethodBadge(withdrawal.paymentMethod)}
                    </TableCell>
                    <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <WithdrawalDetailsModal withdrawal={withdrawal} />
                        {withdrawal.status === "pending" && (
                          <>
                            {/* Confirm with dialog */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  title="Confirmer la demande"
                                >
                                  <Check className="h-4 w-4 text-success" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmer cette demande</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir confirmer cette demande de retrait ?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleConfirm(withdrawal.id)}>
                                    Confirmer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            {/* Cancel with confirmation and reason */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Annuler la demande">
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Annuler cette demande</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Veuillez spécifier le motif d'annulation. L'utilisateur sera notifié.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="space-y-2">
                                  <Label htmlFor="cancel-reason">Motif d'annulation</Label>
                                  <Textarea
                                    id="cancel-reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Expliquez pourquoi cette demande est annulée..."
                                    rows={3}
                                  />
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Fermer</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancel(withdrawal.id, rejectionReason)} className="bg-destructive hover:bg-destructive/90">
                                    Annuler la demande
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, totalWithdrawals)} sur {totalWithdrawals} demandes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Withdrawals;