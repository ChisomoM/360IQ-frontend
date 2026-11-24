// Shared building blocks for the ProfileIQ screens (people and companies).
// Colours come only from the brand tokens in tailwind.config.js (surface, line,
// signal, positive, caution, risk, text-*).

import { useEffect, useState, type ReactNode } from "react";
import dayjs from "dayjs";
import { ChevronDown, ChevronUp, EyeOff, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getProfileMeta } from "@/lib/api/profiles";
import type { FieldSource, ProfileMeta } from "@/types/profile";

// ─── labels ──────────────────────────────────────────────────────────────────

/** "DECISION_MAKER" -> "Decision maker" */
export function labelOf(value?: string | null): string {
  if (!value) return "";
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const SOURCE_LABEL: Record<string, string> = {
  FORM: "Lead form",
  CARD: "Business card",
  VOICE: "Voice note",
  NOTE: "Note",
  RESEARCH: "Research",
  MANUAL: "Entered by hand",
  IMPORT: "Import",
  MERGE: "Merge",
};

export function sourceLabel(t: string): string {
  return SOURCE_LABEL[t] ?? labelOf(t);
}

export function fmtDate(d?: string | null): string {
  return d ? dayjs(d).format("D MMM YYYY") : "";
}

export const BUYING_ROLE_VARIANT: Record<string, "signal" | "positive" | "caution" | "risk" | "neutral"> = {
  DECISION_MAKER: "signal",
  CHAMPION: "positive",
  INFLUENCER: "positive",
  PROCUREMENT: "neutral",
  USER: "neutral",
  BLOCKER: "risk",
  ECONOMIC_BUYER: "signal",
  GATEKEEPER: "caution",
};

export const STAGE_VARIANT: Record<string, "signal" | "positive" | "caution" | "risk" | "neutral"> = {
  LEAD: "neutral",
  PROSPECT: "caution",
  CUSTOMER: "positive",
  CHURNED: "risk",
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

// ─── permissions / meta ──────────────────────────────────────────────────────

let metaPromise: Promise<ProfileMeta> | null = null;

/** Enum values and the caller's ProfileIQ capabilities, loaded once per session. */
export function useProfileMeta(): ProfileMeta | null {
  const [meta, setMeta] = useState<ProfileMeta | null>(null);
  useEffect(() => {
    let alive = true;
    if (!metaPromise) metaPromise = getProfileMeta();
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

// ─── layout pieces ───────────────────────────────────────────────────────────

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface-1 p-4 sm:p-5 min-w-0", className)}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-display text-base font-semibold text-text-primary">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyPanel({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface-0 px-4 py-12 text-center">
      {icon && <div className="text-text-muted">{icon}</div>}
      <p className="font-display font-semibold text-text-primary">{title}</p>
      {children && <div className="max-w-sm text-sm text-text-secondary">{children}</div>}
    </div>
  );
}

export function MaskedNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-text-secondary">
      <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Phone, email and notes are hidden for your role. Ask an administrator for the "view sensitive" permission if you need them.</span>
    </div>
  );
}

export interface TabDef<T extends string> {
  id: T;
  label: string;
  count?: number | null;
}

/** Scrollable pill tab bar. Scrolls inside its own box so the page never scrolls sideways. */
export function TabBar<T extends string>({ tabs, active, onChange }: { tabs: TabDef<T>[]; active: T; onChange: (id: T) => void }) {
  return (
    <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
      <div className="flex w-max gap-0.5 rounded-xl bg-surface-2 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus",
              active === t.id ? "bg-surface-1 text-text-primary shadow-raised" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {t.label}
            {t.count ? <span className="rounded-full bg-signal px-1.5 py-0.5 text-xs font-semibold leading-none text-on-signal">{t.count}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-sm text-text-secondary">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={to >= total} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

// ─── field with source ───────────────────────────────────────────────────────

function ConfidenceText({ c }: { c: number }) {
  return <>{Math.round(c * 100)}%</>;
}

/** Where a value came from, who added it, when, and whether it is confirmed or an AI suggestion. */
export function SourceChip({ src }: { src: FieldSource }) {
  const ai = src.status === "AI_SUGGESTED";
  return (
    <span className={cn("inline-flex max-w-full flex-wrap items-center gap-1 text-xs", ai ? "text-caution" : "text-text-muted")}>
      {ai ? <Sparkles className="h-3 w-3 shrink-0" /> : <CheckCircle2 className="h-3 w-3 shrink-0 text-positive" />}
      <span className="font-medium">{ai ? "AI suggested" : "Confirmed"}</span>
      <span>
        · {sourceLabel(src.source_type)}
        {ai && (
          <>
            {" "}
            · <ConfidenceText c={src.confidence} />
          </>
        )}
        {src.added_at ? ` · ${fmtDate(src.added_at)}` : ""}
        {src.added_by ? ` · ${src.added_by}` : ""}
      </span>
    </span>
  );
}

interface FieldRowProps {
  label: string;
  field: string;
  value?: string | null;
  display?: ReactNode;
  sources?: FieldSource[];
  canConfirm?: boolean;
  onConfirm?: (sourceId: string) => void;
  /** shown instead of "Not known yet" */
  emptyText?: string;
  className?: string;
}

/**
 * One labelled value with its provenance. A value with no recorded source
 * (entered before source tracking) says so rather than pretending.
 */
export function FieldRow({ label, field, value, display, sources = [], canConfirm, onConfirm, emptyText, className }: FieldRowProps) {
  const [open, setOpen] = useState(false);
  const mine = sources.filter((s) => s.field === field);
  const current = mine.find((s) => s.is_current);
  const suggestions = mine.filter((s) => !s.is_current && s.status === "AI_SUGGESTED");
  const hasValue = Boolean(display) || Boolean(value && value.trim());
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <div className="break-words text-sm text-text-primary">
        {hasValue ? display ?? value : <span className="italic text-text-muted">{emptyText ?? "Not known yet"}</span>}
      </div>
      {hasValue && (current ? <SourceChip src={current} /> : <span className="text-xs text-text-muted">No source recorded (entered before source tracking)</span>)}
      {suggestions.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center gap-2 rounded-md bg-caution-tint px-2 py-1.5 text-xs text-caution">
          <Sparkles className="h-3 w-3 shrink-0" />
          <span className="min-w-0 break-words">
            AI suggests <strong className="break-words">{s.value}</strong> (<ConfidenceText c={s.confidence} /> from {sourceLabel(s.source_type)})
          </span>
          {canConfirm && onConfirm && (
            <Button variant="outline" size="sm" className="ml-auto h-7 whitespace-normal px-2" onClick={() => onConfirm(s.id)}>
              Confirm
            </Button>
          )}
        </div>
      ))}
      {mine.length > 1 && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-xs font-medium text-signal-text hover:underline"
          aria-expanded={open}
        >
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {open ? "Hide" : "Show"} all {mine.length} sources
        </button>
      )}
      {open && (
        <ul className="space-y-1 rounded-md border border-line bg-surface-0 p-2 text-xs">
          {mine.map((s) => (
            <li key={s.id} className="min-w-0 break-words">
              <span className="font-medium text-text-primary">{s.value || "(cleared)"}</span>{" "}
              <span className="text-text-muted">{s.is_current ? "· current" : "· not applied"}</span>
              <div>
                <SourceChip src={s} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Pill({ children, variant = "neutral" }: { children: ReactNode; variant?: "signal" | "positive" | "caution" | "risk" | "neutral" }) {
  return (
    <Badge variant={variant} className="h-auto min-h-[22px] whitespace-normal py-0.5">
      {children}
    </Badge>
  );
}

/** Friendly text for a duplicate-match reason code. */
export function reasonText(code: string): string {
  switch (code) {
    case "EMAIL":
      return "same email";
    case "PHONE":
      return "same phone number";
    case "DOMAIN":
      return "same company domain";
    case "NAME":
      return "similar name";
    case "ALIAS":
      return "known alias";
    case "SAME_COMPANY":
      return "same company";
    case "PHONE_DIFFERENT_NAME":
      return "shared phone, different name";
    case "CONTACT_DETAILS":
      return "matching contact details";
    default:
      return labelOf(code).toLowerCase();
  }
}
