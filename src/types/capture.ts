// CaptureIQ: getting leads into 360IQ. Mirrors modules/captures in the backend.

import type { MatchResult } from "./profile";

export type CaptureMethod = "FORM" | "CARD" | "VOICE" | "NOTE";
export type CaptureStatus = "PROCESSING" | "NEEDS_REVIEW" | "AI_FAILED" | "CONFIRMED" | "REJECTED";

export interface CaptureFieldSpec {
  Key: string;
  Label: string;
  Entity: "PERSON" | "COMPANY" | "LEAD";
  Repeatable: boolean;
  MaxLen: number;
}

export interface CaptureMeta {
  methods: CaptureMethod[];
  ai_available: boolean;
  files_ready: boolean;
  limits: { image_bytes: number; audio_bytes: number; audio_seconds: number; note_chars: number };
  audio_retention_hours: number;
  uncertain_below: number;
  fields: CaptureFieldSpec[];
  recent_events: string[];
  permissions: { create: boolean; review: boolean; manage: boolean; view_sensitive: boolean };
}

export interface CaptureFieldView {
  id: string;
  key: string;
  label: string;
  entity: string;
  value: string;
  confidence: number;
  uncertain: boolean;
  origin: string;
  at_seconds?: number;
  warning?: string;
  source: "AI";
  existing?: string;
}

export interface TranscriptSegment {
  start: number;
  text: string;
}

export interface DraftField {
  id: string;
  key?: string;
  action: "accept" | "edit" | "reject";
  value?: string;
  overwrite?: boolean;
}

export interface EntityChoice {
  action: "" | "link" | "create" | "skip";
  id?: string;
}

export interface CaptureDraft {
  fields: DraftField[];
  person: EntityChoice;
  company: EntityChoice;
}

export interface ConfirmResult {
  capture_id: string;
  status: string;
  person_id: string | null;
  company_id: string | null;
  person_outcome: "CREATED" | "LINKED" | "SKIPPED";
  company_outcome: "CREATED" | "LINKED" | "SKIPPED";
  saved: number;
  suggested: number;
  signals: number;
  already_confirmed: boolean;
}

export interface CaptureView {
  id: string;
  method: CaptureMethod;
  status: CaptureStatus;
  event_name: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
  mine: boolean;
  masked: boolean;
  ai_status: string;
  ai_error: string;
  ai_attempts: number;
  can_retry: boolean;
  dictated: boolean;
  fields: CaptureFieldView[];
  dropped: number;
  withheld: boolean;
  transcript: TranscriptSegment[];
  text: string;
  has_image: boolean;
  audio_kept: boolean;
  audio_delete_by?: string;
  draft?: CaptureDraft;
  person_match: MatchResult | null;
  company_match: MatchResult | null;
  result?: ConfirmResult;
}

export interface CaptureListItem {
  id: string;
  method: CaptureMethod;
  status: CaptureStatus;
  event_name: string;
  created_at: string;
  created_by_name: string;
  mine: boolean;
  ai_status: string;
  ai_error: string;
  person_name: string;
  company_name: string;
  field_count: number;
  uncertain: number;
}

export interface LeadFormPayload {
  client_key: string;
  event_name?: string;
  tz_offset: number;
  person: { first_name?: string; last_name?: string; title?: string; email?: string; phone?: string };
  company: { name?: string; website?: string; phone?: string; email?: string; address?: string };
  need?: string;
  budget?: string;
  timeline?: string;
  notes?: string;
  person_choice?: EntityChoice;
  company_choice?: EntityChoice;
}

/** A 409 from the server: a person or company looks like an existing record and needs a choice. */
export interface DecisionRequired {
  decision_required: "person" | "company";
  match: MatchResult;
}

export interface SignalView {
  id: string;
  signal_type: string;
  field: string;
  value: string;
  source_type: string;
  source_trust: number;
  trust_basis: string;
  ai_confidence: number | null;
  origin: string;
  lead_source: string;
  captured_at: string;
  capture_id: string;
}
