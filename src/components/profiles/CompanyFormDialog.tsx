import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createCompany, updateCompany, withDuplicateConfirm, type CompanyPayload } from "@/lib/api/profiles";
import type { Company, MatchResult, ProfileMeta, Site } from "@/types/profile";
import { DuplicatePanel } from "./DuplicatePanel";
import { EntityPicker } from "./EntityPicker";
import { Field, FormError, SelectField, SensitiveField } from "./formParts";

interface Form {
  name: string;
  legal_name: string;
  domain: string;
  website: string;
  industry: string;
  size_band: string;
  relationship_stage: string;
  address: string;
  district: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  aliases: string;
  background_notes: string;
  reputation_notes: string;
  notes: string;
}

const MASK = "•";

function fromCompany(c?: Company | null): Form {
  return {
    name: c?.name ?? "",
    legal_name: c?.legal_name ?? "",
    domain: c?.domain ?? "",
    website: c?.website ?? "",
    industry: c?.industry ?? "",
    size_band: c?.size_band ?? "",
    relationship_stage: c?.relationship_stage ?? "LEAD",
    address: c?.address ?? "",
    district: c?.district ?? "",
    province: c?.province ?? "",
    country: c?.country ?? "",
    phone: c?.phone ?? "",
    email: c?.email ?? "",
    aliases: (c?.aliases ?? []).join(", "),
    background_notes: c?.background_notes ?? "",
    reputation_notes: c?.reputation_notes ?? "",
    notes: c?.notes ?? "",
  };
}

