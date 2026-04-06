import type { AuthUser } from '@/types/auth';

export const PERMISSIONS = {
  // Users
  'users.read': 'users.read',
  'users.write': 'users.write',
  'users.delete': 'users.delete',
  'users.approve': 'users.approve',

  // Roles
  'roles.read': 'roles.read',
  'roles.manage': 'roles.manage',

  // Departments
  'departments.read': 'departments.read',
  'departments.manage': 'departments.manage',

  // Documents
  'documents.read': 'documents.read',
  'documents.write': 'documents.write',
  'documents.delete': 'documents.delete',
  'documents.approve': 'documents.approve',
  'documents.sign': 'documents.sign',
  'documents.sign_request': 'documents.sign_request',

  // Workflows
  'workflows.read': 'workflows.read',
  'workflows.manage': 'workflows.manage',

  // Approvals
  'approvals.read': 'approvals.read',

  // HR
  'hr.staff.read': 'hr.staff.read',
  'hr.staff.write': 'hr.staff.write',
  'hr.leave.read': 'hr.leave.read',
  'hr.leave.write': 'hr.leave.write',
  'hr.leave.approve': 'hr.leave.approve',
  'hr.reports.export': 'hr.reports.export',

  // Analytics
  'analytics.read': 'analytics.read',
  'analytics.export': 'analytics.export',

  // Dashboard
  'view_analytics': 'view_analytics',
  'view_escalations': 'view_escalations',
  'configure_dashboard_cards': 'configure_dashboard_cards',

  // Payments
  'payments.read': 'payments.read',
  'payments.write': 'payments.write',

  // Audit
  'audit.read': 'audit.read',

  // Maker Checker
  'maker_checker.manage': 'maker_checker.manage',

  // System
  'system.settings': 'system.settings',
} as const;

export type PermissionCode = keyof typeof PERMISSIONS;

// Check if a user has a specific permission
// The backend calculates final permissions — we just check the array
export function hasPermission(
  userOrPermissions: AuthUser | string[] | null | undefined,
  permissionCode: string
): boolean {
  if (!userOrPermissions) return false;
  
  // If it's an array, use it directly
  if (Array.isArray(userOrPermissions)) {
    return userOrPermissions.includes(permissionCode);
  }
  
  // If it's a user object, get the permissions array
  return userOrPermissions.permissions?.includes(permissionCode) ?? false;
}

export function canViewRolePermissions(user: AuthUser | null): boolean {
  return hasPermission(user?.permissions ?? [], PERMISSIONS['roles.manage']);
}

export function canManageMakerChecker(user: AuthUser | null): boolean {
  return hasPermission(user?.permissions ?? [], PERMISSIONS['maker_checker.manage']);
}