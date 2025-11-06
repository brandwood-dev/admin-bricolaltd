import { apiClient, ApiResponse } from './api';
import { Transaction, TransactionFilterParams, PaginatedResponse, TransactionType, TransactionStatus, PaymentMethod } from '../types/unified-bridge';

export interface TransactionStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  disputedTransactions: number;
  averageTransactionValue: number;
  revenueGrowth: number;
  transactionsByType: {
    type: TransactionType;
    count: number;
    amount: number;
  }[];
  transactionsByStatus: {
    status: TransactionStatus;
    count: number;
    amount: number;
  }[];
}

export interface TransactionDetails extends Transaction {
  fees: number;
  netAmount: number;
  paymentProvider: string;
  referenceId: string;
  disputeReason?: string;
  disputeStatus?: 'open' | 'investigating' | 'resolved' | 'closed';
}

export interface RefundRequest {
  transactionId: string;
  amount: number;
  reason: string;
  notifyUser?: boolean;
}

export interface BulkTransactionAction {
  transactionIds: string[];
  action: 'approve' | 'reject' | 'refund' | 'cancel';
  reason?: string;
}

class TransactionsService {
  // CRUD Operations
  async getTransactions(params?: TransactionFilterParams): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    return await apiClient.get<PaginatedResponse<Transaction>>('/admin/transactions', { params });
  }

  async getTransactionById(id: string): Promise<ApiResponse<TransactionDetails>> {
    return await apiClient.get<TransactionDetails>(`/admin/transactions/${id}`);
  }

  async updateTransactionStatus(id: string, status: TransactionStatus, reason?: string): Promise<ApiResponse<Transaction>> {
    return await apiClient.patch<Transaction>(`/admin/transactions/${id}/status`, { status, reason });
  }

  // Statistics and Analytics
  async getTransactionStats(dateRange?: { startDate: string; endDate: string }): Promise<ApiResponse<TransactionStats>> {
    const params = dateRange ? {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate
    } : {};
    
    return await apiClient.get<TransactionStats>('/admin/transactions/stats', { params });
  }

  async getTransactionsByPeriod(period: 'week' | 'month' | 'year'): Promise<ApiResponse<{ date: string; transactions: number; amount: number }[]>> {
    return await apiClient.get<{ date: string; transactions: number; amount: number }[]>('/admin/transactions/by-period', {
      params: { period }
    });
  }

  async getTransactionsByType(): Promise<ApiResponse<{ type: TransactionType; count: number; amount: number }[]>> {
    return await apiClient.get<{ type: TransactionType; count: number; amount: number }[]>('/admin/transactions/by-type');
  }

  async getTransactionsByStatus(): Promise<ApiResponse<{ status: TransactionStatus; count: number; amount: number }[]>> {
    return await apiClient.get<{ status: TransactionStatus; count: number; amount: number }[]>('/admin/transactions/by-status');
  }

  // Refunds and Disputes
  async processRefund(data: RefundRequest): Promise<ApiResponse<Transaction>> {
    return await apiClient.post<Transaction>('/admin/transactions/refund', data);
  }

  async getDisputedTransactions(params?: TransactionFilterParams): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    return await apiClient.get<PaginatedResponse<Transaction>>('/admin/transactions/disputed', { params });
  }

  async resolveDispute(transactionId: string, resolution: {
    action: 'refund' | 'reject' | 'partial_refund';
    amount?: number;
    reason: string;
  }): Promise<ApiResponse<Transaction>> {
    return await apiClient.post<Transaction>(`/admin/transactions/${transactionId}/resolve-dispute`, resolution);
  }

  // Bulk Operations
  async bulkUpdateTransactions(data: BulkTransactionAction): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
    return await apiClient.post<{ updated: number; failed: string[] }>('/admin/transactions/bulk-update', data);
  }

  // Search and Filtering
  async searchTransactions(query: string, filters?: Partial<TransactionFilterParams>): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    return await apiClient.get<PaginatedResponse<Transaction>>('/admin/transactions/search', {
      params: { search: query, ...filters }
    });
  }

  async getTransactionsByUser(userId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    return await apiClient.get<PaginatedResponse<Transaction>>(`/users/${userId}/transactions`, { params });
  }

  async getTransactionsByBooking(bookingId: string): Promise<ApiResponse<Transaction[]>> {
    return await apiClient.get<Transaction[]>(`/admin/transactions/booking/${bookingId}`);
  }

  // Export functionality
  async exportTransactions(params?: TransactionFilterParams & { format: 'csv' | 'excel' }): Promise<ApiResponse<Blob>> {
    return await apiClient.get<Blob>('/admin/transactions/export', { 
      params,
      responseType: 'blob'
    } as any);
  }

  // Payment Methods
  async getPaymentMethods(): Promise<ApiResponse<{ method: PaymentMethod; count: number; amount: number }[]>> {
    return await apiClient.get<{ method: PaymentMethod; count: number; amount: number }[]>('/admin/transactions/payment-methods');
  }

  // Failed Transactions
  async getFailedTransactions(params?: TransactionFilterParams): Promise<ApiResponse<PaginatedResponse<Transaction>>> {
    return await apiClient.get<PaginatedResponse<Transaction>>('/admin/transactions/failed', { params });
  }

  async retryFailedTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    return await apiClient.post<Transaction>(`/admin/transactions/${transactionId}/retry`);
  }

  // Revenue Analytics
  async getRevenueByPeriod(period: 'daily' | 'weekly' | 'monthly', dateRange?: { startDate: string; endDate: string }): Promise<ApiResponse<{ date: string; revenue: number; fees: number; net: number }[]>> {
    const params = {
      period,
      ...(dateRange && {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      })
    };
    
    return await apiClient.get<{ date: string; revenue: number; fees: number; net: number }[]>('/admin/transactions/revenue-by-period', { params });
  }
}

export const transactionsService = new TransactionsService();