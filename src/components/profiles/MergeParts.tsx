import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";
import { GitMerge, Loader2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listMerges, mergeRecords, undoMerge } from "@/lib/api/profiles";
import type { MergeRecord } from "@/types/profile";
import { EntityPicker, type PickedEntity } from "./EntityPicker";
import { Pill } from "./ui";

/** Pick a second record and merge it into the current one. The current record survives. */
export function MergeDialog({
  open,
  onOpenChange,
  entity,
  survivor,
  onMerged,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  entity: "PERSON" | "COMPANY";
  survivor: { id: string; name: string };
  onMerged: (m: MergeRecord) => void;
}) {
  const [picked, setPicked] = useState<PickedEntity | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const noun = entity === "PERSON" ? "person" : "company";

  useEffect(() => {
    if (open) {
      setPicked(null);
      setError("");
    }
  }, [open]);

  const run = async () => {
    if (!picked) return;
    setBusy(true);
    setError("");
    try {
      const m = await mergeRecords(entity, survivor.id, picked.id);
      toast.success(`Merged ${picked.name} into ${survivor.name}. You can undo this from the merge history.`);
      onMerged(m);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The merge failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Merge a duplicate {noun}</DialogTitle>
          <DialogDescription>
            Choose the duplicate. Its company links, timeline, field sources{entity === "COMPANY" ? ", documents and business units" : ""} move to{" "}
            <strong>{survivor.name}</strong>, and blank details are filled from it. Nothing is deleted, and the merge can be undone while nothing has changed since.
          </DialogDescription>
        </DialogHeader>
        {picked ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-line bg-surface-0 p-3 text-sm">
              <p>
                <span className="text-text-muted">Keep:</span> <strong className="break-words">{survivor.name}</strong>
              </p>
              <p>
                <span className="text-text-muted">Merge in and hide:</span> <strong className="break-words">{picked.name}</strong>
                {picked.detail && <span className="block text-xs text-text-muted">{picked.detail}</span>}
              </p>
            </div>
            {error && (
              <p role="alert" className="rounded-md bg-risk-tint px-3 py-2 text-sm text-risk">
                {error}
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setPicked(null)} disabled={busy}>
                Choose another
              </Button>
              <Button onClick={run} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />} Merge
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <EntityPicker kind={entity === "PERSON" ? "person" : "company"} excludeId={survivor.id} onPick={setPicked} autoFocus placeholder={`Search for the duplicate ${noun}`} />
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Merges that involve this record, each with an undo button while it is still undoable. */
export function MergeHistory({ entity, id, canMerge, reloadKey, onChanged }: { entity: "PERSON" | "COMPANY"; id: string; canMerge: boolean; reloadKey?: number; onChanged: () => void }) {
  const [rows, setRows] = useState<MergeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listMerges(entity, id));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [entity, id]);

  useEffect(() => {
    if (canMerge) void load();
    else setLoading(false);
  }, [load, canMerge, reloadKey]);

  if (!canMerge) return null;
  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-text-muted" />;
  if (rows.length === 0) return <p className="text-sm text-text-muted">No merges involve this record.</p>;

  const undo = async (m: MergeRecord) => {
    setBusyId(m.id);
    try {
      await undoMerge(m.id);
      toast.success("Merge undone. Both records are back as they were.");
      await load();
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "This merge cannot be undone.", { duration: 9000 });
    } finally {
      setBusyId("");
    }
  };

  return (
    <ul className="divide-y divide-line">
      {rows.map((m) => (
        <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <div className="min-w-0 text-sm">
            <p className="text-text-primary">
              {m.survivor_id === id ? "Another record was merged into this one" : "This record was merged into another"}
            </p>
            <p className="text-xs text-text-muted">
              {dayjs(m.merged_at).format("D MMM YYYY, HH:mm")}
              {m.counts && Object.keys(m.counts).length > 0 && ` · moved ${Object.entries(m.counts).filter(([k, v]) => v > 0 && !k.includes("duplicates")).map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`).join(", ") || "nothing else"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Pill variant={m.status === "MERGED" ? "caution" : "neutral"}>{m.status === "MERGED" ? "Merged" : "Undone"}</Pill>
            {m.status === "MERGED" && (
              <Button variant="outline" size="sm" disabled={busyId === m.id} onClick={() => void undo(m)}>
                {busyId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />} Undo
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
