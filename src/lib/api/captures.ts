import { fetchData, fetchFileBuffer } from "./crud";
import type {
  CaptureDraft,
  CaptureListItem,
  CaptureMeta,
  CaptureView,
  ConfirmResult,
  DecisionRequired,
  LeadFormPayload,
  SignalView,
} from "@/types/capture";
import type { Page } from "@/types/profile";

/** The server answer when a person or company needs a link / create-new choice, else null. */
export function asDecisionRequired(e: unknown): DecisionRequired | null {
  const err = e as { status?: number; data?: Partial<DecisionRequired> } | null;
  if (err && err.status === 409 && err.data && err.data.decision_required && err.data.match) return err.data as DecisionRequired;
  return null;
}

/** True when the request got no answer at all (offline, dropped connection): the capture was not stored. */
export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError || (e instanceof Error && (e as { status?: number }).status === undefined && /failed to fetch|network|load failed/i.test(e.message));
}

export async function getCaptureMeta(): Promise<CaptureMeta> {
  return await fetchData("CAPTURES_META", "GET");
}

export async function getInboxCount(): Promise<number> {
  const r = (await fetchData("CAPTURES_COUNT", "GET")) as { open?: number } | undefined;
  return r?.open ?? 0;
}

export async function listCaptures(q: { status?: string; mine?: boolean; page?: number } = {}): Promise<Page<CaptureListItem>> {
  const query: Record<string, string> = {};
  if (q.status) query.status = q.status;
  if (q.mine) query.mine = "1";
  if (q.page) query.page = String(q.page);
  const r = (await fetchData("CAPTURES", "GET", {}, null, query)) as Partial<Page<CaptureListItem>> | undefined;
  return { items: r?.items ?? [], total: r?.total ?? 0, page: r?.page ?? 1, page_size: r?.page_size ?? 25 };
}

export async function getCapture(id: string, personId?: string, companyId?: string): Promise<CaptureView> {
  const query: Record<string, string> = {};
  if (personId) query.person_id = personId;
  if (companyId) query.company_id = companyId;
  return await fetchData("CAPTURE", "GET", { id }, null, query);
}

export async function submitLead(p: LeadFormPayload): Promise<ConfirmResult> {
  return await fetchData("CAPTURES_LEAD", "POST", {}, p);
}

export async function submitNote(p: { client_key: string; text: string; dictated: boolean; event_name?: string; tz_offset: number }): Promise<CaptureView> {
  return await fetchData("CAPTURES_NOTE", "POST", {}, p);
}

/** Uploads a card photo or a voice recording. The same client_key makes a repeat upload safe. */
export async function submitFile(
  kind: "card" | "voice",
  file: Blob,
  filename: string,
  p: { client_key: string; event_name?: string; tz_offset: number }
): Promise<CaptureView> {
  const fd = new FormData();
  fd.append("client_key", p.client_key);
  fd.append("tz_offset", String(p.tz_offset));
  if (p.event_name) fd.append("event_name", p.event_name);
  fd.append("file", file, filename);
  return await fetchData(kind === "card" ? "CAPTURES_CARD" : "CAPTURES_VOICE", "POST", {}, fd);
}

export async function saveDraft(id: string, d: CaptureDraft): Promise<void> {
  await fetchData("CAPTURE", "PUT", { id }, d);
}

export async function confirmCapture(id: string, d: CaptureDraft): Promise<ConfirmResult> {
  return await fetchData("CAPTURE_CONFIRM", "POST", { id }, d);
}

export async function rejectCapture(id: string): Promise<void> {
  await fetchData("CAPTURE_REJECT", "POST", { id }, {});
}

export async function retryCapture(id: string): Promise<CaptureView> {
  return await fetchData("CAPTURE_RETRY", "POST", { id }, {});
}

/** The card photo, fetched with the session token: the endpoint is authorised, never a public URL. */
export async function getCaptureImage(id: string): Promise<string> {
  const { buffer, contentType } = await fetchFileBuffer("CAPTURE_IMAGE", { id });
  return URL.createObjectURL(new Blob([buffer], { type: contentType || "image/jpeg" }));
}

export async function getSignals(q: { contact_id?: string; account_id?: string }): Promise<SignalView[]> {
  const r = (await fetchData("CAPTURES_SIGNALS", "GET", {}, null, q as Record<string, string>)) as SignalView[] | undefined;
  return r ?? [];
}
