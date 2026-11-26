import { useState } from "react";
import { Check, Pencil, Sparkles, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import type { CaptureFieldView } from "@/types/capture";

export type RowAction = "pending" | "accept" | "edit" | "reject";

export interface RowState {
  action: RowAction;
  value: string;
  overwrite: boolean;
}

const LONG_KEYS = new Set(["need", "note", "next_step"]);

/**
 * One value the AI proposed. Shows where it came from and how sure the AI is, highlights
 * values that need a check, and lets the reviewer confirm, edit or reject it in one tap.
 * A value nobody touched stays "pending": the server stores it only as an AI suggestion.
 */
export function FieldReviewRow({
  field,
  state,
  onChange,
  disabled,
  uncertainBelow,
}: {
  field: CaptureFieldView;
  state: RowState;
  onChange: (s: RowState) => void;
  disabled?: boolean;
  uncertainBelow: number;
}) {
  const [editing, setEditing] = useState(false);
  const uncertain = field.uncertain || field.confidence < uncertainBelow;
  const shown = state.action === "edit" ? state.value : field.value;
  const differs = Boolean(field.existing) && field.existing!.trim().toLowerCase() !== shown.trim().toLowerCase();
  const textual = field.entity === "LEAD" || LONG_KEYS.has(field.key);

  const set = (patch: Partial<RowState>) => onChange({ ...state, ...patch });

  return (
    <li
      className={cn(
        "min-w-0 space-y-2 rounded-md border p-3",
        state.action === "reject" && "border-line bg-surface-2",
        state.action !== "reject" && uncertain && state.action === "pending" && "border-caution",
        state.action !== "reject" && !(uncertain && state.action === "pending") && "border-line"
      )}
      data-testid={`field-${field.key}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs font-semibold text-text-secondary">{field.label}</span>
        <span className="inline-flex items-center gap-1 text-xs text-signal-text">
          <Sparkles size={14} />
          <span className="font-semibold">AI</span> · <span className="font-mono">{Math.round(field.confidence * 100)}%</span> sure
        </span>
        <span className="ml-auto">
          {uncertain && state.action === "pending" && <StatusBadge tone="caution">Check this</StatusBadge>}
          {state.action === "accept" && <StatusBadge tone="positive">Confirmed</StatusBadge>}
          {state.action === "edit" && <StatusBadge tone="neutral">Edited by you</StatusBadge>}
          {state.action === "reject" && <StatusBadge tone="neutral">Rejected</StatusBadge>}
        </span>
      </div>

      {editing ? (
        textual ? (
          <Textarea aria-label={`Edit ${field.label}`} rows={3} value={state.value} onChange={(e) => set({ value: e.target.value })} autoFocus />
        ) : (
          <Input aria-label={`Edit ${field.label}`} value={state.value} onChange={(e) => set({ value: e.target.value })} autoFocus />
        )
      ) : (
        <p className={cn("break-words text-base font-medium text-text-primary", state.action === "reject" && "text-text-muted line-through")}>
          {shown || <span className="text-text-muted">(empty)</span>}
        </p>
      )}

      <p className="text-xs text-text-muted">{field.origin}</p>
      {field.warning && <p className="text-xs font-semibold text-caution">{field.warning}</p>}

      {differs && state.action !== "reject" && (
        <div className="space-y-1 rounded-sm bg-field p-3 text-xs text-text-secondary">
          <p className="break-words">
            Already on the profile: <strong className="text-text-primary">{field.existing}</strong>
          </p>
          <label className="flex min-h-9 cursor-pointer items-center gap-2">
            <Checkbox checked={state.overwrite} disabled={disabled} onCheckedChange={(v) => set({ overwrite: v === true })} />
            Replace it with this value
          </label>
        </div>
      )}

      {!disabled && (
        <div className="flex flex-wrap gap-2 pt-1">
          {editing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-10 flex-1 sm:h-8 sm:flex-none"
                onClick={() => {
                  setEditing(false);
                  if (!state.value.trim()) set({ action: "reject" });
                  else set({ action: state.value.trim() === field.value ? "accept" : "edit", overwrite: state.overwrite || state.value.trim() !== field.value });
                }}
              >
                <Check /> Done
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-10 flex-1 sm:h-8 sm:flex-none" onClick={() => { setEditing(false); set({ value: field.value, action: "pending" }); }}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button type="button" size="sm" variant="secondary" className="h-10 flex-1 aria-pressed:border-positive aria-pressed:bg-positive-tint aria-pressed:text-positive sm:h-8 sm:flex-none" aria-pressed={state.action === "accept"} aria-label={`Confirm ${field.label}`} onClick={() => set({ action: "accept" })}>
                <Check /> Confirm
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-10 flex-1 sm:h-8 sm:flex-none" aria-label={`Edit ${field.label}`} onClick={() => { setEditing(true); set({ value: state.action === "edit" ? state.value : field.value }); }}>
                <Pencil /> Edit
              </Button>
              <Button type="button" size="sm" variant={state.action === "reject" ? "destructive" : "ghost"} className="h-10 flex-1 sm:h-8 sm:flex-none" aria-pressed={state.action === "reject"} aria-label={`Reject ${field.label}`} onClick={() => set({ action: "reject" })}>
                <X /> Reject
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
