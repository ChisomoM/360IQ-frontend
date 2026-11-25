import { useState } from "react";
import { Check, Pencil, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
        "min-w-0 space-y-2 rounded-lg border p-3",
        state.action === "reject" && "border-line bg-surface-2 opacity-70",
        state.action !== "reject" && uncertain && state.action === "pending" && "border-caution bg-caution-tint",
        state.action !== "reject" && !(uncertain && state.action === "pending") && "border-line bg-surface-1"
      )}
      data-testid={`field-${field.key}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">{field.label}</span>
        <span className="inline-flex items-center gap-1 text-xs text-caution">
          <Sparkles className="h-3 w-3" />
          <span className="font-semibold">AI</span> · {Math.round(field.confidence * 100)}% sure
        </span>
        {uncertain && state.action === "pending" && <span className="rounded-sm bg-caution px-1.5 py-0.5 text-xs font-semibold text-on-signal">Check this</span>}
        {state.action === "accept" && <span className="text-xs font-semibold text-positive">Confirmed</span>}
        {state.action === "edit" && <span className="text-xs font-semibold text-signal-text">Edited by you</span>}
        {state.action === "reject" && <span className="text-xs font-semibold text-text-muted">Rejected</span>}
      </div>

      {editing ? (
        textual ? (
          <Textarea aria-label={`Edit ${field.label}`} rows={3} value={state.value} onChange={(e) => set({ value: e.target.value })} autoFocus />
        ) : (
          <Input aria-label={`Edit ${field.label}`} value={state.value} onChange={(e) => set({ value: e.target.value })} autoFocus />
        )
      ) : (
        <p className={cn("break-words text-base text-text-primary", state.action === "reject" && "line-through")}>{shown || <span className="italic text-text-muted">(empty)</span>}</p>
      )}

      <p className="text-xs text-text-muted">{field.origin}</p>
      {field.warning && <p className="text-xs font-medium text-caution">{field.warning}</p>}

      {differs && state.action !== "reject" && (
        <div className="space-y-1 rounded-md bg-surface-2 p-2 text-xs text-text-secondary">
          <p className="break-words">
            Already on the profile: <strong className="text-text-primary">{field.existing}</strong>
          </p>
          <label className="flex min-h-9 cursor-pointer items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-signal" checked={state.overwrite} disabled={disabled} onChange={(e) => set({ overwrite: e.target.checked })} />
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
                className="h-10 flex-1 sm:flex-none"
                onClick={() => {
                  setEditing(false);
                  if (!state.value.trim()) set({ action: "reject" });
                  else set({ action: state.value.trim() === field.value ? "accept" : "edit", overwrite: state.overwrite || state.value.trim() !== field.value });
                }}
              >
                <Check className="h-4 w-4" /> Done
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-10 flex-1 sm:flex-none" onClick={() => { setEditing(false); set({ value: field.value, action: "pending" }); }}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button type="button" size="sm" variant={state.action === "accept" ? "default" : "outline"} className="h-10 flex-1 sm:flex-none" aria-pressed={state.action === "accept"} aria-label={`Confirm ${field.label}`} onClick={() => set({ action: "accept" })}>
                <Check className="h-4 w-4" /> Confirm
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-10 flex-1 sm:flex-none" aria-label={`Edit ${field.label}`} onClick={() => { setEditing(true); set({ value: state.action === "edit" ? state.value : field.value }); }}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button type="button" size="sm" variant={state.action === "reject" ? "destructive" : "outline"} className="h-10 flex-1 sm:flex-none" aria-pressed={state.action === "reject"} aria-label={`Reject ${field.label}`} onClick={() => set({ action: "reject" })}>
                <X className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
