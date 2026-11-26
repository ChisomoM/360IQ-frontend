import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { GitMerge, Loader2, Undo2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listMerges, mergeRecords, undoMerge } from "@/lib/api/profiles";
import { formatDateTime } from "@/lib/format";
import type { MergeRecord } from "@/types/profile";
import { EntityPicker, type PickedEntity } from "./EntityPicker";
import { FormError } from "./formParts";
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
            <div className="space-y-1 rounded-md bg-field p-3 text-sm">
              <p>
                <span className="text-text-muted">Keep:</span> <strong className="break-words">{survivor.name}</strong>
              </p>
              <p>
                <span className="text-text-muted">Merge in and hide:</span> <strong className="break-words">{picked.name}</strong>
                {picked.detail && <span className="block text-xs text-text-muted">{picked.detail}</span>}
              </p>
            </div>
            {error && <FormError>{error}</FormError>}
            <DialogFooter className="gap-2">
              <Button variant="secondary" onClick={() => setPicked(null)} disabled={busy}>
                Choose another
              </Button>
              <Button onClick={run} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <GitMerge />} Merge records
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
  if (loading)
    return (
      <div role="status" aria-busy="true" aria-label="Loading">
        <div className="skeleton h-4 w-2/3 rounded-xs" />
      </div>
    );
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
        <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0 text-sm">
            <p className="text-text-primary">
              {m.survivor_id === id ? "Another record was merged into this one" : "This record was merged into another"}
            </p>
            <p className="text-xs text-text-muted">
              <span className="font-mono">{formatDateTime(m.merged_at)}</span>
              {m.counts && Object.keys(m.counts).length > 0 && ` · moved ${Object.entries(m.counts).filter(([k, v]) => v > 0 && !k.includes("duplicates")).map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`).join(", ") || "nothing else"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Pill variant={m.status === "MERGED" ? "positive" : "neutral"}>{m.status === "MERGED" ? "Merged" : "Undone"}</Pill>
            {m.status === "MERGED" && (
              <Button variant="secondary" size="sm" disabled={busyId === m.id} onClick={() => void undo(m)}>
                {busyId === m.id ? <Loader2 className="animate-spin" /> : <Undo2 />} Undo
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
