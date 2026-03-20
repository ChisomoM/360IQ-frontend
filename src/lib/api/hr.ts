import { fetchData } from './crud';
import type {
  StaffProfile,
  LeaveRequest,
  HRAnalytics,
  CreateLeaveRequestPayload,
  CreateStaffProfileLinkedPayload,
  CreateStaffProfileOfflinePayload,
  StaffApplication,
  ApproveApplicationPayload,
} from '@/types/hr';

// ─── Staff Profiles ──────────────────────────────────────────────────────────

export async function listStaffProfiles(filters?: {
  department_id?: string;
  employment_type?: string;
}): Promise<StaffProfile[]> {
  const query: Record<string, string> = {};
  if (filters?.department_id) query['department_id'] = filters.department_id;
  if (filters?.employment_type) query['employment_type'] = filters.employment_type;
  const res = await fetchData('HR_STAFF', 'GET', {}, null, query);
  return Array.isArray(res) ? res : [];
}

export async function getStaffProfile(id: string): Promise<StaffProfile> {
  return await fetchData('HR_STAFF_DETAIL', 'GET', { id });
}

export async function getMyStaffProfile(): Promise<StaffProfile> {
  return await fetchData('HR_ME', 'GET');
}

export async function createStaffProfile(payload: CreateStaffProfileLinkedPayload | CreateStaffProfileOfflinePayload): Promise<StaffProfile> {
  return await fetchData('HR_STAFF', 'POST', {}, payload);
}

export async function searchUsersForHR(query: string): Promise<Array<{ id: string; first_name: string; last_name: string; email: string }>> {
  const res = await fetchData('HR_USERS_SEARCH', 'GET', {}, null, { q: query });
  return Array.isArray(res) ? res : [];
}

export async function updateStaffProfile(id: string, updates: Partial<CreateStaffProfileLinkedPayload>): Promise<void> {
  await fetchData('HR_STAFF_DETAIL', 'PATCH', { id }, updates);
}

// ─── Leave Requests ──────────────────────────────────────────────────────────

export async function listLeaveRequests(filters?: {
  status?: string;
  leave_type?: string;
}): Promise<LeaveRequest[]> {
  const query: Record<string, string> = {};
  if (filters?.status) query['status'] = filters.status;
  if (filters?.leave_type) query['leave_type'] = filters.leave_type;
  const res = await fetchData('HR_LEAVE', 'GET', {}, null, query);
  return Array.isArray(res) ? res : [];
}

export async function getLeaveRequest(id: string): Promise<LeaveRequest> {
  return await fetchData('HR_LEAVE_DETAIL', 'GET', { id });
}

export async function createLeaveRequest(payload: CreateLeaveRequestPayload): Promise<LeaveRequest> {
  return await fetchData('HR_LEAVE', 'POST', {}, payload);
}

export async function approveLeaveRequest(id: string, comments?: string): Promise<void> {
  await fetchData('HR_LEAVE_APPROVE', 'POST', { id }, { comments });
}

export async function rejectLeaveRequest(id: string, comments: string): Promise<void> {
  await fetchData('HR_LEAVE_REJECT', 'POST', { id }, { comments });
}

export async function cancelLeaveRequest(id: string): Promise<void> {
  await fetchData('HR_LEAVE_CANCEL', 'POST', { id });
}

// ─── HR Analytics ────────────────────────────────────────────────────────────

export async function getHRAnalytics(): Promise<HRAnalytics> {
  const res = await fetchData('HR_ANALYTICS', 'GET');
  return {
    ...res,
    staff_by_department: res?.staff_by_department ?? [],
    staff_by_employment_type: res?.staff_by_employment_type ?? [],
    leave_by_status: res?.leave_by_status ?? [],
    leave_by_type: res?.leave_by_type ?? [],
  };
}

// ─── Staff Applications ───────────────────────────────────────────────────────

/**
 * Submit a staff self-onboarding application (public — no auth required).
 * Uses fetchData which gracefully omits Authorization header when no token exists.
 */
export async function submitApplication(payload: Omit<StaffApplication, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<void> {
  await fetchData('HR_APPLICATION_SUBMIT', 'POST', {}, payload);
}

export async function listApplications(status?: string): Promise<StaffApplication[]> {
  const query: Record<string, string> = {};
  if (status) query['status'] = status;
  const res = await fetchData('HR_APPLICATIONS', 'GET', {}, null, query);
  return Array.isArray(res) ? res : [];
}

export async function getApplication(id: string): Promise<StaffApplication> {
  return await fetchData('HR_APPLICATION_DETAIL', 'GET', { id });
}

export async function approveApplication(id: string, payload: ApproveApplicationPayload): Promise<{ user: object; staff_profile: object; temp_password: string }> {
  return await fetchData('HR_APPLICATION_APPROVE', 'POST', { id }, payload);
}

export async function rejectApplication(id: string, reviewer_notes?: string): Promise<void> {
  await fetchData('HR_APPLICATION_REJECT', 'POST', { id }, { reviewer_notes });
}
