import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Blog from "./pages/admin/Blog";
import AdminNotificationsPage from "./pages/AdminNotificationsPage";
import Listings from "./pages/admin/Listings";
import Bookings from "./pages/admin/Bookings";
import Disputes from "./pages/admin/Disputes";
import Contacts from "./pages/admin/Contacts";
import Withdrawals from "./pages/admin/Withdrawals";
import AdminLogin from "./pages/admin/Login";
import Profile from "./pages/admin/Profile";
import Analytics from "./pages/admin/Analytics";
import Transactions from "./pages/admin/Transactions";
import Settings from "./pages/admin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route 
                path="users" 
                element={
                  <ProtectedRoute requiredPermission="manage_users">
                    <Users />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="listings" 
                element={
                  <ProtectedRoute requiredPermission="manage_tools">
                    <Listings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="bookings" 
                element={
                  <ProtectedRoute requiredPermission="manage_bookings">
                    <Bookings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="disputes" 
                element={
                  <ProtectedRoute requiredPermission="manage_disputes">
                    <Disputes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="blog" 
                element={
                  <ProtectedRoute requiredPermission="manage_content">
                    <Blog />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute requiredPermission="view_analytics">
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="transactions"
                element={
                  <ProtectedRoute requiredPermission="manage_transactions">
                    <Transactions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute requiredPermission="manage_settings">
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="contacts" 
                element={
                  <ProtectedRoute requiredPermission="manage_support">
                    <Contacts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="withdrawals" 
                element={
                  <ProtectedRoute requiredPermission="manage_transactions">
                    <Withdrawals />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="notifications" 
                element={
                  <ProtectedRoute requiredPermission="manage_notifications">
                    <AdminNotificationsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
