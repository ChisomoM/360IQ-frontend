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
  // TEMPORARILY DISABLED AUTHENTICATION - For Development Only
  // TODO: Re-enable authentication checks before production
  
  // Simply return children without any authentication checks
  return <>{children}</>;
}
