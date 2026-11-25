import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Plus, Search, Users } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listPeople } from "@/lib/api/profiles";
import type { Person } from "@/types/profile";
import { EmptyPanel, MaskedNotice, Pager, Pill, BUYING_ROLE_VARIANT, initials, labelOf, useProfileMeta } from "@/components/profiles/ui";
import { PersonFormDialog } from "@/components/profiles/PersonFormDialog";

const PAGE_SIZE = 20;
const ALL = "ALL";

export function PeopleList() {
  const navigate = useNavigate();
  const meta = useProfileMeta();
  const [items, setItems] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState(ALL);
  const [seniority, setSeniority] = useState(ALL);
  const [adding, setAdding] = useState(false);
  const [masked, setMasked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPeople({ search: debounced, buying_role: role, seniority, page, page_size: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
      setMasked(res.items.some((p) => p.sensitive_masked));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load people");
    } finally {
      setLoading(false);
    }
  }, [debounced, role, seniority, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageTransition>
      <div className="w-full min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-xs font-bold text-text-primary">People</h1>
            <p className="text-sm text-text-secondary">Everyone you know across your companies, with where each detail came from.</p>
          </div>
          {meta?.permissions.manage && (
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add person
            </Button>
          )}
        </div>

        {masked && <MaskedNotice />}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_12rem_12rem]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input aria-label="Search people" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, title or company" className="pl-9" />
          </div>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Buying role">
              <SelectValue placeholder="Buying role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All buying roles</SelectItem>
              {(meta?.buying_roles ?? []).map((r) => (
                <SelectItem key={r} value={r}>
                  {labelOf(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={seniority}
            onValueChange={(v) => {
              setSeniority(v);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Seniority">
              <SelectValue placeholder="Seniority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All seniority</SelectItem>
              {(meta?.seniority ?? []).map((r) => (
                <SelectItem key={r} value={r}>
                  {labelOf(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        ) : items.length === 0 ? (
          <EmptyPanel icon={<Users className="h-10 w-10" />} title={debounced || role !== ALL || seniority !== ALL ? "No one matches" : "No people yet"}>
            {debounced || role !== ALL || seniority !== ALL ? "Try a different search or clear the filters." : "Add the first person, or capture one from a card or form."}
          </EmptyPanel>
        ) : (
          <ul className="space-y-2">
            {items.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/admin/people/${p.id}`}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-line bg-surface-1 p-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal-tint text-sm font-semibold text-signal-text">{initials(p.full_name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-medium text-text-primary">{p.full_name}</span>
                    <span className="block break-words text-sm text-text-secondary">
                      {[p.title, p.company_name].filter(Boolean).join(" at ") || <span className="italic text-text-muted">No role recorded</span>}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      {p.email && <span className="break-all">{p.email}</span>}
                      {p.phone && <span>{p.phone}</span>}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {p.buying_role && <Pill variant={BUYING_ROLE_VARIANT[p.buying_role] ?? "neutral"}>{labelOf(p.buying_role)}</Pill>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </div>

      <PersonFormDialog
        open={adding}
        onOpenChange={setAdding}
        meta={meta}
        onSaved={(p) => navigate(`/admin/people/${p.id}`)}
      />
    </PageTransition>
  );
}

export default PeopleList;
