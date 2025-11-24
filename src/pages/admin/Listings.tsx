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
  Loader2,
  AlertCircle,
  ImageIcon,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DateRange } from 'react-day-picker'
import { toolsService, ToolStats } from '@/services/toolsService'
import {
  Tool,
  Category,
  Subcategory,
  ToolStatus,
  ToolCondition,
} from '@/types/unified-bridge'

// Fonction utilitaire pour convertir les conditions
const getConditionText = (condition: string | number) => {
  // Gestion des valeurs numériques selon ToolCondition enum
  const numericConditionMap: { [key: number]: string } = {
    1: 'Neuf',
    2: 'Comme neuf',
    3: 'Bon',
    4: 'Correct',
    5: 'Usé',
  }

  // Gestion des valeurs textuelles
  const textConditionMap: { [key: string]: string } = {
    NEW: 'Neuf',
    LIKE_NEW: 'Comme neuf',
    GOOD: 'Bon',
    FAIR: 'Correct',
    POOR: 'Usé',
    Excellent: 'Excellent',
    Bon: 'Bon',
    Correct: 'Correct',
    Défectueux: 'Défectueux',
  }

  // Vérifier d'abord si c'est un nombre
  const numCondition = Number(condition)
  if (!isNaN(numCondition) && numericConditionMap[numCondition]) {
    return numericConditionMap[numCondition]
  }

  // Sinon, traiter comme texte
  const conditionStr = String(condition).toUpperCase()
  return (
    textConditionMap[conditionStr] ||
    textConditionMap[String(condition)] ||
    condition?.toString() ||
    'N/A'
  )
}

// Composants Dialog définis en dehors du composant principal
const ApproveDialog = ({ listingId, onApprove }: any) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant='default' size='sm' className='flex-1 sm:flex-none'>
        <Check className='h-4 w-4' />
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
)

