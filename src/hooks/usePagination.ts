import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCache, createCacheKey } from './useCache';

// Pagination configuration
interface PaginationConfig {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  maxPages?: number;
  prefetchNext?: boolean; // Prefetch next page for better UX
  cachePages?: boolean; // Cache individual pages
}

// Pagination state
interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

// Pagination result
interface PaginationResult<T> {
  data: T[];
  pagination: PaginationState;
  loading: boolean;
  error: Error | null;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  setPageSize: (size: number) => void;
  refresh: () => Promise<void>;
  prefetchNextPage: () => void;
}

// API response structure
interface PaginatedApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Fetcher function type
type PaginationFetcher<T> = (page: number, pageSize: number, filters?: any) => Promise<PaginatedApiResponse<T>>;

export function usePagination<T>(
  baseKey: string,
  fetcher: PaginationFetcher<T>,
  filters: any = {},
  config: PaginationConfig = {}
): PaginationResult<T> {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    maxPages = 1000,
    prefetchNext = true,
    cachePages = true
  } = config;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [prefetchedPages, setPrefetchedPages] = useState<Set<number>>(new Set());

  // Create cache key for current page
  const cacheKey = useMemo(() => 
    createCacheKey(`${baseKey}-page`, { 
      page: currentPage, 
      pageSize, 
      ...filters 
    }), 
    [baseKey, currentPage, pageSize, filters]
  );

  // Fetch current page data
  const {
    data: apiResponse,
    loading,
    error,
    refresh: refreshCache
  } = useCache(
    cacheKey,
    () => fetcher(currentPage, pageSize, filters),
    { ttl: 2 * 60 * 1000 } // 2 minutes cache
  );

  // Extract data and pagination info
  const data = apiResponse?.data || [];
  const paginationInfo = apiResponse?.pagination;

  // Calculate pagination state
  const pagination: PaginationState = useMemo(() => {
    if (!paginationInfo) {
      return {
        currentPage,
        pageSize,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
        startIndex: 0,
        endIndex: 0
      };
    }

    const totalPages = Math.min(paginationInfo.totalPages, maxPages);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(startIndex + data.length - 1, paginationInfo.total);

    return {
      currentPage,
      pageSize,
      totalItems: paginationInfo.total,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      startIndex,
      endIndex
    };
  }, [currentPage, pageSize, paginationInfo, data.length, maxPages]);

  // Prefetch next page
  const prefetchNextPage = useCallback(async () => {
    if (!prefetchNext || !pagination.hasNextPage || prefetchedPages.has(currentPage + 1)) {
      return;
    }

    try {
      const nextPageKey = createCacheKey(`${baseKey}-page`, {
        page: currentPage + 1,
        pageSize,
        ...filters
      });

      // Use cache to prefetch (this will store it in cache)
      await fetcher(currentPage + 1, pageSize, filters);
      setPrefetchedPages(prev => new Set([...prev, currentPage + 1]));
    } catch (error) {
      // Silently fail prefetch
      console.warn('Failed to prefetch next page:', error);
    }
  }, [baseKey, currentPage, pageSize, filters, pagination.hasNextPage, prefetchNext, prefetchedPages, fetcher]);

  // Auto-prefetch when data loads
  useEffect(() => {
    if (data.length > 0 && prefetchNext) {
      const timer = setTimeout(prefetchNextPage, 500); // Delay to avoid blocking main thread
      return () => clearTimeout(timer);
    }
  }, [data.length, prefetchNext, prefetchNextPage]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const targetPage = Math.max(1, Math.min(page, pagination.totalPages));
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      setPrefetchedPages(new Set()); // Reset prefetch cache
    }
  }, [currentPage, pagination.totalPages]);

  const goToNextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, pagination.hasNextPage, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, pagination.hasPreviousPage, goToPage]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(pagination.totalPages);
  }, [pagination.totalPages, goToPage]);

  const setPageSize = useCallback((size: number) => {
    if (pageSizeOptions.includes(size) && size !== pageSize) {
      setPageSizeState(size);
      setCurrentPage(1); // Reset to first page when changing page size
      setPrefetchedPages(new Set()); // Reset prefetch cache
    }
  }, [pageSize, pageSizeOptions]);

  const refresh = useCallback(async () => {
    setPrefetchedPages(new Set()); // Clear prefetch cache
    await refreshCache();
  }, [refreshCache]);

  return {
    data,
    pagination,
    loading,
    error,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,
    refresh,
    prefetchNextPage
  };
}

// Utility hook for infinite scroll pagination
export function useInfiniteScroll<T>(
  baseKey: string,
  fetcher: PaginationFetcher<T>,
  filters: any = {},
  pageSize: number = 20
) {
  const [allData, setAllData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetcher(currentPage, pageSize, filters);
      const newData = response.data;

      setAllData(prev => {
        // Avoid duplicates
        const existingIds = new Set(prev.map((item: any) => item.id));
        const uniqueNewData = newData.filter((item: any) => !existingIds.has(item.id));
        return [...prev, ...uniqueNewData];
      });

      setCurrentPage(prev => prev + 1);
      setHasMore(currentPage < response.pagination.totalPages);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [baseKey, currentPage, pageSize, filters, loading, hasMore, fetcher]);

  const reset = useCallback(() => {
    setAllData([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    if (allData.length === 0 && !loading) {
      loadMore();
    }
  }, [allData.length, loading, loadMore]);

  // Reset when filters change
  useEffect(() => {
    reset();
  }, [filters, reset]);

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    reset
  };
}

// Pagination component helpers
export function generatePageNumbers(currentPage: number, totalPages: number, maxVisible: number = 7): (number | string)[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  // Always show first page
  pages.push(1);

  let startPage = Math.max(2, currentPage - halfVisible);
  let endPage = Math.min(totalPages - 1, currentPage + halfVisible);

  // Adjust if we're near the beginning
  if (currentPage <= halfVisible + 1) {
    endPage = Math.min(totalPages - 1, maxVisible - 1);
  }

  // Adjust if we're near the end
  if (currentPage >= totalPages - halfVisible) {
    startPage = Math.max(2, totalPages - maxVisible + 2);
  }

  // Add ellipsis if needed
  if (startPage > 2) {
    pages.push('...');
  }

  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Add ellipsis if needed
  if (endPage < totalPages - 1) {
    pages.push('...');
  }

  // Always show last page (if not already included)
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export default usePagination;