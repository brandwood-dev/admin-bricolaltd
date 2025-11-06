import { apiClient, ApiResponse } from './api';
import { PaginatedResponse } from '../types/unified-bridge';

// Category interface
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// News interfaces
export interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isPublic: boolean;
  isFeatured: boolean;
  summary?: string;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  category?: string;
  adminId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewsDto {
  title: string;
  content: string;
  imageUrl?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  summary?: string;
  category?: string;
}

export interface UpdateNewsDto {
  title?: string;
  content?: string;
  imageUrl?: string;
  isPublic?: boolean;
  isFeatured?: boolean;
  summary?: string;
  category?: string;
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
  category?: string;
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
    if (params?.category) queryParams.append('category', params.category);
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
    
    // Add text fields (exclude 'files' field from data as it's handled separately)
    formData.append('title', data.title);
    formData.append('content', data.content);
    if (data.imageUrl) formData.append('imageUrl', data.imageUrl);
    if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString());
    if (data.isFeatured !== undefined) formData.append('isFeatured', data.isFeatured.toString());
    if (data.summary) formData.append('summary', data.summary);
    if (data.category) formData.append('category', data.category);
    
    // Append only the main image (first file) if provided
    if (files && files.length > 0) {
      const main = files[0];
      formData.append('mainImage', main);
    }

    // Safety: ensure no 'files' field is included
    if ((data as any)?.files) {
      console.warn('[NewsService] data.files detected in payload, will NOT append this field.');
    }
    formData.delete('files');

    const fdSnapshot: Array<{ key: string; type: string; size?: number; name?: string }> = [];
    // @ts-ignore
    for (const [k, v] of (formData as any).entries()) {
      if (typeof File !== 'undefined' && v instanceof File) {
        fdSnapshot.push({ key: k, type: 'File', size: v.size, name: v.name });
      } else {
        fdSnapshot.push({ key: k, type: 'String' });
      }
    }
    
    console.log('📤 [NewsService] Envoi FormData avec:', {
      textFields: {
        title: data.title,
        content: data.content?.substring(0, 50) + '...',
        isPublic: data.isPublic,
        isFeatured: data.isFeatured,
        summary: data.summary,
        category: data.category,
      },
      filesCount: files?.length || 0,
      formDataKeys: fdSnapshot
    });

    return await apiClient.post<News>('/news', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Update news (Admin)
  async updateNews(id: string, data: UpdateNewsDto, files?: File[]): Promise<ApiResponse<News>> {
    const formData = new FormData();
    
    // Add text fields (exclude 'files' field from data as it's handled separately)
    if (data.title) formData.append('title', data.title);
    if (data.content) formData.append('content', data.content);
    if (data.imageUrl) formData.append('imageUrl', data.imageUrl);
    if (data.isPublic !== undefined) formData.append('isPublic', data.isPublic.toString());
    if (data.isFeatured !== undefined) formData.append('isFeatured', data.isFeatured.toString());
    if (data.summary) formData.append('summary', data.summary);
    if (data.category) formData.append('category', data.category);
    
    // Append only the main image (first file) if provided and replaceMainImage is true
    if (files && files.length > 0 && data.replaceMainImage) {
      const main = files[0];
      formData.append('mainImage', main);
    }

    // NEW: Send the replaceMainImage flag to backend so DTO receives it
    if (data.replaceMainImage !== undefined) {
      formData.append('replaceMainImage', data.replaceMainImage ? 'true' : 'false');
    }

    // Safety: ensure no 'files' field is included on update
    if ((data as any)?.files) {
      console.warn('[NewsService] data.files detected during update, will NOT append this field.');
    }
    formData.delete('files');

    const fdUpdateSnapshot: Array<{ key: string; type: string; size?: number; name?: string }> = [];
    // @ts-ignore
    for (const [k, v] of (formData as any).entries()) {
      if (typeof File !== 'undefined' && v instanceof File) {
        fdUpdateSnapshot.push({ key: k, type: 'File', size: v.size, name: v.name });
      } else {
        fdUpdateSnapshot.push({ key: k, type: 'String' });
      }
    }

    // NEW: Confirm replaceMainImage is present in FormData keys
    const hasReplaceFlag = fdUpdateSnapshot.some((entry) => entry.key === 'replaceMainImage');
    console.log('✅ [NewsService] replaceMainImage appended:', hasReplaceFlag, 'value:', data.replaceMainImage);

    console.log('📤 [NewsService] Mise à jour FormData avec:', {
      id,
      textFields: {
        title: data.title,
        content: data.content?.substring(0, 50) + '...',
        isPublic: data.isPublic,
        isFeatured: data.isFeatured,
        summary: data.summary,
        category: data.category,
        replaceMainImage: data.replaceMainImage
      },
      filesCount: files?.length || 0,
      formDataKeys: fdUpdateSnapshot
    });

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

  // Get all categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return await apiClient.get<Category[]>('/categories');
  }
}

export const newsService = new NewsService();
export default newsService;