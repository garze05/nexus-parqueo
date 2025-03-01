import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { user, loading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show loading state while checking authentication
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check if the user needs to change password
  // Ensure it's checking the latest user object's passwordChangeRequired state
  if (user.passwordChangeRequired) {
    // Redirect to change password page unless they're already there
    if (location.pathname !== '/force-change-password') {
      return <Navigate to="/force-change-password" replace />;
    }
  }

  // Check permission if specified
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check role if specified
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Return children if they exist, otherwise render Outlet for nested routes
  return children ? children : <Outlet />;
};