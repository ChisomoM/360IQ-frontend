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

export async function savePending(p: PendingCapture): Promise<void> {
  await run("readwrite", (s) => s.put(p));
}

export async function listPending(): Promise<PendingCapture[]> {
  const all = await run("readonly", (s) => s.getAll() as IDBRequest<PendingCapture[]>);
  return (all ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function deletePending(id: string): Promise<void> {
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
