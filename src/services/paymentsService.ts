import { apiClient, ApiResponse } from './api'

class PaymentsService {
  async refundPaymentIntent(
    paymentIntentId: string,
    amount?: number,
    reason: 'duplicate' | 'fraudulent' | 'requested_by_customer' = 'requested_by_customer'
  ): Promise<ApiResponse<{ success: boolean; data: { refund_id: string; amount: number; status: string } }>> {
    return await apiClient.post<{ success: boolean; data: { refund_id: string; amount: number; status: string } }>(
      '/payments/refund',
      { paymentIntentId, amount, reason }
    )
  }
}

export const paymentsService = new PaymentsService()
export default paymentsService
