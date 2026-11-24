// Shared building blocks for the CaptureIQ screens. Colours come only from the brand
// tokens in tailwind.config.js (surface, line, signal, positive, caution, risk, text-*).

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Camera, FileText, Mic, PenLine, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCaptureMeta } from "@/lib/api/captures";
import { Pill, labelOf } from "@/components/profiles/ui";
import type { CaptureMeta, CaptureMethod, CaptureStatus } from "@/types/capture";

export const METHOD_LABEL: Record<CaptureMethod, string> = {
  FORM: "Lead form",
  CARD: "Business card",
  VOICE: "Voice debrief",
  NOTE: "Quick note",
};

export function MethodIcon({ method, className }: { method: CaptureMethod; className?: string }) {
  const c = cn("h-4 w-4 shrink-0", className);
  if (method === "CARD") return <Camera className={c} />;
  if (method === "VOICE") return <Mic className={c} />;
  if (method === "NOTE") return <PenLine className={c} />;
  return <FileText className={c} />;
}

const STATUS: Record<CaptureStatus, { label: string; variant: "signal" | "positive" | "caution" | "risk" | "neutral" }> = {
  PROCESSING: { label: "Reading…", variant: "neutral" },
  NEEDS_REVIEW: { label: "Needs review", variant: "signal" },
  AI_FAILED: { label: "Finish by hand", variant: "caution" },
  CONFIRMED: { label: "Saved", variant: "positive" },
  REJECTED: { label: "Rejected", variant: "neutral" },
};

export function StatusPill({ status }: { status: CaptureStatus }) {
  const s = STATUS[status] ?? { label: labelOf(status), variant: "neutral" as const };
  return <Pill variant={s.variant}>{s.label}</Pill>;
}

/** Marks content produced by the AI, so it is never mistaken for something a person entered. */
export function AiBadge({ className }: { className?: string }) {
  return (
    <Badge variant="caution" className={cn("gap-1", className)}>
      <Sparkles className="h-3 w-3" /> AI
    </Badge>
  );
}

/** Plain-language reason an AI step failed. The server stores only a short code, never provider text. */
export function aiErrorText(code: string): string {
  switch (code) {
    case "not_configured":
      return "AI reading is not set up for this workspace. Your capture is saved: finish it by hand below.";
    case "timeout":
      return "The AI took too long to answer. Your capture is saved: try again, or finish it by hand.";
    case "invalid_output":
      return "The AI answered in a form we could not use. Your capture is saved: try again, or finish it by hand.";
    case "no_speech":
      return "No speech could be found in the recording. Your recording is kept for now: try again, or finish by hand.";
    case "unsupported_media":
      return "The AI service cannot read this kind of file. Your capture is saved: finish it by hand.";
    case "media_missing":
      return "The stored file could not be found. Finish this capture by hand.";
    case "interrupted":
      return "Reading was interrupted. Your capture is saved: try again.";
    default:
      return "The AI could not read this capture. It is saved: try again, or finish it by hand.";
  }
}

let metaPromise: Promise<CaptureMeta> | null = null;

/** Limits, capabilities and the field list, loaded once per session. */
export function useCaptureMeta(): CaptureMeta | null {
  const [meta, setMeta] = useState<CaptureMeta | null>(null);
  useEffect(() => {
    let alive = true;
    if (!metaPromise) metaPromise = getCaptureMeta();
    metaPromise
      .then((m) => alive && setMeta(m))
      .catch(() => {
        metaPromise = null;
      });
    return () => {
      alive = false;
    };
  }, []);
  return meta;
}

export function ErrorBanner({ children, tone = "risk" }: { children: ReactNode; tone?: "risk" | "caution" }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        tone === "risk" ? "border-risk bg-risk-tint text-risk" : "border-caution bg-caution-tint text-caution"
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 break-words">{children}</div>
    </div>
  );
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
