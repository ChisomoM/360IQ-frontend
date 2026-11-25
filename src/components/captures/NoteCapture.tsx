import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { newClientKey, tzOffsetMinutes } from "@/lib/capture/pending";
import { getSpeechRecognition } from "@/lib/capture/media";
import type { CaptureMeta, CaptureView } from "@/types/capture";
import { ErrorBanner } from "./parts";
import { SendStatus, useSender } from "./useSender";

import { scopedKey } from "@/lib/capture/pending";

const DRAFT_BASE = "captureiq.note-draft";
const draftKey = () => scopedKey(DRAFT_BASE);

function readDraft(): string {
  try {
    const k = draftKey();
    return k ? localStorage.getItem(k) ?? "" : "";
  } catch {
    return "";
  }
}

/** Quick note, typed or dictated. The unsent text is kept as a draft on this device. */
export function NoteCapture({ eventName, meta, onDone }: { eventName: string; meta: CaptureMeta | null; onDone: (v: CaptureView) => void }) {
  const [text, setText] = useState(readDraft);
  const [dictated, setDictated] = useState(false);
  const [listening, setListening] = useState(false);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const recognition = useRef<{ stop(): void } | null>(null);
  const Speech = typeof window !== "undefined" ? getSpeechRecognition() : null;
  const limit = meta?.limits.note_chars ?? 8000;
  const sender = useSender("note", (v) => {
    try {
      const k = draftKey();
      if (k) localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
    setText("");
    onDone(v);
  });

  useEffect(() => {
    try {
      const k = draftKey();
      if (k) localStorage.setItem(k, text);
    } catch {
      /* the draft is a convenience */
    }
  }, [text]);
  useEffect(() => () => recognition.current?.stop(), []);

  const toggleDictation = () => {
    if (!Speech) return;
    if (listening) {
      recognition.current?.stop();
      return;
    }
    setDictationError(null);
    const r = new Speech();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let added = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) added += e.results[i][0].transcript;
      }
      if (added.trim()) {
        setDictated(true);
        setText((t) => (t && !/\s$/.test(t) ? t + " " : t) + added.trim());
      }
    };
    r.onerror = (e) => {
      setDictationError(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Microphone access was blocked. Allow it in your browser settings, or type the note."
          : "Dictation stopped. You can keep typing."
      );
    };
    r.onend = () => setListening(false);
    recognition.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setDictationError("Dictation could not start. You can keep typing.");
    }
  };

  const send = () => {
    if (!text.trim()) return;
    void sender.start({
      id: sender.pending?.id ?? newClientKey(),
      kind: "note",
      text: text.trim(),
      dictated,
      eventName,
      tzOffset: tzOffsetMinutes(),
      createdAt: Date.now(),
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary">Write or dictate what you learned. The AI picks out the person, company, need, budget, timeline, connections and next steps for you to check.</p>
      <Textarea
        aria-label="Quick note"
        rows={7}
        value={text}
        maxLength={limit}
        onChange={(e) => setText(e.target.value)}
        placeholder="Met Chipo Banda from Zamsolar. Needs 10 solar panels by March, budget around K200,000. Send a quote on Monday."
      />
      <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
        <span>{text.length} / {limit}</span>
        {Speech ? null : <span>Dictation is not available in this browser. Use the microphone key on your keyboard.</span>}
      </div>
      {dictationError && <ErrorBanner tone="caution">{dictationError}</ErrorBanner>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="lg" onClick={send} disabled={!text.trim() || sender.busy}>
          {sender.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Read this note
        </Button>
        {Speech && (
          <Button type="button" size="lg" variant="outline" onClick={toggleDictation} aria-pressed={listening}>
            {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />} {listening ? "Stop dictating" : "Dictate"}
          </Button>
        )}
      </div>
      {Speech && <p className="text-xs text-text-muted">Dictation uses your browser's speech service.</p>}
      <SendStatus sender={sender} />
    </div>
  );
}
