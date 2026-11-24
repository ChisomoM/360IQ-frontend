import { Link } from "react-router-dom";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, reasonText } from "@/components/profiles/ui";
import type { EntityChoice } from "@/types/capture";
import type { MatchResult } from "@/types/profile";

/**
 * ProfileIQ duplicate matches for a person or company, with the three choices:
 * link to an existing record (its profile is updated, nothing new is created),
 * or create a new one. Linking is how a card and a later voice debrief end up on
 * one profile. Merging two profiles that already exist stays on the profile page.
 */
export function MatchChoice({
  entity,
  match,
  choice,
  onChange,
  attention,
}: {
  entity: "person" | "company";
  match: MatchResult | null;
  choice: EntityChoice;
  onChange: (c: EntityChoice) => void;
  attention?: boolean;
}) {
  const noun = entity === "person" ? "person" : "company";
  const base = entity === "person" ? "/admin/people" : "/admin/companies";
  if (!match || match.candidates.length === 0) return null;
  const strong = match.level === "STRONG";
  const needsChoice = !choice.action;

  return (
    <fieldset
      className={cn(
        "space-y-2 rounded-lg border p-3",
        needsChoice || attention ? "border-caution bg-caution-tint" : "border-line bg-surface-1"
      )}
    >
      <legend className="sr-only">Existing {noun} records</legend>
      <div className="flex items-start gap-2 text-sm font-semibold text-text-primary">
        <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", needsChoice ? "text-caution" : "text-text-muted")} />
        <span>{strong ? `This ${noun} is already in 360IQ.` : `This ${noun} may already be in 360IQ.`} Choose what to do.</span>
      </div>
      <ul className="space-y-2">
        {match.candidates.map((c) => {
          const selected = choice.action === "link" && choice.id === c.id;
          return (
            <li key={c.id}>
              <label
                className={cn(
                  "flex min-h-12 cursor-pointer items-start gap-3 rounded-md border bg-surface-1 p-3 text-sm",
                  selected ? "border-signal ring-1 ring-signal" : "border-line"
                )}
              >
                <input
                  type="radio"
                  name={`${entity}-choice`}
                  className="mt-1 h-4 w-4 shrink-0 accent-signal"
                  checked={selected}
                  onChange={() => onChange({ action: "link", id: c.id })}
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-medium text-text-primary">Link to {c.label.replace(/^(Matches existing record|Possible duplicate of) /, "").replace(/\.$/, "")}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {c.reasons.map((r) => (
                      <Pill key={r}>{reasonText(r)}</Pill>
                    ))}
                  </span>
                  <Link to={`${base}/${c.id}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-signal-text hover:underline">
                    Open existing record <ExternalLink className="h-3 w-3" />
                  </Link>
                </span>
              </label>
            </li>
          );
        })}
        {!strong && (
        <li>
          <label
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-3 rounded-md border bg-surface-1 p-3 text-sm",
              choice.action === "create" ? "border-signal ring-1 ring-signal" : "border-line"
            )}
          >
            <input type="radio" name={`${entity}-choice`} className="h-4 w-4 shrink-0 accent-signal" checked={choice.action === "create"} onChange={() => onChange({ action: "create" })} />
            <span className="font-medium text-text-primary">This is a different {noun}: create a new one</span>
          </label>
        </li>
        )}
      </ul>
    </fieldset>
  );
}
