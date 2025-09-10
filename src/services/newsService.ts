import { apiClient, ApiResponse } from './api';
import { PaginatedResponse } from '../types/unified-bridge';

// News interfaces
export interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  additionalImages?: string[];
  isPublic: boolean;
  isFeatured: boolean;
  summary?: string;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  categoryId?: string;
  adminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewsDto {
  title: string;
  content: string;
  imageUrl?: string;
  additionalImages?: string[];
  isPublic?: boolean;
  isFeatured?: boolean;
  summary?: string;
  categoryId?: string;
}

export interface UpdateNewsDto {
  title?: string;
  content?: string;
  imageUrl?: string;
  additionalImages?: string[];
  isPublic?: boolean;
  isFeatured?: boolean;
  summary?: string;
  categoryId?: string;
  replaceMainImage?: boolean;
}

export interface NewsFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
}

class NewsService {
  // Get all news with filters and pagination
  async getNews(params?: NewsFilterParams): Promise<ApiResponse<PaginatedResponse<News>>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.isPublic !== undefined) queryParams.append('isPublic', params.isPublic.toString());
    if (params?.isFeatured !== undefined) queryParams.append('isFeatured', params.isFeatured.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return await apiClient.get<PaginatedResponse<News>>(`/news?${queryParams.toString()}`);
  }

  // Get all news (simple list)
  async getAllNews(search?: string): Promise<ApiResponse<News[]>> {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    
    return await apiClient.get<News[]>(`/news?${queryParams.toString()}`);
  }

  // Get news by ID
  async getNewsById(id: string): Promise<ApiResponse<News>> {
    return await apiClient.get<News>(`/news/${id}`);
  }

  // Get featured news
  async getFeaturedNews(): Promise<ApiResponse<News[]>> {
    return await apiClient.get<News[]>('/news/featured');
  }

  // Get public news
  async getPublicNews(): Promise<ApiResponse<News[]>> {
    return await apiClient.get<News[]>('/news/public');
  }

  // Create new news (Admin)
  async createNews(data: CreateNewsDto, files?: File[]): Promise<ApiResponse<News>> {
    const formData = new FormData();
    
    // Add text fields
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.imageUrl) formData.append('imageUrl', data.imageUrl);
    if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString());
    if (data.isFeatured !== undefined) formData.append('isFeatured', data.isFeatured.toString());
    if (data.summary) formData.append('summary', data.summary);
    if (data.categoryId) formData.append('categoryId', data.categoryId);
    if (data.additionalImages) {
      data.additionalImages.forEach((url, index) => {
        formData.append(`additionalImages[${index}]`, url);
      });
    }
    
    // Add files
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    return await apiClient.post<News>('/news', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Update news (Admin)
  async updateNews(id: string, data: UpdateNewsDto, files?: File[]): Promise<ApiResponse<News>> {
    const formData = new FormData();
    
    // Add text fields
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.imageUrl) formData.append('imageUrl', data.imageUrl);
    if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString());
    if (data.isFeatured !== undefined) formData.append('isFeatured', data.isFeatured.toString());
    if (data.summary) formData.append('summary', data.summary);
    if (data.categoryId) formData.append('categoryId', data.categoryId);
    if (data.replaceMainImage !== undefined) formData.append('replaceMainImage', data.replaceMainImage.toString());
    if (data.additionalImages) {
      data.additionalImages.forEach((url, index) => {
        formData.append(`additionalImages[${index}]`, url);
      });
    }
    
    // Add files
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }

    return await apiClient.patch<News>(`/news/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Delete news (Admin)
  async deleteNews(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/news/${id}`);
  }

  // Toggle featured status (Admin)
  async toggleFeatured(id: string): Promise<ApiResponse<News>> {
    return await apiClient.patch<News>(`/news/${id}/toggle-featured`);
  }

  // Toggle public status (Admin)
  async togglePublic(id: string): Promise<ApiResponse<News>> {
    return await apiClient.patch<News>(`/news/${id}/toggle-public`);
  }

  // Bulk operations (Admin)
  async bulkDeleteNews(ids: string[]): Promise<ApiResponse<{ deleted: number; failed: string[] }>> {
    return await apiClient.delete<{ deleted: number; failed: string[] }>('/news/bulk/delete', { data: { ids } });
  }

  async bulkUpdateStatus(ids: string[], isPublic: boolean): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return await apiClient.patch<{ updated: number; failed: string[] }>('/news/bulk/status', { ids, isPublic });
  }

  async bulkToggleFeatured(ids: string[], isFeatured: boolean): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return await apiClient.patch<{ updated: number; failed: string[] }>('/news/bulk/featured', { ids, isFeatured });
  }
}

export const newsService = new NewsService();
export default newsService;