const splitList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const emptySite = (): Site => ({ name: "", address: "", district: "", province: "", country: "" });

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
  meta,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  company?: Company | null;
  meta: ProfileMeta | null;
  onSaved: (c: Company, outcome: "CREATED" | "LINKED_EXISTING" | "UPDATED") => void;
}) {
  const editing = Boolean(company);
  const masked = Boolean(company?.sensitive_masked);
  const [form, setForm] = useState<Form>(fromCompany(company));
  const [sites, setSites] = useState<Site[]>(company?.sites ?? []);
  const [parent, setParent] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dupes, setDupes] = useState<MatchResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(fromCompany(company));
      setSites(company?.sites ?? []);
      setParent(company?.parent_id ? { id: company.parent_id, name: company.parent_name } : null);
      setDupes(null);
      setError("");
    }
  }, [open, company]);

  const set = (k: keyof Form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (dupes && ["name", "domain", "website", "email", "phone"].includes(k)) setDupes(null);
  };
  const input = (k: keyof Form, label: string, hint?: string) => (
    <Field label={label} htmlFor={`cf-${k}`} hint={hint}>
      <Input id={`cf-${k}`} value={form[k]} onChange={(e) => set(k)(e.target.value)} />
    </Field>
  );
  const setSite = (i: number, k: keyof Site, v: string) => setSites((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  const submit = async (confirm = false) => {
    setError("");
    if (!form.name.trim()) {
      setError("Enter the company name.");
      return;
    }
    setBusy(true);
    try {
      const cleanSites = sites.filter((s) => s.name.trim() || s.address.trim() || s.district.trim());
      if (editing && company) {
        const base = fromCompany(company);
        const changes: Record<string, unknown> = {};
        (Object.keys(form) as (keyof Form)[]).forEach((k) => {
          if (form[k] === base[k] || form[k].includes(MASK)) return;
          changes[k] = k === "aliases" ? splitList(form[k]) : form[k];
        });
        if (JSON.stringify(cleanSites) !== JSON.stringify(company.sites ?? [])) changes.sites = cleanSites;
        if ((parent?.id ?? "") !== (company.parent_id ?? "")) changes.parent_id = parent?.id ?? "";
        if (Object.keys(changes).length === 0) {
          onOpenChange(false);
          return;
        }
        const saved = await withDuplicateConfirm((c) => updateCompany(company.id, c ? { ...changes, confirm_duplicate: true } : changes));
        toast.success("Company updated");
        onSaved(saved, "UPDATED");
        onOpenChange(false);
        return;
      }
      const payload: CompanyPayload = {};
      (Object.keys(form) as (keyof Form)[]).forEach((k) => {
        const v = form[k].trim();
        if (!v || (k === "relationship_stage" && v === "LEAD")) return;
        if (k === "aliases") payload.aliases = splitList(v);
        else (payload as Record<string, string>)[k] = v;
      });
      if (cleanSites.length) payload.sites = cleanSites;
      if (parent) payload.parent_id = parent.id;
      const res = await createCompany(payload, confirm);
      if (res.outcome === "POSSIBLE_DUPLICATES") {
        setDupes(res.match);
        return;
      }
      if (res.company) {
        if (res.outcome === "LINKED_EXISTING") {
          toast.info(`${res.company.name} already exists (same domain). Blank details were filled in and you are now viewing it.`);
        } else {
          toast.success("Company added");
        }
        onSaved(res.company, res.outcome);
        onOpenChange(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this company.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit company" : "Add a company"}</DialogTitle>
          <DialogDescription>
            {editing ? "Changed values are saved as confirmed, with you as the source." : "We check for companies you already have before adding a new one."}
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
            {input("name", "Company name")}
            {input("legal_name", "Legal name")}
            {input("domain", "Domain", "For example mukuba.example.com. Free mail domains such as gmail.com are ignored.")}
            {input("website", "Website")}
            {input("industry", "Industry")}
            <SelectField label="Size" value={form.size_band} onChange={set("size_band")} options={meta?.size_bands ?? []} format={(v) => `${v} people`} />
            <SelectField label="Relationship stage" value={form.relationship_stage} onChange={set("relationship_stage")} options={meta?.relationship_stages ?? []} placeholder="Lead" />
            {input("aliases", "Also known as (comma separated)")}
            {input("address", "Address")}
            {input("district", "District")}
            {input("province", "Province")}
            {input("country", "Country")}
            <SensitiveField id="cf-phone" label="Phone" value={form.phone} onChange={set("phone")} masked={masked} hasSavedValue={Boolean(company?.phone)} />
            <SensitiveField id="cf-email" label="Email" type="email" value={form.email} onChange={set("email")} masked={masked} hasSavedValue={Boolean(company?.email)} />
          </div>

          <div className="space-y-2 rounded-md border border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-text-primary">Sites and locations</p>
              <Button type="button" variant="secondary" size="sm" onClick={() => setSites((s) => [...s, emptySite()])}>
                <Plus /> Add site
              </Button>
            </div>
            {sites.length === 0 && <p className="text-sm text-text-muted">No extra sites recorded.</p>}
            {sites.map((s, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.4fr_1fr_auto]">
                <Input aria-label={`Site ${i + 1} name`} placeholder="Name" value={s.name} onChange={(e) => setSite(i, "name", e.target.value)} />
                <Input aria-label={`Site ${i + 1} address`} placeholder="Address" value={s.address} onChange={(e) => setSite(i, "address", e.target.value)} />
                <Input aria-label={`Site ${i + 1} district`} placeholder="District" value={s.district} onChange={(e) => setSite(i, "district", e.target.value)} />
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove site ${i + 1}`} onClick={() => setSites((x) => x.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2 rounded-md border border-line p-3">
            <p className="text-sm font-semibold text-text-primary">Parent company</p>
            {parent ? (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 break-words font-semibold">{parent.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => setParent(null)}>
                  Remove
                </Button>
              </div>
            ) : (
              <EntityPicker kind="company" excludeId={company?.id} onPick={(c) => setParent({ id: c.id, name: c.name })} placeholder="Search for the parent company" />
            )}
          </div>

          <SensitiveField id="cf-bg" label="Background notes" multiline value={form.background_notes} onChange={set("background_notes")} masked={masked} hasSavedValue={Boolean(company?.background_notes)} />
          <SensitiveField id="cf-rep" label="Reputation notes" multiline value={form.reputation_notes} onChange={set("reputation_notes")} masked={masked} hasSavedValue={Boolean(company?.reputation_notes)} />
          <SensitiveField id="cf-notes" label="Other notes" multiline value={form.notes} onChange={set("notes")} masked={masked} hasSavedValue={Boolean(company?.notes)} />

          {dupes && <DuplicatePanel match={dupes} entity="company" busy={busy} onCreateAnyway={() => void submit(true)} />}
          {error && <FormError>{error}</FormError>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || Boolean(dupes)}>
              {busy && <Loader2 className="animate-spin" />}
              {editing ? "Save changes" : "Add company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