const ListingDetailsModal = ({
  listing,
  onApprove,
  onReject,
  onDelete,
}: {
  listing: any
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  onDelete: (id: string, reason: string) => void
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [fullListing, setFullListing] = useState<Tool | null>(null)
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [deletionReason, setDeletionReason] = useState('')
  const { toast } = useToast()

  // Charger les détails complets de l'outil
  const loadFullListing = async () => {
    if (!listing?.id) return

    setLoading(true)
    try {
      const response = await toolsService.getToolForAdmin(listing.id)
      console.log('Full listing data received:', response.data)
      console.log('ModerationStatus:', response.data?.moderationStatus)
      console.log('ToolStatus:', response.data?.toolStatus)
      console.log('Photos:', response.data?.photos)
      setFullListing(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error)
      toast({
        title: 'Erreur',
        description: "Impossible de charger les détails de l'outil",
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtenir toutes les images (photos + imageUrl de fallback)
  const getAllImages = () => {
    const images = []

    // Priorité aux photos du fullListing si disponibles
    if (fullListing?.photos && Array.isArray(fullListing.photos)) {
      images.push(...fullListing.photos.map((photo) => photo.url))
    } else if (fullListing?.imageUrl) {
      images.push(fullListing.imageUrl)
    }

    // Fallback sur les photos du listing initial
    if (
      images.length === 0 &&
      listing?.photos &&
      Array.isArray(listing.photos)
    ) {
      images.push(...listing.photos.map((photo) => photo.url))
    }

    return images
  }

  const allImages = getAllImages()

  const nextImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === allImages.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? allImages.length - 1 : prev - 1
      )
    }
  }

  const handleConfirm = () => {
    onApprove(listing.id)
    setShowApproveDialog(false)
    setIsOpen(false)
  }

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une raison de rejet.',
        variant: 'destructive',
      })
      return
    }
    onReject(listing.id, rejectionReason)
    setShowRejectDialog(false)
    setRejectionReason('')
    setIsOpen(false)
  }

  const handleDeleteSubmit = () => {
    onDelete(listing.id, deletionReason)
    setShowDeleteDialog(false)
    setDeletionReason('')
    setIsOpen(false)
  }

  const canShowConfirmButton =
    fullListing?.moderationStatus === 'Pending' ||
    fullListing?.moderationStatus === 'Rejected'
  const canShowRejectButton =
    fullListing?.moderationStatus === 'Pending' ||
    fullListing?.moderationStatus === 'Confirmed'

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant='outline'
            size='sm'
            className='flex-1 sm:flex-none'
            onClick={loadFullListing}
          >
            <Eye className='h-4 w-4' />
          </Button>
        </DialogTrigger>
        <DialogContent className='max-w-7xl h-[95vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold'>
              {fullListing?.title || listing?.title || "Détails de l'outil"}
            </DialogTitle>
            <DialogDescription className='text-base'>
              Informations complètes sur cet outil
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-12 w-12 animate-spin' />
              <span className='ml-3 text-lg'>Chargement des détails...</span>
            </div>
          ) : fullListing ? (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              {/* Section Images */}
              <div className='space-y-6'>
                <div className='space-y-4'>
                  <h3 className='text-xl font-semibold flex items-center gap-2'>
                    <ImageIcon className='h-5 w-5' />
                    Photos de l'outil
                  </h3>
                  {allImages.length > 0 ? (
                    <div className='space-y-4'>
                      <div className='relative'>
                        <img
                          src={allImages[currentImageIndex]}
                          alt={`Image ${currentImageIndex + 1}`}
                          className='w-full h-96 object-cover rounded-lg border'
                        />
                        {allImages.length > 1 && (
                          <>
                            <Button
                              variant='outline'
                              size='sm'
                              className='absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white'
                              onClick={prevImage}
                            >
                              <ChevronLeft className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              className='absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white'
                              onClick={nextImage}
                            >
                              <ChevronRight className='h-4 w-4' />
                            </Button>
                            <div className='absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm'>
                              {currentImageIndex + 1} / {allImages.length}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Miniatures */}
                      {allImages.length > 1 && (
                        <div className='flex gap-2 overflow-x-auto pb-2'>
                          {allImages.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                index === currentImageIndex
                                  ? 'border-blue-500'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img
                                src={image}
                                alt={`Miniature ${index + 1}`}
                                className='w-full h-full object-cover'
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='flex items-center justify-center h-96 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300'>
                      <div className='text-center text-gray-500'>
                        <ImageIcon className='h-12 w-12 mx-auto mb-2' />
                        <p>Aucune image disponible</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions de modération */}
                <div className='space-y-4'>
                  <h3 className='text-xl font-semibold'>
                    Actions de modération
                  </h3>
                  <div className='flex flex-col gap-3'>
                    {canShowConfirmButton && (
                      <Button
                        onClick={() => setShowApproveDialog(true)}
                        className='w-full'
                        size='lg'
                      >
                        <Check className='h-4 w-4 mr-2' />
                        Confirmer l'outil
                      </Button>
                    )}

                    {canShowRejectButton && (
                      <Button
                        onClick={() => setShowRejectDialog(true)}
                        variant='destructive'
                        className='w-full'
                        size='lg'
                      >
                        <X className='h-4 w-4 mr-2' />
                        Rejeter l'outil
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Section Informations */}
              <div className='space-y-6'>
                {/* Informations principales */}
                <div className='space-y-4'>
                  <h3 className='text-xl font-semibold flex items-center gap-2'>
                    <Package className='h-5 w-5' />
                    Informations principales
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-lg space-y-3'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label className='text-sm font-medium text-gray-600'>
                          Catégorie
                        </Label>
                        <p className='text-sm'>
                          {fullListing.category?.displayName ||
                            fullListing.category?.name ||
                            'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className='text-sm font-medium text-gray-600'>
                          Sous-catégorie
                        </Label>
                        <p className='text-sm'>
                          {fullListing.subcategory?.displayName ||
                            fullListing.subcategory?.name ||
                            'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label className='text-sm font-medium text-gray-600'>
                          Prix de base
                        </Label>
                        <p className='text-sm font-semibold text-green-600'>
                          {fullListing.basePrice
                            ? `${fullListing.basePrice}€/jour`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className='text-sm font-medium text-gray-600'>
                          Condition
                        </Label>
                        <Badge variant='outline'>
                          {getConditionText(fullListing.condition)}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Localisation
                      </Label>
                      <p className='text-sm flex items-center gap-1'>
                        <MapPin className='h-3 w-3' />
                        {fullListing.pickupAddress ||
                          fullListing.location ||
                          fullListing.address ||
                          'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className='space-y-4'>
                  <h3 className='text-xl font-semibold'>Description</h3>
                  <div className='bg-gray-50 p-4 rounded-lg'>
                    <p className='text-sm whitespace-pre-wrap'>
                      {fullListing.description ||
                        'Aucune description disponible'}
                    </p>
                  </div>
                </div>

                {/* Propriétaire */}
                <div className='space-y-4'>
                  <h3 className='text-xl font-semibold flex items-center gap-2'>
                    <User className='h-5 w-5' />
                    Propriétaire
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-lg space-y-3'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label className='text-sm font-medium text-gray-600'>
                          Nom
                        </Label>
                        <p className='text-sm'>
                          {fullListing.owner
                            ? `${fullListing.owner.firstName} ${fullListing.owner.lastName}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <Label className='text-sm font-medium text-gray-600'>
                          Email
                        </Label>
                        <p className='text-sm flex items-center gap-1'>
                          <Mail className='h-3 w-3' />
                          {fullListing.owner?.email || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Téléphone
                      </Label>
                      <p className='text-sm flex items-center gap-1'>
                        <Phone className='h-3 w-3' />
                        {fullListing.owner?.phoneNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statuts */}
                <div className='space-y-4'>
                  <h3 className='text-xl font-semibold flex items-center gap-2'>
                    <Clock className='h-5 w-5' />
                    Statuts et informations système
                  </h3>
                  <div className='bg-gray-50 p-4 rounded-lg space-y-3'>
                    <div className='grid grid-cols-2 gap-4'>
                      <div>
                        <Label className='text-sm font-medium text-gray-600'>
                          Statut de l'outil
                        </Label>
                        <div className='mt-1'>
                          {fullListing.toolStatus === 'PUBLISHED' && (
                            <Badge className='bg-green-100 text-green-800'>
                              Publié
                            </Badge>
                          )}
                          {fullListing.toolStatus === 'DRAFT' && (
                            <Badge variant='secondary'>Brouillon</Badge>
                          )}
                          {fullListing.toolStatus === 'UNDER_REVIEW' && (
                            <Badge className='bg-yellow-100 text-yellow-800'>
                              En révision
                            </Badge>
                          )}
                          {fullListing.toolStatus === 'ARCHIVED' && (
                            <Badge variant='outline'>Archivé</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className='text-sm font-medium text-gray-600'>
                          Statut de modération
                        </Label>
                        <div className='mt-1'>
                          {fullListing.moderationStatus === 'Confirmed' && (
                            <Badge className='bg-green-100 text-green-800'>
                              Confirmé
                            </Badge>
                          )}
                          {fullListing.moderationStatus === 'Pending' && (
                            <Badge className='bg-yellow-100 text-yellow-800'>
                              En attente
                            </Badge>
                          )}
                          {fullListing.moderationStatus === 'Rejected' && (
                            <Badge variant='destructive'>Rejeté</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Raison de rejet si l'outil est rejeté */}
                    {fullListing.moderationStatus === 'Rejected' &&
                      fullListing.rejectionReason && (
                        <div>
                          <Label className='text-sm font-medium text-gray-600'>
                            Raison du rejet
                          </Label>
                          <div className='mt-1 p-3 bg-red-50 border border-red-200 rounded-lg'>
                            <p className='text-sm text-red-800'>
                              {fullListing.rejectionReason}
                            </p>
                          </div>
                        </div>
                      )}

                    <div>
                      <Label className='text-sm font-medium text-gray-600'>
                        Date de création
                      </Label>
                      <p className='text-sm'>
                        {fullListing.createdAt
                          ? new Date(fullListing.createdAt).toLocaleDateString(
                              'fr-FR',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className='flex items-center justify-center py-12 text-gray-500'>
              <AlertCircle className='h-8 w-8 mr-2' />
              <span>Impossible de charger les détails de l'outil</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer cet outil</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action confirmera l'outil et le rendra disponible pour
              publication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de rejet */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter cet outil</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action rejettera l'outil. Veuillez sélectionner une raison.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <Label htmlFor='rejection-reason'>Raison du rejet *</Label>
            <Select value={rejectionReason} onValueChange={setRejectionReason}>
              <SelectTrigger className='mt-2'>
                <SelectValue placeholder='Sélectionner une raison' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='inappropriate_content'>
                  Contenu inapproprié
                </SelectItem>
                <SelectItem value='poor_quality_photos'>
                  Poor Quality Photos
                </SelectItem>
                <SelectItem value='insufficient_description'>
                  Insufficient Description
                </SelectItem>
                <SelectItem value='non_compliant_price'>
                  Non-Compliant Price
                </SelectItem>
                <SelectItem value='incomplete_information'>
                  Incomplete Information
                </SelectItem>
                <SelectItem value='false_or_misleading_information'>
                  False or Misleading Information
                </SelectItem>
               
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectSubmit}
              className='bg-red-600 hover:bg-red-700'
              disabled={!rejectionReason}
            >
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet outil</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement l'outil. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <Label htmlFor='deletion-reason'>
              Raison de la suppression (optionnel)
            </Label>
            <Textarea
              id='deletion-reason'
              value={deletionReason}
              onChange={(e) => setDeletionReason(e.target.value)}
              placeholder='Expliquez pourquoi cet outil est supprimé...'
              className='mt-2'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubmit}
              className='bg-red-600 hover:bg-red-700'
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// RejectDialog component - moved outside Listings component
const RejectDialog = ({ listingId, onReject }: any) => {
  const [selectedReason, setSelectedReason] = useState('')
  const [customMessage, setCustomMessage] = useState('')

 

  const handleReject = () => {
    const reason =
      selectedReason === 'Autre (préciser ci-dessous)'
        ? customMessage
        : selectedReason
    onReject(listingId, reason)
    setSelectedReason('')
    setCustomMessage('')
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='destructive' size='sm' className='flex-1 sm:flex-none'>
          <X className='h-4 w-4' />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className='max-w-[95vw] sm:max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-base sm:text-lg'>
            Rejeter cette annonce
          </AlertDialogTitle>
          <AlertDialogDescription className='text-sm'>
            Veuillez sélectionner une raison pour le rejet de cette annonce.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='reason' className='text-sm font-medium'>
              Raison du rejet
            </Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger className='text-sm'>
                <SelectValue placeholder='Sélectionner une raison' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='inappropriate_content'>
                  Inappropriate Content
                </SelectItem>
                <SelectItem value='poor_quality_photos'>
                  Poor Quality Photos
                </SelectItem>
                <SelectItem value='insufficient_description'>
                  Insufficient Description
                </SelectItem>
                <SelectItem value='non_compliant_price'>
                  Non-Compliant Price
                </SelectItem>
                <SelectItem value='incomplete_information'>
                  Incomplete Information
                </SelectItem>
                <SelectItem value='false_or_misleading_information'>
                  False or Misleading Information
                </SelectItem>
             
              </SelectContent>
            </Select>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className='text-sm'>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReject}
            disabled={!selectedReason}
            className='text-sm'
          >
            Rejeter
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// DeleteDialog component - moved outside Listings component
const DeleteDialog = ({ listingId, onDelete, reason, setReason }: any) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant='outline' size='sm' className='flex-1 sm:flex-none'>
        <Trash2 className='h-4 w-4' />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent className='max-w-[95vw] sm:max-w-md'>
      <AlertDialogHeader>
        <AlertDialogTitle className='text-base sm:text-lg'>
          Supprimer cette annonce
        </AlertDialogTitle>
        <AlertDialogDescription className='text-sm'>
          Cette action est irréversible. Veuillez justifier la suppression.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='delete-reason' className='text-sm'>
            Motif de suppression
          </Label>
          <Textarea
            id='delete-reason'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Expliquez pourquoi cette annonce doit être supprimée...'
            rows={3}
            className='text-sm'
          />
        </div>
      </div>
      <AlertDialogFooter className='flex-col sm:flex-row gap-2'>
        <AlertDialogCancel className='w-full sm:w-auto'>
          Annuler
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={() => onDelete(listingId, reason)}
          className='bg-destructive hover:bg-destructive/90 w-full sm:w-auto'
          disabled={!reason.trim()}
        >
          Supprimer définitivement
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

// RejectDialog component - moved outside Listings component

const Listings = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [moderationStatusFilter, setModerationStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [rejectionReason, setRejectionReason] = useState('')
  const [deletionReason, setDeletionReason] = useState('')
  const [allTools, setAllTools] = useState<Tool[]>([]) // Tous les outils récupérés
  const [tools, setTools] = useState<Tool[]>([]) // Outils affichés pour la page courante
  const [stats, setStats] = useState<ToolStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTools, setTotalTools] = useState(0)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([])
  const itemsPerPage = 10
  const { toast } = useToast()

  // Load categories from API
  const loadCategories = async () => {
    setCategoriesLoading(true)
    setCategoriesError(null)
    try {
      const response = await toolsService.getCategories()
      if (response.success && response.data) {
        console.log('-------------------------------', response)
        // Extract data from response.data.data if it exists, otherwise use response.data directly
        const categoriesData = response.data.data
        setCategories(categoriesData)
      } else {
        // Only throw error if response indicates failure, not just missing data structure
        if (response.success === false) {
          throw new Error(
            response.message || 'Erreur lors du chargement des catégories'
          )
        }
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      // Use mock data when API is not available
      const mockCategories = [
        {
          id: '1',
          name: 'outillage-electrique',
          displayName: 'Outillage électrique',
        },
        {
          id: '2',
          name: 'materiel-construction',
          displayName: 'Matériel de construction',
        },
        { id: '3', name: 'jardinage', displayName: 'Jardinage' },
        { id: '4', name: 'vehicules', displayName: 'Véhicules' },
      ]
      setCategories(mockCategories)

      // Only show error toast if it's not a network error (API unavailable)
      if (
        !error.message?.includes('Network Error') &&
        !error.message?.includes('ERR_NETWORK')
      ) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Erreur lors du chargement des catégories'
        setCategoriesError(errorMessage)
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Load all subcategories from API
  const loadAllSubcategories = async () => {
    try {
      const response = await toolsService.getAllSubcategories()
      if (response.success && response.data) {
        // Extract data from response.data.data if it exists, otherwise use response.data directly
        const subcategoriesData = response.data.data || response.data
        setSubcategories(subcategoriesData)
        setFilteredSubcategories(subcategoriesData)
      } else {
        // Only throw error if response indicates failure, not just missing data structure
        if (response.success === false) {
          throw new Error(
            response.message || 'Erreur lors du chargement des sous-catégories'
          )
        }
      }
    } catch (error) {
      console.error('Error loading subcategories:', error)
      // Use mock data when API is not available
      const mockSubcategories = [
        {
          id: '1',
          name: 'perceuses',
          displayName: 'Perceuses',
          categoryId: '1',
        },
        { id: '2', name: 'scies', displayName: 'Scies', categoryId: '1' },
        {
          id: '3',
          name: 'ponceuses',
          displayName: 'Ponceuses',
          categoryId: '1',
        },
        {
          id: '4',
          name: 'betonnieres',
          displayName: 'Bétonnières',
          categoryId: '2',
        },
        {
          id: '5',
          name: 'echafaudages',
          displayName: 'Échafaudages',
          categoryId: '2',
        },
      ]
      setSubcategories(mockSubcategories)
      setFilteredSubcategories(mockSubcategories)

      // Only show error toast if it's not a network error (API unavailable)
      if (
        !error.message?.includes('Network Error') &&
        !error.message?.includes('ERR_NETWORK')
      ) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Erreur lors du chargement des sous-catégories'
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    }
  }

  // Load subcategories for a specific category
  const loadSubcategoriesByCategory = async (categoryId: string) => {
    try {
      const response = await toolsService.getSubcategoriesByCategory(categoryId)
      if (response.success && response.data) {
        // Extract data from response.data.data if it exists, otherwise use response.data directly
        const subcategoriesData = response.data.data || response.data
        setFilteredSubcategories(subcategoriesData)
      } else {
        // Only throw error if response indicates failure, not just missing data structure
        if (response.success === false) {
          throw new Error(
            response.message || 'Erreur lors du chargement des sous-catégories'
          )
        }
      }
    } catch (error) {
      console.error('Error loading subcategories for category:', error)
      // Filter mock data by category when API is not available
      const mockSubcategories = [
        {
          id: '1',
          name: 'perceuses',
          displayName: 'Perceuses',
          categoryId: '1',
        },
        { id: '2', name: 'scies', displayName: 'Scies', categoryId: '1' },
        {
          id: '3',
          name: 'ponceuses',
          displayName: 'Ponceuses',
          categoryId: '1',
        },
        {
          id: '4',
          name: 'betonnieres',
          displayName: 'Bétonnières',
          categoryId: '2',
        },
        {
          id: '5',
          name: 'echafaudages',
          displayName: 'Échafaudages',
          categoryId: '2',
        },
      ]
      const filtered = mockSubcategories.filter(
        (sub) => sub.categoryId === categoryId
      )
      setFilteredSubcategories(filtered)

      // Only show error toast if it's not a network error (API unavailable)
      if (
        !error.message?.includes('Network Error') &&
        !error.message?.includes('ERR_NETWORK')
      ) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Erreur lors du chargement des sous-catégories'
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    }
  }

  // Load tools data from API
  const loadTools = async () => {
    try {
      setLoading(true)
      setError(null)
      const filters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        moderationStatus:
          moderationStatusFilter !== 'all' ? moderationStatusFilter : undefined,
        categoryId: categoryFilter !== 'all' ? categoryFilter : undefined,
        subcategoryId:
          subcategoryFilter !== 'all' ? subcategoryFilter : undefined,
        dateFrom: dateRange?.from
          ? dateRange.from.toISOString().split('T')[0]
          : undefined,
        dateTo: dateRange?.to
          ? dateRange.to.toISOString().split('T')[0]
          : undefined,
        page: currentPage,
        limit: itemsPerPage,
      }

      const response = await toolsService.getToolsForAdmin(filters)

      // Debug: Log complete API response structure
      console.log('=== API Response Debug ===')
      console.log('Full response:', response)
      console.log('Response data:', response.data)
      console.log('Response success:', (response as any)?.success)

      if (response && (response as any).data) {
        // Extract data from response.data.data according to API structure
        const toolsData = response.data.data || response.data

        // Debug: Log tools data and photos structure
        console.log('=== Tools Data Debug ===')
        console.log('Tools data:', toolsData)
        console.log('Is array:', Array.isArray(toolsData))

        if (Array.isArray(toolsData) && toolsData.length > 0) {
          console.log('First tool complete structure:', toolsData[0])
          console.log('First tool photos:', toolsData[0].photos)
          console.log('Photos array length:', toolsData[0].photos?.length)
          console.log('Has photos property:', 'photos' in toolsData[0])
          console.log('Photos type:', typeof toolsData[0].photos)

          // Check address properties
          console.log('Address properties:', {
            pickupAddress: toolsData[0].pickupAddress,
            })
        }

        const toolsArray = Array.isArray(toolsData) ? toolsData : []
        setAllTools(toolsArray)
        // Fallback client: si l'API ne filtre pas sur la modération, filtrer côté client
        const finalTools =
          moderationStatusFilter !== 'all'
            ? toolsArray.filter(
                (t: any) => t.moderationStatus === moderationStatusFilter
              )
            : toolsArray
        setTools(finalTools)

        // Utiliser la pagination côté serveur
        const pagination =
          (response.data && (response.data as any).pagination) ||
          (response as any).pagination ||
          {}
        const apiTotal =
          pagination.total ?? response.data.total ?? toolsArray.length
        const apiTotalPages =
          pagination.totalPages ??
          response.data.totalPages ??
          Math.ceil(apiTotal / itemsPerPage)

        setTotalTools(apiTotal)
        setTotalPages(apiTotalPages)

        // Debug: Logs pour la pagination (server-side)
        console.log('Pagination Debug - Success (server-side):', {
          apiTotal,
          apiTotalPages,
          itemsPerPage,
          currentPage,
          toolsArrayLength: toolsArray.length,
          paginationObject: pagination,
        })
      } else {
        // Only throw error if response indicates failure, not just missing data structure
        if (response.success === false) {
          throw new Error(
            response.message || 'Erreur lors du chargement des outils'
          )
        } else {
          // Handle case where response is successful but data structure is unexpected
          setTools([])
          setTotalPages(1)
          setTotalTools(0)
        }
      }
    } catch (error) {
      console.error('Error loading tools:', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Erreur lors du chargement des outils'
      )
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
          moderationStatus: 'CONFIRMED',
          category: { id: '1', name: 'Outillage électrique' },
          subcategory: { id: '1', name: 'Perceuses' },
          owner: {
            id: '1',
            firstName: 'Jean',
            lastName: 'Dupont',
            email: 'jean.dupont@email.com',
          },
          photos: [
            {
              id: '1',
              url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400',
              isPrimary: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
              isPrimary: false,
              createdAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
          moderationStatus: 'PENDING',
          category: { id: '1', name: 'Outillage électrique' },
          subcategory: { id: '2', name: 'Scies' },
          owner: {
            id: '2',
            firstName: 'Marie',
            lastName: 'Martin',
            email: 'marie.martin@email.com',
          },
          photos: [
            {
              id: '3',
              url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
              isPrimary: true,
              createdAt: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      // Créer des données mock plus réalistes pour tester la pagination
      const extendedMockTools = []
      for (let i = 0; i < 73; i++) {
        extendedMockTools.push({
          ...mockTools[i % 2],
          id: `mock-${i + 1}`,
          title: `${mockTools[i % 2].title} ${i + 1}`,
          owner: {
            ...mockTools[i % 2].owner,
            id: `owner-${i + 1}`,
            firstName: `User${i + 1}`,
            lastName: `Test${i + 1}`,
          },
        })
      }

      setAllTools(extendedMockTools)

      // Appliquer la pagination côté client pour les données mock
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedMockTools = extendedMockTools.slice(startIndex, endIndex)
      setTools(paginatedMockTools)

      const simulatedTotal = extendedMockTools.length
      const simulatedPages = Math.ceil(simulatedTotal / itemsPerPage)

      setTotalTools(simulatedTotal)
      setTotalPages(simulatedPages)

      // Debug: Logs pour la pagination en mode erreur
      console.log('Pagination Debug - Error/Mock:', {
        mockToolsLength: mockTools.length,
        simulatedTotal,
        simulatedPages,
        itemsPerPage,
        currentPage,
        paginationCondition:
          simulatedPages > 1 || simulatedTotal > itemsPerPage,
      })

      // Only show error toast if it's not a network error (API unavailable)
      if (
        !error.message?.includes('Network Error') &&
        !error.message?.includes('ERR_NETWORK')
      ) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Erreur lors du chargement des outils'
        setError(errorMessage)
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Load stats
  const loadStats = async () => {
    try {
      // Use dedicated stats endpoint from backend
      const response = await toolsService.getToolStats()
      if (response.success && response.data) {
        const statsData = response.data.data || response.data

        // Map backend stats to frontend format including moderation stats
        const stats = {
          total: statsData.total,
          published: statsData.published,
          underReview: statsData.underReview,
          archived: statsData.archived,
          draft: statsData.draft,
          moderationPending: statsData.moderationPending,
          moderationConfirmed: statsData.moderationConfirmed,
          moderationRejected: statsData.moderationRejected,
        }

        setStats(stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
      // Use mock stats when API is not available
      const mockStats = {
        total: 2,
        published: 1,
        underReview: 1,
        archived: 0,
        draft: 0,
        moderationPending: 1,
        moderationConfirmed: 1,
        moderationRejected: 0,
      }
      setStats(mockStats)
    }
  }

  // Supprimer la pagination côté client (utilisation de la pagination serveur)
  const applyClientSidePagination = () => {
    // Obsolète: pagination côté serveur active
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    loadTools()
  }, [
    searchTerm,
    statusFilter,
    moderationStatusFilter,
    categoryFilter,
    subcategoryFilter,
    dateRange,
    currentPage,
    itemsPerPage,
  ])

  // Recharger lors des changements de page ou taille (doublon supprimé car déjà couvert ci-dessus)
  // useEffect(() => {
  //   loadTools()
  // }, [currentPage, itemsPerPage])

  useEffect(() => {
    loadStats()
    loadCategories()
    loadAllSubcategories()
  }, [])

  // Load subcategories when category changes
  useEffect(() => {
    if (categoryFilter === 'all') {
      // Show all subcategories when no category is selected
      setFilteredSubcategories(subcategories)
    } else {
      // Load subcategories for the selected category from API
      loadSubcategoriesByCategory(categoryFilter)
    }
    // Reset subcategory filter when category changes
    if (subcategoryFilter !== 'all') {
      setSubcategoryFilter('all')
    }
  }, [categoryFilter, subcategories])

  // Handle tool approval
  const handleApproveTool = async (toolId: string) => {
    try {
      const response = await toolsService.approveTool(toolId)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Outil approuvé avec succès',
        })
        loadTools()
        loadStats()
      } else {
        throw new Error(response.message || "Erreur lors de l'approbation")
      }
    } catch (error) {
      console.error('Error approving tool:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossible d'approuver l'outil"
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Handle tool rejection
  const handleRejectTool = async (toolId: string, reason: string) => {
    try {
      const response = await toolsService.rejectTool(toolId, reason)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Outil rejeté avec succès',
        })
        loadTools()
        loadStats()
        setRejectionReason('')
      } else {
        throw new Error(response.message || 'Erreur lors du rejet')
      }
    } catch (error) {
      console.error('Error rejecting tool:', error)
      const errorMessage =
        error instanceof Error ? error.message : "Impossible de rejeter l'outil"
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Handle tool deletion
  const handleDeleteTool = async (toolId: string, reason?: string) => {
    try {
      const response = await toolsService.deleteTool(toolId, reason)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Outil supprimé avec succès',
        })
        loadTools()
        loadStats()
        setDeletionReason('')
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting tool:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Impossible de supprimer l'outil"
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <Badge className='bg-success text-success-foreground'>Publiée</Badge>
        )
      case 'UNDER_REVIEW':
        return (
          <Badge className='bg-warning text-warning-foreground'>
            En attente
          </Badge>
        )
      case 'DRAFT':
        return <Badge variant='secondary'>Brouillon</Badge>
      case 'ARCHIVED':
        return <Badge variant='outline'>Archivée</Badge>
      default:
        return <Badge variant='outline'>Inconnu</Badge>
    }
  }

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case 'Excellent':
        return (
          <Badge className='bg-success text-success-foreground'>
            Excellent
          </Badge>
        )
      case 'Bon':
        return <Badge className='bg-blue-500 text-white'>Bon</Badge>
      case 'Correct':
        return <Badge className='bg-yellow-500 text-white'>Correct</Badge>
      case 'Défectueux':
        return <Badge variant='destructive'>Défectueux</Badge>
      default:
        return <Badge variant='outline'>Non spécifié</Badge>
    }
  }

  const handleApprove = async (listingId: string) => {
    await handleApproveTool(listingId)
  }

  const handleReject = async (listingId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez spécifier un motif de rejet.',
        variant: 'destructive',
      })
      return
    }
    await handleRejectTool(listingId, reason)
  }

  const handleDelete = async (listingId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: 'Erreur',
        description:
          'Veuillez spécifier une justification pour la suppression.',
        variant: 'destructive',
      })
      return
    }
    await handleDeleteTool(listingId, reason)
  }

  // Pagination info
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalTools)

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
            Gestion des annonces
          </h1>
          <p className='text-sm sm:text-base text-gray-600 mt-1'>
            Modérez et gérez les annonces d'outils
          </p>
        </div>
        <DateRangePicker
          date={dateRange}
          onDateChange={setDateRange}
          placeholder='Filtrer par date de création'
        />
      </div>

      {/* Stats cards */}
      <div className='grid grid-cols-2 sm:grid-cols-5 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>En attente</p>
                <p className='text-2xl font-bold text-warning'>
                  {stats?.moderationPending || 0}
                </p>
              </div>
              <Clock className='h-8 w-8 text-warning' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Confirmées</p>
                <p className='text-2xl font-bold text-blue-600'>
                  {stats?.moderationConfirmed || 0}
                </p>
              </div>
              <Check className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Rejetées</p>
                <p className='text-2xl font-bold text-destructive'>
                  {stats?.moderationRejected || 0}
                </p>
              </div>
              <X className='h-8 w-8 text-destructive' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Publiées</p>
                <p className='text-2xl font-bold text-success'>
                  {stats?.published || 0}
                </p>
              </div>
              <Package className='h-8 w-8 text-success' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>Brouillons</p>
                <p className='text-2xl font-bold text-gray-600'>
                  {stats?.draft || 0}
                </p>
              </div>
              <Edit className='h-8 w-8 text-gray-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-6'>
          <div className='grid grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4 grid-cols-5 gap-4'>
            <div className='relative w-full '>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Rechercher par titre...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 '
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue placeholder='Statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tous les statuts</SelectItem>
                <SelectItem value='PUBLISHED'>Publiée</SelectItem>
                <SelectItem value='DRAFT'>Brouillon</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={moderationStatusFilter}
              onValueChange={setModerationStatusFilter}
            >
              <SelectTrigger>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue placeholder='Modération' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Toutes les modérations</SelectItem>
                <SelectItem value='Pending'>En attente</SelectItem>
                <SelectItem value='Confirmed'>Confirmée</SelectItem>
                <SelectItem value='Rejected'>Rejetée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue placeholder='Catégorie' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Toutes les catégories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.displayName || category.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
            <Select
              value={subcategoryFilter}
              onValueChange={setSubcategoryFilter}
            >
              <SelectTrigger>
                <Filter className='h-4 w-4 mr-2' />
                <SelectValue placeholder='Sous-catégorie' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Toutes les sous-catégories</SelectItem>
                {filteredSubcategories?.map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.displayName || subcategory.name}
                  </SelectItem>
                )) || []}
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
            <div className='flex items-center justify-center py-8 text-red-600'>
              <AlertTriangle className='h-6 w-6 mr-2' />
              <div>
                <p className='font-medium'>Erreur de chargement</p>
                <p className='text-sm text-gray-600'>{error}</p>
                <Button
                  variant='outline'
                  size='sm'
                  className='mt-2'
                  onClick={() => {
                    setError(null)
                    loadTools()
                  }}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}

          {!error && loading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin' />
              <span className='ml-2'>Chargement des annonces...</span>
            </div>
          ) : (
            !error && (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-2/5'>Outil & Adresse</TableHead>
                      <TableHead className='hidden md:table-cell w-1/4'>
                        Description
                      </TableHead>
                      <TableHead className='hidden lg:table-cell w-1/6'>
                        Catégorie & Sous-catégorie
                      </TableHead>
                      <TableHead className='w-20'>Statut</TableHead>
                      <TableHead className='hidden lg:table-cell w-24'>
                        Modération
                      </TableHead>
                      <TableHead className='w-32'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools?.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div className='flex items-start gap-3'>
                            {listing.photos && listing.photos.length > 0 ? (
                              <img
                                src={listing.photos[0]?.url}
                                alt={listing.title}
                                className='w-16 h-12 object-cover rounded hidden sm:block'
                              />
                            ) : (
                              <div className='w-16 h-12 bg-gray-200 rounded flex items-center justify-center hidden sm:block'>
                                <ImageIcon className='h-4 w-4 text-gray-400' />
                              </div>
                            )}
                            <div className='flex-1'>
                              <div className='font-medium line-clamp-2'>
                                {listing.title}
                              </div>
                              <div className='text-sm text-gray-500 mt-1'>
                                Propriétaire:{' '}
                                {listing.owner
                                  ? `${listing.owner.firstName} ${listing.owner.lastName}`
                                  : 'N/A'}
                              </div>
                            
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <div className='text-sm text-gray-600 line-clamp-2'>
                            {listing.description
                              ? listing.description.substring(0, 100) +
                                (listing.description.length > 100 ? '...' : '')
                              : 'Aucune description'}
                          </div>
                        </TableCell>
                        <TableCell className='hidden lg:table-cell'>
                          <div className='flex flex-col gap-1'>
                            <Badge variant='outline'>
                              {listing.category?.displayName ||
                                listing.category?.name ||
                                'N/A'}
                            </Badge>
                            {listing.subcategory && (
                              <Badge variant='secondary' className='text-xs'>
                                {listing.subcategory?.displayName ||
                                  listing.subcategory?.name}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(listing.toolStatus)}
                        </TableCell>
                        <TableCell className='hidden lg:table-cell'>
                          {listing.moderationStatus ? (
                            <Badge
                              variant={
                                listing.moderationStatus === 'Confirmed'
                                  ? 'default'
                                  : listing.moderationStatus === 'Rejected'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {listing.moderationStatus === 'Confirmed'
                                ? 'Confirmé'
                                : listing.moderationStatus === 'Rejected'
                                ? 'Rejeté'
                                : listing.moderationStatus === 'Pending'
                                ? 'En attente'
                                : listing.moderationStatus}
                            </Badge>
                          ) : (
                            <Badge variant='outline'>N/A</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <ListingDetailsModal 
                              listing={listing} 
                              onApprove={handleApprove} 
                              onReject={handleReject} 
                              onDelete={handleDelete} 
                            />
                            {listing.moderationStatus === 'Pending' && (
                              <>
                                <ApproveDialog
                                  listingId={listing.id}
                                  onApprove={handleApprove}
                                />
                                <RejectDialog
                                  listingId={listing.id}
                                  onReject={handleReject}
                                />
                              </>
                            )}
                            {listing.moderationStatus === 'Confirmed' && (
                              <RejectDialog
                                listingId={listing.id}
                                onReject={handleReject}
                              />
                            )}
                            {listing.moderationStatus === 'Rejected' && (
                              <ApproveDialog
                                listingId={listing.id}
                                onApprove={handleApprove}
                              />
                            )}
                            <DeleteDialog
                              listingId={listing.id}
                              onDelete={handleDelete}
                              reason={deletionReason}
                              setReason={setDeletionReason}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}

          {/* Pagination */}
          {(() => {
            const shouldShowPagination =
              !loading && (totalPages > 1 || totalTools > itemsPerPage)
            console.log('Pagination Render Debug:', {
              loading,
              totalPages,
              totalTools,
              itemsPerPage,
              condition1: totalPages > 1,
              condition2: totalTools > itemsPerPage,
              shouldShowPagination,
              currentPage,
            })
            return shouldShowPagination
          })() && (
            <div className='flex items-center justify-between mt-6'>
              <div className='text-sm text-gray-500'>
                Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
                {Math.min(currentPage * itemsPerPage, totalTools)} sur{' '}
                {totalTools} annonces
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <span className='text-sm'>
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Listings
