import type { ReactNode } from 'react';
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
}: ProtectedRouteProps) {
  // TODO: Re-enable auth checks once backend auth is working
  // See Issue #23 for full implementation
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