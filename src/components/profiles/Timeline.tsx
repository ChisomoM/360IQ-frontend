import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Activity, ArrowRightLeft, Briefcase, CalendarClock, ClipboardList, Loader2, Mail, MessageSquare, Mic, Phone, ScanLine, GitMerge } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { addTimelineEntry, listTimeline } from "@/lib/api/profiles";
import { formatDateTime } from "@/lib/format";
import type { Interaction } from "@/types/profile";
import { Pager, labelOf } from "./ui";
import { Field, SelectField } from "./formParts";

const KIND_ICON: Record<string, ReactElement> = {
  NOTE: <MessageSquare size={16} />,
  CALL: <Phone size={16} />,
  MEETING: <CalendarClock size={16} />,
  EMAIL: <Mail size={16} />,
  LEAD_FORM: <ClipboardList size={16} />,
  CARD_SCAN: <ScanLine size={16} />,
  VOICE_NOTE: <Mic size={16} />,
  JOB_CHANGE: <Briefcase size={16} />,
  MERGE: <GitMerge size={16} />,
  SYSTEM: <Activity size={16} />,
};

/** Every interaction on a person or company, newest first, with a form to add a note when allowed. */
export function Timeline({
  entity,
  id,
  canManage,
  kinds,
  reloadKey,
}: {
  entity: "person" | "company";
  id: string;
  canManage: boolean;
  kinds: string[];
  reloadKey?: number;
}) {
  const [items, setItems] = useState<Interaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState("NOTE");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const pageSize = 15;

  const load = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await listTimeline(entity, id, p, pageSize);
        setItems(res.items);
        setTotal(res.total);
        setPage(p);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load the timeline");
      } finally {
        setLoading(false);
      }
    },
    [entity, id]
  );

  useEffect(() => {
    void load(1);
  }, [load, reloadKey]);

  const add = async () => {
    if (!summary.trim()) return;
    setSaving(true);
    try {
      await addTimelineEntry(entity, id, { kind, summary: summary.trim() });
      setSummary("");
      toast.success("Added to the timeline");
      await load(1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add the entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {canManage && (
        <SectionCard title="Add an entry">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[12rem_1fr]">
            <SelectField label="Type" value={kind} onChange={(v) => setKind(v || "NOTE")} options={kinds} placeholder="Note" />
            <Field label="What happened" htmlFor="tl-summary">
              <Textarea id="tl-summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Called about the renewal date" />
            </Field>
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={add} disabled={saving || !summary.trim()}>
              {saving && <Loader2 className="animate-spin" />} Add to timeline
            </Button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Timeline" padded={false}>
        <SectionBody
          loading={loading}
          isEmpty={items.length === 0}
          empty={<EmptyState icon={<ArrowRightLeft size={24} />} title="Nothing on the timeline yet" description="Calls, meetings, notes, job changes and merges will appear here." />}
        >
          <ol className="px-6 pb-2">
            {items.map((it, i) => (
              <li key={it.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-text-secondary">{KIND_ICON[it.kind] ?? KIND_ICON.SYSTEM}</span>
                  {i < items.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                </div>
                <div className="min-w-0 flex-1 pb-4">
                  <p className="break-words text-sm text-text-primary">{it.summary}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-text-muted">
                    <span className="font-semibold">{labelOf(it.kind)}</span>
                    <span>
                      · <span className="font-mono">{formatDateTime(it.occurred_at)}</span>
                    </span>
                    {it.created_by && <span>· {it.created_by}</span>}
                    {entity === "company" && it.person_id && it.person_name && (
                      <span>
                        ·{" "}
                        <Link className="text-signal-text hover:underline" to={`/admin/people/${it.person_id}`}>
                          {it.person_name}
                        </Link>
                      </span>
                    )}
                    {entity === "person" && it.company_id && it.company_name && (
                      <span>
                        ·{" "}
                        <Link className="text-signal-text hover:underline" to={`/admin/companies/${it.company_id}`}>
                          {it.company_name}
                        </Link>
                      </span>
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SectionBody>
        <Pager page={page} pageSize={pageSize} total={total} onPage={(p) => void load(p)} />
      </SectionCard>
    </div>
  );
}
