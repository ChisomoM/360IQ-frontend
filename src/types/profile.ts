// ProfileIQ: person and company profiles. Mirrors modules/profiles in the backend.

export type EntityType = "PERSON" | "COMPANY";

export type BuyingRole =
  | "DECISION_MAKER"
  | "INFLUENCER"
  | "USER"
  | "PROCUREMENT"
  | "CHAMPION"
  | "BLOCKER"
  // legacy values, still shown when present
  | "ECONOMIC_BUYER"
  | "GATEKEEPER";

export type Seniority = "C_LEVEL" | "VP" | "DIRECTOR" | "MANAGER" | "STAFF";
export type PreferredChannel = "EMAIL" | "PHONE" | "WHATSAPP" | "SMS" | "IN_PERSON";
export type ConsentStatus = "UNKNOWN" | "GRANTED" | "DECLINED" | "WITHDRAWN";
export type RelationshipStage = "LEAD" | "PROSPECT" | "CUSTOMER" | "CHURNED";
export type FieldStatus = "CONFIRMED" | "AI_SUGGESTED";
export type SourceType = "FORM" | "CARD" | "VOICE" | "NOTE" | "RESEARCH" | "MANUAL" | "IMPORT";

export interface FieldSource {
  id: string;
  field: string;
  value: string;
  source_type: SourceType;
  source_ref: string;
  status: FieldStatus;
  confidence: number;
  added_by: string;
  added_at: string;
  is_current: boolean;
}

export interface CompanyLink {
  id: string;
  person_id: string;
  person_name?: string;
  company_id: string;
  company_name: string;
  title: string;
  department: string;
  start_date: string | null;
  end_date: string | null;
  is_primary: boolean;
  active: boolean;
}

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string;
  department: string;
  seniority: Seniority | string;
  buying_role: BuyingRole | string;
  email: string;
  phone: string;
  linkedin_url: string;
  preferred_channel: PreferredChannel | string;
  consent_status: ConsentStatus | string;
  interests: string[];
  stated_needs: string;
  commitments: string;
  notes: string;
  status: string;
  company_id: string | null;
  company_name: string;
  links?: CompanyLink[];
  provenance?: FieldSource[];
  sensitive_masked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Site {
  name: string;
  address: string;
  district: string;
  province: string;
  country: string;
}

export interface Company {
  id: string;
  name: string;
  legal_name: string;
  aliases: string[];
  domain: string;
  website: string;
  industry: string;
  size_band: string;
  relationship_stage: RelationshipStage | string;
  address: string;
  district: string;
  province: string;
  country: string;
  sites: Site[];
  parent_id: string | null;
  parent_name: string;
  phone: string;
  email: string;
  background_notes: string;
  reputation_notes: string;
  notes: string;
  registration_number: string;
  tax_number: string;
  status: string;
  people_count: number;
  provenance?: FieldSource[];
  sensitive_masked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  person_id: string | null;
  person_name?: string;
  company_id: string | null;
  company_name?: string;
  kind: string;
  summary: string;
  source_type: string;
  occurred_at: string;
  created_by: string;
}

export interface Candidate {
  id: string;
  entity_type: EntityType;
  name: string;
  company_name?: string;
  level: "STRONG" | "POSSIBLE";
  score: number;
  reasons: string[];
  label: string;
}

export interface MatchResult {
  level: "NONE" | "POSSIBLE" | "STRONG";
  candidates: Candidate[];
}

export type CreateOutcome = "CREATED" | "LINKED_EXISTING" | "POSSIBLE_DUPLICATES";

export interface CreateResponse<T> {
  outcome: CreateOutcome;
  match: MatchResult;
  person?: T;
  company?: T;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface LinkedDocument {
  id: string;
  title: string;
  document_type: string;
  file_name: string;
  file_type: string;
  file_size: number;
  status: string;
  linked_at: string;
}

export interface MergeRecord {
  id: string;
  entity_type: EntityType;
  survivor_id: string;
  merged_id: string;
  status: "MERGED" | "UNDONE";
  merged_at: string;
  undone_at: string | null;
  counts: Record<string, number>;
  sensitive_masked: boolean;
}

export interface ProfileMeta {
  seniority: string[];
  buying_roles: string[];
  preferred_channels: string[];
  consent_statuses: string[];
  relationship_stages: string[];
  size_bands: string[];
  interaction_kinds: string[];
  permissions: {
    view: boolean;
    manage: boolean;
    merge: boolean;
    view_sensitive: boolean;
    documents_read: boolean;
  };
}
