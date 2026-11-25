import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import dayjs from "dayjs";
import { ArrowRightLeft, Briefcase, CalendarClock, ClipboardList, Loader2, Mail, MessageSquare, Mic, Phone, ScanLine, GitMerge, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addTimelineEntry, listTimeline } from "@/lib/api/profiles";
import type { Interaction } from "@/types/profile";
import { EmptyPanel, Pager, labelOf } from "./ui";
import { Field, SelectField } from "./formParts";

const KIND_ICON: Record<string, ReactElement> = {
  NOTE: <MessageSquare className="h-4 w-4" />,
  CALL: <Phone className="h-4 w-4" />,
  MEETING: <CalendarClock className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  LEAD_FORM: <ClipboardList className="h-4 w-4" />,
  CARD_SCAN: <ScanLine className="h-4 w-4" />,
  VOICE_NOTE: <Mic className="h-4 w-4" />,
  JOB_CHANGE: <Briefcase className="h-4 w-4" />,
  MERGE: <GitMerge className="h-4 w-4" />,
  SYSTEM: <Sparkles className="h-4 w-4" />,
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
    <div className="space-y-4">
      {canManage && (
        <div className="space-y-3 rounded-xl border border-line bg-surface-1 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[12rem_1fr]">
            <SelectField label="Type" value={kind} onChange={(v) => setKind(v || "NOTE")} options={kinds} placeholder="Note" />
            <Field label="What happened" htmlFor="tl-summary">
              <Textarea id="tl-summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Call, meeting or note" />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button onClick={add} disabled={saving || !summary.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Add to timeline
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      ) : items.length === 0 ? (
        <EmptyPanel icon={<ArrowRightLeft className="h-8 w-8" />} title="Nothing on the timeline yet">
          Calls, meetings, notes, job changes and merges will appear here.
        </EmptyPanel>
      ) : (
        <ol className="space-y-0">
          {items.map((it, i) => (
            <li key={it.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-secondary">{KIND_ICON[it.kind] ?? KIND_ICON.SYSTEM}</span>
                {i < items.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
              </div>
              <div className="min-w-0 flex-1 pb-4">
                <p className="break-words text-sm text-text-primary">{it.summary}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-text-muted">
                  <span className="font-medium">{labelOf(it.kind)}</span>
                  <span>· {dayjs(it.occurred_at).format("D MMM YYYY, HH:mm")}</span>
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
      )}
      <Pager page={page} pageSize={pageSize} total={total} onPage={(p) => void load(p)} />
    </div>
  );
}
