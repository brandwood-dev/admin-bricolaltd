import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar } from '@/components/ui/avatar'
import {
  Calendar,
  Clock,
  Tag,
  Eye,
  Globe,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  FileText,
} from 'lucide-react'
import { News } from '@/services/newsService'
import { cn } from '@/lib/utils'

interface ArticlePreviewModalProps {
  article: News
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  onTogglePublic?: () => void
  isPublic?: boolean
}

const ArticlePreviewModal = ({
  article,
  isOpen,
  onClose,
  onEdit,
  onTogglePublic,
  isPublic,
}: ArticlePreviewModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Debug logging to check article data
  useEffect(() => {
    console.log('ArticlePreviewModal - Article data:', article)
    console.log('ArticlePreviewModal - Article ID:', article.id)
    console.log('ArticlePreviewModal - Article title:', article.title)
    console.log('ArticlePreviewModal - Sections:', article.sections)
    console.log('ArticlePreviewModal - Sections type:', typeof article.sections)
    console.log('ArticlePreviewModal - Sections length:', article.sections?.length)
    
    if (article.sections && Array.isArray(article.sections) && article.sections.length > 0) {
      console.log('ArticlePreviewModal - Processing sections...')
      article.sections.forEach((section, index) => {
        console.log(`Section ${index}:`, section)
        console.log(`Section ${index} title:`, section.title)
        console.log(`Section ${index} paragraphs:`, section.paragraphs)
        console.log(`Section ${index} paragraphs type:`, typeof section.paragraphs)
        console.log(`Section ${index} images:`, section.images)
        console.log(`Section ${index} images type:`, typeof section.images)
      })
    } else {
      console.log('ArticlePreviewModal - No sections found or sections is not an array')
    }
  }, [article])

  const sectionsAsc = (article.sections || [])
    .slice()
    .sort((a: any, b: any) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : a.orderIndex ?? 0
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : b.orderIndex ?? 0
      return aDate - bDate
    })

  const allImages = [
    ...(article.imageUrl ? [{ url: article.imageUrl, alt: article.title, type: 'cover' }] : []),
    ...(sectionsAsc.flatMap((section, sectionIndex) => {
      const imagesAsc = (section.images || [])
        .slice()
        .sort((a: any, b: any) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : a.orderIndex ?? 0
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : b.orderIndex ?? 0
          return aDate - bDate
        })
      return imagesAsc.map((image, imageIndex) => ({
        url: image.url,
        alt: image.alt || `${section.title} - Image ${imageIndex + 1}`,
        type: 'section',
        sectionTitle: section.title,
        sectionIndex
      }))
    }))
  ]

  console.log('All images collected:', allImages.length, allImages)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content?.replace(/<[^>]*>/g, '').split(/\s+/).length || 0
    const readingTime = Math.ceil(wordCount / wordsPerMinute)
    return `${readingTime} min de lecture`
  }

  const getStatusBadge = () => {
    if (isPublic) {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2 text-sm font-semibold">
          <Globe className="h-4 w-4 mr-2" />
          Publié
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-4 py-2 text-sm font-semibold">
        <Eye className="h-4 w-4 mr-2" />
        Brouillon
      </Badge>
    )
  }

  const nextImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }
  }

  const prevImage = () => {
    if (allImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-6xl max-h-[95vh] overflow-y-auto p-0 bg-gradient-to-br from-gray-50 to-white",
        isFullscreen && "max-w-[95vw] max-h-[95vh]",
        "sm:max-w-[95vw] sm:max-h-[95vh] md:max-w-4xl lg:max-w-6xl"
      )}>
        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 shadow-sm">
          <DialogHeader className="p-8 pb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight mb-2">
                  {article.title}
                </DialogTitle>
                <DialogDescription className="text-lg text-gray-600 font-medium">
                  Prévisualisation de l'article
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {getStatusBadge()}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  title="Fermer"
                  className="hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Action Bar */}
          <div className="px-8 pb-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 transition-all duration-200 shadow-sm text-xs sm:text-sm"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
              )}
              {onTogglePublic && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTogglePublic}
                  className={cn(
                    "transition-all duration-200 shadow-sm text-xs sm:text-sm",
                    isPublic 
                      ? "border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600" 
                      : "border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600"
                  )}
                >
                  {isPublic ? (
                    <><Eye className="h-3 w-3 mr-1" />Dépublier</>
                  ) : (
                    <><Globe className="h-3 w-3 mr-1" />Publier</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-10">
          {/* Hero Section with Image */}
          {allImages.length > 0 && (
            <div className="relative group">
              <div className="relative aspect-video bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200/50">
                <img
                  src={allImages[currentImageIndex].url}
                  alt={allImages[currentImageIndex].alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                
                {allImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-xl transition-all duration-200 hover:scale-110"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-xl transition-all duration-200 hover:scale-110"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={cn(
                            "w-3 h-3 rounded-full transition-all duration-300",
                            index === currentImageIndex 
                              ? "bg-white scale-125 shadow-lg" 
                              : "bg-white/50 hover:bg-white/75 hover:scale-110"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {allImages[currentImageIndex].type === 'section' && allImages[currentImageIndex].sectionTitle && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-sm font-medium shadow-sm">
                    <Tag className="h-3 w-3" />
                    Image de la section: {allImages[currentImageIndex].sectionTitle}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Article Meta */}
          <Card className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 md:gap-8 text-sm sm:text-base">
                <div className="flex items-center gap-2 sm:gap-3 text-gray-700 hover:text-gray-900 transition-colors group">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 group-hover:text-blue-700" />
                  <span className="font-medium">Publié le {formatDate(article.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 text-gray-700 hover:text-gray-900 transition-colors group">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 group-hover:text-green-700" />
                  <span className="font-medium">{formatReadingTime(article.content)}</span>
                </div>
                {article.category && (
                  <div className="flex items-center gap-2 sm:gap-3 text-gray-700 hover:text-gray-900 transition-colors group">
                    <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 group-hover:text-purple-700" />
                    <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 transition-all duration-200 text-xs sm:text-sm">
                      {article.category}
                    </Badge>
                  </div>
                )}
                {article.adminName && (
                  <div className="flex items-center gap-2 sm:gap-3 text-gray-700 hover:text-gray-900 transition-colors group">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 group-hover:text-orange-700" />
                    <span className="font-medium">Par <span className="text-orange-700 font-semibold">{article.adminName}</span></span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {article.summary && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border-l-4 border-blue-500 rounded-r-2xl shadow-lg">
              <div className="p-8">
                <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-3">
                  <FileText className="h-6 w-6" />
                  Résumé
                </h3>
                <p className="text-blue-800 leading-relaxed text-lg font-medium">{article.summary}</p>
              </div>
            </div>
          )}

          {/* Sections */}
                {sectionsAsc && Array.isArray(sectionsAsc) && sectionsAsc.length > 0 ? (
                  <div className="space-y-12">
              <Separator className="my-12 bg-gradient-to-r from-transparent via-gray-300 to-transparent h-px" />
              <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent inline-flex items-center gap-4">
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                  Sections ({article.sections.length})
                  <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                </h2>
              </div>
                  <div className="space-y-8">
                {sectionsAsc.map((section, index) => {
                  console.log(`Rendering section ${index}:`, section)
                  console.log(`Section ${index} title:`, section.title)
                  console.log(`Section ${index} paragraphs:`, section.paragraphs)
                  console.log(`Section ${index} images:`, section.images)
                  
                  // Ensure paragraphs and images arrays exist and are arrays
                  const paragraphs = (Array.isArray(section.paragraphs) ? section.paragraphs : [])
                    .slice()
                    .sort((a: any, b: any) => {
                      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : a.orderIndex ?? 0
                      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : b.orderIndex ?? 0
                      return aDate - bDate
                    })
                  const images = (Array.isArray(section.images) ? section.images : [])
                    .slice()
                    .sort((a: any, b: any) => {
                      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : a.orderIndex ?? 0
                      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : b.orderIndex ?? 0
                      return aDate - bDate
                    })
                  
                  return (
                    <Card key={section.id || index} className="border-l-4 border-l-blue-500 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:border-l-purple-500">
                      <CardContent className="p-8">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {index + 1}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                            {section.title || 'Section sans titre'}
                          </h3>
                        </div>
                        
                        {/* Section Paragraphs */}
                        {paragraphs.length > 0 && (
                          <div className="space-y-6 mb-8">
                            {paragraphs.map((paragraph, paraIndex) => (
                              <div 
                                key={paragraph.id || paraIndex}
                                dangerouslySetInnerHTML={{ __html: paragraph.content || '' }}
                                className="text-gray-700 leading-relaxed text-lg bg-gray-50/50 p-6 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                              />
                            ))}
                          </div>
                        )}

                        {/* Section Images */}
                        {images.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {images.map((image, imgIndex) => (
                              <div key={image.id || imgIndex} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                                <img
                                  src={image.url}
                                  alt={image.alt || `${section.title || 'Section'} - Image ${imgIndex + 1}`}
                                  className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110"
                                  loading="lazy"
                                  onError={(e) => {
                                    console.error('Image failed to load:', image.url)
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE3NSAxMjVIMjI1TDIwMCAxNTBaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE3NSAxNzVIMjI1TDIwMCAxNTBaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QjlCIiBmb250LXNpemU9IjE0Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo='
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {image.alt && (
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <p className="text-white text-sm font-medium">{image.alt}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                Aucune section
              </h3>
              <p className="text-blue-700">
                Cet article ne contient pas de sections.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200/80 p-8 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <span className="font-medium">Article ID:</span>
              <code className="px-3 py-1 bg-white/70 rounded-lg font-mono text-gray-700 shadow-sm border border-gray-200">
                {article.id}
              </code>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="font-medium">Dernière mise à jour:</span>
              <span className="font-semibold text-gray-700">{formatDate(article.updatedAt)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ArticlePreviewModal