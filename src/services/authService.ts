import { apiClient, ApiResponse } from './api';

// Updated to match backend User entity
export interface AdminUser {
  role: string;
  displayName: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  city?: string;
  postalCode?: string;
  countryId?: string;
  country?: {
    id: string;
    name: string;
    code: string;
    currency: string;
    phonePrefix: string;
    continent?: string;
    isActive: boolean;
  };
  profilePicture?: string;
  isAdmin: boolean;
  verifiedEmail: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: AdminUser;
  token: string;
  expiresIn: number;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ValidatePasswordData {
  currentPassword: string;
}

interface AuthResponse {
  user: AdminUser;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<LoginResponse>('/admin/login', credentials);
    
    if (response.success && response.data) {
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.post<null>('/admin/logout');
      return response;
    } finally {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post('/admin/refresh', { refreshToken });
      const { token, refreshToken: newRefreshToken, user } = response.data;
      
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_refresh_token', newRefreshToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_user');
      throw error;
    }
  }

  async getProfile(): Promise<ApiResponse<AdminUser>> {
    return apiClient.get<AdminUser>('/admin/profile');
  }

  async updateProfile(data: Partial<AdminUser>): Promise<ApiResponse<AdminUser>> {
    const response = await apiClient.put<AdminUser>('/admin/profile', data);
    
    if (response.success && response.data) {
      localStorage.setItem('admin_user', JSON.stringify(response.data));
    }
    
    return response;
  }

  async validateCurrentPassword(data: ValidatePasswordData): Promise<ApiResponse<{ valid: boolean }>> {
    // Le backend attend 'password' et non 'currentPassword'
    return apiClient.post<{ valid: boolean }>('/auth/validate-password', { password: data.currentPassword });
  }

  async changePassword(data: ChangePasswordData): Promise<ApiResponse<null>> {
    return apiClient.post<null>('/auth/change-password', data);
  }

  getCurrentUser(): AdminUser | null {
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  hasPermission(permission: string): boolean {
    // Since only admins can access this admin panel, always return true
    return true;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role || user?.isAdmin === true;
  }

  getUserFullName(): string {
    const user = this.getCurrentUser();
    if (!user) return '';
    
    return `${user.firstName} ${user.lastName}`.trim();
  }

  isAdminUser(): boolean {
    const user = this.getCurrentUser();
    return user?.isAdmin === true;
  }
}

export const authService = new AuthService();