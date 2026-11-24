import { useState, type ReactNode } from "react";
import { EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { labelOf } from "./ui";

const NONE = "__none";

export function Field({ label, htmlFor, children, className, hint }: { label: string; htmlFor?: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <div className={`min-w-0 space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={htmlFor} className="text-sm">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Not set",
  format = labelOf,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  format?: (v: string) => string;
}) {
  const opts = value && !options.includes(value) ? [value, ...options] : options; // keep a legacy value selectable
  return (
    <Field label={label}>
      <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{placeholder}</SelectItem>
          {opts.map((o) => (
            <SelectItem key={o} value={o}>
              {format(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/**
 * A text input for a value the viewer may not be allowed to see. When the saved
 * value is masked it is shown as masked and read-only; "Replace" lets the user
 * type a new value. The masked text itself is never sent back (the server also
 * refuses it).
 */
export function SensitiveField({
  label,
  id,
  value,
  masked,
  hasSavedValue,
  onChange,
  multiline,
  type = "text",
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  masked: boolean;
  hasSavedValue: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const [replacing, setReplacing] = useState(false);
  const locked = masked && hasSavedValue && !replacing;
  return (
    <Field label={label} htmlFor={id}>
      {locked ? (
        <div className="flex items-center gap-2 rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-text-muted">
          <EyeOff className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{value}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 px-2"
            onClick={() => {
              setReplacing(true);
              onChange("");
            }}
          >
            Replace
          </Button>
        </div>
      ) : multiline ? (
        <Textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </Field>
  );
}
