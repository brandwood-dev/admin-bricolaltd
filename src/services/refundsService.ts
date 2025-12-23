import { apiClient, ApiResponse } from './api'

export interface Refund {
  id: string
  refundId: string
  transactionId: string
  bookingId?: string
  originalAmount: number
  refundAmount: number
  currency: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  reason: string
  reasonDetails?: string
  adminNotes?: string
  processedBy?: string
  processedAt?: string
  failureReason?: string
  walletBalanceUpdated: boolean
  notificationSent: boolean
  createdAt: string
  updatedAt: string
  booking?: {
    id: string
    toolName: string
    userName: string
    startDate: string
    endDate: string
  }
}

export interface RefundStats {
  totalRefunds: number
  totalRefundAmount: number
  averageRefundAmount: number
  refundsByStatus: Record<string, number>
  refundsByReason: Record<string, number>
  refundsThisMonth: number
  amountThisMonth: number
}

export interface RefundFilters {
  page?: number
  limit?: number
  status?: string
  reason?: string
  transactionId?: string
  bookingId?: string
  startDate?: string
  endDate?: string
  search?: string
}

class RefundsService {
  async getAllRefunds(params: RefundFilters = {}): Promise<ApiResponse<{ refunds: Refund[]; total: number; page: number; totalPages: number }>> {
    return await apiClient.get<{ refunds: Refund[]; total: number; page: number; totalPages: number }>('/refunds', { params })
  }

  async getRefundStats(): Promise<ApiResponse<RefundStats>> {
    return await apiClient.get<RefundStats>('/refunds/stats/summary')
  }

  async processRefund(refundId: string, amount: number, adminNotes?: string): Promise<ApiResponse<{ success: boolean; refundId: string; stripeRefundId?: string; amountRefunded?: number }>> {
    return await apiClient.post('/refunds/process', { refundId, amount, adminNotes })
  }

  async createRefundRequest(transactionId: string, amount: number, reason: string, reasonDetails?: string, adminNotes?: string): Promise<ApiResponse<{ success: boolean; refundId?: string }>> {
    return await apiClient.post('/refunds/request', { transactionId, amount, reason, reasonDetails, adminNotes })
  }

  async processRefundViaWise(refundId: string, amount: number, targetCurrency: string, bankDetails?: { iban: string; bic: string; accountHolderName: string }): Promise<ApiResponse<{ success: boolean; refundId: string; transferId: string; quoteId: string; recipientId?: string }>> {
    return await apiClient.post('/refunds/process-wise', { refundId, amount, targetCurrency, bankDetails })
  }

  async updateRefundStatus(id: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED', statusReason?: string, adminNotes?: string): Promise<ApiResponse<Refund>> {
    return await apiClient.put(`/refunds/${id}/status`, { status, statusReason, adminNotes })
  }
}

export const refundsService = new RefundsService()
export default refundsService
