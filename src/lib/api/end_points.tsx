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
  DEPARTMENT_STATISTICS: "departments/:id/statistics",
  DEPARTMENT_DOCUMENTS: "departments/:id/documents",
  DEPARTMENT_USER_HEAD: "departments/:id/users/:userId/head",
  DEPARTMENT_USER_PERMISSIONS: "departments/:id/users/:userId/permissions",
  DEPARTMENT_USER_REMOVE: "departments/:id/users/:userId",
  DEPARTMENT_USERS_SEARCH: "departments/users/search",
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
  WORKFLOW_STEP_REQUEST_CHANGES: "workflows/steps/:id/request-changes",
  PENDING_APPROVALS: "workflows/pending",
  DOCUMENT_WORKFLOWS: "documents/:id/workflows",
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
  USER_SIGNATURE_LIST: "me/signatures",
  USER_SIGNATURE_SAVE: "me/signatures",
  USER_SIGNATURE_SET_DEFAULT: "me/signatures/:id/default",
  USER_SIGNATURE_DELETE: "me/signatures/:id",

  // Dashboard
  DASHBOARD_CARDS: "dashboard/cards",
  DASHBOARD_ESCALATIONS: "dashboard/escalations",
  DASHBOARD_CARD_CONFIG: "dashboard/config",
  DASHBOARD_UPDATE_CONFIG: "dashboard/cards/config",
  DASHBOARD_CARD_DEFINITIONS: "dashboard/cards/definitions",


  // Onboarding
  ONBOARDING_STATUS: "onboarding/status",
  ONBOARDING_UPDATE: "onboarding/details",
  ONBOARDING_SUBMIT: "onboarding/submit",
  ONBOARDING_DOCUMENTS: "onboarding/documents",
  ONBOARDING_TIMELINE: "onboarding/timeline",
  ONBOARDING_DOWNLOAD: "onboarding/documents/download",
  ONBOARDING_PREVIEW: "onboarding/invitations/preview",
  ONBOARDING_CLAIM: "onboarding/invitations/claim",

  // ControlHub Admin Onboarding
  CH_ONBOARDING: "controlhub/admin/onboarding",
  CH_ONBOARDING_INITIATE: "controlhub/admin/onboarding/initiate",
  CH_ONBOARDING_EXPORT: "controlhub/admin/onboarding/export",
  CH_ONBOARDING_DOWNLOAD: "controlhub/admin/onboarding/documents/download",
  CH_ONBOARDING_DETAIL: "controlhub/admin/onboarding/:id",
  CH_ONBOARDING_TIMELINE: "controlhub/admin/onboarding/:id/timeline",
  CH_ONBOARDING_TRANSITION: "controlhub/admin/onboarding/:id/transition",
  CH_ONBOARDING_VERIFY_DOC: "controlhub/admin/onboarding/documents/:id/verify",
  CH_ONBOARDING_RESEND: "controlhub/admin/onboarding/:id/resend-invitation",

  // ControlHub — Platform admin endpoints (meta-DB, no tenant scoping)
  CH_LOGIN: "controlhub/auth/login",
  CH_CLIENTS: "controlhub/clients",
  CH_CLIENT_DETAIL: "controlhub/clients/:id",
  CH_CLIENT_ADMINS: "controlhub/clients/:id/admins",
  CH_CLIENT_ONBOARD: "controlhub/clients/onboard",
  CH_CLIENT_BRANDING: "controlhub/clients/:id/branding",
  CH_CLIENT_BRANDING_LOGO: "controlhub/clients/:id/branding/logo",
  CH_CLIENT_SETTINGS: "controlhub/clients/:id/settings",

  // CRM Accounts, Contacts, and Business Units
  ACCOUNTS: "accounts",
  ACCOUNT_DETAIL: "accounts/:id",
  ACCOUNT_CONTACTS: "accounts/:id/contacts",
  CONTACT_DETAIL: "contacts/:id",
  ACCOUNT_BUSINESS_UNITS: "accounts/:id/business-units",
  BUSINESS_UNIT_DETAIL: "business-units/:id",

  // ProfileIQ: people and company profiles
  PROFILES_META: "profiles/meta",
  PROFILES_PEOPLE: "profiles/people",
  PROFILES_PEOPLE_CHECK: "profiles/people/check-duplicates",
  PROFILES_PERSON: "profiles/people/:id",
  PROFILES_PERSON_TIMELINE: "profiles/people/:id/timeline",
  PROFILES_PERSON_LINKS: "profiles/people/:id/links",
  PROFILES_PERSON_JOB_CHANGE: "profiles/people/:id/job-change",
  PROFILES_LINK: "profiles/links/:id",
  PROFILES_FIELD_CONFIRM: "profiles/fields/:id/confirm",
  PROFILES_COMPANIES: "profiles/companies",
  PROFILES_COMPANIES_CHECK: "profiles/companies/check-duplicates",
  PROFILES_COMPANY: "profiles/companies/:id",
  PROFILES_COMPANY_PEOPLE: "profiles/companies/:id/people",
  PROFILES_COMPANY_TIMELINE: "profiles/companies/:id/timeline",
  PROFILES_COMPANY_DEALS: "profiles/companies/:id/deals",
  PROFILES_COMPANY_CONTRACTS: "profiles/companies/:id/contracts",
  PROFILES_COMPANY_DOCUMENTS: "profiles/companies/:id/documents",
  PROFILES_COMPANY_DOCUMENT: "profiles/companies/:id/documents/:doc_id",
  PROFILES_MERGES: "profiles/merges",
  PROFILES_MERGE_UNDO: "profiles/merges/:id/undo",
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
