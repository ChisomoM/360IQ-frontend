import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, Building2, Edit2, GitMerge, Link2 } from "@/components/icons";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { confirmFieldValue, getPerson } from "@/lib/api/profiles";
import type { CompanyLink, Person } from "@/types/profile";
import {
  BUYING_ROLE_VARIANT,
  FieldRow,
  MaskedNotice,
  Pill,
  TabBar,
  fmtDate,
  labelOf,
  useProfileMeta,
} from "@/components/profiles/ui";
import { PersonFormDialog } from "@/components/profiles/PersonFormDialog";
import { Timeline } from "@/components/profiles/Timeline";
import { SignalsPanel } from "@/components/profiles/SignalsPanel";
import { MergeDialog, MergeHistory } from "@/components/profiles/MergeParts";
import { AddLinkDialog, EndLinkDialog, JobChangeDialog } from "@/components/profiles/LinkDialogs";

type Tab = "overview" | "companies" | "timeline" | "signals";

function period(l: CompanyLink): string {
  const start = l.start_date ? fmtDate(l.start_date) : "start date not known";
  return `${start} to ${l.end_date ? fmtDate(l.end_date) : "present"}`;
}

export function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meta = useProfileMeta();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [merging, setMerging] = useState(false);
  const [linking, setLinking] = useState(false);
  const [jobChange, setJobChange] = useState(false);
  const [endLink, setEndLink] = useState<CompanyLink | null>(null);
  const [reload, setReload] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setPerson(await getPerson(id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load this person");
      navigate("/admin/people", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
    setReload((n) => n + 1);
  }, [load]);

  if (loading || !person) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading" className="flex w-full flex-col gap-5">
        <div className="skeleton h-9 w-64 max-w-full rounded-md" />
        <div className="skeleton h-10 w-72 max-w-full rounded-lg" />
        <div className="skeleton h-64 w-full rounded-lg" />
      </div>
    );
  }

  const can = meta?.permissions;
  const canManage = Boolean(can?.manage);
  const links = person.links ?? [];
  const active = links.filter((l) => l.active);
  const former = links.filter((l) => !l.active);
  const src = person.provenance ?? [];
  const masked = person.sensitive_masked;
  const sensitive = new Set(["email", "phone", "linkedin_url", "notes", "interests", "stated_needs", "commitments"]);
  const confirm = async (sourceId: string) => {
    try {
      await confirmFieldValue(sourceId);
      toast.success("Value confirmed");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm");
    }
  };
  const row = (label: string, field: string, value: string, extra?: { display?: ReactNode }) => (
    <FieldRow
      label={label}
      field={field}
      value={value}
      display={extra?.display}
      sources={src}
      canConfirm={canManage && !(masked && sensitive.has(field))}
      onConfirm={confirm}
    />
  );

  return (
    <PageTransition>
      <div className="flex w-full min-w-0 flex-col gap-5">
        <div className="space-y-3">
          <PageHeader
            crumb={
              <Link to="/admin/people" className="inline-flex items-center gap-1 font-medium text-signal-text hover:underline">
                <ArrowLeft size={14} /> People
              </Link>
            }
            title={<span className="break-words">{person.full_name}</span>}
            description={[person.title, person.company_name].filter(Boolean).join(" at ") || "No role recorded"}
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
          <div className="flex flex-wrap gap-1.5">
            {person.buying_role && <Pill variant={BUYING_ROLE_VARIANT[person.buying_role] ?? "neutral"}>{labelOf(person.buying_role)}</Pill>}
            {person.seniority && <Pill>{labelOf(person.seniority)}</Pill>}
            {former.length > 0 && <Pill>Worked at {former.length} other {former.length === 1 ? "company" : "companies"}</Pill>}
          </div>
        </div>

        {masked && <MaskedNotice />}

        <TabBar<Tab>
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "companies", label: "Companies", count: active.length },
            { id: "timeline", label: "Timeline" },
            { id: "signals", label: "Signals" },
          ]}
          active={tab}
          onChange={setTab}
        >
          {tab === "overview" && (
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.35fr_1fr]">
              <SectionCard title="What we know">
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  {row("Job title", "title", person.title)}
                  {row("Department", "department", person.department)}
                  {row("Seniority", "seniority", person.seniority, { display: person.seniority ? labelOf(person.seniority) : undefined })}
                  {row("Buying role", "buying_role", person.buying_role, { display: person.buying_role ? labelOf(person.buying_role) : undefined })}
                  {row("Email", "email", person.email)}
                  {row("Phone", "phone", person.phone)}
                  {row("Preferred channel", "preferred_channel", person.preferred_channel, { display: person.preferred_channel ? labelOf(person.preferred_channel) : undefined })}
                  {row("Consent to contact", "consent_status", person.consent_status === "UNKNOWN" ? "" : person.consent_status, {
                    display: person.consent_status && person.consent_status !== "UNKNOWN" ? labelOf(person.consent_status) : undefined,
                  })}
                  {row("LinkedIn", "linkedin_url", person.linkedin_url)}
                  {row("Interests", "interests", person.interests.join(", "), {
                    display: person.interests.length ? (
                      <span className="flex flex-wrap gap-1">
                        {person.interests.map((i) => (
                          <Pill key={i}>{i}</Pill>
                        ))}
                      </span>
                    ) : undefined,
                  })}
                </div>
              </SectionCard>
              <div className="grid min-w-0 gap-5">
                <SectionCard title="Needs and commitments">
                  <div className="grid grid-cols-1 gap-4">
                    {row("Stated needs", "stated_needs", person.stated_needs)}
                    {row("Commitments", "commitments", person.commitments)}
                    {row("Notes", "notes", person.notes)}
                  </div>
                </SectionCard>
                {can?.merge && (
                  <SectionCard title="Merge history">
                    <MergeHistory entity="PERSON" id={person.id} canMerge reloadKey={reload} onChanged={refresh} />
                  </SectionCard>
                )}
              </div>
            </div>
          )}

          {tab === "companies" && (
            <div className="flex flex-col gap-5">
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setLinking(true)}>
                    <Link2 /> Link another company
                  </Button>
                  <Button variant="secondary" onClick={() => setJobChange(true)}>
                    <Briefcase /> Record a job change
                  </Button>
                </div>
              )}
              {links.length === 0 ? (
                <SectionCard padded={false}>
                  <EmptyState
                    icon={<Building2 size={24} />}
                    title="Not linked to a company"
                    description={canManage ? "Link this person to a company to show where they work." : "No company is recorded for this person."}
                  />
                </SectionCard>
              ) : (
                <>
                  <LinkList title="Current" links={active} canManage={canManage} onEnd={setEndLink} />
                  {former.length > 0 && <LinkList title="Former" links={former} canManage={false} onEnd={setEndLink} />}
                </>
              )}
            </div>
          )}

          {tab === "signals" && <SignalsPanel entity="person" id={person.id} />}
          {tab === "timeline" && <Timeline entity="person" id={person.id} canManage={canManage} kinds={meta?.interaction_kinds ?? ["NOTE"]} reloadKey={reload} />}
        </TabBar>
      </div>

      <PersonFormDialog open={editing} onOpenChange={setEditing} person={person} meta={meta} onSaved={() => void refresh()} />
      <MergeDialog
        open={merging}
        onOpenChange={setMerging}
        entity="PERSON"
        survivor={{ id: person.id, name: person.full_name }}
        onMerged={() => void refresh()}
      />
      <AddLinkDialog open={linking} onOpenChange={setLinking} personId={person.id} onDone={() => void refresh()} />
      <JobChangeDialog open={jobChange} onOpenChange={setJobChange} personId={person.id} current={active} onDone={() => void refresh()} />
      <EndLinkDialog link={endLink} onOpenChange={(o) => !o && setEndLink(null)} onDone={() => void refresh()} />
    </PageTransition>
  );
}

function LinkList({ title, links, canManage, onEnd }: { title: string; links: CompanyLink[]; canManage: boolean; onEnd: (l: CompanyLink) => void }) {
  return (
    <SectionCard title={title}>
      <ul className="divide-y divide-line">
        {links.map((l) => (
          <li key={l.id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <Link to={`/admin/companies/${l.company_id}`} className="break-words font-semibold text-signal-text hover:underline">
                {l.company_name}
              </Link>
              <p className="break-words text-sm text-text-secondary">{[l.title, l.department].filter(Boolean).join(" · ") || "No title recorded"}</p>
              <p className="font-mono text-xs text-text-muted">{period(l)}</p>
            </div>
            <div className="flex items-center gap-2">
              {l.is_primary && l.active && <Pill>Main company</Pill>}
              {canManage && l.active && (
                <Button variant="ghost" size="sm" onClick={() => onEnd(l)}>
                  End link
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export default PersonDetail;
