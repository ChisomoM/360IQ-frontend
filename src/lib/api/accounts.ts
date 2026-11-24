import { fetchData } from "./crud";
import type {
  Account,
  CreateAccountPayload,
  Contact,
  CreateContactPayload,
  BusinessUnit,
  CreateBusinessUnitPayload,
} from "@/types/account";

// ─── Accounts ───────────────────────────────────────────────────────────────

export async function listAccounts(filters?: {
  search?: string;
  lifecycle_stage?: string;
  industry?: string;
  owner_id?: string;
  page?: number;
  page_size?: number;
}): Promise<{ items: Account[]; total: number; page: number; page_size: number }> {
  const query: Record<string, string> = {};
  if (filters?.search) query["search"] = filters.search;
  if (filters?.lifecycle_stage) query["lifecycle_stage"] = filters.lifecycle_stage;
  if (filters?.industry) query["industry"] = filters.industry;
  if (filters?.owner_id) query["owner_id"] = filters.owner_id;
  if (filters?.page) query["page"] = String(filters.page);
  if (filters?.page_size) query["page_size"] = String(filters.page_size);

  const res = await fetchData("ACCOUNTS", "GET", {}, null, query);
  return {
    items: Array.isArray(res?.items) ? res.items : [],
    total: typeof res?.total === "number" ? res.total : 0,
    page: typeof res?.page === "number" ? res.page : 1,
    page_size: typeof res?.page_size === "number" ? res.page_size : 10,
  };
}

export async function getAccount(id: string): Promise<Account> {
  return await fetchData("ACCOUNT_DETAIL", "GET", { id });
}

export async function createAccount(
  payload: CreateAccountPayload
): Promise<Account> {
  return await fetchData("ACCOUNTS", "POST", {}, payload);
}

export async function updateAccount(
  id: string,
  payload: CreateAccountPayload
): Promise<Account> {
  return await fetchData("ACCOUNT_DETAIL", "PUT", { id }, payload);
}

export async function deleteAccount(id: string): Promise<void> {
  await fetchData("ACCOUNT_DETAIL", "DELETE", { id });
}

// ─── Contacts ───────────────────────────────────────────────────────────────

export async function createContact(
  accountId: string,
  payload: CreateContactPayload
): Promise<Contact> {
  return await fetchData("ACCOUNT_CONTACTS", "POST", { id: accountId }, payload);
}

export async function listContacts(accountId: string): Promise<Contact[]> {
  const res = await fetchData("ACCOUNT_CONTACTS", "GET", { id: accountId });
  return Array.isArray(res) ? res : [];
}

export async function updateContact(
  id: string,
  payload: CreateContactPayload
): Promise<Contact> {
  return await fetchData("CONTACT_DETAIL", "PUT", { id }, payload);
}

export async function deleteContact(id: string): Promise<void> {
  await fetchData("CONTACT_DETAIL", "DELETE", { id });
}

// ─── Business Units ─────────────────────────────────────────────────────────

export async function createBusinessUnit(
  accountId: string,
  payload: CreateBusinessUnitPayload
): Promise<BusinessUnit> {
  return await fetchData(
    "ACCOUNT_BUSINESS_UNITS",
    "POST",
    { id: accountId },
    payload
  );
}

export async function listBusinessUnits(accountId: string): Promise<BusinessUnit[]> {
  const res = await fetchData("ACCOUNT_BUSINESS_UNITS", "GET", { id: accountId });
  return Array.isArray(res) ? res : [];
}

export async function updateBusinessUnit(
  id: string,
  payload: CreateBusinessUnitPayload
): Promise<BusinessUnit> {
  return await fetchData("BUSINESS_UNIT_DETAIL", "PUT", { id }, payload);
}

export async function deleteBusinessUnit(id: string): Promise<void> {
  await fetchData("BUSINESS_UNIT_DETAIL", "DELETE", { id });
}
