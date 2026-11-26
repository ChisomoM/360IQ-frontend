import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Plus, Search } from "@/components/icons";
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
import { listCompanies } from "@/lib/api/profiles";
import type { Company } from "@/types/profile";
import { MaskedNotice, Pager, Pill, STAGE_VARIANT, labelOf, useProfileMeta } from "@/components/profiles/ui";
import { Field } from "@/components/profiles/formParts";
import { CompanyFormDialog } from "@/components/profiles/CompanyFormDialog";

const PAGE_SIZE = 20;
const ALL = "ALL";

export function CompaniesList() {
  const navigate = useNavigate();
  const meta = useProfileMeta();
  const [items, setItems] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [stage, setStage] = useState(ALL);
  const [size, setSize] = useState(ALL);
  const [industry, setIndustry] = useState("");
  const [province, setProvince] = useState("");
  const [dIndustry, setDIndustry] = useState("");
  const [dProvince, setDProvince] = useState("");
  const [adding, setAdding] = useState(false);
  const [masked, setMasked] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDIndustry(industry.trim());
      setDProvince(province.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [industry, province]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCompanies({ search: debounced, relationship_stage: stage, size_band: size, industry: dIndustry, province: dProvince, page, page_size: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
      setMasked(res.items.some((c) => c.sensitive_masked));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load companies");
    } finally {
      setLoading(false);
    }
  }, [debounced, stage, size, dIndustry, dProvince, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = debounced || stage !== ALL || size !== ALL || dIndustry || dProvince;

  return (
    <PageTransition>
      <div className="flex w-full min-w-0 flex-col gap-5">
        <PageHeader
          title="Companies"
          description="What you know about each company, who works there, and where it came from."
          actions={
            meta?.permissions.manage && (
              <Button onClick={() => setAdding(true)}>
                <Plus /> Add company
              </Button>
            )
          }
        />

        {masked && <MaskedNotice />}

        <SectionCard>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_12rem_12rem]">
            <Field label="Search" htmlFor="company-search" className="sm:col-span-2 xl:col-span-1">
              <div className="relative min-w-0">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input id="company-search" aria-label="Search companies" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, alias, domain or industry" className="pl-9" />
              </div>
            </Field>
            <Field label="Industry (exact match)" htmlFor="company-industry">
              <Input id="company-industry" aria-label="Filter by industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Mining" />
            </Field>
            <Field label="Province (exact match)" htmlFor="company-province">
              <Input id="company-province" aria-label="Filter by province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Copperbelt" />
            </Field>
            <Field label="Relationship stage">
              <Select
                value={stage}
                onValueChange={(v) => {
                  setStage(v);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label="Relationship stage">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All stages</SelectItem>
                  {(meta?.relationship_stages ?? []).map((s) => (
                    <SelectItem key={s} value={s}>
                      {labelOf(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Size">
              <Select
                value={size}
                onValueChange={(v) => {
                  setSize(v);
                  setPage(1);
                }}
              >
                <SelectTrigger aria-label="Size">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All sizes</SelectItem>
                  {(meta?.size_bands ?? []).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s} people
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
                icon={<Building2 size={24} />}
                title={filtered ? "No company matches" : "No companies yet"}
                description={filtered ? "Try a different search or clear the filters." : "Add the first company to start building what you know about it."}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="hidden md:table-cell">Industry</TableHead>
                  <TableHead className="hidden xl:table-cell">Size</TableHead>
                  <TableHead className="hidden lg:table-cell">Location</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">People</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link to={`/admin/companies/${c.id}`} className="flex min-h-10 min-w-0 items-center gap-3">
                        <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-sm bg-surface-2 text-text-secondary sm:grid">
                          <Building2 size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block break-words font-semibold text-text-primary">{c.name}</span>
                          {c.domain && <span className="block break-all font-mono text-xs font-normal text-text-muted">{c.domain}</span>}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Pill variant={STAGE_VARIANT[c.relationship_stage] ?? "neutral"}>{labelOf(c.relationship_stage)}</Pill>
                    </TableCell>
                    <TableCell className="hidden text-[13px] text-text-secondary md:table-cell">{c.industry || <span className="text-text-muted">Not known yet</span>}</TableCell>
                    <TableCell className="hidden text-[13px] text-text-secondary xl:table-cell">{c.size_band ? `${c.size_band} people` : <span className="text-text-muted">Not known yet</span>}</TableCell>
                    <TableCell className="hidden text-[13px] text-text-secondary lg:table-cell">
                      {[c.district, c.province].filter(Boolean).join(", ") || <span className="text-text-muted">Not known yet</span>}
                    </TableCell>
                    <TableCell className="hidden text-right font-mono text-xs text-text-secondary sm:table-cell">{c.people_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionBody>
          <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </SectionCard>
      </div>

      <CompanyFormDialog open={adding} onOpenChange={setAdding} meta={meta} onSaved={(c) => navigate(`/admin/companies/${c.id}`)} />
    </PageTransition>
  );
}

export default CompaniesList;
