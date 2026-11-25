import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ChevronDown, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaskedNotice, Panel } from "@/components/profiles/ui";
import { AiBadge, ErrorBanner, METHOD_LABEL, MethodIcon, StatusPill, aiErrorText, fmtTime, useCaptureMeta } from "@/components/captures/parts";
import { FieldReviewRow, type RowState } from "@/components/captures/FieldReviewRow";
import { MatchChoice } from "@/components/captures/MatchChoice";
import { asDecisionRequired, confirmCapture, getCapture, getCaptureImage, rejectCapture, retryCapture, saveDraft } from "@/lib/api/captures";
import { clock } from "@/lib/capture/media";
import { notifyInboxChanged } from "@/lib/hooks/useCaptureInbox";
import type { CaptureDraft, CaptureView, ConfirmResult, DraftField, EntityChoice } from "@/types/capture";
import type { MatchResult } from "@/types/profile";

interface ManualField {
  id: string;
  key: string;
  label: string;
  value: string;
}

function defaultChoice(match: MatchResult | null): EntityChoice {
  const best = match?.candidates?.[0];
  if (match && match.level === "STRONG" && best) return { action: "link", id: best.id };
  return { action: "" };
}

/**
 * Review one capture. Every AI value shows its confidence and where it came from; the
 * ones the AI is unsure about are highlighted and start unconfirmed. Confirming saves to
 * ProfileIQ in one step: values you confirmed or edited become confirmed facts, and values
 * you did not touch are kept only as AI suggestions.
 */
