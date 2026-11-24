import { fetchData } from "./crud";
import type {
  Candidate,
  Company,
  CompanyLink,
  CreateResponse,
  Interaction,
  LinkedDocument,
  MatchResult,
  MergeRecord,
  Page,
  Person,
  ProfileMeta,
  Site,
} from "@/types/profile";

function cleanQuery(q: Record<string, string | number | undefined | null>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "" && v !== "ALL") out[k] = String(v);
  });
  return out;
}

function asPage<T>(res: unknown): Page<T> {
  const r = (res ?? {}) as Partial<Page<T>>;
  return {
    items: Array.isArray(r.items) ? r.items : [],
    total: typeof r.total === "number" ? r.total : 0,
    page: typeof r.page === "number" ? r.page : 1,
    page_size: typeof r.page_size === "number" ? r.page_size : 20,
  };
}

// ─── Meta ────────────────────────────────────────────────────────────────────

export async function getProfileMeta(): Promise<ProfileMeta> {
  return await fetchData("PROFILES_META", "GET");
}

// ─── People ──────────────────────────────────────────────────────────────────

export interface PeopleFilters {
  search?: string;
  company_id?: string;
  buying_role?: string;
  seniority?: string;
  consent_status?: string;
  page?: number;
  page_size?: number;
}

export async function listPeople(filters: PeopleFilters = {}): Promise<Page<Person>> {
  const res = await fetchData("PROFILES_PEOPLE", "GET", {}, null, cleanQuery({ ...filters }));
  return asPage<Person>(res);
}

export async function getPerson(id: string): Promise<Person> {
  return await fetchData("PROFILES_PERSON", "GET", { id });
}

/** Body for creating a person. Only fields with a value are sent. */
export interface PersonPayload {
  first_name?: string;
  last_name?: string;
  title?: string;
  department?: string;
  seniority?: string;
  buying_role?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  preferred_channel?: string;
  consent_status?: string;
  interests?: string[];
  stated_needs?: string;
  commitments?: string;
  notes?: string;
  company_id?: string;
  start_date?: string;
}

export async function checkPersonDuplicates(p: PersonPayload): Promise<MatchResult> {
  return await fetchData("PROFILES_PEOPLE_CHECK", "POST", {}, p);
}

export async function createPerson(p: PersonPayload, confirmCreate = false): Promise<CreateResponse<Person>> {
  return await fetchData("PROFILES_PEOPLE", "POST", {}, { ...p, confirm_create: confirmCreate });
}

/** Only changed fields should be passed. */
export async function updatePerson(id: string, changes: Record<string, string | string[]>): Promise<Person> {
  return await fetchData("PROFILES_PERSON", "PUT", { id }, changes);
}

export async function addLink(
  personId: string,
  body: { company_id: string; title?: string; department?: string; start_date?: string; end_date?: string; is_primary?: boolean }
): Promise<CompanyLink[]> {
  return await fetchData("PROFILES_PERSON_LINKS", "POST", { id: personId }, body);
}

export async function updateLink(
  linkId: string,
  body: { title?: string; department?: string; start_date?: string; end_date?: string; is_primary?: boolean }
): Promise<CompanyLink[]> {
  return await fetchData("PROFILES_LINK", "PUT", { id: linkId }, body);
}

export async function changeJob(
  personId: string,
  body: { from_link_id?: string; new_company_id: string; title?: string; department?: string; start_date?: string }
): Promise<Person> {
  return await fetchData("PROFILES_PERSON_JOB_CHANGE", "POST", { id: personId }, body);
}

export async function confirmFieldValue(sourceId: string): Promise<void> {
  await fetchData("PROFILES_FIELD_CONFIRM", "POST", { id: sourceId });
}

// ─── Companies ───────────────────────────────────────────────────────────────

export interface CompanyFilters {
  search?: string;
  industry?: string;
  relationship_stage?: string;
  size_band?: string;
  province?: string;
  page?: number;
  page_size?: number;
}

export async function listCompanies(filters: CompanyFilters = {}): Promise<Page<Company>> {
  const res = await fetchData("PROFILES_COMPANIES", "GET", {}, null, cleanQuery({ ...filters }));
  return asPage<Company>(res);
}

export async function getCompany(id: string): Promise<Company> {
  return await fetchData("PROFILES_COMPANY", "GET", { id });
}

