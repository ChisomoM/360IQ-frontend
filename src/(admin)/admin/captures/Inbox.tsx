import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Inbox as InboxIcon, Plus } from "@/components/icons";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Pager, Pill, TabBar } from "@/components/profiles/ui";
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
      <div className="flex w-full min-w-0 flex-col gap-5">
        <PageHeader
          title="Lead inbox"
          description="Check what the AI read before it reaches a profile."
          actions={
            (meta?.permissions.create ?? true) && (
              <Button asChild>
                <Link to="/admin/capture">
                  <Plus /> Add lead
                </Link>
              </Button>
            )
          }
        />

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
        >
          <SectionCard padded={false}>
            <SectionBody
              loading={loading}
              skeleton={<TableSkeleton rows={6} columns={4} />}
              isEmpty={items.length === 0}
              empty={
                <EmptyState
                  icon={<InboxIcon size={24} />}
                  title={filter === "OPEN" ? "Nothing waiting for review" : "Nothing here yet"}
                  description="New cards, voice debriefs and notes appear here as soon as they are read."
                />
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead className="hidden lg:table-cell">Event</TableHead>
                    <TableHead className="hidden sm:table-cell">Captured</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link to={`/admin/capture/${c.id}`} className="flex min-h-10 min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-surface-2 text-text-secondary">
                            <MethodIcon method={c.method} className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block break-words font-semibold text-text-primary">
                              {c.person_name || c.company_name || (c.status === "AI_FAILED" ? `${METHOD_LABEL[c.method]} (not read)` : METHOD_LABEL[c.method])}
                            </span>
                            {c.person_name && c.company_name && <span className="block break-words font-normal text-text-secondary">{c.company_name}</span>}
                            <span className="block text-xs font-normal text-text-muted sm:hidden">{fmtTime(c.created_at)}</span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap items-center gap-1.5">
                          <StatusPill status={c.status} />
                          {c.uncertain > 0 && c.status === "NEEDS_REVIEW" && <Pill variant="caution">{c.uncertain} to check</Pill>}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-[13px] text-text-secondary md:table-cell">
                        {METHOD_LABEL[c.method]}
                        {!c.mine && c.created_by_name && <span className="block text-xs text-text-muted">by {c.created_by_name}</span>}
                      </TableCell>
                      <TableCell className="hidden break-words text-[13px] text-text-secondary lg:table-cell">{c.event_name || <span className="text-text-muted">None</span>}</TableCell>
                      <TableCell className="hidden font-mono text-xs text-text-secondary sm:table-cell">{fmtTime(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionBody>
            <Pager page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </SectionCard>
        </TabBar>
      </div>
    </PageTransition>
  );
}
