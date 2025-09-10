import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Re-export the useAuth hook for convenience
export const useAuth = useAuthContext;

// Additional auth-related hooks can be added here
export const usePermissions = () => {
  const { hasPermission, hasRole, user } = useAuthContext();
  
  return {
    hasPermission,
    hasRole,
    isSuperAdmin: hasRole('super_admin'),
    isAdmin: hasRole('admin'),
    isModerator: hasRole('moderator'),
    canManageUsers: hasPermission('manage_users'),
    canManageTools: hasPermission('manage_tools'),
    canManageBookings: hasPermission('manage_bookings'),
    canManageDisputes: hasPermission('manage_disputes'),
    canManageTransactions: hasPermission('manage_transactions'),
    canViewAnalytics: hasPermission('view_analytics'),
    userRole: user?.role,
    userPermissions: user?.permissions || [],
  };
};