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
  status: 'active' | 'archived' | 'deleted' | 'approved' | 'rejected';
  version: number;
  department_id?: string;
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
