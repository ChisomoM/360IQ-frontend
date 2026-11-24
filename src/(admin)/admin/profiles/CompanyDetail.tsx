import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Building2, FileText, Gem, GitMerge, Handshake, Link2, Loader2, MapPin, ScrollText, Trash2, Users, Edit2 } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchData } from "@/lib/api/crud";
import {
  confirmFieldValue,
  getCompany,
  linkCompanyDocument,
  listCompanyDocuments,
  listCompanyPeople,
  listCompanyPlaceholder,
  unlinkCompanyDocument,
} from "@/lib/api/profiles";
import type { Company, CompanyLink, LinkedDocument } from "@/types/profile";
import {
  EmptyPanel,
  FieldRow,
  MaskedNotice,
  Panel,
  Pill,
  STAGE_VARIANT,
  TabBar,
  fmtDate,
  labelOf,
  useProfileMeta,
} from "@/components/profiles/ui";
import { CompanyFormDialog } from "@/components/profiles/CompanyFormDialog";
import { PersonFormDialog } from "@/components/profiles/PersonFormDialog";
import { Timeline } from "@/components/profiles/Timeline";
import { MergeDialog, MergeHistory } from "@/components/profiles/MergeParts";

type Tab = "overview" | "people" | "timeline" | "deals" | "contracts" | "documents" | "valueiq";

const SENSITIVE = new Set(["phone", "email", "notes", "background_notes", "reputation_notes", "tax_number"]);

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meta = useProfileMeta();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [merging, setMerging] = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setCompany(await getCompany(id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load this company");
      navigate("/admin/companies", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    setLoading(true);
    setTab("overview");
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
    setReload((n) => n + 1);
  }, [load]);

  if (loading || !company) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-16 w-full max-w-md" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const can = meta?.permissions;
  const canManage = Boolean(can?.manage);
  const masked = company.sensitive_masked;

  return (
    <PageTransition>
      <div className="w-full min-w-0 space-y-5">
        <div className="flex items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/companies")} className="h-8 px-2 text-text-muted">
            <ArrowLeft className="mr-1 h-4 w-4" /> Companies
          </Button>
          <span className="text-line-strong">/</span>
          <span className="min-w-0 truncate font-medium text-text-primary">{company.name}</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-text-secondary">
              <Building2 className="h-7 w-7" />
            </span>
            <div className="min-w-0">
              <h1 className="break-words font-display text-display-xs font-bold text-text-primary">{company.name}</h1>
              <p className="break-words text-sm text-text-secondary">
                {[company.industry, company.size_band && `${company.size_band} people`, [company.district, company.province].filter(Boolean).join(", ")].filter(Boolean).join(" · ") ||
                  "Industry, size and location not known yet"}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <Pill variant={STAGE_VARIANT[company.relationship_stage] ?? "neutral"}>{labelOf(company.relationship_stage)}</Pill>
                {company.domain && <Pill>{company.domain}</Pill>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4" /> Edit
              </Button>
            )}
            {can?.merge && (
              <Button variant="outline" onClick={() => setMerging(true)}>
                <GitMerge className="h-4 w-4" /> Merge duplicate
              </Button>
            )}
          </div>
        </div>

        {masked && <MaskedNotice />}

        <TabBar<Tab>
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "people", label: "People", count: company.people_count },
            { id: "timeline", label: "Timeline" },
            { id: "deals", label: "Deals" },
            { id: "contracts", label: "Contracts" },
            { id: "documents", label: "Documents" },
            { id: "valueiq", label: "ValueIQ" },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === "overview" && <OverviewTab company={company} canManage={canManage} canMerge={Boolean(can?.merge)} reload={reload} onChanged={refresh} />}
        {tab === "people" && <PeopleTab companyId={company.id} canManage={canManage} reload={reload} onAdd={() => setAddingPerson(true)} />}
        {tab === "timeline" && <Timeline entity="company" id={company.id} canManage={canManage} kinds={meta?.interaction_kinds ?? ["NOTE"]} reloadKey={reload} />}
        {tab === "deals" && <PlaceholderTab kind="deals" companyId={company.id} />}
        {tab === "contracts" && <PlaceholderTab kind="contracts" companyId={company.id} />}
        {tab === "documents" && <DocumentsTab companyId={company.id} canRead={Boolean(can?.documents_read)} canManage={canManage} />}
        {tab === "valueiq" && (
          <EmptyPanel icon={<Gem className="h-10 w-10" />} title="ValueIQ is not connected yet">
            When ValueIQ is switched on, the value of the relationship with {company.name} will be shown here. Nothing is estimated in the meantime.
          </EmptyPanel>
        )}
      </div>

      <CompanyFormDialog open={editing} onOpenChange={setEditing} company={company} meta={meta} onSaved={() => void refresh()} />
      <MergeDialog open={merging} onOpenChange={setMerging} entity="COMPANY" survivor={{ id: company.id, name: company.name }} onMerged={() => void refresh()} />
      <PersonFormDialog
        open={addingPerson}
        onOpenChange={setAddingPerson}
        meta={meta}
        defaultCompany={{ id: company.id, name: company.name }}
        onSaved={() => void refresh()}
      />
    </PageTransition>
  );
}

