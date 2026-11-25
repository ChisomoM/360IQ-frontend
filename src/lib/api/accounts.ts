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

/**
 * The server answers 409 when a save looks like an existing record, or reuses an email,
 * phone or domain another record has. The user is asked once; on yes the same save is
 * repeated with confirm_create set. Anything else is passed on.
 */
async function withConfirm<T>(save: (confirm: boolean) => Promise<T>, what: string): Promise<T> {
  try {
    return await save(false);
  } catch (e) {
    const err = e as { status?: number; message?: string; data?: { match?: { candidates?: { name?: string }[] } } } | null;
    if (err && err.status === 409) {
      const names = (err.data?.match?.candidates ?? []).map((c) => c.name).filter(Boolean).slice(0, 3).join(", ");
      const text = names ? `This ${what} looks like an existing record: ${names}.` : (err.message ?? "").replace(/ Save again with confirm_duplicate to keep both\.?/, "");
      if (typeof window !== "undefined" && window.confirm(`${text}

Save anyway?`)) return await save(true);
    }
    throw e;
  }
}

export async function createAccount(
  payload: CreateAccountPayload
): Promise<Account> {
  return await withConfirm((c) => fetchData("ACCOUNTS", "POST", {}, c ? { ...payload, confirm_create: true } : payload), "company");
}

export async function updateAccount(
  id: string,
  payload: CreateAccountPayload
): Promise<Account> {
  return await withConfirm((c) => fetchData("ACCOUNT_DETAIL", "PUT", { id }, c ? { ...payload, confirm_create: true } : payload), "company");
}

export async function deleteAccount(id: string): Promise<void> {
  await fetchData("ACCOUNT_DETAIL", "DELETE", { id });
}

// ─── Contacts ───────────────────────────────────────────────────────────────

export async function createContact(
  accountId: string,
  payload: CreateContactPayload
): Promise<Contact> {
  return await withConfirm((c) => fetchData("ACCOUNT_CONTACTS", "POST", { id: accountId }, c ? { ...payload, confirm_create: true } : payload), "person");
}

export async function listContacts(accountId: string): Promise<Contact[]> {
  const res = await fetchData("ACCOUNT_CONTACTS", "GET", { id: accountId });
  return Array.isArray(res) ? res : [];
}

export async function updateContact(
  id: string,
  payload: CreateContactPayload
): Promise<Contact> {
  return await withConfirm((c) => fetchData("CONTACT_DETAIL", "PUT", { id }, c ? { ...payload, confirm_create: true } : payload), "person");
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
