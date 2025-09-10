import { apiClient } from './apiClient';

export interface NewsCategory {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewsCategoryDto {
  name: string;
  displayName: string;
  description?: string;
}

export interface UpdateNewsCategoryDto {
  name?: string;
  displayName?: string;
  description?: string;
}

export interface NewsCategoryResponse {
  success: boolean;
  data?: NewsCategory;
  error?: string;
}

export interface NewsCategoriesResponse {
  success: boolean;
  data?: NewsCategory[];
  error?: string;
}

class NewsCategoryService {
  private baseUrl = '/news-categories';

  async getAllCategories(): Promise<NewsCategoriesResponse> {
    try {
      const response = await apiClient.get(this.baseUrl);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching news categories:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch news categories'
      };
    }
  }

  async getCategoryById(id: string): Promise<NewsCategoryResponse> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error fetching news category:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch news category'
      };
    }
  }

  async createCategory(categoryData: CreateNewsCategoryDto): Promise<NewsCategoryResponse> {
    try {
      const response = await apiClient.post(this.baseUrl, categoryData);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error creating news category:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create news category'
      };
    }
  }

  async updateCategory(id: string, categoryData: UpdateNewsCategoryDto): Promise<NewsCategoryResponse> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/${id}`, categoryData);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Error updating news category:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update news category'
      };
    }
  }

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`);
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error deleting news category:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete news category'
      };
    }
  }
}

export const newsCategoryService = new NewsCategoryService();
export default newsCategoryService;