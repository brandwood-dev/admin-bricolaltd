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

// Section interfaces
export interface Paragraph {
  id: string;
  content: string;
  orderIndex: number;
}

export interface SectionImage {
  id: string;
  url: string;
  alt?: string;
  orderIndex: number;
}

export interface Section {
  id: string;
  title: string;
  orderIndex: number;
  paragraphs: Paragraph[];
  images: SectionImage[];
}

// News interfaces
export interface News {
  id: string;
  title: string;
  content?: string; // Legacy field for backward compatibility
  sections?: Section[];
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
  content?: string; // Legacy field for backward compatibility
  sections?: Section[];
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

  // Upload section image
  async uploadSectionImage(sectionId: string, file: File, alt?: string, orderIndex?: number): Promise<ApiResponse<SectionImage>> {
    const formData = new FormData();
    formData.append('image', file);
    if (alt) formData.append('alt', alt);
    if (orderIndex !== undefined) formData.append('orderIndex', orderIndex.toString());
    
    console.log('[NewsService] Uploading section image:', {
      sectionId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hasAlt: !!alt,
      orderIndex
    });
    
    try {
      const response = await apiClient.post<SectionImage>(`/news/sections/${sectionId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('[NewsService] Upload response:', response);
      
      if (response.success && response.data) {
        console.log('[NewsService] Upload successful, image URL:', response.data.url);
        return response;
      } else {
        throw new Error(response.message || 'Upload failed - no data returned');
      }
    } catch (error: any) {
      console.error('[NewsService] Upload error:', error);
      
      // Enhanced error information
      if (error.response) {
        console.error('[NewsService] Server responded with:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('[NewsService] No response received:', error.request);
      } else {
        console.error('[NewsService] Request setup error:', error.message);
      }
      
      throw error;
    }
  }

  // New sequential save methods
  async uploadCoverImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('[NewsService] Uploading cover image:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    try {
      const response = await apiClient.post<{ url: string }>('/news/upload-cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('[NewsService] Cover image uploaded:', response.data?.data?.url);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Cover image upload error:', error);
      throw error;
    }
  }

  async saveSection(newsId: string, sectionData: any): Promise<ApiResponse<any>> {
    console.log('[NewsService] Saving section:', {
      newsId,
      title: sectionData.title,
      orderIndex: sectionData.orderIndex
    });
    
    try {
      const response = await apiClient.post(`/news/${newsId}/sections`, sectionData);
      console.log('[NewsService] Section saved, full response:', response);
      console.log('[NewsService] Section saved, response.data:', response.data);
      console.log('[NewsService] Section saved, response.data.data:', response.data?.data);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Section save error:', error);
      throw error;
    }
  }

  async saveSectionParagraph(sectionId: string, paragraphData: any): Promise<ApiResponse<any>> {
    console.log('[NewsService] Saving paragraph:', {
      sectionId,
      content: paragraphData.content?.substring(0, 50) + '...',
      orderIndex: paragraphData.orderIndex
    });
    
    try {
      const response = await apiClient.post(`/news/sections/${sectionId}/paragraphs`, paragraphData);
      console.log('[NewsService] Paragraph saved:', response.data);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Paragraph save error:', error);
      throw error;
    }
  }

  async saveSectionImageWithUrl(sectionId: string, imageData: { url: string; alt?: string; orderIndex?: number }): Promise<ApiResponse<any>> {
    console.log('[NewsService] Saving section image with URL:', {
      sectionId,
      url: imageData.url,
      alt: imageData.alt,
      orderIndex: imageData.orderIndex
    });
    
    try {
      const response = await apiClient.post(`/news/sections/${sectionId}/images/url`, imageData);
      console.log('[NewsService] Section image saved with URL:', response.data);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Section image save error:', error);
      throw error;
    }
  }

  // Deprecated method - kept for backward compatibility but throws error
  async saveSectionImage(sectionId: string, imageData: any): Promise<ApiResponse<any>> {
    console.log('[NewsService] saveSectionImage called (deprecated):', {
      sectionId,
      url: imageData.url,
      orderIndex: imageData.orderIndex
    });
    
    throw new Error('saveSectionImage is deprecated. Use uploadSectionImage for file uploads or saveSectionImageWithUrl for URL-based images.');
  }

  // New edit workflow methods
  async updateSection(sectionId: string, sectionData: { title: string; orderIndex: number }): Promise<ApiResponse<any>> {
    console.log('[NewsService] Updating section:', {
      sectionId,
      title: sectionData.title,
      orderIndex: sectionData.orderIndex
    });
    
    try {
      const response = await apiClient.patch(`/sections/${sectionId}`, sectionData);
      console.log('[NewsService] Section updated:', response.data);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Section update error:', error);
      throw error;
    }
  }

  async deleteSection(sectionId: string): Promise<ApiResponse<any>> {
    console.log('[NewsService] Deleting section:', sectionId);
    
    try {
      const response = await apiClient.delete(`/sections/${sectionId}`);
      console.log('[NewsService] Section deleted:', response.data);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Section deletion error:', error);
      throw error;
    }
  }

  async updateParagraph(paragraphId: string, content: string, orderIndex: number, sectionId?: string): Promise<ApiResponse<any>> {
    console.log('[NewsService] Updating paragraph:', {
      paragraphId,
      content: content?.substring(0, 50) + '...',
      orderIndex,
      sectionId
    });
    
    try {
      let actualSectionId = sectionId;
      
      // If sectionId is not provided, try to fetch it
      if (!actualSectionId) {
        try {
          const paragraphResponse = await apiClient.get(`/sections/paragraphs/${paragraphId}`);
          actualSectionId = paragraphResponse.data?.data?.sectionId;
        } catch (getError) {
          console.warn('[NewsService] Could not fetch paragraph details, will try direct update');
        }
      }
      
      if (actualSectionId) {
        // Use the correct endpoint with section ID
        const response = await apiClient.patch(`/sections/${actualSectionId}/paragraphs/${paragraphId}`, {
          content,
          orderIndex
        });
        console.log('[NewsService] Paragraph updated:', response.data);
        return response;
      } else {
        // Fallback: try direct update without section ID (for backwards compatibility)
        const response = await apiClient.patch(`/sections/paragraphs/${paragraphId}`, {
          content,
          orderIndex
        });
        console.log('[NewsService] Paragraph updated (fallback):', response.data);
        return response;
      }
    } catch (error: any) {
      console.error('[NewsService] Paragraph update error:', error);
      throw error;
    }
  }

  async deleteParagraph(paragraphId: string, sectionId?: string): Promise<ApiResponse<any>> {
    console.log('[NewsService] Deleting paragraph:', paragraphId);
    
    try {
      let actualSectionId = sectionId;
      
      // If sectionId is not provided, try to fetch it
      if (!actualSectionId) {
        try {
          const paragraphResponse = await apiClient.get(`/sections/paragraphs/${paragraphId}`);
          actualSectionId = paragraphResponse.data?.data?.sectionId;
        } catch (getError) {
          console.warn('[NewsService] Could not fetch paragraph details, will try direct delete');
        }
      }
      
      if (actualSectionId) {
        // Use the correct endpoint with section ID
        const response = await apiClient.delete(`/sections/${actualSectionId}/paragraphs/${paragraphId}`);
        console.log('[NewsService] Paragraph deleted:', response.data);
        return response;
      } else {
        // Fallback: try direct delete without section ID (for backwards compatibility)
        const response = await apiClient.delete(`/sections/paragraphs/${paragraphId}`);
        console.log('[NewsService] Paragraph deleted (fallback):', response.data);
        return response;
      }
    } catch (error: any) {
      console.error('[NewsService] Paragraph deletion error:', error);
      throw error;
    }
  }

  async updateSectionImage(imageId: string, url: string, alt?: string, orderIndex?: number): Promise<ApiResponse<any>> {
    console.log('[NewsService] Updating section image:', {
      imageId,
      url,
      alt,
      orderIndex
    });
    
    try {
      // Use the sections service directly - it can update by image ID alone
      const response = await apiClient.patch(`/sections/images/${imageId}`, {
        url,
        alt,
        orderIndex
      });
      console.log('[NewsService] Section image updated:', response.data);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Section image update error:', error);
      throw error;
    }
  }

  async deleteSectionImage(imageId: string, sectionId?: string): Promise<ApiResponse<any>> {
    console.log('[NewsService] Deleting section image:', imageId);
    
    try {
      // Use the sections service directly - it can delete by image ID alone
      const response = await apiClient.delete(`/sections/images/${imageId}`);
      console.log('[NewsService] Section image deleted:', response.data);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Section image deletion error:', error);
      throw error;
    }
  }

  async uploadAndSaveSectionImage(sectionId: string, file: File, alt?: string, orderIndex?: number): Promise<ApiResponse<any>> {
    console.log('[NewsService] Uploading and saving section image:', {
      sectionId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      alt,
      orderIndex
    });
    
    try {
      // The upload endpoint already uploads the file AND saves the record
      const uploadResponse = await this.uploadSectionImage(sectionId, file, alt, orderIndex);
      
      if (uploadResponse.success && uploadResponse.data) {
        console.log('[NewsService] Image uploaded and saved successfully:', uploadResponse.data);
        return uploadResponse;
      } else {
        throw new Error('Upload failed or no data returned');
      }
    } catch (error: any) {
      console.error('[NewsService] Image upload and save error:', error);
      throw error;
    }
  }

  // Get sections by article ID
  async getSectionsByArticle(articleId: string): Promise<ApiResponse<any[]>> {
    console.log('[NewsService] Getting sections for article:', articleId);
    
    try {
      const response = await apiClient.get(`/sections/article/${articleId}`);
      console.log('[NewsService] Sections retrieved:', response.data);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Get sections error:', error);
      throw error;
    }
  }

  // Get individual section by ID
  async getSectionById(sectionId: string): Promise<ApiResponse<any>> {
    console.log('[NewsService] Getting section by ID:', sectionId);
    
    try {
      const response = await apiClient.get(`/sections/${sectionId}`);
      console.log('[NewsService] Section retrieved:', response.data);
      return response;
    } catch (error: any) {
      console.error('[NewsService] Get section error:', error);
      throw error;
    }
  }
}

export const newsService = new NewsService();
export default newsService;