import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Save,
  Eye,
  Upload,
  Loader2,
  AlertCircle,
  Edit3,
  X,
  Plus,
  GripVertical,
  Type,
  AlignLeft,
  Image,
  Video,
  Send,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Quote,
  Code,
  AlignCenter
} from "lucide-react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { newsService, Category } from '../../services/newsService';
import { useToast } from "@/hooks/use-toast";

interface BlogEditorProps {
  article?: News | null;
  isOpen: boolean;
  onClose: () => void;
}

const BlogEditor = ({ article, isOpen, onClose }: BlogEditorProps) => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [useFileUpload, setUseFileUpload] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [additionalImages, setAdditionalImages] = useState<{file: File, url: string, name: string}[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { toast } = useToast();
  
  // Ref pour ReactQuill pour éviter le warning findDOMNode
  const quillRef = useRef<ReactQuill>(null);

  // ReactQuill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'code-block',
    'link', 'image'
  ];

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      if (!isOpen) return;
      
      setLoadingCategories(true);
      try {
        const response = await newsService.getCategories();
        console.log('📂 [BlogEditor] Catégories chargées:', response.data);
        
        if (response.data?.data) {
          setCategories(response.data.data);
        } else {
          console.warn('⚠️ [BlogEditor] Format de réponse inattendu pour les catégories:', response.data);
          setCategories([]);
        }
      } catch (error) {
        console.error('❌ [BlogEditor] Erreur lors du chargement des catégories:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les catégories",
          variant: "destructive",
        });
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [isOpen, toast]);

  // Initialize form with article data when editing
  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setSummary(article.summary || "");
      setContent(article.content || "");
      setImageUrl(article.imageUrl || "");
      setCategoryId(article.categoryId || "");
      setIsPublic(article.isPublic ?? true);
      setIsFeatured(article.isFeatured ?? false);
    } else {
      // Reset form for new article
      setTitle("");
      setSummary("");
      setContent("");
      setImageUrl("");
      setSelectedFiles([]);
      setUseFileUpload(false);
      setCategoryId("");
      setIsPublic(true);
      setIsFeatured(false);
    }
    setErrors({});
  }, [article, isOpen]);

  // Validation function - returns object with field-specific errors
  const validateForm = () => {
    console.log('🔍 [BlogEditor] validateForm - Début validation avec:', {
      title: title ? `"${title.substring(0, 30)}..."` : 'VIDE',
      titleLength: title?.length || 0,
      content: content ? `"${content.substring(0, 50)}..."` : 'VIDE',
      contentLength: content?.length || 0
    });
    
    const fieldErrors: {[key: string]: string} = {};
    
    // Validation du titre
    console.log('📝 [BlogEditor] Validation titre...');
    if (!title || title.trim().length === 0) {
      fieldErrors.title = "Le titre est obligatoire";
      console.log('❌ [BlogEditor] Titre manquant');
    } else if (title.trim().length < 3) {
      fieldErrors.title = "Le titre doit contenir au moins 3 caractères";
      console.log('❌ [BlogEditor] Titre trop court:', title.trim().length);
    } else if (title.trim().length > 200) {
      fieldErrors.title = "Le titre ne peut pas dépasser 200 caractères";
      console.log('❌ [BlogEditor] Titre trop long:', title.trim().length);
    } else {
      console.log('✅ [BlogEditor] Titre valide');
    }
    
    // Validation du contenu
    console.log('📄 [BlogEditor] Validation contenu...');
    if (!content || content.trim().length === 0 || content === '<p><br></p>') {
      fieldErrors.content = "Le contenu est obligatoire";
      console.log('❌ [BlogEditor] Contenu manquant');
    } else if (content.trim().length < 10) {
      fieldErrors.content = "Le contenu doit contenir au moins 10 caractères";
      console.log('❌ [BlogEditor] Contenu trop court:', content.trim().length);
    } else {
      console.log('✅ [BlogEditor] Contenu valide');
    }
    
    console.log('📊 [BlogEditor] validateForm - Résultat final:', {
      errorsCount: Object.keys(fieldErrors).length,
      errors: fieldErrors
    });
    
    return fieldErrors;
  };

  // Validate individual field
  const validateField = (fieldName: string, value: string) => {
    const fieldErrors: {[key: string]: string} = {};
    
    switch (fieldName) {
      case 'title':
        if (!value.trim()) {
          fieldErrors.title = "Le titre est obligatoire";
        }
        break;
      case 'content':
        if (!value.trim() || value === '<p><br></p>') {
          fieldErrors.content = "Le contenu est obligatoire";
        }
        break;
    }
    
    return fieldErrors;
  };



  // Fonction pour gérer l'upload d'image de couverture
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };



  // Handle field changes with validation
  const handleTitleChange = (value: string) => {
    setTitle(value);
    const fieldErrors = validateField('title', value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (fieldErrors.title) {
        newErrors.title = fieldErrors.title;
      } else {
        delete newErrors.title;
      }
      return newErrors;
    });
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    const fieldErrors = validateField('content', value);
    setErrors(prev => {
      const newErrors = { ...prev };
      if (fieldErrors.content) {
        newErrors.content = fieldErrors.content;
      } else {
        delete newErrors.content;
      }
      return newErrors;
    });
  };

  const handleSave = async (isDraft: boolean = false) => {
    try {
      console.log('🚀 [BlogEditor] Début de handleSave avec paramètres:', {
        isDraft,
        articleId: article?.id,
        title: title?.substring(0, 50) + '...',
        contentLength: content?.length,
        selectedFilesCount: selectedFiles?.length || 0
      });
      
      setLoading(true);
      
      // Validation complète des champs
      console.log('🔍 [BlogEditor] Début de la validation...');
      const fieldErrors = validateForm();
      console.log('📋 [BlogEditor] Résultat de la validation:', {
        errorsCount: Object.keys(fieldErrors).length,
        errors: fieldErrors
      });
      
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        console.log('❌ [BlogEditor] Validation échouée, arrêt du processus');
        toast({
          title: "Erreur de validation",
          description: "Veuillez corriger les erreurs dans le formulaire",
          variant: "destructive"
        });
        return;
      }
      
      // Clear errors if validation passes
      setErrors({});
      console.log('✅ [BlogEditor] Validation réussie, préparation des données...');

      // Préparation des données selon le DTO de l'API
      const newsData: any = {
        title: title.trim(),
        content: content.trim(),
        isPublic: isDraft ? false : isPublic,
        isFeatured: isFeatured
      };
      
      // Champs optionnels
      if (summary.trim()) {
        newsData.summary = summary.trim();
      }
      
      if (categoryId && categoryId !== 'none') {
        newsData.categoryId = categoryId;
      }
      
      // Images additionnelles (si supportées par l'API)
      if (additionalImages.length > 0) {
        newsData.additionalImages = additionalImages.map(img => img.url);
      }

      console.log('📦 [BlogEditor] Données préparées:', {
        newsData: {
          ...newsData,
          content: newsData.content?.substring(0, 100) + '...' // Tronquer le contenu pour les logs
        },
        selectedFilesInfo: selectedFiles?.map(f => ({ name: f.name, size: f.size, type: f.type })) || []
      });

      console.log('🌐 [BlogEditor] Appel API en cours...');
      let response;
      if (article?.id) {
        console.log('🔄 [BlogEditor] Mise à jour article existant, ID:', article.id);
        response = await newsService.updateNews(article.id, newsData, selectedFiles);
      } else {
        console.log('➕ [BlogEditor] Création nouvel article');
        response = await newsService.createNews(newsData, selectedFiles);
      }

      console.log('📡 [BlogEditor] Réponse API reçue:', {
        status: response?.status,
        hasData: !!response?.data,
        hasDataData: !!response?.data?.data,
        responseStructure: {
          data: response?.data ? Object.keys(response.data) : 'N/A',
          dataData: response?.data?.data ? Object.keys(response.data.data) : 'N/A'
        }
      });

      // Vérification de la structure de réponse API
      if (response?.data) {
        console.log('✅ [BlogEditor] Sauvegarde réussie!');
        toast({
          title: "Succès",
          description: article?.id 
            ? "Article mis à jour avec succès" 
            : "Article créé avec succès",
          variant: "default"
        });
        
        // Fermer le modal
        onClose();
      } else {
        console.log('❌ [BlogEditor] Format de réponse API inattendu');
        throw new Error("Format de réponse API inattendu");
      }
      
    } catch (error: any) {
      console.error('💥 [BlogEditor] Erreur lors de la sauvegarde:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        fullError: error
      });
      
      // Messages d'erreur spécifiques selon le type d'erreur
      let errorMessage = "Une erreur inattendue s'est produite";
      
      if (error.response?.status === 400) {
        errorMessage = "Données invalides. Vérifiez les champs obligatoires.";
      } else if (error.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter.";
      } else if (error.response?.status === 403) {
        errorMessage = "Vous n'avez pas les permissions nécessaires.";
      } else if (error.response?.status === 413) {
        errorMessage = "Les fichiers sont trop volumineux.";
      } else if (error.response?.status === 500) {
        errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur lors de la sauvegarde",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour gérer l'upload d'images additionnelles
  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name
      }));
      setAdditionalImages(prev => [...prev, ...newImages]);
    }
  };

  // Fonction pour supprimer une image additionnelle
  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(prev => {
      const updated = [...prev];
      // Libérer l'URL de l'objet pour éviter les fuites mémoire
      if (updated[index].url.startsWith('blob:')) {
        URL.revokeObjectURL(updated[index].url);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <div className="p-4 sm:p-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl lg:text-2xl">
              {article ? "Modifier l'article" : "Créer un nouvel article"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Remplissez les informations de votre article et ajoutez du contenu avec les blocs.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Sidebar - Article meta */}
            <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-semibold">Informations générales</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre de l'article *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      onBlur={(e) => handleTitleChange(e.target.value)}
                      placeholder="Saisissez le titre de votre article..."
                      className={`font-medium ${errors.title ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {errors.title && (
                      <div className="flex items-center gap-1 text-red-500 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.title}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">Résumé (optionnel)</Label>
                    <Textarea
                      id="summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Résumé court de l'article..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={categoryId} onValueChange={setCategoryId} disabled={loadingCategories}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? "Chargement..." : "Sélectionner une catégorie"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune catégorie</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Image de couverture</Label>
                    
                    <div className="space-y-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            setSelectedFiles([files[0]]);
                          }
                        }}
                      />
                      {selectedFiles.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Fichier sélectionné: {selectedFiles[0].name}
                        </p>
                      )}
                    </div>

                    {/* Preview */}
                    {imageUrl && (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={imageUrl} 
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {selectedFiles.length > 0 && (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={URL.createObjectURL(selectedFiles[0])} 
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPublic"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                      <Label htmlFor="isPublic">Article public</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isFeatured"
                        checked={isFeatured}
                        onCheckedChange={setIsFeatured}
                      />
                      <Label htmlFor="isFeatured">Article en vedette</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images additionnelles */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Images additionnelles</h3>
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImagesUpload}
                    />
                    
                    {additionalImages.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {additionalImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={image.url} 
                              alt={`Additional ${index + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0"
                              onClick={() => removeAdditionalImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content area */}
            <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
              <div className="space-y-4">
                {/* Contenu avec ReactQuill */}
                <div className="space-y-2">
                  <Label>Contenu de l'article *</Label>
                  <div className={`border rounded-lg ${errors.content ? 'border-red-500' : ''}`}>
                    <ReactQuill
                      ref={quillRef}
                      value={content}
                      onChange={handleContentChange}
                      onBlur={() => handleContentChange(content)}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="Rédigez le contenu de votre article..."
                      style={{ minHeight: '400px' }}
                    />
                  </div>
                  {errors.content && (
                    <div className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{errors.content}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              className="order-4 sm:order-1 w-full sm:w-auto"
            >
              Annuler
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2 sm:ml-auto">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto order-3 sm:order-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Aperçu</span>
                <span className="sm:hidden">Voir</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleSave(true)}
                disabled={loading}
                className="border-orange-200 text-orange-700 hover:bg-orange-50 w-full sm:w-auto order-2 sm:order-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Enregistrement...</span>
                    <span className="sm:hidden">Enreg...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Enregistrer comme brouillon</span>
                    <span className="sm:hidden">Brouillon</span>
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => handleSave(false)} 
                disabled={loading}
                className="bg-primary hover:bg-primary-hover w-full sm:w-auto order-1 sm:order-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">{article ? "Mise à jour..." : "Publication..."}</span>
                    <span className="sm:hidden">{article ? "MAJ..." : "Pub..."}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{article ? "Mettre à jour" : "Publier"}</span>
                    <span className="sm:hidden">{article ? "Modifier" : "Publier"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { BlogEditor };