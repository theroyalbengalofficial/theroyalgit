import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-2 border-[#F25C05] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-light">
          Verifying Royal Bengal Clearance...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthorized user to /admin/login while preserving intended target location
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
