import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { listCompanies, listPeople, mergeRecords } from "@/lib/api/profiles";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, reasonText } from "@/components/profiles/ui";
import type { EntityChoice } from "@/types/capture";
import type { MatchResult } from "@/types/profile";

/**
 * ProfileIQ duplicate matches for a person or company, with the three choices:
 * link to an existing record (its profile is updated, nothing new is created),
 * or create a new one. Linking is how a card and a later voice debrief end up on
 * one profile. Two existing candidates that are really one record can be merged here
 * (needs profiles.merge), and a record that is not listed can be picked by search.
 * The line under the list always says where the capture will be saved.
 */
export function MatchChoice({
  entity,
  match,
  choice,
  onChange,
  attention,
  canMerge,
  onMerged,
}: {
  entity: "person" | "company";
  match: MatchResult | null;
  choice: EntityChoice;
  onChange: (c: EntityChoice) => void;
  attention?: boolean;
  canMerge?: boolean;
  onMerged?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ id: string; name: string }[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [merging, setMerging] = useState(false);
  const [survivor, setSurvivor] = useState<string>("");
  const noun = entity === "person" ? "person" : "company";
  const base = entity === "person" ? "/admin/people" : "/admin/companies";
  if (!match || match.candidates.length === 0) return null;
  const strong = match.level === "STRONG";
  const top = match.candidates.slice(0, 2);
  const target =
    choice.action === "link"
      ? (match.candidates.find((c) => c.id === choice.id)?.name ?? found?.find((f) => f.id === choice.id)?.name ?? "the record you picked")
      : choice.action === "create"
        ? `a new ${noun}`
        : choice.action === "skip"
          ? `no ${noun}`
          : null;

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res =
        entity === "person"
          ? (await listPeople({ search: query.trim(), page_size: 8 })).items.map((p) => ({ id: p.id, name: p.full_name }))
          : (await listCompanies({ search: query.trim(), page_size: 8 })).items.map((c) => ({ id: c.id, name: c.name }));
      setFound(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const merge = async () => {
    const keep = survivor || top[0].id;
    const other = top.find((c) => c.id !== keep);
    if (!other) return;
    setMerging(true);
    try {
      await mergeRecords(entity === "person" ? "PERSON" : "COMPANY", keep, other.id);
      toast.success("The two records were merged. You can undo this from the history of the kept record.");
      onChange({ action: "" });
      onMerged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not merge these records");
    } finally {
      setMerging(false);
    }
  };
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
      </ul>

      {canMerge && top.length === 2 && (
        <div className="space-y-2 rounded-md border border-line bg-surface-0 p-3 text-sm">
          <p className="font-medium text-text-primary">Are these two existing records the same {noun}?</p>
          <div className="flex flex-wrap gap-3">
            {top.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input type="radio" name={`${entity}-survivor`} className="h-4 w-4 accent-signal" checked={(survivor || top[0].id) === c.id} onChange={() => setSurvivor(c.id)} />
                Keep {c.name}
              </label>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" disabled={merging} onClick={() => void merge()}>
            Merge these two records
          </Button>
        </div>
      )}

      <div className="space-y-2 rounded-md border border-line bg-surface-0 p-3 text-sm">
        <label className="font-medium text-text-primary" htmlFor={`${entity}-search`}>
          Not listed? Find another {noun}
        </label>
        <div className="flex gap-2">
          <input
            id={`${entity}-search`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
            }}
            className="min-h-10 flex-1 rounded-md border border-line bg-surface-1 px-2"
          />
          <Button type="button" variant="outline" size="sm" disabled={searching} onClick={() => void search()}>
            Search
          </Button>
        </div>
        {found && found.length === 0 && <p className="text-xs text-text-muted">Nothing found.</p>}
        {found && found.length > 0 && (
          <ul className="space-y-1">
            {found.map((f) => (
              <li key={f.id}>
                <label className="flex items-center gap-2">
                  <input type="radio" name={`${entity}-choice`} className="h-4 w-4 accent-signal" checked={choice.action === "link" && choice.id === f.id} onChange={() => onChange({ action: "link", id: f.id, pick: true })} />
                  Link to {f.name}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className={cn("text-sm font-medium", target ? "text-text-primary" : "text-caution")} role="status">
        {target ? `This capture will be saved to: ${target}.` : "Choose where this capture will be saved."}
      </p>
    </fieldset>
  );
}
