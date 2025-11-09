import { useState } from "react";
import { AdminNotificationBadge } from "../notifications/AdminNotificationBadge";
import { Outlet, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Mail, 
  CreditCard,
  LogOut,
  Menu,
  X,
  Bell,
  Shield,
  Settings,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  const handleProfileClick = () => {
    navigate('/admin/profile');
  };

  return (
    <div className="min-h-screen bg-admin-bg flex flex-col">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-admin-border p-3 sm:p-4 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleProfileClick}
            title="Profil Admin"
          >
            <UserCircle className="h-5 w-5" />
          </Button>
          <AdminNotificationBadge size="sm" />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-admin-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <AdminSidebar onItemClick={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Desktop header with notifications */}
          <div className="hidden lg:block bg-white border-b border-admin-border p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {/* Section vide à gauche */}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Bienvenue Administrateur</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleProfileClick}
                    title="Profil Admin"
                  >
                    <UserCircle className="h-4 w-4" />
                  </Button>
                </div>
                <AdminNotificationBadge size="sm" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Page content */}
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <Outlet />
          </main>
          
          {/* Footer */}
          <footer className="bg-white border-t border-admin-border mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Brand */}
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <h3 className="font-semibold text-lg text-primary">Admin Bricola LTD</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md">
                    Panneau d'administration sécurisé pour la gestion de la plateforme Bricola LTD.
                    Accès réservé aux administrateurs autorisés.
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Connexion sécurisée SSL</span>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Accès rapide</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><a href="/admin" className="hover:text-primary transition-colors">Dashboard</a></li>
                    <li><a href="/admin/users" className="hover:text-primary transition-colors">Utilisateurs</a></li>
                    <li><a href="/admin/bookings" className="hover:text-primary transition-colors">Réservations</a></li>
                    <li><a href="/admin/disputes" className="hover:text-primary transition-colors">Litiges</a></li>
                  </ul>
                </div>

                {/* System Info */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Système</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <Settings className="h-3 w-3" />
                      <span>Version 1.0.0</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Mail className="h-3 w-3" />
                      <span>admin@bricolaltd.com</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-success rounded-full"></div>
                      <span>Système opérationnel</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-admin-border pt-4 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center text-center text-sm text-muted-foreground space-y-2 sm:space-y-0">
                  <p>&copy; 2025 Bricola LTD. Tous droits réservés.</p>
                  <div className="flex items-center space-x-4">
                    <span>
                      Dernière connexion: {
                        user?.lastLoginAt  // Changé de lastLogin à lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : new Date().toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                      }
                    </span>
                    <span className="text-xs px-2 py-1 bg-success-light text-success rounded-full">
                      Admin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;