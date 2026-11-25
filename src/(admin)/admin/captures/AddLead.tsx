import { scopedKey } from "@/lib/capture/pending";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, FileText, Inbox, Mic, PenLine } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/profiles/ui";
import { CardCapture } from "@/components/captures/CardCapture";
import { LeadForm } from "@/components/captures/LeadForm";
import { NoteCapture } from "@/components/captures/NoteCapture";
import { PendingUploads } from "@/components/captures/PendingUploads";
import { VoiceCapture } from "@/components/captures/VoiceCapture";
import { ErrorBanner, useCaptureMeta } from "@/components/captures/parts";
import { cn } from "@/lib/utils";
import type { CaptureView } from "@/types/capture";

type Method = "form" | "card" | "voice" | "note";

const METHODS: { id: Method; label: string; icon: typeof FileText }[] = [
  { id: "form", label: "Form", icon: FileText },
  { id: "card", label: "Card", icon: Camera },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "note", label: "Note", icon: PenLine },
];

const EVENT_BASE = "captureiq.event";
const eventKey = () => scopedKey(EVENT_BASE);

function readEvent(): string {
  try {
    const k = eventKey();
    return k ? localStorage.getItem(k) ?? "" : "";
  } catch {
    return "";
  }
}

/** Add a lead: pick a method, optionally name the event, capture. AI captures go to the review inbox. */
export function AddLead() {
  const navigate = useNavigate();
  const meta = useCaptureMeta();
  const [method, setMethod] = useState<Method>("form");
  const [eventName, setEventName] = useState(readEvent);

  useEffect(() => {
    try {
      const k = eventKey();
      if (k) localStorage.setItem(k, eventName);
    } catch {
      /* the event name is a convenience */
    }
  }, [eventName]);

  const sent = useCallback(
    (v: CaptureView) => {
      navigate(`/admin/capture/${v.id}`);
    },
    [navigate]
  );

  const canCapture = meta ? meta.permissions.create : true;

  return (
    <PageTransition>
      <div className="mx-auto w-full min-w-0 max-w-2xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-display-xs font-bold text-text-primary">Add a lead</h1>
            <p className="text-sm text-text-secondary">Four ways in. Anything read by AI waits in your inbox for you to check before it reaches a profile.</p>
          </div>
          {meta?.permissions.review && (
            <Link to="/admin/capture/inbox" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-signal-text hover:underline">
              <Inbox className="h-4 w-4" /> Lead inbox
            </Link>
          )}
        </div>

        {meta && !canCapture && <ErrorBanner tone="caution">You do not have permission to capture leads.</ErrorBanner>}
        {meta && !meta.ai_available && (
          <ErrorBanner tone="caution">AI reading is not set up here. Cards, voice and notes are still saved, and you finish them by hand in the inbox. The form works as normal.</ErrorBanner>
        )}

        <PendingUploads onSent={sent} />

        <Panel>
          <div className="space-y-1.5">
            <Label htmlFor="event-name" className="text-sm">
              Event or source <span className="font-normal text-text-muted">(optional)</span>
            </Label>
            <Input
              id="event-name"
              list="event-suggestions"
              autoComplete="off"
              maxLength={120}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Mulungushi Expo 2026"
            />
            <datalist id="event-suggestions">
              {(meta?.recent_events ?? []).map((ev) => (
                <option key={ev} value={ev} />
              ))}
            </datalist>
            <p className="text-xs text-text-muted">Kept on every lead you capture, and remembered on this device.</p>
          </div>
        </Panel>

        <div role="tablist" aria-label="Capture method" className="grid grid-cols-4 gap-1 rounded-xl bg-surface-2 p-1">
          {METHODS.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={method === m.id}
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus sm:flex-row sm:gap-2 sm:text-sm",
                method === m.id ? "bg-surface-1 text-text-primary shadow-raised" : "text-text-muted hover:text-text-secondary"
              )}
            >
              <m.icon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" />
              {m.label}
            </button>
          ))}
        </div>

        <Panel>
          {method === "form" && <LeadForm eventName={eventName} />}
          {method === "card" && <CardCapture eventName={eventName} meta={meta} onDone={sent} />}
          {method === "voice" && <VoiceCapture eventName={eventName} meta={meta} onDone={sent} />}
          {method === "note" && <NoteCapture eventName={eventName} meta={meta} onDone={sent} />}
        </Panel>
      </div>
    </PageTransition>
  );
}
