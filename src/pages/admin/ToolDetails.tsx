import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  ArrowLeft,
  Check,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
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
  Loader2,
  ImageIcon,
  SquarePen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toolsService } from "@/services/toolsService";
import { Tool } from '@/types/unified-bridge';

const getConditionText = (condition: string | number) => {
  const conditionMap: { [key: string]: string } = {
    'NEW': 'Neuf',
    'LIKE_NEW': 'Comme neuf',
    'GOOD': 'Bon état',
    'FAIR': 'État correct',
    'POOR': 'Mauvais état',
    '1': 'Neuf',
    '2': 'Comme neuf', 
    '3': 'Bon état',
    '4': 'État correct',
    '5': 'Mauvais état'
  };
  
  return conditionMap[condition?.toString()] || condition?.toString() || 'N/A';
};

const ToolDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deletionReason, setDeletionReason] = useState('');

  useEffect(() => {
    if (id) {
      loadToolDetails();
    }
  }, [id]);

  const loadToolDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await toolsService.getToolForAdmin(id);
      setTool(response.data);
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

  const handleApprove = async () => {
    if (!tool) return;
    
    try {
      await toolsService.approveTool(tool.id);
      toast({
        title: "Succès",
        description: "L'outil a été approuvé avec succès",
      });
      loadToolDetails(); // Recharger les données
      setShowApproveDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'approuver l'outil",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!tool || !rejectionReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une raison de rejet.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await toolsService.rejectTool(tool.id, rejectionReason);
      toast({
        title: "Succès",
        description: "L'outil a été rejeté",
      });
      loadToolDetails(); // Recharger les données
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter l'outil",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!tool) return;
    
    try {
      await toolsService.deleteTool(tool.id);
      toast({
        title: "Succès",
        description: "L'outil a été supprimé définitivement",
      });
      navigate('/admin/listings'); // Retourner à la liste
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'outil",
        variant: "destructive",
      });
    }
  };

  // Obtenir toutes les images
  const getAllImages = () => {
    const images = [];
    
    if (tool?.photos && Array.isArray(tool.photos)) {
      images.push(...tool.photos.map(photo => photo.url));
    } else if (tool?.imageUrl) {
      images.push(tool.imageUrl);
    }
    
    return images;
  };

  const allImages = getAllImages();

  const nextImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === allImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? allImages.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin" />
        <span className="ml-3 text-lg">Chargement des détails...</span>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Outil non trouvé</h2>
        <p className="text-gray-600 mb-4">L'outil demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate('/admin/listings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const canShowConfirmButton = tool.moderationStatus === 'Pending' || tool.moderationStatus === 'Rejected';
  const canShowRejectButton = tool.moderationStatus === 'Pending' || tool.moderationStatus === 'Confirmed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/listings')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tool.title}</h1>
            <p className="text-gray-600">Détails de l'outil</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {/* TODO: Ouvrir modal de modification */}}
          >
            <SquarePen className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          
          {canShowConfirmButton && (
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="default">
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
                  <AlertDialogAction onClick={handleApprove}>
                    Approuver
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {canShowRejectButton && (
            <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rejeter cette annonce</AlertDialogTitle>
                  <AlertDialogDescription>
                    Veuillez sélectionner une raison pour le rejet de cette annonce.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rejection-reason">Motif de rejet</Label>
                    <Select value={rejectionReason} onValueChange={setRejectionReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un motif" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inappropriate_content">Contenu inapproprié</SelectItem>
                        <SelectItem value="poor_quality_images">Images de mauvaise qualité</SelectItem>
                        <SelectItem value="incomplete_description">Description incomplète</SelectItem>
                        <SelectItem value="suspicious_activity">Activité suspecte</SelectItem>
                        <SelectItem value="policy_violation">Violation des conditions</SelectItem>
                        <SelectItem value="duplicate_listing">Annonce en double</SelectItem>
                        <SelectItem value="other">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReject} className="bg-destructive hover:bg-destructive/90">
                    Rejeter
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer cette annonce</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Veuillez justifier la suppression.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-reason">Motif de suppression</Label>
                  <Textarea
                    id="delete-reason"
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    placeholder="Expliquez pourquoi cette annonce doit être supprimée..."
                    rows={3}
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={!deletionReason.trim()}
                >
                  Supprimer définitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Photos de l'outil
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allImages.length > 0 ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`Image ${currentImageIndex + 1}`}
                    className="w-full h-96 object-cover rounded-lg border"
                  />
                  {allImages.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {allImages.length}
                      </div>
                    </>
                  )}
                </div>
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded border-2 overflow-hidden ${
                          index === currentImageIndex ? 'border-primary' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Miniature ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucune image disponible</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations détaillées */}
        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Catégorie</Label>
                  <Badge variant="outline" className="mt-1">
                    {tool.category?.displayName || tool.category?.name || 'N/A'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Sous-catégorie</Label>
                  {tool.subcategory && (
                    <Badge variant="secondary" className="mt-1">
                      {tool.subcategory?.displayName || tool.subcategory?.name}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Prix de base</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Euro className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">
                      {tool.basePrice}€/jour
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Caution</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Euro className="h-4 w-4 text-orange-600" />
                    <span className="font-semibold text-orange-600">
                      {tool.depositAmount}€
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">État</Label>
                <Badge variant="outline" className="mt-1">
                  {getConditionText(tool.condition)}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Adresse de récupération</Label>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <span className="text-sm">
                    {tool.pickupAddress || 'Non spécifiée'}
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                  {tool.description || 'Aucune description'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Propriétaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Propriétaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Nom complet</Label>
                <p className="text-sm font-medium">
                  {tool.owner ? `${tool.owner.firstName} ${tool.owner.lastName}` : 'N/A'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{tool.owner?.email || 'N/A'}</span>
                </div>
              </div>
              {tool.owner?.phone && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{tool.owner.phone}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statuts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Statuts et dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Statut de l'outil</Label>
                  <Badge 
                    variant={
                      tool.toolStatus === 'PUBLISHED' ? 'default' :
                      tool.toolStatus === 'DRAFT' ? 'secondary' :
                      tool.toolStatus === 'UNDER_REVIEW' ? 'outline' : 'destructive'
                    }
                    className="mt-1"
                  >
                    {tool.toolStatus === 'PUBLISHED' ? 'Publié' :
                     tool.toolStatus === 'DRAFT' ? 'Brouillon' :
                     tool.toolStatus === 'UNDER_REVIEW' ? 'En révision' :
                     tool.toolStatus === 'ARCHIVED' ? 'Archivé' : tool.toolStatus}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Modération</Label>
                  <Badge
                    variant={
                      tool.moderationStatus === 'Confirmed' ? 'default' :
                      tool.moderationStatus === 'Rejected' ? 'destructive' : 'secondary'
                    }
                    className="mt-1"
                  >
                    {tool.moderationStatus === 'Confirmed' ? 'Confirmé' :
                     tool.moderationStatus === 'Rejected' ? 'Rejeté' :
                     tool.moderationStatus === 'Pending' ? 'En attente' : tool.moderationStatus}
                  </Badge>
                </div>
              </div>
              
              {tool.rejectionReason && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Raison du rejet</Label>
                  <p className="text-sm text-red-600 mt-1">{tool.rejectionReason}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Date de création</Label>
                <p className="text-sm">
                  {new Date(tool.createdAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              
              {tool.publishedAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date de publication</Label>
                  <p className="text-sm">
                    {new Date(tool.publishedAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ToolDetails;