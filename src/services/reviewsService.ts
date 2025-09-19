import { apiClient, ApiResponse } from './api';

export interface ToolReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tool: {
    id: string;
    title: string;
  };
}

export interface AppReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReviewFilters {
  search?: string;
  rating?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class ReviewsService {
  // Get all tool reviews for admin with filters and pagination
  async getToolReviews(filters?: ReviewFilters): Promise<ApiResponse<PaginatedResponse<ToolReview>>> {
    const response = await apiClient.get<any>('/admin/reviews/tools', { params: filters });
    // L'API retourne {data: {...}, message: "Request successful"}
    // Nous devons restructurer pour que response.data contienne directement les données paginées
    console.log("-----------------", response)
    return {
      data: response.data.data,
      message: response.data.message,
      success: response.data.success || true
    };
  }

  // Get all app reviews for admin with filters and pagination
  async getAppReviews(filters?: ReviewFilters): Promise<ApiResponse<PaginatedResponse<AppReview>>> {
    const response = await apiClient.get<any>('/admin/reviews/app', { params: filters });
    // L'API retourne {data: {...}, message: "Request successful"}
    // Nous devons restructurer pour que response.data contienne directement les données paginées
    return {
     data: response.data.data,
     message: response.data.message,
     success: response.data.success || true
    };
  }

  // Get single tool review for admin
  async getToolReview(id: string): Promise<ApiResponse<ToolReview>> {
    const response = await apiClient.get<any>(`/admin/reviews/tools/${id}`);
    return {
      data: response.data,
      message: response.message,
      success: response.success || true
    };
  }

  // Get single app review for admin
  async getAppReview(id: string): Promise<ApiResponse<AppReview>> {
    const response = await apiClient.get<any>(`/admin/reviews/app/${id}`);
    return {
      data: response.data,
      message: response.message,
      success: response.success || true
    };
  }

  // Delete a tool review
  async deleteToolReview(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<any>(`/admin/reviews/tools/${id}`);
    return {
      data: response.data,
      message: response.message,
      success: response.success || true
    };
  }

  // Delete an app review
  async deleteAppReview(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<any>(`/admin/reviews/app/${id}`);
    return {
      data: response.data,
      message: response.message,
      success: response.success || true
    };
  }

  // Get tool reviews statistics
  async getToolReviewsStats(): Promise<ApiResponse<{ total: number; averageRating: number }>> {
    const response = await apiClient.get<any>('/admin/reviews/tools/stats');
    return {
      data: response.data,
      message: response.message,
      success: response.success || true
    };
  }

  // Get app reviews statistics
  async getAppReviewsStats(): Promise<ApiResponse<{ total: number; averageRating: number }>> {
    const response = await apiClient.get<any>('/admin/reviews/app/stats');
    return {
      data: response.data,
      message: response.message,
      success: response.success || true
    };
  }
}

export const reviewsService = new ReviewsService();