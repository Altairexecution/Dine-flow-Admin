import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ToastProvider } from './context/ToastContext';
import { AdminRoutes } from './routes/AdminRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AdminAuthProvider>
          <AdminRoutes />
        </AdminAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};
