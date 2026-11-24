import { useCallback, useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isNetworkError, submitFile, submitNote } from "@/lib/api/captures";
import { deletePending, savePending, type PendingCapture } from "@/lib/capture/pending";
import { notifyInboxChanged } from "@/lib/hooks/useCaptureInbox";
import type { CaptureView } from "@/types/capture";
import { ErrorBanner } from "./parts";

/** Sends one stored capture to the server. It is removed from the device only after the server has stored it. */
export async function sendPending(p: PendingCapture): Promise<CaptureView> {
  try {
    const view =
      p.kind === "note"
        ? await submitNote({ client_key: p.id, text: p.text ?? "", dictated: !!p.dictated, event_name: p.eventName, tz_offset: p.tzOffset })
        : await submitFile(p.kind, p.blob as Blob, p.filename ?? (p.kind === "card" ? "card.jpg" : "debrief.webm"), {
            client_key: p.id,
            event_name: p.eventName,
            tz_offset: p.tzOffset,
          });
    await deletePending(p.id);
    notifyInboxChanged();
    return view;
  } catch (e) {
    await savePending({ ...p, lastError: e instanceof Error ? e.message : "Upload failed" });
    throw e;
  }
}

export function sendErrorText(e: unknown, what: string): string {
  if (isNetworkError(e)) return `No connection. Your ${what} is kept on this device: send it again when you are back online.`;
  return `${e instanceof Error ? e.message : "The upload failed."} Your ${what} is kept on this device: you can send it again.`;
}

/** Holds the capture being sent, and the retry and discard actions when sending fails. */
export function useSender(what: string, onDone: (v: CaptureView) => void) {
  const [pending, setPending] = useState<PendingCapture | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attempt = useCallback(
    async (p: PendingCapture) => {
      setBusy(true);
      setError(null);
      try {
        const v = await sendPending(p);
        setPending(null);
        onDone(v);
      } catch (e) {
        setError(sendErrorText(e, what));
      } finally {
        setBusy(false);
      }
    },
    [onDone, what]
  );

  const start = useCallback(
    async (p: PendingCapture) => {
      setPending(p);
      await savePending(p); // written before the first attempt, so nothing is lost if it fails
      await attempt(p);
    },
    [attempt]
  );

  const discard = useCallback(async () => {
    if (pending) await deletePending(pending.id);
    setPending(null);
    setError(null);
  }, [pending]);

  return { pending, busy, error, start, retry: () => pending && attempt(pending), discard };
}

export function SendStatus({ sender }: { sender: ReturnType<typeof useSender> }) {
  if (sender.busy) {
    return (
      <p className="flex items-center gap-2 text-sm text-text-secondary" role="status">
        <Loader2 className="h-4 w-4 animate-spin" /> Sending and reading. This can take up to a minute.
      </p>
    );
  }
  if (!sender.error) return null;
  return (
    <div className="space-y-2">
      <ErrorBanner>{sender.error}</ErrorBanner>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void sender.retry()}>
          <RefreshCw className="h-4 w-4" /> Send again
        </Button>
        <Button type="button" variant="outline" onClick={() => void sender.discard()}>
          <Trash2 className="h-4 w-4" /> Discard
        </Button>
      </div>
    </div>
  );
}
