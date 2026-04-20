// Role slugs - maps to the 3 fixed roles on the platform
export type RoleSlug = 'super_admin' | 'admin' | 'user';

// Actions that can be attached to a permission
export type PermissionAction =
  | 'read'
  | 'create'
  | 'write'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'manage'
  | 'export'
  | 'sign'
  | 'request'
  | 'view'
  | 'view_all';

export interface Permission {
  id: number | string;
  resource: string; // e.g. 'documents', 'users', 'hr.staff'
  action: PermissionAction;
  description?: string;
}

export interface Role {
  id: number | string;
  name: string;
  slug: RoleSlug;
  description?: string;
  permissions: Permission[];
  createdAt?: string;
  updatedAt?: string;
}

// Per-user permission override - can grant or revoke regardless of role
export interface UserPermissionOverride {
  id: number | string;
  userId: number | string;
  permission: Permission;
  granted: boolean; // true = grant, false = revoke
  grantedBy?: number | string;
  grantedAt?: string;
  reason?: string;
}

// Department membership for a user
export interface UserDepartment {
  id: number | string;
  name: string;
  code?: string;
  roleInDepartment?: string;
  isHead?: boolean;
}

// Defines which actions on which resources require maker-checker approval
export interface MakerCheckerRule {
  id: number | string;
  name: string;
  resource: string;
  action: PermissionAction;
  requiredApprovals: number;
  approverSlug: RoleSlug;
  isActive: boolean;
}

export type MakerCheckerStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// A pending action waiting for checker approval before it is executed
export interface MakerCheckerRequest {
  id: number | string;
  ruleId: number | string;
  resource: string;
  action: PermissionAction;
  payload: Record<string, unknown>;
  status: MakerCheckerStatus;
  requestedBy: number | string;
  requestedAt: string;
  resolvedAt?: string;
  approvals: MakerCheckerApproval[];
  notes?: string;
}

// Individual approval/rejection record for a maker-checker request
export interface MakerCheckerApproval {
  id: number | string;
  requestId: number | string;
  approverId: number | string;
  decision: 'approved' | 'rejected';
  decidedAt: string;
  comment?: string;
}

// Payload used when reassigning a user's role
export interface UpdateUserRolePayload {
  userId: number | string;
  roleSlug: RoleSlug;
  reason?: string;
}
