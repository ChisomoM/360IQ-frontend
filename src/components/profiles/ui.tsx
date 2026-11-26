// Shared building blocks for the ProfileIQ screens (people and companies).
// Page furniture comes from components/shared; colours only from the 360IQ tokens.

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Lock, Sparkles, CheckCircle2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTablePagination } from "@/components/shared/DataTablePagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/format";
import type { Tone } from "@/lib/status";
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
  return formatDate(d);
}

export const BUYING_ROLE_VARIANT: Record<string, Tone> = {
  DECISION_MAKER: "neutral",
  CHAMPION: "positive",
  INFLUENCER: "neutral",
  PROCUREMENT: "neutral",
  USER: "neutral",
  BLOCKER: "risk",
  ECONOMIC_BUYER: "neutral",
  GATEKEEPER: "caution",
};

export const STAGE_VARIANT: Record<string, Tone> = {
  LEAD: "neutral",
  PROSPECT: "neutral",
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

export function MaskedNotice() {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-field px-4 py-3 text-sm text-text-secondary">
      <Lock size={18} className="mt-0.5 shrink-0" />
      <span>
        <strong className="font-semibold text-text-primary">Phone, email and notes are hidden by your access level.</strong> Ask an administrator for the "view sensitive" permission if you need them.
      </span>
    </div>
  );
}

export interface TabDef<T extends string> {
  id: T;
  label: string;
  count?: number | null;
}

/** Pill tabs. They scroll inside their own box so the page never scrolls sideways. */
export function TabBar<T extends string>({ tabs, active, onChange, children }: { tabs: TabDef<T>[]; active: T; onChange: (id: T) => void; children?: ReactNode }) {
  return (
    <Tabs value={active} onValueChange={(v) => onChange(v as T)} className="min-w-0">
      <div className="max-w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList className="w-max">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
              {t.label}
              {t.count ? <span className="rounded-pill bg-surface-2 px-1.5 font-mono text-xs text-text-secondary">{t.count}</span> : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent value={active}>{children}</TabsContent>
    </Tabs>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  if (total <= pageSize) return null;
  return <DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={onPage} />;
}

// ─── field with source ───────────────────────────────────────────────────────

function ConfidenceText({ c }: { c: number }) {
  return <span className="font-mono">{Math.round(c * 100)}%</span>;
}

/** Where a value came from, who added it, when, and whether it is confirmed or an AI suggestion. */
export function SourceChip({ src }: { src: FieldSource }) {
  const ai = src.status === "AI_SUGGESTED";
  return (
    <span className={cn("inline-flex max-w-full flex-wrap items-center gap-1 text-xs", ai ? "text-signal-text" : "text-text-muted")}>
      {ai ? <Sparkles size={14} className="shrink-0" /> : <CheckCircle2 size={14} className="shrink-0 text-positive" />}
      <span className="font-semibold">{ai ? "AI suggested" : "Confirmed"}</span>
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
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <div className="break-words text-sm text-text-primary">
        {hasValue ? display ?? value : <span className="text-text-muted">{emptyText ?? "Not known yet"}</span>}
      </div>
      {hasValue && (current ? <SourceChip src={current} /> : <span className="text-xs text-text-muted">No source recorded (entered before source tracking)</span>)}
      {suggestions.map((s) => (
        <div key={s.id} className="iq-grad-border flex flex-wrap items-center gap-2 rounded-md bg-signal-tint px-3 py-2 text-xs text-text-secondary [--surface-1:var(--signal-tint)]">
          <Sparkles size={14} className="shrink-0 text-signal-text" />
          <span className="min-w-0 break-words">
            AI suggests <strong className="break-words text-text-primary">{s.value}</strong> (<ConfidenceText c={s.confidence} /> from {sourceLabel(s.source_type)})
          </span>
          {canConfirm && onConfirm && (
            <Button variant="secondary" size="sm" className="ml-auto" onClick={() => onConfirm(s.id)}>
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
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {open ? "Hide" : "Show"} all {mine.length} sources
        </button>
      )}
      {open && (
        <ul className="space-y-1 rounded-md bg-field p-3 text-xs">
          {mine.map((s) => (
            <li key={s.id} className="min-w-0 break-words">
              <span className="font-semibold text-text-primary">{s.value || "(cleared)"}</span>{" "}
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

export function Pill({ children, variant = "neutral" }: { children: ReactNode; variant?: Tone }) {
  return (
    <StatusBadge tone={variant} className="h-auto min-h-[1.572rem] whitespace-normal break-words py-0.5">
      {children}
    </StatusBadge>
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
