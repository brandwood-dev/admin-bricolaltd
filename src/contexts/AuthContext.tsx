import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authService, AdminUser, LoginCredentials } from '../services/authService';
import { useToast } from '../hooks/use-toast';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔐 [AuthContext] Initializing auth...');
      try {
        const token = authService.getToken();
        const currentUser = authService.getCurrentUser();
        console.log('🔐 [AuthContext] Token exists:', !!token);
        console.log('🔐 [AuthContext] Current user from storage:', currentUser);
        
        if (token && currentUser) {
          console.log('🔐 [AuthContext] Verifying token with server...');
          // Verify token is still valid by fetching profile
          const response = await authService.getProfile();
          console.log('🔐 [AuthContext] Profile response:', response);
          if (response.success && response.data) {
            console.log('🔐 [AuthContext] Setting user:', response.data);
            setUser(response.data);
          } else {
            console.log('🔐 [AuthContext] Token invalid, logging out');
            // Token is invalid, clear auth data
            await logout();
          }
        } else {
          console.log('🔐 [AuthContext] No token or user found');
        }
      } catch (error) {
        console.error('🔐 [AuthContext] Auth initialization error:', error);
        await logout();
      } finally {
        console.log('🔐 [AuthContext] Auth initialization complete');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        await logout();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (assuming 15min token expiry)

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        toast({
          title: "Connexion réussie",
          description: "Bienvenue dans l'interface d'administration.",
        });
        return true;
      } else {
        toast({
          title: "Erreur de connexion",
          description: response.message || "Email ou mot de passe incorrect",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erreur de connexion",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès.",
      });
    }
  };

  const refreshToken = useCallback(async () => {
    try {
      const response = await authService.refreshToken();
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  // Auto-refresh token every 14 minutes
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          // Don't logout on auto-refresh failure, let user continue
        }
      }, 14 * 60 * 1000); // 14 minutes

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, refreshToken]);

  const hasPermission = (permission: string): boolean => {
    return authService.hasPermission(permission);
  };

  const hasRole = (role: string): boolean => {
    return authService.hasRole(role);
  };

  // Debug logs for auth state changes
  useEffect(() => {
    console.log('🔐 [AuthContext] Auth state changed:');
    console.log('  - user:', user);
    console.log('  - isAuthenticated:', !!user);
    console.log('  - isLoading:', isLoading);
  }, [user, isLoading]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};