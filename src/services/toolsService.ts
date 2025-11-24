import { apiClient, ApiResponse } from './api';

export interface ToolPhoto {
  id: string;
  url: string;
  filename: string;
  isPrimary: boolean;
  toolId: string;
  createdAt: string;
}

export interface Tool {
  id: string;
  title: string;
  description: string;
  brand?: string;
  model?: string;
  year?: number;
  condition: string;
  pickupAddress: string;
  basePrice: number;
  depositAmount: number;
  imageUrl?: string; // Deprecated, use photos instead
  photos: ToolPhoto[];
  toolStatus: 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW' | 'ARCHIVED';
  availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE' | 'RESERVED';
  moderationStatus: 'Pending' | 'Confirmed' | 'Rejected';
  rejectionReason?: string;
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ToolStats {
  total: number;
  published: number;
  underReview: number;
  archived: number;
  draft: number;
  moderationPending: number;
  moderationConfirmed: number;
  moderationRejected: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ToolFilters {
  search?: string;
  status?: string;
  moderationStatus?: string;
  category?: string;
  subcategory?: string;
  owner?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface UpdateToolStatusDto {
  status?: 'DRAFT' | 'PUBLISHED' | 'UNDER_REVIEW' | 'ARCHIVED';
  reason?: string;
  adminNotes?: string;
}

export interface Category {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  categoryId: string;
  category?: Category;
}

export class ToolsService {
  // Get all tools for admin with filters and pagination
  async getToolsForAdmin(filters?: ToolFilters): Promise<ApiResponse<PaginatedResponse<Tool>>> {
    return await apiClient.get<PaginatedResponse<Tool>>('/admin/tools', { params: filters });
  }

  // Get tool statistics
  async getToolStats(): Promise<ApiResponse<ToolStats>> {
    return await apiClient.get<ToolStats>('/admin/tools/stats');
  }

  // Get single tool for admin
  async getToolForAdmin(id: string): Promise<ApiResponse<Tool>> {
    return await apiClient.get<Tool>(`/admin/tools/${id}`);
  }

  // Approve a tool
  async approveTool(id: string, adminNotes?: string): Promise<ApiResponse<Tool>> {
    return await apiClient.patch<Tool>(`/admin/tools/${id}/approve`, { adminNotes });
  }

  // Reject a tool
  async rejectTool(id: string, reason: string, adminNotes?: string): Promise<ApiResponse<Tool>> {
    return await apiClient.patch<Tool>(`/admin/tools/${id}/reject`, { reason, adminNotes });
  }

  // Update tool status
  async updateToolStatus(id: string, data: UpdateToolStatusDto): Promise<ApiResponse<Tool>> {
    return await apiClient.patch<Tool>(`/admin/tools/${id}/status`, data);
  }

  // Delete a tool
  async deleteTool(id: string, reason?: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/admin/tools/${id}`, { 
      data: { reason } 
    });
  }

  // Archive a tool
  async archiveTool(id: string, adminNotes?: string): Promise<ApiResponse<Tool>> {
    return await apiClient.patch<Tool>(`/admin/tools/${id}/archive`, { adminNotes });
  }

  // Restore a tool
  async restoreTool(id: string, adminNotes?: string): Promise<ApiResponse<Tool>> {
    return await apiClient.patch<Tool>(`/admin/tools/${id}/restore`, { adminNotes });
  }

  // Get all categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return await apiClient.get<Category[]>('/categories');
  }

  // Get subcategories by category
  async getSubcategoriesByCategory(categoryId: string): Promise<ApiResponse<Subcategory[]>> {
    return await apiClient.get<Subcategory[]>(`/categories/${categoryId}/subcategories`);
  }

  // Get all subcategories
  async getAllSubcategories(): Promise<ApiResponse<Subcategory[]>> {
    return await apiClient.get<Subcategory[]>('/categories/subcategories');
  }

  // Update moderation status
  async updateModerationStatus(id: string, status: 'Pending' | 'Confirmed' | 'Rejected'): Promise<ApiResponse<Tool>> {
    return await apiClient.patch<Tool>(`/tools/${id}/moderation-status`, { status });
  }


}

export const toolsService = new ToolsService();