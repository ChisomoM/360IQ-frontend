// Captures that have not reached the server yet. A card photo, a voice recording or a
// note is written here before the upload starts and removed only when the server
// has stored it, so a dropped connection, a closed tab or a server error never
// loses it. Everything is wrapped in try/catch: IndexedDB can be missing (private
// windows, blocked site data), and the page then works from memory only.

export type PendingKind = "card" | "voice" | "note";

export interface PendingCapture {
  id: string; // the client_key sent with every attempt
  kind: PendingKind;
  blob?: Blob; // card photo or recording
  filename?: string;
  text?: string; // note
  dictated?: boolean;
  eventName: string;
  tzOffset: number;
  createdAt: number;
  lastError?: string;
  tenantId?: string; // who saved it: a record is only ever shown to and sent by this tenant and user
  userId?: string;
}

// The signed-in tenant and user. Set by the auth provider. Without one nothing is read or written.
let scope: { tenantId: string; userId: string } | null = null;

export function setCaptureScope(tenantId?: string | null, userId?: string | null) {
  scope = tenantId && userId ? { tenantId, userId } : null;
}

export function getCaptureScope() {
  return scope;
}

/** True when the record belongs to the signed-in tenant and user. Records saved before scoping existed belong to nobody. */
export function ownsPending(p: Pick<PendingCapture, "tenantId" | "userId">): boolean {
  return !!scope && p.tenantId === scope.tenantId && p.userId === scope.userId;
}

/** A browser-storage key that is private to the signed-in tenant and user, or null when nobody is signed in. */
export function scopedKey(base: string): string | null {
  return scope ? `${base}:${scope.tenantId}:${scope.userId}` : null;
}

const DB_NAME = "captureiq";
const STORE = "pending";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await open();
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => {
        db.close();
        resolve(req.result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    return undefined;
  }
}

/** Stores a record on this device. Returns false when it could not be stored (no IndexedDB, blocked site data, full disk). */
export async function savePending(p: PendingCapture): Promise<boolean> {
  if (!scope) return false;
  const rec = { ...p, tenantId: p.tenantId ?? scope.tenantId, userId: p.userId ?? scope.userId };
  if (!ownsPending(rec)) return false; // never overwrite or create another user's record
  return (await run("readwrite", (s) => s.put(rec))) !== undefined;
}

/** Only the signed-in user's own records. Others stay on the device untouched. */
export async function listPending(): Promise<PendingCapture[]> {
  const all = await run("readonly", (s) => s.getAll() as IDBRequest<PendingCapture[]>);
  return (all ?? []).filter(ownsPending).sort((a, b) => a.createdAt - b.createdAt);
}

export async function deletePending(id: string): Promise<void> {
  const mine = (await listPending()).some((p) => p.id === id);
  if (!mine) return;
  await run("readwrite", (s) => s.delete(id));
}

export function newClientKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Minutes east of UTC, as the server expects it for timeline times. */
export function tzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/** True when two captures would send the same content, so one request id may be reused for a retry. */
export function sameContent(a: PendingCapture, b: PendingCapture): boolean {
  return a.kind === b.kind && (a.text ?? "") === (b.text ?? "") && !!a.dictated === !!b.dictated && a.eventName === b.eventName && (a.blob?.size ?? 0) === (b.blob?.size ?? 0) && a.blob === b.blob;
}

/** The record to send: the earlier request id is reused only when nothing changed, because the server refuses one id for two different contents. */
export function withKeyFor(previous: PendingCapture | null, next: PendingCapture): PendingCapture {
  if (previous && sameContent(previous, next)) return { ...next, id: previous.id };
  return { ...next, id: newClientKey() };
}
