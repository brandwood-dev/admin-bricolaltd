import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
} from '@/components/ui/alert-dialog'
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  User,
  Calendar,
  Loader2,
  Eye,
} from 'lucide-react'
import { reviewsService, ToolReview, AppReview } from '@/services/reviewsService'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const Reviews = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('tools')
  
  // Tool reviews state
  const [toolReviews, setToolReviews] = useState<ToolReview[]>([])
  const [toolReviewsLoading, setToolReviewsLoading] = useState(true)
  const [toolReviewsTotal, setToolReviewsTotal] = useState(0)
  const [toolReviewsTotalPages, setToolReviewsTotalPages] = useState(0)
  
  // App reviews state
  const [appReviews, setAppReviews] = useState<AppReview[]>([])
  const [appReviewsLoading, setAppReviewsLoading] = useState(true)
  const [appReviewsTotal, setAppReviewsTotal] = useState(0)
  const [appReviewsTotalPages, setAppReviewsTotalPages] = useState(0)
  
  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<{ id: string; type: 'tool' | 'app'; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { toast } = useToast()
  const itemsPerPage = 10

  // Load tool reviews
  const loadToolReviews = async (page: number = currentPage) => {
    try {
      setToolReviewsLoading(true)
      const response = await reviewsService.getToolReviews({
        page,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        rating: ratingFilter && ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
      })

      if (response.success && response.data) {
        setToolReviews(response.data.data || [])
        setToolReviewsTotalPages(response.data.totalPages || 1)
        setToolReviewsTotal(response.data.total || 0)
      }
    } catch (error) {
      console.error('Error loading tool reviews:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les avis sur les outils.',
        variant: 'destructive',
      })
    } finally {
      setToolReviewsLoading(false)
    }
  }

  // Load app reviews
  const loadAppReviews = async (page: number = currentPage) => {
    try {
      setAppReviewsLoading(true)
      const response = await reviewsService.getAppReviews({
        page,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        rating: ratingFilter && ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined,
      })
      console.log('App reviews response:', response)

      if (response.success && response.data) {
        setAppReviews(response.data.data || [])
        setAppReviewsTotalPages(response.data.totalPages || 1)
        setAppReviewsTotal(response.data.total || 0)
      }
    } catch (error) {
      console.error('Error loading app reviews:', error)
      toast({
        title: 'Erreur',
        description: "Impossible de charger les avis sur l'application.",
        variant: 'destructive',
      })
    } finally {
      setAppReviewsLoading(false)
    }
  }

  // Load reviews based on active tab
  const loadReviews = () => {
    if (activeTab === 'tools') {
      loadToolReviews(1)
    } else {
      loadAppReviews(1)
    }
    setCurrentPage(1)
  }

  // Load reviews on component mount and when search term, rating filter or tab changes
  useEffect(() => {
    loadReviews()
  }, [searchTerm, ratingFilter, activeTab])

  // Handle delete review click
  const handleDeleteClick = (id: string, type: 'tool' | 'app', title: string) => {
    setReviewToDelete({ id, type, title })
    setIsDeleteDialogOpen(true)
  }

  // Handle confirmed review deletion
  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return

    try {
      setIsDeleting(true)
      let response
      
      if (reviewToDelete.type === 'tool') {
        response = await reviewsService.deleteToolReview(reviewToDelete.id)
      } else {
        response = await reviewsService.deleteAppReview(reviewToDelete.id)
      }
      
      if (response.success) {
        toast({
          title: 'Succès',
          description: `L'avis a été supprimé avec succès.`,
        })
        loadReviews() // Reload reviews
        setIsDeleteDialogOpen(false)
        setReviewToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'avis.",
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    if (activeTab === 'tools') {
      loadToolReviews(page)
    } else {
      loadAppReviews(page)
    }
  }

  // Render star rating
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    )
  }

  // Render tool reviews table
  const renderToolReviewsTable = () => {
    if (toolReviewsLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    if (toolReviews.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Aucun avis sur les outils trouvé.
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Outil</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Commentaire</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {toolReviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <div className="font-medium">
                      {review.reviewer.firstName} {review.reviewer.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{review.reviewer.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{review.tool.title}</div>
              </TableCell>
              <TableCell>{renderStarRating(review.rating)}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={review.comment}>
                  {review.comment}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(review.createdAt), 'dd/MM/yyyy', { locale: fr })}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(review.id, 'tool', review.tool.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  // Render app reviews table
  const renderAppReviewsTable = () => {
    if (appReviewsLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    if (appReviews.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Aucun avis sur l'application trouvé.
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Commentaire</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appReviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <div>
                    <div className="font-medium">
                      {review.reviewer.firstName} {review.reviewer.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{review.reviewer.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{renderStarRating(review.rating)}</TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={review.comment}>
                  {review.comment}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(review.createdAt), 'dd/MM/yyyy', { locale: fr })}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(review.id, 'app', 'Application')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  // Render pagination
  const renderPagination = () => {
    const totalPages = activeTab === 'tools' ? toolReviewsTotalPages : appReviewsTotalPages
    const total = activeTab === 'tools' ? toolReviewsTotal : appReviewsTotal
    
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-gray-700">
          Affichage de {((currentPage - 1) * itemsPerPage) + 1} à{' '}
          {Math.min(currentPage * itemsPerPage, total)} sur {total} avis
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="text-sm">
            Page {currentPage} sur {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Avis</h1>
          <p className="text-muted-foreground">
            Gérez les avis sur les outils et l'application
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par utilisateur ou commentaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-48">
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les notes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les notes</SelectItem>
                  <SelectItem value="5">5 étoiles</SelectItem>
                  <SelectItem value="4">4 étoiles</SelectItem>
                  <SelectItem value="3">3 étoiles</SelectItem>
                  <SelectItem value="2">2 étoiles</SelectItem>
                  <SelectItem value="1">1 étoile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tools">Avis Outils ({toolReviewsTotal})</TabsTrigger>
              <TabsTrigger value="app">Avis Application ({appReviewsTotal})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tools" className="mt-6">
              {renderToolReviewsTable()}
            </TabsContent>
            
            <TabsContent value="app" className="mt-6">
              {renderAppReviewsTable()}
            </TabsContent>
          </Tabs>
          
          {/* Pagination */}
          <div className="mt-6">
            {renderPagination()}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Reviews