import { apiClient, ApiResponse } from './api';
import { Dispute, DisputeFilterParams, PaginatedResponse, DisputeStats, DisputeStatus } from '../types/unified-bridge';

export interface DisputeDetails extends Dispute {
  messages: DisputeMessage[];
  evidence: DisputeEvidence[];
  timeline: DisputeTimelineEvent[];
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  message: string;
  createdAt: string;
}

export interface DisputeEvidence {
  id: string;
  disputeId: string;
  type: 'image' | 'document' | 'video';
  url: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DisputeTimelineEvent {
  id: string;
  disputeId: string;
  action: string;
  description: string;
  performedBy: string;
  performedAt: string;
}

export interface DisputeResolution {
  disputeId: string;
  resolution: 'refund_full' | 'refund_partial' | 'no_refund' | 'compensation';
  amount?: number;
  reason: string;
  adminNotes?: string;
  notifyParties?: boolean;
}

export interface BulkDisputeAction {
  disputeIds: string[];
  action: 'resolve' | 'close' | 'assign' | 'escalate';
  reason?: string;
  assigneeId?: string;
}

class DisputesService {
  // CRUD Operations
  async getDisputes(params?: DisputeFilterParams): Promise<ApiResponse<PaginatedResponse<Dispute>>> {
    return await apiClient.get<PaginatedResponse<Dispute>>('/disputes', { params });
  }

  async getDisputeById(id: string): Promise<ApiResponse<DisputeDetails>> {
    return await apiClient.get<DisputeDetails>(`/disputes/${id}`);
  }

  async createDispute(data: {
    userId: string;
    bookingId: string;
    reason: string;
    details?: string;
  }): Promise<ApiResponse<Dispute>> {
    return await apiClient.post<Dispute>('/disputes', data);
  }

  async updateDispute(id: string, data: {
    adminId?: string;
    status?: DisputeStatus;
    resolutionNotes?: string;
    resolution?: string;
  }): Promise<ApiResponse<Dispute>> {
    return await apiClient.patch<Dispute>(`/disputes/${id}`, data);
  }

  async deleteDispute(id: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/disputes/${id}`);
  }

  // Status Management
  async markAsInProgress(id: string): Promise<ApiResponse<Dispute>> {
    return await apiClient.patch<Dispute>(`/disputes/${id}/status/in-progress`);
  }

  async markAsResolved(id: string): Promise<ApiResponse<Dispute>> {
    return await apiClient.patch<Dispute>(`/disputes/${id}/status/resolved`);
  }

  async markAsClosed(id: string): Promise<ApiResponse<Dispute>> {
    return await apiClient.patch<Dispute>(`/disputes/${id}/status/closed`);
  }

  // Statistics and Analytics
  async getDisputeStats(dateRange?: { startDate: string; endDate: string }): Promise<ApiResponse<DisputeStats>> {
    const params = dateRange ? {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    } : {};
    
    return await apiClient.get<DisputeStats>('/admin/dashboard/dispute-overview', { params });
  }

  async getDisputesByUser(userId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Dispute>>> {
    return await apiClient.get<PaginatedResponse<Dispute>>(`/disputes/user/${userId}`, { params });
  }

  async getDisputesByBooking(bookingId: string): Promise<ApiResponse<Dispute>> {
    return await apiClient.get<Dispute>(`/disputes/booking/${bookingId}`);
  }

  // Dispute Resolution
  async resolveDispute(data: DisputeResolution): Promise<ApiResponse<Dispute>> {
    await this.updateDispute(data.disputeId, {
      resolutionNotes: data.adminNotes || data.reason,
      resolution: data.resolution
    });
    return await apiClient.patch<Dispute>(`/disputes/${data.disputeId}/status/resolved`);
  }

  async addDisputeMessage(disputeId: string, data: {
    message: string;
    senderId: string;
  }): Promise<ApiResponse<DisputeMessage>> {
    return await apiClient.post<DisputeMessage>(`/disputes/${disputeId}/messages`, data);
  }

  async getDisputeMessages(disputeId: string): Promise<ApiResponse<DisputeMessage[]>> {
    return await apiClient.get<DisputeMessage[]>(`/disputes/${disputeId}/messages`);
  }

  async uploadEvidence(disputeId: string, file: File, description?: string): Promise<ApiResponse<DisputeEvidence>> {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    
    return await apiClient.uploadFile<DisputeEvidence>(`/disputes/${disputeId}/evidence`, formData);
  }

  async getDisputeEvidence(disputeId: string): Promise<ApiResponse<DisputeEvidence[]>> {
    return await apiClient.get<DisputeEvidence[]>(`/disputes/${disputeId}/evidence`);
  }

  async getDisputeTimeline(disputeId: string): Promise<ApiResponse<DisputeTimelineEvent[]>> {
    return await apiClient.get<DisputeTimelineEvent[]>(`/disputes/${disputeId}/timeline`);
  }

  // Bulk Operations
  async bulkUpdateDisputes(data: BulkDisputeAction): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return await apiClient.post<{ updated: number; failed: string[] }>('/admin/disputes/bulk-update', data);
  }

  // Search and Filtering
  async searchDisputes(query: string, filters?: Partial<DisputeFilterParams>): Promise<ApiResponse<PaginatedResponse<Dispute>>> {
    const params = { search: query, ...filters };
    return await apiClient.get<PaginatedResponse<Dispute>>('/disputes/search', { params });
  }

  // Data Export
  async exportDisputes(params?: DisputeFilterParams & { format: 'csv' | 'excel' }): Promise<ApiResponse<Blob>> {
    const response = await apiClient.get('/admin/disputes/export', {
      params,
      responseType: 'blob'
    });
    return response;
  }

  // Dashboard Overview
  async getDisputeOverview(): Promise<ApiResponse<{
    status: string;
    count: number;
  }[]>> {
    return await apiClient.get('/admin/dashboard/dispute-overview');
  }

  // Assignment and Escalation
  async assignDispute(disputeId: string, adminId: string): Promise<ApiResponse<Dispute>> {
    return await apiClient.patch<Dispute>(`/disputes/${disputeId}/assign`, { adminId });
  }

  async escalateDispute(disputeId: string, reason: string): Promise<ApiResponse<Dispute>> {
    return await apiClient.post<Dispute>(`/disputes/${disputeId}/escalate`, { reason });
  }

  // Notifications
  async sendDisputeNotification(disputeId: string, data: {
    recipientId: string;
    message: string;
    type: 'update' | 'resolution' | 'escalation';
  }): Promise<ApiResponse<void>> {
    return await apiClient.post<void>(`/disputes/${disputeId}/notify`, data);
  }
}

export const disputesService = new DisputesService();
