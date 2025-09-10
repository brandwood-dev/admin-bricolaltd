import { useState, useEffect } from "react";
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
  Plus, 
  Image as ImageIcon, 
  FileText, 
  Video, 
  Trash2, 
  Save,
  Eye,
  Upload,
  GripVertical,
  Type,
  Edit3,
  Loader2
} from "lucide-react";
import { newsService, News } from "@/services/newsService";

// NewsCategory interface for static categories
interface NewsCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
import { useToast } from "@/hooks/use-toast";

interface BlogEditorProps {
  article?: News | null;
  isOpen: boolean;
  onClose: () => void;
  categories: NewsCategory[];
}

interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'title';
  content: string;
  caption?: string;
}

const BlogEditor = ({ article, isOpen, onClose, categories }: BlogEditorProps) => {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [loading, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'text', content: 'Commencez à écrire votre article ici...' }
  ]);
  const { toast } = useToast();

  // Initialize form with article data when editing
  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setSummary(article.summary || "");
      setContent(article.content || "");
      setImageUrl(article.imageUrl || "");
      setCategoryId(article.categoryId || "none");
      setIsPublic(article.isPublic || false);
      setIsFeatured(article.isFeatured || false);
      // Parse content blocks from HTML content if needed
      if (article.content) {
        setContentBlocks([
          { id: '1', type: 'text', content: article.content }
        ]);
      }
    } else {
      // Reset form for new article
      setTitle("");
      setSummary("");
      setContent("");
      setImageUrl("");
      setCategoryId("none");
      setIsPublic(false);
      setIsFeatured(false);
      setContentBlocks([
        { id: '1', type: 'text', content: 'Commencez à écrire votre article ici...' }
      ]);
    }
  }, [article, isOpen]);

  const addContentBlock = (type: 'text' | 'image' | 'video' | 'title') => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: type === 'text' ? 'Nouveau paragraphe...' : 
               type === 'title' ? 'Nouveau titre' : '',
      caption: type !== 'text' && type !== 'title' ? '' : undefined
    };
    const updatedBlocks = [...contentBlocks, newBlock];
    setContentBlocks(updatedBlocks);
    // Update the main content field with HTML
    setContent(convertBlocksToHTML(updatedBlocks));
  };

  const updateContentBlock = (id: string, field: string, value: string) => {
    const updatedBlocks = contentBlocks.map(block => 
      block.id === id ? { ...block, [field]: value } : block
    );
    setContentBlocks(updatedBlocks);
    // Update the main content field with HTML
    setContent(convertBlocksToHTML(updatedBlocks));
  };

  const removeContentBlock = (id: string) => {
    const updatedBlocks = contentBlocks.filter(block => block.id !== id);
    setContentBlocks(updatedBlocks);
    // Update the main content field with HTML
    setContent(convertBlocksToHTML(updatedBlocks));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newBlocks = [...contentBlocks];
    const draggedBlock = newBlocks[draggedIndex];
    
    // Remove the dragged block from its original position
    newBlocks.splice(draggedIndex, 1);
    
    // Insert the dragged block at the new position
    newBlocks.splice(dropIndex, 0, draggedBlock);
    
    setContentBlocks(newBlocks);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const renderContentBlock = (block: ContentBlock, index: number) => {
    const isDragging = draggedIndex === index;
    
    switch (block.type) {
      case 'title':
        return (
          <div key={block.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="cursor-move hover:bg-gray-100 p-1 rounded"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  title="Glisser pour réorganiser"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <Type className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Titre {index + 1}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeContentBlock(block.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Input
              value={block.content}
              onChange={(e) => updateContentBlock(block.id, 'content', e.target.value)}
              placeholder="Saisissez votre titre ici..."
              className="font-bold text-lg"
            />
            {block.content && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Aperçu :</p>
                <h2 className="font-bold text-lg text-gray-900">{block.content}</h2>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div key={block.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="cursor-move hover:bg-gray-100 p-1 rounded"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  title="Glisser pour réorganiser"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Bloc de texte {index + 1}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeContentBlock(block.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <Textarea
              value={block.content}
              onChange={(e) => updateContentBlock(block.id, 'content', e.target.value)}
              placeholder="Rédigez le contenu de ce bloc..."
              className="min-h-32"
            />
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="cursor-move hover:bg-gray-100 p-1 rounded"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  title="Glisser pour réorganiser"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <ImageIcon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Image {index + 1}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeContentBlock(block.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="space-y-3">
              <Input
                value={block.content}
                onChange={(e) => updateContentBlock(block.id, 'content', e.target.value)}
                placeholder="URL de l'image ou uploader..."
              />
              {block.content && block.content.startsWith('http') && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={block.content} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <Input
                value={block.caption || ''}
                onChange={(e) => updateContentBlock(block.id, 'caption', e.target.value)}
                placeholder="Légende de l'image (optionnel)"
              />
            </div>
          </div>
        );

      case 'video':
        return (
          <div key={block.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="cursor-move hover:bg-gray-100 p-1 rounded"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  title="Glisser pour réorganiser"
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <Video className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Vidéo {index + 1}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeContentBlock(block.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="space-y-3">
              <Input
                value={block.content}
                onChange={(e) => updateContentBlock(block.id, 'content', e.target.value)}
                placeholder="URL de la vidéo (YouTube, Vimeo...)"
              />
              <Input
                value={block.caption || ''}
                onChange={(e) => updateContentBlock(block.id, 'caption', e.target.value)}
                placeholder="Description de la vidéo (optionnel)"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Convert content blocks to HTML
  const convertBlocksToHTML = (blocks: ContentBlock[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case 'title':
          return `<h2>${block.content}</h2>`;
        case 'text':
          return `<p>${block.content.replace(/\n/g, '<br>')}</p>`;
        case 'image':
          return `<div class="image-block"><img src="${block.content}" alt="${block.caption || ''}" />${block.caption ? `<p class="caption">${block.caption}</p>` : ''}</div>`;
        case 'video':
          return `<div class="video-block"><iframe src="${block.content}" frameborder="0" allowfullscreen></iframe>${block.caption ? `<p class="caption">${block.caption}</p>` : ''}</div>`;
        default:
          return '';
      }
    }).join('\n');
  };

  const handleSave = async (isDraft: boolean = false) => {
    if (!title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre est obligatoire.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    
    try {
      const htmlContent = convertBlocksToHTML(contentBlocks);
      
      const newsData = {
        title: title.trim(),
        content: htmlContent,
        summary: summary.trim(),
        imageUrl: imageUrl.trim() || undefined,
        categoryId: categoryId === 'none' ? undefined : categoryId || undefined,
        isPublic: isDraft ? false : isPublic,
        isFeatured: isFeatured
      };

      let response;
      if (article) {
        // Update existing article
        response = await newsService.updateNews(article.id, newsData);
      } else {
        // Create new article
        response = await newsService.createNews(newsData);
      }

      if (response.success) {
        toast({
          title: "Succès",
          description: article 
            ? "Article mis à jour avec succès." 
            : isDraft 
              ? "Article enregistré comme brouillon." 
              : "Article publié avec succès.",
        });
        onClose();
      } else {
        throw new Error(response.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'article.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titre de l'article"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">Résumé</Label>
                    <Textarea
                      id="summary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Résumé de l'article..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                    <SelectItem value="none">Aucune catégorie</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image de couverture</Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="URL de l'image"
                    />
                    {imageUrl && (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={imageUrl} 
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

              {/* Content blocks toolbar */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Ajouter du contenu</h3>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover-scale"
                      onClick={() => addContentBlock('title')}
                    >
                      <Type className="h-4 w-4 mr-2" />
                      Titre
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover-scale"
                      onClick={() => addContentBlock('text')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Bloc de texte
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover-scale"
                      onClick={() => addContentBlock('image')}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Image
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start hover-scale"
                      onClick={() => addContentBlock('video')}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Vidéo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main content area */}
            <div className="lg:col-span-2 space-y-4 order-1 lg:order-2">
              <h3 className="font-semibold text-base sm:text-lg">Contenu de l'article</h3>
              
              <div className="space-y-6">
                {contentBlocks.map((block, index) => {
                  const isDragging = draggedIndex === index;
                  return (
                    <div
                      key={block.id}
                      className={`transition-all duration-200 ${isDragging ? 'opacity-50 scale-95' : ''}`}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <Card className={`hover:shadow-md transition-shadow ${isDragging ? 'border-primary border-2' : ''}`}>
                        <CardContent className="p-4">
                          {renderContentBlock(block, index)}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>

              {contentBlocks.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun contenu ajouté</p>
                      <p className="text-sm">Utilisez les boutons à gauche pour ajouter du contenu</p>
                    </div>
                  </CardContent>
                </Card>
              )}
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