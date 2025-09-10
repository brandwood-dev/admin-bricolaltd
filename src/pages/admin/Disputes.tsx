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
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { disputesService, DisputeStats } from "@/services/disputesService";
import { Dispute, DisputeFilterParams, PaginatedResponse, DisputeStatus } from "@/types/unified-bridge";

const Disputes = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputeStats, setDisputeStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [selectedDisputes, setSelectedDisputes] = useState<string[]>([]);
  const [damageAssessment, setDamageAssessment] = useState({
    cosmetic: 0,
    functional: 0,
    missing: 0,
    totalDamage: 0
  });
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionAmount, setResolutionAmount] = useState(0);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Load disputes data
  const loadDisputes = async () => {
    try {
      setLoading(true);
      const filters: DisputeFilterParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as DisputeStatus : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter as 'low' | 'medium' | 'high' : undefined,
        dateRange: dateRange ? {
          startDate: dateRange.from?.toISOString().split('T')[0] || '',
          endDate: dateRange.to?.toISOString().split('T')[0] || ''
        } : undefined
      };

      const response = await disputesService.getDisputes(filters);
      if (response.success && response.data) {
        setDisputes(response.data.items);
        setTotalPages(response.data.meta.totalPages);
        setTotalItems(response.data.meta.totalItems);
      }
    } catch (error) {
      console.error('Error loading disputes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les litiges",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load dispute statistics
  const loadDisputeStats = async () => {
    try {
      const response = await disputesService.getDisputeStats(
        dateRange ? {
          startDate: dateRange.from?.toISOString().split('T')[0] || '',
          endDate: dateRange.to?.toISOString().split('T')[0] || ''
        } : undefined
      );
      if (response.success && response.data) {
        setDisputeStats(response.data);
      }
    } catch (error) {
      console.error('Error loading dispute stats:', error);
    }
  };

  // Load dispute details
  const loadDisputeDetails = async (disputeId: string) => {
    try {
      const response = await disputesService.getDisputeById(disputeId);
      if (response.success && response.data) {
        setSelectedDispute(response.data);
      }
    } catch (error) {
      console.error('Error loading dispute details:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du litige",
        variant: "destructive"
      });
    }
  };

  // Handle dispute status updates
  const handleStatusUpdate = async (disputeId: string, status: DisputeStatus) => {
    try {
      let response;
      switch (status) {
        case 'PENDING':
          response = await disputesService.markAsInProgress(disputeId);
          break;
        case 'RESOLVED':
          response = await disputesService.markAsResolved(disputeId);
          break;
        case 'CLOSED':
          response = await disputesService.markAsClosed(disputeId);
          break;
        default:
          response = await disputesService.updateDispute(disputeId, { status });
      }

      if (response.success) {
        toast({
          title: "Succès",
          description: "Statut du litige mis à jour"
        });
        loadDisputes();
      }
    } catch (error) {
      console.error('Error updating dispute status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  // Handle dispute resolution
  const handleResolveDispute = async (disputeId: string, notes: string) => {
    try {
      const response = await disputesService.resolveDispute({
        disputeId,
        resolution: 'refund_partial',
        amount: resolutionAmount,
        reason: notes,
        adminNotes: notes,
        notifyParties: true
      });

      if (response.success) {
        toast({
          title: "Succès",
          description: "Litige résolu avec succès"
        });
        setSelectedDispute(null);
        setResolutionNotes("");
        setResolutionAmount(0);
        loadDisputes();
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: "Erreur",
        description: "Impossible de résoudre le litige",
        variant: "destructive"
      });
    }
  };

  // Handle status change action
  const handleStatusChangeAction = async (disputeId: string, newStatus: DisputeStatus) => {
    await handleStatusUpdate(disputeId, newStatus);
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'resolve' | 'close' | 'assign') => {
    if (selectedDisputes.length === 0) {
      toast({
        title: "Attention",
        description: "Veuillez sélectionner au moins un litige",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await disputesService.bulkUpdateDisputes({
        disputeIds: selectedDisputes,
        action,
        reason: `Action en masse: ${action}`
      });

      if (response.success) {
        toast({
          title: "Succès",
          description: `${response.data?.updated || 0} litiges mis à jour`
        });
        setSelectedDisputes([]);
        loadDisputes();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer l'action en masse",
        variant: "destructive"
      });
    }
  };

  // Handle data export
  const handleExportDisputes = async () => {
    try {
      const filters: DisputeFilterParams = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as DisputeStatus : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        dateRange: dateRange ? {
          startDate: dateRange.from?.toISOString().split('T')[0] || '',
          endDate: dateRange.to?.toISOString().split('T')[0] || ''
        } : undefined
      };

      const response = await disputesService.exportDisputes({ ...filters, format: 'csv' });
      if (response.success && response.data) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `disputes-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Succès",
          description: "Export des litiges terminé"
        });
      }
    } catch (error) {
      console.error('Error exporting disputes:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les litiges",
        variant: "destructive"
      });
    }
  };

  // Effects
  useEffect(() => {
    loadDisputes();
    loadDisputeStats();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, priorityFilter, dateRange]);

  // Mock data for fallback when API is not available
  const mockDisputes = [
    {
      id: "LIT-001",
      bookingId: "RES-001",
      tool: {
        title: "Perceuse électrique Bosch",
        image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400",
        owner: "Marie Dubois",
        ownerPhone: "+33 6 12 34 56 78",
        location: "75011 Paris, France"
      },
      renter: {
        name: "Pierre Durand",
        email: "pierre.durand@email.com",
        phone: "+33 6 98 76 54 32"
      },
      booking: {
        startDate: "2024-03-18",
        endDate: "2024-03-20",
        duration: "2 jours"
      },
      status: "open",
      priority: "high",
      category: "damage",
      createdAt: "2024-03-20",
      deposit: 50,
      description: "L'outil a été rendu avec des dommages visibles sur le boîtier et un problème de fonctionnement.",
      ownerClaim: "Perceuse cassée lors de la location",
      renterResponse: "L'outil était déjà défaillant au début de la location",
      evidence: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
        "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400"
      ],
      messages: 8,
      adminNotes: ""
    },
    {
      id: "LIT-002",
      bookingId: "RES-005",
      tool: {
        title: "Tondeuse thermique Honda",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
        owner: "Jean Martin",
        ownerPhone: "+33 6 87 65 43 21",
        location: "92100 Boulogne-Billancourt, France"
      },
      renter: {
        name: "Sophie Leroy",
        email: "sophie.leroy@email.com",
        phone: "+33 6 55 44 33 22"
      },
      booking: {
        startDate: "2024-03-16",
        endDate: "2024-03-18",
        duration: "2 jours"
      },
      status: "investigating",
      priority: "medium",
      category: "unavailable",
      createdAt: "2024-03-18",
      deposit: 100,
      description: "L'outil n'était pas disponible au moment convenu pour la récupération.",
      ownerClaim: "Le locataire ne s'est pas présenté",
      renterResponse: "Le propriétaire n'était pas disponible à l'heure convenue",
      evidence: [],
      messages: 3,
      adminNotes: "Vérification des horaires en cours"
    },
    {
      id: "LIT-003",
      bookingId: "RES-008",
      tool: {
        title: "Scie circulaire Makita",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
        owner: "Thomas Blanc",
        ownerPhone: "+33 6 11 22 33 44",
        location: "69000 Lyon, France"
      },
      renter: {
        name: "Julie Moreau",
        email: "julie.moreau@email.com",
        phone: "+33 6 77 88 99 00"
      },
      booking: {
        startDate: "2024-03-13",
        endDate: "2024-03-15",
        duration: "2 jours"
      },
      status: "resolved",
      priority: "low",
      category: "payment",
      createdAt: "2024-03-15",
      deposit: 75,
      description: "Désaccord sur le montant de la caution à retourner.",
      ownerClaim: "Frais de nettoyage supplémentaires",
      renterResponse: "L'outil a été rendu propre",
      evidence: [],
      messages: 12,
      adminNotes: "Résolu : remboursement partiel de 60€",
      resolution: {
        ownerCompensation: 15,
        renterRefund: 60,
        adminFee: 0,
        resolutionDate: "2024-03-22"
      }
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="destructive">En attente</Badge>;
      case "RESOLVED":
        return <Badge className="bg-success text-success-foreground">Résolu</Badge>;
      case "CLOSED":
        return <Badge variant="secondary">Fermé</Badge>;
      case "REJECTED":
        return <Badge variant="outline">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-600 text-white">Haute</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 text-white">Moyenne</Badge>;
      case "low":
        return <Badge className="bg-green-500 text-white">Basse</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "damage":
        return <Badge className="bg-red-500 text-white">Dommage</Badge>;
      case "unavailable":
        return <Badge className="bg-blue-500 text-white">Indisponibilité</Badge>;
      case "payment":
        return <Badge className="bg-purple-500 text-white">Paiement</Badge>;
      case "other":
        return <Badge variant="outline">Autre</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const calculateDamageDistribution = (deposit: number, assessment: any) => {
    const totalDamagePercentage = assessment.cosmetic + assessment.functional + assessment.missing;
    const damageAmount = Math.round((deposit * totalDamagePercentage) / 100);
    const refundAmount = deposit - damageAmount;
    
    return {
      damageAmount,
      refundAmount,
      ownerCompensation: damageAmount,
      adminFee: 0
    };
  };

  const DisputeDetailsModal = ({ dispute }: { dispute: any }) => {
    const [localAssessment, setLocalAssessment] = useState({
      cosmetic: 0,
      functional: 0,
      missing: 0
    });
    
    const [resolution, setResolution] = useState("");
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    
    const distribution = calculateDamageDistribution(dispute.deposit, localAssessment);

    const openLightbox = (index: number) => {
      setSelectedImageIndex(index);
    };

    const closeLightbox = () => {
      setSelectedImageIndex(null);
    };

    const nextImage = () => {
      if (selectedImageIndex !== null && dispute.evidence && selectedImageIndex < dispute.evidence.length - 1) {
        setSelectedImageIndex(selectedImageIndex + 1);
      }
    };

    const prevImage = () => {
      if (selectedImageIndex !== null && selectedImageIndex > 0) {
        setSelectedImageIndex(selectedImageIndex - 1);
      }
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Litige {dispute.id}</DialogTitle>
            <DialogDescription>
              Gestion complète du litige et évaluation des dommages
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Informations principales */}
            <div className="lg:col-span-2 space-y-6">
              {/* Détails du litige */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Détails du litige
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Statut</Label>
                      <div className="mt-1">{getStatusBadge(dispute.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Caution</Label>
                      <p className="font-semibold">{dispute.deposit}€</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Motif du litige</Label>
                      <p className="text-gray-700 mt-1">{dispute.category === "damage" ? "Dommage" : dispute.category === "unavailable" ? "Indisponibilité" : dispute.category === "payment" ? "Paiement" : "Autre"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Signalé par</Label>
                      <p className="text-gray-700 mt-1">{dispute.reportedBy || "Propriétaire"}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="text-gray-700 mt-1">{dispute.description}</p>
                  </div>
                  
                  {/* Preuves jointes */}
                  {dispute.evidence && dispute.evidence.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600 mb-3 block">Preuves jointes</Label>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {dispute.evidence?.map((img, index) => (
                          <img 
                            key={index}
                            src={img} 
                            alt={`Preuve ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openLightbox(index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Informations des parties */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Initiateur</Label>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="font-medium">{dispute.initiator?.firstName && dispute.initiator?.lastName ? `${dispute.initiator.firstName} ${dispute.initiator.lastName}` : dispute.initiator?.displayName || 'N/A'}</p>
                        <p className="text-gray-600">{dispute.initiator?.email}</p>
                        <p className="text-gray-600">{dispute.initiator?.phoneNumber}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Répondant</Label>
                      <div className="mt-2 space-y-1 text-sm">
                        <p className="font-medium">{dispute.respondent?.firstName && dispute.respondent?.lastName ? `${dispute.respondent.firstName} ${dispute.respondent.lastName}` : dispute.respondent?.displayName || 'N/A'}</p>
                        <p className="text-gray-600">{dispute.respondent?.email}</p>
                        <p className="text-gray-600">{dispute.respondent?.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Outil concerné */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Outil concerné
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <img 
                      src={dispute.tool.image} 
                      alt={dispute.tool.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{dispute.tool.title}</h3>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{dispute.tool.location}</span>
                        </div>
                        <div className="mt-3">
                          <Label className="text-sm font-medium text-gray-600">Détails de la réservation</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-gray-500">Date de début:</span>
                              <p className="font-medium">{dispute.booking.startDate}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Date de fin:</span>
                              <p className="font-medium">{dispute.booking.endDate}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-gray-500">Durée totale:</span>
                              <p className="font-medium">{dispute.booking.duration}</p>
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
            <div className="space-y-6">
              {/* Grille d'évaluation des dégâts */}
              {dispute.category === "damage" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Évaluation des dommages
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Dommages esthétiques (0-30%)</Label>
                        <div className="mt-2">
                          <Slider
                            value={[localAssessment.cosmetic]}
                            onValueChange={(value) => setLocalAssessment(prev => ({...prev, cosmetic: value[0]}))}
                            max={30}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>0%</span>
                            <span className="font-medium">{localAssessment.cosmetic}%</span>
                            <span>30%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Problèmes fonctionnels (0-50%)</Label>
                        <div className="mt-2">
                          <Slider
                            value={[localAssessment.functional]}
                            onValueChange={(value) => setLocalAssessment(prev => ({...prev, functional: value[0]}))}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>0%</span>
                            <span className="font-medium">{localAssessment.functional}%</span>
                            <span>50%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Pièces manquantes (0-100%)</Label>
                        <div className="mt-2">
                          <Slider
                            value={[localAssessment.missing]}
                            onValueChange={(value) => setLocalAssessment(prev => ({...prev, missing: value[0]}))}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>0%</span>
                            <span className="font-medium">{localAssessment.missing}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calcul automatique */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">Répartition automatique de la caution</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="font-medium">Compensation propriétaire</div>
                          <div className="text-xl font-bold text-red-600">{distribution.damageAmount}€</div>
                          <div className="text-xs text-gray-600">
                            {((localAssessment.cosmetic + localAssessment.functional + localAssessment.missing))}% de {dispute.deposit}€
                          </div>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="font-medium">Remboursement locataire</div>
                          <div className="text-xl font-bold text-green-600">{distribution.refundAmount}€</div>
                          <div className="text-xs text-gray-600">
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Actions administrateur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dispute.status !== 'RESOLVED' && (
                    <div>
                      <Label htmlFor="resolution">Notes de résolution</Label>
                      <Textarea
                        id="resolution"
                        placeholder="Décrivez la résolution du litige..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="mt-2"
                        rows={4}
                      />
                    </div>
                  )}
                  
                  {dispute.status === 'RESOLVED' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Litige résolu</span>
                      </div>
                      {dispute.adminNotes && (
                        <p className="mt-2 text-green-700 text-sm">{dispute.adminNotes}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {dispute.status !== 'RESOLVED' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!resolution.trim()}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Résoudre le litige
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Résoudre le litige</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir marquer ce litige comme résolu ? Cette action ne peut pas être annulée.
                            </AlertDialogDescription>
                            {resolution && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <strong>Notes de résolution :</strong> {resolution}
                              </div>
                            )}
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleResolveDispute(dispute.id, resolution)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Résoudre
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {dispute.status !== 'CLOSED' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline">
                            <XCircle className="h-4 w-4 mr-2" />
                            Fermer le litige
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Fermer le litige</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir fermer ce litige ? Cette action ne peut pas être annulée.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleStatusChangeAction(dispute.id, 'CLOSED')}
                            >
                              Fermer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {dispute.status !== 'REJECTED' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rejeter le litige
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Rejeter le litige</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir rejeter ce litige ? Cette action ne peut pas être annulée.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleStatusChangeAction(dispute.id, 'REJECTED')}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Rejeter
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Lightbox pour les preuves */}
          {selectedImageIndex !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center">
              <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
                <button
                  onClick={closeLightbox}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                >
                  <X className="h-8 w-8" />
                </button>
                
                {dispute.evidence && dispute.evidence.length > 1 && selectedImageIndex > 0 && (
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
                  >
                    <ChevronLeft className="h-12 w-12" />
                  </button>
                )}
                
                {dispute.evidence && dispute.evidence.length > 1 && selectedImageIndex < dispute.evidence.length - 1 && (
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
                  >
                    <ChevronRight className="h-12 w-12" />
                  </button>
                )}
                
                <img
                  src={dispute.evidence[selectedImageIndex]}
                  alt={`Preuve ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                  {selectedImageIndex + 1} / {dispute.evidence?.length || 0}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // Use real data from API
  const displayDisputes = disputes;
  
  const filteredDisputes = displayDisputes.filter(dispute => {
    const matchesSearch = searchTerm === "" || 
      dispute.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.tool?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dispute.respondent?.firstName && dispute.respondent?.lastName ? `${dispute.respondent.firstName} ${dispute.respondent.lastName}` : dispute.respondent?.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dispute.initiator?.firstName && dispute.initiator?.lastName ? `${dispute.initiator.firstName} ${dispute.initiator.lastName}` : dispute.initiator?.displayName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || dispute.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || dispute.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Use API pagination if available, otherwise use client-side pagination
  const displayTotalPages = totalPages > 0 ? totalPages : Math.ceil(filteredDisputes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDisputes = disputes.length > 0 ? disputes : filteredDisputes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des litiges</h1>
          <p className="text-gray-600 mt-2">Résolvez les conflits et gérez les dommages</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            placeholder="Filtrer par date de création"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadDisputes();
              loadDisputeStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDisputes}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ouverts</p>
                <p className="text-2xl font-bold text-destructive">
                  {disputeStats?.openDisputes || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Résolus</p>
                <p className="text-2xl font-bold text-success">
                  {disputeStats?.resolvedDisputes || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fermés</p>
                <p className="text-2xl font-bold text-gray-600">
                  {disputeStats?.closedDisputes || 0}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-primary">{disputeStats?.totalDisputes || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par ID, outil ou partie..."
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
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="RESOLVED">Résolu</SelectItem>
                <SelectItem value="CLOSED">Fermé</SelectItem>
                <SelectItem value="REJECTED">Rejeté</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Litiges ({filteredDisputes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Litige</TableHead>
                  <TableHead className="hidden md:table-cell">Parties</TableHead>
                  <TableHead className="hidden lg:table-cell">Extrait</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <img 
                        src={dispute.tool?.image || '/placeholder.svg'} 
                        alt={dispute.tool?.title || 'Tool'}
                        className="w-16 h-12 object-cover rounded hidden sm:block"
                      />
                        <div>
                          <div className="font-medium text-primary">{dispute.id}</div>
                          <div className="text-sm text-gray-600 line-clamp-1">
                            {dispute.tool?.title || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(dispute.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        <div>Init: {dispute.initiator?.firstName && dispute.initiator?.lastName ? `${dispute.initiator.firstName} ${dispute.initiator.lastName}` : dispute.initiator?.displayName || 'N/A'}</div>
                        <div>Resp: {dispute.respondent?.firstName && dispute.respondent?.lastName ? `${dispute.respondent.firstName} ${dispute.respondent.lastName}` : dispute.respondent?.displayName || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm text-gray-600 max-w-xs">
                        {dispute.description.length > 40 
                          ? `${dispute.description.substring(0, 40)}...` 
                          : dispute.description
                        }
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DisputeDetailsModal dispute={dispute} />
                        
                        <div className="flex gap-1">
                          {dispute.status !== 'RESOLVED' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Résoudre le litige</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir marquer ce litige comme résolu ? Cette action ne peut pas être annulée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusChangeAction(dispute.id, 'RESOLVED')}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Résoudre
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {dispute.status !== 'CLOSED' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-gray-600 border-gray-600 hover:bg-gray-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Fermer le litige</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir fermer ce litige ? Cette action ne peut pas être annulée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusChangeAction(dispute.id, 'CLOSED')}
                                  >
                                    Fermer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {dispute.status !== 'REJECTED' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Rejeter le litige</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir rejeter ce litige ? Cette action ne peut pas être annulée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleStatusChangeAction(dispute.id, 'REJECTED')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Rejeter
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
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
              {disputes.length > 0 ? (
                `Affichage de ${((currentPage - 1) * itemsPerPage) + 1} à ${Math.min(currentPage * itemsPerPage, totalItems)} sur ${totalItems} litiges`
              ) : (
                `Affichage de ${startIndex + 1} à ${Math.min(startIndex + itemsPerPage, filteredDisputes.length)} sur ${filteredDisputes.length} litiges`
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} sur {displayTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, displayTotalPages))}
                disabled={currentPage === displayTotalPages || loading}
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

export default Disputes;