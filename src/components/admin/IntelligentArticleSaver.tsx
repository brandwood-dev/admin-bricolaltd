import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { newsService } from '@/services/newsService'
import { useToast } from '@/hooks/use-toast'

interface SaveStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
}

interface Section {
  id: string
  title: string
  orderIndex: number
  paragraphs: Array<{
    id: string
    content: string
    orderIndex: number
  }>
  images: Array<{
    id: string
    url: string
    alt?: string
    orderIndex: number
    file?: File
  }>
}

interface IntelligentArticleSaverProps {
  articleId?: string | null
  title: string
  summary: string
  category: string
  isPublic: boolean
  sections: Section[]
  coverImageFile?: File | null
  onSuccess: (articleId: string) => void
  onError: (error: string) => void
}

const IntelligentArticleSaver = ({
  articleId,
  title,
  summary,
  category,
  isPublic,
  sections,
  coverImageFile,
  onSuccess,
  onError,
}: IntelligentArticleSaverProps) => {
  const [isSaving, setIsSaving] = useState(false)
  const [steps, setSteps] = useState<SaveStep[]>([])
  const { toast } = useToast()

  const updateStepStatus = useCallback(
    (stepId: string, status: SaveStep['status'], message?: string) => {
      setSteps((prev) =>
        prev.map((step) =>
          step.id === stepId ? { ...step, status, message } : step
        )
      )
    },
    []
  )

  const addStep = useCallback((step: SaveStep) => {
    setSteps((prev) => [...prev, step])
  }, [])

  const isNewItem = (id: string) => {
    return (
      id.startsWith('temp-') ||
      id.startsWith('section-') ||
      id.startsWith('para-') ||
      id.startsWith('img-')
    )
  }

  const performIntelligentSave = useCallback(async () => {
    setIsSaving(true)
    setSteps([])

    try {
      let currentArticleId = articleId
      const isEditMode = !!currentArticleId

      // Step 1: Handle cover image if provided
      if (coverImageFile) {
        const coverStepId = 'cover-image'
        addStep({
          id: coverStepId,
          name: "Upload de l'image de couverture",
          status: 'running',
        })

        try {
          const coverResponse = await newsService.uploadCoverImage(
            coverImageFile
          )
          if (coverResponse.success && coverResponse.data?.url) {
            updateStepStatus(
              coverStepId,
              'completed',
              'Image de couverture uploadée'
            )
            // Update article with new cover image URL
            if (isEditMode) {
              await newsService.updateNews(currentArticleId, {
                imageUrl: coverResponse.data.url,
              })
            }
          } else {
            throw new Error('Failed to upload cover image')
          }
        } catch (error) {
          updateStepStatus(
            coverStepId,
            'error',
            "Échec de l'upload de l'image de couverture"
          )
          throw error
        }
      }

      // Step 2: Create or update article
      if (!isEditMode) {
        const articleStepId = 'create-article'
        addStep({
          id: articleStepId,
          name: "Création de l'article",
          status: 'running',
        })

        try {
          const articleResponse = await newsService.createNews({
            title,
            summary,
            category,
            isPublic,
            isDraft: false,
          })
          currentArticleId = articleResponse.data?.id
          if (!currentArticleId) throw new Error('No article ID returned')
          updateStepStatus(articleStepId, 'completed', 'Article créé')
        } catch (error) {
          updateStepStatus(
            articleStepId,
            'error',
            "Échec de la création de l'article"
          )
          throw error
        }
      } else {
        // Update existing article
        const articleStepId = 'update-article'
        addStep({
          id: articleStepId,
          name: "Mise à jour de l'article",
          status: 'running',
        })

        try {
          await newsService.updateNews(currentArticleId, {
            title,
            summary,
            category,
            isPublic,
          })
          updateStepStatus(articleStepId, 'completed', 'Article mis à jour')
        } catch (error) {
          updateStepStatus(
            articleStepId,
            'error',
            "Échec de la mise à jour de l'article"
          )
          throw error
        }
      }

      // Step 3: Process sections intelligently
      if (isEditMode) {
        // In edit mode, we need to handle existing sections
        const existingSectionsResponse = await newsService.getSectionsByArticle(
          currentArticleId!
        )
        const existingSections = existingSectionsResponse.data || []

        // Track sections to delete (exist in DB but not in current sections)
        const sectionsToDelete = existingSections.filter(
          (existing: any) =>
            !sections.some((current) => current.id === existing.id)
        )

        // Delete removed sections
        for (const sectionToDelete of sectionsToDelete) {
          const deleteStepId = `delete-section-${sectionToDelete.id}`
          addStep({
            id: deleteStepId,
            name: `Suppression de la section: ${sectionToDelete.title}`,
            status: 'running',
          })

          try {
            await newsService.deleteSection(sectionToDelete.id)
            updateStepStatus(deleteStepId, 'completed', 'Section supprimée')
          } catch (error) {
            updateStepStatus(
              deleteStepId,
              'error',
              'Échec de la suppression de la section'
            )
            throw error
          }
        }
      }

      // Process current sections
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        const isNewSection = isNewItem(section.id)
        let sectionId = section.id

        if (isNewSection) {
          // Create new section
          const sectionStepId = `create-section-${i}`
          addStep({
            id: sectionStepId,
            name: `Création de la section: ${section.title}`,
            status: 'running',
          })

          try {
            const sectionResponse = await newsService.saveSection(
              currentArticleId!,
              {
                title: section.title,
                orderIndex: section.orderIndex,
              }
            )
            sectionId = sectionResponse.data?.data?.id
            if (!sectionId) throw new Error('No section ID returned')
            updateStepStatus(sectionStepId, 'completed', 'Section créée')
          } catch (error) {
            updateStepStatus(
              sectionStepId,
              'error',
              'Échec de la création de la section'
            )
            throw error
          }
        } else {
          // Update existing section
          const sectionStepId = `update-section-${section.id}`
          addStep({
            id: sectionStepId,
            name: `Mise à jour de la section: ${section.title}`,
            status: 'running',
          })

          try {
            await newsService.updateSection(section.id, {
              title: section.title,
              orderIndex: section.orderIndex,
            })
            updateStepStatus(sectionStepId, 'completed', 'Section mise à jour')
          } catch (error) {
            updateStepStatus(
              sectionStepId,
              'error',
              'Échec de la mise à jour de la section'
            )
            throw error
          }

          // Get existing paragraphs and images for comparison
          const existingSectionResponse = await newsService.getSectionById(
            sectionId
          )
          const existingSection = existingSectionResponse.data

          if (existingSection) {
            // Delete removed paragraphs
            const paragraphsToDelete = existingSection.paragraphs.filter(
              (existing: any) =>
                !section.paragraphs.some(
                  (current) => current.id === existing.id
                )
            )
            for (const paragraphToDelete of paragraphsToDelete) {
              await newsService.deleteParagraph(paragraphToDelete.id)
            }

            // Delete removed images
            const imagesToDelete = existingSection.images.filter(
              (existing: any) =>
                !section.images.some((current) => current.id === existing.id)
            )
            for (const imageToDelete of imagesToDelete) {
              await newsService.deleteSectionImage(imageToDelete.id)
            }
          }
        }

        // Process paragraphs
        for (const paragraph of section.paragraphs) {
          const isNewParagraph = isNewItem(paragraph.id)

          if (isNewParagraph) {
            // Create new paragraph
            try {
              await newsService.saveSectionParagraph(sectionId, {
                content: paragraph.content,
                orderIndex: paragraph.orderIndex,
              })
            } catch (error) {
              throw new Error(`Failed to create paragraph: ${error}`)
            }
          } else {
            // Update existing paragraph
            try {
              await newsService.updateParagraph(
                paragraph.id,
                paragraph.content,
                paragraph.orderIndex
              )
            } catch (error) {
              throw new Error(`Failed to update paragraph: ${error}`)
            }
          }
        }

        // Process images
        for (const image of section.images) {
          const isNewImage = isNewItem(image.id)

          if (isNewImage) {
            if (image.file) {
              // Upload new image file
              try {
                await newsService.uploadAndSaveSectionImage(
                  sectionId,
                  image.file,
                  image.alt,
                  image.orderIndex
                )
              } catch (error) {
                throw new Error(`Failed to upload image: ${error}`)
              }
            } else if (image.url) {
              // Save new image with URL
              try {
                await newsService.saveSectionImageWithUrl(sectionId, {
                  url: image.url,
                  alt: image.alt,
                  orderIndex: image.orderIndex,
                })
              } catch (error) {
                throw new Error(`Failed to save image URL: ${error}`)
              }
            }
          } else {
            // Update existing image
            try {
              await newsService.updateSectionImage(
                image.id,
                image.url,
                image.alt,
                image.orderIndex
              )
            } catch (error) {
              throw new Error(`Failed to update image: ${error}`)
            }
          }
        }
      }

      // Success
      toast({
        title: 'Succès',
        description: isEditMode
          ? 'Article mis à jour avec succès'
          : 'Article créé avec succès',
        variant: 'default',
      })

      onSuccess(currentArticleId!)
    } catch (error) {
      console.error('Intelligent save error:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inattendue s'est produite"

      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      })

      onError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }, [
    articleId,
    title,
    summary,
    category,
    isPublic,
    sections,
    coverImageFile,
    onSuccess,
    onError,
    addStep,
    updateStepStatus,
    toast,
  ])

  const getStepIcon = (step: SaveStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />
      case 'running':
        return <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
      default:
        return <div className='h-4 w-4 rounded-full border-2 border-gray-300' />
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>
          {articleId ? "Mise à jour de l'article" : "Création de l'article"}
        </h3>
        {isSaving && (
          <span className='text-sm text-gray-500'>
            {steps.filter((s) => s.status === 'running').length > 0 &&
              steps.find((s) => s.status === 'running')?.name}
          </span>
        )}
      </div>

      <div className='space-y-2 max-h-64 overflow-y-auto'>
        {steps.map((step) => (
          <div
            key={step.id}
            className='flex items-center gap-3 p-2 rounded-lg bg-gray-50'
          >
            {getStepIcon(step)}
            <div className='flex-1'>
              <div className='font-medium text-sm'>{step.name}</div>
              {step.message && (
                <div className='text-xs text-gray-500'>{step.message}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className='flex gap-2'>
        <Button
          onClick={performIntelligentSave}
          disabled={isSaving}
          className='flex-1'
        >
          {isSaving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              En cours...
            </>
          ) : (
            <>
              <CheckCircle className='mr-2 h-4 w-4' />
              {articleId ? 'Mettre à jour' : 'Créer'} l\'article
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export { IntelligentArticleSaver }
