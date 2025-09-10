import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/admin/login'
}) => {
  const { isAuthenticated, isLoading, hasPermission, hasRole, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check if user is active
  if (user && !user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-destructive mb-4">Compte désactivé</h2>
          <p className="text-muted-foreground mb-4">
            Votre compte administrateur a été désactivé. Veuillez contacter un super administrateur.
          </p>
        </div>
      </div>
    );
  }

  // Check required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-destructive mb-4">Accès refusé</h2>
          <p className="text-muted-foreground mb-4">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <p className="text-sm text-muted-foreground">
            Permission requise: <code className="bg-muted px-2 py-1 rounded">{requiredPermission}</code>
          </p>
        </div>
      </div>
    );
  }

  // Check required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-destructive mb-4">Accès refusé</h2>
          <p className="text-muted-foreground mb-4">
            Votre rôle ne vous permet pas d'accéder à cette page.
          </p>
          <p className="text-sm text-muted-foreground">
            Rôle requis: <code className="bg-muted px-2 py-1 rounded">{requiredRole}</code>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;