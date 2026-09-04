import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AdminLoginPage } from '../features/auth/AdminLoginPage';
import { AdminDashboardOverviewPage } from '../features/dashboard/AdminDashboardOverviewPage';
import { RestaurantsListPage } from '../features/restaurants/RestaurantsListPage';
import { RestaurantDetailPage } from '../features/restaurants/RestaurantDetailPage';
import { UsersListPage } from '../features/users/UsersListPage';
import { AdminAutomationPage } from '../features/automation/AdminAutomationPage';
import { AdminSettingsPage } from '../features/settings/AdminSettingsPage';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Authenticating Control Plane...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />

      <Route
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<AdminDashboardOverviewPage />} />
        <Route path="/restaurants" element={<RestaurantsListPage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
        <Route path="/users" element={<UsersListPage />} />
        <Route path="/automation" element={<AdminAutomationPage />} />
        <Route path="/settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
