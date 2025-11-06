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
import { Save, Eye, Loader2, AlertCircle, Edit3 } from 'lucide-react'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { newsService } from '../../services/newsService'
import { useToast } from '@/hooks/use-toast'

interface BlogEditorProps {
  article?: any | null
  isOpen: boolean
  onClose: () => void
}

const BlogEditor = ({ article, isOpen, onClose }: BlogEditorProps) => {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [category, setCategory] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const { toast } = useToast()

  // Nouveaux états pour UX et validation
  const [progressStep, setProgressStep] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [canSubmit, setCanSubmit] = useState(true)

  // Catégories statiques (enregistrer le nom)
  const categories = [
    'Technologie',
    'Bricolage',
    'Jardinage',
    'Décoration',
    'Électricité',
    'Plomberie',
    'Menuiserie',
    'Peinture',
  ]

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'],
    ],
  }

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'blockquote',
    'code-block',
    'link',
    'image',
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
          setContent(draft.content || '')
          setCategory(draft.category || '')
          setIsPublic(draft.isPublic ?? true)
          setIsFeatured(draft.isFeatured ?? false)
        }
      } catch {}
    }
  }, [isOpen, article])

  useEffect(() => {
    if (!isOpen) return
    const payload = {
      title,
      summary,
      content,
      category,
      isPublic,
      isFeatured,
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
    } catch {}
  }, [title, summary, content, category, isPublic, isFeatured, isOpen])

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
      setTitle(article.title || '')
      setSummary(article.summary || '')
      setContent(article.content || '')
      setImageUrl(article.imageUrl || '')
      // Utiliser le nom si présent
      setCategory(article.category || '')
      setIsPublic(article.isPublic ?? true)
      setIsFeatured(article.isFeatured ?? false)
    } else {
      setTitle('')
      setSummary('')
      setContent('')
      setImageUrl('')
      setSelectedFiles([])
      setCategory('')
      setIsPublic(true)
      setIsFeatured(false)
    }
    setErrors({})
  }, [article, isOpen])

  useEffect(() => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const hasFieldErrors = Object.keys(errors).length > 0
    const basicInvalid =
      !trimmedTitle ||
      trimmedTitle.length < 5 ||
      trimmedTitle.length > 200 ||
      !trimmedContent ||
      trimmedContent.length < 50 ||
      !category
    setCanSubmit(!hasFieldErrors && !basicInvalid)
    setIsDirty(
      !!(
        trimmedTitle ||
        summary ||
        trimmedContent ||
        imageUrl ||
        category ||
        selectedFiles.length
      )
    )
  }, [
    title,
    summary,
    content,
    imageUrl,
    category,
    selectedFiles,
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

    if (!content || content.trim().length === 0 || content === '<p><br></p>') {
      fieldErrors.content = 'Le contenu est obligatoire'
    } else if (content.trim().length < 50) {
      fieldErrors.content = 'Le contenu doit contenir au moins 50 caractères'
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

  const handleContentChange = (value: string) => {
    setContent(value)
    const fieldErrors = validateField('content', value)
    setErrors((prev) => {
      const newErrors = { ...prev }
      if (fieldErrors.content) newErrors.content = fieldErrors.content
      else delete newErrors.content
      return newErrors
    })
  }

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

      setErrors({})
      setProgressStep('Préparation des données…')
      const newsData: any = {
        title: title.trim(),
        content: content.trim(),
        isPublic: isDraft ? false : isPublic,
        isFeatured: isFeatured,
      }
      if (summary.trim()) newsData.summary = summary.trim()
      if (category) newsData.category = category

      // Construire les fichiers à envoyer: 1er = image de couverture
      const filesToSend: File[] = []
      if (selectedFiles && selectedFiles.length > 0) {
        filesToSend.push(selectedFiles[0])
      }

      setProgressStep(
        article?.id ? 'Mise à jour en cours…' : 'Création en cours…'
      )
      let response
      if (article?.id) {
        // Si une nouvelle image de couverture est fournie, activer le remplacement côté service
        if (selectedFiles && selectedFiles.length > 0) {
          newsData.replaceMainImage = true
          console.log('[BlogEditor] Envoi mise à jour avec remplacement image', {
            replaceMainImage: newsData.replaceMainImage,
            filesCount: filesToSend.length,
            fileName: filesToSend[0]?.name,
            fileType: filesToSend[0]?.type,
            fileSizeMB: filesToSend[0] ? (filesToSend[0].size / (1024 * 1024)).toFixed(2) : undefined,
          })
        }
        response = await newsService.updateNews(
          article.id,
          newsData,
          filesToSend
        )
      } else {
        response = await newsService.createNews(newsData, filesToSend)
      }

      setProgressStep('Finalisation…')
      if (response?.data) {
        toast({
          title: 'Succès',
          description: article?.id
            ? 'Article mis à jour avec succès'
            : 'Article créé avec succès',
          variant: 'default',
        })
        setProgressStep('')
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch {}
        onClose()
      } else {
        throw new Error('Format de réponse API inattendu')
      }
    } catch (error: any) {
      setProgressStep('')
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
    } finally {
      setLoading(false)
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

                  <div className='grid grid-cols-2 gap-2'>
                    <div className='flex items-center space-x-2'>
                      <Switch
                        id='isPublic'
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                      />
                      <Label htmlFor='isPublic'>Article public</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Switch
                        id='isFeatured'
                        checked={isFeatured}
                        onCheckedChange={setIsFeatured}
                      />
                      <Label htmlFor='isFeatured'>Article en vedette</Label>
                    </div>
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
                      errors.content ? 'border-red-500' : ''
                    }`}
                  >
                    <RichTextEditor
                      value={content}
                      onChange={handleContentChange}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder='Rédigez le contenu de votre article...'
                      style={{ minHeight: '400px' }}
                    />
                  </div>
                  {errors.content && (
                    <div className='flex items-center gap-1 text-red-500 text-sm'>
                      <AlertCircle className='h-4 w-4' />
                      <span>{errors.content}</span>
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
                className='w-full sm:w-auto order-3 sm:order-1'
              >
                <Eye className='h-4 w-4 mr-2' />
                <span className='hidden sm:inline'>Aperçu</span>
                <span className='sm:hidden'>Voir</span>
              </Button>

              <Button
                variant='outline'
                onClick={() => handleSave(true)}
                disabled={loading || !canSubmit}
                className='border-orange-200 text-orange-700 hover:bg-orange-50 w-full sm:w-auto order-2 sm:order-2'
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
                onClick={() => handleSave(false)}
                disabled={loading || !canSubmit}
                className='bg-primary hover:bg-primary-hover w-full sm:w-auto order-1 sm:order-3'
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
