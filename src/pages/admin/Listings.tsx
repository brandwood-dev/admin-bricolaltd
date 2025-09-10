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
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  MapPin,
  Euro,
  Star,
  Package,
  User,
  Clock,
  AlertTriangle,
  Edit,
  Mail,
  Phone,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DateRange } from "react-day-picker";
import { toolsService, ToolStats } from "@/services/toolsService";
import { Tool, Category, Subcategory, ToolStatus, ToolCondition } from '@/types/unified-bridge';

// Composants Dialog définis en dehors du composant principal
const ApproveDialog = ({ listingId, onApprove }: any) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="default" size="sm" className="flex-1 sm:flex-none">
        <Check className="h-4 w-4 mr-2" />
        Approuver
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Approuver cette annonce</AlertDialogTitle>
        <AlertDialogDescription>
          Cette action publiera l'annonce et la rendra visible aux utilisateurs.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Annuler</AlertDialogCancel>
        <AlertDialogAction onClick={() => onApprove(listingId)}>
          Approuver
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const ListingDetailsModal = ({ listing }: { listing: any }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullListing, setFullListing] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  // Charger les détails complets de l'outil
  const loadFullListing = async () => {
    if (!listing?.id) return;
    
    setLoading(true);
    try {
      const response = await toolsService.getToolForAdmin(listing.id);
      setFullListing(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de l'outil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (fullListing?.images && fullListing.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === fullListing.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (fullListing?.images && fullListing.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? fullListing.images.length - 1 : prev - 1
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='flex-1 sm:flex-none'
          onClick={loadFullListing}
        >
          <Eye className='h-4 w-4 mr-2' />
          <span className='hidden sm:inline'>Voir détails</span>
          <span className='sm:hidden'>Détails</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg sm:text-xl font-bold'>
            {fullListing?.title || listing?.title || "Détails de l'outil"}
          </DialogTitle>
          <DialogDescription className='text-sm sm:text-base'>
            Informations complètes sur cet outil
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
            <span className='ml-2'>Chargement des détails...</span>
          </div>
        ) : fullListing ? (
          <div className='space-y-6'>
            {/* Images */}
            {fullListing.images && fullListing.images.length > 0 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Images</h3>
                <div className='relative'>
                  <img
                    src={fullListing.images[currentImageIndex]}
                    alt={`Image ${currentImageIndex + 1}`}
                    className='w-full h-64 sm:h-80 object-cover rounded-lg'
                  />
                  {fullListing.images.length > 1 && (
                    <>
                      <Button
                        variant='outline'
                        size='sm'
                        className='absolute left-2 top-1/2 transform -translate-y-1/2'
                        onClick={prevImage}
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        className='absolute right-2 top-1/2 transform -translate-y-1/2'
                        onClick={nextImage}
                      >
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                      <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm'>
                        {currentImageIndex + 1} / {fullListing.images.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Informations principales */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-600'>
                  Catégorie
                </Label>
                <p className='text-sm sm:text-base'>
                  {fullListing.category?.name || 'Non spécifiée'}
                </p>
              </div>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-600'>
                  Sous-catégorie
                </Label>
                <p className='text-sm sm:text-base'>
                  {fullListing.subcategory?.name || 'Non spécifiée'}
                </p>
              </div>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-600'>
                  Prix
                </Label>
                <p className='text-sm sm:text-base font-semibold'>
                  {fullListing.basePrice}€ / jour
                </p>
              </div>
              <div className='space-y-2'>
                <Label className='text-sm font-medium text-gray-600'>
                  Localisation
                </Label>
                <p className='text-sm sm:text-base'>
                  {fullListing.location || 'Non spécifiée'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-gray-600'>
                Description
              </Label>
              <p className='text-sm sm:text-base text-gray-700 whitespace-pre-wrap'>
                {fullListing.description || 'Aucune description disponible'}
              </p>
            </div>

            {/* Informations du propriétaire */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Propriétaire</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-600'>
                    Nom
                  </Label>
                  <p className='text-sm sm:text-base'>
                    {fullListing.owner?.firstName +
                      ' ' +
                      fullListing.owner?.lastName || 'Non spécifié'}
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-600'>
                    Email
                  </Label>
                  <p className='text-sm sm:text-base'>
                    {fullListing.owner?.email || 'Non spécifié'}
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-600'>
                    Téléphone
                  </Label>
                  <p className='text-sm sm:text-base'>
                    {fullListing.owner?.phone || 'Non spécifié'}
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-600'>
                    Note moyenne
                  </Label>
                  <div className='flex items-center gap-1'>
                    <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                    <span className='text-sm sm:text-base'>
                      {fullListing.owner?.averageRating || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statut et dates */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Informations système</h3>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-600'>
                    Statut
                  </Label>
                  <Badge
                    variant={
                      fullListing.toolStatus === ToolStatus.PUBLISHED
                        ? 'default'
                        : fullListing.toolStatus === ToolStatus.PENDING
                        ? 'secondary'
                        : 'destructive'
                    }
                    className='text-xs'
                  >
                    {fullListing.toolStatus === ToolStatus.PUBLISHED
                      ? 'Publié'
                      : fullListing.toolStatus === ToolStatus.PENDING
                      ? 'En attente'
                      : fullListing.toolStatus === ToolStatus.REJECTED
                      ? 'Rejeté'
                      : fullListing.toolStatus}
                  </Badge>
                </div>
                <div className='space-y-2'>
                  <Label className='text-sm font-medium text-gray-600'>
                    Date de création
                  </Label>
                  <p className='text-sm sm:text-base'>
                    {fullListing.createdAt
                      ? new Date(fullListing.createdAt).toLocaleDateString(
                          'fr-FR'
                        )
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className='text-center py-8'>
            <p className='text-gray-500'>
              Impossible de charger les détails de l'outil
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
};

// RejectDialog component - moved outside Listings component  
const RejectDialog = ({ listingId, onReject }: any) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  
  const rejectionReasons = [
    "Contenu inapproprié",
    "Informations incomplètes",
    "Prix non conforme",
    "Photos de mauvaise qualité",
    "Description insuffisante",
    "Autre (préciser ci-dessous)"
  ];

  const handleReject = () => {
    const reason = selectedReason === "Autre (préciser ci-dessous)" ? customMessage : selectedReason;
    onReject(listingId, reason);
    setSelectedReason("");
    setCustomMessage("");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="flex-1 sm:flex-none">
          <X className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Rejeter</span>
          <span className="sm:hidden">Refuser</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base sm:text-lg">Rejeter cette annonce</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Veuillez sélectionner une raison pour le rejet de cette annonce.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">Raison du rejet</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Sélectionner une raison" />
              </SelectTrigger>
              <SelectContent>
                {rejectionReasons.map((reason) => (
                  <SelectItem key={reason} value={reason} className="text-sm">
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedReason === "Autre (préciser ci-dessous)" && (
            <div className="space-y-2">
              <Label htmlFor="custom-message" className="text-sm font-medium">Message personnalisé</Label>
              <Textarea
                id="custom-message"
                placeholder="Précisez la raison du rejet..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="text-sm"
                rows={3}
              />
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="text-sm">Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleReject}
            disabled={!selectedReason || (selectedReason === "Autre (préciser ci-dessous)" && !customMessage.trim())}
            className="text-sm"
          >
            Rejeter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// DeleteDialog component - moved outside Listings component
const DeleteDialog = ({ listingId, onDelete, reason, setReason }: any) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
        <Trash2 className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Supprimer</span>
        <span className="sm:hidden">Suppr.</span>
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-base sm:text-lg">Supprimer cette annonce</AlertDialogTitle>
        <AlertDialogDescription className="text-sm">
          Cette action est irréversible. Veuillez justifier la suppression.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="delete-reason" className="text-sm">Motif de suppression</Label>
          <Textarea
            id="delete-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Expliquez pourquoi cette annonce doit être supprimée..."
            rows={3}
            className="text-sm"
          />
        </div>
      </div>
      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
        <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
        <AlertDialogAction
          onClick={() => onDelete(listingId, reason)}
          className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
          disabled={!reason.trim()}
        >
          Supprimer définitivement
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

// RejectDialog component - moved outside Listings component


const Listings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [stats, setStats] = useState<ToolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTools, setTotalTools] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Load categories from API
  const loadCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const response = await toolsService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des catégories');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Use mock data when API is not available
      const mockCategories = [
        { id: '1', name: 'outillage-electrique', displayName: 'Outillage électrique' },
        { id: '2', name: 'materiel-construction', displayName: 'Matériel de construction' },
        { id: '3', name: 'jardinage', displayName: 'Jardinage' },
        { id: '4', name: 'vehicules', displayName: 'Véhicules' },
      ];
      setCategories(mockCategories);
      
      // Only show error toast if it's not a network error (API unavailable)
      if (!error.message?.includes('Network Error') && !error.message?.includes('ERR_NETWORK')) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des catégories';
        setCategoriesError(errorMessage);
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Load all subcategories from API
  const loadAllSubcategories = async () => {
    try {
      const response = await toolsService.getAllSubcategories();
      if (response.success && response.data) {
        setSubcategories(response.data);
        setFilteredSubcategories(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des sous-catégories');
      }
    } catch (error) {
      console.error('Error loading subcategories:', error);
      // Use mock data when API is not available
      const mockSubcategories = [
        { id: '1', name: 'perceuses', displayName: 'Perceuses', categoryId: '1' },
        { id: '2', name: 'scies', displayName: 'Scies', categoryId: '1' },
        { id: '3', name: 'ponceuses', displayName: 'Ponceuses', categoryId: '1' },
        { id: '4', name: 'betonnieres', displayName: 'Bétonnières', categoryId: '2' },
        { id: '5', name: 'echafaudages', displayName: 'Échafaudages', categoryId: '2' },
      ];
      setSubcategories(mockSubcategories);
      setFilteredSubcategories(mockSubcategories);
      
      // Only show error toast if it's not a network error (API unavailable)
      if (!error.message?.includes('Network Error') && !error.message?.includes('ERR_NETWORK')) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des sous-catégories';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  // Load subcategories for a specific category
  const loadSubcategoriesByCategory = async (categoryId: string) => {
    try {
      const response = await toolsService.getSubcategoriesByCategory(categoryId);
      if (response.success && response.data) {
        setFilteredSubcategories(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des sous-catégories');
      }
    } catch (error) {
      console.error('Error loading subcategories for category:', error);
      // Filter mock data by category when API is not available
      const mockSubcategories = [
        { id: '1', name: 'perceuses', displayName: 'Perceuses', categoryId: '1' },
        { id: '2', name: 'scies', displayName: 'Scies', categoryId: '1' },
        { id: '3', name: 'ponceuses', displayName: 'Ponceuses', categoryId: '1' },
        { id: '4', name: 'betonnieres', displayName: 'Bétonnières', categoryId: '2' },
        { id: '5', name: 'echafaudages', displayName: 'Échafaudages', categoryId: '2' },
      ];
      const filtered = mockSubcategories.filter(sub => sub.categoryId === categoryId);
      setFilteredSubcategories(filtered);
      
      // Only show error toast if it's not a network error (API unavailable)
      if (!error.message?.includes('Network Error') && !error.message?.includes('ERR_NETWORK')) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des sous-catégories';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  // Load tools data from API
  const loadTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = {
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        subcategoryId: subcategoryFilter !== "all" ? subcategoryFilter : undefined,
        startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
        page: currentPage,
        limit: itemsPerPage
      };

      const response = await toolsService.getToolsForAdmin(filters);
      if (response.success) {
        setTools(response.data.data);
        setTotalPages(response.data.totalPages);
        setTotalTools(response.data.total);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des outils');
      }
    } catch (error) {
      console.error('Error loading tools:', error);
      // Use mock data when API is not available
      const mockTools = [
        {
          id: '1',
          title: 'Perceuse Bosch Professional',
          description: 'Perceuse électrique professionnelle avec batterie',
          brand: 'Bosch',
          model: 'GSR 18V-60 C',
          year: 2023,
          condition: 'Excellent',
          pickupAddress: 'Paris 15ème',
          basePrice: 25,
          depositAmount: 150,
          toolStatus: 'PUBLISHED',
          availabilityStatus: 'AVAILABLE',
          category: { id: '1', name: 'Outillage électrique' },
          subcategory: { id: '1', name: 'Perceuses' },
          owner: { id: '1', firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@email.com' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Scie circulaire Makita',
          description: 'Scie circulaire portative pour découpe précise',
          brand: 'Makita',
          model: 'HS7601',
          year: 2022,
          condition: 'Bon',
          pickupAddress: 'Lyon 3ème',
          basePrice: 30,
          depositAmount: 200,
          toolStatus: 'UNDER_REVIEW',
          availabilityStatus: 'AVAILABLE',
          category: { id: '1', name: 'Outillage électrique' },
          subcategory: { id: '2', name: 'Scies' },
          owner: { id: '2', firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@email.com' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setTools(mockTools);
      setTotalPages(1);
      setTotalTools(mockTools.length);
      
      // Only show error toast if it's not a network error (API unavailable)
      if (!error.message?.includes('Network Error') && !error.message?.includes('ERR_NETWORK')) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement des outils';
        setError(errorMessage);
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await toolsService.getToolStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Use mock stats when API is not available
      const mockStats = {
        total: 2,
        published: 1,
        pending: 1,
        rejected: 0,
        archived: 0
      };
      setStats(mockStats);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadTools();
  }, [searchTerm, statusFilter, categoryFilter, subcategoryFilter, dateRange, currentPage]);

  useEffect(() => {
    loadStats();
    loadCategories();
    loadAllSubcategories();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (categoryFilter === "all") {
      // Show all subcategories when no category is selected
      setFilteredSubcategories(subcategories);
    } else {
      // Load subcategories for the selected category from API
      loadSubcategoriesByCategory(categoryFilter);
    }
    // Reset subcategory filter when category changes
    if (subcategoryFilter !== "all") {
      setSubcategoryFilter("all");
    }
  }, [categoryFilter, subcategories]);

  // Handle tool approval
  const handleApproveTool = async (toolId: string) => {
    try {
      const response = await toolsService.approveTool(toolId);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Outil approuvé avec succès"
        });
        loadTools();
        loadStats();
      } else {
        throw new Error(response.message || 'Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Error approving tool:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible d\'approuver l\'outil';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Handle tool rejection
  const handleRejectTool = async (toolId: string, reason: string) => {
    try {
      const response = await toolsService.rejectTool(toolId, reason);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Outil rejeté avec succès"
        });
        loadTools();
        loadStats();
        setRejectionReason("");
      } else {
        throw new Error(response.message || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Error rejecting tool:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de rejeter l\'outil';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  // Handle tool deletion
  const handleDeleteTool = async (toolId: string) => {
    try {
      const response = await toolsService.deleteTool(toolId);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Outil supprimé avec succès"
        });
        loadTools();
        loadStats();
        setDeletionReason("");
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de supprimer l\'outil';
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge className="bg-success text-success-foreground">Publiée</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-warning text-warning-foreground">En attente</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejetée</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Brouillon</Badge>;
      case "ARCHIVED":
        return <Badge variant="outline">Archivée</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "Excellent":
        return <Badge className="bg-success text-success-foreground">Excellent</Badge>;
      case "Bon":
        return <Badge className="bg-blue-500 text-white">Bon</Badge>;
      case "Correct":
        return <Badge className="bg-yellow-500 text-white">Correct</Badge>;
      case "Défectueux":
        return <Badge variant="destructive">Défectueux</Badge>;
      default:
        return <Badge variant="outline">Non spécifié</Badge>;
    }
  };

  const handleApprove = async (listingId: string) => {
    await handleApproveTool(listingId);
  };



  const handleReject = async (listingId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier un motif de rejet.",
        variant: "destructive",
      });
      return;
    }
    await handleRejectTool(listingId, reason);
  };

  const handleDelete = async (listingId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier une justification pour la suppression.",
        variant: "destructive",
      });
      return;
    }
    await handleDeleteTool(listingId);
  };







  // Pagination info
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalTools);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des annonces</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Modérez et gérez les annonces d'outils</p>
        </div>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
          placeholder="Filtrer par date de création"
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-warning">
                  {stats?.pending || 0}
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
                <p className="text-sm text-gray-600">Publiées</p>
                <p className="text-2xl font-bold text-success">
                  {stats?.published || 0}
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
                <p className="text-sm text-gray-600">Rejetées</p>
                <p className="text-2xl font-bold text-destructive">
                  {stats?.rejected || 0}
                </p>
              </div>
              <X className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par titre ou propriétaire..."
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
                <SelectItem value="UNDER_REVIEW">En attente</SelectItem>
                <SelectItem value="PUBLISHED">Publiée</SelectItem>
                <SelectItem value="REJECTED">Rejetée</SelectItem>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="ARCHIVED">Archivée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.map((category) => (
                   <SelectItem key={category.id} value={category.id}>
                     {category.displayName || category.name}
                   </SelectItem>
                 ))}
              </SelectContent>
            </Select>
            <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sous-catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sous-catégories</SelectItem>
                {filteredSubcategories.map((subcategory) => (
                   <SelectItem key={subcategory.id} value={subcategory.id}>
                     {subcategory.displayName || subcategory.name}
                   </SelectItem>
                 ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Annonces ({totalTools})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-8 text-red-600">
              <AlertTriangle className="h-6 w-6 mr-2" />
              <div>
                <p className="font-medium">Erreur de chargement</p>
                <p className="text-sm text-gray-600">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setError(null);
                    loadTools();
                  }}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}

          {!error && loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des annonces...</span>
            </div>
          ) : !error && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outil</TableHead>
                    <TableHead className="hidden md:table-cell">Propriétaire</TableHead>
                    <TableHead className="hidden lg:table-cell">Catégorie</TableHead>
                    <TableHead className="hidden xl:table-cell">Sous-catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className="flex items-start gap-3">
                          {listing.images && listing.images.length > 0 && (
                            <img 
                              src={listing.images[0]} 
                              alt={listing.title}
                              className="w-16 h-12 object-cover rounded hidden sm:block"
                            />
                          )}
                          <div>
                            <div className="font-medium line-clamp-2">{listing.title}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {listing.location}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {listing.owner ? `${listing.owner.firstName} ${listing.owner.lastName}` : 'N/A'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{listing.category?.displayName || listing.category?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Badge variant="secondary">{listing.subcategory?.displayName || listing.subcategory?.name || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {listing.pricePerDay}/j
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(listing.toolStatus)}</TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                         <ListingDetailsModal listing={listing} />
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalTools)} sur {totalTools} annonces
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Listings;