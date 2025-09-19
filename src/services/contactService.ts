import { apiClient, ApiResponse } from './api';
import { PaginatedResponse } from '../types/unified-bridge';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in_progress' | 'waiting' | 'closed';
  assignedTo?: string;
  attachments?: string[];
  response?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

class ContactService {
  // CRUD Operations
  async getContacts(params?: ContactFilterParams): Promise<ApiResponse<PaginatedResponse<Contact>>> {
    return await apiClient.get<PaginatedResponse<Contact>>('/contact', { params });
  }

  async getContactById(id: string): Promise<ApiResponse<Contact>> {
    return await apiClient.get<Contact>(`/contact/${id}`);
  }

  async updateContact(id: string, data: Partial<Contact>): Promise<ApiResponse<Contact>> {
    return await apiClient.put<Contact>(`/contact/${id}`, data);
  }

  async deleteContact(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/contact/${id}`);
  }

  // Status Management
  async updateContactStatus(id: string, status: Contact['status']): Promise<ApiResponse<Contact>> {
    return await apiClient.patch<Contact>(`/contact/${id}/status`, { status });
  }

  async assignContact(id: string, assignedTo: string): Promise<ApiResponse<Contact>> {
    return await apiClient.patch<Contact>(`/contact/${id}/assign`, { assignedTo });
  }

  async updateContactPriority(id: string, priority: Contact['priority']): Promise<ApiResponse<Contact>> {
    return await apiClient.patch<Contact>(`/contact/${id}/priority`, { priority });
  }

  // Response Management
  async sendResponse(id: string, response: string): Promise<ApiResponse<Contact>> {
    return await apiClient.patch<Contact>(`/contact/${id}/respond`, { response });
  }

  // Bulk Operations
  async bulkUpdateStatus(ids: string[], status: Contact['status']): Promise<ApiResponse<void>> {
    return await apiClient.patch<void>('/contact/bulk/status', { ids, status });
  }

  async bulkAssign(ids: string[], assignedTo: string): Promise<ApiResponse<void>> {
    return await apiClient.patch<void>('/contact/bulk/assign', { ids, assignedTo });
  }

  async bulkDelete(ids: string[]): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>('/contact/bulk', { data: { ids } });
  }

  // Statistics
  async getContactStats(): Promise<ApiResponse<{
    total: number;
    new: number;
    inProgress: number;
    waiting: number;
    closed: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  }>> {
    return await apiClient.get('/contact/stats');
  }
}

export const contactService = new ContactService();
export default contactService;