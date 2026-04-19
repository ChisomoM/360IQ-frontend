import type { AuthUser } from '@/types/auth';

export const PERMISSIONS = {
  // Roles Management
  'roles.read': 'roles.read',
  'roles.update': 'roles.update',
  'roles.manage': 'roles.manage',

  // Permissions Management
  'permissions.read': 'permissions.read',
  'permissions.create': 'permissions.create',

  // Users Management
  'users.read': 'users.read',
  'users.create': 'users.create',
  'users.update': 'users.update',
  'users.delete': 'users.delete',
  'users.write': 'users.write',

  // Documents Management
  'documents.read': 'documents.read',
  'documents.create': 'documents.create',
  'documents.update': 'documents.update',
  'documents.delete': 'documents.delete',
  'documents.approve': 'documents.approve',
  'documents.sign': 'documents.sign',
  'documents.export': 'documents.export',
  'documents.write': 'documents.write',
  'documents.view_all': 'documents.view_all',

  // Departments Management
  'departments.read': 'departments.read',
  'departments.create': 'departments.create',
  'departments.update': 'departments.update',
  'departments.delete': 'departments.delete',
  'departments.manage': 'departments.manage',
  'departments.view_all': 'departments.view_all',

  // Approvals
  'approvals.read': 'approvals.read',
  'approvals.approve': 'approvals.approve',

  // Workflows Management
  'workflows.read': 'workflows.read',
  'workflows.create': 'workflows.create',
  'workflows.approve': 'workflows.approve',

  // Audit Logs
  'audit.read': 'audit.read',
  'audit.write': 'audit.write',

  // Analytics
  'analytics.read': 'analytics.read',
  'analytics.export': 'analytics.export',

  // Dashboard
  'view_analytics': 'view_analytics',
  'view_escalations': 'view_escalations',
  'configure_dashboard_cards': 'configure_dashboard_cards',

  // Maker Checker
  'maker_checker.read': 'maker_checker.read',
  'maker_checker.request': 'maker_checker.request',
  'maker_checker.approve': 'maker_checker.approve',
  'maker_checker.reject': 'maker_checker.reject',
  'maker_checker.manage': 'maker_checker.manage',

  // Finance
  'finance.read': 'finance.read',
  'finance.create': 'finance.create',
  'finance.update': 'finance.update',
  'finance.delete': 'finance.delete',
  'finance.reports.view': 'finance.reports.view',

  // HR Management
  'hr.staff.view': 'hr.staff.view',
  'hr.staff.manage': 'hr.staff.manage',
  'hr.staff.read': 'hr.staff.read',
  'hr.staff.write': 'hr.staff.write',
  'hr.leave.view': 'hr.leave.view',
  'hr.leave.manage': 'hr.leave.manage',
  'hr.leave.request': 'hr.leave.request',
  'hr.leave.read': 'hr.leave.read',
  'hr.leave.write': 'hr.leave.write',
  'hr.leave.approve': 'hr.leave.approve',
  'hr.applications.view': 'hr.applications.view',
  'hr.applications.manage': 'hr.applications.manage',
  'hr.analytics.view': 'hr.analytics.view',
  'hr.reports.export': 'hr.reports.export',

  // System Settings
  'system.settings.update': 'system.settings.update',
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