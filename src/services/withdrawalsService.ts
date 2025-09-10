import { apiClient, ApiResponse } from './api';
import { Transaction, TransactionFilterParams, PaginatedResponse, TransactionType, TransactionStatus, PaymentMethod, WithdrawalRequest, WithdrawalFilterParams } from '../types/unified-bridge';



export interface WithdrawalStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalAmount: number;
  totalFees: number;
  averageAmount: number;
  processingTime: number; // average in hours
  requestsByStatus: {
    status: TransactionStatus;
    count: number;
    amount: number;
  }[];
  requestsByMethod: {
    method: PaymentMethod;
    count: number;
    amount: number;
  }[];
}



export interface ProcessWithdrawalData {
  action: 'approve' | 'reject';
  adminNotes?: string;
  rejectionReason?: string;
  externalReference?: string;
}

export interface BulkWithdrawalAction {
  withdrawalIds: string[];
  action: 'approve' | 'reject';
  adminNotes?: string;
  rejectionReason?: string;
}

class WithdrawalsService {
  // Get all withdrawal requests
  async getWithdrawals(params?: WithdrawalFilterParams): Promise<ApiResponse<PaginatedResponse<WithdrawalRequest>>> {
    const withdrawalParams = {
      ...params,
      status: params?.status
    };
    return await apiClient.get<PaginatedResponse<WithdrawalRequest>>('/admin/withdrawals', { params: withdrawalParams });
  }

  // Get withdrawal request by ID
  async getWithdrawalById(id: string): Promise<ApiResponse<WithdrawalRequest>> {
    return await apiClient.get<WithdrawalRequest>(`/admin/withdrawals/${id}`);
  }

  // Get withdrawal statistics
  async getWithdrawalStats(): Promise<ApiResponse<WithdrawalStats>> {
    return await apiClient.get<WithdrawalStats>('/admin/transactions/stats', {
      params: { type: TransactionType.WITHDRAWAL }
    });
  }

  // Process withdrawal (approve/reject)
  async processWithdrawal(id: string, data: ProcessWithdrawalData): Promise<ApiResponse<WithdrawalRequest>> {
    if (data.action === 'approve') {
      return await apiClient.post<WithdrawalRequest>(`/admin/withdrawals/${id}/approve`, {
        stripeAccountId: data.externalReference,
        adminNotes: data.adminNotes
      });
    } else {
      return await apiClient.post<WithdrawalRequest>(`/admin/withdrawals/${id}/reject`, {
        reason: data.rejectionReason || 'Demande rejetée par l\'administrateur',
        adminNotes: data.adminNotes
      });
    }
  }

  // Approve withdrawal
  async approveWithdrawal(id: string, adminNotes?: string, externalReference?: string): Promise<ApiResponse<WithdrawalRequest>> {
    return this.processWithdrawal(id, {
      action: 'approve',
      adminNotes,
      externalReference
    });
  }

  // Reject withdrawal
  async rejectWithdrawal(id: string, rejectionReason: string, adminNotes?: string): Promise<ApiResponse<WithdrawalRequest>> {
    return this.processWithdrawal(id, {
      action: 'reject',
      rejectionReason,
      adminNotes
    });
  }

  // Get pending withdrawals
  async getPendingWithdrawals(params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<WithdrawalRequest>>> {
    return await apiClient.get<PaginatedResponse<WithdrawalRequest>>('/admin/withdrawals/pending', { params });
  }

  // Get withdrawals by user
  async getWithdrawalsByUser(userId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<WithdrawalRequest>>> {
    return this.getWithdrawals({
      ...params,
      userId
    });
  }

  // Get withdrawals by status
  async getWithdrawalsByStatus(status: TransactionStatus, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<WithdrawalRequest>>> {
    return this.getWithdrawals({
      ...params,
      status
    });
  }

  // Get withdrawals by payment method
  async getWithdrawalsByPaymentMethod(paymentMethod: PaymentMethod, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<WithdrawalRequest>>> {
    return this.getWithdrawals({
      ...params,
      paymentMethod
    });
  }

  // Bulk process withdrawals
  async bulkProcessWithdrawals(data: BulkWithdrawalAction): Promise<ApiResponse<{ success: number; failed: number; errors: string[] }>> {
    return await apiClient.post<{ success: number; failed: number; errors: string[] }>('/admin/transactions/bulk-action', {
      transactionIds: data.withdrawalIds,
      action: data.action,
      adminNotes: data.adminNotes,
      rejectionReason: data.rejectionReason
    });
  }

  // Search withdrawals
  async searchWithdrawals(query: string, params?: WithdrawalFilterParams): Promise<ApiResponse<PaginatedResponse<WithdrawalRequest>>> {
    return this.getWithdrawals({
      ...params,
      search: query
    });
  }

  // Export withdrawals
  async exportWithdrawals(params?: WithdrawalFilterParams & { format: 'csv' | 'excel' }): Promise<ApiResponse<Blob>> {
    const exportParams = {
      ...params,
      type: TransactionType.WITHDRAWAL
    };
    return await apiClient.get<Blob>('/admin/transactions/export', { 
      params: exportParams,
      responseType: 'blob'
    } as any);
  }

  // Get withdrawal analytics by period
  async getWithdrawalsByPeriod(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; withdrawals: number; amount: number }[]>> {
    return await apiClient.get<{ date: string; withdrawals: number; amount: number }[]>('/admin/transactions/by-period', {
      params: { 
        period,
        type: TransactionType.WITHDRAWAL
      }
    });
  }

  // Get failed withdrawals
  async getFailedWithdrawals(params?: WithdrawalFilterParams): Promise<ApiResponse<PaginatedResponse<WithdrawalRequest>>> {
    return this.getWithdrawals({
      ...params,
      status: TransactionStatus.FAILED
    });
  }

  // Retry failed withdrawal
  async retryFailedWithdrawal(id: string): Promise<ApiResponse<WithdrawalRequest>> {
    return await apiClient.post<WithdrawalRequest>(`/admin/transactions/${id}/retry`);
  }

  // Get withdrawal processing queue
  async getProcessingQueue(): Promise<ApiResponse<WithdrawalRequest[]>> {
    const response = await this.getPendingWithdrawals({ limit: 100 });
    return {
      success: response.success,
      data: response.data?.data || [],
      message: response.message
    };
  }

  // Update withdrawal admin notes
  async updateAdminNotes(id: string, adminNotes: string): Promise<ApiResponse<WithdrawalRequest>> {
    return await apiClient.patch<WithdrawalRequest>(`/admin/transactions/${id}`, {
      adminNotes
    });
  }
}

export const withdrawalsService = new WithdrawalsService();