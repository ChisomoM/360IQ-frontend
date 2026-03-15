export type EmploymentType = 'permanent' | 'contract' | 'part_time' | 'probation';
export type LeaveType = 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ProfileStatus = 'active' | 'inactive' | 'pending_account';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface StaffProfile {
  id: string;
  user_id?: string | null;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    staff_number: string;
    position: string;
    contact_number?: string;
    department_id?: string;
    department?: { id: string; name: string; code: string };
    is_active: boolean;
  };
  // Offline identity fields (populated when user_id is null)
  full_name?: string;
  email?: string;
  contact_number?: string;
  profile_status: ProfileStatus;
  national_id?: string;
  gender?: string;
  date_of_birth?: string;
  employment_type: EmploymentType;
  employment_number?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  salary_scale?: string;
  qualifications?: string;
  emergency_contact?: string;
  is_onboarded: boolean;
  onboarded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  national_id?: string;
  contact_number?: string;
  gender?: string;
  date_of_birth?: string;
  department_id?: string;
  department?: { id: string; name: string; code: string };
  position?: string;
  employment_type?: EmploymentType;
  employment_number?: string;
  salary_scale?: string;
  qualifications?: string;
  supporting_docs?: string;
  reason_for_joining?: string;
  status: ApplicationStatus;
  reviewed_by_id?: string;
  reviewed_by?: { id: string; first_name: string; last_name: string };
  reviewed_at?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApproveApplicationPayload {
  temp_password: string;
  role_id?: string;
  reviewer_notes?: string;
}

export interface RejectApplicationPayload {
  reviewer_notes?: string;
}

export interface LeaveRequest {
  id: string;
  staff_id: string;
  staff?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: { id: string; name: string };
  };
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  supporting_doc_id?: string;
  status: LeaveStatus;
  approved_by_id?: string;
  approved_by?: { id: string; first_name: string; last_name: string };
  approved_at?: string;
  approver_comments?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeaveRequestPayload {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  supporting_doc_id?: string;
}

export interface CreateStaffProfileLinkedPayload {
  user_id: string;
  national_id?: string;
  gender?: string;
  date_of_birth?: string;
  employment_type: EmploymentType;
  employment_number?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  salary_scale?: string;
}

export interface CreateStaffProfileOfflinePayload {
  full_name: string;
  email: string;
  contact_number?: string;
  national_id?: string;
  gender?: string;
  date_of_birth?: string;
  employment_type: EmploymentType;
  employment_number?: string;
  salary_scale?: string;
  department_id?: string;
  position?: string;
}

// Legacy alias kept for backward compatibility
export type CreateStaffProfilePayload = CreateStaffProfileLinkedPayload;

export interface HRAnalytics {
  total_staff: number;
  active_staff: number;
  staff_by_department: { department_id: string; department_name: string; count: number }[];
  staff_by_employment_type: { employment_type: string; count: number }[];
  leave_by_status: { status: string; count: number }[];
  leave_by_type: { leave_type: string; count: number }[];
  contracts_expiring_in_30_days: number;
  contracts_expiring_in_60_days: number;
  contracts_expiring_in_90_days: number;
}