// ─── Overview: what we know so far ───────────────────────────────────────────

function OverviewTab({ company, canManage, canMerge, reload, onChanged }: { company: Company; canManage: boolean; canMerge: boolean; reload: number; onChanged: () => void }) {
  const src = company.provenance ?? [];
  const masked = company.sensitive_masked;
  const confirm = async (sourceId: string) => {
    try {
      await confirmFieldValue(sourceId);
      toast.success("Value confirmed");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm");
    }
  };
  const row = (label: string, field: string, value: string, display?: ReactNode) => (
    <FieldRow label={label} field={field} value={value} display={display} sources={src} canConfirm={canManage && !(masked && SENSITIVE.has(field))} onConfirm={confirm} />
  );

  const missing = useMemo(() => {
    const checks: [string, boolean][] = [
      ["Domain", !company.domain],
      ["Industry", !company.industry],
      ["Size", !company.size_band],
      ["Location", !company.province && !company.district && !company.address],
      ["Background", !company.background_notes],
      ["Reputation", !company.reputation_notes],
      ["People", company.people_count === 0],
    ];
    return checks.filter(([, m]) => m).map(([l]) => l);
  }, [company]);

  return (
    <div className="space-y-4">
      <Panel title="Not known yet">
        {missing.length === 0 ? (
          <p className="text-sm text-text-secondary">The basics are all filled in.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <Pill key={m} variant="caution">
                {m}
              </Pill>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="About">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {row("Name", "name", company.name)}
          {row("Legal name", "legal_name", company.legal_name)}
          {row(
            "Also known as",
            "aliases",
            company.aliases.join(", "),
            company.aliases.length ? (
              <span className="flex flex-wrap gap-1">
                {company.aliases.map((a) => (
                  <Pill key={a}>{a}</Pill>
                ))}
              </span>
            ) : undefined
          )}
          {row("Domain", "domain", company.domain)}
          {row("Website", "website", company.website)}
          {row("Industry", "industry", company.industry)}
          {row("Size", "size_band", company.size_band, company.size_band ? `${company.size_band} people` : undefined)}
          {row("Relationship stage", "lifecycle_stage", company.relationship_stage, company.relationship_stage ? labelOf(company.relationship_stage) : undefined)}
          {row(
            "Part of",
            "parent",
            company.parent_name,
            company.parent_id ? (
              <Link className="text-signal-text hover:underline" to={`/admin/companies/${company.parent_id}`}>
                {company.parent_name || "Parent company"}
              </Link>
            ) : undefined
          )}
          {row("Phone", "phone", company.phone)}
          {row("Email", "email", company.email)}
        </div>
      </Panel>

      <Panel title="Location and sites">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {row("Address", "address", company.address)}
          {row("District", "district", company.district)}
          {row("Province", "province", company.province)}
          {row("Country", "country", company.country)}
        </div>
        {company.sites.length > 0 && (
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {company.sites.map((s, i) => (
              <li key={i} className="flex min-w-0 items-start gap-2 rounded-lg border border-line p-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
                <span className="min-w-0 break-words">
                  <span className="font-medium text-text-primary">{s.name || "Site"}</span>
                  <span className="block text-text-secondary">{[s.address, s.district, s.province].filter(Boolean).join(", ")}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Background and reputation">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4">
          {row("Background", "background_notes", company.background_notes)}
          {row("Reputation", "reputation_notes", company.reputation_notes)}
          {row("Other notes", "notes", company.notes)}
        </div>
      </Panel>

      {canMerge && (
        <Panel title="Merge history">
          <MergeHistory entity="COMPANY" id={company.id} canMerge reloadKey={reload} onChanged={onChanged} />
        </Panel>
      )}
    </div>
  );
}

// ─── People ──────────────────────────────────────────────────────────────────

function PeopleTab({ companyId, canManage, reload, onAdd }: { companyId: string; canManage: boolean; reload: number; onAdd: () => void }) {
  const [links, setLinks] = useState<CompanyLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [former, setFormer] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listCompanyPeople(companyId, former)
      .then((l) => alive && setLinks(l))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load people"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [companyId, former, reload]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={former} onChange={(e) => setFormer(e.target.checked)} className="h-4 w-4 accent-[var(--signal)]" />
          Include former employees
        </label>
        {canManage && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Users className="h-4 w-4" /> Add person here
          </Button>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : links.length === 0 ? (
        <EmptyPanel icon={<Users className="h-10 w-10" />} title="No people recorded here">
          People appear once someone is linked to this company.
        </EmptyPanel>
      ) : (
        <ul className="space-y-2">
          {links.map((l) => (
            <li key={l.id}>
              <Link to={`/admin/people/${l.person_id}`} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-1 p-3 hover:bg-surface-2">
                <span className="min-w-0">
                  <span className="block break-words font-medium text-text-primary">{l.person_name}</span>
                  <span className="block break-words text-sm text-text-secondary">{l.title || "No title recorded"}</span>
                  <span className="block text-xs text-text-muted">
                    {l.start_date ? fmtDate(l.start_date) : "start date not known"} – {l.end_date ? fmtDate(l.end_date) : "present"}
                  </span>
                </span>
                {!l.active && <Pill>Former</Pill>}
                {l.active && l.is_primary && <Pill variant="signal">Main company</Pill>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Deals and contracts: honest empty states ────────────────────────────────

function PlaceholderTab({ kind, companyId }: { kind: "deals" | "contracts"; companyId: string }) {
  const [state, setState] = useState<{ items: unknown[]; available: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    listCompanyPlaceholder(kind, companyId)
      .then((r) => alive && setState({ items: r.items, available: r.module_available }))
      .catch(() => alive && setState({ items: [], available: false }));
    return () => {
      alive = false;
    };
  }, [kind, companyId]);
  const noun = kind === "deals" ? "Deals" : "Contracts";
  if (!state) return <Loader2 className="h-5 w-5 animate-spin text-text-muted" />;
  return (
    <EmptyPanel icon={kind === "deals" ? <Handshake className="h-10 w-10" /> : <ScrollText className="h-10 w-10" />} title={`No ${kind} to show`}>
      {noun} are not tracked in 360IQ yet, so there is nothing to list for this company. They will appear here once they are.
    </EmptyPanel>
  );
}

// ─── Documents ───────────────────────────────────────────────────────────────

interface DocOption {
  id: string;
  title: string;
  document_type?: string;
}

function DocumentsTab({ companyId, canRead, canManage }: { companyId: string; canRead: boolean; canManage: boolean }) {
  const [docs, setDocs] = useState<LinkedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setDocs(await listCompanyDocuments(companyId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load documents");
    } finally {
      setLoading(false);
    }
  }, [companyId, canRead]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canRead) {
    return (
      <EmptyPanel icon={<FileText className="h-10 w-10" />} title="Documents are hidden for your role">
        You need access to documents to see the ones linked to this company.
      </EmptyPanel>
    );
  }

  const unlink = async (d: LinkedDocument) => {
    try {
      await unlinkCompanyDocument(companyId, d.id);
      toast.success("Document unlinked");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not unlink");
    }
  };

  return (
    <div className="space-y-3">
      {canManage && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setLinking(true)}>
            <Link2 className="h-4 w-4" /> Link a document
          </Button>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : docs.length === 0 ? (
        <EmptyPanel icon={<FileText className="h-10 w-10" />} title="No documents linked">
          Link existing documents to keep them with this company. You only see documents you already have access to.
        </EmptyPanel>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface-1 p-3">
              <button type="button" onClick={() => navigate(`/admin/documents/${d.id}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-text-secondary">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-sm font-medium text-text-primary">{d.title}</span>
                  <span className="block text-xs text-text-muted">
                    {labelOf(d.document_type)} · linked {fmtDate(d.linked_at)}
                  </span>
                </span>
              </button>
              {canManage && (
                <Button variant="ghost" size="icon" aria-label={`Unlink ${d.title}`} onClick={() => void unlink(d)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <LinkDocumentDialog
        open={linking}
        onOpenChange={setLinking}
        linkedIds={new Set(docs.map((d) => d.id))}
        onPick={async (docId) => {
          try {
            setDocs(await linkCompanyDocument(companyId, docId));
            toast.success("Document linked");
            setLinking(false);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not link the document");
          }
        }}
      />
    </div>
  );
}

function LinkDocumentDialog({ open, onOpenChange, linkedIds, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; linkedIds: Set<string>; onPick: (id: string) => void }) {
  const [all, setAll] = useState<DocOption[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    setQ("");
    setLoading(true);
    fetchData("DOCUMENTS", "GET")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.items ?? []);
        setAll(list.map((d: DocOption) => ({ id: d.id, title: d.title, document_type: d.document_type })));
      })
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, [open]);
  const shown = all.filter((d) => !linkedIds.has(d.id) && d.title.toLowerCase().includes(q.toLowerCase())).slice(0, 30);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Link a document</DialogTitle>
          <DialogDescription>Only documents you can already open are listed.</DialogDescription>
        </DialogHeader>
        <Input aria-label="Search documents" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title" autoFocus />
        <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {loading && <li className="px-3 py-3 text-sm text-text-muted">Loading…</li>}
          {!loading && shown.length === 0 && <li className="px-3 py-3 text-sm text-text-muted">No documents to link</li>}
          {shown.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => onPick(d.id)} className="block w-full min-w-0 px-3 py-2 text-left hover:bg-surface-2">
                <span className="block truncate text-sm font-medium text-text-primary">{d.title}</span>
                {d.document_type && <span className="block text-xs text-text-muted">{labelOf(d.document_type)}</span>}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export default CompanyDetail;
