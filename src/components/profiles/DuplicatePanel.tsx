import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, reasonText } from "./ui";
import type { MatchResult } from "@/types/profile";

/**
 * Shown when a new record looks like an existing one. The user either opens the
 * existing record or confirms that this is a different one and creates it anyway.
 */
export function DuplicatePanel({
  match,
  entity,
  busy,
  onCreateAnyway,
}: {
  match: MatchResult;
  entity: "person" | "company";
  busy?: boolean;
  onCreateAnyway: () => void;
}) {
  const base = entity === "person" ? "/admin/people" : "/admin/companies";
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  return (
    <div ref={ref} className="space-y-3 rounded-lg border border-caution bg-caution-tint p-3 text-caution" role="alert">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-sm font-semibold">This looks like a record you already have.</p>
      </div>
      <ul className="space-y-2">
        {match.candidates.map((c) => (
          <li key={c.id} className="min-w-0 rounded-md bg-surface-1 p-2.5 text-text-primary">
            <p className="break-words text-sm font-medium">{c.label}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {c.reasons.map((r) => (
                <Pill key={r}>{reasonText(r)}</Pill>
              ))}
            </div>
            <Link to={`${base}/${c.id}`} className="mt-1.5 inline-block text-sm font-medium text-signal-text hover:underline" target="_blank" rel="noreferrer">
              Open existing record
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={busy} onClick={onCreateAnyway} className="whitespace-normal">
          {busy ? "Creating…" : "This is different, create anyway"}
        </Button>
      </div>
    </div>
  );
}
