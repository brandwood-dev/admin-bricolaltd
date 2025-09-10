import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  EyeOff
} from "lucide-react";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { DateRange } from "react-day-picker";
import { newsService, News } from "@/services/newsService";
import { useToast } from "@/hooks/use-toast";

// NewsCategory interface for static categories
export interface NewsCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<News | null>(null);
  const [articles, setArticles] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;
  const { toast } = useToast();

  // Dynamic categories - will be loaded from news category service
  const [categories, setCategories] = useState<NewsCategory[]>([]);

  const getStatusBadge = (article: News) => {
    if (article.isFeatured) {
      return <Badge className="bg-yellow-500 text-white">En vedette</Badge>;
    }
    if (article.isPublic) {
      return <Badge className="bg-green-500 text-white">Publié</Badge>;
    }
    return <Badge variant="secondary">Brouillon</Badge>;
  };

  // Load categories - using static categories since news categories don't exist in backend yet
  const loadCategories = async () => {
    // For now, use static categories since news categories don't exist in backend yet
    setCategories([
      { id: '1', name: 'general', displayName: 'Général', description: 'Articles généraux', createdAt: '', updatedAt: '' },
      { id: '2', name: 'announcements', displayName: 'Annonces', description: 'Annonces importantes', createdAt: '', updatedAt: '' },
      { id: '3', name: 'updates', displayName: 'Mises à jour', description: 'Mises à jour du site', createdAt: '', updatedAt: '' },
      { id: '4', name: 'events', displayName: 'Événements', description: 'Événements et actualités', createdAt: '', updatedAt: '' },
      { id: '5', name: 'tools', displayName: 'Outils', description: 'Nouveaux outils disponibles', createdAt: '', updatedAt: '' },
      { id: '6', name: 'tips', displayName: 'Conseils', description: 'Conseils et astuces', createdAt: '', updatedAt: '' }
    ]);
  };

  // Load articles from API
  const loadArticles = async () => {
    try {
      setLoading(true);
      const response = await newsService.getAllNews(searchTerm || undefined);
      if (response.success && response.data) {
        setArticles(response.data);
      }
    } catch (error) {
      console.error('Error loading articles:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les articles.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load categories and articles on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load articles on component mount and when search term changes
  useEffect(() => {
    loadArticles();
  }, [searchTerm]);

  // Handle article deletion
  const handleDeleteArticle = async (id: string) => {
    try {
      const response = await newsService.deleteNews(id);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Article supprimé avec succès.",
        });
        loadArticles(); // Reload articles
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article.",
        variant: "destructive"
      });
    }
  };

  // Handle toggle featured status
  const handleToggleFeatured = async (id: string) => {
    try {
      const response = await newsService.toggleFeatured(id);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Statut vedette mis à jour.",
        });
        loadArticles(); // Reload articles
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive"
      });
    }
  };

  // Handle toggle public status
  const handleTogglePublic = async (id: string) => {
    try {
      const response = await newsService.togglePublic(id);
      if (response.success) {
        toast({
          title: "Succès",
          description: "Statut de publication mis à jour.",
        });
        loadArticles(); // Reload articles
      }
    } catch (error) {
      console.error('Error toggling public status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive"
      });
    }
  };

  const handleCreateArticle = () => {
    setEditingArticle(null);
    setIsEditorOpen(true);
  };

  const handleEditArticle = (article: News) => {
    setEditingArticle(article);
    setIsEditorOpen(true);
  };

  // Filtrage des articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === "published") {
      matchesStatus = article.isPublic;
    } else if (statusFilter === "draft") {
      matchesStatus = !article.isPublic;
    } else if (statusFilter === "featured") {
      matchesStatus = article.isFeatured;
    }
    
    const matchesCategory = categoryFilter === "all" || 
                           (article.categoryId && article.categoryId === categoryFilter);
    
    let matchesDate = true;
    if (dateRange?.from) {
      const articleDate = new Date(article.createdAt);
      matchesDate = articleDate >= dateRange.from && 
                   (!dateRange.to || articleDate <= dateRange.to);
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  // Pagination
  const totalFilteredPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedArticles = filteredArticles.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, dateRange]);

  const ArticlePreviewModal = ({ article }: { article: News }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prévisualisation - {article.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cover image */}
          {article.imageUrl && (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article meta */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(article.createdAt).toLocaleDateString('fr-FR')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Mis à jour le {new Date(article.updatedAt).toLocaleDateString('fr-FR')}
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {categories.find(cat => cat.id === article.categoryId)?.displayName || 'Non catégorisé'}
            </div>
            {article.isFeatured && (
              <Badge className="bg-yellow-500 text-white">En vedette</Badge>
            )}
          </div>

          {/* Article summary */}
          {article.summary && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Résumé</h4>
              <p className="text-gray-700">{article.summary}</p>
            </div>
          )}

          {/* Article content */}
          <div className="prose max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion du blog</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Créez et gérez vos articles de blog</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="order-2 sm:order-1 flex-1 sm:flex-none">
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder="Filtrer par date de publication"
            />
          </div>
          <Button 
            onClick={handleCreateArticle} 
            className="order-1 sm:order-2 bg-primary hover:bg-primary-hover w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Créer un nouvel article</span>
            <span className="sm:hidden">Nouvel article</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="articles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-96">
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un article..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="featured">En vedette</SelectItem>
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
                        {category.displayName}
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
              <CardTitle>Articles ({filteredArticles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Chargement des articles...</span>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Article</TableHead>
                          <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="hidden md:table-cell">Date de création</TableHead>
                          <TableHead className="hidden md:table-cell">Date de mise à jour</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedArticles.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                              Aucun article trouvé
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedArticles.map((article) => (
                            <TableRow key={article.id}>
                              <TableCell>
                                <div className="flex items-start gap-3">
                                  {article.imageUrl && (
                                    <img 
                                      src={article.imageUrl} 
                                      alt={article.title}
                                      className="w-16 h-12 object-cover rounded hidden sm:block"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium line-clamp-2">{article.title}</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                      {article.summary && article.summary.length > 50 
                                        ? `${article.summary.substring(0, 50)}...` 
                                        : article.summary}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge variant="outline">
                                  {categories.find(cat => cat.id === article.categoryId)?.displayName || 'Non catégorisé'}
                                </Badge>
                              </TableCell>
                              <TableCell>{getStatusBadge(article)}</TableCell>
                              <TableCell className="hidden md:table-cell">
                                {new Date(article.createdAt).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {new Date(article.updatedAt).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <ArticlePreviewModal article={article} />
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditArticle(article)}
                                    title="Modifier"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleTogglePublic(article.id)}
                                    title={article.isPublic ? "Dépublier" : "Publier"}
                                    className={article.isPublic ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-green-600"}
                                  >
                                    {article.isPublic ? <Globe className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleToggleFeatured(article.id)}
                                    title={article.isFeatured ? "Retirer de la vedette" : "Mettre en vedette"}
                                    className={article.isFeatured ? "text-yellow-600 hover:text-yellow-700" : "text-gray-400 hover:text-yellow-600"}
                                  >
                                    <Star className={`h-4 w-4 ${article.isFeatured ? 'fill-current' : ''}`} />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteArticle(article.id)}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredArticles.length)} sur {filteredArticles.length} articles
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
                        Page {currentPage} sur {totalFilteredPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalFilteredPages))}
                        disabled={currentPage === totalFilteredPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des catégories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div key={category.id} className="p-4 border rounded-lg flex justify-between items-center">
                    <span className="font-medium">{category.displayName}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <Button variant="ghost" className="text-gray-500">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une catégorie
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Blog Editor Modal */}
      {isEditorOpen && (
        <BlogEditor
          article={editingArticle}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            loadArticles(); // Reload articles after editing
          }}
          categories={categories}
        />
      )}
    </div>
  );
};

export default Blog;