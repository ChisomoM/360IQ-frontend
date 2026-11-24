import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Inbox as InboxIcon, Loader2, Plus } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { EmptyPanel, Pager, Pill, TabBar } from "@/components/profiles/ui";
import { METHOD_LABEL, MethodIcon, StatusPill, fmtTime, useCaptureMeta } from "@/components/captures/parts";
import { listCaptures } from "@/lib/api/captures";
import { notifyInboxChanged } from "@/lib/hooks/useCaptureInbox";
import type { CaptureListItem } from "@/types/capture";

type Filter = "OPEN" | "CONFIRMED" | "REJECTED" | "ALL";
const PAGE_SIZE = 25;

/** The review inbox: every AI capture waits here before anything is saved to a profile. */
export function Inbox() {
  const meta = useCaptureMeta();
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [items, setItems] = useState<CaptureListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listCaptures({ status: filter, page });
      setItems(r.items);
      setTotal(r.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the inbox");
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void load();
    notifyInboxChanged();
  }, [load]);

  return (
    <PageTransition>
      <div className="mx-auto w-full min-w-0 max-w-2xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-xs font-bold text-text-primary">Lead inbox</h1>
            <p className="text-sm text-text-secondary">Check what the AI read before it reaches a profile.</p>
          </div>
          {(meta?.permissions.create ?? true) && (
            <Button asChild>
              <Link to="/admin/capture">
                <Plus className="h-4 w-4" /> Add lead
              </Link>
            </Button>
          )}
        </div>

        <TabBar<Filter>
          tabs={[
            { id: "OPEN", label: "To review" },
            { id: "CONFIRMED", label: "Saved" },
            { id: "REJECTED", label: "Rejected" },
            { id: "ALL", label: "All" },
          ]}
          active={filter}
          onChange={(f) => {
            setFilter(f);
            setPage(1);
          }}
        />

        {loading ? (
          <div className="flex justify-center py-12 text-text-muted" role="status">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <EmptyPanel icon={<InboxIcon className="h-8 w-8" />} title={filter === "OPEN" ? "Nothing waiting for review" : "Nothing here yet"}>
            New cards, voice debriefs and notes appear here as soon as they are read.
          </EmptyPanel>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/admin/capture/${c.id}`}
                  className="flex min-h-16 min-w-0 items-start gap-3 rounded-xl border border-line bg-surface-1 p-3 outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="mt-0.5 rounded-lg bg-surface-2 p-2 text-text-secondary">
                    <MethodIcon method={c.method} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block break-words font-medium text-text-primary">
                      {c.person_name || c.company_name || (c.status === "AI_FAILED" ? `${METHOD_LABEL[c.method]} (not read)` : METHOD_LABEL[c.method])}
                    </span>
                    {c.person_name && c.company_name && <span className="block break-words text-sm text-text-secondary">{c.company_name}</span>}
                    <span className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                      <StatusPill status={c.status} />
                      {c.uncertain > 0 && c.status === "NEEDS_REVIEW" && <Pill variant="caution">{c.uncertain} to check</Pill>}
                      <span>{METHOD_LABEL[c.method]}</span>
                      <span>· {fmtTime(c.created_at)}</span>
                      {c.event_name && <span className="break-words">· {c.event_name}</span>}
                      {!c.mine && c.created_by_name && <span>· by {c.created_by_name}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
      </div>
    </PageTransition>
  );
}
