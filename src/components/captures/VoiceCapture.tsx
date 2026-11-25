import { useCallback, useEffect, useRef, useState } from "react";
import { FileAudio, Loader2, Mic, MicOff, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { newClientKey, savePending, tzOffsetMinutes } from "@/lib/capture/pending";
import { classifyMicError, clock, extensionFor, micSupport, pickRecorderType, type MicError } from "@/lib/capture/media";
import type { CaptureMeta, CaptureView } from "@/types/capture";
import { ErrorBanner } from "./parts";
import { SendStatus, useSender } from "./useSender";

const MIC_HELP: Record<MicError, string> = {
  denied: "Microphone access was blocked. Allow the microphone for this site in your browser settings and try again, or choose an audio file instead.",
  "no-device": "No microphone was found on this device. You can choose an audio file instead.",
  busy: "The microphone is being used by another app. Close it and try again, or choose an audio file instead.",
  other: "The microphone could not be started. You can choose an audio file instead.",
};

interface Recording {
  blob: Blob;
  url: string;
  mime: string;
  seconds: number;
}

/**
 * Voice debrief. Records in the browser with MediaRecorder (WebM/Opus in Chrome and
 * Firefox, MP4/AAC in Safari) or takes an audio file. The recording is kept on the
 * device until the server has stored it. After transcription the server deletes the audio.
 */
export function VoiceCapture({ eventName, meta, onDone }: { eventName: string; meta: CaptureMeta | null; onDone: (v: CaptureView) => void }) {
  const support = micSupport();
  const maxSeconds = meta?.limits.audio_seconds ?? 600;
  const maxBytes = meta?.limits.audio_bytes ?? 15 << 20;
  const file = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef(0);
  const mounted = useRef(true);

  const [state, setState] = useState<"idle" | "starting" | "recording" | "ready">("idle");
  const [seconds, setSeconds] = useState(0);
  const [rec, setRec] = useState<Recording | null>(null);
  const [micError, setMicError] = useState<MicError | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const sender = useSender("recording", onDone);
  const keepRef = useRef(sender.keep);
  keepRef.current = sender.keep;

  const releaseMic = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }, []);

  // Leaving the page while recording must not lose the debrief: the recorder is stopped
  // and its onstop handler stores what was recorded on this device (see onstop below).
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
      else releaseMic();
    };
  }, [releaseMic]);
  useEffect(
    () => () => {
      if (rec) URL.revokeObjectURL(rec.url);
    },
    [rec]
  );

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  }, []);

  const start = async () => {
    setMicError(null);
    setProblem(null);
    setState("starting");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = s;
      const type = pickRecorderType();
      const r = type ? new MediaRecorder(s, { mimeType: type }) : new MediaRecorder(s);
      chunks.current = [];
      r.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.current.push(e.data);
      };
      r.onstop = () => {
        const mime = r.mimeType || type || "audio/webm";
        const blob = new Blob(chunks.current, { type: mime });
        const secs = Math.round((Date.now() - started.current) / 1000);
        releaseMic();
        if (!mounted.current) {
          // the user left the page: keep the recording on this device, it appears under "Not sent yet"
          if (blob.size > 0 && blob.size <= maxBytes) {
            void savePending({ id: newClientKey(), kind: "voice", blob, filename: `debrief.${extensionFor(mime)}`, eventName, tzOffset: tzOffsetMinutes(), createdAt: Date.now() });
          }
          return;
        }
        if (blob.size === 0) {
          setProblem("Nothing was recorded. Try again.");
          setState("idle");
          return;
        }
        if (blob.size > maxBytes) {
          setProblem(`This recording is larger than ${Math.round(maxBytes / (1 << 20))} MB. Record a shorter debrief.`);
          setState("idle");
          return;
        }
        setRec({ blob, url: URL.createObjectURL(blob), mime, seconds: secs });
        setState("ready");
        // stored on this device straight away, so closing the tab before Send does not lose it
        void keepRef.current({ id: newClientKey(), kind: "voice", blob, filename: `debrief.${extensionFor(mime)}`, eventName, tzOffset: tzOffsetMinutes(), createdAt: Date.now() });
      };
      recorder.current = r;
      r.start(1000); // a chunk every second, so little is lost if the tab is interrupted
      started.current = Date.now();
      setSeconds(0);
      setState("recording");
      timer.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - started.current) / 1000);
        setSeconds(elapsed);
        if (elapsed >= maxSeconds) stop();
      }, 500);
    } catch (e) {
      releaseMic();
      setMicError(classifyMicError(e));
      setState("idle");
    }
  };

  const chooseFile = (f: File | undefined) => {
    if (!f) return;
    setProblem(null);
    if (f.size > maxBytes) {
      setProblem(`This file is larger than ${Math.round(maxBytes / (1 << 20))} MB.`);
      return;
    }
    void sender.discard(); // a different file is a different capture
    setRec({ blob: f, url: URL.createObjectURL(f), mime: f.type || "audio/webm", seconds: 0 });
    setState("ready");
    void sender.keep({ id: newClientKey(), kind: "voice", blob: f, filename: f.name, eventName, tzOffset: tzOffsetMinutes(), createdAt: Date.now() });
  };

  const send = () => {
    if (!rec) return;
    const name = rec.blob instanceof File ? rec.blob.name : `debrief.${extensionFor(rec.mime)}`;
    void sender.start({
      id: sender.pending?.id ?? newClientKey(),
      kind: "voice",
      blob: rec.blob,
      filename: name,
      eventName,
      tzOffset: tzOffsetMinutes(),
      createdAt: Date.now(),
    });
  };

  const again = async () => {
    await sender.discard();
    setRec(null);
    setState("idle");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Say who you met, what they need, budget, timeline, who they mentioned and what you agreed to do next. The recording is transcribed with times, then deleted. You keep the transcript.
      </p>

      <input ref={file} type="file" accept="audio/*,video/webm,video/mp4" className="sr-only" aria-label="Choose an audio file" onChange={(e) => { chooseFile(e.target.files?.[0]); e.target.value = ""; }} />

      {support === "insecure" && <ErrorBanner tone="caution">Recording needs a secure (https) connection. You can choose an audio file instead.</ErrorBanner>}
      {support === "unsupported" && <ErrorBanner tone="caution">This browser cannot record audio. You can choose an audio file instead.</ErrorBanner>}
      {micError && (
        <ErrorBanner tone="caution">
          <span className="flex items-start gap-2">
            <MicOff className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{MIC_HELP[micError]}</span>
          </span>
        </ErrorBanner>
      )}
      {problem && <ErrorBanner>{problem}</ErrorBanner>}

      {state === "recording" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface-0 px-4 py-6" role="status" aria-live="polite">
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-risk opacity-60" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-risk" />
          </span>
          <p className="font-display text-3xl font-semibold tabular-nums text-text-primary">{clock(seconds)}</p>
          <p className="text-xs text-text-muted">Recording stops by itself at {clock(maxSeconds)}</p>
          <Button type="button" size="lg" className="h-14 w-full sm:w-auto" onClick={stop}>
            <Square className="h-5 w-5" /> Stop
          </Button>
        </div>
      )}

      {(state === "idle" || state === "starting") && (
        <div className="grid gap-2 sm:grid-cols-2">
          {support === "ok" && (
            <Button type="button" size="lg" className="h-14" onClick={() => void start()} disabled={state === "starting"}>
              {state === "starting" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />} Start recording
            </Button>
          )}
          <Button type="button" size="lg" variant="outline" className="h-14" onClick={() => file.current?.click()}>
            <FileAudio className="h-5 w-5" /> Choose an audio file
          </Button>
        </div>
      )}

      {state === "ready" && rec && (
        <div className="space-y-3">
          <audio controls src={rec.url} className="w-full" aria-label="Your recording" />
          <p className="text-xs text-text-muted">
            {rec.seconds > 0 ? `${clock(rec.seconds)} · ` : ""}
            {(rec.blob.size / (1 << 20)).toFixed(1)} MB
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" onClick={send} disabled={sender.busy}>
              {sender.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Transcribe and review
            </Button>
            <Button type="button" size="lg" variant="outline" onClick={() => void again()} disabled={sender.busy}>
              <RotateCcw className="h-4 w-4" /> Record again
            </Button>
          </div>
        </div>
      )}
      <SendStatus sender={sender} />
    </div>
  );
}
