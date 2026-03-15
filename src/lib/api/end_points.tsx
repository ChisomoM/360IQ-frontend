export const API: Record<string, string> = {
  // ADMIN END-POINT
  ADMIN_LOGIN: "auth/login",
  // MERCHANT END-POINTS
  LOGIN: "auth/login",
  REGISTER: "auth/register",
  REFRESH_TOKEN: "auth/refresh-token",
  ME: "auth/me",

  // UNIDIS DMS Endpoints
  DEPARTMENTS: "departments",
  DOCUMENTS: "documents",
  DOCUMENT_DETAIL: "documents/:id",
  DOCUMENT_UPDATE: "documents/:id",
  DOCUMENT_DELETE: "documents/:id",
  DOCUMENT_VERSIONS: "documents/:id/versions",
  DOCUMENT_SUMMARIZE: "documents/:id/summarize",
  DOCUMENT_ANALYZE: "documents/:id/analyze",
  DOCUMENT_CHART_DATA: "documents/:id/chart-data",
  WORKFLOWS: "workflows",
  WORKFLOW_DETAIL: "workflows/:id",
  WORKFLOW_STEP_APPROVE: "workflows/steps/:id/approve",
  WORKFLOW_STEP_REJECT: "workflows/steps/:id/reject",
  PENDING_APPROVALS: "workflows/pending",
  USERS: "users",
  
  // Student & Applications
  STUDENT_APPLY: "students/apply",
  APPLICATIONS: "students/applications",
  MY_APPLICATION: "students/my-application",
  APPLICATION_DETAIL: "students/applications/:id",
  APPLICATION_STATUS: "students/applications/:id/status",
  APPLICATION_APPROVE: "students/applications/:id/approve",
  STUDENTS: "students",
  STUDENT_DETAIL: "students/:id",

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

  // Audit
  AUDIT_LOGS: "audit",
  
  // Payments
  PAYMENTS: "payments",
  PAYMENT_VERIFY: "payments/:id/verify",
  PAYMENT_REJECT: "payments/:id/reject",
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
