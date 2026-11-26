import { useEffect, useState } from "react";
import { Loader2, Search } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { listCompanies, listPeople } from "@/lib/api/profiles";

export interface PickedEntity {
  id: string;
  name: string;
  detail: string;
}

/**
 * Search-as-you-type picker for a company or a person, used inside dialogs.
 * Results are listed under the box; picking one calls onPick.
 */
export function EntityPicker({
  kind,
  onPick,
  excludeId,
  placeholder,
  autoFocus,
}: {
  kind: "company" | "person";
  onPick: (e: PickedEntity) => void;
  excludeId?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PickedEntity[]>([]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        if (kind === "company") {
          const page = await listCompanies({ search: q, page_size: 8 });
          if (alive) setResults(page.items.map((c) => ({ id: c.id, name: c.name, detail: [c.industry, c.district].filter(Boolean).join(" · ") })));
        } else {
          const page = await listPeople({ search: q, page_size: 8 });
          if (alive) setResults(page.items.map((p) => ({ id: p.id, name: p.full_name, detail: [p.title, p.company_name].filter(Boolean).join(" · ") })));
        }
      } catch {
        if (alive) setResults([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, kind]);

  const shown = results.filter((r) => r.id !== excludeId);
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <Input
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder ?? (kind === "company" ? "Search companies" : "Search people")}
          className="pl-9"
          aria-label={kind === "company" ? "Search companies" : "Search people"}
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-text-muted" />}
      </div>
      <ul className="max-h-56 divide-y divide-line overflow-y-auto rounded-md border border-line">
        {shown.length === 0 && !loading && <li className="px-3 py-3 text-sm text-text-muted">No matches</li>}
        {shown.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => onPick(r)} className="block w-full min-w-0 px-3 py-2 text-left hover:bg-surface-2 focus-visible:bg-surface-2">
              <span className="block truncate text-sm font-semibold text-text-primary">{r.name}</span>
              {r.detail && <span className="block truncate text-xs text-text-muted">{r.detail}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
