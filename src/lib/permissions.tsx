import { type UserRole, USER_ROLES } from './constants';
import { type AuthUser } from '@/types/auth';

export const PERMISSIONS = {
  // Member Management
  VIEW_ALL_MEMBERS: 'view_all_members',
  VIEW_REGION_MEMBERS: 'view_region_members',
  APPROVE_MEMBERS_BATCH: 'approve_members_batch', // > 10
  APPROVE_MEMBERS_SINGLE: 'approve_members_single', // 1-10
  DELETE_MEMBER: 'delete_member',
  EDIT_MEMBER: 'edit_member',
  
  // Financial
  VIEW_ALL_FINANCIALS: 'view_all_financials',
  PROCESS_PAYMENT_SMALL: 'process_payment_small', // < K3000
  PROCESS_PAYMENT_LARGE: 'process_payment_large', // > K3000
  APPROVE_PAYOUTS: 'approve_payouts',
  
  // System
  MANAGE_USERS: 'manage_users',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  SYSTEM_SETTINGS: 'system_settings',
  
  // Communications
  SEND_SMS_ALL: 'send_sms_all',
  SEND_SMS_REGION: 'send_sms_region',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_ENROLLMENT_ANALYTICS: 'view_enrollment_analytics',
  VIEW_APPLICATION_ANALYTICS: 'view_application_analytics',
  VIEW_PROGRAM_ANALYTICS: 'view_program_analytics',
  EXPORT_ANALYTICS_DATA: 'export_analytics_data',

  // HR Module
  HR_STAFF_VIEW: 'hr.staff.view',
  HR_STAFF_MANAGE: 'hr.staff.manage',
  HR_LEAVE_VIEW: 'hr.leave.view',
  HR_LEAVE_MANAGE: 'hr.leave.manage',
  HR_LEAVE_REQUEST: 'hr.leave.request',
  HR_ANALYTICS_VIEW: 'hr.analytics.view',
  HR_REPORTS_EXPORT: 'hr.reports.export',
  HR_APPLICATIONS_VIEW: 'hr.applications.view',
  HR_APPLICATIONS_MANAGE: 'hr.applications.manage',

  // E-Signature
  SIGN_DOCUMENTS: 'sign_documents',
  REQUEST_SIGNATURE: 'request_signature',

  // Departments
  VIEW_DEPARTMENTS: 'view_departments',
  MANAGE_DEPARTMENTS: 'manage_departments',
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [USER_ROLES.SUPER_ADMIN]: [
    PERMISSIONS.VIEW_ALL_MEMBERS,
    PERMISSIONS.APPROVE_MEMBERS_SINGLE,
    PERMISSIONS.PROCESS_PAYMENT_SMALL,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SEND_SMS_ALL,
    PERMISSIONS.VIEW_ALL_FINANCIALS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ENROLLMENT_ANALYTICS,
    PERMISSIONS.VIEW_APPLICATION_ANALYTICS,
    PERMISSIONS.VIEW_PROGRAM_ANALYTICS,
    PERMISSIONS.EXPORT_ANALYTICS_DATA,
    PERMISSIONS.VIEW_DEPARTMENTS,
    PERMISSIONS.MANAGE_DEPARTMENTS,
  ],
  [USER_ROLES.RECORDS_AUTHORITY]: [
    PERMISSIONS.VIEW_ALL_MEMBERS,
    PERMISSIONS.APPROVE_MEMBERS_SINGLE,
    PERMISSIONS.APPROVE_MEMBERS_BATCH,
    PERMISSIONS.PROCESS_PAYMENT_SMALL,
    PERMISSIONS.PROCESS_PAYMENT_LARGE,
    PERMISSIONS.APPROVE_PAYOUTS,
    PERMISSIONS.VIEW_ALL_FINANCIALS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.SEND_SMS_ALL,
    PERMISSIONS.EDIT_MEMBER,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_DEPARTMENTS,
    PERMISSIONS.MANAGE_DEPARTMENTS,
  ],
  [USER_ROLES.DEPT_HEAD]: [
    PERMISSIONS.VIEW_REGION_MEMBERS,
    PERMISSIONS.EDIT_MEMBER,
    PERMISSIONS.SEND_SMS_REGION,
  ],
  [USER_ROLES.HR_OFFICER]: [
    PERMISSIONS.HR_STAFF_VIEW,
    PERMISSIONS.HR_STAFF_MANAGE,
    PERMISSIONS.HR_LEAVE_VIEW,
    PERMISSIONS.HR_LEAVE_MANAGE,
    PERMISSIONS.HR_ANALYTICS_VIEW,
    PERMISSIONS.HR_REPORTS_EXPORT,
    PERMISSIONS.HR_APPLICATIONS_VIEW,
    PERMISSIONS.HR_APPLICATIONS_MANAGE,
  ],
  [USER_ROLES.FINANCE_OFFICER]: [
    PERMISSIONS.VIEW_ALL_FINANCIALS,
    PERMISSIONS.PROCESS_PAYMENT_SMALL,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  [USER_ROLES.AUDITOR]: [
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_ALL_FINANCIALS,
  ],
  [USER_ROLES.STAFF_MEMBER]: [
    PERMISSIONS.VIEW_ALL_MEMBERS,
    PERMISSIONS.HR_LEAVE_REQUEST,
  ],
  [USER_ROLES.TEACHER]: [],
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.VIEW_ALL_MEMBERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_DEPARTMENTS,
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.VIEW_ALL_MEMBERS,
  ],
};

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  // Temporary bypass for department testing so the user can see features regardless of role
  /* 
  if (permission === PERMISSIONS.MANAGE_DEPARTMENTS || permission === PERMISSIONS.VIEW_DEPARTMENTS) {
    return true;
  }
  */

  if (!user || !user.role) return false;
  
  // Check if user has specific permission overrides
  if (user.permissions?.includes(permission)) return true;
  
  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role as UserRole];
  return rolePermissions?.includes(permission) || false;
}

export function canViewRegion(user: AuthUser | null, region: string): boolean {
  if (!user) return false;
  if (hasPermission(user, PERMISSIONS.VIEW_ALL_MEMBERS)) return true;
  
  return user.assignedRegions?.includes(region) || false;
}
