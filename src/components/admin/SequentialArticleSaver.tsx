import React, { useState } from 'react'
import { newsService } from '@/services/newsService'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, Upload, CheckCircle, AlertCircle } from 'lucide-react'

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
    file?: File // Add file for pending uploads
  }>
}

interface SequentialArticleSaverProps {
  title: string
  summary?: string
  category?: string
  isPublic: boolean
  coverImageFile?: File
  sections: Section[]
  onSuccess: (articleId: string) => void
  onError: (error: string) => void
  existingArticleId?: string
}

interface SaveStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  message?: string
}

export const SequentialArticleSaver: React.FC<SequentialArticleSaverProps> = ({
  title,
  summary,
  category,
  isPublic,
  coverImageFile,
  sections,
  onSuccess,
  onError,
  existingArticleId,
}) => {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [steps, setSteps] = useState<SaveStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const updateStepStatus = (
    stepId: string,
    status: SaveStep['status'],
    message?: string
  ) => {
    setSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, status, message } : step
      )
    )
  }

  const saveArticleSequentially = async () => {
    setIsSaving(true)
    let articleId = existingArticleId
    let coverImageUrl: string | undefined

    try {
      // Step 1: Upload cover image if provided
      if (coverImageFile) {
        const stepId = 'cover-image'
        setSteps((prev) => [
          ...prev,
          { id: stepId, name: 'Upload image de couverture', status: 'running' },
        ])

        try {
          const response = await newsService.uploadCoverImage(coverImageFile)
          coverImageUrl = response.data?.url
          updateStepStatus(
            stepId,
            'completed',
            `Image uploadée: ${coverImageFile.name}`
          )
        } catch (error) {
          updateStepStatus(
            stepId,
            'error',
            "Échec de l'upload de l'image de couverture"
          )
          throw error
        }
      }

      // Step 2: Save article with basic info
      const articleStepId = existingArticleId
        ? 'update-article'
        : 'create-article'
      setSteps((prev) => [
        ...prev,
        {
          id: articleStepId,
          name: existingArticleId ? 'Mise à jour article' : 'Création article',
          status: 'running',
        },
      ])

      const articleData = {
        title: title.trim(),
        summary: summary?.trim(),
        category,
        isPublic,
        imageUrl: coverImageUrl,
      }

      try {
        let response
        if (existingArticleId) {
          response = await newsService.updateNews(
            existingArticleId,
            articleData
          )
        } else {
          response = await newsService.createNews(articleData)
        }

        articleId = response.data?.id
        if (!articleId) throw new Error('No article ID returned')

        updateStepStatus(
          articleStepId,
          'completed',
          existingArticleId
            ? 'Article mis à jour'
            : `Article créé: ${articleId}`
        )
      } catch (error) {
        updateStepStatus(
          articleStepId,
          'error',
          "Échec de la sauvegarde de l'article"
        )
        throw error
      }

      // Step 3: Process sections sequentially
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        const sectionStepId = `section-${i}`

        setSteps((prev) => [
          ...prev,
          {
            id: sectionStepId,
            name: `Section ${i + 1}: ${section.title}`,
            status: 'running',
          },
        ])

        let savedSectionId: string

        try {
          // Save section
          const sectionResponse = await newsService.saveSection(articleId, {
            title: section.title,
            orderIndex: section.orderIndex,
          })

          savedSectionId = sectionResponse.data?.id
          if (!savedSectionId) throw new Error('No section ID returned')

          updateStepStatus(
            sectionStepId,
            'completed',
            `Section sauvegardée: ${section.title}`
          )
        } catch (error) {
          updateStepStatus(
            sectionStepId,
            'error',
            `Échec de la sauvegarde de la section: ${section.title}`
          )
          throw error
        }

        // Step 4: Save paragraphs for this section
        if (section.paragraphs.length > 0) {
          const paragraphStepId = `paragraphs-${i}`
          setSteps((prev) => [
            ...prev,
            {
              id: paragraphStepId,
              name: `  Paragraphes (${section.paragraphs.length})`,
              status: 'running',
            },
          ])

          try {
            for (const paragraph of section.paragraphs) {
              await newsService.saveSectionParagraph(savedSectionId, {
                content: paragraph.content,
                orderIndex: paragraph.orderIndex,
              })
            }

            updateStepStatus(
              paragraphStepId,
              'completed',
              `${section.paragraphs.length} paragraphes sauvegardés`
            )
          } catch (error) {
            updateStepStatus(
              paragraphStepId,
              'error',
              'Échec de la sauvegarde des paragraphes'
            )
            throw error
          }
        }

        // Step 5: Upload and save images for this section
        const imagesWithFiles = section.images.filter((img) => img.file)
        if (imagesWithFiles.length > 0) {
          const imageStepId = `images-${i}`
          setSteps((prev) => [
            ...prev,
            {
              id: imageStepId,
              name: `  Images (${imagesWithFiles.length})`,
              status: 'running',
            },
          ])

          try {
            for (const image of imagesWithFiles) {
              if (image.file) {
                await newsService.uploadAndSaveSectionImage(
                  savedSectionId,
                  image.file,
                  image.alt
                )
              }
            }

            updateStepStatus(
              imageStepId,
              'completed',
              `${imagesWithFiles.length} images uploadées`
            )
          } catch (error) {
            updateStepStatus(
              imageStepId,
              'error',
              "Échec de l'upload des images"
            )
            throw error
          }
        }
      }

      // Success
      toast({
        title: 'Succès',
        description: existingArticleId
          ? 'Article mis à jour avec succès'
          : 'Article créé avec succès',
        variant: 'default',
      })

      onSuccess(articleId)
    } catch (error) {
      console.error('Sequential save error:', error)
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
  }

  const getStepIcon = (step: SaveStep) => {
    switch (step.status) {
      case 'running':
        return <Loader2 className='w-4 h-4 animate-spin text-blue-500' />
      case 'completed':
        return <CheckCircle className='w-4 h-4 text-green-500' />
      case 'error':
        return <AlertCircle className='w-4 h-4 text-red-500' />
      default:
        return <div className='w-4 h-4 rounded-full border-2 border-gray-300' />
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>
          {existingArticleId
            ? 'Mise à jour séquentielle'
            : 'Sauvegarde séquentielle'}
        </h3>
        <button
          onClick={saveArticleSequentially}
          disabled={isSaving}
          className='flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors'
        >
          {isSaving ? (
            <Loader2 className='w-4 h-4 animate-spin' />
          ) : (
            <Save className='w-4 h-4' />
          )}
          <span>
            {isSaving
              ? 'Sauvegarde en cours...'
              : existingArticleId
              ? 'Mettre à jour'
              : 'Créer'}
          </span>
        </button>
      </div>

      {isSaving && (
        <div className='space-y-2 max-h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg'>
          {steps.map((step, index) => (
            <div key={step.id} className='flex items-center space-x-3 text-sm'>
              {getStepIcon(step)}
              <span
                className={`${
                  step.status === 'running'
                    ? 'text-blue-600 font-medium'
                    : step.status === 'completed'
                    ? 'text-green-600'
                    : step.status === 'error'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {step.name}
              </span>
              {step.message && (
                <span className='text-gray-500 text-xs'>({step.message})</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
