export const API: Record<string, string> = {
  // ADMIN END-POINT
  ADMIN_LOGIN: "auth/login",
  // MERCHANT END-POINTS
  LOGIN: "auth/login",
  REGISTER: "auth/register",
  REFRESH_TOKEN: "auth/refresh-token",
  ME: "auth/me",
  MY_PERMISSIONS: "me/permissions",
  TENANT_CONFIG: "tenant/config",

  // Roles & Permissions
  ROLES: "admin/roles",
  LIST_PERMISSIONS: "admin/permissions",
  ADMIN_ROLES: "admin/roles",
  ADMIN_PERMISSIONS: "admin/permissions",
  ADMIN_ROLE_PERMISSIONS: "admin/roles/:slug/permissions",
  ADMIN_ROLE_PERMISSION_GRANT: "admin/roles/:slug/permissions/:permissionId",
  ADMIN_ROLE_PERMISSION_REVOKE: "admin/roles/:slug/permissions/:permissionId",

  // RBAC — Roles, Maker Checker & User Management
  MAKER_CHECKER_RULES: "admin/maker-checker/rules",
  MAKER_CHECKER_RULE_DETAIL: "admin/maker-checker/rules/:ruleId",
  MAKER_CHECKER_RULE_TOGGLE: "admin/maker-checker/rules/:ruleId/toggle",
  MAKER_CHECKER_ACTION_CODES: "admin/maker-checker/action-codes",
  MAKER_CHECKER_REQUESTS: "maker-checker/requests",
  MAKER_CHECKER_APPROVE: "maker-checker/requests/:id/approve",
  MAKER_CHECKER_REJECT: "maker-checker/requests/:id/reject",
  USER_DETAIL: "users/:id",
  USER_PERMISSIONS: "admin/users/:userId/overrides",
  USER_PERMISSIONS_RESOLVED: "admin/users/:userId/permissions/resolved",
  USER_ROLE: "users/:id/role",

  // DMS — Departments
  DEPARTMENTS: "departments",
  DEPARTMENT_DETAIL: "departments/:id",
  DEPARTMENT_UPDATE: "departments/:id",
  DEPARTMENT_DELETE: "departments/:id",
  DEPARTMENT_USERS: "departments/:id/users",
  DOCUMENTS: "documents",
  DOCUMENT_DETAIL: "documents/:id",
  DOCUMENT_UPDATE: "documents/:id",
  DOCUMENT_DELETE: "documents/:id",
  DOCUMENT_VERSIONS: "documents/:id/versions",
  DOCUMENT_DOWNLOAD: "documents/:id/download",
  DOCUMENT_ACCESS_LOGS: "documents/:id/access-logs",
  DOCUMENT_SUMMARIZE: "documents/:id/summarize",
  DOCUMENT_ANALYZE: "documents/:id/analyze",
  DOCUMENT_CHART_DATA: "documents/:id/chart-data",
  DOCUMENT_COMPARE: "documents/compare",
  DOCUMENT_SEARCH: "chat/search",
  DOCUMENT_PREDICTIVE_ANALYSIS: "ai/predictive-analysis",
  AI_CHAT: "ai/chat",
  WORKFLOWS: "workflows",
  WORKFLOW_DETAIL: "workflows/:id",
  WORKFLOW_STEP_APPROVE: "workflows/steps/:id/approve",
  WORKFLOW_STEP_REJECT: "workflows/steps/:id/reject",
  PENDING_APPROVALS: "workflows/pending",
  USERS: "users",

  // HR Module
  HR_STAFF: "hr/staff",
  HR_STAFF_DETAIL: "hr/staff/:id",
  HR_ME: "hr/me",
  HR_LEAVE: "hr/leave",
  HR_LEAVE_DETAIL: "hr/leave/:id",
  HR_LEAVE_APPROVE: "hr/leave/:id/approve",
  HR_LEAVE_REJECT: "hr/leave/:id/reject",
  HR_LEAVE_CANCEL: "hr/leave/:id/cancel",
  HR_ANALYTICS: "hr/analytics",
  // Staff Applications
  HR_APPLICATIONS: "hr/applications",
  HR_APPLICATION_DETAIL: "hr/applications/:id",
  HR_APPLICATION_APPROVE: "hr/applications/:id/approve",
  HR_APPLICATION_REJECT: "hr/applications/:id/reject",
  HR_APPLICATION_SUBMIT: "hr/applications",
  HR_USERS_SEARCH: "hr/users/search",

  // Audit
  AUDIT_LOGS: "audit",

  // Signatures
  SIGNATURE_REQUEST: "signatures/request",
  SIGNATURE_MY: "signatures/my",
  SIGNATURE_SIGN: "signatures/:id/sign",
  SIGNATURE_DECLINE: "signatures/:id/decline",
  SIGNATURE_DOCUMENT: "signatures/document/:docId",

  // Dashboard
  DASHBOARD_CARDS: "dashboard/cards",
  DASHBOARD_ESCALATIONS: "dashboard/escalations",
  DASHBOARD_CARD_CONFIG: "dashboard/config",
  DASHBOARD_UPDATE_CONFIG: "dashboard/cards/config",
  DASHBOARD_CARD_DEFINITIONS: "dashboard/cards/definitions",


  // ControlHub — Platform admin endpoints (meta-DB, no tenant scoping)
  CH_LOGIN: "controlhub/auth/login",
  CH_CLIENTS: "controlhub/clients",
  CH_CLIENT_DETAIL: "controlhub/clients/:id",
  CH_CLIENT_ADMINS: "controlhub/clients/:id/admins",
  CH_CLIENT_ONBOARD: "controlhub/clients/onboard",
  CH_CLIENT_BRANDING: "controlhub/clients/:id/branding",
  CH_CLIENT_BRANDING_LOGO: "controlhub/clients/:id/branding/logo",
  CH_CLIENT_SETTINGS: "controlhub/clients/:id/settings",
};

export const getRoute = (val: string): string => {
  const uri: string | undefined | null = API[val];
  if (uri === null || uri === undefined) {
    throw new Error("key doesn't exist");
  }
  return uri;
};

export const pipe = (pattern: string, map: Record<string, string | number>) => {
  return pattern.replace(/:([^/]+)/g, (_, key: string): string => {
    if (key in map) {
      return String(map[key]);
    }
    throw new Error(`Key "${key}" not found in the map`);
  });
};
