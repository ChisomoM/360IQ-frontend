import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPerson, updatePerson, type PersonPayload } from "@/lib/api/profiles";
import type { MatchResult, Person, ProfileMeta } from "@/types/profile";
import { DuplicatePanel } from "./DuplicatePanel";
import { EntityPicker } from "./EntityPicker";
import { Field, SelectField, SensitiveField } from "./formParts";

interface Form {
  first_name: string;
  last_name: string;
  title: string;
  department: string;
  seniority: string;
  buying_role: string;
  email: string;
  phone: string;
  linkedin_url: string;
  preferred_channel: string;
  consent_status: string;
  interests: string;
  stated_needs: string;
  commitments: string;
  notes: string;
}

const MASK = "•";

function fromPerson(p?: Person | null): Form {
  return {
    first_name: p?.first_name ?? "",
    last_name: p?.last_name ?? "",
    title: p?.title ?? "",
    department: p?.department ?? "",
    seniority: p?.seniority ?? "",
    buying_role: p?.buying_role ?? "",
    email: p?.email ?? "",
    phone: p?.phone ?? "",
    linkedin_url: p?.linkedin_url ?? "",
    preferred_channel: p?.preferred_channel ?? "",
    consent_status: p?.consent_status ?? "UNKNOWN",
    interests: (p?.interests ?? []).join(", "),
    stated_needs: p?.stated_needs ?? "",
    commitments: p?.commitments ?? "",
    notes: p?.notes ?? "",
  };
}

function splitList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Create or edit a person. Creating checks for duplicates first and asks before creating a lookalike. */
export function PersonFormDialog({
  open,
  onOpenChange,
  person,
  meta,
  defaultCompany,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  person?: Person | null;
  meta: ProfileMeta | null;
  defaultCompany?: { id: string; name: string } | null;
  /** called with the saved person and how it ended */
  onSaved: (p: Person, outcome: "CREATED" | "LINKED_EXISTING" | "UPDATED") => void;
}) {
  const editing = Boolean(person);
  const masked = Boolean(person?.sensitive_masked);
  const [form, setForm] = useState<Form>(fromPerson(person));
  const [company, setCompany] = useState<{ id: string; name: string } | null>(defaultCompany ?? null);
  const [startDate, setStartDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [dupes, setDupes] = useState<MatchResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(fromPerson(person));
      setCompany(defaultCompany ?? null);
      setStartDate("");
      setDupes(null);
      setError("");
    }
  }, [open, person, defaultCompany]);

  const set = (k: keyof Form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (dupes && ["first_name", "last_name", "email", "phone"].includes(k)) setDupes(null);
  };
  const input = (k: keyof Form, label: string, type = "text") => (
    <Field label={label} htmlFor={`pf-${k}`}>
      <Input id={`pf-${k}`} type={type} value={form[k]} onChange={(e) => set(k)(e.target.value)} />
    </Field>
  );

  const submit = async (confirm = false) => {
    setError("");
    if (!form.first_name.trim() && !form.last_name.trim()) {
      setError("Enter a first name or a last name.");
      return;
    }
    setBusy(true);
    try {
      if (editing && person) {
        const base = fromPerson(person);
        const changes: Record<string, string | string[]> = {};
        (Object.keys(form) as (keyof Form)[]).forEach((k) => {
          if (form[k] === base[k] || form[k].includes(MASK)) return;
          changes[k] = k === "interests" ? splitList(form[k]) : form[k];
        });
        if (Object.keys(changes).length === 0) {
          onOpenChange(false);
          return;
        }
        const saved = await updatePerson(person.id, changes);
        toast.success("Person updated");
        onSaved(saved, "UPDATED");
        onOpenChange(false);
        return;
      }
      const payload: PersonPayload = {};
      (Object.keys(form) as (keyof Form)[]).forEach((k) => {
        const v = form[k].trim();
        if (!v || (k === "consent_status" && v === "UNKNOWN")) return;
        if (k === "interests") payload.interests = splitList(v);
        else (payload as Record<string, string>)[k] = v;
      });
      if (company) payload.company_id = company.id;
      if (company && startDate) payload.start_date = startDate;
      const res = await createPerson(payload, confirm);
      if (res.outcome === "POSSIBLE_DUPLICATES") {
        setDupes(res.match);
        return;
      }
      if (res.person) {
        if (res.outcome === "LINKED_EXISTING") {
          toast.info(`${res.person.full_name} already exists. Their details were added where blank, and you are now viewing their profile.`);
        } else {
          toast.success("Person added");
        }
        onSaved(res.person, res.outcome);
        onOpenChange(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this person.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit person" : "Add a person"}</DialogTitle>
          <DialogDescription>
            {editing ? "Changed values are saved as confirmed, with you as the source." : "We check for people you already have before adding a new one."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit(false);
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {input("first_name", "First name")}
            {input("last_name", "Last name")}
            {input("title", "Job title")}
            {input("department", "Department")}
            <SelectField label="Seniority" value={form.seniority} onChange={set("seniority")} options={meta?.seniority ?? []} />
            <SelectField label="Buying role" value={form.buying_role} onChange={set("buying_role")} options={meta?.buying_roles?.slice(0, 6) ?? []} />
            <SensitiveField id="pf-email" label="Email" type="email" value={form.email} onChange={set("email")} masked={masked} hasSavedValue={Boolean(person?.email)} />
            <SensitiveField id="pf-phone" label="Phone" value={form.phone} onChange={set("phone")} masked={masked} hasSavedValue={Boolean(person?.phone)} placeholder="0977 123 456" />
            <SelectField label="Preferred channel" value={form.preferred_channel} onChange={set("preferred_channel")} options={meta?.preferred_channels ?? []} />
            <SelectField label="Consent to contact" value={form.consent_status} onChange={set("consent_status")} options={meta?.consent_statuses ?? []} placeholder="Unknown" />
          </div>
          <SensitiveField id="pf-linkedin" label="LinkedIn" value={form.linkedin_url} onChange={set("linkedin_url")} masked={masked} hasSavedValue={Boolean(person?.linkedin_url)} />
          <SensitiveField id="pf-interests" label="Interests (comma separated)" value={form.interests} onChange={set("interests")} masked={masked} hasSavedValue={(person?.interests?.length ?? 0) > 0} />
          <SensitiveField id="pf-needs" label="Stated needs" multiline value={form.stated_needs} onChange={set("stated_needs")} masked={masked} hasSavedValue={Boolean(person?.stated_needs)} />
          <SensitiveField id="pf-commit" label="Commitments" multiline value={form.commitments} onChange={set("commitments")} masked={masked} hasSavedValue={Boolean(person?.commitments)} />
          <SensitiveField id="pf-notes" label="Notes" multiline value={form.notes} onChange={set("notes")} masked={masked} hasSavedValue={Boolean(person?.notes)} />

          {!editing && (
            <div className="space-y-2 rounded-lg border border-line p-3">
              <p className="text-sm font-medium text-text-primary">Company (optional)</p>
              {company ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 break-words font-medium">{company.name}</span>
                  <div className="flex items-center gap-2">
                    <Input aria-label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 w-40" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCompany(null)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <EntityPicker kind="company" onPick={(c) => setCompany({ id: c.id, name: c.name })} placeholder="Search for their company" />
              )}
            </div>
          )}

          {dupes && <DuplicatePanel match={dupes} entity="person" busy={busy} onCreateAnyway={() => void submit(true)} />}
          {error && (
            <p role="alert" className="rounded-md bg-risk-tint px-3 py-2 text-sm text-risk">
              {error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || Boolean(dupes)}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Save changes" : "Add person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
