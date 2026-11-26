import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addLink, changeJob, updateLink } from "@/lib/api/profiles";
import type { CompanyLink } from "@/types/profile";
import { EntityPicker } from "./EntityPicker";
import { Field, FormError } from "./formParts";

type Picked = { id: string; name: string } | null;

function CompanyChoice({ value, onChange }: { value: Picked; onChange: (p: Picked) => void }) {
  return value ? (
    <div className="flex items-center justify-between gap-2 rounded-md border border-line p-3 text-sm">
      <span className="min-w-0 break-words font-semibold">{value.name}</span>
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
        Change
      </Button>
    </div>
  ) : (
    <EntityPicker kind="company" onPick={(c) => onChange({ id: c.id, name: c.name })} autoFocus placeholder="Search for the company" />
  );
}

/** Another company for the same person, active at the same time as the others. */
export function AddLinkDialog({ open, onOpenChange, personId, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; personId: string; onDone: () => void }) {
  const [company, setCompany] = useState<Picked>(null);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setCompany(null);
      setTitle("");
      setStart("");
      setError("");
    }
  }, [open]);

  const save = async () => {
    if (!company) return;
    setBusy(true);
    setError("");
    try {
      await addLink(personId, { company_id: company.id, title: title.trim() || undefined, start_date: start || undefined });
      toast.success(`Linked to ${company.name}`);
      onDone();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the link.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Link to another company</DialogTitle>
          <DialogDescription>A person can work with several companies at once. Their other links stay as they are.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <CompanyChoice value={company} onChange={setCompany} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Title there" htmlFor="al-title">
              <Input id="al-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Started" htmlFor="al-start">
              <Input id="al-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
          </div>
          {error && <FormError>{error}</FormError>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!company || busy}>
            {busy && <Loader2 className="animate-spin" />} Add link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Ends the current link and starts one at the new company, in one step. Both companies keep the connection. */
export function JobChangeDialog({
  open,
  onOpenChange,
  personId,
  current,
  onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  personId: string;
  current: CompanyLink[]; // active links
  onDone: () => void;
}) {
  const [company, setCompany] = useState<Picked>(null);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [from, setFrom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setCompany(null);
      setTitle("");
      setStart("");
      setFrom(current.find((l) => l.is_primary)?.id ?? current[0]?.id ?? "");
      setError("");
    }
  }, [open, current]);

  const save = async () => {
    if (!company) return;
    setBusy(true);
    setError("");
    try {
      await changeJob(personId, { from_link_id: from || undefined, new_company_id: company.id, title: title.trim() || undefined, start_date: start || undefined });
      toast.success(`Job change recorded. They now work at ${company.name}.`);
      onDone();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record the job change.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-lg overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Record a job change</DialogTitle>
          <DialogDescription>The old link is ended on the start date and a new one begins. The old company keeps the connection in its history.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {current.length > 1 && (
            <Field label="Leaving" htmlFor="jc-from">
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger id="jc-from">
                  <SelectValue placeholder="Choose a company" />
                </SelectTrigger>
                <SelectContent>
                  {current.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.company_name}
                      {l.title ? ` (${l.title})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
          {current.length === 1 && (
            <p className="text-sm text-text-secondary">
              Leaving <strong>{current[0].company_name}</strong>
            </p>
          )}
          <CompanyChoice value={company} onChange={setCompany} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="New title" htmlFor="jc-title">
              <Input id="jc-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Start date" htmlFor="jc-start" hint="Defaults to today">
              <Input id="jc-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
          </div>
          {error && <FormError>{error}</FormError>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!company || busy}>
            {busy && <Loader2 className="animate-spin" />} Record job change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** End a link (they left, or the role finished) without starting a new one. */
export function EndLinkDialog({ link, onOpenChange, onDone }: { link: CompanyLink | null; onOpenChange: (o: boolean) => void; onDone: () => void }) {
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (link) setEnd(new Date().toISOString().slice(0, 10));
  }, [link]);
  const save = async () => {
    if (!link || !end) return;
    setBusy(true);
    try {
      await updateLink(link.id, { end_date: end });
      toast.success("Link ended");
      onDone();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not end the link");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={Boolean(link)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-sm p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>End link with {link?.company_name}</DialogTitle>
          <DialogDescription>It stays in their history as a former company.</DialogDescription>
        </DialogHeader>
        <Field label="Ended on" htmlFor="el-end">
          <Input id="el-end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy || !end}>
            {busy && <Loader2 className="animate-spin" />} End link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
