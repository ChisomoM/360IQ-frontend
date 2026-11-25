import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Loader2, MapPin, Plus, Search, Users } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCompanies } from "@/lib/api/profiles";
import type { Company } from "@/types/profile";
import { EmptyPanel, MaskedNotice, Pager, Pill, STAGE_VARIANT, labelOf, useProfileMeta } from "@/components/profiles/ui";
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
      <div className="w-full min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-xs font-bold text-text-primary">Companies</h1>
            <p className="text-sm text-text-secondary">What you know about each company, who works there, and where it came from.</p>
          </div>
          {meta?.permissions.manage && (
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add company
            </Button>
          )}
        </div>

        {masked && <MaskedNotice />}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input aria-label="Filter by industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry (exact, for example Mining)" />
          <Input aria-label="Filter by province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Province (exact, for example Copperbelt)" />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_12rem_12rem]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input aria-label="Search companies" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, alias, domain or industry" className="pl-9" />
          </div>
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
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        ) : items.length === 0 ? (
          <EmptyPanel icon={<Building2 className="h-10 w-10" />} title={filtered ? "No company matches" : "No companies yet"}>
            {filtered ? "Try a different search or clear the filters." : "Add the first company to start building what you know about it."}
          </EmptyPanel>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/admin/companies/${c.id}`}
                  className="flex min-w-0 items-start gap-3 rounded-xl border border-line bg-surface-1 p-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-secondary">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-medium text-text-primary">{c.name}</span>
                    <span className="block break-words text-sm text-text-secondary">
                      {[c.industry, c.size_band && `${c.size_band} people`].filter(Boolean).join(" · ") || <span className="italic text-text-muted">Industry and size not known yet</span>}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      {(c.district || c.province) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {[c.district, c.province].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {c.domain && <span className="break-all">{c.domain}</span>}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <Pill variant={STAGE_VARIANT[c.relationship_stage] ?? "neutral"}>{labelOf(c.relationship_stage)}</Pill>
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                      <Users className="h-3 w-3" /> {c.people_count}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </div>

      <CompanyFormDialog open={adding} onOpenChange={setAdding} meta={meta} onSaved={(c) => navigate(`/admin/companies/${c.id}`)} />
    </PageTransition>
  );
}

export default CompaniesList;
