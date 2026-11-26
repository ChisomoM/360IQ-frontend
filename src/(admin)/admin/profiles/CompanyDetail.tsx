import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, FileText, Gem, GitMerge, Handshake, Link2, MapPin, ScrollText, Trash2, Users, Edit2 } from "@/components/icons";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
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
  FieldRow,
  MaskedNotice,
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
import { SignalsPanel } from "@/components/profiles/SignalsPanel";
import { MergeDialog, MergeHistory } from "@/components/profiles/MergeParts";

type Tab = "overview" | "people" | "timeline" | "signals" | "deals" | "contracts" | "documents" | "valueiq";

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
      <div role="status" aria-busy="true" aria-label="Loading" className="flex w-full flex-col gap-5">
        <div className="skeleton h-9 w-64 max-w-full rounded-md" />
        <div className="skeleton h-10 w-80 max-w-full rounded-lg" />
        <div className="skeleton h-64 w-full rounded-lg" />
      </div>
    );
  }

  const can = meta?.permissions;
  const canManage = Boolean(can?.manage);
  const masked = company.sensitive_masked;

  return (
    <PageTransition>
      <div className="flex w-full min-w-0 flex-col gap-5">
        <div className="space-y-3">
          <PageHeader
            crumb={
              <Link to="/admin/companies" className="inline-flex items-center gap-1 font-medium text-signal-text hover:underline">
                <ArrowLeft size={14} /> Companies
              </Link>
            }
            title={<span className="break-words">{company.name}</span>}
            description={
              [company.industry, company.size_band && `${company.size_band} people`, [company.district, company.province].filter(Boolean).join(", ")].filter(Boolean).join(" · ") ||
              "Industry, size and location not known yet"
            }
            actions={
              (canManage || can?.merge) && (
                <>
                  {canManage && (
                    <Button variant="secondary" onClick={() => setEditing(true)}>
                      <Edit2 /> Edit
                    </Button>
                  )}
                  {can?.merge && (
                    <Button variant="ghost" onClick={() => setMerging(true)}>
                      <GitMerge /> Merge duplicate
                    </Button>
                  )}
                </>
              )
            }
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill variant={STAGE_VARIANT[company.relationship_stage] ?? "neutral"}>{labelOf(company.relationship_stage)}</Pill>
            {company.domain && <span className="break-all font-mono text-xs text-text-muted">{company.domain}</span>}
          </div>
        </div>

        {masked && <MaskedNotice />}

        <TabBar<Tab>
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "people", label: "People", count: company.people_count },
            { id: "timeline", label: "Timeline" },
            { id: "signals", label: "Signals" },
            { id: "deals", label: "Deals" },
            { id: "contracts", label: "Contracts" },
            { id: "documents", label: "Documents" },
            { id: "valueiq", label: "ValueIQ" },
          ]}
          active={tab}
          onChange={setTab}
        >
          {tab === "overview" && <OverviewTab company={company} canManage={canManage} canMerge={Boolean(can?.merge)} reload={reload} onChanged={refresh} />}
          {tab === "people" && <PeopleTab companyId={company.id} canManage={canManage} reload={reload} onAdd={() => setAddingPerson(true)} />}
          {tab === "timeline" && <Timeline entity="company" id={company.id} canManage={canManage} kinds={meta?.interaction_kinds ?? ["NOTE"]} reloadKey={reload} />}
          {tab === "signals" && <SignalsPanel entity="company" id={company.id} />}
          {tab === "deals" && <PlaceholderTab kind="deals" companyId={company.id} />}
          {tab === "contracts" && <PlaceholderTab kind="contracts" companyId={company.id} />}
          {tab === "documents" && <DocumentsTab companyId={company.id} canRead={Boolean(can?.documents_read)} canManage={canManage} />}
          {tab === "valueiq" && (
            <SectionCard padded={false}>
              <EmptyState
                icon={<Gem size={24} />}
                title="ValueIQ is not connected yet"
                description={`When ValueIQ is switched on, the value of the relationship with ${company.name} will be shown here. Nothing is estimated in the meantime.`}
              />
            </SectionCard>
          )}
        </TabBar>
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
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid min-w-0 gap-5">
        <SectionCard title="About">
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
        </SectionCard>

        <SectionCard title="Location and sites">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {row("Address", "address", company.address)}
            {row("District", "district", company.district)}
            {row("Province", "province", company.province)}
            {row("Country", "country", company.country)}
          </div>
          {company.sites.length > 0 && (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {company.sites.map((s, i) => (
                <li key={i} className="flex min-w-0 items-start gap-2 rounded-md border border-line p-3 text-sm">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-text-muted" />
                  <span className="min-w-0 break-words">
                    <span className="font-semibold text-text-primary">{s.name || "Site"}</span>
                    <span className="block text-text-secondary">{[s.address, s.district, s.province].filter(Boolean).join(", ")}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid min-w-0 gap-5">
        <SectionCard title="Not known yet">
          {missing.length === 0 ? (
            <p className="text-sm text-text-secondary">The basics are all filled in.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {missing.map((m) => (
                <Pill key={m}>{m}</Pill>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Background and reputation">
          <div className="grid grid-cols-1 gap-4">
            {row("Background", "background_notes", company.background_notes)}
            {row("Reputation", "reputation_notes", company.reputation_notes)}
            {row("Other notes", "notes", company.notes)}
          </div>
        </SectionCard>

        {canMerge && (
          <SectionCard title="Merge history">
            <MergeHistory entity="COMPANY" id={company.id} canMerge reloadKey={reload} onChanged={onChanged} />
          </SectionCard>
        )}
      </div>
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
    <SectionCard
      title="People"
      padded={false}
      actions={
        <>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <Checkbox checked={former} onCheckedChange={(v) => setFormer(v === true)} />
            Include former employees
          </label>
          {canManage && (
            <Button variant="secondary" size="sm" onClick={onAdd}>
              <Users /> Add person here
            </Button>
          )}
        </>
      }
    >
      <SectionBody
        loading={loading}
        skeleton={<TableSkeleton rows={4} columns={3} />}
        isEmpty={links.length === 0}
        empty={<EmptyState icon={<Users size={24} />} title="No people recorded here" description="People appear once someone is linked to this company." />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Title</TableHead>
              <TableHead className="hidden md:table-cell">Period</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <Link to={`/admin/people/${l.person_id}`} className="flex min-h-10 min-w-0 flex-col justify-center">
                    <span className="break-words font-semibold text-text-primary">{l.person_name}</span>
                    <span className="break-words text-xs font-normal text-text-muted sm:hidden">{l.title || "No title recorded"}</span>
                  </Link>
                </TableCell>
                <TableCell className="hidden break-words text-[13px] text-text-secondary sm:table-cell">{l.title || "No title recorded"}</TableCell>
                <TableCell className="hidden font-mono text-xs text-text-secondary md:table-cell">
                  {l.start_date ? fmtDate(l.start_date) : "start date not known"} to {l.end_date ? fmtDate(l.end_date) : "present"}
                </TableCell>
                <TableCell>
                  {!l.active && <Pill>Former</Pill>}
                  {l.active && l.is_primary && <Pill>Main company</Pill>}
                  {l.active && !l.is_primary && <Pill variant="positive">Current</Pill>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionBody>
    </SectionCard>
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
  return (
    <SectionCard padded={false}>
      <SectionBody loading={!state}>
        <EmptyState
          icon={kind === "deals" ? <Handshake size={24} /> : <ScrollText size={24} />}
          title={`No ${kind} to show`}
          description={`${noun} are not tracked in 360IQ yet, so there is nothing to list for this company. They will appear here once they are.`}
        />
      </SectionBody>
    </SectionCard>
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
      <SectionCard padded={false}>
        <EmptyState icon={<FileText size={24} />} title="Documents are hidden by your access level" description="You need access to documents to see the ones linked to this company." />
      </SectionCard>
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
    <>
      <SectionCard
        title="Documents"
        padded={false}
        actions={
          canManage && (
            <Button variant="secondary" size="sm" onClick={() => setLinking(true)}>
              <Link2 /> Link a document
            </Button>
          )
        }
      >
        <SectionBody
          loading={loading}
          skeleton={<TableSkeleton rows={4} columns={3} />}
          isEmpty={docs.length === 0}
          empty={<EmptyState icon={<FileText size={24} />} title="No documents linked" description="Link existing documents to keep them with this company. You only see documents you already have access to." />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Linked</TableHead>
                {canManage && (
                  <TableHead className="w-16 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <button type="button" onClick={() => navigate(`/admin/documents/${d.id}`)} className="flex min-h-10 min-w-0 items-center gap-3 text-left">
                      <FileText size={18} className="shrink-0 text-text-muted" />
                      <span className="min-w-0 break-words font-semibold text-text-primary">{d.title}</span>
                    </button>
                  </TableCell>
                  <TableCell className="hidden text-[13px] text-text-secondary sm:table-cell">{labelOf(d.document_type)}</TableCell>
                  <TableCell className="hidden font-mono text-xs text-text-secondary md:table-cell">{fmtDate(d.linked_at)}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label={`Unlink ${d.title}`} onClick={() => void unlink(d)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionBody>
      </SectionCard>
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
    </>
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
        <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-md border border-line">
          {loading && <li className="px-3 py-3 text-sm text-text-muted">Loading…</li>}
          {!loading && shown.length === 0 && <li className="px-3 py-3 text-sm text-text-muted">No documents to link</li>}
          {shown.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => onPick(d.id)} className="block w-full min-w-0 px-3 py-2 text-left hover:bg-surface-2">
                <span className="block truncate text-sm font-semibold text-text-primary">{d.title}</span>
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