export function CaptureReview() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const meta = useCaptureMeta();
  const [view, setView] = useState<CaptureView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [manual, setManual] = useState<ManualField[]>([]);
  const [person, setPerson] = useState<EntityChoice>({ action: "" });
  const [company, setCompany] = useState<EntityChoice>({ action: "" });
  const [busy, setBusy] = useState<"" | "confirm" | "reject" | "retry">("");
  const [attention, setAttention] = useState(false);
  const [result, setResult] = useState<ConfirmResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<"" | "saving" | "saved">("");
  const [addKey, setAddKey] = useState("");
  const [addValue, setAddValue] = useState("");
  const [confirmReject, setConfirmReject] = useState(false);
  const initialised = useRef(false);
  const dirty = useRef(false);
  const threshold = meta?.uncertain_below ?? 0.75;

  const init = useCallback(
    (v: CaptureView) => {
      const d = new Map((v.draft?.fields ?? []).map((f) => [f.id, f]));
      const next: Record<string, RowState> = {};
      for (const f of v.fields) {
        const saved = d.get(f.id);
        if (saved) next[f.id] = { action: saved.action, value: saved.value ?? f.value, overwrite: Boolean(saved.overwrite) };
        else next[f.id] = { action: f.uncertain || f.confidence < threshold ? "pending" : "accept", value: f.value, overwrite: false };
      }
      setRows(next);
      const added = (v.draft?.fields ?? []).filter((f) => !v.fields.some((x) => x.id === f.id) && f.key);
      setManual(added.map((f, i) => ({ id: f.id || `m${i + 1}`, key: f.key as string, label: meta?.fields.find((s) => s.Key === f.key)?.Label ?? (f.key as string), value: f.value ?? "" })));
      setPerson(v.draft?.person?.action ? v.draft.person : defaultChoice(v.person_match));
      setCompany(v.draft?.company?.action ? v.draft.company : defaultChoice(v.company_match));
      initialised.current = true;
    },
    [threshold, meta]
  );

  const load = useCallback(async () => {
    try {
      const v = await getCapture(id);
      setView(v);
      setLoadError(null);
      return v;
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load this capture");
      return null;
    }
  }, [id]);

  // first load; keep polling while the AI is still reading
  useEffect(() => {
    initialised.current = false;
    void load().then((v) => v && v.status !== "PROCESSING" && init(v));
  }, [load, init]);
  useEffect(() => {
    if (view?.status !== "PROCESSING") return;
    const t = setInterval(async () => {
      const v = await load();
      if (v && v.status !== "PROCESSING") {
        init(v);
        notifyInboxChanged();
      }
    }, 3000);
    return () => clearInterval(t);
  }, [view?.status, load, init]);

  // the card photo comes through the authorised endpoint, with the session token
  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    if (view?.has_image) {
      getCaptureImage(id)
        .then((u) => {
          if (alive) {
            url = u;
            setImage(u);
          } else URL.revokeObjectURL(u);
        })
        .catch(() => alive && setImage(null));
    } else setImage(null);
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, view?.has_image]);

  const draft = useMemo<CaptureDraft>(() => {
    const fields: DraftField[] = [];
    for (const f of view?.fields ?? []) {
      const r = rows[f.id];
      if (!r || r.action === "pending") continue;
      fields.push({ id: f.id, action: r.action, value: r.action === "edit" ? r.value : undefined, overwrite: r.overwrite || undefined });
    }
    for (const m of manual) fields.push({ id: m.id, key: m.key, action: "accept", value: m.value });
    return { fields, person, company };
  }, [view?.fields, rows, manual, person, company]);

  const editable = Boolean(view && !view.masked && (view.status === "NEEDS_REVIEW" || view.status === "AI_FAILED"));

  // save the reviewer's edits as a draft, then refresh the duplicate matches for the edited values
  useEffect(() => {
    if (!editable || !initialised.current || !dirty.current) return;
    const t = setTimeout(async () => {
      setDraftState("saving");
      try {
        await saveDraft(id, draft);
        const v = await getCapture(id, person.action === "link" ? person.id : undefined, company.action === "link" ? company.id : undefined);
        setView((cur) => (cur ? { ...cur, person_match: v.person_match, company_match: v.company_match, fields: v.fields } : cur));
        // a chosen record that is no longer a candidate after the edits must not receive the save
        const stillThere = (m: MatchResult | null, ch: EntityChoice) => ch.action !== "link" || Boolean(m?.candidates?.some((c) => c.id === ch.id));
        if (!stillThere(v.person_match, person)) {
          setPerson(defaultChoice(v.person_match));
          setAttention(true);
        }
        if (!stillThere(v.company_match, company)) {
          setCompany(defaultChoice(v.company_match));
          setAttention(true);
        }
        setDraftState("saved");
      } catch {
        setDraftState("");
      }
    }, 900);
    return () => clearTimeout(t);
  }, [draft, editable, id, person, company]);

  const touch = () => {
    dirty.current = true;
  };

  const setRow = (fid: string, s: RowState) => {
    touch();
    setRows((r) => ({ ...r, [fid]: s }));
  };

  const counts = useMemo(() => {
    const fields = view?.fields ?? [];
    let confirmed = 0;
    let check = 0;
    for (const f of fields) {
      const a = rows[f.id]?.action;
      if (a === "accept" || a === "edit") confirmed++;
      else if (a === "pending") check++;
    }
    return { confirmed: confirmed + manual.length, check };
  }, [view?.fields, rows, manual]);

  const needsPersonChoice = Boolean(view?.person_match && view.person_match.candidates.length > 0 && !person.action);
  const needsCompanyChoice = Boolean(view?.company_match && view.company_match.candidates.length > 0 && !company.action);

  const confirm = async () => {
    if (!view) return;
    if (needsPersonChoice || needsCompanyChoice) {
      setAttention(true);
      toast.error("Choose link or create new for the highlighted record first.");
      return;
    }
    setBusy("confirm");
    try {
      const r = await confirmCapture(id, draft);
      setResult(r);
      notifyInboxChanged();
    } catch (e) {
      const d = asDecisionRequired(e);
      if (d) {
        setView((cur) => (cur ? { ...cur, [d.decision_required === "person" ? "person_match" : "company_match"]: d.match } : cur));
        if (d.decision_required === "person") setPerson({ action: "" });
        else setCompany({ action: "" });
        setAttention(true);
        toast.error("This looks like a record you already have. Choose what to do, then confirm again.");
      } else {
        toast.error(e instanceof Error ? e.message : "Could not save this capture");
      }
    } finally {
      setBusy("");
    }
  };

  const reject = async () => {
    setBusy("reject");
    try {
      await rejectCapture(id);
      notifyInboxChanged();
      toast.success("Capture rejected. Nothing was saved.");
      navigate("/admin/capture/inbox");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reject this capture");
    } finally {
      setBusy("");
    }
  };

  const retry = async () => {
    setBusy("retry");
    try {
      const v = await retryCapture(id);
      setView(v);
      if (v.status !== "PROCESSING") init(v);
      notifyInboxChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not try again");
    } finally {
      setBusy("");
    }
  };

  const addManual = () => {
    const spec = meta?.fields.find((s) => s.Key === addKey);
    if (!spec || !addValue.trim()) return;
    touch();
    setManual((m) => [...m, { id: `m${Date.now().toString(36)}`, key: spec.Key, label: spec.Label, value: addValue.trim() }]);
    setAddKey("");
    setAddValue("");
  };

  const choose = (setter: (c: EntityChoice) => void) => (c: EntityChoice) => {
    touch();
    setter(c);
  };

  if (loadError) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-2xl space-y-3">
          <Link to="/admin/capture/inbox" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-signal-text">
            <ArrowLeft className="h-4 w-4" /> Lead inbox
          </Link>
          <ErrorBanner>{loadError}</ErrorBanner>
        </div>
      </PageTransition>
    );
  }
  if (!view) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-2xl space-y-3" aria-busy="true">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </PageTransition>
    );
  }

  if (result) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="space-y-3 rounded-xl border border-positive bg-positive-tint p-4" role="status">
            <div className="flex items-start gap-2 text-positive">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">{result.already_confirmed ? "Already saved" : "Saved to the profile"}</p>
                <p className="text-sm">
                  {result.saved} confirmed value{result.saved === 1 ? "" : "s"} saved
                  {result.suggested > 0 ? `, ${result.suggested} kept as AI suggestion${result.suggested === 1 ? "" : "s"}` : ""}. {result.signals} signal{result.signals === 1 ? "" : "s"} recorded.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.person_id && (
                <Button asChild variant="outline">
                  <Link to={`/admin/people/${result.person_id}`}>Open person</Link>
                </Button>
              )}
              {result.company_id && (
                <Button asChild variant="outline">
                  <Link to={`/admin/companies/${result.company_id}`}>Open company</Link>
                </Button>
              )}
              <Button asChild>
                <Link to="/admin/capture/inbox">Back to inbox</Link>
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const open = view.status === "NEEDS_REVIEW" || view.status === "AI_FAILED";
  const pickable = (meta?.fields ?? []).filter((f) => f.Repeatable || !manual.some((m) => m.key === f.Key));

  return (
    <PageTransition>
      <div className="mx-auto w-full min-w-0 max-w-2xl space-y-4 pb-4">
        <Link to="/admin/capture/inbox" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-signal-text">
          <ArrowLeft className="h-4 w-4" /> Lead inbox
        </Link>

        <div className="space-y-1">
          <h1 className="flex items-center gap-2 font-display text-display-xs font-bold text-text-primary">
            <MethodIcon method={view.method} className="h-5 w-5" /> {METHOD_LABEL[view.method]}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <StatusPill status={view.status} />
            <span>{fmtTime(view.created_at)}</span>
            {view.event_name && <span className="break-words">· {view.event_name}</span>}
            {!view.mine && view.created_by_name && <span>· by {view.created_by_name}</span>}
          </div>
        </div>

        {view.masked && <MaskedNotice />}

        {view.status === "PROCESSING" && (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-1 p-4 text-sm text-text-secondary" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> The AI is reading this capture. This page updates by itself.
          </div>
        )}

        {view.status === "AI_FAILED" && (
          <div className="space-y-2">
            <ErrorBanner tone="caution">{aiErrorText(view.ai_error)}</ErrorBanner>
            {view.audio_kept && (
              <p className="text-xs text-text-muted">
                Your recording is kept so you can try again
                {view.audio_delete_by ? ` and is deleted automatically by ${fmtTime(view.audio_delete_by)}` : ""}. It is also deleted as soon as it is transcribed, or when you finish or reject this capture.
              </p>
            )}
            {view.can_retry && (
              <Button type="button" onClick={() => void retry()} disabled={busy === "retry"}>
                {busy === "retry" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Try again
              </Button>
            )}
          </div>
        )}

        {view.status === "CONFIRMED" && (
          <ErrorBanner tone="caution">
            This capture has been saved. {view.result?.person_id && <Link className="font-semibold underline" to={`/admin/people/${view.result.person_id}`}>Open the person</Link>}
          </ErrorBanner>
        )}
        {view.status === "REJECTED" && <ErrorBanner tone="caution">This capture was rejected and its content was removed.</ErrorBanner>}

        {/* what was captured */}
        {!view.masked && (image || view.text || view.transcript.length > 0) && (
          <Panel title="What was captured">
            {image && <img src={image} alt="Captured business card" className="mb-3 max-h-72 w-full rounded-lg border border-line bg-surface-2 object-contain" />}
            {view.text && <p className="whitespace-pre-wrap break-words text-sm text-text-primary">{view.text}</p>}
            {view.transcript.length > 0 && (
              <details className="group" open={view.fields.length === 0}>
                <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-text-primary">
                  <span className="flex items-center gap-2">
                    Transcript <AiBadge />
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <ol className="mt-2 space-y-1.5 text-sm">
                  {view.transcript.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="w-10 shrink-0 tabular-nums text-text-muted">{clock(s.start)}</span>
                      <span className="min-w-0 break-words text-text-primary">{s.text}</span>
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </Panel>
        )}

        {/* proposed values */}
        {(view.fields.length > 0 || manual.length > 0 || open) && (
          <Panel
            title={view.status === "AI_FAILED" ? "Fill in by hand" : "What the AI read"}
            action={draftState ? <span className="text-xs text-text-muted">{draftState === "saving" ? "Saving draft…" : "Draft saved"}</span> : undefined}
          >
            {view.fields.length > 0 && (
              <>
                <p className="mb-3 text-sm text-text-secondary">
                  Everything below was read by AI. Confirm it, fix it or reject it.
                  {view.status === "NEEDS_REVIEW" && counts.check > 0 && " Highlighted values are ones the AI is unsure about: if you leave them, they are kept only as suggestions."}
                </p>
                <ul className="space-y-3">
                  {view.fields.map((f) => (
                    <FieldReviewRow
                      key={f.id}
                      field={f}
                      state={rows[f.id] ?? { action: "pending", value: f.value, overwrite: false }}
                      onChange={(s) => setRow(f.id, s)}
                      disabled={!editable}
                      uncertainBelow={threshold}
                    />
                  ))}
                </ul>
              </>
            )}
            {view.fields.length === 0 && view.status !== "AI_FAILED" && <p className="text-sm text-text-secondary">The AI did not find any details.</p>}
            {(view.dropped > 0 || view.withheld) && (
              <p className="mt-3 text-xs text-text-muted">
                {view.withheld ? "Some values may mention a protected category (for example health, religion or political views). They are marked and will not be saved unless you accept or edit them. Do not keep personal details about a person; keep only business facts. " : ""}
                {view.dropped > 0 ? `${view.dropped} item${view.dropped === 1 ? " was" : "s were"} ignored because it did not fit the allowed fields. ` : ""}
              </p>
            )}

            {manual.length > 0 && (
              <ul className="mt-3 space-y-2">
                {manual.map((m) => (
                  <li key={m.id} className="flex min-w-0 items-start gap-2 rounded-lg border border-line bg-surface-1 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{m.label} · added by you</p>
                      <p className="break-words text-base text-text-primary">{m.value}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${m.label}`} onClick={() => { touch(); setManual((x) => x.filter((y) => y.id !== m.id)); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {editable && (
              <div className="mt-4 space-y-2 rounded-lg border border-dashed border-line-strong p-3">
                <p className="text-sm font-semibold text-text-primary">Add a detail yourself</p>
                <Select value={addKey} onValueChange={setAddKey}>
                  <SelectTrigger aria-label="Detail to add">
                    <SelectValue placeholder="Choose a detail" />
                  </SelectTrigger>
                  <SelectContent>
                    {pickable.map((f) => (
                      <SelectItem key={f.Key} value={f.Key}>
                        {f.Label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input aria-label="Value" value={addValue} onChange={(e) => setAddValue(e.target.value)} placeholder="Value" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={addManual} disabled={!addKey || !addValue.trim()}>
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                  {view.method === "NOTE" && view.text && view.text.length <= 2000 && !manual.some((m) => m.key === "note") && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        touch();
                        setManual((m) => [...m, { id: `m${Date.now().toString(36)}`, key: "note", label: "Note", value: view.text }]);
                      }}
                    >
                      Use my text as a note
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Panel>
        )}

        {/* duplicates */}
        {editable && ((view.person_match?.candidates.length ?? 0) > 0 || (view.company_match?.candidates.length ?? 0) > 0) && (
          <Panel title="Already in 360IQ?">
            <div className="space-y-3">
              <MatchChoice entity="company" match={view.company_match} choice={company} onChange={choose(setCompany)} attention={attention && needsCompanyChoice} />
              <MatchChoice entity="person" match={view.person_match} choice={person} onChange={choose(setPerson)} attention={attention && needsPersonChoice} />
            </div>
          </Panel>
        )}

        {/* actions */}
        {editable && (
          <div className="sticky bottom-0 z-20 -mx-4 border-t border-line bg-surface-1 px-4 py-3 md:mx-0 md:rounded-xl md:border">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-secondary" aria-live="polite">
                {counts.confirmed} confirmed{counts.check > 0 ? `, ${counts.check} still need a check` : ""}
              </p>
              <div className="flex gap-2">
                {confirmReject ? (
                  <>
                    <Button type="button" variant="destructive" className="h-11" onClick={() => void reject()} disabled={busy !== ""}>
                      {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Yes, reject
                    </Button>
                    <Button type="button" variant="outline" className="h-11" onClick={() => setConfirmReject(false)}>
                      Keep
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" className="h-11 flex-1 sm:flex-none" onClick={() => setConfirmReject(true)} disabled={busy !== ""}>
                      Reject lead
                    </Button>
                    <Button type="button" className="h-11 flex-1 sm:flex-none" onClick={() => void confirm()} disabled={busy !== "" || (draft.fields.length === 0 && counts.check === 0 && person.action !== "link" && company.action !== "link")}>
                      {busy === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Confirm and save
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
