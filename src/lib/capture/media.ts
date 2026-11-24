// Browser-side helpers for card photos and voice debriefs.

/** Shrinks a photo to at most `maxSide` pixels and re-encodes it as JPEG, so phone photos stay well inside the upload limit. */
export async function prepareCardImage(file: File, maxBytes: number, maxSide = 1600): Promise<{ blob: Blob; filename: string }> {
  const fallback = () => {
    if (file.size > maxBytes) throw new Error("This photo is too large and could not be shrunk. Try a smaller photo.");
    return { blob: file as Blob, filename: file.name || "card.jpg" };
  };
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return fallback();
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return fallback();
    if (blob.size > maxBytes) throw new Error("This photo is too large. Try a smaller photo.");
    return { blob, filename: "card.jpg" };
  } catch (e) {
    if (e instanceof Error && /too large/i.test(e.message)) throw e;
    return fallback(); // the browser could not decode it (for example HEIC outside Safari): let the server judge it
  }
}

const RECORDER_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus"];

/** The recording format this browser can produce: WebM/Opus in Chrome and Firefox, MP4/AAC in Safari. */
export function pickRecorderType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return undefined;
  return RECORDER_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

export type MicSupport = "ok" | "insecure" | "unsupported";

export function micSupport(): MicSupport {
  if (typeof window === "undefined") return "unsupported";
  if (!window.isSecureContext) return "insecure";
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return "unsupported";
  return "ok";
}

export type MicError = "denied" | "no-device" | "busy" | "other";

export function classifyMicError(e: unknown): MicError {
  const name = (e as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "DevicesNotFoundError" || name === "OverconstrainedError") return "no-device";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "other";
}

export function extensionFor(mime: string): string {
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Browser speech recognition (dictation). Not available everywhere, so callers feature-detect.
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
