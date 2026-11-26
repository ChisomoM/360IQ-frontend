import { scopedKey } from "@/lib/capture/pending";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Camera, FileText, Inbox, Mic, PenLine } from "@/components/icons";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { Field } from "@/components/profiles/formParts";
import { CardCapture } from "@/components/captures/CardCapture";
import { LeadForm } from "@/components/captures/LeadForm";
import { NoteCapture } from "@/components/captures/NoteCapture";
import { PendingUploads } from "@/components/captures/PendingUploads";
import { VoiceCapture } from "@/components/captures/VoiceCapture";
import { ErrorBanner, useCaptureMeta } from "@/components/captures/parts";
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
  const voiceOff = Boolean(meta && !meta.voice_available);

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
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-5">
        <PageHeader
          title="Add a lead"
          description="Four ways in. Anything read by AI waits in your inbox for you to check before it reaches a profile."
          actions={
            meta?.permissions.review && (
              <Button asChild variant="secondary">
                <Link to="/admin/capture/inbox">
                  <Inbox /> Lead inbox
                </Link>
              </Button>
            )
          }
        />

        {meta && !canCapture && <ErrorBanner tone="caution">You do not have permission to capture leads.</ErrorBanner>}
        {meta && !meta.ai_available && (
          <ErrorBanner tone="caution">AI reading is not set up here. Cards, voice and notes are still saved, and you finish them by hand in the inbox. The form works as normal.</ErrorBanner>
        )}

        <PendingUploads onSent={sent} />

        <SectionCard>
          <Field label="Event or source (optional)" htmlFor="event-name" hint="Kept on every lead you capture, and remembered on this device.">
            <Input
              id="event-name"
              list="event-suggestions"
              autoComplete="off"
              maxLength={120}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Zambia ICT Expo, Mulungushi"
            />
          </Field>
          <datalist id="event-suggestions">
            {(meta?.recent_events ?? []).map((ev) => (
              <option key={ev} value={ev} />
            ))}
          </datalist>
        </SectionCard>

        <Tabs value={method} onValueChange={(v) => setMethod(v as Method)} className="min-w-0">
          <TabsList aria-label="Capture method" className="grid w-full grid-cols-4">
            {METHODS.map((m) => (
              <TabsTrigger
                key={m.id}
                value={m.id}
                disabled={m.id === "voice" && voiceOff}
                title={m.id === "voice" && voiceOff ? "Voice needs an AI provider that can read audio, which is not set up here" : undefined}
                className="min-w-0 gap-1.5 px-1"
              >
                <m.icon size={16} className="shrink-0" />
                {m.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={method}>
            <SectionCard>
              {method === "form" && <LeadForm eventName={eventName} />}
              {method === "card" && <CardCapture eventName={eventName} meta={meta} onDone={sent} />}
              {method === "voice" && voiceOff && <ErrorBanner tone="caution">Voice debriefs are switched off: no AI provider that can read audio is set up. Use a note instead.</ErrorBanner>}
              {method === "voice" && !voiceOff && <VoiceCapture eventName={eventName} meta={meta} onDone={sent} />}
              {method === "note" && <NoteCapture eventName={eventName} meta={meta} onDone={sent} />}
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
