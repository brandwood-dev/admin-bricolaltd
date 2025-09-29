import { apiClient, ApiResponse } from './api';
import { PaginatedResponse } from '../types/unified-bridge';

// Interface pour les statistiques détaillées d'un utilisateur
export interface UserDetailedStats {
  // Statistiques de base
  toolsCount: number;
  reservationsCount: number;
  rentalsCount: number;
  averageRating: number;
  totalEarnings: number;
  availableBalance: number;
  
  // Détails supplémentaires
  completedBookings: number;
  cancelledBookings: number;
  totalReviews: number;
  lastLoginAt?: string;
}

// Interface pour les transactions détaillées
export interface UserTransaction {
  id: string;
  type: 'DEPOSIT' | 'PAYMENT' | 'REFUND' | 'WITHDRAWAL' | 'FEE';
  amount: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  externalReference?: string;
  paymentMethod?: string;
  bookingId?: string;
  toolTitle?: string;
}

// Interface pour les activités détaillées
export interface UserDetailedActivity {
  id: string;
  type: 'tool_creation' | 'comment' | 'booking_request' | 'favorite';
  createdAt: string;
  
  // Données spécifiques selon le type
  toolData?: {
    title: string;
    status: string;
    moderationStatus: string;
    category: string;
    basePrice: number;
  };
  
  commentData?: {
    content: string;
    rating: number;
    toolTitle: string;
  };
  
  bookingData?: {
    startDate: string;
    endDate: string;
    toolTitle: string;
    ownerName: string;
    totalPrice: number;
  };
  
  favoriteData?: {
    toolTitle: string;
    category: string;
  };
}

class UserStatsService {
  // Récupérer les statistiques détaillées d'un utilisateur
  async getUserDetailedStats(userId: string): Promise<ApiResponse<UserDetailedStats>> {
    return await apiClient.get<UserDetailedStats>(`/users/${userId}/detailed-stats`);
  }

  // Récupérer les transactions détaillées d'un utilisateur
  async getUserDetailedTransactions(
    userId: string, 
    params?: { page?: number; limit?: number; type?: string }
  ): Promise<ApiResponse<PaginatedResponse<UserTransaction>>> {
    return await apiClient.get<PaginatedResponse<UserTransaction>>(
      `/users/${userId}/detailed-transactions`, 
      { params }
    );
  }

  // Récupérer les activités détaillées d'un utilisateur
  async getUserDetailedActivities(
    userId: string, 
    params?: { page?: number; limit?: number; type?: string }
  ): Promise<ApiResponse<PaginatedResponse<UserDetailedActivity>>> {
    return await apiClient.get<PaginatedResponse<UserDetailedActivity>>(
      `/users/${userId}/detailed-activities`, 
      { params }
    );
  }

  // Récupérer le nombre d'annonces d'un utilisateur
  async getUserToolsCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    return await apiClient.get<{ count: number }>(`/users/${userId}/tools/count`);
  }

  // Récupérer le nombre de réservations d'un utilisateur
  async getUserReservationsCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    return await apiClient.get<{ count: number }>(`/users/${userId}/reservations/count`);
  }

  // Récupérer le nombre de locations d'un utilisateur
  async getUserRentalsCount(userId: string): Promise<ApiResponse<{ count: number }>> {
    return await apiClient.get<{ count: number }>(`/users/${userId}/rentals/count`);
  }

  // Récupérer la note moyenne d'un utilisateur
  async getUserAverageRating(userId: string): Promise<ApiResponse<{ rating: number; reviewsCount: number }>> {
    return await apiClient.get<{ rating: number; reviewsCount: number }>(`/users/${userId}/average-rating`);
  }

  // Récupérer les soldes d'un utilisateur
  async getUserBalances(userId: string): Promise<ApiResponse<{ totalEarnings: number; availableBalance: number }>> {
    return await apiClient.get<{ totalEarnings: number; availableBalance: number }>(`/users/${userId}/balances`);
  }
}

export const userStatsService = new UserStatsService();