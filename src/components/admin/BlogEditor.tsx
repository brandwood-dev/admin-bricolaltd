import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Save, Loader2, AlertCircle, Edit3 } from 'lucide-react'
import SectionEditor from '@/components/admin/SectionEditor'
import { newsService } from '@/services/newsService'
import { IntelligentArticleSaver } from './IntelligentArticleSaver'
import { useToast } from '@/hooks/use-toast'

interface BlogEditorProps {
  article?: any | null
  isOpen: boolean
  onClose: () => void
}

interface Paragraph {
  id: string;
  content: string;
  orderIndex: number;
}

interface SectionImage {
  id: string;
  url: string;
  alt?: string;
  orderIndex: number;
}

interface Section {
  id: string;
  title: string;
  orderIndex: number;
  paragraphs: Paragraph[];
  images: SectionImage[];
}

const BlogEditor = ({ article, isOpen, onClose }: BlogEditorProps) => {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [sections, setSections] = useState<Section[]>([])
  const [pendingImages, setPendingImages] = useState<Array<{
    sectionId: string;
    file: File;
    tempImageId: string;
    alt?: string;
  }>>([])
  const [imageUrl, setImageUrl] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [category, setCategory] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const { toast } = useToast()

  // Nouveaux états pour UX et validation
  const [progressStep, setProgressStep] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [canSubmit, setCanSubmit] = useState(true)

  // Catégories statiques (enregistrer le nom)
  const categories = [
    'Jardinage',
    'Entretien',
    'Transport',
    'Bricolage',
    'Électricité',
    'Éclairage',
    'Peinture',
    'Construction',
    'Plantes',
    'Nettoyage',
    'Décoration',
    'Guide',
  ]

  // Autosave brouillon local
  const DRAFT_KEY = 'blog-editor-draft'
  useEffect(() => {
    if (isOpen && !article) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) {
          const draft = JSON.parse(saved)
          setTitle(draft.title || '')
          setSummary(draft.summary || '')
          setSections(draft.sections || [])
          setCategory(draft.category || '')
          setIsPublic(draft.isPublic ?? true)
        }
      } catch {}
    }
  }, [isOpen, article])

  useEffect(() => {
    if (!isOpen) return
    const payload = {
      title,
      summary,
      sections,
      category,
      isPublic,
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    } catch {}
  }, [title, summary, sections, category, isPublic, isOpen])

  // Confirmation avant fermeture si modifications non enregistrées
  const requestClose = () => {
    if (isDirty) {
      const ok = window.confirm(
        'Vous avez des modifications non enregistrées. Voulez-vous fermer malgré tout ?'
      )
      if (!ok) return
    }
    onClose()
  }

  useEffect(() => {
    if (article) {
      console.log('BlogEditor - Loading article:', article)
      console.log('BlogEditor - Article sections:', article.sections)
      console.log('BlogEditor - Number of sections:', article.sections?.length)
      
      setTitle(article.title || '')
      setSummary(article.summary || '')
      // Convertir le contenu HTML en sections si nécessaire
      if (article.sections && article.sections.length > 0) {
        console.log('BlogEditor - Setting sections from article:', article.sections)
        setSections(article.sections)
      } else if (article.content) {
        // Convertir le contenu HTML existant en une section par défaut
        const defaultSection: Section = {
          id: 'section-1',
          title: 'Contenu principal',
          orderIndex: 0,
          paragraphs: [{ id: 'para-1', content: article.content, orderIndex: 0 }],
          images: []
        }
        console.log('BlogEditor - Creating default section from content:', defaultSection)
        setSections([defaultSection])
      } else {
        console.log('BlogEditor - No sections or content found, setting empty sections')
        setSections([])
      }
      setImageUrl(article.imageUrl || '')
      // Utiliser le nom si présent
      setCategory(article.category || '')
      setIsPublic(article.isPublic ?? true)
    } else {
      console.log('BlogEditor - No article provided, resetting form')
      setTitle('')
      setSummary('')
      setSections([])
      setImageUrl('')
      setSelectedFiles([])
      setCategory('')
      setIsPublic(true)
    }
    setErrors({})
  }, [article, isOpen])

  useEffect(() => {
    const trimmedTitle = title.trim()
    const hasContent = sections.some(section => 
      section.paragraphs.some(para => para.content.trim().length > 0) ||
      section.images.some(img => img.url.trim().length > 0)
    )
    const hasFieldErrors = Object.keys(errors).length > 0
    const basicInvalid =
      !trimmedTitle ||
      trimmedTitle.length < 5 ||
      trimmedTitle.length > 200 ||
      !hasContent ||
      !category
    setCanSubmit(!hasFieldErrors && !basicInvalid)
    setIsDirty(
      !!(
        trimmedTitle ||
        summary ||
        sections.length > 0 ||
        imageUrl ||
        category ||
        selectedFiles.length
      )
    )
  }, [
    title,
    summary,
    sections,
    imageUrl,
    category,
    errors,
  ])

  const validateForm = () => {
    const fieldErrors: { [key: string]: string } = {}

    if (!title || title.trim().length === 0) {
      fieldErrors.title = 'Le titre est obligatoire'
    } else if (title.trim().length < 5) {
      fieldErrors.title = 'Le titre doit contenir au moins 5 caractères'
    } else if (title.trim().length > 200) {
      fieldErrors.title = 'Le titre ne peut pas dépasser 200 caractères'
    }

    const hasContent = sections.some(section => 
      section.paragraphs.some(para => para.content.trim().length > 0) ||
      section.images.some(img => img.url.trim().length > 0)
    )
    if (!hasContent) {
      fieldErrors.sections = 'Le contenu est obligatoire (au moins une section avec du contenu)'
    } else {
      const totalContentLength = sections.reduce((total, section) => 
        total + section.paragraphs.reduce((paraTotal, para) => 
          paraTotal + para.content.trim().length, 0
        ), 0
      )
      if (totalContentLength < 50) {
        fieldErrors.sections = 'Le contenu doit contenir au moins 50 caractères au total'
      }
    }

    if (!category) {
      fieldErrors.category = 'La catégorie est obligatoire'
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024
    if (selectedFiles && selectedFiles.length > 0) {
      const file = selectedFiles[0]
      if (!allowedTypes.includes(file.type)) {
        fieldErrors.coverImage =
          'Le fichier doit être une image (jpg, png, webp)'
      } else if (file.size > maxSize) {
        fieldErrors.coverImage =
          "L'image doit être inférieure à 5 Mo"
      }
    }

    return fieldErrors
  }

  const validateField = (field: string, value: string) => {
    const fieldErrors: { [key: string]: string } = {}
    switch (field) {
      case 'title':
        if (!value.trim()) {
          fieldErrors.title = 'Le titre est obligatoire'
        } else if (value.trim().length < 5) {
          fieldErrors.title = 'Le titre doit contenir au moins 5 caractères'
        } else if (value.trim().length > 200) {
          fieldErrors.title = 'Le titre ne peut pas dépasser 200 caractères'
        }
        break
      case 'content':
        if (!value.trim() || value === '<p><br></p>') {
          fieldErrors.content = 'Le contenu est obligatoire'
        } else if (value.trim().length < 50) {
          fieldErrors.content =
            'Le contenu doit contenir au moins 50 caractères'
        }
        break
      case 'category':
        if (!value || value === '') {
          fieldErrors.category = 'La catégorie est obligatoire'
        }
        break
    }
    return fieldErrors
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    const fieldErrors = validateField('title', value)
    setErrors((prev) => {
      const newErrors = { ...prev }
      if (fieldErrors.title) newErrors.title = fieldErrors.title
      else delete newErrors.title
      return newErrors
    })
  }

  const handleSectionsChange = (newSections: Section[]) => {
    setSections(newSections)
    // Validation du contenu des sections
    const hasContent = newSections.some(section => 
      section.paragraphs.some(para => para.content.trim().length > 0) ||
      section.images.some(img => img.url.trim().length > 0)
    )
    setErrors((prev) => {
      const newErrors = { ...prev }
      if (!hasContent) {
        newErrors.sections = 'Le contenu est obligatoire (au moins une section avec du contenu)'
      } else {
        delete newErrors.sections
      }
      return newErrors
    })
  }

  // New method to handle bulk image uploads after article save
  const handleBulkImageUploads = async (savedArticle: any, pendingImages: any[]) => {
    if (!pendingImages.length) return;
    
    console.log(`[BlogEditor] Processing ${pendingImages.length} pending image uploads`);
    const uploadPromises = [];
    
    for (const pendingImage of pendingImages) {
      const { sectionId, file, alt, tempImageId } = pendingImage;
      
      console.log(`[BlogEditor] Uploading image for section ${sectionId}:`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        tempImageId
      });
      
      uploadPromises.push(
        newsService.uploadSectionImage(sectionId, file, alt)
          .then(response => {
            console.log(`[BlogEditor] Image uploaded successfully for section ${sectionId}:`, response.data?.url);
            return { success: true, sectionId, tempImageId, url: response.data?.url };
          })
          .catch(error => {
            console.error(`[BlogEditor] Failed to upload image for section ${sectionId}:`, error);
            return { success: false, sectionId, tempImageId, error };
          })
      );
    }
    
    const results = await Promise.allSettled(uploadPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    console.log(`[BlogEditor] Bulk upload completed: ${successful} successful, ${failed} failed`);
    
    // Update sections with real URLs for successful uploads
    const successfulUploads = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => (r as any).value);
    
    if (successfulUploads.length > 0) {
      setSections(prevSections => {
        const updatedSections = [...prevSections];
        
        successfulUploads.forEach((upload: any) => {
          const sectionIndex = updatedSections.findIndex(s => s.id === upload.sectionId);
          if (sectionIndex !== -1) {
            const updatedSection = { ...updatedSections[sectionIndex] };
            const imageIndex = updatedSection.images.findIndex(img => img.id === upload.tempImageId);
            if (imageIndex !== -1) {
              updatedSection.images[imageIndex] = { 
                ...updatedSection.images[imageIndex], 
                url: upload.url 
              };
            }
            updatedSections[sectionIndex] = updatedSection;
          }
        });
        
        return updatedSections;
      });
    }
    
    // Remove failed uploads
    const failedUploads = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => r.status === 'fulfilled' ? (r as any).value : null)
      .filter(Boolean);
    
    if (failedUploads.length > 0) {
      setSections(prevSections => {
        const updatedSections = [...prevSections];
        
        failedUploads.forEach((upload: any) => {
          const sectionIndex = updatedSections.findIndex(s => s.id === upload.sectionId);
          if (sectionIndex !== -1) {
            const updatedSection = { ...updatedSections[sectionIndex] };
            updatedSection.images = updatedSection.images.filter(img => img.id !== upload.tempImageId);
            updatedSections[sectionIndex] = updatedSection;
          }
        });
        
        return updatedSections;
      });
    }
    
    if (failed > 0) {
      toast({
        title: 'Téléversement partiel',
        description: `${successful} images téléversées avec succès, ${failed} ont échoué`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Téléversement terminé',
        description: `${successful} images téléversées avec succès`,
        variant: 'default',
      });
    }
  };

  const handleImageQueue = (sectionId: string, file: File, tempImageId: string, alt?: string) => {
    console.log(`[BlogEditor] Queuing image for section ${sectionId}:`, {
      tempImageId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      alt
    });
    
    setPendingImages(prev => [...prev, {
      sectionId,
      file,
      tempImageId,
      alt
    }]);
  };

  const handleSequentialSave = async (isDraft: boolean = false) => {
    try {
      // Prepare the data for intelligent saver
      const saverData = {
        title,
        summary: summary.trim() || undefined,
        category: category || undefined,
        isPublic: isDraft ? false : isPublic,
        coverImageFile: selectedFiles?.[0],
        sections: sections.map(section => ({
          ...section,
          images: section.images.map(img => ({
            ...img,
            file: img.file // Include the file for upload
          }))
        })),
        existingArticleId: article?.id
      };

      console.log('[BlogEditor] Starting intelligent save with data:', {
        title: saverData.title,
        sectionsCount: saverData.sections.length,
        hasCoverImage: !!saverData.coverImageFile,
        isUpdate: !!saverData.existingArticleId
      });

      // Use the new IntelligentArticleSaver component
      // We'll create a modal or integrate it into the existing flow
      // For now, let's use a simpler approach - call the intelligent save directly
      await performIntelligentSave(saverData);
      
    } catch (error: any) {
      console.error('[BlogEditor] Intelligent save error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Échec de la sauvegarde intelligente',
        variant: 'destructive'
      });
    }
  };

  const performIntelligentSave = async (data: any) => {
    setLoading(true);
    setProgressStep('Préparation de la sauvegarde intelligente...');
    
    try {
      // Use the IntelligentArticleSaver service
      const { intelligentArticleService } = await import('@/services/intelligentArticleService');
      
      const result = await intelligentArticleService.performIntelligentSave({
        articleId: data.existingArticleId,
        title: data.title,
        summary: data.summary,
        category: data.category,
        isPublic: data.isPublic,
        coverImageFile: data.coverImageFile,
        sections: data.sections,
        onProgress: (step: string) => {
          setProgressStep(step);
        }
      });

      if (result.success) {
        toast({
          title: 'Succès',
          description: data.existingArticleId ? 'Article mis à jour avec succès' : 'Article créé avec succès',
          variant: 'default'
        });
        
        // Clear draft and close
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
        onClose();
      } else {
        throw new Error(result.error || 'Échec de la sauvegarde intelligente');
      }
      
    } catch (error) {
      setProgressStep('');
      setLoading(false);
      throw error;
    }
  };

  const handleSectionImageUpload = async (sectionId: string, file: File, alt?: string): Promise<{ url: string }> => {
    // Instead of uploading immediately, create a temporary image and queue for later upload
    const tempImageId = `temp-upload-${Date.now()}`;
    const tempUrl = URL.createObjectURL(file);
    
    console.log(`[BlogEditor] Creating temporary image for section ${sectionId}:`, {
      tempImageId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      tempUrl
    });
    
    // Return the temporary URL immediately
    return { url: tempUrl };
  };

  const handleSave = async (isDraft: boolean = false) => {
    try {
      setLoading(true)
      setProgressStep('Validation du formulaire…')
      const fieldErrors = validateForm()
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        setProgressStep('')
        toast({
          title: 'Erreur de validation',
          description: 'Veuillez corriger les erreurs dans le formulaire',
          variant: 'destructive',
        })
        return
      }

      // Use the intelligent save system
      await handleSequentialSave(isDraft);
      
    } catch (error: any) {
      setProgressStep('')
      setLoading(false)
      
      const apiErrors = error?.response?.data?.errors
      if (apiErrors && typeof apiErrors === 'object') {
        const mapped: { [key: string]: string } = {}
        Object.keys(apiErrors).forEach((field) => {
          const msgs = apiErrors[field]
          if (Array.isArray(msgs) && msgs.length > 0) {
            mapped[field] = msgs[0]
          }
        })
        setErrors(mapped)
      }

      let errorMessage = "Une erreur inattendue s'est produite"
      if (error.response?.status === 400)
        errorMessage = 'Données invalides. Vérifiez les champs obligatoires.'
      else if (error.response?.status === 401)
        errorMessage = 'Session expirée. Veuillez vous reconnecter.'
      else if (error.response?.status === 403)
        errorMessage = "Vous n'avez pas les permissions nécessaires."
      else if (error.response?.status === 413)
        errorMessage = 'Les fichiers sont trop volumineux.'
      else if (error.response?.status === 500)
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.'
      else if (error.message) errorMessage = error.message

      toast({
        title: 'Erreur lors de la sauvegarde',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          requestClose()
        }
      }}
    >
      <DialogContent className='max-w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0'>
        <div className='p-4 sm:p-6 border-b'>
          <DialogHeader>
            <DialogTitle className='text-lg sm:text-xl lg:text-2xl'>
              {article ? "Modifier l'article" : 'Créer un nouvel article'}
            </DialogTitle>
            <DialogDescription className='text-sm sm:text-base'>
              Remplissez les informations de votre article et ajoutez du contenu
              avec les blocs.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className='flex-1 overflow-y-auto p-4 sm:p-6'>
          {Object.keys(errors).length > 0 && (
            <div className='mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded'>
              <div className='flex items-center mb-2'>
                <AlertCircle className='h-4 w-4 mr-2' />
                <span>Veuillez corriger les erreurs suivantes :</span>
              </div>
              <ul className='list-disc list-inside text-sm'>
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {loading && progressStep && (
            <div className='mb-4 p-3 border border-blue-200 bg-blue-50 text-blue-700 rounded'>
              <div className='flex items-center'>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                <span>{progressStep}</span>
              </div>
            </div>
          )}

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
            <div className='space-y-4 sm:space-y-6 order-2 lg:order-1'>
              <Card>
                <CardContent className='p-4 space-y-4'>
                  <h3 className='font-semibold'>Informations générales</h3>

                  <div className='space-y-2'>
                    <Label htmlFor='title'>Titre de l'article *</Label>
                    <Input
                      id='title'
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      onBlur={(e) => handleTitleChange(e.target.value)}
                      placeholder='Saisissez le titre de votre article...'
                      className={`font-medium ${
                        errors.title
                          ? 'border-red-500 focus:border-red-500'
                          : ''
                      }`}
                    />
                    {errors.title && (
                      <div className='flex items-center gap-1 text-red-500 text-sm'>
                        <AlertCircle className='h-4 w-4' />
                        <span>{errors.title}</span>
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='summary'>Résumé (optionnel)</Label>
                    <Textarea
                      id='summary'
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Résumé court de l'article..."
                      rows={3}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='category'>Catégorie *</Label>
                    <Select
                      value={category}
                      onValueChange={(val) => {
                        setCategory(val)
                        const fieldErrors = validateField('category', val)
                        setErrors((prev) => ({ ...prev, ...fieldErrors }))
                      }}
                    >
                      <SelectTrigger
                        className={`${
                          errors.category
                            ? 'border-red-500 focus:border-red-500'
                            : ''
                        }`}
                      >
                        <SelectValue placeholder={'Sélectionner une catégorie'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <div className='flex items-center gap-1 text-red-500 text-sm'>
                        <AlertCircle className='h-4 w-4' />
                        <span>{errors.category}</span>
                      </div>
                    )}
                  </div>

                  <div className='space-y-2'>
                    <Label>Image de couverture</Label>

                    <div className='space-y-2'>
                      <Input
                        type='file'
                        accept='image/*'
                        onChange={(e) => {
                          const files = e.target.files
                          if (files && files.length > 0) {
                            const file = files[0]
                            const allowedTypes = [
                              'image/jpeg',
                              'image/png',
                              'image/webp',
                            ]
                            const maxSize = 5 * 1024 * 1024
                            const newErrors: any = { ...errors }
                            if (!allowedTypes.includes(file.type)) {
                              newErrors.coverImage =
                                'Le fichier doit être une image (jpg, png, webp)'
                            } else if (file.size > maxSize) {
                              newErrors.coverImage =
                                "L'image doit être inférieure à 5 Mo"
                            } else {
                              delete newErrors.coverImage
                            }
                            setErrors(newErrors)
                            setSelectedFiles([file])
                          }
                        }}
                      />
                      {errors.coverImage && (
                        <div className='flex items-center gap-1 text-red-500 text-sm'>
                          <AlertCircle className='h-4 w-4' />
                          <span>{errors.coverImage}</span>
                        </div>
                      )}
                      {selectedFiles.length > 0 && (
                        <p className='text-sm text-gray-600'>
                          Fichier sélectionné: {selectedFiles[0].name} (
                          {selectedFiles[0].type || 'type inconnu'},{' '}
                          {(selectedFiles[0].size / (1024 * 1024)).toFixed(2)}{' '}
                          Mo)
                        </p>
                      )}
                    </div>

                    {imageUrl && (
                      <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                        <img
                          src={imageUrl}
                          alt='Cover preview'
                          className='w-full h-full object-cover'
                        />
                      </div>
                    )}

                    {selectedFiles.length > 0 && (
                      <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                        <img
                          src={URL.createObjectURL(selectedFiles[0])}
                          alt='Cover preview'
                          className='w-full h-full object-cover'
                        />
                      </div>
                    )}
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='isPublic'
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor='isPublic'>Article public</Label>
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className='lg:col-span-2 space-y-4 order-1 lg:order-2'>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Contenu de l'article *</Label>
                  <div
                    className={`border rounded-lg ${
                      errors.sections ? 'border-red-500' : ''
                    }`}
                  >
                    <SectionEditor
                      sections={sections}
                      onSectionsChange={handleSectionsChange}
                      onImageUpload={handleSectionImageUpload}
                      onImageQueue={handleImageQueue}
                    />
                  </div>
                  {errors.sections && (
                    <div className='flex items-center gap-1 text-red-500 text-sm'>
                      <AlertCircle className='h-4 w-4' />
                      <span>{errors.sections}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='p-4 sm:p-6 border-t bg-gray-50'>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
            <Button
              variant='outline'
              onClick={requestClose}
              disabled={loading}
              className='order-4 sm:order-1 w-full sm:w-auto'
            >
              Annuler
            </Button>

            <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2 sm:ml-auto'>
              <Button
                variant='outline'
                onClick={() => handleSequentialSave(true)}
                disabled={loading || !canSubmit}
                className='border-orange-200 text-orange-700 hover:bg-orange-50 w-full sm:w-auto order-2 sm:order-1'
              >
                {loading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    <span className='hidden sm:inline'>Enregistrement...</span>
                    <span className='sm:hidden'>Enreg...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className='h-4 w-4 mr-2' />
                    <span className='hidden sm:inline'>
                      Enregistrer comme brouillon
                    </span>
                    <span className='sm:hidden'>Brouillon</span>
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleSequentialSave(false)}
                disabled={loading || !canSubmit}
                className='bg-primary hover:bg-primary-hover w-full sm:w-auto order-1 sm:order-2'
              >
                {loading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    <span className='hidden sm:inline'>
                      {article ? 'Mise à jour...' : 'Publication...'}
                    </span>
                    <span className='sm:hidden'>
                      {article ? 'MAJ...' : 'Pub...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4 mr-2' />
                    <span className='hidden sm:inline'>
                      {article ? 'Mettre à jour' : 'Publier'}
                    </span>
                    <span className='sm:hidden'>
                      {article ? 'Modifier' : 'Publier'}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { BlogEditor }
