import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "@/components/icons";
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
    <div ref={ref} className="space-y-3 rounded-md border border-caution bg-caution-tint p-3" role="alert">
      <div className="flex items-start gap-2 text-caution">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <p className="text-sm font-semibold">This looks like a record you already have.</p>
      </div>
      <ul className="space-y-2">
        {match.candidates.map((c) => (
          <li key={c.id} className="min-w-0 rounded-sm bg-surface-1 p-3 text-text-primary">
            <p className="break-words text-sm font-semibold">{c.label}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
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
        <Button type="button" variant="secondary" disabled={busy} onClick={onCreateAnyway} className="h-auto min-h-10 whitespace-normal">
          {busy ? "Creating…" : "Create anyway, it is different"}
        </Button>
      </div>
    </div>
  );
}
