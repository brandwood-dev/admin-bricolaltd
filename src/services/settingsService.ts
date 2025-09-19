import { apiClient, ApiResponse } from './api';

export interface PlatformSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  supportEmail: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  defaultLanguage: string;
  defaultCurrency: string;
  timezone: string;
}

export interface PaymentSettings {
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  paypalClientSecret: string;
  commissionRate: number;
  minimumPayout: number;
  payoutSchedule: string;
  taxRate: number;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  welcomeEmailEnabled: boolean;
  bookingConfirmationEnabled: boolean;
  paymentNotificationEnabled: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireUppercase: boolean;
  ipWhitelist: string[];
  apiRateLimit: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  adminAlerts: boolean;
  userActivityAlerts: boolean;
  paymentAlerts: boolean;
  securityAlerts: boolean;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

class SettingsService {
  // Get all settings
  async getAllSettings(): Promise<ApiResponse<{
    platform: PlatformSettings;
    payment: PaymentSettings;
    email: EmailSettings;
    security: SecuritySettings;
    notification: NotificationSettings;
  }>> {
    try {
      const response = await apiClient.get<Setting[]>('/admin/settings');
      
      if (!response.success || !response.data) {
        throw new Error('Invalid response structure');
      }
      
      const settings = response.data;
      
      // Group settings by category and transform to expected structure
      const groupedSettings = {
        platform: {} as PlatformSettings,
        payment: {} as PaymentSettings,
        email: {} as EmailSettings,
        security: {} as SecuritySettings,
        notification: {} as NotificationSettings
      };
      
      settings.forEach((setting: Setting) => {
        const category = setting.category as keyof typeof groupedSettings;
        if (groupedSettings[category]) {
          // Convert string values to appropriate types
          let value: any = setting.value;
          
          // Handle boolean values
          if (value === 'true') value = true;
          else if (value === 'false') value = false;
          // Handle numeric values
          else if (!isNaN(Number(value)) && value !== '') value = Number(value);
          // Handle arrays (for ipWhitelist)
          else if (setting.key === 'ipWhitelist' && typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch {
              value = value.split(',').map(ip => ip.trim()).filter(ip => ip);
            }
          }
          
          (groupedSettings[category] as any)[setting.key] = value;
        }
      });
      
      return {
        success: true,
        data: groupedSettings,
        message: response.message || 'Settings retrieved successfully'
      };
    } catch (error) {
      console.error('Error in getAllSettings:', error);
      return {
        success: false,
        data: {
          platform: {} as PlatformSettings,
          payment: {} as PaymentSettings,
          email: {} as EmailSettings,
          security: {} as SecuritySettings,
          notification: {} as NotificationSettings
        },
        message: 'Failed to retrieve settings'
      };
    }
  }

  // Get settings by category
  async getSettingsByCategory(category: string): Promise<ApiResponse<Setting[]>> {
    return await apiClient.get<Setting[]>(`/admin/settings/category/${category}`);
  }

  // Get specific setting
  async getSetting(key: string): Promise<ApiResponse<Setting>> {
    return await apiClient.get<Setting>(`/admin/settings/${key}`);
  }

  // Update setting
  async updateSetting(key: string, value: string): Promise<ApiResponse<Setting>> {
    return await apiClient.put<Setting>(`/admin/settings/${key}`, { value });
  }

  // Update multiple settings
  async updateSettings(category: string, settings: any): Promise<ApiResponse<any>> {
    return await apiClient.put<any>(`/admin/settings/${category}`, settings);
  }

  // Platform Settings
  async getPlatformSettings(): Promise<ApiResponse<PlatformSettings>> {
    return await apiClient.get<PlatformSettings>('/admin/settings/platform');
  }

  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<ApiResponse<PlatformSettings>> {
    return await apiClient.put<PlatformSettings>('/admin/settings/platform', settings);
  }

  // Payment Settings
  async getPaymentSettings(): Promise<ApiResponse<PaymentSettings>> {
    return await apiClient.get<PaymentSettings>('/admin/settings/payment');
  }

  async updatePaymentSettings(settings: Partial<PaymentSettings>): Promise<ApiResponse<PaymentSettings>> {
    return await apiClient.put<PaymentSettings>('/admin/settings/payment', settings);
  }

  // Email Settings
  async getEmailSettings(): Promise<ApiResponse<EmailSettings>> {
    return await apiClient.get<EmailSettings>('/admin/settings/email');
  }

  async updateEmailSettings(settings: Partial<EmailSettings>): Promise<ApiResponse<EmailSettings>> {
    return await apiClient.put<EmailSettings>('/admin/settings/email', settings);
  }

  async testEmailConfiguration(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return await apiClient.post<{ success: boolean; message: string }>('/admin/settings/email/test');
  }

  async testEmailSettings(settings: EmailSettings): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return await apiClient.post<{ success: boolean; message: string }>('/admin/settings/email/test', settings);
  }

  // Security Settings
  async getSecuritySettings(): Promise<ApiResponse<SecuritySettings>> {
    return await apiClient.get<SecuritySettings>('/admin/settings/security');
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<ApiResponse<SecuritySettings>> {
    return await apiClient.put<SecuritySettings>('/admin/settings/security', settings);
  }

  // Notification Settings
  async getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
    return await apiClient.get<NotificationSettings>('/admin/settings/notifications');
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<ApiResponse<NotificationSettings>> {
    return await apiClient.put<NotificationSettings>('/admin/settings/notifications', settings);
  }

  // System Operations
  async clearCache(): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return await apiClient.post<{ success: boolean; message: string }>('/admin/settings/cache/clear');
  }

  async backupSettings(): Promise<ApiResponse<Blob>> {
    return await apiClient.get<Blob>('/admin/settings/backup', {
      responseType: 'blob'
    } as any);
  }

  async restoreSettings(file: File): Promise<ApiResponse<{ success: boolean; message: string; restored: number }>> {
    return await apiClient.uploadFile<{ success: boolean; message: string; restored: number }>('/admin/settings/restore', file);
  }

  // Maintenance Mode
  async enableMaintenanceMode(message?: string): Promise<ApiResponse<{ success: boolean }>> {
    return await apiClient.post<{ success: boolean }>('/admin/settings/maintenance/enable', { message });
  }

  async disableMaintenanceMode(): Promise<ApiResponse<{ success: boolean }>> {
    return await apiClient.post<{ success: boolean }>('/admin/settings/maintenance/disable');
  }
}

export const settingsService = new SettingsService();