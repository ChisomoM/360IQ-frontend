import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ChevronDown, Loader2, Plus, RefreshCw, Sparkles, Trash2 } from "@/components/icons";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { MaskedNotice } from "@/components/profiles/ui";
import { Field } from "@/components/profiles/formParts";
import { cn } from "@/lib/utils";
import { AiBadge, ErrorBanner, METHOD_LABEL, MethodIcon, StatusPill, aiErrorText, fmtTime, useCaptureMeta } from "@/components/captures/parts";
import { FieldReviewRow, type RowState } from "@/components/captures/FieldReviewRow";
import { MatchChoice } from "@/components/captures/MatchChoice";
import { asDecisionRequired, confirmCapture, getCapture, getCaptureAudio, getCaptureImage, rejectCapture, retryCapture, saveDraft, saveTranscript } from "@/lib/api/captures";
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
  // init is read through a ref: it changes when the page metadata arrives, and re-running the load then
  // would reset everything the reviewer has already edited.
  const initRef = useRef(init);
  initRef.current = init;
  useEffect(() => {
    initialised.current = false;
    dirty.current = false;
    void load().then((v) => v && v.status !== "PROCESSING" && initRef.current(v));
  }, [load]);
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
        const stillThere = (m: MatchResult | null, ch: EntityChoice) => ch.action !== "link" || Boolean(ch.pick) || Boolean(m?.candidates?.some((c) => c.id === ch.id));
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

  // edits made less than a second before leaving the page are saved on the way out
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const editableRef = useRef(editable);
  editableRef.current = editable;
  useEffect(
    () => () => {
      if (dirty.current && editableRef.current && initialised.current) void saveDraft(id, draftRef.current).catch(() => undefined);
    },
    [id]
  );

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

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);
  const loadAudio = async () => {
    try {
      setAudioUrl(await getCaptureAudio(id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load the recording");
    }
  };
  const submitTranscript = async () => {
    setBusy("retry");
    try {
      const v = await saveTranscript(id, typed);
      setView(v);
      setAudioUrl(null);
      if (v.status !== "PROCESSING") init(v);
      notifyInboxChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save the transcript");
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

  const crumb = (
    <Link to="/admin/capture/inbox" className="inline-flex items-center gap-1 font-medium text-signal-text hover:underline">
      <ArrowLeft size={14} /> Lead inbox
    </Link>
  );

  if (loadError || !view) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <PageHeader crumb={crumb} title="Review capture" />
          <SectionCard padded={false}>
            <SectionBody loading={!loadError} error={loadError ?? undefined}>
              {null}
            </SectionBody>
          </SectionCard>
        </div>
      </PageTransition>
    );
  }

  if (result) {
    return (
      <PageTransition>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <PageHeader crumb={crumb} title={result.already_confirmed ? "Already saved" : "Saved to the profile"} />
          <SectionCard>
            <div className="flex flex-col items-center gap-4 py-4 text-center" role="status">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-positive-tint text-positive">
                <CheckCircle2 size={24} />
              </div>
              <p className="max-w-[44ch] text-sm text-text-secondary">
                {result.saved} confirmed value{result.saved === 1 ? "" : "s"} saved
                {result.suggested > 0 ? `, ${result.suggested} kept as AI suggestion${result.suggested === 1 ? "" : "s"}` : ""}. {result.signals} signal{result.signals === 1 ? "" : "s"} recorded.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {result.person_id && (
                  <Button asChild variant="secondary">
                    <Link to={`/admin/people/${result.person_id}`}>Open person</Link>
                  </Button>
                )}
                {result.company_id && (
                  <Button asChild variant="secondary">
                    <Link to={`/admin/companies/${result.company_id}`}>Open company</Link>
                  </Button>
                )}
                <Button asChild>
                  <Link to="/admin/capture/inbox">Back to inbox</Link>
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </PageTransition>
    );
  }

  const open = view.status === "NEEDS_REVIEW" || view.status === "AI_FAILED";
  const pickable = (meta?.fields ?? []).filter((f) => f.Repeatable || !manual.some((m) => m.key === f.Key));

  // layout only: what goes in which column
  const hasCaptured = Boolean(!view.masked && (image || view.text || view.transcript.length > 0));
  const showValues = view.fields.length > 0 || manual.length > 0 || open;
  const hasMatches = editable && ((view.person_match?.candidates.length ?? 0) > 0 || (view.company_match?.candidates.length ?? 0) > 0);
  const twoColumns = showValues && (hasCaptured || hasMatches);
  const showAiCard = view.fields.length > 0 || view.status !== "AI_FAILED" || view.dropped > 0 || view.withheld;
  const showManualCard = manual.length > 0 || editable || view.status === "AI_FAILED";

  return (
    <PageTransition>
      <div className={cn("mx-auto flex w-full min-w-0 flex-col gap-5 pb-4", !twoColumns && "max-w-3xl")}>
        <div className="space-y-3">
          <PageHeader crumb={crumb} title={METHOD_LABEL[view.method]} />
          <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <StatusPill status={view.status} />
            <MethodIcon method={view.method} className="text-text-muted" />
            <span className="font-mono text-xs">{fmtTime(view.created_at)}</span>
            {view.event_name && <span className="break-words">· {view.event_name}</span>}
            {!view.mine && view.created_by_name && <span>· by {view.created_by_name}</span>}
          </div>
        </div>

        {view.masked && <MaskedNotice />}

        {view.status === "PROCESSING" && (
          <SectionCard tone="ai">
            <div className="space-y-3" role="status">
              <p className="flex items-center gap-2 text-sm font-semibold text-signal-text">
                <Sparkles size={16} /> 360IQ is reading this capture…
              </p>
              <p className="text-sm text-text-secondary">This page updates by itself.</p>
              <div className="skeleton h-4 w-2/3 rounded-xs" />
              <div className="skeleton h-4 w-1/2 rounded-xs" />
            </div>
          </SectionCard>
        )}

        {view.status === "AI_FAILED" && <ErrorBanner tone="caution">{aiErrorText(view.ai_error)}</ErrorBanner>}

        {view.status === "AI_FAILED" && (view.audio_kept || view.can_retry) && (
          <SectionCard title={view.audio_kept ? "Your recording" : "Read it again"}>
            <div className="space-y-3">
              {view.audio_kept && (
                <>
                  <p className="text-xs text-text-muted">
                    Your recording is kept until it is transcribed. It is deleted as soon as it is transcribed (by the AI or by you), or when you finish or reject this capture.
                  </p>
                  {view.can_play_audio && (
                    <div className="space-y-3">
                      {audioUrl ? (
                        <audio controls src={audioUrl} className="w-full" />
                      ) : (
                        <Button type="button" variant="secondary" onClick={() => void loadAudio()}>
                          Play recording
                        </Button>
                      )}
                      <Field label="Or type what was said" htmlFor="typed-transcript">
                        <Textarea id="typed-transcript" value={typed} onChange={(e) => setTyped(e.target.value)} rows={5} />
                      </Field>
                      <Button type="button" variant="secondary" disabled={!typed.trim() || busy === "retry"} onClick={() => void submitTranscript()}>
                        Save transcript
                      </Button>
                    </div>
                  )}
                </>
              )}
              {view.can_retry && (
                <Button type="button" variant="secondary" onClick={() => void retry()} disabled={busy === "retry"}>
                  {busy === "retry" ? <Loader2 className="animate-spin" /> : <RefreshCw />} Try again
                </Button>
              )}
            </div>
          </SectionCard>
        )}

        {view.status === "CONFIRMED" && (
          <div className="flex items-start gap-2 rounded-md bg-positive-tint px-4 py-3 text-sm text-positive" role="status">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <p>
              This capture has been saved. {view.result?.person_id && <Link className="font-semibold underline" to={`/admin/people/${view.result.person_id}`}>Open the person</Link>}
            </p>
          </div>
        )}
        {view.status === "REJECTED" && <p className="rounded-md bg-field px-4 py-3 text-sm text-text-secondary">This capture was rejected and its content was removed.</p>}

        <div className={cn("grid grid-cols-1 items-start gap-5", twoColumns && "lg:grid-cols-[1.35fr_1fr] lg:grid-rows-[auto_1fr]")}>
          {/* what was captured */}
          {hasCaptured && (
            <SectionCard title="What was captured" className={cn(twoColumns && "lg:col-start-2 lg:row-start-1")}>
              {image && <img src={image} alt="Captured business card" className="mb-3 max-h-72 w-full rounded-md border border-line bg-surface-2 object-contain" />}
              {view.text && <p className="whitespace-pre-wrap break-words text-sm text-text-primary">{view.text}</p>}
              {view.transcript.length > 0 && (
                <details className="group iq-grad-border rounded-md bg-signal-tint px-3 py-1 [--surface-1:var(--signal-tint)]" open={view.fields.length === 0}>
                  <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-text-primary">
                    <span className="flex items-center gap-2">
                      Transcript <AiBadge />
                    </span>
                    <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <ol className="mt-2 space-y-1.5 pb-2 text-sm">
                    {view.transcript.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="w-12 shrink-0 font-mono text-xs leading-5 text-text-muted">{clock(s.start)}</span>
                        <span className="min-w-0 break-words text-text-primary">{s.text}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </SectionCard>
          )}

          {/* proposed values */}
          {showValues && (
            <div className={cn("grid min-w-0 gap-5", twoColumns && "lg:col-start-1 lg:row-span-2 lg:row-start-1")}>
              {showAiCard && (
                <SectionCard
                  tone="ai"
                  eyebrow={
                    <span className="flex items-center gap-1.5 text-signal-text">
                      <Sparkles size={16} /> AI read from: {METHOD_LABEL[view.method]}
                    </span>
                  }
                  title="What the AI read"
                >
                  {view.fields.length > 0 && (
                    <>
                      <p className="mb-3 text-sm text-text-secondary">
                        Everything below was read by AI. Confirm it, fix it or reject it.
                        {view.status === "NEEDS_REVIEW" && counts.check > 0 && " Values marked Check this are ones the AI is unsure about: if you leave them, they are kept only as suggestions."}
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
                </SectionCard>
              )}

              {showManualCard && (
                <SectionCard title={view.status === "AI_FAILED" ? "Fill in by hand" : "Details you add"}>
                  {manual.length > 0 && (
                    <ul className="divide-y divide-line">
                      {manual.map((m) => (
                        <li key={m.id} className="flex min-w-0 items-start gap-2 py-3 first:pt-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-text-muted">{m.label} · added by you</p>
                            <p className="break-words text-base text-text-primary">{m.value}</p>
                          </div>
                          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${m.label}`} onClick={() => { touch(); setManual((x) => x.filter((y) => y.id !== m.id)); }}>
                            <Trash2 />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {!editable && manual.length === 0 && <p className="text-sm text-text-muted">No details added.</p>}

                  {editable && (
                    <div className={cn("space-y-3", manual.length > 0 && "border-t border-line pt-3")}>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Detail" htmlFor="add-detail">
                          <Select value={addKey} onValueChange={setAddKey}>
                            <SelectTrigger id="add-detail" aria-label="Detail to add">
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
                        </Field>
                        <Field label="Value" htmlFor="add-value">
                          <Input id="add-value" value={addValue} onChange={(e) => setAddValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addManual())} />
                        </Field>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" onClick={addManual} disabled={!addKey || !addValue.trim()}>
                          <Plus /> Add detail
                        </Button>
                        {view.method === "NOTE" && view.text && view.text.length <= 2000 && !manual.some((m) => m.key === "note") && (
                          <Button
                            type="button"
                            variant="ghost"
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
                </SectionCard>
              )}
            </div>
          )}

          {/* duplicates */}
          {hasMatches && (
            <SectionCard title="Already in 360IQ?" className={cn(twoColumns && "lg:col-start-2", twoColumns && (hasCaptured ? "lg:row-start-2" : "lg:row-start-1"))}>
              <div className="space-y-3">
                <MatchChoice entity="company" match={view.company_match} choice={company} onChange={choose(setCompany)} attention={attention && needsCompanyChoice} canMerge={Boolean(meta?.permissions.merge)} onMerged={() => void load().then((v) => v && init(v))} />
                <MatchChoice entity="person" match={view.person_match} choice={person} onChange={choose(setPerson)} attention={attention && needsPersonChoice} canMerge={Boolean(meta?.permissions.merge)} onMerged={() => void load().then((v) => v && init(v))} />
              </div>
            </SectionCard>
          )}
        </div>

        {/* actions */}
        {editable && (
          <div className="sticky bottom-0 z-20 rounded-lg border border-line bg-surface-1 px-4 py-3 shadow-raised">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-secondary" aria-live="polite">
                {counts.confirmed} confirmed{counts.check > 0 ? `, ${counts.check} still need a check` : ""}
                {draftState && <span className="text-text-muted"> · {draftState === "saving" ? "Saving draft…" : "Draft saved"}</span>}
              </p>
              <div className="flex gap-2">
                {confirmReject ? (
                  <>
                    <Button type="button" variant="destructive" size="lg" onClick={() => void reject()} disabled={busy !== ""}>
                      {busy === "reject" ? <Loader2 className="animate-spin" /> : null} Reject lead
                    </Button>
                    <Button type="button" variant="secondary" size="lg" onClick={() => setConfirmReject(false)}>
                      Keep lead
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="secondary" size="lg" className="flex-1 sm:flex-none" onClick={() => setConfirmReject(true)} disabled={busy !== ""}>
                      Reject lead
                    </Button>
                    <Button type="button" size="lg" className="flex-1 sm:flex-none" onClick={() => void confirm()} disabled={busy !== "" || (draft.fields.length === 0 && counts.check === 0 && person.action !== "link" && company.action !== "link")}>
                      {busy === "confirm" ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Confirm and save
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