export interface CompanyPayload {
  name?: string;
  legal_name?: string;
  domain?: string;
  website?: string;
  industry?: string;
  size_band?: string;
  relationship_stage?: string;
  address?: string;
  district?: string;
  province?: string;
  country?: string;
  phone?: string;
  email?: string;
  background_notes?: string;
  reputation_notes?: string;
  notes?: string;
  aliases?: string[];
  sites?: Site[];
  parent_id?: string;
}

export async function checkCompanyDuplicates(p: CompanyPayload): Promise<MatchResult> {
  return await fetchData("PROFILES_COMPANIES_CHECK", "POST", {}, p);
}

export async function createCompany(p: CompanyPayload, confirmCreate = false): Promise<CreateResponse<Company>> {
  return await fetchData("PROFILES_COMPANIES", "POST", {}, { ...p, confirm_create: confirmCreate });
}

export async function updateCompany(id: string, changes: Record<string, unknown>): Promise<Company> {
  return await fetchData("PROFILES_COMPANY", "PUT", { id }, changes);
}

export async function listCompanyPeople(id: string, includeFormer: boolean): Promise<CompanyLink[]> {
  const res = await fetchData("PROFILES_COMPANY_PEOPLE", "GET", { id }, null, includeFormer ? { include_former: "true" } : {});
  return Array.isArray(res) ? res : [];
}

export async function listCompanyPlaceholder(
  kind: "deals" | "contracts",
  id: string
): Promise<{ items: unknown[]; total: number; module_available: boolean; message: string }> {
  const res = await fetchData(kind === "deals" ? "PROFILES_COMPANY_DEALS" : "PROFILES_COMPANY_CONTRACTS", "GET", { id });
  return {
    items: Array.isArray(res?.items) ? res.items : [],
    total: res?.total ?? 0,
    module_available: Boolean(res?.module_available),
    message: res?.message ?? "",
  };
}

export async function listCompanyDocuments(id: string): Promise<LinkedDocument[]> {
  const res = await fetchData("PROFILES_COMPANY_DOCUMENTS", "GET", { id });
  return Array.isArray(res) ? res : [];
}

export async function linkCompanyDocument(id: string, documentId: string): Promise<LinkedDocument[]> {
  const res = await fetchData("PROFILES_COMPANY_DOCUMENTS", "POST", { id }, { document_id: documentId });
  return Array.isArray(res) ? res : [];
}

export async function unlinkCompanyDocument(id: string, documentId: string): Promise<void> {
  await fetchData("PROFILES_COMPANY_DOCUMENT", "DELETE", { id, doc_id: documentId });
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export async function listTimeline(
  entity: "person" | "company",
  id: string,
  page = 1,
  pageSize = 20
): Promise<Page<Interaction>> {
  const key = entity === "person" ? "PROFILES_PERSON_TIMELINE" : "PROFILES_COMPANY_TIMELINE";
  const res = await fetchData(key, "GET", { id }, null, { page: String(page), page_size: String(pageSize) });
  return asPage<Interaction>(res);
}

export async function addTimelineEntry(
  entity: "person" | "company",
  id: string,
  body: { kind: string; summary: string; occurred_at?: string; company_id?: string }
): Promise<Page<Interaction>> {
  const key = entity === "person" ? "PROFILES_PERSON_TIMELINE" : "PROFILES_COMPANY_TIMELINE";
  return asPage<Interaction>(await fetchData(key, "POST", { id }, body));
}

// ─── Merge ───────────────────────────────────────────────────────────────────

export async function mergeRecords(entity: "PERSON" | "COMPANY", survivorId: string, mergedId: string): Promise<MergeRecord> {
  return await fetchData("PROFILES_MERGES", "POST", {}, { entity_type: entity, survivor_id: survivorId, merged_id: mergedId });
}

export async function undoMerge(mergeId: string): Promise<MergeRecord> {
  return await fetchData("PROFILES_MERGE_UNDO", "POST", { id: mergeId });
}

export async function listMerges(entity: "PERSON" | "COMPANY", entityId: string): Promise<MergeRecord[]> {
  const res = await fetchData("PROFILES_MERGES", "GET", {}, null, { entity_type: entity, entity_id: entityId, page_size: "20" });
  return asPage<MergeRecord>(res).items;
}

export type { Candidate };
