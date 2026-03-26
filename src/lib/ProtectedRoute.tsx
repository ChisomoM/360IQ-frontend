import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import type { AccountType } from '@/types/auth';
import { type UserRole } from './constants';
import { hasPermission } from './permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredAccountType?: AccountType | AccountType[]; // Legacy
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredAccountType,
  requiredRole,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return fallback || <Navigate to="/login" replace />;
  }

  // Check required role
  if (requiredRole && user.role) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return fallback || <div>Access Denied: Insufficient Role</div>;
    }
  }

  // Check required permission
  if (requiredPermission) {
    if (!hasPermission(user, requiredPermission)) {
      return fallback || <div>Access Denied: Insufficient Permissions</div>;
    }
  }

  // Legacy account type check (if needed)
  if (requiredAccountType && user.accountType) {
    const accountTypes = Array.isArray(requiredAccountType) ? requiredAccountType : [requiredAccountType];
    if (!accountTypes.includes(user.accountType)) {
      return fallback || <div>Access Denied: Invalid Account Type</div>;
    }
  }

  return <>{children}</>;
}
