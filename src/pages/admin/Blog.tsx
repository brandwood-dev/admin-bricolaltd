import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Clock,
  Tag,
  Image as ImageIcon,
  FileText,
  Video,
  Loader2,
  Star,
  Globe,
  EyeOff,
  Filter,
} from 'lucide-react'
import { BlogEditor } from '@/components/admin/BlogEditor'
import { DateRange } from 'react-day-picker'
import { newsService, News, Category } from '@/services/newsService'
import { useToast } from '@/hooks/use-toast'

// Using Category interface from newsService
interface staticCategory {
  id: string
  name: string
}

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<News | null>(null)
  const [articles, setArticles] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Pagination states
  const [totalArticles, setTotalArticles] = useState(0)
  const [itemsPerPage] = useState(10)

  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<News | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Loading states for individual actions
  const [loadingActions, setLoadingActions] = useState<{
    [key: string]: boolean
  }>({})
  const { toast } = useToast()

  // Fixed categories list
  const categories: staticCategory[] = [
    { id: '1', name: 'Jardinage' },
    { id: '2', name: 'Entretien' },
    { id: '3', name: 'Transport' },
    { id: '4', name: 'Bricolage' },
    { id: '5', name: 'Électricité' },
    { id: '6', name: 'Éclairage' },
    { id: '7', name: 'Peinture' },
    { id: '8', name: 'Construction' },
    { id: '9', name: 'Plantes' },
    { id: '10', name: 'Nettoyage' },
    { id: '11', name: 'Décoration' },
    { id: '12', name: 'Guide' },
  ]

  const getStatusBadge = (article: News) => {
    if (article.isFeatured) {
      return <Badge className='bg-yellow-500 text-white'>En vedette</Badge>
    }
    if (article.isPublic) {
      return <Badge className='bg-green-500 text-white'>Publié</Badge>
    }
    return <Badge variant='secondary'>Brouillon</Badge>
  }

  // Load articles from API with pagination
  const loadArticles = async (page: number = currentPage) => {
    try {
      setLoading(true)
      const response = await newsService.getNews({
        page,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        isPublic:
          statusFilter === 'published'
            ? true
            : statusFilter === 'draft'
            ? false
            : undefined,
        isFeatured: statusFilter === 'featured' ? true : undefined,
        category:
          categoryFilter && categoryFilter !== 'all'
            ? categoryFilter
            : undefined,
      })

      if (response.success && response.data) {
        console.log('response', response)
        // Handle both direct properties and meta object structure
        setArticles(response.data.data || [])
        setTotalPages(
          response.data.totalPages || response.data.meta?.totalPages || 1
        )
        setTotalArticles(response.data.total || response.data.meta?.total || 0)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('Error loading articles:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les articles.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load articles on component mount and when search term changes
  useEffect(() => {
    loadArticles(1) // Reset to first page when search changes
  }, [searchTerm, statusFilter, categoryFilter])

  // Handle delete article click (open confirmation dialog)
  const handleDeleteClick = (article: News) => {
    setArticleToDelete(article)
    setIsDeleteDialogOpen(true)
  }

  // Handle confirmed article deletion
  const handleConfirmDelete = async () => {
    if (!articleToDelete) return

    const articleTitle = articleToDelete.title
    try {
      setIsDeleting(true)
      const response = await newsService.deleteNews(articleToDelete.id)
      if (response.success) {
        toast({
          title: 'Succès',
          description: `L'article "${articleTitle}" a été supprimé avec succès.`,
        })
        loadArticles() // Reload articles
        setIsDeleteDialogOpen(false)
        setArticleToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      toast({
        title: 'Erreur',
        description: "Impossible de supprimer l'article.",
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle cancel delete
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setArticleToDelete(null)
  }

  // Handle toggle featured status
  const handleToggleFeatured = async (id: string) => {
    try {
      setLoadingActions((prev) => ({ ...prev, [`featured-${id}`]: true }))
      const response = await newsService.toggleFeatured(id)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Statut vedette mis à jour avec succès.',
        })
        loadArticles() // Reload articles
      }
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut vedette.',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`featured-${id}`]: false }))
    }
  }

  // Handle toggle public status
  const handleTogglePublic = async (id: string) => {
    try {
      setLoadingActions((prev) => ({ ...prev, [`public-${id}`]: true }))
      const response = await newsService.togglePublic(id)
      if (response.success) {
        toast({
          title: 'Succès',
          description: 'Statut de publication mis à jour avec succès.',
        })
        loadArticles() // Reload articles
      }
    } catch (error) {
      console.error('Error toggling public status:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut de publication.',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => ({ ...prev, [`public-${id}`]: false }))
    }
  }

  const handleCreateArticle = () => {
    setEditingArticle(null)
    setIsEditorOpen(true)
  }

  const handleEditArticle = (article: News) => {
    setEditingArticle(article)
    setIsEditorOpen(true)
  }

  // Since we're using server-side pagination, we don't need client-side filtering
  // The filtering is handled by the API call in loadArticles
  const filteredArticles = articles
  const paginatedArticles = articles

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, categoryFilter, dateRange])

  const ArticlePreviewModal = ({ article }: { article: News }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm'>
          <Eye className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Prévisualisation - {article.title}</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Cover image */}
          {article.imageUrl && (
            <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
              <img
                src={article.imageUrl}
                alt={article.title}
                className='w-full h-full object-cover'
              />
            </div>
          )}

          {/* Article meta */}
          <div className='flex flex-wrap gap-4 text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              {new Date(article.createdAt).toLocaleDateString('fr-FR')}
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4' />
              Mis à jour le{' '}
              {new Date(article.updatedAt).toLocaleDateString('fr-FR')}
            </div>
            <div className='flex items-center gap-2'>
              <Tag className='h-4 w-4' />
              {categories.find((cat) => cat.id === article.category)?.name ||
                'Non catégorisé'}
            </div>
            {article.isFeatured && (
              <Badge className='bg-yellow-500 text-white'>En vedette</Badge>
            )}
          </div>

          {/* Article summary */}
          {article.summary && (
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h4 className='font-medium mb-2'>Résumé</h4>
              <p className='text-gray-700'>{article.summary}</p>
            </div>
          )}

          {/* Article content */}
          <div className='prose max-w-none'>
            <h1 className='text-3xl font-bold text-gray-900 mb-4'>
              {article.title}
            </h1>
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
            Gestion du blog
          </h1>
          <p className='text-sm sm:text-base text-gray-600 mt-2'>
            Créez et gérez vos articles de blog
          </p>
        </div>
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4'>
          <div className='order-2 sm:order-1 flex-1 sm:flex-none'>
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder='Filtrer par date de publication'
            />
          </div>
          <Button
            onClick={handleCreateArticle}
            className='order-1 sm:order-2 bg-primary hover:bg-primary-hover w-full sm:w-auto'
          >
            <Plus className='h-4 w-4 mr-2' />
            <span className='hidden sm:inline'>Créer un nouvel article</span>
            <span className='sm:hidden'>Nouvel article</span>
          </Button>
        </div>
      </div>

      <div className='space-y-6'>

        <div className='space-y-6'>
          {/* Filters */}
          <Card>
            <CardContent className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input
                    placeholder='Rechercher un article...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder='Statut de publication' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tous les statuts</SelectItem>
                    <SelectItem value='published'>Public</SelectItem>
                    <SelectItem value='draft'>Brouillon</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Catégorie' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Articles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Articles ({totalArticles})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-8 w-8 animate-spin' />
                  <span className='ml-2'>Chargement des articles...</span>
                </div>
              ) : (
                <>
                  <div className='overflow-x-auto'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Article</TableHead>
                          <TableHead className='hidden md:table-cell'>
                            Catégorie
                          </TableHead>
                          <TableHead>Public</TableHead>
                          <TableHead className='hidden md:table-cell'>
                            En vedette
                          </TableHead>
                          <TableHead className='hidden md:table-cell'>
                            Dates
                          </TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedArticles.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className='text-center py-8 text-gray-500'
                            >
                              Aucun article trouvé
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedArticles.map((article) => (
                            <TableRow key={article.id}>
                              <TableCell>
                                <div className='flex items-start gap-3'>
                                  {article.imageUrl && (
                                    <img
                                      src={article.imageUrl}
                                      alt={article.title}
                                      className='w-16 h-12 object-cover rounded hidden sm:block'
                                    />
                                  )}
                                  <div>
                                    <div className='font-medium line-clamp-2'>
                                      {article.title}
                                    </div>
                                    <div className='text-sm text-gray-500 mt-1'>
                                      {article.summary &&
                                      article.summary.length > 50
                                        ? `${article.summary.substring(
                                            0,
                                            50
                                          )}...`
                                        : article.summary}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className='hidden md:table-cell'>
                                <Badge variant='outline'>
                                  {article.category || 'Non catégorisé'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    article.isPublic ? 'default' : 'secondary'
                                  }
                                >
                                  {article.isPublic ? 'Public' : 'Brouillon'}
                                </Badge>
                              </TableCell>
                              <TableCell className='hidden md:table-cell'>
                                <Badge
                                  variant={
                                    article.isFeatured ? 'default' : 'outline'
                                  }
                                >
                                  {article.isFeatured ? 'En vedette' : 'Normal'}
                                </Badge>
                              </TableCell>
                              <TableCell className='hidden md:table-cell'>
                                <div className='text-sm'>
                                  <div>
                                    Créé:{' '}
                                    {new Date(
                                      article.createdAt
                                    ).toLocaleDateString('fr-FR')}
                                  </div>
                                  <div className='text-gray-500'>
                                    MAJ:{' '}
                                    {new Date(
                                      article.updatedAt
                                    ).toLocaleDateString('fr-FR')}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className='flex items-center gap-1'>
                                  <ArticlePreviewModal article={article} />
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleEditArticle(article)}
                                    title='Modifier'
                                  >
                                    <Edit className='h-4 w-4' />
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      handleTogglePublic(article.id)
                                    }
                                    title={
                                      article.isPublic ? 'Dépublier' : 'Publier'
                                    }
                                    className={
                                      article.isPublic
                                        ? 'text-green-600 hover:text-green-700'
                                        : 'text-gray-400 hover:text-green-600'
                                    }
                                    disabled={
                                      loadingActions[`public-${article.id}`]
                                    }
                                  >
                                    {loadingActions[`public-${article.id}`] ? (
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : article.isPublic ? (
                                      <Globe className='h-4 w-4' />
                                    ) : (
                                      <EyeOff className='h-4 w-4' />
                                    )}
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() =>
                                      handleToggleFeatured(article.id)
                                    }
                                    title={
                                      article.isFeatured
                                        ? 'Retirer de la vedette'
                                        : 'Mettre en vedette'
                                    }
                                    className={
                                      article.isFeatured
                                        ? 'text-yellow-600 hover:text-yellow-700'
                                        : 'text-gray-400 hover:text-yellow-600'
                                    }
                                    disabled={
                                      loadingActions[`featured-${article.id}`]
                                    }
                                  >
                                    {loadingActions[
                                      `featured-${article.id}`
                                    ] ? (
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : (
                                      <Star
                                        className={`h-4 w-4 ${
                                          article.isFeatured
                                            ? 'fill-current'
                                            : ''
                                        }`}
                                      />
                                    )}
                                  </Button>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDeleteClick(article)}
                                    title='Supprimer'
                                  >
                                    <Trash2 className='h-4 w-4 text-destructive' />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className='flex items-center justify-between mt-6'>
                      <div className='text-sm text-gray-500'>
                        Affichage de {(currentPage - 1) * itemsPerPage + 1} à{' '}
                        {Math.min(currentPage * itemsPerPage, totalArticles)}{' '}
                        sur {totalArticles} articles
                      </div>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => loadArticles(currentPage - 1)}
                          disabled={currentPage <= 1 || loading}
                        >
                          <ChevronLeft className='h-4 w-4' />
                          Précédent
                        </Button>

                        <div className='flex items-center gap-1'>
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNum
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    currentPage === pageNum
                                      ? 'default'
                                      : 'outline'
                                  }
                                  size='sm'
                                  onClick={() => loadArticles(pageNum)}
                                  disabled={loading}
                                  className='w-8 h-8 p-0'
                                >
                                  {pageNum}
                                </Button>
                              )
                            }
                          )}
                        </div>

                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => loadArticles(currentPage + 1)}
                          disabled={currentPage >= totalPages || loading}
                        >
                          Suivant
                          <ChevronRight className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Affichage du total */}
                  <div className='flex items-center justify-center mt-4'>
                    <div className='text-sm text-gray-500'>
                      Total: {totalArticles} articles
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      
      </div>

      {/* Blog Editor Modal */}
      {isEditorOpen && (
        <BlogEditor
          article={editingArticle}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false)
            loadArticles() // Reload articles after editing
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'article{' '}
              <strong>"{articleToDelete?.title}"</strong> ?
              <br />
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-end gap-3 mt-6'>
            <Button
              variant='outline'
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant='destructive'
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className='h-4 w-4 mr-2' />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default Blog
