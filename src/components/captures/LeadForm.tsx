import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/profiles/formParts";
import { asDecisionRequired, isNetworkError, submitLead } from "@/lib/api/captures";
import { newClientKey, tzOffsetMinutes } from "@/lib/capture/pending";
import { notifyInboxChanged } from "@/lib/hooks/useCaptureInbox";
import type { ConfirmResult, EntityChoice } from "@/types/capture";
import type { MatchResult } from "@/types/profile";
import { ErrorBanner } from "./parts";
import { MatchChoice } from "./MatchChoice";

interface FormState {
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  company_phone: string;
  need: string;
  budget: string;
  timeline: string;
  notes: string;
}

const EMPTY: FormState = { first_name: "", last_name: "", title: "", email: "", phone: "", company: "", website: "", company_phone: "", need: "", budget: "", timeline: "", notes: "" };

/**
 * The short lead form. It saves directly (no AI, nothing to review), but still goes
 * through ProfileIQ duplicate matching: if the person or company looks like an
 * existing record you are asked to link to it or create a new one first. The form
 * keeps everything you typed until the server confirms the save.
 */
export function LeadForm({ eventName }: { eventName: string }) {
  const [f, setF] = useState<FormState>(EMPTY);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(newClientKey);
  const [decision, setDecision] = useState<{ person: MatchResult | null; company: MatchResult | null }>({ person: null, company: null });
  const [personChoice, setPersonChoice] = useState<EntityChoice>({ action: "" });
  const [companyChoice, setCompanyChoice] = useState<EntityChoice>({ action: "" });
  const [done, setDone] = useState<ConfirmResult | null>(null);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const reset = () => {
    setF(EMPTY);
    setMore(false);
    setKey(newClientKey());
    setDecision({ person: null, company: null });
    setPersonChoice({ action: "" });
    setCompanyChoice({ action: "" });
    setDone(null);
    setError(null);
  };

  const hasIdentity = Boolean(f.first_name.trim() || f.last_name.trim() || f.company.trim());

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await submitLead({
        client_key: key,
        event_name: eventName,
        tz_offset: tzOffsetMinutes(),
        person: { first_name: f.first_name, last_name: f.last_name, title: f.title, email: f.email, phone: f.phone },
        company: { name: f.company, website: f.website, phone: f.company_phone },
        need: f.need,
        budget: f.budget,
        timeline: f.timeline,
        notes: f.notes,
        person_choice: personChoice,
        company_choice: companyChoice,
      });
      setDone(res);
      notifyInboxChanged();
    } catch (e) {
      const d = asDecisionRequired(e);
      if (d) {
        // nothing was saved: show the matches and ask
        setDecision((p) => ({ ...p, [d.decision_required]: d.match }));
        if (d.decision_required === "person") setPersonChoice({ action: "" });
        else setCompanyChoice({ action: "" });
        setError(null);
      } else if (isNetworkError(e)) {
        setError("No connection. Nothing was lost: everything you typed is still here. Try again when you are back online.");
      } else {
        setError(e instanceof Error ? e.message : "Could not save the lead.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 rounded-xl border border-positive bg-positive-tint p-4" role="status">
        <div className="flex items-start gap-2 text-positive">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Lead saved</p>
            <p className="text-sm">
              {done.person_outcome === "CREATED" ? "New person created. " : done.person_outcome === "LINKED" ? "Added to an existing person. " : ""}
              {done.company_outcome === "CREATED" ? "New company created. " : done.company_outcome === "LINKED" ? "Linked to an existing company. " : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {done.person_id && (
            <Button asChild variant="outline">
              <Link to={`/admin/people/${done.person_id}`}>Open person</Link>
            </Button>
          )}
          {done.company_id && (
            <Button asChild variant="outline">
              <Link to={`/admin/companies/${done.company_id}`}>Open company</Link>
            </Button>
          )}
          <Button type="button" onClick={reset}>
            Add another lead
          </Button>
        </div>
      </div>
    );
  }

  const blocked = (decision.person && !personChoice.action) || (decision.company && !companyChoice.action);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <fieldset className="space-y-3">
        <legend className="mb-1 font-display text-sm font-semibold text-text-primary">Person</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="First name" htmlFor="lf-first">
            <Input id="lf-first" autoComplete="off" value={f.first_name} onChange={set("first_name")} />
          </Field>
          <Field label="Last name" htmlFor="lf-last">
            <Input id="lf-last" autoComplete="off" value={f.last_name} onChange={set("last_name")} />
          </Field>
          <Field label="Job title" htmlFor="lf-title">
            <Input id="lf-title" autoComplete="off" value={f.title} onChange={set("title")} />
          </Field>
          <Field label="Phone" htmlFor="lf-phone">
            <Input id="lf-phone" type="tel" inputMode="tel" autoComplete="off" value={f.phone} onChange={set("phone")} />
          </Field>
          <Field label="Email" htmlFor="lf-email" className="sm:col-span-2">
            <Input id="lf-email" type="email" inputMode="email" autoComplete="off" value={f.email} onChange={set("email")} />
          </Field>
        </div>
        <MatchChoice entity="person" match={decision.person} choice={personChoice} onChange={setPersonChoice} />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 font-display text-sm font-semibold text-text-primary">Company</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company name" htmlFor="lf-company" className="sm:col-span-2">
            <Input id="lf-company" autoComplete="off" value={f.company} onChange={set("company")} />
          </Field>
          <Field label="Website" htmlFor="lf-web">
            <Input id="lf-web" inputMode="url" autoComplete="off" value={f.website} onChange={set("website")} />
          </Field>
          <Field label="Company phone" htmlFor="lf-cphone">
            <Input id="lf-cphone" type="tel" inputMode="tel" autoComplete="off" value={f.company_phone} onChange={set("company_phone")} />
          </Field>
        </div>
        <MatchChoice entity="company" match={decision.company} choice={companyChoice} onChange={setCompanyChoice} />
      </fieldset>

      <div className="rounded-lg border border-line">
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm font-semibold text-text-primary"
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
        >
          <span>Need, budget, timeline and notes (optional)</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${more ? "rotate-180" : ""}`} />
        </button>
        {more && (
          <div className="grid gap-3 border-t border-line p-3 sm:grid-cols-2">
            <Field label="What do they need?" htmlFor="lf-need" className="sm:col-span-2">
              <Textarea id="lf-need" rows={2} value={f.need} onChange={set("need")} />
            </Field>
            <Field label="Budget" htmlFor="lf-budget">
              <Input id="lf-budget" autoComplete="off" value={f.budget} onChange={set("budget")} />
            </Field>
            <Field label="Timeline" htmlFor="lf-timeline">
              <Input id="lf-timeline" autoComplete="off" value={f.timeline} onChange={set("timeline")} />
            </Field>
            <Field label="Notes" htmlFor="lf-notes" className="sm:col-span-2">
              <Textarea id="lf-notes" rows={3} value={f.notes} onChange={set("notes")} />
            </Field>
          </div>
        )}
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {blocked && <ErrorBanner tone="caution">Choose link or create new above, then save again. Nothing has been saved yet.</ErrorBanner>}

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy || !hasIdentity || Boolean(blocked)}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save lead
      </Button>
    </form>
  );
}
