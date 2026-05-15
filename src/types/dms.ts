export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  parent_dept_id?: string;
  head_of_dept_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// A lightweight user record returned inside department detail
export interface DepartmentUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  is_head?: boolean;
}

// Department with its assigned members (returned by GET /departments/:id)
export interface DepartmentDetail extends Department {
  users?: DepartmentUser[];
}

// Generic wrapper for paginated list responses from the backend
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DepartmentCreatePayload {
  name: string;
  code: string;
  description?: string;
}

export interface DepartmentUpdatePayload {
  name?: string;
  code?: string;
  description?: string;
  head_of_dept_id?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  document_type: string;
  category?: string;
  tags?: string[];
  file_path: string;
  file_url?: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_hash?: string;
  visibility_level: 'public' | 'department' | 'restricted';
  status: 'active' | 'archived' | 'deleted' | 'approved' | 'rejected' | 'in_review' | 'changes_requested' | 'signed';
  version: number;
  /** @deprecated Use department_departments instead. Kept for backward compat; reflects the primary department. */
  department_id?: string;
  /** Populated by GET /documents/:id — all department associations for this document. */
  document_departments?: { id: string; department_id: string; is_primary: boolean; department?: { id: string; name: string } }[];
  owner_id: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  is_encrypted: boolean;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  file_name: string;
  file_size: number;
  change_notes?: string;
  uploaded_by_id: string;
  uploaded_by?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    avatar_url?: string;
  };
  created_at: string;
}

export interface Workflow {
  id: string;
  document_id: string;
  workflow_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  current_step_index: number;
  total_steps: number;
  initiated_by_id: string;
  completed_at?: string;
  steps?: WorkflowStep[];
  document?: { id: string; title: string; file_name: string };
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  approver_role_id: string;
  approver_user_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by_id?: string;
  comments?: string;
  created_at?: string;
  approver_role?: { id: string; name: string; slug: string };
  approver_user?: { id: string; first_name: string; last_name: string } | null;
  workflow?: { id: string; document_id: string; workflow_type: string; total_steps: number; document?: { id: string; title: string; file_name: string } };
}

export interface AISummary {
  summary: string;
  key_points: string[];
  doc_type: string;
  language: string;
}

export interface AIAnalysis {
  insights: string;
  themes: string[];
  entities: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  action_items: string[];
}

export interface DocumentUpdatePayload {
  title?: string;
  description?: string;
  visibility_level?: 'public' | 'department' | 'restricted';
  status?: 'active' | 'archived';
  category?: string;
  document_type?: string;
  /** Full replacement set of department IDs. First entry (or primary_department_id) becomes is_primary. */
  department_ids?: string[];
  primary_department_id?: string;
}

// ─── Excel / Spreadsheet Chart Types ────────────────────────────────────────

export type ColumnKind = 'numeric' | 'categorical';

export interface ColumnMeta {
  name: string;
  kind: ColumnKind;
}

export interface SheetData {
  name: string;
  columns: ColumnMeta[];
  rows: (string | number | null)[][];
}

export interface SpreadsheetData {
  sheets: SheetData[];
}

export interface ComparisonSeries {
  document_id: string;
  title: string;
  file_name: string;
  rows: (string | number | null)[][];
}

export interface ComparisonData {
  shared_columns: ColumnMeta[];
  series: ComparisonSeries[];
}
