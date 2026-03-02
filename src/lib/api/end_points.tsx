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
  DOCUMENT_VERSIONS: "documents/:id/versions",
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
