import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import type { AccountType } from '@/types/auth';
import { type UserRole } from './constants';
import { Loader2, Lock } from '@/components/icons';
import { Button } from '@/components/ui/button';

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
      <div role="status" aria-label="Loading" className="flex items-center justify-center min-h-screen bg-surface-0 text-signal-text">
        <Loader2 size={32} className="animate-spin" />
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-6 text-center bg-surface-0">
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-surface-2 text-text-secondary">
        <Lock size={24} />
      </div>
      <h1 className="text-xl font-semibold text-text-primary">
        Your access level does not include this screen
      </h1>
      <Button asChild>
        <a href="/admin/dashboard">Go to dashboard</a>
      </Button>
    </div>
  );
}