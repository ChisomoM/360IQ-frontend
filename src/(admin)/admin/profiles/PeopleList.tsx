import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, Users } from "@/components/icons";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { listPeople } from "@/lib/api/profiles";
import type { Person } from "@/types/profile";
import { MaskedNotice, Pager, Pill, BUYING_ROLE_VARIANT, initials, labelOf, useProfileMeta } from "@/components/profiles/ui";
import { Field } from "@/components/profiles/formParts";
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
      <div className="flex w-full min-w-0 flex-col gap-5">
        <PageHeader
          title="People"
          description="Everyone you know across your companies, with where each detail came from."
          actions={
            meta?.permissions.manage && (
              <Button onClick={() => setAdding(true)}>
                <Plus /> Add person
              </Button>
            )
          }
        />

        {masked && <MaskedNotice />}

        <SectionCard>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_14rem_14rem]">
            <Field label="Search" htmlFor="people-search" className="sm:col-span-2 lg:col-span-1">
              <div className="relative min-w-0">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input id="people-search" aria-label="Search people" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, title or company" className="pl-9" />
              </div>
            </Field>
            <Field label="Buying role">
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
            </Field>
            <Field label="Seniority">
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
            </Field>
          </div>
        </SectionCard>

        <SectionCard padded={false}>
          <SectionBody
            loading={loading}
            skeleton={<TableSkeleton rows={6} columns={4} />}
            isEmpty={items.length === 0}
            empty={
              <EmptyState
                icon={<Users size={24} />}
                title={debounced || role !== ALL || seniority !== ALL ? "No one matches" : "No people yet"}
                description={debounced || role !== ALL || seniority !== ALL ? "Try a different search or clear the filters." : "Add the first person, or capture one from a card or form."}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead>Buying role</TableHead>
                  <TableHead className="hidden lg:table-cell">Email</TableHead>
                  <TableHead className="hidden xl:table-cell">Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => {
                  const roleText = [p.title, p.company_name].filter(Boolean).join(" at ");
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link to={`/admin/people/${p.id}`} className="flex min-h-10 min-w-0 items-center gap-3">
                          <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-pill bg-surface-2 text-xs font-semibold text-text-secondary sm:grid">{initials(p.full_name)}</span>
                          <span className="min-w-0">
                            <span className="block break-words font-semibold text-text-primary">{p.full_name}</span>
                            <span className="block break-words text-xs font-normal text-text-muted md:hidden">{roleText || "No role recorded"}</span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden break-words text-[13px] text-text-secondary md:table-cell">{roleText || <span className="text-text-muted">No role recorded</span>}</TableCell>
                      <TableCell>{p.buying_role ? <Pill variant={BUYING_ROLE_VARIANT[p.buying_role] ?? "neutral"}>{labelOf(p.buying_role)}</Pill> : <span className="text-xs text-text-muted">Not set</span>}</TableCell>
                      <TableCell className="hidden break-all text-[13px] text-text-secondary lg:table-cell">{p.email || <span className="text-text-muted">Not known yet</span>}</TableCell>
                      <TableCell className="hidden whitespace-nowrap font-mono text-xs text-text-secondary xl:table-cell">{p.phone || <span className="text-text-muted">Not known yet</span>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </SectionBody>
          <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </SectionCard>
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
