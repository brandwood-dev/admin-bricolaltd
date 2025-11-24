import React from 'react'
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { usePagination, PaginationState } from '@/hooks/usePagination'
import { generatePageNumbers } from '@/hooks/usePagination'

interface EnhancedPaginationProps {
  pagination: PaginationState
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onRefresh?: () => void
  className?: string
  showPageSize?: boolean
  showRefresh?: boolean
  pageSizeOptions?: number[]
}

export const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  className,
  showPageSize = true,
  showRefresh = true,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  } = pagination

  const pageNumbers = generatePageNumbers(currentPage, totalPages)

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className={cn('flex items-center justify-between px-2', className)}>
      <div className='flex items-center space-x-6 lg:space-x-8'>
        {/* {showPageSize && (
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Lignes par page</p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )} */}

        <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
          {totalItems > 0
            ? `${startItem}-${endItem} sur ${totalItems}`
            : 'Aucun résultat'}
        </div>

        {showRefresh && onRefresh && (
          <Button
            variant='outline'
            size='sm'
            onClick={onRefresh}
            className='h-8 w-8 p-0'
          >
            <RefreshCw className='h-4 w-4' />
          </Button>
        )}
      </div>

      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPreviousPage}
          className='h-8 w-8 p-0'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        <div className='flex items-center space-x-1'>
          {pageNumbers.map((pageNumber, index) => {
            if (pageNumber === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className='flex h-8 w-8 items-center justify-center'
                >
                  <MoreHorizontal className='h-4 w-4' />
                </span>
              )
            }

            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? 'default' : 'outline'}
                size='sm'
                onClick={() => onPageChange(pageNumber as number)}
                className='h-8 w-8 p-0'
              >
                {pageNumber}
              </Button>
            )
          })}
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className='h-8 w-8 p-0'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}

// Simplified pagination for smaller spaces
export const SimplePagination: React.FC<{
  pagination: PaginationState
  onPageChange: (page: number) => void
  className?: string
}> = ({ pagination, onPageChange, className }) => {
  const { currentPage, totalPages, hasNextPage, hasPreviousPage } = pagination

  return (
    <div
      className={cn('flex items-center justify-center space-x-2', className)}
    >
      <Button
        variant='outline'
        size='sm'
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
      >
        <ChevronLeft className='h-4 w-4 mr-1' />
        Précédent
      </Button>

      <span className='text-sm font-medium px-4'>
        Page {currentPage} sur {totalPages}
      </span>

      <Button
        variant='outline'
        size='sm'
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
      >
        Suivant
        <ChevronRight className='h-4 w-4 ml-1' />
      </Button>
    </div>
  )
}

// Infinite scroll trigger component
export const InfiniteScrollTrigger: React.FC<{
  onLoadMore: () => void
  hasMore: boolean
  loading: boolean
  className?: string
}> = ({ onLoadMore, hasMore, loading, className }) => {
  const triggerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (triggerRef.current) {
      observer.observe(triggerRef.current)
    }

    return () => observer.disconnect()
  }, [onLoadMore, hasMore, loading])

  if (!hasMore) {
    return (
      <div
        className={cn(
          'text-center py-4 text-sm text-muted-foreground',
          className
        )}
      >
        Tous les éléments ont été chargés
      </div>
    )
  }

  return (
    <div ref={triggerRef} className={cn('text-center py-4', className)}>
      {loading ? (
        <div className='flex items-center justify-center space-x-2'>
          <RefreshCw className='h-4 w-4 animate-spin' />
          <span className='text-sm text-muted-foreground'>Chargement...</span>
        </div>
      ) : (
        <Button variant='outline' onClick={onLoadMore} className='text-sm'>
          Charger plus
        </Button>
      )}
    </div>
  )
}
