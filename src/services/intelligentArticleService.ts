import { newsService } from './newsService'

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

interface IntelligentSaveOptions {
  articleId?: string | null
  title: string
  summary: string
  category: string
  sections: Section[]
  coverImageFile?: File | null
  onProgress?: (step: string) => void
}

interface IntelligentSaveResult {
  success: boolean
  articleId?: string
  error?: string
}

export class IntelligentArticleService {
  private isNewItem(id: string): boolean {
    return (
      id.startsWith('temp-') ||
      id.startsWith('section-') ||
      id.startsWith('para-') ||
      id.startsWith('img-')
    )
  }

  private updateProgress(
    onProgress: ((step: string) => void) | undefined,
    step: string
  ) {
    if (onProgress) {
      onProgress(step)
    }
  }

  async performIntelligentSave(
    options: IntelligentSaveOptions
  ): Promise<IntelligentSaveResult> {
    const {
      articleId,
      title,
      summary,
      category,
      sections,
      coverImageFile,
      onProgress,
    } = options

    try {
      let currentArticleId = articleId
      const isEditMode = !!currentArticleId

      // Step 1: Handle cover image if provided
      let coverImageUrl: string | undefined
      if (coverImageFile) {
        this.updateProgress(onProgress, "Upload de l'image de couverture...")
        const response = await newsService.uploadCoverImage(coverImageFile)
        coverImageUrl = response.data?.data?.url
      }

      // Step 2: Save article with basic info
      this.updateProgress(
        onProgress,
        isEditMode ? "Mise à jour de l'article..." : "Création de l'article..."
      )

      const articleData = {
        title: title.trim(),
        summary: summary?.trim(),
        category,
        imageUrl: coverImageUrl,
      }

      if (isEditMode) {
        await newsService.updateNews(currentArticleId!, articleData)
      } else {
        const response = await newsService.createNews(articleData)
        currentArticleId = response.data?.id
        if (!currentArticleId) {
          throw new Error('No article ID returned')
        }
      }

      // Step 3: Process sections intelligently
      if (isEditMode) {
        // In edit mode, we need to handle existing sections
        this.updateProgress(onProgress, 'Analyse des sections existantes...')
        const existingSectionsResponse = await newsService.getSectionsByArticle(
          currentArticleId!
        )
        const existingSections = existingSectionsResponse.data || []

        // Find sections to delete
        const sectionsToDelete = existingSections.filter(
          (existing: any) =>
            !sections.some((current) => current.id === existing.id)
        )

        // Delete removed sections
        for (const sectionToDelete of sectionsToDelete) {
          this.updateProgress(
            onProgress,
            `Suppression de la section: ${sectionToDelete.title}`
          )
          await newsService.deleteSection(sectionToDelete.id)
        }
      }

      // Process current sections
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        const isNewSection = this.isNewItem(section.id)
        let sectionId = section.id

        if (isNewSection) {
          // Create new section
          this.updateProgress(
            onProgress,
            `Création de la section: ${section.title}`
          )
          const sectionResponse = await newsService.saveSection(
            currentArticleId!,
            {
              title: section.title,
              orderIndex: section.orderIndex,
            }
          )
          sectionId = sectionResponse.data?.data?.id
          if (!sectionId) throw new Error('No section ID returned')
        } else {
          // Update existing section
          this.updateProgress(
            onProgress,
            `Mise à jour de la section: ${section.title}`
          )
          await newsService.updateSection(section.id, {
            title: section.title,
            orderIndex: section.orderIndex,
          })
          sectionId = section.id
        }

        // Get existing paragraphs and images for comparison (only for existing sections)
        if (!isNewSection) {
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
              await newsService.deleteParagraph(paragraphToDelete.id, sectionId)
            }

            // Delete removed images
            const imagesToDelete = existingSection.images.filter(
              (existing: any) =>
                !section.images.some((current) => current.id === existing.id)
            )
            for (const imageToDelete of imagesToDelete) {
              await newsService.deleteSectionImage(imageToDelete.id, sectionId)
            }
          }
        }

        // Process paragraphs
        for (const paragraph of section.paragraphs) {
          const isNewParagraph = this.isNewItem(paragraph.id)

          if (isNewParagraph) {
            // Create new paragraph
            await newsService.saveSectionParagraph(sectionId, {
              content: paragraph.content,
              orderIndex: paragraph.orderIndex,
            })
          } else {
            // Update existing paragraph - pass section ID to avoid extra API call
            await newsService.updateParagraph(
              paragraph.id,
              paragraph.content,
              paragraph.orderIndex,
              sectionId  // Pass section ID to avoid fetching
            )
          }
        }

        // Process images
        for (const image of section.images) {
          const isNewImage = this.isNewItem(image.id)

          if (isNewImage) {
            if (image.file) {
              // Upload new image file
              this.updateProgress(
                onProgress,
                `Upload de l'image: ${image.alt || 'Image'}`
              )
              await newsService.uploadAndSaveSectionImage(
                sectionId,
                image.file,
                image.alt,
                image.orderIndex
              )
            } else if (image.url) {
              // Save image with URL only
              await newsService.saveSectionImageWithUrl(sectionId, {
                url: image.url,
                alt: image.alt,
                orderIndex: image.orderIndex,
              })
            }
          } else {
            // Update existing image
            if (image.url) {
              await newsService.updateSectionImage(
                image.id,
                image.url,
                image.alt,
                image.orderIndex
              )
            }
          }
        }
      }

      return {
        success: true,
        articleId: currentArticleId,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Échec de la sauvegarde intelligente',
      }
    }
  }
}

export const intelligentArticleService = new IntelligentArticleService()
