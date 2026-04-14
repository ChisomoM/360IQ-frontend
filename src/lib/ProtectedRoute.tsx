import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import type { AccountType } from '@/types/auth';
import { type UserRole } from './constants';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAccountType?: AccountType | AccountType[];
  requiredSlug?: UserRole | UserRole[];
  requiredPermission?: string;
}

export function ProtectedRoute({
  children,
  requiredAccountType,
  requiredSlug,
  requiredPermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    // For ControlHub routes, redirect to ControlHub login
    if (location.pathname.startsWith('/controlhub')) {
      return <Navigate to="/controlhub/login" state={{ from: location }} replace />;
    }
    // For regular routes, redirect to regular login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check required account type
  if (requiredAccountType) {
    const allowedTypes = Array.isArray(requiredAccountType) ? requiredAccountType : [requiredAccountType];
    if (!allowedTypes.includes(user.accountType as AccountType)) {
      return <PermissionDenied />;
    }
  }

  // Check required role slug (RBAC)
  if (requiredSlug) {
    const allowedSlugs = Array.isArray(requiredSlug) ? requiredSlug : [requiredSlug];
    const userRole = user.roleSlug || user.role;
    if (!userRole || !allowedSlugs.includes(userRole as UserRole)) {
      return <PermissionDenied />;
    }
  }

  // Check required permission
  if (requiredPermission) {
    const userPermissions = user.permissions || [];
    if (!userPermissions.includes(requiredPermission)) {
      return <PermissionDenied />;
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}

export function PermissionDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-2xl font-semibold text-gray-800">
        You do not have the right permissions to view this screen
      </h1>
      <a href="/admin/dashboard" className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">
        Back to Dashboard
      </a>
    </div>
  );
}