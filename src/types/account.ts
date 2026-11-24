export type LifecycleStage = "LEAD" | "PROSPECT" | "CUSTOMER" | "CHURNED";
export type StrategicTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
export type Seniority = "C_LEVEL" | "VP" | "DIRECTOR" | "MANAGER" | "STAFF";
export type BuyingRole =
  | "DECISION_MAKER"
  | "ECONOMIC_BUYER"
  | "CHAMPION"
  | "INFLUENCER"
  | "GATEKEEPER"
  | "PROCUREMENT"
  | "BLOCKER"
  | "USER";
export type Status = "ACTIVE" | "INACTIVE";

export interface Account {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  legal_name: string;
  registration_number: string;
  tax_number: string;
  website: string;
  industry: string;
  sub_sector: string;
  employee_count: number;
  annual_revenue: number;
  lifecycle_stage: LifecycleStage;
  strategic_tier: StrategicTier;
  is_strategic_account: boolean;
  owner_id?: string;
  owner_name?: string;
  parent_account_id?: string;
  parent_account_name?: string;
  address: string;
  district: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  tags: string[];
  notes: string;
  status: Status;
  contacts?: Contact[];
  business_units?: BusinessUnit[];
}

export interface CreateAccountPayload {
  name: string;
  legal_name?: string;
  registration_number?: string;
  tax_number?: string;
  website?: string;
  industry?: string;
  sub_sector?: string;
  employee_count?: number;
  annual_revenue?: number;
  lifecycle_stage?: LifecycleStage;
  strategic_tier?: StrategicTier;
  is_strategic_account?: boolean;
  owner_id?: string | null;
  parent_account_id?: string | null;
  address?: string;
  district?: string;
  province?: string;
  country?: string;
  phone?: string;
  email?: string;
  tags?: string[];
  notes?: string;
  status?: Status;
}

export interface Contact {
  id: string;
  created_at: string;
  updated_at: string;
  account_id: string;
  account_name?: string;
  first_name: string;
  last_name: string;
  job_title: string;
  department: string;
  email: string;
  phone: string;
  mobile: string;
  linkedin_url: string;
  seniority: Seniority;
  buying_role: BuyingRole;
  is_primary: boolean;
  notes: string;
  status: Status;
}

export interface CreateContactPayload {
  first_name?: string;
  last_name?: string;
  job_title?: string;
  department?: string;
  email: string;
  phone?: string;
  mobile?: string;
  linkedin_url?: string;
  seniority?: Seniority;
  buying_role?: BuyingRole;
  is_primary?: boolean;
  notes?: string;
  status?: Status;
}

export interface BusinessUnit {
  id: string;
  created_at: string;
  updated_at: string;
  account_id: string;
  name: string;
  description: string;
  region: string;
  head_contact_id?: string;
  head_contact_name?: string;
}

export interface CreateBusinessUnitPayload {
  name: string;
  description?: string;
  region?: string;
  head_contact_id?: string | null;
}
